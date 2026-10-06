// Security checks for the content and quiz endpoints, run against an in-memory Firestore (no network, no Firebase key).
// Usage: node scripts/test-api.mjs   (exit code 1 on failure)
//
//   - who may get which question set / lesson (not signed in · signed in · member)
//   - the answers and explanations are NOT in anything sent before a pick
//   - bad input is refused: out-of-range picks, wrong types, oversize batches, odd set names
//   - the adaptive placement test runs on the server and a step can only be answered once
//   - the fake-payment mode can never switch on where Vercel runs
//   - the browser-side billing.js and the server-side entitlements say the same thing
//   - nothing answer-bearing is left under public/
process.env.PAY_MODE = 'mock';
delete process.env.VERCEL;
delete process.env.VERCEL_ENV;
delete process.env.FIREBASE_PRIVATE_KEY;

import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const content = require('../api/content.js');
const quiz = require('../api/quiz.js');
const pay = require('../api/_pay.js');
const ent = require('../api/_entitlements.js');
const bank = require('../api/_bank.js');
const { db, setUserPass } = require('../api/_firebase.js');
const { isSyncKey } = require('../api/_sync.js');
const { limited } = require('../api/_ratelimit.js');
const passApi = require('../api/pass.js');
const checkout = require('../api/checkout.js');
const claim = require('../api/claim.js');
const translate = require('../api/translate.js');
const wm = require('../api/_watermark.js');
const abuse = require('../api/_abuse.js');
const { writeChanges } = require('../api/_sync.js');

let failed = 0;
async function test(name, fn) {
  try { await fn(); console.log('  ✓ ' + name); } catch (e) { failed++; console.log('  ✗ ' + name + '\n      ' + (e.stack || e).toString().split('\n').slice(0, 4).join('\n      ')); }
}

let ipCounter = 0;
// one request → { code, body }; every call comes from a fresh address so the limits do not interfere
function call(handler, { method = 'POST', body, query, token, ip } = {}) {
  return new Promise((resolve) => {
    const req = { method, body, query, headers: { 'x-real-ip': ip || '10.0.' + Math.floor(++ipCounter / 250) + '.' + (ipCounter % 250), ...(token ? { authorization: 'Bearer ' + token } : {}) }, socket: {} };
    const res = { setHeader() {}, status(c) { this.code = c; return this; }, send(b) { resolve({ code: this.code, body: JSON.parse(b) }); } };
    Promise.resolve(handler(req, res)).catch((e) => resolve({ code: 500, body: { error: String(e) } }));
  });
}

const FREE = 'mock-free-user';
const MEMBER = 'mock-member-user';
await setUserPass('member-user', { exp: Date.now() + 86_400_000, plan: 'd1', sid: 'test' });
await setUserPass('expired-user', { exp: Date.now() - 1000, plan: 'd1', sid: 'old' });
const EXPIRED = 'mock-expired-user';

const hasKey = (v, keys) => {
  if (Array.isArray(v)) return v.some((x) => hasKey(x, keys));
  if (v && typeof v === 'object') return Object.entries(v).some(([k, x]) => keys.includes(k) || hasKey(x, keys));
  return false;
};

