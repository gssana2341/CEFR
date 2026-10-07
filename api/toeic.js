// The TOEIC book sets (see _toeic.js / _toeic_store.js).
//
//   GET  /api/toeic                          → { available, sets:[{ id, title, parts:{ '1':{ q, audio } … } }] }   (names and counts only)
//   GET  /api/toeic?set=1&part=3             → the part WITHOUT answers; pictures and audio come as links that expire (members only)
//   GET  /api/toeic?op=tips                  → the Ebook pages (grammar tricks, 200 words, 120 phrases) as picture links (members only)
//   GET  /api/toeic?op=media&p=…&t=…         → one picture / a slice of an audio file; the link itself is the credential, because an
//                                              <img> or <audio> tag cannot send a sign-in header. A link is tied to one account, one
//                                              file and about 25 minutes.
//   POST /api/toeic { op:'check', set, part, items:[{ n, pick }] }   → { results: { n: { a, e? } } }  the answers, after the picks
//
// A copy of the whole book in one request is not possible: a part at a time, a few parts per account per day (strikes block
// the account, see _abuse.js), answers only for what was picked, media in slices of at most 2 MB.
'use strict';
const { send, readJson, rateLimited } = require('./_pay');
const { limited } = require('./_ratelimit');
const { who, deny, members } = require('./_entitlements');
const { seenToday, strike } = require('./_abuse');
const { stampText } = require('./_watermark');
const store = require('./_toeic_store');
const toeic = require('./_toeic');

const DAY = 86_400_000;
const PART_LOADS_PER_DAY = 60;         // loads of a part page per account / address per day
const DISTINCT_PARTS_PER_DAY = 14;     // different (set, part) pairs - two whole 200-question tests
const MEDIA_PER_DAY = 800;             // pictures + audio slices
const ANSWERS_PER_DAY = 1000;
const MAX_CHECK_ITEMS = 60;
const SLICE = 2 * 1024 * 1024;         // largest audio slice per response (Vercel caps a response at 4.5 MB)

const isInt = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
const num = (v) => (typeof v === 'string' && /^\d{1,3}$/.test(v) ? Number(v) : NaN);

function notConfigured(res) {
  return send(res, 503, { error: 'not_available' });
}

async function media(req, res, q) {
  if (req.headers['sec-fetch-site'] === 'cross-site') return send(res, 403, { error: 'forbidden' });     // no hot-linking from other sites
  const p = typeof q.p === 'string' ? q.p : '';
  if (!/^(s\d{1,2}|tips)\/(img|audio)\/[a-z0-9_\-]+\.(webp|mp3)$/i.test(p)) return send(res, 404, { error: 'not_found' });
  const uid = toeic.verifyMedia(p, q.t);
  if (!uid) return send(res, 403, { error: 'link_expired' });
  if (!store.configured()) return notConfigured(res);
  if (await limited(req, 'toeic-media', MEDIA_PER_DAY, { uid, windowMs: DAY })) return send(res, 429, { error: 'rate_limited' });

  // "bytes=100-199", "bytes=100-" (open ended) or "bytes=-500" (the tail); no header = from the start. Never more than SLICE bytes at once.
  let want = { start: 0, end: Infinity };
  const m = /^bytes=(\d*)-(\d*)$/.exec(String(req.headers.range || ''));
  if (m && m[1] !== '') want = { start: Number(m[1]), end: m[2] === '' ? Infinity : Number(m[2]) };
  else if (m && m[2] !== '') want = { suffix: Number(m[2]) };
  let r;
  try {
    if (want.suffix !== undefined) {
      const probe = await store.read(p, { start: 0, end: 0 });
      want = { start: Math.max(0, probe.size - want.suffix), end: Infinity };
    }
    r = await store.read(p, { start: want.start, end: Math.min(want.end, want.start + SLICE - 1) });
  } catch (e) {
    if (e.code === 'range') {
      res.setHeader('Content-Range', 'bytes */' + (e.size || 0));
      return send(res, 416, { error: 'bad_range' });
    }
    if (e.code === 'not_found') return send(res, 404, { error: 'not_found' });
    console.error('[toeic] media failed:', e.message);
    return send(res, 502, { error: 'server_error' });
  }
  const partial = r.start !== 0 || r.end !== r.size - 1;
  res.setHeader('Content-Type', r.type);
  res.setHeader('Content-Length', String(r.buf.length));
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'private, max-age=600');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Disposition', 'inline');
  if (partial) {
    res.setHeader('Content-Range', 'bytes ' + r.start + '-' + r.end + '/' + r.size);
    res.statusCode = 206;
  } else {
    res.statusCode = 200;
  }
  res.end(r.buf);
}

