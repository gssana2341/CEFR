// Sanity-checks the quiz data files so a typo can't ship a broken question.
// Usage: npm run validate   (exit code 1 if anything is wrong)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const { createDictionary } = createRequire(import.meta.url)('../public/assets/js/dictionary.js');
const { create: createCat } = createRequire(import.meta.url)('../api/_cat.js');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, 'public', 'assets', 'data');      // what the browser may download (config, glossary, tenses, manifest)
const contentDir = join(root, 'content');                    // question banks, lessons, answers: served only by the API

// The data files are plain browser scripts: they assign to window.CEFR_DATA.
const sandbox = { window: {} };
vm.createContext(sandbox);
for (const [dir, file] of [...['grammar', 'conversations', 'cloze', 'extra', 'placement', 'lessons', 'cat-bank',
  'clues-grammar', 'clues-conversations', 'clues-extra', 'clues-placement', 'clues-lessons', 'toeic5'].map((f) => [contentDir, f]),
...['exam', 'glossary', 'billing', 'tenses'].map((f) => [dataDir, f])]) {
  vm.runInContext(readFileSync(join(dir, file + '.js'), 'utf8'), sandbox, { filename: file + '.js' });
}
// markup.js is a browser script; only its pure helpers (plan) are used here
sandbox.window.CEFR = { h() {} };
vm.runInContext(readFileSync(join(dataDir, '..', 'js', 'markup.js'), 'utf8'), sandbox, { filename: 'markup.js' });
const markup = sandbox.window.CEFR.markup;
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
for (const key of ['grammar', 'conversations', 'extra', 'toeic5']) {
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
    if (key === 'toeic5') {
      if (!isStr(q.level)) err(where, 'level (e.g. "Part 5") is empty');
      if (!isStr(q.topic)) err(where, 'topic is empty');
      if (q.c.length !== 4) err(where, 'TOEIC questions have exactly 4 choices');
      if (!isStr(q.source)) err(where, 'source is empty (use "original" for questions written for this site)');
      if (q.source !== 'original' && !isStr(q.license)) err(where, 'license is required for questions that are not original');
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

// --- Adaptive placement test: settings + difficulty labels (cat-bank.js) ---
let catInfo = '';
{
  const c = D.cat;
  if (!c) err('cat', 'cat-bank.js is missing');
  else {
    const TOKEN = /^(A1|A2|B1|B2)[+-]?$/;
    for (const lv of LEVELS) if (typeof c.anchors?.[lv] !== 'number') err('cat', `anchors.${lv} must be a number`);
    if (typeof c.start !== 'number') err('cat', 'start must be a number');
    for (const f of ['step', 'priorSd', 'minItems', 'minItemsConfident', 'maxItems', 'stopSe', 'confidence', 'randomesque']) {
      if (typeof c[f] !== 'number' || !(c[f] > 0)) err('cat', `${f} must be a positive number`);
    }
    if (c.minItems > c.maxItems || c.minItemsConfident > c.maxItems) err('cat', 'minItems / minItemsConfident cannot exceed maxItems');
    if (c.confidence >= 1) err('cat', 'confidence must be below 1');
    const has = { grammar: new Set((D.grammar ?? []).map((q) => q.n)), extra: new Set((D.extra ?? []).map((q) => q.n)), placement: new Set((D.placement ?? []).map((q) => q.id)) };
    for (const [bank, map] of [['grammar', c.grammar], ['extra', c.extra], ['placement', c.placement]]) {
      for (const [key, token] of Object.entries(map ?? {})) {
        if (!TOKEN.test(token)) err(`cat.${bank}[${key}]`, `"${token}" is not a level (A1 A2 B1 B2, optional + or -)`);
        const k = bank === 'placement' ? key : Number(key);
        if (!has[bank].has(k)) err(`cat.${bank}[${key}]`, 'no question with this id');
      }
    }
    if (!errors.length) {
      const pool = createCat(D).buildPool();
      const per = Object.fromEntries(LEVELS.map((lv) => [lv, pool.filter((p) => p.level === lv).length]));
      for (const lv of LEVELS) if (per[lv] < 20) err('cat', `level ${lv} has only ${per[lv]} questions in the adaptive pool; at least 20 are needed`);
      catInfo = `${pool.length} questions (${LEVELS.map((lv) => lv + ' ' + per[lv]).join(' · ')})`;
    }
  }
}

// --- Membership settings (billing.js) ---
{
  const b = D.billing;
  if (!b || typeof b.enabled !== 'boolean' || typeof b.premium !== 'object') err('billing', 'billing.js needs enabled (true/false) and premium {…}');
  else {
    const sets = ['grammar', 'conversations', 'cloze', 'extra'];
    for (const id of b.premium.practice ?? []) if (!sets.includes(id)) err('billing.premium.practice', `"${id}" is not a practice set (${sets.join(', ')})`);
    for (const lv of b.premium.lessonLevels ?? []) if (!LEVELS.includes(lv)) err('billing.premium.lessonLevels', `"${lv}" is not a level`);
    if (b.premium.markupFreePerDay !== undefined && !(Number.isInteger(b.premium.markupFreePerDay) && b.premium.markupFreePerDay >= 0)) err('billing.premium.markupFreePerDay', 'must be a whole number (0 = no free looks)');
  }
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
if (!D.exam || !Array.isArray(D.exam.profiles) || D.exam.profiles.length < 2) err('exam', 'needs at least two profiles (the hub reads profiles[0] = EF SET style and profiles[1] = flexible)');
else {
  const profileIds = new Set();
  D.exam.profiles.forEach((pr, pi) => {
    const pw = `exam.profiles[${pi}] (${pr.id})`;
    if (!isStr(pr.id) || profileIds.has(pr.id)) err(pw, 'id missing or duplicated');
    profileIds.add(pr.id);
    if (!isStr(pr.title) || !isStr(pr.desc)) err(pw, 'title and desc are required');
    if (typeof pr.oneWay !== 'boolean') err(pw, 'oneWay must be true or false');
    if (!Array.isArray(pr.sections) || !pr.sections.length) return err(pw, 'needs sections');

    const secIds = new Set();
    let runnable = 0;
    pr.sections.forEach((s, si) => {
      const sw = `${pw} section[${si}] (${s.id})`;
      if (!isStr(s.id) || secIds.has(s.id)) err(sw, 'id missing or duplicated');
      secIds.add(s.id);
      if (!isStr(s.title)) err(sw, 'title is empty');
      if (!(s.minutes > 0)) err(sw, 'minutes must be a positive number');
      if (!Array.isArray(s.parts)) return err(sw, 'parts must be an array (use [] for a coming-soon section)');
      if (s.parts.length && !s.comingSoon) runnable++;
      const partIds = new Set();
      s.parts.forEach((p, i) => {
        const where = `${sw} part[${i}] (${p.id})`;
        if (!isStr(p.id) || partIds.has(p.id)) err(where, 'id missing or duplicated');
        partIds.add(p.id);
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
    });
    if (!runnable) err(pw, 'has no section that can run (needs parts and not comingSoon)');
    if (!pr.oneWay && pr.sections.length > 1) err(pw, 'the flexible (oneWay:false) format should have a single section');
  });
  if (!Array.isArray(D.exam.bands) || D.exam.bands.some((b) => !Array.isArray(b) || b.length !== 3)) err('exam.bands', 'must be a list of [cefr, name, range]');
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

// --- 12 tenses + sentence mark-up annotations (assets/data/clues-*.js) ---
const warnings = [];
const TENSE_KINDS = ['simple', 'continuous', 'perfect', 'perfectcont'];
const tenseIds = new Set();
if (!Array.isArray(D.tenses) || D.tenses.length !== 12) err('tenses', 'expected exactly 12 tenses');
else {
  D.tenses.forEach((t, i) => {
    const where = `tenses[${i}] (${t.id})`;
    if (!isStr(t.id) || tenseIds.has(t.id)) err(where, 'id missing or duplicate');
    tenseIds.add(t.id);
    if (!['past', 'present', 'future'].includes(t.group)) err(where, 'group must be past / present / future');
    if (!TENSE_KINDS.includes(t.kind)) err(where, `kind must be one of ${TENSE_KINDS.join(', ')}`);
    for (const f of ['en', 'th', 'short', 'tip']) if (!isStr(t[f])) err(where, `${f} is empty`);
    for (const f of ['aff', 'neg', 'q']) if (!isStr(t.form?.[f])) err(where, `form.${f} is empty`);
    for (const f of ['use', 'signals', 'examples']) if (!Array.isArray(t[f]) || !t[f].length) err(where, `${f} is empty`);
  });
}
const lessonIds = new Set((D.lessons ?? []).map((l) => l.id));
const clueStats = {};

function checkClue(where, bank, q, answer, ann) {
  if (!ann || typeof ann !== 'object') return err(where, 'annotation must be an object');
  if (!(ann.links?.length || ann.tags?.length || ann.tip)) err(where, 'needs links, tags or a tip');
  if (ann.tense && !tenseIds.has(ann.tense)) err(where, `unknown tense "${ann.tense}"`);
  if (ann.lesson && !lessonIds.has(ann.lesson)) err(where, `unknown lesson "${ann.lesson}"`);
  for (const [i, l] of (ann.links ?? []).entries()) {
    if (!Array.isArray(l) || !isStr(l[0]) || !(l[1] === null || isStr(l[1])) || !isStr(l[2])) err(where, `links[${i}] must be [from, to|null, label]`);
  }
  for (const [i, t] of (ann.tags ?? []).entries()) {
    if (!Array.isArray(t) || !isStr(t[0]) || !isStr(t[1])) err(where, `tags[${i}] must be [word, caption]`);
  }
  const p = markup.plan(q, answer, ann);
  for (const m of p.missing) err(where, `"${m}" is not in the sentence (or overlaps another mark)`);
  for (const m of p.ambiguous) warnings.push(`${where}: "${m}" appears more than once - first one is used (write "${m}@2" for the second)`);
}

const clues = D.clues ?? {};
for (const bank of ['grammar', 'conversations', 'extra']) {
  const byN = new Map((D[bank] ?? []).map((q) => [q.n, q]));
  const c = clues[bank] ?? {};
  clueStats[bank] = [Object.keys(c).length, byN.size];
  for (const [key, ann] of Object.entries(c)) {
    const q = byN.get(Number(key));
    if (!q) { err(`clues.${bank}[${key}]`, 'no question with this number'); continue; }
    checkClue(`clues.${bank}[${key}]`, bank, q.q, q.c[q.a], ann);
  }
}
{
  const byId = new Map((D.placement ?? []).map((q) => [q.id, q]));
  const c = clues.placement ?? {};
  clueStats.placement = [Object.keys(c).length, byId.size];
  for (const [key, ann] of Object.entries(c)) {
    const q = byId.get(key);
    if (!q) { err(`clues.placement[${key}]`, 'no question with this id'); continue; }
    checkClue(`clues.placement[${key}]`, 'placement', q.q, q.c[q.a], ann);
  }
}
{
  const c = clues.lessons ?? {};
  let have = 0;
  let total = 0;
  for (const l of D.lessons ?? []) total += l.exercises?.length ?? 0;
  for (const [lid, byIdx] of Object.entries(c)) {
    const lesson = (D.lessons ?? []).find((l) => l.id === lid);
    if (!lesson) { err(`clues.lessons[${lid}]`, 'no lesson with this id'); continue; }
    for (const [idx, ann] of Object.entries(byIdx)) {
      const ex = lesson.exercises?.[Number(idx)];
      if (!ex) { err(`clues.lessons[${lid}][${idx}]`, 'no exercise at this index'); continue; }
      have++;
      checkClue(`clues.lessons[${lid}][${idx}]`, 'lessons', ex.q, ex.c[ex.a], ann);
    }
  }
  clueStats.lessons = [have, total];
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
  `  mark-up  : ${Object.entries(clueStats).map(([k, [a, b]]) => `${k} ${a}/${b}`).join(' · ')} annotated (cloze is not annotated)\n` +
  `  adaptive : ${catInfo}
` +
  `  learning : placement ${counts.placement} · lessons ${counts.lessons} (${counts.exercises} exercises) · glossary ${Object.keys(G).length} entries`
);
if (warnings.length) console.warn(`\n! ${warnings.length} mark-up warning(s):\n  ` + warnings.join('\n  '));
if (uncovered.size) {
  const list = [...uncovered].sort();
  console.warn(`\n! ${list.length} word(s) are not in the glossary yet (click-to-translate will use machine translation):\n  ${list.slice(0, 60).join(' ')}${list.length > 60 ? ' …' : ''}\n  → add them to public/assets/data/glossary.js`);
} else {
  console.log('  glossary covers every English word on the site');
}