console.log('who may get what');
for (const set of ['conversations', 'extra', 'cloze']) {
  await test(set + ': not signed in → 401, signed in but not a member → 402, expired → 402, member → 200', async () => {
    assert.equal((await call(content, { method: 'GET', query: { set } })).code, 401);
    assert.equal((await call(content, { method: 'GET', query: { set }, token: FREE })).code, 402);
    assert.equal((await call(content, { method: 'GET', query: { set }, token: EXPIRED })).code, 402);
    assert.equal((await call(content, { method: 'GET', query: { set }, token: MEMBER })).code, 200);
  });
}
await test('grammar is free for everyone', async () => {
  assert.equal((await call(content, { method: 'GET', query: { set: 'grammar' } })).code, 200);
});
await test('lessons: A1 free, A2 and above need a membership', async () => {
  const a1 = bank.lessons().find((l) => l.level === 'A1').id;
  const b1 = bank.lessons().find((l) => l.level === 'B1').id;
  assert.equal((await call(content, { method: 'GET', query: { set: 'lesson', id: a1 } })).code, 200);
  assert.equal((await call(content, { method: 'GET', query: { set: 'lesson', id: b1 } })).code, 401);
  assert.equal((await call(content, { method: 'GET', query: { set: 'lesson', id: b1 }, token: FREE })).code, 402);
  const ok = await call(content, { method: 'GET', query: { set: 'lesson', id: b1 }, token: MEMBER });
  assert.equal(ok.code, 200);
  assert.ok(ok.body.lesson.sections.length > 0 && ok.body.lesson.exercises.length > 0);
});
await test('a forged / garbage token is the same as no token', async () => {
  for (const t of ['mock-', 'garbage', 'Bearer x', 'x'.repeat(5000)]) {
    assert.equal((await call(content, { method: 'GET', query: { set: 'conversations' }, token: t })).code, 401);
  }
});

console.log('answers stay on the server');
await test('question lists carry no answer, explanation or mark-up', async () => {
  for (const set of ['grammar', 'conversations', 'extra']) {
    const r = await call(content, { method: 'GET', query: { set }, token: MEMBER });
    assert.ok(r.body.questions.length > 40);
    assert.ok(!hasKey(r.body, ['a', 'e', 'clue', 'clues']), set + ' leaks a/e');
  }
  const c = await call(content, { method: 'GET', query: { set: 'cloze' }, token: MEMBER });
  assert.ok(!hasKey(c.body, ['a', 'e']), 'cloze leaks a/e');
});
await test('the answer comes back only for a valid pick, with its explanation', async () => {
  const q = bank.question('grammar', 1);
  const r = await call(quiz, { body: { op: 'check', set: 'grammar', items: [{ n: 1, pick: 0 }] } });
  assert.equal(r.code, 200);
  assert.equal(r.body.results[1].a, q.a);
  assert.equal(r.body.results[1].e, q.e);
});
await test('public/ holds no question bank, answer or lesson text', () => {
  const dir = join(root, 'public', 'assets', 'data');
  for (const f of ['grammar', 'conversations', 'extra', 'cloze', 'lessons', 'placement', 'cat-bank']) {
    assert.ok(!existsSync(join(dir, f + '.js')), f + '.js is still public');
  }
  for (const f of readdirSync(dir)) assert.ok(!/^clues-/.test(f), f + ' is public');
  const manifest = readFileSync(join(dir, 'manifest.js'), 'utf8');
  assert.ok(!/"(a|e|sections|exercises|c)":/.test(manifest), 'manifest carries answers or lesson text');
});