async function getPart(req, res, q) {
  const set = num(q.set);
  const part = String(q.part || '');
  if (!toeic.validSet(set) || !toeic.validPart(part)) return send(res, 400, { error: 'bad_part' });
  if (!store.configured()) return notConfigured(res);

  const ctx = await who(req);
  const refused = deny(ctx, 'toeic');
  if (refused) return send(res, refused.status, { error: refused.error, feature: 'toeic' });
  const uid = ctx.user && ctx.user.uid;
  if (await limited(req, 'toeic-part-day', PART_LOADS_PER_DAY, { uid, windowMs: DAY })) return send(res, 429, { error: 'rate_limited' });
  const seen = await seenToday(ctx.ident, 'toeic', set + ':' + part, DISTINCT_PARTS_PER_DAY);
  if (!seen.ok) {
    if (members('toeic')) await strike(uid);
    return send(res, 429, { error: 'daily_limit' });
  }

  let data;
  try { data = await toeic.loadSet(set); } catch (e) {
    console.error('[toeic] load failed:', e.message);
    return send(res, 502, { error: 'server_error' });
  }
  const out = data && toeic.publicPart(data, part, uid || '');
  if (!out) return send(res, 404, { error: 'not_found' });
  return send(res, 200, out);
}

async function getTips(req, res) {
  if (!store.configured()) return notConfigured(res);
  const ctx = await who(req);
  const refused = deny(ctx, 'toeic');
  if (refused) return send(res, refused.status, { error: refused.error, feature: 'toeic' });
  const uid = ctx.user && ctx.user.uid;
  if (await limited(req, 'toeic-tips-day', 60, { uid, windowMs: DAY })) return send(res, 429, { error: 'rate_limited' });
  const out = await toeic.publicTips(uid || '');
  return out ? send(res, 200, out) : send(res, 404, { error: 'not_found' });
}

async function check(req, res) {
  const body = await readJson(req);
  const set = body.set;
  const part = String(body.part || '');
  const items = body.items;
  if (!toeic.validSet(set) || !toeic.validPart(part) || !Array.isArray(items) || items.length < 1 || items.length > MAX_CHECK_ITEMS) {
    return send(res, 400, { error: 'bad_items' });
  }
  if (!store.configured()) return notConfigured(res);
  const ctx = await who(req);
  const refused = deny(ctx, 'toeic');
  if (refused) return send(res, refused.status, { error: refused.error, feature: 'toeic' });
  const uid = ctx.user && ctx.user.uid;

  let data;
  try { data = await toeic.loadSet(set); } catch (e) {
    console.error('[toeic] load failed:', e.message);
    return send(res, 502, { error: 'server_error' });
  }
  if (!data || !data.parts[part]) return send(res, 404, { error: 'not_found' });
  const byN = toeic.itemMap(data, part);
  const results = {};
  for (const it of items) {
    const q = it && byN.get(it.n);
    if (!q || !isInt(it.pick, 0, q.c.length - 1) || results[it.n]) return send(res, 400, { error: 'bad_items' });
    results[it.n] = { a: q.a, ...(q.e ? { e: uid ? stampText(q.e, uid) : q.e } : {}) };
  }
  if (await limited(req, 'toeic-answers-day', ANSWERS_PER_DAY, { uid, windowMs: DAY, cost: items.length })) return send(res, 429, { error: 'rate_limited' });
  return send(res, 200, { results });
}

module.exports = async function handler(req, res) {
  if (rateLimited(req, 'toeic', 240)) return send(res, 429, { error: 'rate_limited' });
  try {
    if (req.method === 'POST') return await check(req, res);
    if (req.method !== 'GET') return send(res, 405, { error: 'method_not_allowed' });
    const q = req.query || {};
    if (q.op === 'media') return await media(req, res, q);
    if (q.op === 'tips') return await getTips(req, res);
    if (q.set !== undefined || q.part !== undefined) return await getPart(req, res, q);
    return send(res, 200, await toeic.listSets());
  } catch (e) {
    console.error('[toeic] failed:', e.message);
    return send(res, 502, { error: 'server_error' });
  }
};
