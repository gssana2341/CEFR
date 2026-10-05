// GET /api/claim?session_id=...  →  { token, exp, days }   (only if Stripe says the session is paid)
// If the user is logged in (Authorization: Bearer <idToken>), the pass is saved to Firestore.
// Also returns a legacy signed token for backward compatibility.
// Same session → same answer, so reloading the success page never adds extra days.
'use strict';
const { DAY, PLANS, isMock, send, sign, stripe, secret, rateLimited } = require('./_pay');
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
  // A session made while logged in belongs to that account whoever asks (so a leaked session id is useless to others);
  // a session made without logging in goes to whoever claims it first while logged in.
  const authUser = await verifyAuth(req);
  const uid = stripeUid || (authUser && authUser.uid) || null;

  let exp = Math.max(created, prevExp) + plan.days * DAY;     // no account: the same answer every time
  if (uid) {
    try {
      // once per payment: asking again returns the same expiry instead of adding days again
      exp = (await redeemSession(uid, id, { created, prevExp, ms: plan.days * DAY, plan: plan.id })).exp;
    } catch (e) {
      if (e.message === 'claimed_by_other') return send(res, 409, { error: 'already_claimed' });
      console.error('[claim] Firestore failed, answering without saving:', e.message);   // database down / not set up
    }
  }

  // Always return a legacy signed token too (for offline/migration use)
  const token = secret() ? sign({ exp, sid: id, plan: plan.id }) : '';
  return send(res, 200, { token, exp, days: plan.days });
};
