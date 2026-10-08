// Checks for /api/toeic (the TOEIC book sets) against a small made-up set in a temp folder - the real book is never needed.
// Usage: node scripts/test-toeic.mjs   (exit code 1 on failure)
//
//   - nothing is served without a sign-in and a membership; a made-up pick / unknown question is refused
//   - no answer, explanation or other key that gives it away is in anything sent before a pick
//   - picture and audio links: tied to one account and one file, they expire, they cannot be forged, no hot-linking
//   - audio comes in slices (never the whole file in one response), ranges are honoured, bad ranges are refused
//   - a few parts per day only, and paths can not leave the store
process.env.PAY_MODE = 'mock';
delete process.env.VERCEL;
delete process.env.VERCEL_ENV;
delete process.env.FIREBASE_PRIVATE_KEY;

import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import crypto from 'node:crypto';
import http from 'node:http';
import vm from 'node:vm';
import { readFileSync, existsSync, statSync } from 'node:fs';

const require = createRequire(import.meta.url);
const handler = require('../api/toeic.js');
const toeic = require('../api/_toeic.js');
const store = require('../api/_toeic_store.js');
const wm = require('../api/_watermark.js');
const { setUserPass } = require('../api/_firebase.js');

let failed = 0;
async function test(name, fn) {
  try { await fn(); console.log('  ✓ ' + name); } catch (e) { failed++; console.log('  ✗ ' + name + '\n      ' + (e.stack || e).toString().split('\n').slice(0, 4).join('\n      ')); }
}

let ip = 0;
function call({ method = 'GET', body, query, token, headers = {} } = {}) {
  return new Promise((resolve) => {
    const req = { method, body, query, headers: { 'x-real-ip': '10.1.' + Math.floor(++ip / 250) + '.' + (ip % 250), ...(token ? { authorization: 'Bearer ' + token } : {}), ...headers }, socket: {} };
    const h = {};
    const res = {
      statusCode: 200,
      setHeader(k, v) { h[k.toLowerCase()] = v; },
      status(c) { this.statusCode = c; return this; },
      send(b) { resolve({ code: this.statusCode, headers: h, json: JSON.parse(b) }); },
      end(b) { resolve({ code: this.statusCode, headers: h, buf: b }); },
    };
    Promise.resolve(handler(req, res)).catch((e) => resolve({ code: 500, json: { error: String(e) } }));
  });
}

const FREE = 'mock-free-user';
const MEMBER = 'mock-member-user';
const MEMBER2 = 'mock-member-two';
await setUserPass('member-user', { exp: Date.now() + 86_400_000, plan: 'd1', sid: 't1' });
await setUserPass('member-two', { exp: Date.now() + 86_400_000, plan: 'd1', sid: 't2' });