console.log('bad input is refused');
await test('/api/quiz check validates everything', async () => {
  const bad = [
    { op: 'check', set: 'grammar', items: [{ n: 1, pick: 99 }] },
    { op: 'check', set: 'grammar', items: [{ n: 1, pick: -1 }] },
    { op: 'check', set: 'grammar', items: [{ n: 1, pick: '0' }] },
    { op: 'check', set: 'grammar', items: [{ n: 1.5, pick: 0 }] },
    { op: 'check', set: 'grammar', items: [{ n: 99999, pick: 0 }] },
    { op: 'check', set: 'grammar', items: [{ n: '__proto__', pick: 0 }] },
    { op: 'check', set: 'grammar', items: [] },
    { op: 'check', set: 'grammar', items: 'x' },
    { op: 'check', set: 'grammar', items: Array.from({ length: 11 }, () => ({ n: 1, pick: 0 })) },
    { op: 'check', set: 'grammar' },
    { op: 'check', set: '__proto__', items: [{ n: 1, pick: 0 }] },
    { op: 'check', set: 'constructor', items: [{ n: 1, pick: 0 }] },
    { op: 'check', set: 'cloze', items: [{ n: 1, pick: 0 }] },
    { op: 'check', set: ['grammar'], items: [{ n: 1, pick: 0 }] },
    { op: 'nope' },
    { op: ['check'] },
    {},
  ];
  for (const body of bad) {
    const r = await call(quiz, { body });
    assert.ok(r.code === 400, JSON.stringify(body).slice(0, 80) + ' → ' + r.code);
  }
});
await test('a members-only check / cloze / exam is refused for non-members', async () => {
  assert.equal((await call(quiz, { body: { op: 'check', set: 'conversations', items: [{ n: 1, pick: 0 }] } })).code, 401);
  assert.equal((await call(quiz, { token: FREE, body: { op: 'check', set: 'conversations', items: [{ n: 1, pick: 0 }] } })).code, 402);
  assert.equal((await call(quiz, { token: FREE, body: { op: 'cloze', idx: 0, picks: [0, 0, 0, 0, 0, 0, 0] } })).code, 402);
  assert.equal((await call(quiz, { token: FREE, body: { op: 'exam', items: [{ src: 'grammar', n: 1, pick: 0 }], cloze: [] } })).code, 402);
  assert.equal((await call(quiz, { body: { op: 'exam', items: [{ src: 'grammar', n: 1, pick: 0 }], cloze: [] } })).code, 401);
});
await test('exam grading: members get answers; bad items are refused', async () => {
  const ok = await call(quiz, { token: MEMBER, body: { op: 'exam', items: [{ src: 'grammar', n: 1, pick: 0 }, { src: 'conversations', n: 1, pick: null }], cloze: [{ idx: 0, picks: Array(bank.bank('cloze')[0].blanks.length).fill(0) }] } });
  assert.equal(ok.code, 200);
  assert.equal(ok.body.results['grammar:1'].a, bank.question('grammar', 1).a);
  assert.equal(ok.body.cloze[0].length, bank.bank('cloze')[0].blanks.length);
  for (const body of [
    { op: 'exam', items: [{ src: 'cloze', n: 1, pick: 0 }] },
    { op: 'exam', items: [{ src: '__proto__', n: 1, pick: 0 }] },
    { op: 'exam', items: [{ src: 'grammar', n: 1, pick: 50 }] },
    { op: 'exam', items: [], cloze: [] },
    { op: 'exam', items: [], cloze: [{ idx: 0, picks: [0] }] },
    { op: 'exam', items: Array.from({ length: 121 }, () => ({ src: 'grammar', n: 1, pick: 0 })) },
  ]) assert.equal((await call(quiz, { token: MEMBER, body })).code, 400, JSON.stringify(body).slice(0, 70));
});
await test('content: unknown sets, odd ids and non-string params are rejected', async () => {
  for (const query of [{ set: '../content/lessons' }, { set: 'lessons' }, { set: '__proto__' }, { set: ['grammar', 'extra'] }, {}, { set: 'lesson' }, { set: 'lesson', id: '../../etc/passwd' }, { set: 'lesson', id: '__proto__' }]) {
    const r = await call(content, { method: 'GET', query, token: MEMBER });
    assert.ok(r.code === 400 || r.code === 404, JSON.stringify(query) + ' → ' + r.code);
  }
  assert.equal((await call(content, { method: 'POST', query: { set: 'grammar' } })).code, 405);
});
await test('sync keys: only the allow-listed progress keys pass (no paths, no prototype keys)', () => {
  for (const k of ['__proto__', 'constructor', 'a/b', '../x', 'users/other/data/x', 'grammar:state/..', 'grammar:state\n', '', null, 5, {}, 'x'.repeat(100)]) assert.equal(isSyncKey(k), false, String(k));
  assert.equal(isSyncKey('grammar:state'), true);
});

