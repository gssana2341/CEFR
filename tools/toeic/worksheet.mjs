// Prints what is needed to write the reasoning (วิธีคิด) for a range of questions: the question, the choices, the key, and the evidence
// (script of the recording / text of the passage). Reads build/toeic only.   node tools/toeic/worksheet.mjs <set> <firstQ> <lastQ>
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const [setId, from, to] = process.argv.slice(2).map(Number);
const dir = resolve('build/toeic', 's' + setId);
const data = JSON.parse(readFileSync(join(dir, 'data.json'), 'utf8'));
const passages = existsSync(join(dir, 'passages.json')) ? JSON.parse(readFileSync(join(dir, 'passages.json'), 'utf8')) : {};
const L = 'ABCD';
for (const p of [1, 2, 3, 4, 5, 6, 7]) {
  const part = data.parts[p];
  const units = part.groups || part.items.map((q) => ({ items: [q], id: String(q.n) }));
  for (const g of units) {
    const ns = g.items.map((q) => q.n);
    if (ns[ns.length - 1] < from || ns[0] > to) continue;
    console.log('\n=== Part ' + p + ' · Q' + ns[0] + (ns.length > 1 ? '-' + ns[ns.length - 1] : '') + (g.label ? ' · ' + g.label : ''));
    if (p <= 4 && g.items[0].tx) console.log('SCRIPT:\n' + g.items[0].tx);
    if (p >= 6 && passages[g.id]) console.log('PASSAGE:\n' + passages[g.id]);
    for (const q of g.items) {
      if (q.n < from || q.n > to) continue;
      if (passages['g' + q.n]) console.log('GRAPHIC (Q' + q.n + '): ' + passages['g' + q.n].replace(/\n/g, ' / '));
      console.log(q.n + ' [' + L[q.a] + '] ' + (q.q || '') + '  ' + q.c.map((c, i) => '(' + L[i] + ') ' + c).join('  '));
    }
  }
}
