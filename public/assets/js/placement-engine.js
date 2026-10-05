// CEFR placement test - adaptive (assets/js/cat.js decides the next question, assets/data/cat-bank.js holds the rules).
// Right answer → the next question is harder, wrong answer → easier, until the level is clear. No feedback while testing.
(function () {
  'use strict';

  const { store, shuffle, h, rich, confirmDialog, dialogOpen } = window.CEFR;

  const D = window.CEFR_DATA;
  const cfg = D.cat;
  const cat = window.CEFR.cat.create(D);
  const pool = cat.buildPool();
  const byKey = new Map(pool.map((it) => [it.key, it]));
  const lessons = D.lessons || [];
  const root = document.getElementById('app');
  const trToggle = document.querySelector('[data-translate-toggle]');

  const KEYS = '1234';
  const K = { state: 'placement:state', last: 'placement:last', history: 'placement:history' };

  const LEVEL_TEXT = {
    'pre-A1': { name: 'ต่ำกว่า A1', desc: 'ยังอยู่ในช่วงเริ่มต้น แนะนำให้เริ่มจากโครงสร้างพื้นฐาน เช่น to be, present simple และคำศัพท์ใกล้ตัว' },
    A1: { name: 'A1', desc: 'ใช้ประโยคง่ายๆ แนะนำตัวและถามตอบเรื่องใกล้ตัวได้ เมื่อคู่สนทนาพูดช้าและชัดเจน' },
    A2: { name: 'A2', desc: 'สื่อสารเรื่องที่คุ้นเคยในชีวิตประจำวัน เช่น ครอบครัว การซื้อของ งาน ด้วยประโยคสั้นๆ ได้' },
    B1: { name: 'B1', desc: 'รับมือสถานการณ์ส่วนใหญ่ได้ เล่าประสบการณ์ แผนการ และเหตุผลได้พอสมควร และเข้าใจประเด็นหลักของเรื่องที่คุ้นเคย' },
    B2: { name: 'B2', desc: 'เข้าใจเนื้อหาที่ซับซ้อนทั้งเรื่องทั่วไปและเฉพาะทาง และโต้ตอบได้คล่องพอจะสนทนากับเจ้าของภาษาได้อย่างไม่ติดขัด' },
    'B2+': { name: 'B2 ขึ้นไป', desc: 'ทำข้อสอบระดับ B2 ได้ดีมาก ข้อสอบนี้วัดสูงกว่านี้ไม่ได้ ลองสอบจริงเช่น EF SET หรือทำสอบจำลองในเว็บนี้' },
  };

  // lessons to read next: the level above the one you reached (A1 for beginners, B2 stays B2)
  const TARGET = { 'pre-A1': 'A1', A1: 'A2', A2: 'B1', B1: 'B2', B2: 'B2', 'B2+': 'B2' };

  let run = loadRun();     // unfinished run restored from storage
  let finished = null;     // result of the run just completed
  let view = 'intro';      // 'intro' | 'quiz' | 'result'

  // ---------- State ----------
  const validOrder = (it, o) => Array.isArray(o) && o.length === it.q.c.length && [...o].sort((a, b) => a - b).every((v, i) => v === i);
  const validEntry = (e) => {
    const it = e && byKey.get(e.key);
    return !!it && validOrder(it, e.order) && (e.pick === null || (Number.isInteger(e.pick) && e.pick >= 0 && e.pick < it.q.c.length));
  };

  function loadRun() {
    const r = store.get(K.state, null);
    const ok = r && r.v === 2 && Array.isArray(r.answers) && r.answers.every(validEntry) && validEntry(r.cur)
      && new Set([...r.answers.map((a) => a.key), r.cur.key]).size === r.answers.length + 1;
    if (!ok) {
      if (r) store.remove(K.state);
      return null;
    }
    return r;
  }

  const save = () => store.set(K.state, run);
  const setView = (...nodes) => root.replaceChildren(...nodes.flat(Infinity).filter(Boolean));
  const showTranslateToggle = (on) => { if (trToggle) trToggle.hidden = !on; };
  const answered = (list) => list.map((a) => { const it = byKey.get(a.key); return { it, right: a.pick === it.q.a }; });

  function nextEntry(est, answers) {
    const used = new Set(answers.map((a) => a.key));
    const it = cat.pick(est.theta, pool, used, Math.random);
    return it && { key: it.key, order: shuffle(it.q.c.map((_, i) => i)), pick: null };
  }

  // ---------- Flow ----------
  async function start() {
    if (run) {
      const ok = await confirmDialog('มีแบบทดสอบที่ทำค้างไว้ ต้องการเริ่มใหม่และลบผลเดิมทิ้งหรือไม่?', {
        okText: 'เริ่มใหม่', cancelText: 'กลับไปทำต่อ', danger: true,
      });
      if (!ok) return;
    }
    run = { v: 2, startedAt: Date.now(), answers: [], cur: nextEntry(cat.estimate([]), []) };
    save();
    view = 'quiz';
    render();
  }

  function choose(displayIdx) {
    const e = run.cur;
    if (displayIdx >= e.order.length) return;
    e.pick = e.order[displayIdx];
    save();
    renderQuiz();
  }

  function next() {
    if (run.cur.pick === null) return;
    run.answers.push(run.cur);
    const est = cat.estimate(answered(run.answers));
    const reason = cat.stop(run.answers.length, est);
    const entry = reason ? null : nextEntry(est, run.answers);
    if (!entry) { finish(est); return; }
    run.cur = entry;
    save();
    renderQuiz();
    window.scrollTo(0, 0);
  }

  function finish(est) {
    const list = answered(run.answers);
    const level = cat.levelOf(est.theta);
    const byLevel = {};
    for (const lv of cat.LEVELS) {
      const mine = list.filter((a) => a.it.level === lv);
      byLevel[lv] = { right: mine.filter((a) => a.right).length, total: mine.length };
    }
    const probs = cat.levelProbs(est.post);
    finished = {
      level, theta: est.theta, se: est.se, score: cat.scoreOf(est.theta), n: list.length, at: Date.now(),
      byLevel, probs, log: run.answers.slice(),
    };
    const summary = { v: 2, level, target: TARGET[level], score: finished.score, se: est.se, n: finished.n, at: finished.at, byLevel };
    store.set(K.last, summary);
    const history = store.get(K.history, []);
    history.unshift(summary);
    store.set(K.history, history.slice(0, 10));
    store.remove(K.state);
    run = null;
    view = 'result';
    render();
    window.scrollTo(0, 0);
  }

  function goHome() {
    view = 'intro';
    render();
    window.scrollTo(0, 0);
  }

  // ---------- Views ----------
  function render() {
    showTranslateToggle(view === 'result');
    if (view === 'quiz' && run) renderQuiz();
    else if (view === 'result' && finished) renderResult();
    else { view = 'intro'; renderIntro(); }
  }

  const fmtDate = (ms) => new Date(ms).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  const lastName = (last) => (LEVEL_TEXT[last.level] || { name: last.level }).name;

  // 0-100 scale: five bands of 20 points
  function scaleBar(score) {
    const bands = [['A1', 0], ['A2', 20], ['B1', 40], ['B2', 60], ['B2+', 80]];
    const on = (from) => (from === 80 ? score >= 80 : score >= from && score < from + 20);
    return h('div', { class: 'cat-scale', role: 'img', 'aria-label': 'คะแนน ' + score + ' จาก 100' },
      h('div', { class: 'cat-bands' }, bands.map(([name, from]) => h('span', { class: 'cat-band' + (on(from) ? ' on' : ''), text: name }))),
      h('div', { class: 'cat-track' }, h('span', { class: 'cat-marker', style: { left: Math.min(98, Math.max(2, score)) + '%' } })));
  }

  function howItWorks() {
    const rows = [['A1', '0–19'], ['A2', '20–39'], ['B1', '40–59'], ['B2', '60–79'], ['B2 ขึ้นไป', '80–100']];
    return h('details', { class: 'band-details' },
      h('summary', { text: 'ข้อสอบนี้ตัดสินระดับอย่างไร' }),
      h('ul', { class: 'rules' },
        h('li', { text: 'เริ่มจากข้อระดับ A2–B1 แล้วปรับตามคำตอบ: ถูก → ข้อต่อไปยากขึ้น · ผิด → ง่ายลง' }),
        h('li', { text: 'ทุกข้อมีค่าความยากตามระดับ CEFR ระบบคำนวณความสามารถของคุณใหม่ทุกครั้งที่ตอบ แล้วเลือกข้อที่บอกระดับคุณได้ชัดที่สุด (หลักการเดียวกับ Oxford Placement Test และ Linguaskill)' }),
        h('li', { text: 'หยุดเมื่อมั่นใจในระดับ (≥ ' + Math.round(cfg.confidence * 100) + '%) หรือครบ ' + cfg.maxItems + ' ข้อ จึงทำไม่เท่ากันในแต่ละคน และข้อที่ถามอาจไม่ครบทุกระดับ' }),
        h('li', { text: 'ผลเป็นคะแนน 0–100 (ระดับละ 20 คะแนน) แล้วแปลงเป็นระดับ CEFR' })),
      h('table', { class: 'table' },
        h('thead', {}, h('tr', {}, h('th', { text: 'ระดับ' }), h('th', { text: 'คะแนน' }))),
        h('tbody', {}, rows.map((r) => h('tr', {}, r.map((c) => h('td', { text: c })))))),
      h('p', { class: 'fine-print', text: 'ความยากของแต่ละข้อมาจากการประเมินระดับโดยผู้จัดทำ ยังไม่ได้ปรับจากสถิติผู้สอบจริง ผลจึงเป็นการประมาณ' }));
  }

  function renderIntro() {
    const last = store.get(K.last, null);
    setView(
      run && h('div', { class: 'resume' },
        h('p', { text: 'มีแบบทดสอบที่ทำค้างไว้ — ทำไปแล้ว ' + run.answers.length + ' ข้อ' }),
        h('button', { class: 'btn', type: 'button', text: 'ทำต่อจากเดิม', onclick: () => { view = 'quiz'; render(); } })),
      h('p', { class: 'lead', text: 'วัดระดับไวยากรณ์และคำศัพท์ตามมาตรฐาน CEFR ข้อสอบจะปรับความยากตามคำตอบของคุณ ตอบถูกข้อต่อไปจะยากขึ้น ตอบผิดจะง่ายลง' }),
      last && h('p', { class: 'meta stat-line', text: 'ผลล่าสุด: ระดับ ' + lastName(last) + (last.score !== undefined ? ' (' + last.score + '/100)' : '') + ' · ' + fmtDate(last.at) }),
      h('ul', { class: 'rules' },
        h('li', { text: 'ประมาณ 20–25 ข้อ ใช้เวลา 10–15 นาที (แต่ละคนไม่เท่ากัน)' }),
        h('li', { text: 'ไม่มีเฉลยระหว่างทำ ย้อนกลับไม่ได้ และปิดระบบแปลไว้ ดูเฉลยได้หลังจบ' }),
        h('li', { text: 'พักแล้วกลับมาทำต่อได้ ระบบบันทึกให้อัตโนมัติ' })),
      h('div', { class: 'btn-row' }, h('button', { class: 'btn', type: 'button', text: 'เริ่มทำแบบทดสอบ', onclick: start })),
      howItWorks(),
      h('p', { class: 'fine-print', text: 'ผลเป็นการประมาณ เฉพาะไวยากรณ์และคำศัพท์ (ไม่รวมการฟัง การอ่านยาว การเขียน และการพูด) ไม่ใช่ใบรับรองอย่างเป็นทางการ' }));
  }

  function renderQuiz() {
    const e = run.cur;
    const it = byKey.get(e.key);
    const n = run.answers.length + 1;

    const bar = h('div', { class: 'progress', role: 'progressbar', 'aria-label': 'ความคืบหน้า',
      'aria-valuemin': '0', 'aria-valuemax': String(cfg.maxItems), 'aria-valuenow': String(n - 1) },
    h('div', { class: 'progress-fill', style: { width: Math.min(100, ((n - 1) / cfg.maxItems) * 100) + '%' } }));

    setView(
      h('section', { class: 'panel' },
        bar,
        h('div', { class: 'top-bar' }, h('span', { text: 'ข้อ ' + n })),
        h('p', { class: 'question', text: it.q.q }),
        h('div', { class: 'choices', role: 'group', 'aria-label': 'ตัวเลือก' },
          e.order.map((orig, i) => h('button', {
            class: 'choice' + (e.pick === orig ? ' selected' : ''),
            type: 'button',
            'aria-pressed': String(e.pick === orig),
            onclick: () => choose(i),
          },
          h('span', { class: 'choice-key', 'aria-hidden': 'true', text: KEYS[i] }),
          h('span', { text: it.q.c[orig] })))),
        h('div', { class: 'exam-actions' },
          h('button', { class: 'btn btn-block', type: 'button', disabled: e.pick === null, text: 'ถัดไป', onclick: next })),
        h('div', { class: 'quiz-footer' },
          h('button', { class: 'btn btn-ghost btn-sm', type: 'button', text: '← พักไว้ก่อน (บันทึกอัตโนมัติ)', onclick: goHome }))));
  }

  function renderResult() {
    const f = finished;
    const info = LEVEL_TEXT[f.level];
    const lo = Math.max(0, Math.round(f.score - (f.se * 100) / 6));
    const hi = Math.min(100, Math.round(f.score + (f.se * 100) / 6));

    // next to a band edge? say so
    const idx = cat.levelIndex(f.theta);
    const names = cat.NAMES;
    const near = [];
    if (idx > 1 && f.probs[idx - 1] >= 0.25) near.push(names[idx - 1]);
    if (idx < names.length - 1 && f.probs[idx + 1] >= 0.25) near.push(names[idx + 1]);

    const rows = cat.LEVELS.map((lv) => {
      const r = f.byLevel[lv];
      return h('li', { class: 'stage-row' },
        h('span', { class: 'stage-lv', text: lv }),
        h('span', { class: 'bar' }, h('span', { class: 'bar-fill', style: { width: r.total ? Math.round((r.right / r.total) * 100) + '%' : '0%' } })),
        h('span', { class: 'stage-score', text: r.total ? r.right + '/' + r.total : '—' }),
        h('span', { class: 'stage-state', text: r.total ? '' : 'ไม่ได้ถูกถาม' }));
    });

    const target = TARGET[f.level];
    const recommended = lessons.filter((l) => l.level === target);

    const wrong = f.log.filter((a) => a.pick !== byKey.get(a.key).q.a);
    const review = wrong.length > 0 && h('div', { class: 'review' },
      h('h3', { text: 'ข้อที่ตอบผิด (' + wrong.length + ')' }),
      wrong.map((a) => {
        const it = byKey.get(a.key);
        const q = it.q;
        return h('div', { class: 'review-item' },
          h('p', { class: 'review-q', 'data-tr': true, text: '[' + it.level + '] ' + q.q }),
          h('p', { class: a.pick === null ? 'meta' : 'review-you', text: a.pick === null ? 'ไม่ได้ตอบ' : '✗ คุณตอบ: ' + q.c[a.pick] }),
          h('p', { class: 'review-right', text: '✓ เฉลย: ' + q.c[q.a] }),
          h('p', { class: 'review-expl', 'data-tr': true }, rich(q.e)),
          window.CEFR.markup && window.CEFR.markup.block({ bank: it.src, key: it.id, q: q.q, answer: q.c[q.a] }));
      }));

    setView(
      h('section', { class: 'panel summary' },
        h('h2', { text: 'ผลการวัดระดับ (ประมาณการ)' }),
        h('div', { class: 'score level-big', text: info.name }),
        h('p', { class: 'score-sub', text: info.desc }),
        h('p', { class: 'meta stat-line', text: 'คะแนน ' + f.score + '/100 (ช่วงที่น่าจะเป็น ' + lo + '–' + hi + ') · ตอบ ' + f.n + ' ข้อ' }),
        scaleBar(f.score),
        near.length > 0 && h('p', { class: 'meta', text: 'ผลอยู่ใกล้เส้นแบ่งกับระดับ ' + near.join(' / ') + ' ลองทำอีกครั้งในวันอื่นอาจได้ต่างไปเล็กน้อย' }),
        h('h3', { class: 'section-title', text: 'ตอบถูกในข้อของแต่ละระดับ' }),
        h('ul', { class: 'stage-rows' }, rows),
        h('p', { class: 'fine-print', style: { marginTop: '-16px' }, text: 'ระบบเลือกข้อที่ใกล้ระดับคุณ จึงไม่ได้ถามครบทุกระดับ' }),
        recommended.length > 0 && h('div', { class: 'recommend' },
          h('h3', { text: 'แนะนำให้เรียนต่อ (ระดับ ' + target + ')' }),
          h('ul', {}, recommended.slice(0, 5).map((l) => h('li', {}, h('a', { href: 'learn.html#' + l.id, text: l.title + ' — ' + l.en })))),
          recommended.length > 5 && h('p', { class: 'meta' }, h('a', { href: 'index.html#learn', text: 'ดูบทเรียนทั้งหมด (' + recommended.length + ' บทในระดับนี้) →' }))),
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn', type: 'button', text: 'ทำแบบทดสอบใหม่', onclick: start }),
          h('a', { class: 'btn btn-outline', href: 'index.html#learn', text: 'ไปที่บทเรียน' }),
          h('button', { class: 'btn btn-outline', type: 'button', text: 'กลับหน้าแรก', onclick: goHome })),
        h('p', { class: 'fine-print', text: 'ผลนี้ประมาณจากข้อสอบสั้นๆ เฉพาะไวยากรณ์และคำศัพท์ ไม่ใช่ใบรับรองระดับอย่างเป็นทางการ' }),
        review));
  }

  // ---------- Keyboard ----------
  document.addEventListener('keydown', (e) => {
    if (view !== 'quiz' || !run || e.ctrlKey || e.metaKey || e.altKey || dialogOpen()) return;
    if (e.key === 'Enter') {
      if (run.cur.pick !== null) { e.preventDefault(); next(); }
      return;
    }
    const idx = KEYS.indexOf(e.key);
    if (e.key.length === 1 && idx >= 0 && idx < run.cur.order.length) choose(idx);
  });

  render();
})();