console.log('placement runs on the server');
await test('a full run ends with a level and a review; a step can be answered only once', async () => {
  let r = await call(quiz, { body: { op: 'placement' } });
  assert.equal(r.code, 200);
  assert.ok(!hasKey(r.body, ['a', 'e']), 'question carries the answer');
  const sid = r.body.sid;
  const first = r.body;
  // answer step 0, then try to answer step 0 again with another pick: refused (the session has moved on)
  r = await call(quiz, { body: { op: 'placement', sid, step: 0, pick: 0 } });
  assert.equal(r.body.step, 1);
  const replay = await call(quiz, { body: { op: 'placement', sid, step: 0, pick: 1 } });
  assert.equal(replay.body.stale, true);
  assert.equal(replay.body.step, 1, 'replay must not advance the test');
  assert.notEqual(replay.body.question.key, first.question.key);
  let guard = 0;
  while (!r.body.done && guard++ < 40) r = await call(quiz, { body: { op: 'placement', sid, step: r.body.step, pick: 0 } });
  assert.equal(r.body.done, true);
  assert.ok(['pre-A1', 'A1', 'A2', 'B1', 'B2', 'B2+'].includes(r.body.result.level));
  assert.ok(r.body.result.n >= 12 && r.body.result.n <= 25);
  assert.ok(r.body.result.review.every((x) => Number.isInteger(x.a) && x.e));
});
await test('placement refuses bad session ids, picks and steps', async () => {
  for (const body of [
    { op: 'placement', sid: '../x' }, { op: 'placement', sid: 'short' }, { op: 'placement', sid: { a: 1 } },
    { op: 'placement', sid: 'a'.repeat(22) + '/..' }, { op: 'placement', sid: ['x'.repeat(22)] },
  ]) assert.equal((await call(quiz, { body })).code, 400, JSON.stringify(body).slice(0, 60));
  assert.equal((await call(quiz, { body: { op: 'placement', sid: 'AAAAAAAAAAAAAAAAAAAAAA', step: 0, pick: 0 } })).code, 404);
  const s = await call(quiz, { body: { op: 'placement' } });
  for (const pick of [99, -1, 1.5, '1', null, {}]) {
    assert.equal((await call(quiz, { body: { op: 'placement', sid: s.body.sid, step: 0, pick } })).code, 400, 'pick ' + JSON.stringify(pick));
  }
  const after = await call(quiz, { body: { op: 'placement', sid: s.body.sid } });
  assert.equal(after.body.step, 0, 'rejected picks must not advance the test');
});

console.log('payments and limits');
await test('fake payment mode never switches on where Vercel runs', () => {
  assert.equal(pay.isMock(), true);
  process.env.VERCEL = '1';
  assert.equal(pay.isMock(), false);
  delete process.env.VERCEL;
  process.env.VERCEL_ENV = 'preview';
  assert.equal(pay.isMock(), false);
  delete process.env.VERCEL_ENV;
});
await test('rate limiter counts per account and is shared through the store', async () => {
  const req = { headers: { 'x-real-ip': '7.7.7.7' }, socket: {} };
  const got = [];
  for (let i = 0; i < 5; i++) got.push(await limited(req, 'test-bucket', 3, { uid: 'rl-user' }));
  assert.deepEqual(got, [false, false, false, true, true]);
  assert.equal(await limited(req, 'test-bucket', 3, { uid: 'someone-else' }), false);
});
await test('the client address cannot be chosen by the client', () => {
  assert.equal(pay.clientIp({ headers: { 'x-vercel-forwarded-for': '1.1.1.1', 'x-forwarded-for': '6.6.6.6' } }), '1.1.1.1');
  assert.equal(pay.clientIp({ headers: { 'x-real-ip': '2.2.2.2', 'x-forwarded-for': '6.6.6.6' } }), '2.2.2.2');
});
await test('billing.js (shown in the page) and _entitlements.js (enforced) agree', () => {
  const sandbox = { window: {}, location: { search: '' }, sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} }, URLSearchParams };
  vm.createContext(sandbox);
  vm.runInContext(readFileSync(join(root, 'public', 'assets', 'data', 'billing.js'), 'utf8'), sandbox);
  const b = sandbox.window.CEFR_DATA.billing;
  assert.equal(b.enabled, ent.BILLING_ENABLED);
  assert.deepEqual(JSON.parse(JSON.stringify(b.premium)), ent.PREMIUM);
});

