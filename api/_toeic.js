// The TOEIC book sets: what a browser may be shown, the answer key, and the short-lived links for pictures and audio
// (files starting with "_" are not endpoints). Content comes from _toeic_store.js.
//
// data.json of a set (written by tools/toeic/extract.py):
//   { id, title, parts: { '1': { audio, items:[{n,img,c,a}] }, '2': …, '3'|'4': { audio, groups:[{id, items:[{n,q,c,a,img?}]}] },
//                         '5': { items }, '6'|'7': { groups:[{id,label,imgs[],items:[{n,q?,c,a,e?}]}] } } }
// `a` (the answer index) and `e` (an optional explanation) never leave the server except through /api/toeic (op check).
'use strict';

const crypto = require('node:crypto');
const store = require('./_toeic_store');
const { stampText } = require('./_watermark');

const MEDIA_TTL = 25 * 60_000;        // a link to a picture / audio file works for this long, for the account it was made for
const MAX_SET = 99;
const PARTS = ['1', '2', '3', '4', '5', '6', '7'];

const validSet = (s) => Number.isInteger(s) && s >= 1 && s <= MAX_SET;
const validPart = (p) => PARTS.includes(String(p));

// ---------- media links ----------
function mediaSecret() {
  if (process.env.MEDIA_SECRET) return process.env.MEDIA_SECRET;
  if (process.env.WATERMARK_SECRET) return 'media|' + process.env.WATERMARK_SECRET;
  if (process.env.PASS_SECRET) return 'media|' + process.env.PASS_SECRET;
  if (process.env.FIREBASE_PRIVATE_KEY) return 'media|' + crypto.createHash('sha256').update(process.env.FIREBASE_PRIVATE_KEY).digest('hex');
  return process.env.VERCEL ? '' : 'dev-only-media';       // no secret on a real deployment = no links rather than guessable ones
}
const mac = (uid, p, exp) => crypto.createHmac('sha256', mediaSecret()).update('toeic-media|' + uid + '|' + p + '|' + exp).digest('base64url').slice(0, 27);

function signMedia(uid, p, now = Date.now()) {
  if (!mediaSecret()) return '';
  const exp = (now + MEDIA_TTL).toString(36);
  return Buffer.from(uid).toString('base64url') + '.' + exp + '.' + mac(uid, p, exp);
}

// → the uid the link was made for, or null (wrong path, expired, forged)
function verifyMedia(p, token, now = Date.now()) {
  if (!mediaSecret() || typeof token !== 'string' || token.length > 300) return null;
  const [u, exp, sig] = token.split('.');
  if (!u || !exp || !sig) return null;
  let uid;
  try { uid = Buffer.from(u, 'base64url').toString(); } catch { return null; }
  if (!uid || uid.length > 128) return null;
  const want = Buffer.from(mac(uid, p, exp));
  const got = Buffer.from(sig);
  if (want.length !== got.length || !crypto.timingSafeEqual(want, got)) return null;
  if (!(parseInt(exp, 36) > now)) return null;
  return uid;
}

const mediaUrl = (uid, p) => '/api/toeic?op=media&p=' + encodeURIComponent(p) + '&t=' + encodeURIComponent(signMedia(uid, p));

// ---------- data ----------
async function loadSet(set) {
  if (!validSet(set)) return null;
  try {
    return await store.getJson('s' + set + '/data.json');
  } catch (e) {
    if (e.code === 'not_found') return null;
    throw e;
  }
}

function itemsOf(part) {
  if (!part) return [];
  return part.items || (part.groups || []).flatMap((g) => g.items);
}

// what the menu needs to list the sets (no questions)
async function listSets() {
  if (!store.configured()) return { available: false, sets: [] };
  let index;
  try { index = await store.getJson('index.json'); } catch (e) {
    if (e.code === 'not_found') return { available: false, sets: [] };
    throw e;
  }
  const sets = [];
  for (const s of index.sets || []) {
    const d = await loadSet(s.id);
    if (!d) continue;
    const parts = {};
    for (const p of PARTS) {
      const part = d.parts[p];
      if (!part) continue;
      parts[p] = { q: itemsOf(part).length, audio: part.audio ? Math.round(part.audio.sec) : 0 };
    }
    sets.push({ id: d.id, title: d.title, parts });
  }
  return { available: sets.length > 0, sets, tips: await listTips() };
}

// ---------- tips (the Ebook pages: grammar tricks, vocabulary, phrases) - pictures of the printed pages ----------
async function loadTips() {
  try {
    return await store.getJson('tips/data.json');
  } catch (e) {
    if (e.code === 'not_found') return null;
    throw e;
  }
}

// names and page counts only
async function listTips() {
  const t = await loadTips();
  return t ? t.sections.map((s) => ({ id: s.id, title: s.title, sub: s.sub, pages: s.pages.length })) : [];
}

async function publicTips(uid) {
  const t = await loadTips();
  if (!t) return null;
  return {
    sections: t.sections.map((s) => ({
      id: s.id, title: s.title, sub: s.sub,
      pages: s.pages.map((pg) => ({ src: mediaUrl(uid, 'tips/img/' + pg.img), cap: pg.cap })),
    })),
  };
}

// one part as a browser may see it: no answers, no explanations, pictures and audio as short-lived links
function publicPart(data, partNo, uid) {
  const part = data.parts[partNo];
  if (!part) return null;
  const set = data.id;
  const img = (name) => mediaUrl(uid, 's' + set + '/img/' + name);
  const pub = (it) => {
    const o = { n: it.n, c: it.c };
    if (it.q) o.q = uid ? stampText(it.q, uid) : it.q;            // signed-in readers get their invisible tag (see _watermark.js)
    if (it.img) o.img = img(it.img);
    return o;
  };
  const out = { set, part: Number(partNo) };
  if (part.audio) out.audio = { src: mediaUrl(uid, 's' + set + '/' + part.audio.file), sec: part.audio.sec };
  if (part.items) out.items = part.items.map(pub);
  if (part.groups) {
    out.groups = part.groups.map((g) => ({
      id: g.id,
      ...(g.label ? { label: g.label } : {}),
      ...(g.imgs && g.imgs.length ? { imgs: g.imgs.map(img) } : {}),
      items: g.items.map(pub),
    }));
  }
  return out;
}

// n → the item (with its answer), for grading
function itemMap(data, partNo) {
  return new Map(itemsOf(data.parts[partNo]).map((it) => [it.n, it]));
}

module.exports = { validSet, validPart, signMedia, verifyMedia, mediaUrl, loadSet, listSets, publicPart, publicTips, itemMap, itemsOf, MEDIA_TTL, PARTS };
