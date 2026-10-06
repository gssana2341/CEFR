// POST /api/quiz  { op, ... }  - everything that needs to know a correct answer. The answers never leave the server
// until the learner has committed to a pick (see _bank.js: the question lists sent out by /api/content have none).
//
//   op 'check'      { set, items: [{ n, pick }] }                  practice quiz → { results: { n: { a, e, clue? } } }
//   op 'cloze'      { idx, picks: [optionIndex|null, ...] }        one cloze passage → { blanks: [{ a, e }] }
//   op 'exam'       { items: [{ src, n, pick }], cloze: [{ idx, picks }] }   mock exam, graded on submit (members)
//   op 'placement'  { sid?, step?, pick? }                         adaptive placement test (see below)
//
// Placement is kept on the server: a session document (placement/{sid}) holds the answers so far; each step can be answered
// exactly once, so a client can not "try" another pick on the same question to see which one the next question rewards.
'use strict';
const crypto = require('node:crypto');
const { send, readJson, rateLimited } = require('./_pay');
const { limited } = require('./_ratelimit');
const { who, deny, clueFor } = require('./_entitlements');
const { db } = require('./_firebase');
const bank = require('./_bank');
const { stampText } = require('./_watermark');

// explanations carry the signed-in reader's invisible tag too (see _watermark.js)
const tagged = (ctx, text) => (ctx.user ? stampText(text, ctx.user.uid) : text);

const MAX_CHECK_ITEMS = 10;       // one practice answer at a time in practice; a few at once when a saved round is reopened
const MAX_EXAM_ITEMS = 120;
const MAX_EXAM_CLOZE = 5;
const DAY = 86_400_000;

const isInt = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;

// ---------- practice quiz ----------
async function opCheck(ctx, body) {
  const set = typeof body.set === 'string' ? body.set : '';
  if (!bank.isMcq(set)) return { status: 400, body: { error: 'bad_set' } };
  const refused = deny(ctx, 'practice:' + set);
  if (refused) return { status: refused.status, body: { error: refused.error, feature: refused.feature } };
  const items = body.items;
  if (!Array.isArray(items) || items.length < 1 || items.length > MAX_CHECK_ITEMS) return { status: 400, body: { error: 'bad_items' } };

  const results = {};
  for (const it of items) {
    const q = it && bank.question(set, it.n);
    if (!q || !isInt(it.pick, 0, q.c.length - 1)) return { status: 400, body: { error: 'bad_items' } };
    results[it.n] = { a: q.a, e: tagged(ctx, q.e), clue: await clueFor(ctx, bank.clues(set)[it.n], set, it.n) };
  }
  return { status: 200, body: { results }, cost: items.length };
}

// the right answers of one cloze passage, for the picks the learner made (picks are original option indices)
function gradeCloze(p, picks) {
  return p.blanks.map((b, i) => ({ a: b.a, e: b.e, pick: picks[i] }));
}
const validClozePicks = (p, picks) => Array.isArray(picks) && picks.length === p.blanks.length
  && picks.every((v, i) => v === null || isInt(v, 0, p.blanks[i].c.length - 1));

async function opCloze(ctx, body) {
  const refused = deny(ctx, 'practice:cloze');
  if (refused) return { status: refused.status, body: { error: refused.error, feature: refused.feature } };
  const p = isInt(body.idx, 0, 1000) ? bank.bank('cloze')[body.idx] : null;
  if (!p || !validClozePicks(p, body.picks) || body.picks.some((v) => v === null)) return { status: 400, body: { error: 'bad_items' } };
  return { status: 200, body: { blanks: gradeCloze(p, body.picks).map(({ a, e }) => ({ a, e: tagged(ctx, e) })) }, cost: p.blanks.length };
}

// ---------- mock exam ----------
async function opExam(ctx, body) {
  const refused = deny(ctx, 'exam');
  if (refused) return { status: refused.status, body: { error: refused.error, feature: refused.feature } };
  const items = Array.isArray(body.items) ? body.items : [];
  const cloze = Array.isArray(body.cloze) ? body.cloze : [];
  if (items.length > MAX_EXAM_ITEMS || cloze.length > MAX_EXAM_CLOZE || (!items.length && !cloze.length)) return { status: 400, body: { error: 'bad_items' } };

  const results = {};
  for (const it of items) {
    const src = it && it.src;
    const q = bank.isMcq(src) ? bank.question(src, it.n) : null;
    // an unanswered question has no pick: it is graded as skipped but still shown in the review
    if (!q || !(it.pick === null || isInt(it.pick, 0, q.c.length - 1))) return { status: 400, body: { error: 'bad_items' } };
    results[src + ':' + it.n] = { a: q.a, e: tagged(ctx, q.e), clue: await clueFor(ctx, bank.clues(src)[it.n], src, it.n) };
  }
  const passages = {};
  for (const c of cloze) {
    const p = c && isInt(c.idx, 0, 1000) ? bank.bank('cloze')[c.idx] : null;
    if (!p || !validClozePicks(p, c.picks)) return { status: 400, body: { error: 'bad_items' } };
    passages[c.idx] = p.blanks.map((b) => ({ a: b.a, e: tagged(ctx, b.e) }));
  }
  return { status: 200, body: { results, cloze: passages }, cost: items.length + cloze.length * 5 };
}

// ---------- adaptive placement ----------
let catApi = null;
function cat() {
  if (!catApi) {
    const engine = require('./_cat').create(bank.data());
    const pool = engine.buildPool();
    catApi = { engine, pool, byKey: new Map(pool.map((it) => [it.key, it])) };
  }
  return catApi;
}