console.log('accounts and payments');
await test('an old signed pass token is no longer a membership, and checkout needs a sign-in', async () => {
  const old = pay.sign({ exp: Date.now() + 86_400_000, sid: 'legacy1', plan: 'd1' });
  assert.equal((await call(passApi, { method: 'GET', query: { token: old } })).body.valid, false);
  assert.equal((await call(passApi, { method: 'GET', token: MEMBER })).body.valid, true);
  assert.equal((await call(passApi, { method: 'GET', token: FREE })).body.valid, false);
  assert.equal((await call(checkout, { body: { plan: 'd1', token: old } })).code, 401);
  const ok = await call(checkout, { token: FREE, body: { plan: 'd1' } });
  assert.equal(ok.code, 200);
  assert.ok(ok.body.url.includes('free-user'), 'the session names the account');
  assert.equal((await call(checkout, { token: FREE, body: { plan: 'nope' } })).code, 400);
});
await test('claim: credits the account named in the session, returns nothing copyable', async () => {
  const r = await call(claim, { method: 'GET', query: { session_id: 'mock_d3_0_claimtester' } });
  assert.equal(r.code, 200);
  assert.equal(r.body.token, undefined);
  assert.ok(r.body.exp > Date.now());
  const again = await call(claim, { method: 'GET', query: { session_id: 'mock_d3_0_claimtester' } });
  assert.equal(again.body.exp, r.body.exp, 'asking again adds no days');
  for (const id of ['x', 'a/b/c/d/e', '../../x', 'a b c d e f', 'x'.repeat(300)]) {
    assert.equal((await call(claim, { method: 'GET', query: { session_id: id } })).code, 400, id.slice(0, 20));
  }
});
await test('claim with Stripe: the charged amount, currency and mode must match the plan', async () => {
  const realFetch = globalThis.fetch;
  const session = (over) => ({ payment_status: 'paid', mode: 'payment', currency: 'thb', amount_total: 2000, created: 1_800_000_000, metadata: { plan: 'd1', prev_exp: '0', uid: 'stripe-user' }, ...over });
  let next = session();
  globalThis.fetch = async () => ({ ok: true, json: async () => next });
  process.env.PAY_MODE = '';
  process.env.STRIPE_SECRET_KEY = 'sk_test_x';
  try {
    assert.equal((await call(claim, { method: 'GET', query: { session_id: 'cs_test_ok1234' } })).code, 200);
    for (const over of [{ amount_total: 100 }, { currency: 'usd' }, { mode: 'subscription' }, { metadata: { plan: 'd30', prev_exp: '0', uid: 'stripe-user' } }]) {
      next = session(over);
      assert.equal((await call(claim, { method: 'GET', query: { session_id: 'cs_test_bad' + Math.random().toString(36).slice(2, 8) } })).code, 400, JSON.stringify(over));
    }
    next = session({ payment_status: 'unpaid' });
    assert.equal((await call(claim, { method: 'GET', query: { session_id: 'cs_test_unpaid1' } })).code, 402);
    next = session({ metadata: { plan: 'd1', prev_exp: '0' } });                 // no account in the session and nobody signed in
    assert.equal((await call(claim, { method: 'GET', query: { session_id: 'cs_test_noacct1' } })).code, 401);
  } finally {
    globalThis.fetch = realFetch;
    process.env.PAY_MODE = 'mock';
    delete process.env.STRIPE_SECRET_KEY;
  }
});

