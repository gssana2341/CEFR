// Checks that a payment can be redeemed only once, by one account (api/_claims.js), using a tiny in-memory
// stand-in for Firestore. Usage: node scripts/test-claims.mjs   (exit code 1 on failure)
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const { redeemWith, migrateWith } = createRequire(import.meta.url)('../api/_claims.js');

function fakeDb() {
  const store = new Map();                       // "collection/id" → data
  const ref = (col, id) => ({ key: col + '/' + id });
  return {
    collection: (col) => ({ doc: (id) => ref(col, id) }),
    async runTransaction(fn) {
      const writes = [];
      const t = {
        async get(r) { const d = store.get(r.key); return { exists: d !== undefined, data: () => d }; },
        set(r, data, opts) { writes.push([r.key, data, opts]); },
      };
      const out = await fn(t);                   // nothing is written if fn throws
      for (const [key, data, opts] of writes) store.set(key, opts && opts.merge ? { ...(store.get(key) || {}), ...data } : data);
      return out;
    },
    peek: (key) => store.get(key),
  };
}

const DAY = 86_400_000;
const T0 = 1_800_000_000_000;
const buy = { created: T0, prevExp: 0, ms: 7 * DAY, plan: 'd7' };
let failed = 0;
const test = async (name, fn) => {
  try { await fn(); console.log('  ✓', name); } catch (e) { failed++; console.log('  ✗', name, '\n   ', e.message); }
};

console.log('redeemWith');
await test('first claim adds the plan length', async () => {
  const db = fakeDb();
  const r = await redeemWith(db, 'now', 'u1', 's1', buy);
  assert.equal(r.exp, T0 + 7 * DAY);
  assert.equal(r.already, false);
  assert.equal(db.peek('users/u1').exp, T0 + 7 * DAY);
});

await test('claiming the same payment again adds nothing', async () => {
  const db = fakeDb();
  await redeemWith(db, 'now', 'u1', 's1', buy);
  for (let i = 0; i < 5; i++) {
    const r = await redeemWith(db, 'now', 'u1', 's1', buy);
    assert.equal(r.exp, T0 + 7 * DAY);
    assert.equal(r.already, true);
  }
  assert.equal(db.peek('users/u1').exp, T0 + 7 * DAY);
});

await test('another account cannot redeem the same payment', async () => {
  const db = fakeDb();
  await redeemWith(db, 'now', 'u1', 's1', buy);
  await assert.rejects(() => redeemWith(db, 'now', 'u2', 's1', buy), /claimed_by_other/);
  assert.equal(db.peek('users/u2'), undefined);
});

await test('a second payment stacks on the running pass', async () => {
  const db = fakeDb();
  await redeemWith(db, 'now', 'u1', 's1', buy);
  const r = await redeemWith(db, 'now', 'u1', 's2', { ...buy, created: T0 + DAY, prevExp: T0 + 7 * DAY, ms: 3 * DAY });
  assert.equal(r.exp, T0 + 10 * DAY);
});

await test('an old payment claimed late does not shorten a longer pass', async () => {
  const db = fakeDb();
  await redeemWith(db, 'now', 'u1', 's2', { ...buy, ms: 30 * DAY });
  const r = await redeemWith(db, 'now', 'u1', 's1', buy);
  assert.ok(r.exp >= T0 + 30 * DAY);
});

console.log('migrateWith');
const legacy = { sid: 's1', exp: T0 + 7 * DAY, plan: 'd7' };
await test('an old pass moves into an account once', async () => {
  const db = fakeDb();
  assert.equal((await migrateWith(db, 'now', 'u1', legacy)).exp, T0 + 7 * DAY);
  assert.equal((await migrateWith(db, 'now', 'u1', legacy)).exp, T0 + 7 * DAY);
});

await test('the same old pass cannot be copied into a second account', async () => {
  const db = fakeDb();
  await migrateWith(db, 'now', 'u1', legacy);
  await assert.rejects(() => migrateWith(db, 'now', 'u2', legacy), /claimed_by_other/);
});

await test('a payment already redeemed cannot also be migrated by someone else', async () => {
  const db = fakeDb();
  await redeemWith(db, 'now', 'u1', 's1', buy);
  await assert.rejects(() => migrateWith(db, 'now', 'u2', legacy), /claimed_by_other/);
});

await test('a pass without a session id is rejected', async () => {
  await assert.rejects(() => migrateWith(fakeDb(), 'now', 'u1', { exp: T0 }), /invalid_token/);
});

console.log(failed ? `\n${failed} test(s) failed` : '\nall passed');
process.exit(failed ? 1 : 0);
