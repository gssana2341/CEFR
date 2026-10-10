// GET /api/pass  →  { valid, exp }
//
// Needs Authorization: Bearer <Firebase ID token>; the pass is read from Firestore (users/{uid}).
// (The old signed-token mode, ?token=..., is gone: a token in a URL ends up in logs and browser history, and anyone
// holding it had the membership. Old tokens can still be moved into an account once through /api/migrate.)
'use strict';
const { send, rateLimited } = require('./_pay');
const { verifyAuth, getUserPass } = require('./_firebase');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { error: 'method_not_allowed' });
  if (rateLimited(req, 'pass', 60)) return send(res, 429, { error: 'rate_limited' });

  const authUser = await verifyAuth(req);
  if (!authUser) return send(res, 200, { valid: false, exp: 0 });

  // Admin check
  if (authUser.email) {
    const adminRaw = String(process.env.ADMIN_EMAILS || '').trim();
    const adminList = adminRaw.split(/[\s,;]+/).map((x) => x.toLowerCase()).filter(Boolean);
    if (adminList.includes(String(authUser.email).toLowerCase())) {
      // Admins get a valid pass that expires in the year 2099
      return send(res, 200, { valid: true, exp: 4070908800000 });
    }
  }

  const pass = await getUserPass(authUser.uid);
  if (pass && pass.exp > Date.now()) return send(res, 200, { valid: true, exp: pass.exp });
  return send(res, 200, { valid: false, exp: pass ? pass.exp : 0 });
};
