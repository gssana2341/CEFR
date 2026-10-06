// The question banks, kept OUTSIDE public/ so they are only ever handed out by an endpoint that has checked who is asking
// (files starting with "_" are not endpoints).
//
// The data files in content/ are the same browser-style scripts as before (they assign to window.CEFR_DATA), so they are
// run once in a sandbox here and the result is cached for the life of the server instance.
//   bank('grammar') → the raw array (answers and explanations included - NEVER send this to a browser as it is)
//   publicQuestion(set, q) → the same question without `a` / `e`
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const DIR = path.join(__dirname, '..', 'content');
const FILES = ['placement', 'grammar', 'conversations', 'extra', 'toeic5', 'cloze', 'lessons', 'cat-bank',
  'clues-placement', 'clues-grammar', 'clues-conversations', 'clues-extra', 'clues-lessons'];

let D = null;
function data() {
  if (D) return D;
  const sandbox = { window: { CEFR_DATA: {} } };
  vm.createContext(sandbox);
  for (const f of FILES) vm.runInContext(fs.readFileSync(path.join(DIR, f + '.js'), 'utf8'), sandbox, { filename: f + '.js' });
  D = sandbox.window.CEFR_DATA;
  return D;
}

// sets that are plain multiple-choice lists keyed by `n`
const MCQ = ['grammar', 'conversations', 'extra', 'toeic5'];
const isMcq = (set) => MCQ.includes(set);

const bank = (set) => data()[set] || [];
const lessons = () => data().lessons || [];
const clues = (set) => (data().clues || {})[set] || {};
const catConfig = () => data().cat;

const byN = {};
function question(set, n) {
  if (!isMcq(set)) return null;
  if (!byN[set]) byN[set] = new Map(bank(set).map((q) => [q.n, q]));
  return byN[set].get(n) || null;
}

// what the browser may see before it has answered: the question and its choices, nothing about which is right
function publicQuestion(q) {
  const out = { n: q.n, q: q.q, c: q.c };
  if (q.level) out.level = q.level;
  if (q.topic) out.topic = q.topic;
  return out;
}

// cloze passages without the correct answers / explanations
function publicPassage(p) {
  return { topic: p.topic, text: p.text, blanks: p.blanks.map((b) => ({ c: b.c })) };
}

module.exports = { data, bank, lessons, clues, catConfig, question, publicQuestion, publicPassage, isMcq, MCQ };