console.log('abuse and injection');
await test('translate: other sites and bad text are refused before any provider is called', async () => {
  const withHeaders = (headers, q) => new Promise((resolve) => {
    const req = { method: 'GET', query: { q }, headers: { 'x-real-ip': '66.6.6.' + ++ipCounter, ...headers }, socket: {} };
    const res = { setHeader() {}, status(c) { this.code = c; return this; }, send(b) { resolve({ code: this.code, body: JSON.parse(b) }); } };
    translate(req, res);
  });
  assert.equal((await withHeaders({ 'sec-fetch-site': 'cross-site' }, 'hello')).code, 403);
  assert.equal((await withHeaders({ origin: 'https://evil.example', host: 'cefr.example' }, 'hello')).code, 403);
  assert.equal((await withHeaders({ 'sec-fetch-site': 'same-origin' }, '')).code, 400);
  assert.equal((await withHeaders({ 'sec-fetch-site': 'same-origin' }, 'x'.repeat(301))).code, 400);
  assert.equal((await withHeaders({ 'sec-fetch-site': 'same-origin' }, '12345')).code, 400);
});
await test('sync: odd change sets never reach the database', async () => {
  const written = [];
  const fakeDb = {
    collection: () => ({ doc: () => ({ collection: () => ({ doc: (id) => ({ async get() { return { exists: false }; }, async set() { written.push(id); } }), async get() { return { size: 0 }; } }) }) }),
  };
  const bad = [
    JSON.parse('{"__proto__":{"v":"1","t":1}}'), JSON.parse('{"constructor":{"v":"1","t":1}}'),
    { 'users/other/data/x': { v: '1', t: 1 } }, { '../x': { v: '1', t: 1 } }, { 'grammar:state/../../x': { v: '1', t: 1 } },
    { 'grammar:state': { v: '{bad json', t: 1 } }, { 'grammar:state': { v: '1', t: 'now' } }, { 'grammar:state': { v: 5, t: 1 } },
    { 'grammar:state': { v: 'x'.repeat(70_000), t: 1 } }, { 'grammar:state': null },
  ];
  for (const changes of bad) {
    const r = await writeChanges(fakeDb, 0, 'u1', changes);
    assert.deepEqual(r.applied, [], JSON.stringify(changes).slice(0, 60));
  }
  for (const odd of [null, undefined, 'str', 5, [], [1, 2]]) assert.deepEqual((await writeChanges(fakeDb, 0, 'u1', odd)).applied, []);
  assert.deepEqual(written, []);
  assert.deepEqual((await writeChanges(fakeDb, 0, 'u1', { 'grammar:state': { v: '{"ok":1}', t: 5 } })).applied, ['grammar:state']);
  assert.deepEqual(written, ['grammar~state']);
});

