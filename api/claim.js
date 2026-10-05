// GET /api/claim?session_id=...  →  { token, exp, days }   (only if Stripe says the session is paid)
// If the user is logged in (Authorization: Bearer <idToken>), the pass is saved to Firestore.
// Also returns a legacy signed token for backward compatibility.
// Same session → same answer, so reloading the success page never adds extra days.
'use strict';
const { DAY, PLANS, isMock, send, sign, stripe, secret, rateLimited } = require('./_pay');
const { verifyAuth, getUserPass, setUserPass } = require('./_firebase');

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

  // --- Determine which user to credit ---
  // Priority: Firebase Auth header > UID from Stripe metadata
  const authUser = await verifyAuth(req);
  const uid = (authUser && authUser.uid) || stripeUid;

  // For Firebase users: check current Firestore pass (may be newer than Stripe metadata)
  if (uid) {
    const existing = await getUserPass(uid);
    if (existing && existing.exp > prevExp) prevExp = existing.exp;
  }

  const exp = Math.max(created, prevExp) + plan.days * DAY;

  // Save to Firestore if we know who the user is
  if (uid) {
    try {
      await setUserPass(uid, { exp, plan: plan.id, sid: id });
    } catch (e) {
      // Don't fail the claim if Firestore write fails; the token still works
      console.error('[claim] Firestore write failed:', e.message);
    }
  }

  // Always return a legacy signed token too (for offline/migration use)
  const token = secret() ? sign({ exp, sid: id, plan: plan.id }) : '';
  return send(res, 200, { token, exp, days: plan.days });
};
