// GET /api/pass  →  { valid, exp }
//
// Two modes:
//   1. Firebase Auth: Authorization: Bearer <idToken>  →  reads pass from Firestore
//   2. Legacy: ?token=<signed-token>  →  verifies HMAC signature (backward compat)
'use strict';
const { send, verify, secret, rateLimited } = require('./_pay');
const { verifyAuth, getUserPass } = require('./_firebase');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { error: 'method_not_allowed' });
  if (rateLimited(req, 'pass', 60)) return send(res, 429, { error: 'rate_limited' });

  // --- Try Firebase Auth first ---
  const authUser = await verifyAuth(req);
  if (authUser) {
    const pass = await getUserPass(authUser.uid);
    if (pass && pass.exp > Date.now()) {
      return send(res, 200, { valid: true, exp: pass.exp });
    }
    return send(res, 200, { valid: false, exp: pass ? pass.exp : 0 });
  }

  // --- Fallback: legacy signed token ---
  if (!secret()) return send(res, 200, { valid: false, exp: 0 });
  const p = verify(String((req.query && req.query.token) || ''));
  return send(res, 200, p ? { valid: p.exp > Date.now(), exp: p.exp } : { valid: false, exp: 0 });
};