const publicItem = (it) => ({ key: it.key, q: it.q.q, c: it.q.c });
const answeredList = (answers) => answers.map((a) => { const it = cat().byKey.get(a.key); return { it, right: a.pick === it.q.a }; });

function nextKey(answers) {
  const { engine, pool } = cat();
  const est = engine.estimate(answeredList(answers));
  if (engine.stop(answers.length, est)) return null;
  const it = engine.pick(est.theta, pool, new Set(answers.map((a) => a.key)), Math.random);
  return it ? it.key : null;
}

async function placementResult(ctx, answers) {
  const { engine, byKey } = cat();
  const list = answeredList(answers);
  const est = engine.estimate(list);
  const byLevel = {};
  for (const lv of engine.LEVELS) {
    const mine = list.filter((a) => a.it.level === lv);
    byLevel[lv] = { right: mine.filter((a) => a.right).length, total: mine.length };
  }
  const probs = engine.levelProbs(est.post);
  const idx = engine.levelIndex(est.theta);
  const near = [];
  if (idx > 1 && probs[idx - 1] >= 0.25) near.push(engine.NAMES[idx - 1]);
  if (idx < engine.NAMES.length - 1 && probs[idx + 1] >= 0.25) near.push(engine.NAMES[idx + 1]);

  const review = [];
  for (const a of answers) {
    const it = byKey.get(a.key);
    if (a.pick === it.q.a) continue;
    review.push({
      level: it.level, q: it.q.q, c: it.q.c, pick: a.pick, a: it.q.a, e: tagged(ctx, it.q.e),
      bank: it.src, key: it.id, clue: await clueFor(ctx, bank.clues(it.src)[it.id], it.src, it.id),
    });
  }
  return {
    level: engine.levelOf(est.theta), theta: est.theta, se: est.se, score: engine.scoreOf(est.theta), n: list.length,
    byLevel, near, review,
  };
}

const sidOk = (s) => typeof s === 'string' && /^[A-Za-z0-9_-]{16,40}$/.test(s);

async function opPlacement(ctx, body, req) {
  const { byKey } = cat();
  const max = bank.catConfig().maxItems;

  // start a new test
  if (body.sid === undefined) {
    if (await limited(req, 'pt-start', 30, { uid: ctx.user && ctx.user.uid, windowMs: 3_600_000 })) return { status: 429, body: { error: 'rate_limited' } };
    const first = nextKey([]);
    const sid = crypto.randomBytes(16).toString('base64url');
    await db.collection('placement').doc(sid).set({
      answers: [], cur: first, step: 0, done: false, createdAt: Date.now(), expireAt: new Date(Date.now() + 3 * DAY),
    });
    return { status: 200, body: { sid, step: 0, n: 1, max, question: publicItem(byKey.get(first)) } };
  }
  if (!sidOk(body.sid)) return { status: 400, body: { error: 'bad_session' } };

  const ref = db.collection('placement').doc(body.sid);
  // read the session; with a pick, record it - all in one transaction so a step can only be answered once
  const out = await db.runTransaction(async (t) => {
    const snap = await t.get(ref);
    if (!snap.exists) return { status: 404, body: { error: 'no_session' } };
    const s = snap.data();
    if (s.done) return { done: true, answers: s.answers };
    const resume = body.pick === undefined;
    if (!resume) {
      if (body.step !== s.step) return { stale: true, s };                       // already answered / out of order
      const it = byKey.get(s.cur);
      if (!isInt(body.pick, 0, it.q.c.length - 1)) return { status: 400, body: { error: 'bad_pick' } };
      const answers = [...s.answers, { key: s.cur, pick: body.pick }];
      const cur = nextKey(answers);
      const next = { answers, cur, step: s.step + 1, done: cur === null, createdAt: s.createdAt, expireAt: s.expireAt };
      t.set(ref, next);
      return cur === null ? { done: true, answers } : { s: next };
    }
    return { s };
  });

  if (out.status) return { status: out.status, body: out.body };
  if (out.done) return { status: 200, body: { done: true, result: await placementResult(ctx, out.answers) } };
  const s = out.s;
  return {
    status: 200,
    body: { sid: body.sid, step: s.step, n: s.answers.length + 1, max, question: publicItem(byKey.get(s.cur)), ...(out.stale ? { stale: true } : {}) },
    cost: 1,
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'method_not_allowed' });
  if (rateLimited(req, 'quiz', 240)) return send(res, 429, { error: 'rate_limited' });

  const body = await readJson(req);
  const op = typeof body.op === 'string' ? body.op : '';
  if (!['check', 'cloze', 'exam', 'placement'].includes(op)) return send(res, 400, { error: 'bad_op' });

  const ctx = await who(req);
  const uid = ctx.user && ctx.user.uid;
  if (await limited(req, 'quiz', 120, { uid })) return send(res, 429, { error: 'rate_limited' });

  let r;
  try {
    r = op === 'check' ? await opCheck(ctx, body)
      : op === 'cloze' ? await opCloze(ctx, body)
        : op === 'exam' ? await opExam(ctx, body)
          : await opPlacement(ctx, body, req);
  } catch (e) {
    console.error('[quiz] ' + op + ' failed:', e.message);
    return send(res, 502, { error: 'server_error' });
  }
  // a day's worth of answers per account / address (every checked answer counts, so bulk collecting is slow)
  if (r.status === 200 && r.cost && await limited(req, 'quiz-day', 1500, { uid, windowMs: DAY, cost: r.cost })) return send(res, 429, { error: 'rate_limited' });
  return send(res, r.status, r.body);
};
