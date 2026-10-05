// Sanity-checks the quiz data files so a typo can't ship a broken question.
// Usage: npm run validate   (exit code 1 if anything is wrong)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const { createDictionary } = createRequire(import.meta.url)('../public/assets/js/dictionary.js');
const dataDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets', 'data');

// The data files are plain browser scripts: they assign to window.CEFR_DATA.
const sandbox = { window: {} };
vm.createContext(sandbox);
for (const file of ['grammar', 'conversations', 'cloze', 'extra', 'placement', 'lessons', 'exam', 'glossary']) {
  vm.runInContext(readFileSync(join(dataDir, file + '.js'), 'utf8'), sandbox, { filename: file + '.js' });
}
const D = sandbox.window.CEFR_DATA;

const errors = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);
const isStr = (v) => typeof v === 'string' && v.trim() !== '';
const LEVELS = ['A1', 'A2', 'B1', 'B2'];

function checkChoices(where, c, a, max = Infinity) {
  if (!Array.isArray(c) || c.length < 2) return err(where, 'needs at least 2 choices (c)');
  if (c.length > max) err(where, `has ${c.length} choices; at most ${max} are supported`);
  if (!c.every(isStr)) err(where, 'every choice must be a non-empty string');
  if (new Set(c).size !== c.length) err(where, 'duplicate choice text');
  if (!Number.isInteger(a) || a < 0 || a >= c.length) err(where, `answer index "a" (${a}) is out of range`);
}

function checkQuestion(where, q) {
  if (!isStr(q.q)) err(where, 'question text (q) is empty');
  if (!isStr(q.e)) err(where, 'explanation (e) is empty');
  checkChoices(where, q.c, q.a, 5); // keyboard shortcuts cover 5 choices (1–5 / A–E)
}

// --- Numbered multiple-choice sets (book questions + extra practice) ---
for (const key of ['grammar', 'conversations', 'extra']) {
  const list = D[key];
  if (!Array.isArray(list) || !list.length) { err(key, 'missing or empty'); continue; }
  const seen = new Set();
  list.forEach((q, i) => {
    const where = `${key}[${i}] (n=${q.n})`;
    if (!Number.isInteger(q.n)) err(where, 'n must be an integer');
    else if (seen.has(q.n)) err(where, 'duplicate n');
    seen.add(q.n);
    checkQuestion(where, q);
    if (key === 'extra') {
      if (!LEVELS.includes(q.level)) err(where, `level must be one of ${LEVELS.join(', ')}`);
      if (!isStr(q.topic)) err(where, 'topic is empty');
    }
  });
}

// --- Placement test bank ---
if (!Array.isArray(D.placement) || !D.placement.length) err('placement', 'missing or empty');
else {
  const seen = new Set();
  const perLevel = Object.fromEntries(LEVELS.map((l) => [l, 0]));
  D.placement.forEach((q, i) => {
    const where = `placement[${i}] (${q.id})`;
    if (!isStr(q.id)) err(where, 'id is empty');
    else if (seen.has(q.id)) err(where, 'duplicate id');
    seen.add(q.id);
    if (!LEVELS.includes(q.level)) err(where, `level must be one of ${LEVELS.join(', ')}`);
    else perLevel[q.level]++;
    checkQuestion(where, q);
  });
  for (const l of LEVELS) if (perLevel[l] < 10) err('placement', `level ${l} has ${perLevel[l]} questions; at least 10 are needed`);
}

// --- Lessons ---
if (!Array.isArray(D.lessons) || !D.lessons.length) err('lessons', 'missing or empty');
else {
  const seen = new Set();
  D.lessons.forEach((l, i) => {
    const where = `lessons[${i}] (${l.id})`;
    if (!isStr(l.id) || !/^[a-z0-9-]+$/.test(l.id)) err(where, 'id must be lowercase letters, digits and dashes');
    else if (seen.has(l.id)) err(where, 'duplicate id');
    seen.add(l.id);
    if (!LEVELS.includes(l.level)) err(where, `level must be one of ${LEVELS.join(', ')}`);
    if (!isStr(l.title) || !isStr(l.en) || !isStr(l.intro)) err(where, 'title, en and intro are required');
    if (!Number.isInteger(l.minutes) || l.minutes < 1) err(where, 'minutes must be a positive integer');
    if (!Array.isArray(l.sections) || !l.sections.length) err(where, 'needs at least one section');
    (l.sections || []).forEach((s, j) => {
      const sw = `${where} section ${j + 1}`;
      if (!isStr(s.title)) err(sw, 'title is empty');
      if (!s.body && !s.table && !s.examples) err(sw, 'needs body, table or examples');
      if (s.table) {
        const w = s.table.head?.length;
        if (!w || !Array.isArray(s.table.rows) || !s.table.rows.length) err(sw, 'table needs head and rows');
        else s.table.rows.forEach((r, k) => { if (r.length !== w) err(sw, `table row ${k + 1} has ${r.length} cells, expected ${w}`); });
      }
      (s.examples || []).forEach((ex, k) => {
        if (!Array.isArray(ex) || ex.length !== 2 || !ex.every(isStr)) err(sw, `example ${k + 1} must be [english, thai]`);
      });
      if (s.note && !['tip', 'warn'].includes(s.note.kind)) err(sw, 'note.kind must be "tip" or "warn"');
    });
    if (!Array.isArray(l.exercises) || l.exercises.length < 3) err(where, 'needs at least 3 exercises');
    (l.exercises || []).forEach((q, j) => checkQuestion(`${where} exercise ${j + 1}`, q));
  });
}

