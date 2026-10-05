// POST /api/migrate  { token: '<legacy pass>' }   +  Authorization: Bearer <idToken>
// Migrates a legacy signed-token pass into the user's Firestore record.
// If the legacy pass has a later expiry than the Firestore pass, it wins.
'use strict';
const { send, verify, readJson, rateLimited } = require('./_pay');
const { verifyAuth, getUserPass, setUserPass } = require('./_firebase');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'method_not_allowed' });
  if (rateLimited(req, 'migrate', 10)) return send(res, 429, { error: 'rate_limited' });

  // Must be logged in
  const authUser = await verifyAuth(req);
  if (!authUser) return send(res, 401, { error: 'not_authenticated' });

  const body = await readJson(req);
  const legacy = verify(body.token);
  if (!legacy || !legacy.exp) return send(res, 400, { error: 'invalid_token' });

  // Get current Firestore pass
  const current = await getUserPass(authUser.uid);
  const currentExp = (current && current.exp) || 0;

  // Take the later expiry
  const exp = Math.max(legacy.exp, currentExp);

  try {
    await setUserPass(authUser.uid, {
      exp,
      plan: legacy.plan || (current && current.plan) || null,
      sid: legacy.sid || (current && current.sid) || null,
    });
  } catch (e) {
    console.error('Migration failed to write to Firestore:', e);
    return send(res, 502, { error: 'database_error' });
  }

  return send(res, 200, { migrated: true, exp, valid: exp > Date.now() });
};
