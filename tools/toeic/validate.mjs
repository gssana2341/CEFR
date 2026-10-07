// Checks what extract.py produced before it is uploaded:   node tools/toeic/validate.mjs [build/toeic]
// Every set must have all 200 questions numbered 1-200 once, the right number of choices, an answer that exists, no empty text,
// and every picture / audio file it points at.
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const dir = resolve(process.argv[2] || 'build/toeic');
const index = JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8'));
const COUNTS = { 1: 6, 2: 25, 3: 39, 4: 30, 5: 30, 6: 16, 7: 54 };
const RANGE = { 1: [1, 6], 2: [7, 31], 3: [32, 70], 4: [71, 100], 5: [101, 130], 6: [131, 146], 7: [147, 200] };
let problems = 0;
const bad = (m) => { problems++; console.log('  ✗ ' + m); };

for (const { id } of index.sets) {
  const base = join(dir, 's' + id);
  const d = JSON.parse(readFileSync(join(base, 'data.json'), 'utf8'));
  console.log('set ' + id);
  const seen = new Set();
  for (let p = 1; p <= 7; p++) {
    const part = d.parts[p];
    if (!part) { bad('part ' + p + ' missing'); continue; }
    const items = part.items || part.groups.flatMap((g) => g.items);
    if (items.length !== COUNTS[p]) bad('part ' + p + ' has ' + items.length + ' questions, expected ' + COUNTS[p]);
    const [lo, hi] = RANGE[p];
    items.forEach((it, i) => {
      if (it.n !== lo + i) bad('part ' + p + ': question ' + it.n + ' is out of order (expected ' + (lo + i) + ')');
      if (seen.has(it.n)) bad('question ' + it.n + ' appears twice');
      seen.add(it.n);
      const want = p === 2 ? 3 : 4;
      if (!Array.isArray(it.c) || it.c.length !== want) bad('Q' + it.n + ' has ' + (it.c && it.c.length) + ' choices, expected ' + want);
      else if (p >= 3 && it.c.some((c) => !String(c).trim())) bad('Q' + it.n + ' has an empty choice');
      else if (p >= 3 && it.c.some((c) => String(c).length > 160)) bad('Q' + it.n + ' has a very long choice (a wrapped line from the next block?)');
      if (!Number.isInteger(it.a) || it.a < 0 || it.a >= want) bad('Q' + it.n + ' answer ' + it.a + ' is not one of the choices');
      if ((p === 3 || p === 4 || p === 5 || p === 7) && !(it.q || '').trim()) bad('Q' + it.n + ' has no question text');
      if (p === 6 && it.q) bad('Q' + it.n + ' (Part 6) unexpectedly has a stem');
      if (it.img && !existsSync(join(base, 'img', it.img))) bad('Q' + it.n + ': missing picture ' + it.img);
      if (p === 1 && !it.img) bad('Q' + it.n + ' has no photo');
      if (/\s{2}|^\s|\s$/.test((it.q || '')) ) bad('Q' + it.n + ': stray whitespace in the text');
    });
    for (const g of part.groups || []) {
      if (p >= 6 && !(g.imgs && g.imgs.length)) bad('group ' + g.id + ' has no passage picture');
      for (const im of g.imgs || []) if (!existsSync(join(base, 'img', im))) bad('group ' + g.id + ': missing picture ' + im);
      const ns = g.items.map((x) => x.n);
      if (ns.some((n, i) => i && n !== ns[i - 1] + 1)) bad('group ' + g.id + ' is not a run of numbers: ' + ns);
    }
    if (p <= 4) {
      const a = part.audio;
      const f = a && join(base, a.file);
      if (!a || !existsSync(f)) bad('part ' + p + ' audio missing');
      else if (statSync(f).size !== a.bytes) bad('part ' + p + ' audio size differs from the source');
      else if (!(a.sec > 30)) bad('part ' + p + ' audio length looks wrong: ' + a.sec);
    }
  }
  for (let n = 1; n <= 200; n++) if (!seen.has(n)) bad('question ' + n + ' is missing');
  // the answer keys of Part 2 can only be A-C; across the whole test the letters should be spread out
  const tally = [0, 0, 0, 0];
  for (const p of [1, 2, 3, 4, 5, 6, 7]) for (const it of (d.parts[p].items || d.parts[p].groups.flatMap((g) => g.items))) tally[it.a]++;
  console.log('  answers A/B/C/D: ' + tally.join(' / ') + ' (should be roughly even)');
  if (Math.min(...tally) < 30) bad('the answer letters look lopsided: ' + tally);
}
console.log(problems ? '\n' + problems + ' problem(s)' : '\nall sets look complete');
process.exit(problems ? 1 : 0);
