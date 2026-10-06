// Slows down and catches somebody copying the whole library (files starting with "_" are not endpoints).
//
//   seenToday(ident, 'lesson', lessonId, 15)   how many DIFFERENT lessons one account / address has opened today (reopening costs nothing)
//   → { ok: false } past the cap; the caller answers 429 and calls strike(uid)
//   strike(uid)                                an account that hits a cap on 3 different days gets users/{uid}.contentBlocked = true
//
// A blocked account keeps its free content but is refused everything that needs a membership (403 account_blocked) until
// somebody clears the flag by hand (Firestore → users → that uid → delete contentBlocked). That is on purpose: an automatic
// ban of a paying customer should be undone by a person, not by a timer.
'use strict';

const crypto = require('node:crypto');
const { db } = require('./_firebase');

const day = () => new Date().toISOString().slice(0, 10);
const hash = (s) => crypto.createHash('sha256').update(s).digest('base64url');
const STRIKE_DAYS = 3;

async function seenToday(ident, kind, key, cap) {
  const ref = db.collection('seen').doc(hash(kind + '|' + ident + '|' + day()));
  try {
    return await db.runTransaction(async (t) => {
      const snap = await t.get(ref);
      const keys = snap.exists && Array.isArray(snap.data().keys) ? snap.data().keys : [];
      if (keys.includes(key)) return { ok: true, count: keys.length };
      if (keys.length >= cap) return { ok: false, count: keys.length };
      keys.push(key);
      t.set(ref, { keys, kind, day: day(), expireAt: new Date(Date.now() + 2 * 86_400_000) });
      return { ok: true, count: keys.length };
    });
  } catch (e) {
    console.error('[abuse] counter unavailable, not limiting:', e.message);
    return { ok: true, count: 0 };
  }
}

// → true when this strike was the one that blocked the account
async function strike(uid) {
  if (!uid) return false;
  try {
    const ref = db.collection('abuse').doc(hash('uid|' + uid));
    const blocked = await db.runTransaction(async (t) => {
      const snap = await t.get(ref);
      const days = snap.exists && Array.isArray(snap.data().days) ? snap.data().days : [];
      if (!days.includes(day())) days.push(day());
      t.set(ref, { uid, days: days.slice(-10), updatedAt: Date.now() });
      return days.length >= STRIKE_DAYS;
    });
    if (blocked) {
      await db.collection('users').doc(uid).set({ contentBlocked: true, blockedAt: Date.now() }, { merge: true });
      console.error('[abuse] account blocked from members-only content:', uid);
    }
    return blocked;
  } catch (e) {
    console.error('[abuse] strike failed:', e.message);
    return false;
  }
}

module.exports = { seenToday, strike, STRIKE_DAYS };