// ---------- a made-up store ----------
const dir = mkdtempSync(join(tmpdir(), 'toeic-test-'));
const mk = (p, data) => { mkdirSync(join(dir, p, '..'), { recursive: true }); writeFileSync(join(dir, p), data); };
const AUDIO = crypto.randomBytes(5 * 1024 * 1024 + 123);          // 5 MB and a bit: needs three slices
const IMG = crypto.randomBytes(40_000);
const longText = 'This is a stem that is long enough to carry the invisible tag of the reader.';
function setData(id) {
  const parts = {
    1: { audio: { file: 'audio/part1.mp3', sec: 100, bytes: AUDIO.length }, items: [{ n: 1, img: 'q1.webp', c: ['A', 'B', 'C', 'D'], a: 2 }] },
    2: { audio: { file: 'audio/part1.mp3', sec: 100 }, items: [{ n: 7, c: ['A', 'B', 'C'], a: 0 }] },
    3: { audio: { file: 'audio/part1.mp3', sec: 100 }, groups: [{ id: '32-34', at: [10, 60], items: [{ n: 32, q: longText, c: ['a', 'b', 'c', 'd'], a: 1, cue: 30, e: 'because of the clue in the long explanation text', tx: 'Good morning, I would like to rent a car for a couple of days please.' }] }] },
    4: { audio: null, groups: [{ id: '71-73', items: [{ n: 71, q: 'short?', c: ['a', 'b', 'c', 'd'], a: 3, img: 'q1.webp' }] }] },
    5: { items: [{ n: 101, q: longText, c: ['w', 'x', 'y', 'z'], a: 0 }] },
    6: { groups: [{ id: '131-134', label: 'e-mail', imgs: ['q1.webp'], items: [{ n: 131, c: ['w', 'x', 'y', 'z'], a: 1 }] }] },
    7: { groups: [{ id: '147-148', label: 'notice', imgs: ['q1.webp'], items: [{ n: 147, q: longText, c: ['w', 'x', 'y', 'z'], a: 2 }, { n: 148, q: 'other?', c: ['w', 'x', 'y', 'z'], a: 3 }] }] },
  };
  return { id, title: 'Set ' + id, parts };
}
for (const id of [1, 2, 3]) {
  mk('s' + id + '/data.json', JSON.stringify(setData(id)));
  mk('s' + id + '/img/q1.webp', IMG);
  mk('s' + id + '/audio/part1.mp3', AUDIO);
}
mk('index.json', JSON.stringify({ sets: [{ id: 1 }, { id: 2 }, { id: 3 }] }));
mk('tips/data.json', JSON.stringify({ sections: [{ id: 'grammar', title: 'Grammar tips', sub: 'sub', pages: [{ img: 'g1.webp', cap: 'page 1' }, { img: 'g2.webp', cap: 'page 2' }] }] }));
mk('tips/img/g1.webp', IMG);
mk('tips/img/g2.webp', IMG);
mk('secret.txt', 'outside of the store tree? no - inside the dir, but not a valid media path');

const KEYS_THAT_LEAK = ['a', 'e', 'tx', 'answer', 'key'];
function leaks(v, path = '') {
  if (Array.isArray(v)) return v.flatMap((x, i) => leaks(x, path + '[' + i + ']'));
  if (v && typeof v === 'object') return Object.entries(v).flatMap(([k, x]) => (KEYS_THAT_LEAK.includes(k) ? [path + '.' + k] : leaks(x, path + '.' + k)));
  return [];
}

console.log('TOEIC book sets');

await test('with no store configured nothing is served and nothing crashes', async () => {
  delete process.env.TOEIC_DIR;
  assert.equal((await call()).json.available, false);
  assert.equal((await call({ query: { set: '1', part: '5' }, token: MEMBER })).code, 503);
  assert.equal((await call({ method: 'POST', token: MEMBER, body: { op: 'check', set: 1, part: 5, items: [{ n: 101, pick: 0 }] } })).code, 503);
  process.env.TOEIC_DIR = dir;
  store.clearCache();
});

await test('the menu lists sets and counts, never questions', async () => {
  const r = await call();
  assert.equal(r.code, 200);
  assert.equal(r.json.available, true);
  assert.equal(r.json.sets.length, 3);
  assert.equal(r.json.sets[0].parts['7'].q, 2);
  assert.ok(!JSON.stringify(r.json).includes('stem'));
});

await test('tips: names in the menu, pictures only for members, links work and nothing else under tips/ can be fetched', async () => {
  const menu = await call();
  assert.deepEqual(menu.json.tips.map((t) => [t.id, t.pages]), [['grammar', 2]]);
  assert.ok(!JSON.stringify(menu.json.tips).includes('/api/toeic'), 'no links in the menu');
  assert.equal((await call({ query: { op: 'tips' } })).code, 401);
  assert.equal((await call({ query: { op: 'tips' }, token: FREE })).code, 402);
  const r = await call({ query: { op: 'tips' }, token: MEMBER });
  assert.equal(r.code, 200);
  assert.deepEqual(leaks(r.json), []);
  assert.equal(r.json.sections[0].pages.length, 2);
  const img = await call({ query: Object.fromEntries(new URL(r.json.sections[0].pages[0].src, 'http://x').searchParams) });
  assert.equal(img.code, 200);
  assert.ok(Buffer.compare(img.buf, IMG) === 0);
  for (const p of ['tips/data.json', 'tips/img/../data.json', 'tips/audio/x.mp3', 'tips/img/g1.png', 'tipsx/img/g1.webp']) {
    const m = await call({ query: { op: 'media', p, t: toeic.signMedia('member-user', p) } });
    assert.ok([403, 404].includes(m.code) && !m.buf, p + ' → ' + m.code);
  }
});

