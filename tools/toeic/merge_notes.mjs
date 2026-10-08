// Puts the written reasoning (วิธีคิด) and the audio scripts into build/toeic/sN/data.json.   node tools/toeic/merge_notes.mjs [build/toeic]
//
//   tools/toeic/notes/sN.json  { "101": "…Thai reasoning…", … }   written by hand (git-ignored: it quotes the book)
//   build/toeic/sN/transcript  (transcribe.py) + the stretches from segment.mjs -> item.tx = what is said in that question's / conversation's recording
//
// Part 1-2: the whole stretch.  Part 3-4: the conversation / talk only (up to the moment the first question is read; the questions are printed).
// Run extract.py first (it rewrites data.json from scratch), then segment.mjs, then this.
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = resolve(process.argv[2] || 'build/toeic');
const notesDir = join(dirname(fileURLToPath(import.meta.url)), 'notes');
const index = JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8'));
const clean = (t) => t.replace(/\s+/g, ' ').trim();
let missing = 0;

for (const { id } of index.sets) {
  const file = join(dir, 's' + id, 'data.json');
  const data = JSON.parse(readFileSync(file, 'utf8'));
  // notes may be split in several files: s1.json, s1.part5.json, s1.p7a.json ...
  const notes = {};
  if (existsSync(notesDir)) for (const f of readdirSync(notesDir).filter((x) => x.startsWith('s' + id + '.') && x.endsWith('.json')).sort()) Object.assign(notes, JSON.parse(readFileSync(join(notesDir, f), 'utf8')));
  const stat = {};
  for (const p of [1, 2, 3, 4, 5, 6, 7]) {
    const part = data.parts[p];
    const items = part.items || part.groups.flatMap((g) => g.items);
    let withE = 0;
    let withTx = 0;
    const tf = join(dir, 's' + id, 'transcript', 'part' + p + '.json');
    const segs = p <= 4 && existsSync(tf) ? JSON.parse(readFileSync(tf, 'utf8')) : [];
    const linesIn = (from, to) => segs.filter((x) => x.start >= from && x.start < to).map((x) => clean(x.text)).filter(Boolean);
    if (p <= 2 && part.items.every((q) => q.at)) {
      for (const q of part.items) { q.tx = linesIn(q.at[0], q.at[1]).join('\n'); if (q.tx) withTx++; }
    }
    if ((p === 3 || p === 4) && part.groups.every((g) => g.at)) {
      for (const g of part.groups) {
        const firstCue = Math.min(...g.items.map((q) => q.cue).filter((c) => c !== undefined), g.at[1]);
        // the announcement "Questions 32 through 34 refer to the following conversation." is not part of the script
        const lines = linesIn(g.at[0], firstCue - 0.05).filter((l, i) => !(i === 0 && l.length < 120 && /\b(?:questions?|section)\b|\brefer\b.*\bfollowing\b|\b\d+\s*(?:through|to)\s*\d+\b/i.test(l)));
        for (const q of g.items) { q.tx = lines.join('\n'); if (q.tx) withTx++; }
      }
    }
    for (const q of items) {
      const e = notes[String(q.n)];
      if (e) { q.e = e; withE++; } else delete q.e;
    }
    stat[p] = withE + '/' + items.length + (p <= 4 ? ' · script ' + withTx : '');
    missing += items.length - withE;
  }
  writeFileSync(file, JSON.stringify(data, null, 1));
  console.log('set ' + id + ' notes per Part: ' + Object.entries(stat).map(([p, v]) => p + ': ' + v).join(' | '));
}
console.log(missing ? '\n' + missing + ' questions still have no written reasoning' : '\nevery question has its reasoning');
