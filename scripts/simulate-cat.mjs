// Simulates learners of known ability taking the adaptive placement test, to check that it behaves:
// it should find the right level, get harder after right answers, and stop in a sensible number of questions.
// Usage: node scripts/simulate-cat.mjs
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, '..', 'public', 'assets', 'data');
const { create } = createRequire(import.meta.url)('../public/assets/js/cat.js');

const sandbox = { window: {} };
vm.createContext(sandbox);
for (const f of ['grammar', 'extra', 'placement', 'cat-bank']) vm.runInContext(readFileSync(join(dataDir, f + '.js'), 'utf8'), sandbox);
const D = sandbox.window.CEFR_DATA;
if (process.argv[2]) Object.assign(D.cat, JSON.parse(process.argv[2])); // e.g. node scripts/simulate-cat.mjs '{"maxItems":25}'
const cat = create(D);
const pool = cat.buildPool();

// small seeded random generator so the numbers are repeatable
let seed = 12345;
const rng = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };

console.log('question bank:', pool.length, '=', cat.LEVELS.map((lv) => lv + ' ' + pool.filter((p) => p.level === lv).length).join(' · '));
console.log('cut-offs (logits):', cat.cuts.map((c) => c.toFixed(1)).join('  '), '\n');

function run(trueTheta) {
  const used = new Set();
  const answers = [];
  const path = [];
  let est = cat.estimate(answers);
  for (;;) {
    const it = cat.pick(est.theta, pool, used, rng);
    if (!it) break;
    used.add(it.key);
    const right = rng() < cat.prob(trueTheta, it);
    answers.push({ it, right });
    path.push({ b: it.b, right });
    est = cat.estimate(answers);
    if (cat.stop(answers.length, est)) break;
  }
  return { est, n: answers.length, path };
}

const SIMS = 300;
console.log('true θ  true level  | items  est θ   level found  exact  ±1 level  | avg b: first 5 → last 5');
let totalExact = 0;
let totalClose = 0;
let totalCount = 0;
for (let t = -3.5; t <= 3.01; t += 0.5) {
  let n = 0; let th = 0; let exact = 0; let close = 0; let b1 = 0; let b2 = 0;
  const tl = cat.levelIndex(t);
  const found = {};
  for (let s = 0; s < SIMS; s++) {
    const r = run(t);
    n += r.n; th += r.est.theta;
    const li = cat.levelIndex(r.est.theta);
    found[cat.NAMES[li]] = (found[cat.NAMES[li]] || 0) + 1;
    if (li === tl) exact++;
    if (Math.abs(li - tl) <= 1) close++;
    b1 += r.path.slice(0, 5).reduce((a, p) => a + p.b, 0) / 5;
    b2 += r.path.slice(-5).reduce((a, p) => a + p.b, 0) / 5;
  }
  totalExact += exact; totalClose += close; totalCount += SIMS;
  const top = Object.entries(found).sort((a, b) => b[1] - a[1])[0][0];
  console.log(
    t.toFixed(1).padStart(6), cat.NAMES[tl].padEnd(10), '|',
    (n / SIMS).toFixed(1).padStart(5), (th / SIMS).toFixed(2).padStart(7), top.padStart(8), '    ',
    String(Math.round((exact / SIMS) * 100) + '%').padStart(4), String(Math.round((close / SIMS) * 100) + '%').padStart(7), '    |',
    (b1 / SIMS).toFixed(2), '→', (b2 / SIMS).toFixed(2),
  );
}
console.log('\nsame level as the truth:', Math.round((totalExact / totalCount) * 100) + '%', '· within one level:', Math.round((totalClose / totalCount) * 100) + '%');