console.log('copying: watermark, daily cap, blocking');
const INVISIBLE = /[\u200b\u200c\u2060]/g;
await test('signed-in readers get their own invisible tag; anonymous readers none; ids and choices stay clean', async () => {
  const a1 = bank.lessons().find((l) => l.level === 'A1');
  const mine = await call(content, { method: 'GET', query: { set: 'lesson', id: a1.id }, token: 'mock-reader-a' });
  const other = await call(content, { method: 'GET', query: { set: 'lesson', id: a1.id }, token: 'mock-reader-b' });
  const anon = await call(content, { method: 'GET', query: { set: 'lesson', id: a1.id } });
  const text = JSON.stringify(mine.body.lesson);
  const tagsA = wm.decode(text);
  assert.ok(tagsA.length >= 5, 'tag appears in many places');
  assert.ok(tagsA.every((t) => t === wm.tagOf('reader-a')), 'every copy is the reader\'s tag');
  assert.ok(wm.decode(JSON.stringify(other.body.lesson)).every((t) => t === wm.tagOf('reader-b')));
  assert.notEqual(wm.tagOf('reader-a'), wm.tagOf('reader-b'));
  assert.equal(wm.decode(JSON.stringify(anon.body.lesson)).length, 0);
  // removing the invisible characters gives back exactly the original lesson (nothing visible changed)
  assert.deepEqual(JSON.parse(text.replace(INVISIBLE, '')), JSON.parse(JSON.stringify(a1)));
  assert.equal(mine.body.lesson.id, a1.id);
  assert.equal(JSON.stringify(mine.body.lesson.exercises.map((e) => e.c)), JSON.stringify(a1.exercises.map((e) => e.c)));
});
await test('question lists, explanations and cloze text carry the tag for signed-in readers only', async () => {
  const q = await call(content, { method: 'GET', query: { set: 'grammar' }, token: 'mock-reader-a' });
  assert.ok(q.body.questions.every((x) => wm.decode(x.q)[0] === wm.tagOf('reader-a')));
  assert.equal(q.body.questions[0].q.replace(INVISIBLE, ''), bank.question('grammar', 1).q);
  const anon = await call(content, { method: 'GET', query: { set: 'grammar' } });
  assert.ok(anon.body.questions.every((x) => wm.decode(x.q).length === 0));
  const c = await call(content, { method: 'GET', query: { set: 'cloze' }, token: MEMBER });
  assert.equal(wm.decode(c.body.passages[0].text)[0], wm.tagOf('member-user'));
  const chk = await call(quiz, { token: 'mock-reader-a', body: { op: 'check', set: 'grammar', items: [{ n: 2, pick: 0 }] } });
  assert.equal(wm.decode(chk.body.results[2].e)[0], wm.tagOf('reader-a'));
  assert.equal(chk.body.results[2].e.replace(INVISIBLE, ''), bank.question('grammar', 2).e);
  const chkAnon = await call(quiz, { body: { op: 'check', set: 'grammar', items: [{ n: 2, pick: 0 }] } });
  assert.equal(chkAnon.body.results[2].e, bank.question('grammar', 2).e);
});
await test('the tag can be traced back to an account and cannot be forged without the secret', () => {
  const found = wm.decode('copied text ' + wm.encode(wm.tagOf('victim')) + ' more');
  assert.deepEqual(found, [wm.tagOf('victim')]);
  assert.equal(wm.tagOf('victim').length, 10);
  const saved = process.env.PASS_SECRET;
  process.env.PASS_SECRET = 'another-secret';
  const other = wm.tagOf('victim');
  if (saved === undefined) delete process.env.PASS_SECRET; else process.env.PASS_SECRET = saved;
  assert.notEqual(other, wm.tagOf('victim'), 'a different secret gives a different tag');
});
await test('at most 15 different lessons a day per account; reopening one is free; a 429 is not the end of the world', async () => {
  const ids = bank.lessons().map((l) => l.id);
  const token = 'mock-copier-1';
  await setUserPass('copier-1', { exp: Date.now() + 86_400_000, plan: 'd1', sid: 'cp1' });
  const codes = [];
  for (const id of ids.slice(0, 17)) codes.push((await call(content, { method: 'GET', query: { set: 'lesson', id }, token })).code);
  assert.deepEqual(codes.slice(0, 15), Array(15).fill(200));
  assert.deepEqual(codes.slice(15), [429, 429]);
  assert.equal((await call(content, { method: 'GET', query: { set: 'lesson', id: ids[0] }, token })).code, 200, 'a lesson already opened today');
  assert.equal((await call(content, { method: 'GET', query: { set: 'grammar' }, token })).code, 200, 'other content is unaffected');
});
await test('hitting the cap on 3 different days blocks members-only content (free content stays), until cleared by hand', async () => {
  const RealDate = Date;
  const at = async (days, fn) => {
    globalThis.Date = class extends RealDate {
      constructor(...a) { if (a.length) super(...a); else super(RealDate.now() + days * 86_400_000); }
      static now() { return RealDate.now() + days * 86_400_000; }
    };
    try { return await fn(); } finally { globalThis.Date = RealDate; }
  };
  await setUserPass('copier-2', { exp: Date.now() + 10 * 86_400_000, plan: 'd7', sid: 'cp2' });
  const token = 'mock-copier-2';
  assert.equal((await call(content, { method: 'GET', query: { set: 'conversations' }, token })).code, 200);
  assert.equal(await abuse.strike('copier-2'), false);
  await at(1, async () => { assert.equal(await abuse.strike('copier-2'), false); });
  await at(2, async () => { assert.equal(await abuse.strike('copier-2'), true); });
  assert.equal((await call(content, { method: 'GET', query: { set: 'conversations' }, token })).code, 403);
  assert.equal((await call(content, { method: 'GET', query: { set: 'conversations' }, token })).body.error, 'account_blocked');
  assert.equal((await call(quiz, { token, body: { op: 'check', set: 'extra', items: [{ n: 1, pick: 0 }] } })).code, 403);
  assert.equal((await call(content, { method: 'GET', query: { set: 'grammar' }, token })).code, 200, 'free content still works');
  assert.equal((await call(passApi, { method: 'GET', token })).body.valid, true, 'the payment itself is untouched');
  await db.collection('users').doc('copier-2').set({ contentBlocked: false }, { merge: true });
  assert.equal((await call(content, { method: 'GET', query: { set: 'conversations' }, token })).code, 200, 'cleared by hand');
});

