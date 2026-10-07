// Where the TOEIC book content (questions, answer key, pictures, audio) is kept - OUTSIDE git and outside public/
// (files starting with "_" are not endpoints).
//
// The book is copyrighted and this repository is public, so none of it is committed. tools/toeic/extract.py builds it into
// build/toeic/ on a machine; tools/toeic/upload.mjs copies it to a PRIVATE bucket; this file reads it back. Only the two functions
// below are used by the rest of the code, so moving to another provider means changing this file and nothing else:
//
//   getJson('s1/data.json')          → parsed JSON (cached for a few minutes)
//   read('s1/audio/part3.mp3', {start, end})  → { buf, start, end, size, type }   (byte range, inclusive; whole file when omitted)
//
// Backends, chosen from the environment:
//   TOEIC_DIR=<folder>                       local folder (development and tests; ignored on Vercel)
//   SUPABASE_URL + SUPABASE_SERVICE_KEY      Supabase Storage, private bucket TOEIC_BUCKET (default "toeic"). The service key lives
//                                            in the server's environment only and never reaches a browser.
// With neither set, configured() is false and the endpoint says the content is not available.
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const TYPES = { '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };

// a path inside the store: lower-case words, digits, - _ . and single slashes. Anything else is refused before it reaches a backend.
function validPath(p) {
  return typeof p === 'string' && p.length > 0 && p.length <= 120 && /^[a-z0-9_\-./]+$/i.test(p)
    && !p.split('/').some((s) => s === '' || s === '.' || s === '..');
}

const typeOf = (p) => TYPES[path.extname(p).toLowerCase()] || 'application/octet-stream';

function which() {
  if (process.env.TOEIC_DIR && !process.env.VERCEL && !process.env.VERCEL_ENV) return 'dir';
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) return 'supabase';
  return null;
}
const configured = () => which() !== null;

// ---------- local folder ----------
function readDir(p, range) {
  const root = path.resolve(process.env.TOEIC_DIR);
  const file = path.resolve(root, p);
  if (!file.startsWith(root + path.sep)) throw notFound();
  let st;
  try { st = fs.statSync(file); } catch { throw notFound(); }
  if (!st.isFile()) throw notFound();
  const start = range ? range.start : 0;
  const end = range ? Math.min(range.end, st.size - 1) : st.size - 1;
  if (start > end) throw Object.assign(new Error('range'), { code: 'range', size: st.size });
  const fd = fs.openSync(file, 'r');
  try {
    const buf = Buffer.alloc(end - start + 1);
    fs.readSync(fd, buf, 0, buf.length, start);
    return { buf, start, end, size: st.size, type: typeOf(p) };
  } finally {
    fs.closeSync(fd);
  }
}

// ---------- Supabase Storage ----------
async function readSupabase(p, range) {
  const base = process.env.SUPABASE_URL.replace(/\/+$/, '');
  const bucket = process.env.TOEIC_BUCKET || 'toeic';
  const key = process.env.SUPABASE_SERVICE_KEY;
  const url = base + '/storage/v1/object/authenticated/' + encodeURIComponent(bucket) + '/' + p.split('/').map(encodeURIComponent).join('/');
  const headers = { Authorization: 'Bearer ' + key, apikey: key };
  if (range) headers.Range = 'bytes=' + range.start + '-' + range.end;
  const r = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
  if (r.status === 404 || r.status === 400) throw notFound();
  if (r.status === 416) throw Object.assign(new Error('range'), { code: 'range' });
  if (!r.ok) throw new Error('store_http_' + r.status);
  const body = Buffer.from(await r.arrayBuffer());
  if (r.status === 206) {
    const m = /bytes (\d+)-(\d+)\/(\d+)/.exec(r.headers.get('content-range') || '');
    if (!m) throw new Error('store_bad_range');
    return { buf: body, start: Number(m[1]), end: Number(m[2]), size: Number(m[3]), type: typeOf(p) };
  }
  // the provider ignored the Range header and sent the whole object: cut it here
  const size = body.length;
  const start = range ? range.start : 0;
  const end = range ? Math.min(range.end, size - 1) : size - 1;
  if (start > end) throw Object.assign(new Error('range'), { code: 'range', size });
  return { buf: body.subarray(start, end + 1), start, end, size, type: typeOf(p) };
}

function notFound() {
  return Object.assign(new Error('not_found'), { code: 'not_found' });
}

async function read(p, range) {
  if (!validPath(p)) throw notFound();
  const b = which();
  if (b === 'dir') return readDir(p, range);
  if (b === 'supabase') return readSupabase(p, range);
  throw Object.assign(new Error('not_configured'), { code: 'not_configured' });
}

const cache = new Map();
const TTL = 10 * 60_000;
async function getJson(p) {
  const hit = cache.get(p);
  if (hit && Date.now() - hit.at < TTL) return hit.value;
  const { buf } = await read(p);
  const value = JSON.parse(buf.toString('utf8'));
  cache.set(p, { at: Date.now(), value });
  return value;
}
const clearCache = () => cache.clear();

module.exports = { configured, which, read, getJson, validPath, typeOf, clearCache };
