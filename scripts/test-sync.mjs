// Checks the cloud copy of progress (api/_sync.js) with an in-memory stand-in for Firestore.
// Usage: node scripts/test-sync.mjs   (exit code 1 on failure)
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const { readAll, writeChanges, isSyncKey } = require('../api/_sync.js');
const { createMemDb } = require('../api/_memdb.js');

let failed = 0;
const test = async (name, fn) => {
  try { await fn(); console.log('  ✓', name); } catch (e) { failed++; console.log('  ✗', name, '\n   ', e.message); }
};
const J = JSON.stringify;

console.log('which keys are stored');
await test('progress keys are, device-only things are not', () => {
  for (const k of ['grammar:state', 'grammar:wrong', 'cloze:best', 'placement:last', 'placement:history', 'exam:history', 'learn:progress']) assert.ok(isSyncKey(k), k);
  for (const k of ['trcache', 'translate', 'theme', 'pass', 'pass:exp', 'exam:state', 'sync:meta', '__proto__', 'grammar:../x', 'users/other']) assert.ok(!isSyncKey(k), k);
});

console.log('writeChanges / readAll');
await test('a change is stored and read back', async () => {
  const db = createMemDb();
  const r = await writeChanges(db, 'now', 'u1', { 'grammar:wrong': { v: J([1, 2]), t: 100 } });
  assert.deepEqual(r.applied, ['grammar:wrong']);
  assert.deepEqual(await readAll(db, 'u1'), { 'grammar:wrong': { v: J([1, 2]), t: 100 } });
});

await test('the newer time wins, an older change is ignored', async () => {
  const db = createMemDb();
  await writeChanges(db, 'now', 'u1', { 'grammar:wrong': { v: J([1]), t: 200 } });
  const r = await writeChanges(db, 'now', 'u1', { 'grammar:wrong': { v: J([9]), t: 100 } });
  assert.equal(r.skipped['grammar:wrong'], 'older');
  assert.equal((await readAll(db, 'u1'))['grammar:wrong'].v, J([1]));
  await writeChanges(db, 'now', 'u1', { 'grammar:wrong': { v: J([1, 3]), t: 300 } });
  assert.equal((await readAll(db, 'u1'))['grammar:wrong'].v, J([1, 3]));
});

await test('a removal is kept as a marker so an old device cannot bring the value back', async () => {
  const db = createMemDb();
  await writeChanges(db, 'now', 'u1', { 'grammar:state': { v: J({ a: 1 }), t: 100 } });
  await writeChanges(db, 'now', 'u1', { 'grammar:state': { v: null, t: 200 } });
  assert.deepEqual((await readAll(db, 'u1'))['grammar:state'], { v: null, t: 200 });
  const r = await writeChanges(db, 'now', 'u1', { 'grammar:state': { v: J({ a: 1 }), t: 150 } });
  assert.equal(r.skipped['grammar:state'], 'older');
});

await test('one learner never sees another learner\'s data', async () => {
  const db = createMemDb();
  await writeChanges(db, 'now', 'u1', { 'learn:progress': { v: J({ x: 1 }), t: 1 } });
  assert.deepEqual(await readAll(db, 'u2'), {});
});

console.log('bad input is refused');
await test('keys that are not progress keys are skipped', async () => {
  const db = createMemDb();
  const r = await writeChanges(db, 'now', 'u1', { 'pass': { v: J('x'), t: 1 }, '../x': { v: J(1), t: 1 }, 'grammar:wrong': { v: J([1]), t: 1 } });
  assert.equal(r.skipped.pass, 'not_allowed');
  assert.equal(r.skipped['../x'], 'not_allowed');
  assert.deepEqual(r.applied, ['grammar:wrong']);
});

await test('values must be JSON text of a sensible size, with a numeric time', async () => {
  const db = createMemDb();
  const r = await writeChanges(db, 'now', 'u1', {
    'grammar:wrong': { v: 'not json {', t: 1 },
    'grammar:stats': { v: J({}), t: 'yesterday' },
    'grammar:count': { v: 123, t: 1 },
    'cloze:best': { v: '"' + 'x'.repeat(200_001) + '"', t: 1 },
  });
  assert.equal(r.skipped['grammar:wrong'], 'bad_json');
  assert.equal(r.skipped['grammar:stats'], 'bad_time');
  assert.equal(r.skipped['grammar:count'], 'bad_value');
  assert.equal(r.skipped['cloze:best'], 'bad_value');
  assert.deepEqual(r.applied, []);
});

await test('too many keys in one request is an error', async () => {
  const many = {};
  const keys = ['grammar', 'conversations', 'extra', 'cloze'].flatMap((s) => ['state', 'wrong', 'stats', 'count', 'best', 'order'].map((k) => `${s}:${k}`));
  for (const k of keys) many[k] = { v: '1', t: 1 };
  for (let i = 0; i < 20; i++) many['x' + i] = { v: '1', t: 1 };               // 24 + 20 = 44 entries
  await assert.rejects(() => writeChanges(createMemDb(), 'now', 'u1', many), /too_many_keys/);
});

console.log(failed ? `\n${failed} test(s) failed` : '\nall passed');
process.exit(failed ? 1 : 0);
