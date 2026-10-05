// Computerized adaptive test (CAT) engine for the placement test. Pure logic, no DOM.
//
// How it works (same recipe as the real adaptive placement tests - Oxford Placement Test, Linguaskill ...):
//   1. every question has a difficulty b (logit scale) taken from its CEFR level
//   2. the learner's ability θ is re-estimated after every answer (Bayesian EAP on a grid)
//   3. the next question is the unused one that tells us the most about θ right now
//      (maximum Fisher information) - so a right answer leads to a harder question, a wrong one to an easier one
//   4. the test stops when the level is clear (or the estimate is precise enough), never before MIN_ITEMS
//   5. θ is turned into a CEFR level with fixed cut-offs and a 0-100 score
//
// Model: one-parameter logistic with a fixed guessing floor for multiple choice (c = 0.8 / number of options).
(function (root) {
  'use strict';

  const LEVELS = ['A1', 'A2', 'B1', 'B2'];

  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '');

  function create(data) {
    const cfg = data.cat;
    const step = cfg.step;
    const anchor = (lv) => cfg.anchors[lv];

    // "A2+" → difficulty (anchor + one step), "A2-" → (anchor - one step)
    function difficulty(token) {
      const m = /^(A1|A2|B1|B2)([+-]?)$/.exec(token || '');
      if (!m) return null;
      return anchor(m[1]) + (m[2] === '+' ? step : m[2] === '-' ? -step : 0);
    }

    // ---------- item pool: placement (own levels) + extra (own levels) + the grammar questions listed in cat.grammar ----------
    function buildPool() {
      const pool = [];
      const seen = new Set();
      const add = (src, id, q, token) => {
        const b = difficulty(token);
        if (b === null) return;
        const stem = norm(q.q) + '|' + norm(q.c[q.a]);
        if (seen.has(stem)) return;     // the same question can live in two banks: ask it once
        seen.add(stem);
        pool.push({ key: src + ':' + id, src, id, level: token.slice(0, 2), token, b, c: 0.8 / q.c.length, q });
      };
      (data.placement || []).forEach((q) => add('placement', q.id, q, (cfg.placement || {})[q.id] || q.level));
      (data.extra || []).forEach((q) => add('extra', q.n, q, (cfg.extra || {})[q.n] || q.level));
      (data.grammar || []).forEach((q) => add('grammar', q.n, q, (cfg.grammar || {})[q.n]));
      return pool;
    }

    // ---------- model ----------
    const prob = (theta, it) => it.c + (1 - it.c) / (1 + Math.exp(-(theta - it.b)));
    // Fisher information of a 1PL item with guessing floor c
    function info(theta, it) {
      const p = prob(theta, it);
      const lin = (p - it.c) / (1 - it.c);
      return (lin * lin * (1 - p)) / p;
    }

    // ---------- ability estimate: posterior over a grid ----------
    const GRID = [];
    for (let t = -5; t <= 4.0001; t += 0.05) GRID.push(Math.round(t * 100) / 100);

    // answers: [{ it, right }] → { theta (posterior mean), se (posterior sd), post (probabilities over GRID) }
    function estimate(answers) {
      const logPost = GRID.map((t) => {
        let lp = -0.5 * Math.pow((t - cfg.start) / cfg.priorSd, 2);
        for (const a of answers) {
          const p = prob(t, a.it);
          lp += Math.log(a.right ? p : 1 - p);
        }
        return lp;
      });
      const mx = Math.max(...logPost);
      const w = logPost.map((v) => Math.exp(v - mx));
      const sum = w.reduce((s, v) => s + v, 0);
      const post = w.map((v) => v / sum);
      const theta = post.reduce((s, v, i) => s + v * GRID[i], 0);
      const se = Math.sqrt(post.reduce((s, v, i) => s + v * Math.pow(GRID[i] - theta, 2), 0));
      return { theta, se, post };
    }

    // ---------- CEFR bands ----------
    // cut-offs sit half a level-step away from the anchors: A1|A2 = -1.8, A2|B1 = -0.6, B1|B2 = 0.6, B2|above = 1.8
    const half = (anchor('A2') - anchor('A1')) / 2;
    const cuts = [anchor('A1') - half, ...LEVELS.map((lv) => anchor(lv) + half)]; // [-3.0, -1.8, -0.6, 0.6, 1.8]
    const NAMES = ['pre-A1', 'A1', 'A2', 'B1', 'B2', 'B2+'];

    function levelIndex(theta) {
      let i = 0;
      while (i < cuts.length && theta >= cuts[i]) i++;
      return i;                         // 0 = pre-A1 … 5 = B2+
    }
    const levelOf = (theta) => NAMES[levelIndex(theta)];

    // probability of each band given the posterior
    function levelProbs(post) {
      const p = NAMES.map(() => 0);
      post.forEach((v, i) => { p[levelIndex(GRID[i])] += v; });
      return p;
    }

    // 0-100 score: 20 points per CEFR level (A1 0-20 … B2 60-80, 80+ = beyond what this test measures)
    const lo = cuts[0];
    const span = cuts[cuts.length - 1] - cuts[0] + (cuts[1] - cuts[0]); // 6.0 logits for 5 bands
    const scoreOf = (theta) => Math.round(Math.min(100, Math.max(0, ((theta - lo) / span) * 100)));

    // ---------- next question & stopping ----------
    // rng() → [0,1). Picks randomly among the few most informative unused items so tests do not all look the same.
    function pick(theta, pool, usedKeys, rng) {
      const free = pool.filter((it) => !usedKeys.has(it.key));
      if (!free.length) return null;
      const ranked = free.map((it) => ({ it, v: info(theta, it) })).sort((a, b) => b.v - a.v);
      const top = ranked.slice(0, cfg.randomesque);
      return top[Math.floor(rng() * top.length)].it;
    }

    function stop(n, est) {
      if (n >= cfg.maxItems) return 'max';
      if (n < cfg.minItems) return null;
      if (est.se <= cfg.stopSe) return 'precise';
      if (n >= cfg.minItemsConfident && Math.max(...levelProbs(est.post)) >= cfg.confidence) return 'confident';
      return null;
    }

    return { LEVELS, NAMES, cuts, buildPool, prob, info, estimate, levelIndex, levelOf, levelProbs, scoreOf, pick, stop, difficulty };
  }

  if (typeof module === 'object' && module.exports) module.exports = { create };
  if (root && root.CEFR) root.CEFR.cat = { create };
})(typeof window !== 'undefined' ? window : null);