await test('a part needs a sign-in (401) and a membership (402)', async () => {
  assert.equal((await call({ query: { set: '1', part: '5' } })).code, 401);
  assert.equal((await call({ query: { set: '1', part: '5' }, token: FREE })).code, 402);
  assert.equal((await call({ query: { set: '1', part: '5' }, token: MEMBER })).code, 200);
});

await test('the part sent to a member has no answer, explanation or other giveaway key', async () => {
  for (const p of ['1', '2', '3', '4', '5', '6', '7']) {
    const r = await call({ query: { set: '2', part: p }, token: MEMBER2 });
    assert.equal(r.code, 200, 'part ' + p);
    assert.deepEqual(leaks(r.json), [], 'part ' + p + ' leaks');
    assert.ok(!JSON.stringify(r.json).includes('because of the clue'), 'explanation text must not be in the part');
    assert.ok(!JSON.stringify(r.json).includes('Good morning'), 'the script must not be in the part');
    if (p === '3') { assert.deepEqual(r.json.groups[0].at, [10, 60]); assert.equal(r.json.groups[0].items[0].cue, 30); }
  }
});

await test('bad set / part numbers are refused, unknown ones are 404', async () => {
  for (const q of [{ set: 'x', part: '5' }, { set: '1', part: '8' }, { set: '1', part: '0' }, { set: '../1', part: '5' }, { set: '1', part: '5; DROP' }, { set: '-1', part: '5' }]) {
    assert.equal((await call({ query: q, token: MEMBER })).code, 400, JSON.stringify(q));
  }
  assert.equal((await call({ query: { set: '9', part: '5' }, token: MEMBER })).code, 404);
});

await test('a signed-in reader gets their own invisible tag in the text; two readers get different ones', async () => {
  const a = (await call({ query: { set: '3', part: '5' }, token: MEMBER })).json.items[0].q;
  const b = (await call({ query: { set: '3', part: '5' }, token: MEMBER2 })).json.items[0].q;
  assert.notEqual(a, b);
  assert.deepEqual(wm.decode(a), [wm.tagOf('member-user')]);
  assert.deepEqual(wm.decode(b), [wm.tagOf('member-two')]);
});

await test('check: answers only for the picks made; bad picks, repeats and foreign questions are refused', async () => {
  const ok = await call({ method: 'POST', token: MEMBER, body: { op: 'check', set: 1, part: 7, items: [{ n: 147, pick: 0 }, { n: 148, pick: 3 }] } });
  assert.equal(ok.code, 200);
  assert.equal(ok.json.results[147].a, 2);
  assert.equal(ok.json.results[148].a, 3);
  const withE = await call({ method: 'POST', token: MEMBER, body: { op: 'check', set: 1, part: 3, items: [{ n: 32, pick: 0 }] } });
  assert.equal(withE.json.results[32].a, 1);
  assert.ok(withE.json.results[32].e.startsWith('because of the clue'));
  assert.ok(withE.json.results[32].tx.startsWith('Good morning'), 'the script of the recording comes with the answer');
  const bad = (items, part = 7) => call({ method: 'POST', token: MEMBER, body: { op: 'check', set: 1, part, items } });
  assert.equal((await bad([{ n: 147, pick: 4 }])).code, 400);
  assert.equal((await bad([{ n: 147, pick: -1 }])).code, 400);
  assert.equal((await bad([{ n: 147, pick: '1' }])).code, 400);
  assert.equal((await bad([{ n: 101, pick: 0 }])).code, 400, 'a question of another part');
  assert.equal((await bad([{ n: 147, pick: 0 }, { n: 147, pick: 1 }])).code, 400, 'the same question twice');
  assert.equal((await bad([])).code, 400);
  assert.equal((await bad(Array.from({ length: 61 }, (_, i) => ({ n: i, pick: 0 })))).code, 400);
  assert.equal((await call({ method: 'POST', token: FREE, body: { op: 'check', set: 1, part: 7, items: [{ n: 147, pick: 0 }] } })).code, 402);
  assert.equal((await call({ method: 'POST', body: { op: 'check', set: 1, part: 7, items: [{ n: 147, pick: 0 }] } })).code, 401);
  assert.equal((await call({ method: 'POST', token: MEMBER, body: { op: 'check', set: 1, part: 'x', items: [{ n: 147, pick: 0 }] } })).code, 400);
});

