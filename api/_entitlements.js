// What a signed-in account may see - decided HERE, on the server (files starting with "_" are not endpoints).
//
// public/assets/data/billing.js only drives the buttons and labels in the page; it can be edited in DevTools.
// This file is what actually decides whether /api/content and /api/quiz hand out a lesson, a question set or a
// sentence mark-up. scripts/test-entitlements.mjs checks that the two files agree.
//
// Feature names (same as the browser uses):  'exam' · 'markup' · 'toeic' · 'practice:<set>' · 'lesson:<A1|A2|B1|B2>'
'use strict';

const crypto = require('node:crypto');
const { clientIp } = require('./_pay');
const { verifyAuth, getUserPass, db } = require('./_firebase');

const BILLING_ENABLED = true;                       // false = everything free (same switch as billing.js "enabled")
const PREMIUM = {
  exam: true,
  toeic: true,                                      // the TOEIC book sets (/api/toeic)
  markup: true,
  markupFreePerDay: 3,                              // distinct questions per day a non-member may see mark-up for
  practice: ['conversations', 'cloze', 'extra'],    // Grammar is free
  lessonLevels: ['A2', 'B1', 'B2'],                 // A1 lessons are free
};

// ---------- closed beta of the TOEIC book sets ----------
// TOEIC_ALLOWED_EMAILS (a server environment variable, so no address is in the public repository):
//   unset / empty   nobody (the sets are not open yet)      "a@x.com, b@y.com"   only these accounts, no membership needed
//   "*"             everybody the normal membership rule lets in
// The account must be signed in with a verified address. On a developer machine reading from a folder (TOEIC_DIR) the normal rule applies.
// → { rule: 'members' } | { rule: 'invited' } | { status, error }
function toeicGate(ctx) {
  if (process.env.TOEIC_DIR && !process.env.VERCEL && !process.env.VERCEL_ENV) return { rule: 'members' };
  const raw = String(process.env.TOEIC_ALLOWED_EMAILS || '').trim();
  if (raw === '*') return { rule: 'members' };
  const list = raw.split(/[\s,;]+/).map((x) => x.toLowerCase()).filter(Boolean);
  if (!list.length) return { status: 403, error: 'not_open' };
  if (!ctx.user) return { status: 401, error: 'login_required' };
  const email = String(ctx.user.email || '').toLowerCase();
  if (!email || !ctx.user.verified || !list.includes(email)) return { status: 403, error: 'not_invited' };
  if (ctx.blocked) return { status: 403, error: 'account_blocked' };
  return { rule: 'invited' };
}

// does this feature need a membership?
function members(feature) {
  if (!BILLING_ENABLED) return false;
  const f = String(feature);
  if (f.startsWith('practice:')) return PREMIUM.practice.includes(f.slice(9));
  if (f.startsWith('lesson:')) return PREMIUM.lessonLevels.includes(f.slice(7));
  return f === 'exam' || f === 'markup' || f === 'toeic' ? Boolean(PREMIUM[f]) : false;
}

// → { user: {uid,email}|null, active: boolean, blocked: boolean, ident: string }
// `ident` names the caller for counters: the account when signed in, otherwise the address (hashed, never used as a path as is).
async function who(req) {
  const user = await verifyAuth(req);
  let active = false;
  let blocked = false;
  if (user) {
    const pass = await getUserPass(user.uid);
    active = Boolean(pass && pass.exp > Date.now());
    blocked = Boolean(pass && pass.contentBlocked);        // set by _abuse.js after repeated bulk-copying; cleared by hand
  }
  return { user, active, blocked, ident: user ? 'u:' + user.uid : 'ip:' + clientIp(req) };
}

// → null when allowed, otherwise { status, error } to send back
function deny(ctx, feature) {
  if (feature === 'toeic') {
    const g = toeicGate(ctx);
    if (g.status) return { status: g.status, error: g.error, feature };
    if (g.rule === 'invited') return null;
  }
  if (!members(feature)) return null;
  if (ctx.blocked) return { status: 403, error: 'account_blocked', feature };
  if (ctx.active) return null;
  return ctx.user ? { status: 402, error: 'members_only', feature } : { status: 401, error: 'login_required', feature };
}

const day = () => new Date().toISOString().slice(0, 10);
const hash = (s) => crypto.createHash('sha256').update(s).digest('base64url');

// The sentence mark-up of one question. Members always get it; everybody else gets a few free looks per day
// (the same question again costs nothing). → the annotation, { locked: true } when today's free looks are used up, or null.
async function clueFor(ctx, ann, bank, key) {
  if (!ann) return null;
  if (!members('markup') || ctx.active) return ann;
  const limit = PREMIUM.markupFreePerDay;
  const id = hash('trial|' + ctx.ident + '|' + day());
  const k = bank + ':' + key;
  try {
    const ref = db.collection('trial').doc(id);
    const left = await db.runTransaction(async (t) => {
      const snap = await t.get(ref);
      const keys = snap.exists && Array.isArray(snap.data().keys) ? snap.data().keys : [];
      if (keys.includes(k)) return limit - keys.length;
      if (keys.length >= limit) return -1;
      keys.push(k);
      t.set(ref, { keys, day: day(), expireAt: new Date(Date.now() + 2 * 86_400_000) });
      return limit - keys.length;
    });
    return left < 0 ? { locked: true } : { ...ann, trialLeft: left };
  } catch (e) {
    console.error('[entitlements] trial store unavailable:', e.message);
    return { locked: true };                         // fail closed: no free mark-up while the counter is down
  }
}

module.exports = { BILLING_ENABLED, PREMIUM, members, who, deny, clueFor, toeicGate };
