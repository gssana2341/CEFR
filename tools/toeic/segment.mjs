// Finds where each question / conversation / talk starts inside a Part's audio, from the transcripts (transcribe.py), and
// writes the times into build/toeic/sN/data.json so the practice pages can play just that stretch.   node tools/toeic/segment.mjs [build/toeic]
//
//   Part 1, 2   each question:        "Number 7." ...                         -> item.at = [start, end]
//   Part 3, 4   each group of three:  "Questions 32 through 34 refer to ..."  -> group.at = [start, end], item.cue = when the question is read
// Nothing is guessed: a stretch that can not be placed is reported and that Part is left without times.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const dir = resolve(process.argv[2] || 'build/toeic');
const index = JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8'));
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = { 20: 'twenty', 30: 'thirty' };
const word = (n) => (n < 20 ? ONES[n] : TENS[n - (n % 10)] + (n % 10 ? '[- ]' + ONES[n % 10] : '(?![- ]\\w)'));     // "twenty" must not match the start of "twenty-two"
let problems = 0;
const bad = (m) => { problems++; console.log('  ✗ ' + m); };

// "number 7", "7.", "Number seven", "number twelve", "Number twenty-one"
const numberRe = (n) => new RegExp('^\\W*(?:number\\s+)?(?:' + n + '|' + word(n) + ')\\b(?!\\s*(?:through|to)\\b)', 'i');
const calledRe = (n) => new RegExp('^\\W*number\\s+(?:' + n + '|' + word(n) + ')\\b', 'i');
// "Questions 32 through 34 refer to", "Section 62 through 64", "Question 65-67", "59 through 61"
const groupRe = (s) => new RegExp('\\b' + s + '\\s*(?:through|to|and|-)\\s*' + (s + 2) + '\\b', 'i');
// first segment at or after `from` that matches, but not more than `within` seconds after `after` (a stray "20 percent" later in the
// recording must not be taken for "Number 20")
const find = (segs, re, from, after, within) => {
  for (let i = from; i < segs.length; i++) {
    if (segs[i].start > after + within) return -1;
    if (re.test(segs[i].text.trim())) return i;
  }
  return -1;
};

const isC = (t) => /^\W*c[.):]/i.test(t.trim());
const isA = (t) => /^\W*(?:(?:number\s+)?\w+[.,]?\s*)?\(?a[.):]/i.test(t.trim());

function startsOf(p, units, segs) {
  let starts = [];
  let cursor = 0;
  let last = 0;                                              // start time of the last unit that was found
  const within = p <= 2 ? 70 : 200;
  for (const n of units) {
    let i = find(segs, p <= 2 ? numberRe(n) : groupRe(n), cursor, last, within);
    if (i < 0 && p > 2) {
      // the "Questions 41 through 43" announcement was not heard: the group begins right after the previous group's last question
      const j = find(segs, numberRe(n - 1), cursor, last, within);
      if (j >= 0) i = segs[j].text.trim().length > 18 ? j + 1 : j + 2;
    }
    if (i < 0) { starts.push(null); continue; }
    starts.push(segs[i].start);
    cursor = i + 1;
    last = segs[i].start;
  }
  if (p <= 2 && starts.some((x) => x === null)) {
    // some numbers were not heard (or never spoken): place the missing questions by the option letters instead.
    // Part 2: every question has exactly one option that begins with "C." and the next question starts right after it, so between two
    //         questions that were found, the C options show where the ones in between begin.
    // Part 1: every question has exactly one run of statements that begins with "A."
    if (p === 1) {
      const as = segs.map((x, i) => (isA(x.text) ? i : -1)).filter((i) => i >= 0);
      if (as.length === units.length) starts = as.map((i) => segs[i].start);
    } else {
      let k = 0;
      while (k < starts.length) {
        if (starts[k] !== null) { k++; continue; }
        let e = k;
        while (e < starts.length && starts[e] === null) e++;                    // units k..e-1 are missing
        const from = k === 0 ? -1 : starts[k - 1];
        const to = e === starts.length ? Infinity : starts[e];
        const cs = segs.map((x, i) => (isC(x.text) && x.start >= from && x.start < to ? i : -1)).filter((i) => i >= 0);
        if (cs.length !== e - k + 1 && !(k === 0 && cs.length === e - k)) break;   // not exactly one C per question in the stretch: leave it for the report
        for (let u = k; u < e; u++) starts[u] = u === 0 ? 0 : segs[cs[u - k] + 1].start;
        k = e;
      }
    }
  }
  return starts;
}

for (const { id } of index.sets) {
  const file = join(dir, 's' + id, 'data.json');
  const data = JSON.parse(readFileSync(file, 'utf8'));
  console.log('set ' + id);
  for (const p of [1, 2, 3, 4]) {
    const tf = join(dir, 's' + id, 'transcript', 'part' + p + '.json');
    if (!existsSync(tf)) { bad('part ' + p + ': no transcript'); continue; }
    const segs = JSON.parse(readFileSync(tf, 'utf8'));
    const part = data.parts[p];
    const total = part.audio.sec;
    const units = p <= 2 ? part.items.map((q) => q.n) : part.groups.map((g) => g.items[0].n);
    const starts = startsOf(p, units, segs);
    const missing = units.filter((n, i) => starts[i] === null || starts[i] === undefined);
    if (missing.length || starts.length !== units.length) { bad('part ' + p + ': could not place ' + (missing.join(', ') || 'every unit')); continue; }
    if (starts.some((x, i) => i && !(x > starts[i - 1]))) { bad('part ' + p + ': starts are not increasing'); continue; }
    const at = (i) => [Math.max(0, +(starts[i] - 0.3).toFixed(1)), +(i + 1 < starts.length ? starts[i + 1] - 0.2 : total).toFixed(1)];
    if (p <= 2) part.items.forEach((q, i) => { q.at = at(i); });
    else {
      part.groups.forEach((g, i) => {
        g.at = at(i);
        for (const q of g.items) {                           // when each question is read out
          const j = segs.findIndex((s) => s.start >= g.at[0] && s.start < g.at[1] && calledRe(q.n).test(s.text.trim()));
          if (j >= 0) q.cue = +segs[j].start.toFixed(1);
        }
      });
    }
    const lens = (p <= 2 ? part.items : part.groups).map((x) => x.at[1] - x.at[0]);
    console.log('  part ' + p + ': ' + lens.length + ' stretches, ' + Math.min(...lens).toFixed(0) + '-' + Math.max(...lens).toFixed(0) + ' s each');
  }
  writeFileSync(file, JSON.stringify(data, null, 1));
}
console.log(problems ? '\n' + problems + ' problem(s)' : '\nevery question / group has its audio stretch');
process.exit(problems ? 1 : 0);