// ---------- media ----------
const link = async (uid, p) => `/api/toeic?op=media&p=${encodeURIComponent(p)}&t=${encodeURIComponent(toeic.signMedia(uid, p))}`;
const mq = (uid, p, t) => ({ op: 'media', p, t: t === undefined ? toeic.signMedia(uid, p) : t });

await test('the links in a part work as they are (picture bytes come back unchanged)', async () => {
  const part = (await call({ query: { set: '2', part: '6' }, token: MEMBER2 })).json;
  const url = new URL(part.groups[0].imgs[0], 'http://x');
  const r = await call({ query: Object.fromEntries(url.searchParams), headers: { 'sec-fetch-site': 'same-origin' } });
  assert.equal(r.code, 200);
  assert.equal(r.headers['content-type'], 'image/webp');
  assert.ok(Buffer.compare(r.buf, IMG) === 0);
  assert.ok(String(r.headers['cache-control']).startsWith('private'));
});

await test('a link is tied to its file and its account, expires, and cannot be forged', async () => {
  const p = 's1/img/q1.webp';
  assert.equal((await call({ query: mq('member-user', p) })).code, 200);
  assert.equal((await call({ query: mq('member-user', 's2/img/q1.webp', toeic.signMedia('member-user', p)) })).code, 403, 'token of another file');
  const [u, exp, sig] = toeic.signMedia('member-user', p).split('.');
  const otherUser = Buffer.from('member-two').toString('base64url');
  assert.equal((await call({ query: mq('x', p, [otherUser, exp, sig].join('.')) })).code, 403, 'token of another account');
  assert.equal((await call({ query: mq('x', p, [u, (parseInt(exp, 36) + 99999).toString(36), sig].join('.')) })).code, 403, 'extended expiry');
  assert.equal((await call({ query: mq('x', p, [u, exp, sig.slice(0, -1) + (sig.endsWith('A') ? 'B' : 'A')].join('.')) })).code, 403, 'altered signature');
  const old = toeic.signMedia('member-user', p, Date.now() - toeic.MEDIA_TTL - 1000);
  assert.equal((await call({ query: mq('x', p, old) })).code, 403, 'expired');
  for (const t of ['', 'abc', 'a.b', '....', 'x'.repeat(400)]) assert.equal((await call({ query: mq('x', p, t) })).code, 403, 'junk token');
  assert.equal((await call({ query: { op: 'media', p } })).code, 403, 'no token at all');
});

await test('no hot-linking: a request flagged cross-site is refused', async () => {
  const r = await call({ query: mq('member-user', 's1/img/q1.webp'), headers: { 'sec-fetch-site': 'cross-site' } });
  assert.equal(r.code, 403);
});

await test('media paths: only s<n>/img|audio/<name>.webp|mp3; nothing else in the store can be fetched', async () => {
  for (const p of ['index.json', 's1/data.json', 'secret.txt', '../secret.txt', 's1/img/../data.json', 's1/img/q1.webp/', '/s1/img/q1.webp', 's1/img/q1.png', 's1/audio/part1.mp3.json', 's1//img/q1.webp', 's1/img/%2e%2e/data.json']) {
    const r = await call({ query: mq('member-user', p) });
    assert.ok([403, 404].includes(r.code), p + ' → ' + r.code);
    assert.ok(!r.buf, p + ' returned bytes');
  }
  assert.equal((await call({ query: mq('member-user', 's1/img/missing.webp') })).code, 404);
  assert.equal(store.validPath('s1/../data.json'), false);
  assert.equal(store.validPath('s1/data.json'), true);
});

