// /api/sync - the signed-in learner's progress in Firestore (see _sync.js for what is stored)
//   GET                       → { data: { key: { v: '<JSON text>', t } } }
//   POST { changes: {…} }     → { applied: [keys], skipped: { key: reason } }
// Needs Authorization: Bearer <Firebase ID token>.
'use strict';
const { send, readJson, rateLimited } = require('./_pay');
const { verifyAuth, db, serverStamp } = require('./_firebase');
const { readAll, writeChanges } = require('./_sync');

// users/{uid}: who this is and when they were last here (merged, so the membership expiry in the same document stays)
async function touchProfile(user) {
  try {
    const ref = db.collection('users').doc(user.uid);
    const fields = { email: user.email || null, name: user.name || null, lastSeenAt: serverStamp() };
    if (!(await ref.get()).exists) fields.createdAt = serverStamp();
    await ref.set(fields, { merge: true });
  } catch (e) {
    console.error('[sync] profile update failed:', e.message);   // not worth failing the request for
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return send(res, 405, { error: 'method_not_allowed' });
  if (rateLimited(req, 'sync', 60)) return send(res, 429, { error: 'rate_limited' });

  const user = await verifyAuth(req);
  if (!user) return send(res, 401, { error: 'not_authenticated' });

  try {
    if (req.method === 'GET') {
      await touchProfile(user);                                  // so the learner shows up in the database after signing in
      return send(res, 200, { data: await readAll(db, user.uid) });
    }
    const body = await readJson(req);
    return send(res, 200, await writeChanges(db, serverStamp(), user.uid, body.changes));
  } catch (e) {
    if (e.message === 'too_many_keys') return send(res, 413, { error: 'too_many_keys' });
    console.error('[sync] failed:', e.message);
    return send(res, 502, { error: 'database_error' });
  }
};
