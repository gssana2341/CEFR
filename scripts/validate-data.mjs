// Sanity-checks the quiz data files so a typo can't ship a broken question.
// Usage: npm run validate   (exit code 1 if anything is wrong)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const dataDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets', 'data');

// The data files are plain browser scripts: they assign to window.CEFR_DATA.
const sandbox = { window: {} };
vm.createContext(sandbox);
for (const file of ['grammar', 'conversations', 'cloze']) {
  vm.runInContext(readFileSync(join(dataDir, file + '.js'), 'utf8'), sandbox, { filename: file + '.js' });
}
const D = sandbox.window.CEFR_DATA;

const errors = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const isStr = (v) => typeof v === 'string' && v.trim() !== '';

function checkChoices(where, c, a, max = Infinity) {
  if (!Array.isArray(c) || c.length < 2) return err(where, 'needs at least 2 choices (c)');
  if (c.length > max) err(where, `has ${c.length} choices; at most ${max} are supported`);
  if (!c.every(isStr)) err(where, 'every choice must be a non-empty string');
  if (new Set(c).size !== c.length) err(where, 'duplicate choice text');
  if (!Number.isInteger(a) || a < 0 || a >= c.length) err(where, `answer index "a" (${a}) is out of range`);
}

// --- Multiple-choice sets ---
for (const key of ['grammar', 'conversations']) {
  const list = D[key];
  if (!Array.isArray(list) || !list.length) { err(key, 'missing or empty'); continue; }
  const seen = new Set();
  list.forEach((q, i) => {
    const where = `${key}[${i}] (n=${q.n})`;
    if (!Number.isInteger(q.n)) err(where, 'n must be an integer');
    else if (seen.has(q.n)) err(where, 'duplicate n');
    seen.add(q.n);
    if (!isStr(q.q)) err(where, 'question text (q) is empty');
    if (!isStr(q.e)) err(where, 'explanation (e) is empty');
    checkChoices(where, q.c, q.a, 5); // keyboard shortcuts cover 5 choices (1–5 / A–E)
  });
}

// --- Cloze passages ---
if (!Array.isArray(D.cloze) || !D.cloze.length) err('cloze', 'missing or empty');
else {
  D.cloze.forEach((p, i) => {
    const where = `cloze[${i}] "${p.topic}"`;
    if (!isStr(p.topic)) err(where, 'topic is empty');
    if (!isStr(p.text)) err(where, 'text is empty');
    if (!Array.isArray(p.blanks) || !p.blanks.length) return err(where, 'blanks missing');

    const tokens = [...String(p.text).matchAll(/\{(\d+)\}/g)].map((m) => Number(m[1]));
    p.blanks.forEach((b, j) => {
      const n = j + 1;
      const hits = tokens.filter((t) => t === n).length;
      if (hits !== 1) err(where, `placeholder {${n}} appears ${hits} times in text (expected exactly 1)`);
      if (!isStr(b.e)) err(`${where} blank ${n}`, 'explanation (e) is empty');
      checkChoices(`${where} blank ${n}`, b.c, b.a);
    });
    const extra = tokens.filter((t) => t < 1 || t > p.blanks.length);
    if (extra.length) err(where, `placeholder(s) {${extra.join('}, {')}} have no matching blank`);
  });
}

const counts = {
  grammar: D.grammar?.length ?? 0,
  conversations: D.conversations?.length ?? 0,
  cloze: D.cloze?.length ?? 0,
  clozeBlanks: (D.cloze ?? []).reduce((s, p) => s + (p.blanks?.length ?? 0), 0),
};

if (errors.length) {
  console.error(`✗ ${errors.length} problem(s) found:\n  - ` + errors.join('\n  - '));
  process.exit(1);
}
console.log(
  `✓ Data OK — grammar: ${counts.grammar} questions, conversations: ${counts.conversations} questions, ` +
  `cloze: ${counts.cloze} passages / ${counts.clozeBlanks} blanks`
);
