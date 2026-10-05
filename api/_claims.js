// One paid Checkout session may be credited ONCE, to ONE account (files starting with "_" are not endpoints).
//
// Without this, calling /api/claim again with the same session id would add the plan's days again every time,
// and a session id seen by someone else could be redeemed by any number of accounts.
//
// Firestore layout:
//   users/{uid}    { exp, plan, sid }          the account's membership (written only by the server)
//   claims/{sid}   { uid, exp, plan }          which account redeemed this payment (or migrated this old pass)
//
// `db` is a Firestore (or anything with collection().doc(), runTransaction(), t.get(), t.set()), so this file can
// be tested without Firebase (scripts/test-claims.mjs).
'use strict';

const num = (v) => (Number.isFinite(v) ? v : 0);

// Credit a paid session to `uid`. → { exp, already }.  Throws Error('claimed_by_other') if another account has it.
// created: when the session was created (ms) · prevExp: expiry stored in the session when it was made · ms: plan length
async function redeemWith(db, stamp, uid, sid, { created, prevExp, ms, plan }) {
  return db.runTransaction(async (t) => {
    const claimRef = db.collection('claims').doc(sid);
    const userRef = db.collection('users').doc(uid);
    const claim = await t.get(claimRef);
    const user = await t.get(userRef);
    const current = user.exists ? num(user.data().exp) : 0;

    if (claim.exists) {
      const c = claim.data();
      if (c.uid !== uid) throw new Error('claimed_by_other');
      return { exp: Math.max(current, num(c.exp)), already: true };      // same account asking again: no extra days
    }

    const exp = Math.max(num(created), num(prevExp), current) + ms;
    t.set(claimRef, { uid, exp, plan: plan || null, at: stamp });
    t.set(userRef, { exp, plan: plan || null, sid, updatedAt: stamp }, { merge: true });
    return { exp, already: false };
  });
}

// Move an old signed pass (a bearer token) into an account - once, and only if no other account has it.
async function migrateWith(db, stamp, uid, legacy) {
  if (!legacy || typeof legacy.sid !== 'string' || !Number.isFinite(legacy.exp)) throw new Error('invalid_token');
  return db.runTransaction(async (t) => {
    const claimRef = db.collection('claims').doc(legacy.sid);
    const userRef = db.collection('users').doc(uid);
    const claim = await t.get(claimRef);
    const user = await t.get(userRef);
    const current = user.exists ? num(user.data().exp) : 0;

    if (claim.exists && claim.data().uid !== uid) throw new Error('claimed_by_other');
    const exp = Math.max(current, legacy.exp);
    if (!claim.exists) t.set(claimRef, { uid, exp: legacy.exp, plan: legacy.plan || null, at: stamp, migrated: true });
    t.set(userRef, { exp, plan: legacy.plan || null, sid: legacy.sid, updatedAt: stamp }, { merge: true });
    return { exp };
  });
}

module.exports = { redeemWith, migrateWith };
