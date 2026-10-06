// POST /api/checkout  { plan: 'd7' }  →  { url }  (send the browser there to pay)
// Requires Firebase Auth: Authorization: Bearer <idToken>
// Also supports legacy: { plan, token? } without Firebase Auth (backward compat)
'use strict';
const { PLANS, isMock, send, readJson, verify, stripe, siteUrl, rateLimited } = require('./_pay');
const { verifyAuth, getUserPass } = require('./_firebase');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'method_not_allowed' });
  if (rateLimited(req, 'checkout', 10)) return send(res, 429, { error: 'rate_limited' });

  const body = await readJson(req);
  const plan = PLANS.find((p) => p.id === body.plan);
  if (!plan) return send(res, 400, { error: 'bad_plan' });

  // --- Identify the user (Firebase Auth or legacy token) ---
  let uid = null;
  let prevExp = 0;

  const authUser = await verifyAuth(req);
  if (authUser) {
    uid = authUser.uid;
    // check existing pass in Firestore
    const existing = await getUserPass(uid);
    if (existing && existing.exp > Date.now()) prevExp = existing.exp;
  } else {
    // legacy: signed token in the request body
    const current = verify(body.token);
    prevExp = current && current.exp > Date.now() ? current.exp : 0;
  }

  const origin = siteUrl(req);

  if (isMock()) {
    const id = `mock_${plan.id}_${prevExp}_${uid || 'anon'}`;
    return send(res, 200, { url: `${origin}/pricing?session_id=${id}`, id });
  }

  if (!process.env.STRIPE_SECRET_KEY) return send(res, 503, { error: 'not_configured' });

  try {
    const metadata = {
      'metadata[plan]': plan.id,
      'metadata[prev_exp]': String(prevExp),
    };
    // store UID so /api/claim can save the pass to the right Firestore doc
    if (uid) metadata['metadata[uid]'] = uid;

    const session = await stripe('checkout/sessions', {
      mode: 'payment',
      'line_items[0][quantity]': '1',
      'line_items[0][price_data][currency]': 'thb',
      'line_items[0][price_data][unit_amount]': String(plan.baht * 100),
      'line_items[0][price_data][product_data][name]': `CEFR Quiz สมาชิก ${plan.days} วัน`,
      success_url: origin + '/pricing?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: origin + '/pricing',
      ...metadata,
    });
    return send(res, 200, { url: session.url, id: session.id });
  } catch (e) {
    console.error('[checkout] stripe failed:', e.message);   // the reason stays in the server log, not in the response
    return send(res, 502, { error: 'payment_provider_error' });
  }
};