// --- Mock exam config ---
if (!D.exam || !Array.isArray(D.exam.parts) || !D.exam.parts.length) err('exam', 'missing parts');
else {
  if (!(D.exam.durationMin > 0)) err('exam', 'durationMin must be a positive number');
  const seen = new Set();
  D.exam.parts.forEach((p, i) => {
    const where = `exam.parts[${i}] (${p.id})`;
    if (!isStr(p.id) || seen.has(p.id)) err(where, 'id missing or duplicated');
    seen.add(p.id);
    if (!isStr(p.title)) err(where, 'title is empty');
    if (p.type === 'mcq') {
      if (!['grammar', 'conversations', 'extra'].includes(p.source)) err(where, 'mcq source must be grammar, conversations or extra');
      else if (!(p.count >= 1 && p.count <= D[p.source].length)) err(where, `count must be 1–${D[p.source].length}`);
    } else if (p.type === 'cloze') {
      if (!(p.count >= 1 && p.count <= (D.cloze || []).length)) err(where, `count must be 1–${(D.cloze || []).length}`);
    } else {
      err(where, `unsupported type "${p.type}" (supported: mcq, cloze)`);
    }
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

// --- Glossary (click-to-translate dictionary) ---
const G = D.glossary || {};
for (const [word, gloss] of Object.entries(G)) {
  if (!isStr(gloss)) err(`glossary "${word}"`, 'definition is empty');
  else if (gloss.startsWith('>') && !Object.prototype.hasOwnProperty.call(G, gloss.slice(1).split('|')[0])) {
    err(`glossary "${word}"`, `redirect target "${gloss.slice(1).split('|')[0]}" does not exist`);
  }
  if (word !== word.toLowerCase()) err(`glossary "${word}"`, 'keys must be lowercase');
}

// Words used on the site that the glossary can't resolve → click-to-translate falls back to the
// (less accurate) machine translation. Reported as a warning, not an error.
const siteText = [];
const take = (s) => { if (typeof s === 'string') siteText.push(s); };
for (const key of ['grammar', 'conversations', 'extra', 'placement']) {
  (D[key] || []).forEach((q) => { take(q.q); (q.c || []).forEach(take); take(q.e); });
}
(D.cloze || []).forEach((p) => {
  take(p.text.replace(/\{\d+\}/g, ' '));
  p.blanks.forEach((b) => { b.c.forEach(take); take(b.e); });
});
(D.lessons || []).forEach((l) => {
  take(l.title); take(l.en); take(l.intro);
  (l.sections || []).forEach((s) => {
    (s.examples || []).forEach((e) => take(e[0]));
    (s.table ? s.table.rows.flat() : []).forEach(take);
    (s.body || []).forEach(take);
    if (s.note) take(s.note.text);
  });
  (l.exercises || []).forEach((q) => { take(q.q); q.c.forEach(take); take(q.e); });
});
const dict = createDictionary(G);
const uncovered = new Set();
for (const t of siteText) {
  for (const m of t.replace(/[฀-๿]+/g, ' ').matchAll(/[A-Za-z]+(?:['’][a-z]+)?/g)) {
    if (!dict.lookup(m[0])) uncovered.add(m[0].toLowerCase());
  }
}

const counts = {
  grammar: D.grammar?.length ?? 0,
  conversations: D.conversations?.length ?? 0,
  cloze: D.cloze?.length ?? 0,
  clozeBlanks: (D.cloze ?? []).reduce((s, p) => s + (p.blanks?.length ?? 0), 0),
  extra: D.extra?.length ?? 0,
  placement: D.placement?.length ?? 0,
  lessons: D.lessons?.length ?? 0,
  exercises: (D.lessons ?? []).reduce((s, l) => s + (l.exercises?.length ?? 0), 0),
};

if (errors.length) {
  console.error(`✗ ${errors.length} problem(s) found:\n  - ` + errors.join('\n  - '));
  process.exit(1);
}
console.log(
  `✓ Data OK\n` +
  `  practice : grammar ${counts.grammar} · conversations ${counts.conversations} · cloze ${counts.cloze} passages / ${counts.clozeBlanks} blanks · extra ${counts.extra}\n` +
  `  learning : placement ${counts.placement} · lessons ${counts.lessons} (${counts.exercises} exercises) · glossary ${Object.keys(G).length} entries`
);
if (uncovered.size) {
  const list = [...uncovered].sort();
  console.warn(`\n! ${list.length} word(s) are not in the glossary yet (click-to-translate will use machine translation):\n  ${list.slice(0, 60).join(' ')}${list.length > 60 ? ' …' : ''}\n  → add them to public/assets/data/glossary.js`);
} else {
  console.log('  glossary covers every English word on the site');
}
