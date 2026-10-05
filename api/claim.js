// GET /api/claim?session_id=...  →  { token, exp, days }   (only if Stripe says the session is paid)
// Same session → same answer, so reloading the success page never adds extra days.
'use strict';
const { DAY, PLANS, isMock, send, sign, stripe, secret } = require('./_pay');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { error: 'method_not_allowed' });
  const id = String((req.query && req.query.session_id) || '');
  if (!/^[A-Za-z0-9_]{6,200}$/.test(id)) return send(res, 400, { error: 'bad_session' });
  if (!secret()) return send(res, 503, { error: 'not_configured' });

  let planId;
  let prevExp = 0;
  let created = Date.now();

  if (isMock() && id.startsWith('mock_')) {
    const [, p, prev] = id.split('_');
    planId = p;
    prevExp = Number(prev) || 0;
  } else {
    if (!process.env.STRIPE_SECRET_KEY) return send(res, 503, { error: 'not_configured' });
    try {
      const s = await stripe('checkout/sessions/' + encodeURIComponent(id));
      if (s.payment_status !== 'paid') return send(res, 402, { error: 'not_paid' });
      planId = s.metadata && s.metadata.plan;
      prevExp = Number(s.metadata && s.metadata.prev_exp) || 0;
      created = s.created * 1000;
    } catch (e) {
      return send(res, 502, { error: 'payment_provider_error' });
    }
  }

  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) return send(res, 400, { error: 'bad_plan' });

  const exp = Math.max(created, prevExp) + plan.days * DAY;
  return send(res, 200, { token: sign({ exp, sid: id, plan: plan.id }), exp, days: plan.days });
};