console.log('styles');
await test('a <dialog> rule never sets display unless it is limited to [open] (it would keep a closed dialog on screen)', () => {
  const css = readFileSync(join(root, 'public', 'assets', 'css', 'style.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const isDialog = (sel) => /(^|[\s,>])(dialog|\.dialog|\.[\w-]+-dialog)(?![\w-])/.test(sel);       // the element or a class named *-dialog
  const bad = [];
  for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const sel = m[1].trim();
    if (isDialog(sel) && !/\[open\]|:modal|::backdrop/.test(sel) && /(^|;|\s)display\s*:/.test(m[2])) bad.push(sel);
  }
  assert.deepEqual(bad, [], 'these dialog rules set display on a closed dialog');
  // the check itself must be able to fail: the stylesheet of the broken version had exactly this
  assert.ok(isDialog('.upd-dialog') && !isDialog('.dialog-actions'));
});

console.log('TOEIC');
await test('TOEIC Part 5 is served like the other sets: no answers up front, the answer after a pick, every item has a source', async () => {
  const r = await call(content, { method: 'GET', query: { set: 'toeic5' } });
  assert.equal(r.code, 200);
  assert.equal(r.body.questions.length, 30);
  assert.ok(!hasKey(r.body, ['a', 'e', 'source', 'license']), 'toeic5 leaks answers');
  assert.ok(r.body.questions.every((x) => x.c.length === 4));
  const chk = await call(quiz, { body: { op: 'check', set: 'toeic5', items: [{ n: 1, pick: 0 }] } });
  assert.equal(chk.body.results[1].a, bank.question('toeic5', 1).a);
  assert.equal((await call(quiz, { body: { op: 'check', set: 'toeic5', items: [{ n: 1, pick: 4 }] } })).code, 400);
  assert.ok(bank.bank('toeic5').every((q) => q.source === 'original' || q.license), 'every item states where it came from');
});

console.log('markup trial is counted on the server');
await test('non-members get 3 free mark-ups a day, members always', async () => {
  const seen = [];
  const ip = '55.55.55.55';
  for (let n = 1; n <= 5; n++) {
    const r = await call(quiz, { ip, body: { op: 'check', set: 'grammar', items: [{ n, pick: 0 }] } });
    seen.push(r.body.results[n].clue && r.body.results[n].clue.locked ? 'locked' : r.body.results[n].clue ? 'ok' : 'none');
  }
  assert.deepEqual(seen, ['ok', 'ok', 'ok', 'locked', 'locked']);
  const again = await call(quiz, { ip, body: { op: 'check', set: 'grammar', items: [{ n: 1, pick: 0 }] } });
  assert.ok(again.body.results[1].clue.links, 'looking at the same question again is free');
  for (let n = 1; n <= 5; n++) {
    const m = await call(quiz, { token: MEMBER, body: { op: 'check', set: 'grammar', items: [{ n, pick: 0 }] } });
    assert.ok(m.body.results[n].clue && !m.body.results[n].clue.locked);
  }
});

console.log(failed ? '\n' + failed + ' failed' : '\nall passed');
process.exit(failed ? 1 : 0);
