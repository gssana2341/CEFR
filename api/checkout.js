// POST /api/checkout  { plan: 'd7', token?: '<current pass>' }  →  { url }  (send the browser there to pay)
'use strict';
const { PLANS, isMock, send, readJson, verify, stripe, siteUrl } = require('./_pay');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'method_not_allowed' });

  const body = await readJson(req);
  const plan = PLANS.find((p) => p.id === body.plan);
  if (!plan) return send(res, 400, { error: 'bad_plan' });

  // buying again while a pass is still running → the new days are added after it
  const current = verify(body.token);
  const prevExp = current && current.exp > Date.now() ? current.exp : 0;
  const origin = siteUrl(req);

  if (isMock()) return send(res, 200, { url: `${origin}/pricing?session_id=mock_${plan.id}_${prevExp}` });

  if (!process.env.STRIPE_SECRET_KEY || !process.env.PASS_SECRET) return send(res, 503, { error: 'not_configured' });

  try {
    const session = await stripe('checkout/sessions', {
      mode: 'payment',
      'payment_method_types[0]': 'promptpay',
      'payment_method_types[1]': 'card',
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': 'thb',
      'line_items[0][price_data][unit_amount]': String(plan.baht * 100),
      'line_items[0][price_data][product_data][name]': `CEFR Quiz สมาชิก ${plan.days} วัน`,
      success_url: origin + '/pricing?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: origin + '/pricing',
      'metadata[plan]': plan.id,
      'metadata[prev_exp]': String(prevExp),
    });
    return send(res, 200, { url: session.url });
  } catch (e) {
    return send(res, 502, { error: 'payment_provider_error', detail: String(e.message).slice(0, 200) });
  }
};
