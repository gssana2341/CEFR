// Walks the REAL extracted content through the REAL endpoint, the way a browser would, and reports what is complete:
//   node tools/toeic/e2e.mjs [build/toeic]
// For every set and Part: the part loads for a member, has the right number of questions in order, nothing in it gives an answer,
// every picture link and the audio come back as real files (audio is fetched in slices like <audio> does and must reassemble to
// the exact file), and asking for the answers of every question returns exactly what data.json holds.
process.env.PAY_MODE = 'mock';
delete process.env.VERCEL;
delete process.env.VERCEL_ENV;
delete process.env.FIREBASE_PRIVATE_KEY;

import { createRequire } from 'node:module';
import { readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const dir = resolve(process.argv[2] || 'build/toeic');
process.env.TOEIC_DIR = dir;
const require = createRequire(import.meta.url);
const handler = require('../../api/toeic.js');
const { setUserPass } = require('../../api/_firebase.js');

let ip = 0;
function call({ method = 'GET', body, query, token, headers = {} } = {}) {
  return new Promise((resolveCall) => {
    const req = { method, body, query, headers: { 'x-real-ip': '10.9.' + Math.floor(++ip / 250) + '.' + (ip % 250), ...(token ? { authorization: 'Bearer ' + token } : {}), ...headers }, socket: {} };
    const h = {};
    const res = {
      statusCode: 200,
      setHeader(k, v) { h[k.toLowerCase()] = v; },
      status(c) { this.statusCode = c; return this; },
      send(b) { resolveCall({ code: this.statusCode, headers: h, json: JSON.parse(b) }); },
      end(b) { resolveCall({ code: this.statusCode, headers: h, buf: b }); },
    };
    Promise.resolve(handler(req, res)).catch((e) => resolveCall({ code: 500, json: { error: String(e) } }));
  });
}

const EXPECT = { 1: [1, 6], 2: [7, 31], 3: [32, 70], 4: [71, 100], 5: [101, 130], 6: [131, 146], 7: [147, 200] };
const GIVEAWAY = new Set(['a', 'e', 'answer', 'key']);
const hasGiveaway = (v) => (Array.isArray(v) ? v.some(hasGiveaway) : v && typeof v === 'object' ? Object.entries(v).some(([k, x]) => GIVEAWAY.has(k) || hasGiveaway(x)) : false);
const isWebp = (b) => b.length > 12 && b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP';
const isMp3 = (b) => b.length > 3 && (b.toString('latin1', 0, 3) === 'ID3' || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0));

const query = (url) => Object.fromEntries(new URL(url, 'http://x').searchParams);
let problems = 0;
const bad = (m) => { problems++; console.log('    ✗ ' + m); };

