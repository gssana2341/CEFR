// GET /api/plans → the price list + whether selling is switched on (so the pricing page never hard-codes prices)
'use strict';
const { PLANS, isMock, send } = require('./_pay');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { error: 'method_not_allowed' });
  const ready = isMock() || Boolean(process.env.STRIPE_SECRET_KEY && process.env.PASS_SECRET);
  return send(res, 200, { ready, mock: isMock(), plans: PLANS });
};