await test('audio comes in slices of at most 2 MB, with correct ranges, and can be put back together', async () => {
  const p = 's1/audio/part1.mp3';
  const parts = [];
  let pos = 0;
  while (pos < AUDIO.length) {
    const r = await call({ query: mq('member-user', p), headers: { range: `bytes=${pos}-` } });
    assert.equal(r.code, 206, 'slice at ' + pos);
    assert.ok(r.buf.length <= 2 * 1024 * 1024);
    const m = /bytes (\d+)-(\d+)\/(\d+)/.exec(r.headers['content-range']);
    assert.equal(Number(m[1]), pos);
    assert.equal(Number(m[3]), AUDIO.length);
    assert.equal(r.headers['accept-ranges'], 'bytes');
    assert.equal(Number(r.headers['content-length']), r.buf.length);
    parts.push(r.buf);
    pos = Number(m[2]) + 1;
  }
  assert.ok(Buffer.compare(Buffer.concat(parts), AUDIO) === 0);
  assert.ok(parts.length >= 3);
});

await test('range edge cases: explicit range, tail, no header, beyond the end, nonsense', async () => {
  const p = 's1/audio/part1.mp3';
  const get = (range) => call({ query: mq('member-user', p), headers: range ? { range } : {} });
  let r = await get('bytes=10-19');
  assert.equal(r.code, 206);
  assert.ok(Buffer.compare(r.buf, AUDIO.subarray(10, 20)) === 0);
  r = await get('bytes=-100');
  assert.equal(r.code, 206);
  assert.ok(Buffer.compare(r.buf, AUDIO.subarray(AUDIO.length - 100)) === 0);
  r = await get('bytes=0-' + (10 * 1024 * 1024));
  assert.ok(r.buf.length <= 2 * 1024 * 1024, 'a huge range is cut to one slice');
  r = await get(null);
  assert.ok(r.buf.length <= 2 * 1024 * 1024, 'no Range header still never returns the whole 5 MB');
  r = await get('bytes=' + AUDIO.length + '-');
  assert.equal(r.code, 416);
  r = await get('bytes=abc');
  assert.ok([200, 206].includes(r.code));
  assert.ok(r.buf.length <= 2 * 1024 * 1024);
});

await test('only so many parts per day: the 15th different part is refused', async () => {
  const bob = 'mock-limit-user';
  await setUserPass('limit-user', { exp: Date.now() + 86_400_000, plan: 'd1', sid: 't9' });
  let last;
  let n = 0;
  outer: for (const set of ['1', '2', '3']) {
    for (const part of ['1', '2', '3', '4', '5', '6', '7']) {
      last = await call({ query: { set, part }, token: bob });
      n++;
      if (last.code !== 200) break outer;
    }
  }
  assert.equal(n, 15);
  assert.equal(last.code, 429);
  assert.equal(last.json.error, 'daily_limit');
  assert.equal((await call({ query: { set: '1', part: '1' }, token: bob })).code, 200, 'a part opened before can be opened again');
});

// ---------- the exam room's score estimate (browser code, run here in a sandbox) ----------
await test('score estimate: 0-100 raw maps to 5-495, never goes down as the raw score goes up, and CEFR bands follow the total', async () => {
  const sandbox = { window: { CEFR: { h() {} } } };
  vm.createContext(sandbox);
  vm.runInContext(readFileSync(new URL('../public/assets/js/toeic-ui.js', import.meta.url), 'utf8'), sandbox);
  const ui = sandbox.window.CEFR.toeicUi;
  for (const sec of ['listening', 'reading']) {
    let prev = -1;
    for (let raw = 0; raw <= 100; raw++) {
      const v = ui.scaled(sec, raw);
      assert.ok(v >= 5 && v <= 495 && v % 5 === 0, sec + ' ' + raw + ' → ' + v);
      assert.ok(v >= prev, sec + ' went down at ' + raw);
      prev = v;
    }
    assert.equal(ui.scaled(sec, 0), 5);
    assert.equal(ui.scaled(sec, 100), 495);
  }
  assert.equal(ui.scaled('listening', 150), 495);
  assert.equal(ui.scaled('reading', -5), 5);
  assert.deepEqual([100, 300, 600, 800, 950].map(ui.cefrOf), ['ต่ำกว่า A1', 'A2', 'B1', 'B2', 'C1']);
});