const index = JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8'));
const rows = [];
let totalQ = 0;
for (const { id } of index.sets) {
  const uid = 'e2e-set' + id;
  await setUserPass(uid, { exp: Date.now() + 86_400_000, plan: 'd1', sid: 'e2e' });
  const token = 'mock-' + uid;
  const truth = JSON.parse(readFileSync(join(dir, 's' + id, 'data.json'), 'utf8'));
  for (let p = 1; p <= 7; p++) {
    const label = 'set ' + id + ' part ' + p;
    const row = { label, q: 0, pics: 0, audio: '-', answers: 0 };
    const r = await call({ query: { set: String(id), part: String(p) }, token });
    if (r.code !== 200) { bad(label + ' did not load: ' + r.code + ' ' + JSON.stringify(r.json)); rows.push(row); continue; }
    const P = r.json;
    if (hasGiveaway(P)) bad(label + ' sends an answer/explanation key before any pick');
    const items = P.items || P.groups.flatMap((g) => g.items);
    const [lo, hi] = EXPECT[p];
    if (items.length !== hi - lo + 1 || items.some((it, i) => it.n !== lo + i)) bad(label + ': questions are not ' + lo + '-' + hi + ' in order');
    row.q = items.length;
    totalQ += items.length;

    // pictures
    const urls = [...items.filter((it) => it.img).map((it) => it.img), ...(P.groups || []).flatMap((g) => g.imgs || [])];
    for (const u of urls) {
      const m = await call({ query: query(u), headers: { 'sec-fetch-site': 'same-origin' } });
      if (m.code !== 200 || !m.buf || !isWebp(m.buf) || m.headers['content-type'] !== 'image/webp') bad(label + ': picture did not load (' + m.code + ') ' + u.slice(0, 60));
      else row.pics++;
    }
    if (p === 1 && row.pics !== 6) bad(label + ': expected 6 photos, got ' + row.pics);
    if (p >= 6 && (P.groups || []).some((g) => !(g.imgs && g.imgs.length))) bad(label + ': a passage has no picture');

    // audio, fetched in slices like a browser does, must come back byte for byte
    if (p <= 4) {
      if (!P.audio) bad(label + ': no audio');
      else {
        const file = join(dir, 's' + id, truth.parts[p].audio.file);
        const want = readFileSync(file);
        const chunks = [];
        let pos = 0;
        let slices = 0;
        while (pos < want.length) {
          const a = await call({ query: query(P.audio.src), headers: { range: 'bytes=' + pos + '-' } });
          const whole = a.code === 200 && pos === 0 && a.buf && a.buf.length === want.length;       // a small file (Part 1) fits in one response
          if (!whole && (a.code !== 206 || !a.buf || a.buf.length === 0 || a.buf.length > 2 * 1024 * 1024)) { bad(label + ': audio slice at ' + pos + ' → ' + a.code); break; }
          if (pos === 0 && !isMp3(a.buf)) bad(label + ': audio does not start like an mp3');
          chunks.push(a.buf);
          pos += a.buf.length;
          slices++;
        }
        const got = Buffer.concat(chunks);
        if (got.length !== want.length || Buffer.compare(got, want) !== 0) bad(label + ': audio does not reassemble to the original file');
        else row.audio = (want.length / 1048576).toFixed(1) + ' MB / ' + slices + ' slices';
        if (Math.abs(P.audio.sec - truth.parts[p].audio.sec) > 0.01) bad(label + ': audio length differs');
        statSync(file);
      }
    }

    // answers: ask for every question (a pick of 0 each), compare with the key in data.json
    const tItems = truth.parts[p].items || truth.parts[p].groups.flatMap((g) => g.items);
    const c = await call({ method: 'POST', token, body: { op: 'check', set: id, part: p, items: items.map((it) => ({ n: it.n, pick: 0 })) } });
    if (c.code !== 200) bad(label + ': check → ' + c.code + ' ' + JSON.stringify(c.json));
    else {
      for (const t of tItems) {
        const got = c.json.results[t.n];
        if (!got || got.a !== t.a) bad(label + ' Q' + t.n + ': server says ' + (got && got.a) + ', key is ' + t.a);
        else row.answers++;
      }
      // the reasoning (and for Parts 1-4 the script) arrives with the answer; the stretches of audio are in order and inside the recording
      const noE = tItems.filter((t) => !(c.json.results[t.n] || {}).e).length;
      if (noE) bad(label + ': ' + noE + ' question(s) come back without reasoning');
      if (p <= 4) {
        const noTx = tItems.filter((t) => !(c.json.results[t.n] || {}).tx).length;
        if (noTx) bad(label + ': ' + noTx + ' question(s) come back without the script');
        const units = P.groups ? P.groups : P.items;
        let prevEnd = -1;
        for (const u of units) {
          if (!u.at || !(u.at[0] >= 0 && u.at[1] > u.at[0] && u.at[1] <= P.audio.sec + 0.5) || u.at[0] < prevEnd - 0.5) bad(label + ': audio stretch of ' + (u.id || u.n) + ' is missing or out of order');
          else prevEnd = u.at[1];
        }
      }
      // choices must line up with the answer: the answer index points at a real choice
      for (const t of tItems) if (!t.c[t.a] || String(t.c[t.a]).trim() === '') bad(label + ' Q' + t.n + ': the answer points at an empty choice');
    }
    rows.push(row);
  }
}

// the Ebook pages
{
  const uid = 'e2e-tips';
  await setUserPass(uid, { exp: Date.now() + 86_400_000, plan: 'd1', sid: 'e2e' });
  const t = await call({ query: { op: 'tips' }, token: 'mock-' + uid });
  if (t.code !== 200) bad('tips did not load: ' + t.code + ' ' + JSON.stringify(t.json));
  else {
    let n = 0;
    for (const sec of t.json.sections) {
      for (const pg of sec.pages) {
        const m = await call({ query: query(pg.src), headers: { 'sec-fetch-site': 'same-origin' } });
        if (m.code !== 200 || !m.buf || !isWebp(m.buf)) bad('tips picture failed: ' + sec.id + ' ' + pg.cap);
        else n++;
      }
    }
    rows.push({ label: 'tips', q: 0, pics: n, audio: '-', answers: 0 });
    if ((await call({ query: { op: 'tips' } })).code !== 401) bad('tips are served without a sign-in');
  }
}

console.log('set/part'.padEnd(16) + 'questions'.padEnd(11) + 'pictures'.padEnd(10) + 'answers'.padEnd(9) + 'audio');
for (const r of rows) console.log(r.label.padEnd(16) + String(r.q).padEnd(11) + String(r.pics).padEnd(10) + String(r.answers).padEnd(9) + r.audio);
console.log('\n' + totalQ + ' questions through the endpoint · ' + (problems ? problems + ' problem(s)' : 'no problems'));
process.exit(problems ? 1 : 0);
