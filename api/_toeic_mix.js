// The mixed exam ("สอบสุ่มรวม"): a 200-question test drawn at random from ALL the book sets, laid out like the real one
// (Part 1: 6 · 2: 25 · 3: 39 = 13 conversations · 4: 30 = 10 talks · 5: 30 · 6: 16 = 4 texts · 7: 54).
// (files starting with "_" are not endpoints)
//
// Nothing is stored: the draw is a function of (server secret, account, the seed the browser made up, the Part), so the same request always
// gives the same questions - a refresh or the grading call after the test sees exactly what the learner saw - and nobody can predict a draw
// without the secret. The questions keep the printed question numbers of a real test (Part 1 = 1-6 ... Part 7 = 147-200), so the exam room
// and the score tables work as they do for one set; the source of each question is only known to the server.
//
// The recording of Parts 1-4 is not one stretch any more: every question / conversation / talk carries its own audio link and window
// ("at", seconds in that set's recording), which the exam room plays one after the other. The first question of each source Part is left out
// of the draw while there are enough others, because its window also holds the spoken directions of the Part.
'use strict';

const crypto = require('node:crypto');
const store = require('./_toeic_store');
const toeic = require('./_toeic');
const { stampText } = require('./_watermark');

const SLOTS = {
  1: { start: 1, count: 6 }, 2: { start: 7, count: 25 }, 3: { start: 32, count: 39 }, 4: { start: 71, count: 30 },
  5: { start: 101, count: 30 }, 6: { start: 131, count: 16 }, 7: { start: 147, count: 54 },
};

const seedOk = (s) => typeof s === 'string' && /^[A-Za-z0-9_-]{12,40}$/.test(s);

// a small seeded generator (mulberry32) whose seed comes from an HMAC, so it can not be guessed
function rng(secret, uid, seed, part) {
  const d = crypto.createHmac('sha256', secret).update('toeic-mix|' + uid + '|' + seed + '|' + part).digest();
  let a = d.readUInt32LE(0);
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle(list, rand) {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// every set of the book (in the order of index.json)
async function allSets() {
  let index;
  try { index = await store.getJson('index.json'); } catch (e) {
    if (e.code === 'not_found') return [];
    throw e;
  }
  const out = [];
  for (const s of index.sets || []) {
    const d = await toeic.loadSet(s.id);
    if (d) out.push(d);
  }
  return out;
}

// the candidates of one Part: { set, audioFile, step, items } where step is an item (Parts 1, 2, 5) or a group (Parts 3, 4, 6, 7)
function poolOf(sets, partNo) {
  const withDirections = Number(partNo) <= 4;
  const strict = [];
  const all = [];
  for (const d of sets) {
    const part = d.parts[partNo];
    if (!part) continue;
    const steps = part.groups || part.items.map((it) => ({ items: [it], at: it.at, single: true }));
    steps.forEach((step, i) => {
      const c = { set: d.id, audio: part.audio ? part.audio.file : null, step, items: step.items };
      all.push(c);
      if (!(withDirections && i === 0)) strict.push(c);
    });
  }
  return { strict, all };
}

// exactly `target` questions out of steps of different sizes (Part 7): random tries, then a certain way
function pickSum(pool, target, rand) {
  for (let tries = 0; tries < 300; tries++) {
    const order = shuffle(pool, rand);
    const got = [];
    let sum = 0;
    for (const c of order) if (sum + c.items.length <= target) { got.push(c); sum += c.items.length; if (sum === target) return got; }
  }
  // dynamic programming over the shuffled pool: reachable[s] = a list of steps that makes s
  const order = shuffle(pool, rand);
  const reach = [[]];
  for (const c of order) {
    for (let s = target; s >= c.items.length; s--) if (!reach[s] && reach[s - c.items.length]) reach[s] = [...reach[s - c.items.length], c];
  }
  if (reach[target]) return reach[target];
  let best = target;
  while (best > 0 && !reach[best]) best--;
  return reach[best] || [];
}

// → [{ set, audio, step, items: [{ n, src }] }] in the order they are sat
function select(sets, partNo, secret, uid, seed) {
  const slot = SLOTS[partNo];
  const rand = rng(secret, uid, seed, partNo);
  const { strict, all } = poolOf(sets, partNo);
  const size = (c) => c.items.length;
  let chosen;
  if (Number(partNo) === 7) {
    chosen = pickSum(all, slot.count, rand);
    chosen.sort((x, y) => ((x.step.imgs || []).length) - ((y.step.imgs || []).length));      // single passages first, like the real test
  } else {
    const need = Math.ceil(slot.count / Math.max(1, ...all.map(size)));       // steps of one size: 1 question, 3 (a conversation / talk) or 4 (a text)
    const from = strict.length >= need ? strict : all;
    chosen = shuffle(from, rand).slice(0, need);
  }
  let n = slot.start;
  return chosen.map((c) => ({ ...c, items: c.items.map((src) => ({ n: n++, src })) }));
}

const mixSecret = () => toeic.mediaSecret();

// one Part for the browser (no answers; pictures and audio as short-lived links)
async function publicMixPart(seed, partNo, uid) {
  const secret = mixSecret();
  if (!secret) return { status: 503 };
  const sets = await allSets();
  if (sets.length < 2) return { status: 404 };
  const picked = select(sets, partNo, secret, uid || '', seed);
  if (!picked.length) return { status: 404 };
  const img = (set, name) => toeic.mediaUrl(uid, 's' + set + '/img/' + name);
  const pub = (c, it) => {
    const q = it.src;
    const o = { n: it.n, c: q.c };
    if (q.q) o.q = uid ? stampText(q.q, uid) : q.q;
    if (q.img) o.img = img(c.set, q.img);
    if (q.cue !== undefined) o.cue = q.cue;
    return o;
  };
  const audioOf = (c) => (c.audio ? { audio: toeic.mediaUrl(uid, 's' + c.set + '/' + c.audio), at: c.step.at } : {});
  const out = { mix: true, part: Number(partNo) };
  if (picked[0].step.single) {
    out.items = picked.map((c) => ({ ...pub(c, c.items[0]), ...audioOf(c) }));
  } else {
    out.groups = picked.map((c) => ({
      id: c.items[0].n + (c.items.length > 1 ? '-' + c.items[c.items.length - 1].n : ''),
      ...audioOf(c),
      ...(c.step.label ? { label: c.step.label } : {}),
      ...(c.step.imgs && c.step.imgs.length ? { imgs: c.step.imgs.map((x) => img(c.set, x)) } : {}),
      items: c.items.map((it) => pub(c, it)),
    }));
  }
  return { status: 200, body: out };
}

// n → the source question (with its answer), for grading
async function mixItemMap(seed, partNo, uid) {
  const secret = mixSecret();
  if (!secret) return null;
  const sets = await allSets();
  if (sets.length < 2) return null;
  const map = new Map();
  for (const c of select(sets, partNo, secret, uid || '', seed)) for (const it of c.items) map.set(it.n, it.src);
  return map;
}

module.exports = { seedOk, publicMixPart, mixItemMap, select, SLOTS };
