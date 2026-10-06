// GET /api/claim?session_id=...  →  { exp, days }   (only if Stripe says the session is paid)
// The days are saved to the Firestore account the session was created for (users/{uid}); nothing that can be copied
// to someone else is returned. Same session → same answer, so reloading the success page never adds extra days.
'use strict';
const { DAY, PLANS, isMock, send, stripe, rateLimited } = require('./_pay');
const { verifyAuth, redeemSession } = require('./_firebase');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') return send(res, 405, { error: 'method_not_allowed' });
  if (rateLimited(req, 'claim', 20)) return send(res, 429, { error: 'rate_limited' });
  const id = String((req.query && req.query.session_id) || '');
  if (!/^[A-Za-z0-9_]{6,200}$/.test(id)) return send(res, 400, { error: 'bad_session' });

  let planId;
  let prevExp = 0;
  let created = Date.now();
  let stripeUid = null;   // UID stored in Stripe metadata during checkout

  if (isMock() && id.startsWith('mock_')) {
    const parts = id.split('_');
    planId = parts[1];
    prevExp = Number(parts[2]) || 0;
    stripeUid = parts[3] !== 'anon' ? parts[3] : null;
  } else {
    if (!process.env.STRIPE_SECRET_KEY) return send(res, 503, { error: 'not_configured' });
    try {
      const s = await stripe('checkout/sessions/' + encodeURIComponent(id));
      if (s.payment_status !== 'paid') return send(res, 402, { error: 'not_paid' });
      // defense in depth: what was really charged must be what the plan costs (the plan id only comes from our own metadata)
      const p = PLANS.find((x) => x.id === (s.metadata && s.metadata.plan));
      if (!p || s.mode !== 'payment' || s.currency !== 'thb' || s.amount_total !== p.baht * 100) {
        console.error('[claim] session does not match its plan:', id, s.mode, s.currency, s.amount_total);
        return send(res, 400, { error: 'bad_session' });
      }
      planId = s.metadata && s.metadata.plan;
      prevExp = Number(s.metadata && s.metadata.prev_exp) || 0;
      stripeUid = (s.metadata && s.metadata.uid) || null;
      created = s.created * 1000;
    } catch (e) {
      return send(res, 502, { error: 'payment_provider_error' });
    }
  }

  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) return send(res, 400, { error: 'bad_plan' });

  // --- Which account gets the days? ---
  // Checkout needs a login, so every session names its account (a leaked session id is useless to anybody else).
  // A session that somehow has none (made before that rule) goes to whoever claims it first while signed in.
  const stripeAccount = stripeUid;
  const uid = stripeAccount || ((await verifyAuth(req, { checkRevoked: true })) || {}).uid || null;
  if (!uid) return send(res, 401, { error: 'login_required' });

  let exp;
  try {
    // once per payment: asking again returns the same expiry instead of adding days again
    exp = (await redeemSession(uid, id, { created, prevExp, ms: plan.days * DAY, plan: plan.id })).exp;
  } catch (e) {
    if (e.message === 'claimed_by_other') return send(res, 409, { error: 'already_claimed' });
    console.error('[claim] Firestore failed:', e.message);
    return send(res, 502, { error: 'database_error' });      // the learner has paid: say so, they can retry (same answer every time)
  }
  return send(res, 200, { exp, days: plan.days });
};
