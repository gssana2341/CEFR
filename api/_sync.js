// Cloud copy of a learner's progress (files starting with "_" are not endpoints).
//
// The browser keeps progress in localStorage; when the learner is signed in the same data is mirrored to Firestore so it
// follows them to another phone or computer and shows up in the database:
//   users/{uid}/data/{key}   { v: '<JSON text>', t: <ms the browser changed it> }
//
// Only the server (Admin SDK) reads and writes these documents - the browser never talks to Firestore directly.
// `db` is a Firestore (or anything with collection().doc(), collection().get(), doc.get(), doc.set()), so this file can
// be tested without Firebase (scripts/test-sync.mjs).
'use strict';

const MAX_KEYS_PER_REQUEST = 40;
const MAX_VALUE_CHARS = 200_000;      // one key; a Firestore document may hold 1 MiB
const MAX_KEYS_PER_USER = 80;

// What may be stored. Everything else (translation cache, theme, membership token ...) stays on the device.
const ALLOWED = [
  /^(grammar|conversations|extra|cloze):(state|wrong|stats|count|best|order)$/,
  /^placement:(state|last|history)$/,
  /^exam:history$/,
  /^learn:progress$/,
];
const isSyncKey = (key) => typeof key === 'string' && key.length <= 40 && ALLOWED.some((re) => re.test(key));

// Document ids cannot contain "/" and should not look odd: "grammar:wrong" → "grammar~wrong"
const docId = (key) => key.replace(/:/g, '~');
const keyOf = (id) => id.replace(/~/g, ':');

// Every stored key of one user → { key: { v, t } }
async function readAll(db, uid) {
  const snap = await db.collection('users').doc(uid).collection('data').get();
  const out = {};
  snap.forEach((doc) => {
    const d = doc.data();
    const key = keyOf(doc.id);
    // v === null is a tombstone: "deleted at time t" (so an old device cannot bring the value back)
    if (isSyncKey(key) && (typeof d.v === 'string' || d.v === null) && Number.isFinite(d.t)) out[key] = { v: d.v, t: d.t };
  });
  return out;
}

// changes: { key: { v: '<JSON text>' | null, t: ms } }. The newer timestamp wins. v = null means "removed" (kept as a marker).
// → { applied: [keys], skipped: { key: reason } }
async function writeChanges(db, stamp, uid, changes) {
  const applied = [];
  const skipped = {};
  const entries = Object.entries(changes || {});
  if (entries.length > MAX_KEYS_PER_REQUEST) throw new Error('too_many_keys');

  const col = db.collection('users').doc(uid).collection('data');
  for (const [key, c] of entries) {
    if (!isSyncKey(key)) { skipped[key] = 'not_allowed'; continue; }
    if (!c || !Number.isFinite(c.t)) { skipped[key] = 'bad_time'; continue; }
    if (c.v !== null && (typeof c.v !== 'string' || c.v.length > MAX_VALUE_CHARS)) { skipped[key] = 'bad_value'; continue; }
    if (c.v !== null) {
      try { JSON.parse(c.v); } catch { skipped[key] = 'bad_json'; continue; }
    }
    const ref = col.doc(docId(key));
    const old = await ref.get();
    if (old.exists && Number.isFinite(old.data().t) && old.data().t >= c.t) { skipped[key] = 'older'; continue; }
    if (!old.exists && (await col.get()).size >= MAX_KEYS_PER_USER) { skipped[key] = 'too_many_keys'; continue; }
    await ref.set({ v: c.v, t: c.t, updatedAt: stamp });
    applied.push(key);
  }
  return { applied, skipped };
}

module.exports = { isSyncKey, readAll, writeChanges, docId, keyOf, MAX_KEYS_PER_REQUEST };
