// An invisible per-account mark in the text that is handed out (files starting with "_" are not endpoints).
//
// Nothing stops a learner who is allowed to read a lesson from copying it. What this does is make a leak traceable: the text each
// signed-in account receives carries a 40-bit tag written in zero-width characters at the end of every longer sentence/paragraph
// (U+2060 · bits as U+200B / U+200C · U+2060). It is invisible, survives copy-and-paste into most places, and the tag is an HMAC of the
// account id with a server secret, so nobody can compute the tag of somebody else to frame them.
//
//   node scripts/trace-watermark.mjs leaked.txt        → prints the tag(s) found and, with Firestore access, the account
//
// Someone who knows about it can strip zero-width characters, so this is a deterrent and a way to catch careless sharing, not a lock.
const crypto = require('node:crypto');

const ZERO = '​';
const ONE = '‌';
const EDGE = '⁠';
const MIN_CHARS = 25;               // shorter strings (headings, table cells, choices) are left alone

function secret() {
  if (process.env.WATERMARK_SECRET) return process.env.WATERMARK_SECRET;
  if (process.env.PASS_SECRET) return 'wm|' + process.env.PASS_SECRET;
  if (process.env.FIREBASE_PRIVATE_KEY) return 'wm|' + crypto.createHash('sha256').update(process.env.FIREBASE_PRIVATE_KEY).digest('hex');
  return process.env.VERCEL ? '' : 'dev-only-watermark';     // no secret on a real deployment = no mark rather than a guessable one
}

// the 40-bit tag of an account, as a hex string (what trace-watermark.mjs prints)
function tagOf(uid) {
  const s = secret();
  if (!s || !uid) return '';
  return crypto.createHmac('sha256', s).update('uid|' + uid).digest('hex').slice(0, 10);
}

// hex tag → the invisible string
function encode(hex) {
  if (!hex) return '';
  let bits = '';
  for (const ch of hex) bits += parseInt(ch, 16).toString(2).padStart(4, '0');
  return EDGE + [...bits].map((b) => (b === '1' ? ONE : ZERO)).join('') + EDGE;
}

// every invisible tag found in a piece of text → hex strings
function decode(text) {
  const out = [];
  const re = new RegExp(EDGE + '([' + ZERO + ONE + ']{40})' + EDGE, 'g');
  for (const m of String(text).matchAll(re)) {
    const bits = [...m[1]].map((c) => (c === ONE ? '1' : '0')).join('');
    let hex = '';
    for (let i = 0; i < 40; i += 4) hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
    out.push(hex);
  }
  return out;
}

// returns a copy of `value` where every string of MIN_CHARS or more ends with the account's tag. `skip` = keys whose strings are left alone
function stamp(value, uid, skip) {
  const mark = encode(tagOf(uid));
  if (!mark) return value;
  const skipKeys = new Set(skip || ['c', 'id', 'level', 'title', 'en']);
  const walk = (v) => {
    if (typeof v === 'string') return v.length >= MIN_CHARS ? v + mark : v;
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === 'object') {
      const o = {};
      for (const [k, x] of Object.entries(v)) o[k] = skipKeys.has(k) ? x : walk(x);
      return o;
    }
    return v;
  };
  return walk(value);
}

// one string (a question, a passage) → the string with the account's tag at its end
function stampText(text, uid) {
  return typeof text === 'string' && text.length >= MIN_CHARS ? text + encode(tagOf(uid)) : text;
}

module.exports = { tagOf, encode, decode, stamp, stampText };