// ---------- the Supabase backend against a fake Supabase ----------
async function fakeSupabase(honourRange) {
  const seen = [];
  const server = http.createServer((req, res) => {
    seen.push({ url: req.url, auth: req.headers.authorization, apikey: req.headers.apikey, range: req.headers.range });
    const m = /^\/storage\/v1\/object\/authenticated\/toeic\/(.+)$/.exec(req.url.split('?')[0]);
    const file = m && join(dir, ...decodeURIComponent(m[1]).split('/'));
    if (req.headers.authorization !== 'Bearer svc-key' || !file || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404, { 'content-type': 'application/json' }); return res.end('{"error":"Not found"}'); }
    const body = readFileSync(file);
    const r = /^bytes=(\d+)-(\d+)$/.exec(req.headers.range || '');
    if (honourRange && r) {
      const a = Number(r[1]); const b = Math.min(Number(r[2]), body.length - 1);
      if (a >= body.length) { res.writeHead(416); return res.end(); }
      res.writeHead(206, { 'content-range': `bytes ${a}-${b}/${body.length}`, 'content-length': b - a + 1 });
      return res.end(body.subarray(a, b + 1));
    }
    res.writeHead(200, { 'content-length': body.length });
    res.end(body);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { server, seen, url: 'http://127.0.0.1:' + server.address().port };
}

for (const honour of [true, false]) {
  await test('Supabase backend (' + (honour ? 'server honours Range' : 'server ignores Range') + '): data, pictures and audio slices work; the key stays on the server', async () => {
    const fake = await fakeSupabase(honour);
    delete process.env.TOEIC_DIR;
    process.env.SUPABASE_URL = fake.url + '/';
    process.env.SUPABASE_SERVICE_KEY = 'svc-key';
    store.clearCache();
    try {
      assert.equal(store.which(), 'supabase');
      const part = await call({ query: { set: '1', part: '6' }, token: MEMBER });
      assert.equal(part.code, 200);
      assert.deepEqual(leaks(part.json), []);
      const img = new URL(part.json.groups[0].imgs[0], 'http://x');
      const r = await call({ query: Object.fromEntries(img.searchParams) });
      assert.equal(r.code, 200);
      assert.ok(Buffer.compare(r.buf, IMG) === 0);
      const a = await call({ query: mq('member-user', 's1/audio/part1.mp3'), headers: { range: 'bytes=3000000-' } });
      assert.equal(a.code, 206);
      assert.ok(Buffer.compare(a.buf, AUDIO.subarray(3000000, 3000000 + a.buf.length)) === 0);
      assert.ok(a.buf.length <= 2 * 1024 * 1024);
      assert.equal((await call({ query: mq('member-user', 's1/img/missing.webp') })).code, 404);
      assert.ok(fake.seen.every((x) => x.auth === 'Bearer svc-key'), 'the service key is sent to the store');
      const all = JSON.stringify(part.json) + JSON.stringify(r.headers);
      assert.ok(!all.includes('svc-key') && !all.includes(fake.url), 'neither the key nor the store address reaches the browser');
    } finally {
      fake.server.close();
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_KEY;
      process.env.TOEIC_DIR = dir;
      store.clearCache();
    }
  });
}

rmSync(dir, { recursive: true, force: true });
console.log(failed ? '\n' + failed + ' failed' : '\nall passed');
process.exit(failed ? 1 : 0);
