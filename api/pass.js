// GET /api/pass?token=...  →  { valid, exp }   (pages call this to know if the membership is still running)
'use strict';
const { send, verify, secret } = require('./_pay');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { error: 'method_not_allowed' });
  if (!secret()) return send(res, 503, { error: 'not_configured' });
  const p = verify(String((req.query && req.query.token) || ''));
  return send(res, 200, p ? { valid: p.exp > Date.now(), exp: p.exp } : { valid: false, exp: 0 });
};
