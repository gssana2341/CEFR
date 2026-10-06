// CEFR placement test - adaptive. Right answer → the next question is harder, wrong answer → easier, until the level is clear.
// No feedback while testing. The questions, the answers and the choice of the next question all live on the server
// (api/quiz.js, api/_cat.js): this page only shows the question it is given and sends the pick back.
(function () {
  'use strict';

  const { store, shuffle, h, rich, confirmDialog, dialogOpen } = window.CEFR;

  const D = window.CEFR_DATA;
  const lessons = D.lessons || [];
  const LEVELS = ['A1', 'A2', 'B1', 'B2'];
  const root = document.getElementById('app');
  const trToggle = document.querySelector('[data-translate-toggle]');

  const KEYS = '1234';
  const helpOn = () => store.get('translate:test', false) === true;   // click-to-translate on the question while testing (off by default)
  const K = { state: 'placement:state', last: 'placement:last', history: 'placement:history' };

  const LEVEL_TEXT = {
    'pre-A1': { name: 'ต่ำกว่า A1', desc: 'ยังอยู่ในช่วงเริ่มต้น แนะนำให้เริ่มจากโครงสร้างพื้นฐาน เช่น to be, present simple และคำศัพท์ใกล้ตัว' },
    A1: { name: 'A1', desc: 'ใช้ประโยคง่ายๆ แนะนำตัวและถามตอบเรื่องใกล้ตัวได้ เมื่อคู่สนทนาพูดช้าและชัดเจน' },
    A2: { name: 'A2', desc: 'สื่อสารเรื่องที่คุ้นเคยในชีวิตประจำวัน เช่น ครอบครัว การซื้อของ งาน ด้วยประโยคสั้นๆ ได้' },
    B1: { name: 'B1', desc: 'รับมือสถานการณ์ส่วนใหญ่ได้ เล่าประสบการณ์ แผนการ และเหตุผลได้พอสมควร และเข้าใจประเด็นหลักของเรื่องที่คุ้นเคย' },
    B2: { name: 'B2', desc: 'เข้าใจเนื้อหาที่ซับซ้อนทั้งเรื่องทั่วไปและเฉพาะทาง และโต้ตอบได้คล่องพอจะสนทนากับเจ้าของภาษาได้อย่างไม่ติดขัด' },
    'B2+': { name: 'B2 ขึ้นไป', desc: 'ทำข้อสอบระดับ B2 ได้ดีมาก ตอนนี้ข้อสอบวัดได้ถึง B2 เท่านั้น (ระดับ C1–C2 กำลังจัดทำ) ลองสอบจริงเช่น EF SET หรือทำสอบจำลองในเว็บนี้' },
  };

  // lessons to read next: the level above the one you reached (A1 for beginners, B2 stays B2)
  const TARGET = { 'pre-A1': 'A1', A1: 'A2', A2: 'B1', B1: 'B2', B2: 'B2', 'B2+': 'B2' };

  // run = { v: 3, sid, step, n, max, cur: { key, q, c, order, pick } } - the question on screen and the server session it belongs to
  let run = loadRun();     // unfinished run restored from storage
  let finished = null;     // result of the run just completed
  let view = 'intro';      // 'intro' | 'quiz' | 'result'
  let busy = false;        // a request is on its way
  let note = '';           // message for the intro screen

  // ---------- State ----------
  // (function declarations on purpose: loadRun() above runs before this point in the file)
  function validCur(c) {
    return !!c && typeof c.key === 'string' && typeof c.q === 'string' && Array.isArray(c.c) && c.c.length >= 2
      && Array.isArray(c.order) && c.order.length === c.c.length && [...c.order].sort((a, b) => a - b).every((v, i) => v === i)
      && (c.pick === null || (Number.isInteger(c.pick) && c.pick >= 0 && c.pick < c.c.length));
  }

  function loadRun() {
    const r = store.get(K.state, null);
    const ok = r && r.v === 3 && typeof r.sid === 'string' && Number.isInteger(r.step) && Number.isInteger(r.n) && Number.isInteger(r.max) && validCur(r.cur);
    if (!ok) {
      if (r) store.remove(K.state);
      return null;
    }
    return r;
  }

  const save = () => store.set(K.state, run);
  const setView = (...nodes) => root.replaceChildren(...nodes.flat(Infinity).filter(Boolean));
  const showTranslateToggle = (on) => { if (trToggle) trToggle.hidden = !on; };

  // the server's answer to start / answer: the next question, or the final result
  function apply(d) {
    if (d.done) { finish(d.result); return; }
    run = {
      v: 3, sid: d.sid || run.sid, step: d.step, n: d.n, max: d.max,
      cur: { key: d.question.key, q: d.question.q, c: d.question.c, order: shuffle(d.question.c.map((_, i) => i)), pick: null },
    };
    save();
    view = 'quiz';
    render();
    window.scrollTo(0, 0);
  }

  function failed(e) {
    busy = false;
    if (e.status === 404) {                                   // the session expired on the server
      store.remove(K.state);
      run = null;
      note = 'แบบทดสอบที่ค้างไว้หมดอายุแล้ว กรุณาเริ่มใหม่';
      view = 'intro';
      render();
      return;
    }
    note = e.status === 429 ? 'ส่งบ่อยเกินไป รอสักครู่แล้วลองใหม่' : 'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่';
    if (run) { view = 'quiz'; renderQuiz(); } else render();
  }

  // ---------- Flow ----------
  async function start() {
    if (busy) return;
    if (run) {
      const ok = await confirmDialog('มีแบบทดสอบที่ทำค้างไว้ ต้องการเริ่มใหม่และลบผลเดิมทิ้งหรือไม่?', {
        okText: 'เริ่มใหม่', cancelText: 'กลับไปทำต่อ', danger: true,
      });
      if (!ok) return;
    }
    busy = true;
    note = '';
    setView(h('p', { class: 'meta', text: 'กำลังเตรียมข้อสอบ…' }));
    try {
      const d = await window.CEFR.content.post({ op: 'placement' });
      busy = false;
      run = null;
      store.remove(K.state);
      apply(d);
    } catch (e) {
      failed(e);
    }
  }

  function choose(displayIdx) {
    const e = run.cur;
    if (busy || displayIdx >= e.order.length) return;
    e.pick = e.order[displayIdx];
    save();
    renderQuiz();
  }

  async function next() {
    if (busy || run.cur.pick === null) return;
    busy = true;
    note = '';
    const btn = root.querySelector('.exam-actions .btn');
    if (btn) btn.disabled = true;
    try {
      const d = await window.CEFR.content.post({ op: 'placement', sid: run.sid, step: run.step, pick: run.cur.pick });
      busy = false;
      apply(d);
    } catch (e) {
      failed(e);
    }
  }

  function finish(result) {
    finished = { ...result, at: Date.now() };
    const level = finished.level;
    for (const r of finished.review) window.CEFR.content.setClue(r.bank, r.key, r.clue);
    const summary = { v: 2, level, target: TARGET[level], score: finished.score, se: finished.se, n: finished.n, at: finished.at, byLevel: finished.byLevel };
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
    window.CEFR.setView(view === 'quiz' && run ? 'quiz' : view === 'result' && finished ? 'result' : 'intro');
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
        h('li', { text: 'หยุดเมื่อมั่นใจในระดับ (≥ 85%) หรือครบ 25 ข้อ จึงทำไม่เท่ากันในแต่ละคน และข้อที่ถามอาจไม่ครบทุกระดับ' }),
        h('li', { text: 'ผลเป็นคะแนน 0–100 (ระดับละ 20 คะแนน) แล้วแปลงเป็นระดับ CEFR' })),
      h('table', { class: 'table' },
        h('thead', {}, h('tr', {}, h('th', { text: 'ระดับ' }), h('th', { text: 'คะแนน' }))),
        h('tbody', {}, rows.map((r) => h('tr', {}, r.map((c) => h('td', { text: c })))))),
      h('p', { class: 'fine-print', text: 'ความยากของแต่ละข้อมาจากการประเมินระดับโดยผู้จัดทำ ยังไม่ได้ปรับจากสถิติผู้สอบจริง ผลจึงเป็นการประมาณ' }));
  }

  function renderIntro() {
    const last = store.get(K.last, null);
    setView(
      note && h('p', { class: 'meta', role: 'alert', text: note }),
      run && h('div', { class: 'resume' },
        h('p', { text: 'มีแบบทดสอบที่ทำค้างไว้ — ทำไปแล้ว ' + (run.n - 1) + ' ข้อ' }),
        h('button', { class: 'btn', type: 'button', text: 'ทำต่อจากเดิม', onclick: () => { note = ''; view = 'quiz'; render(); } })),
      h('p', { class: 'lead', text: 'วัดระดับไวยากรณ์และคำศัพท์ตามมาตรฐาน CEFR ข้อสอบจะปรับความยากตามคำตอบของคุณ ตอบถูกข้อต่อไปจะยากขึ้น ตอบผิดจะง่ายลง' }),
      last && h('p', { class: 'meta stat-line', text: 'ผลล่าสุด: ระดับ ' + lastName(last) + (last.score !== undefined ? ' (' + last.score + '/100)' : '') + ' · ' + fmtDate(last.at) }),
      h('ul', { class: 'rules' },
        h('li', { text: 'ประมาณ 20–25 ข้อ ใช้เวลา 10–15 นาที (แต่ละคนไม่เท่ากัน) · วัดได้ถึงระดับ B2 (C1–C2 กำลังจัดทำ)' }),
        h('li', { text: 'ไม่มีเฉลยระหว่างทำ และย้อนกลับไม่ได้ · ระบบแปลปิดไว้เหมือนข้อสอบจริง (เปิด "ช่วยแปลโจทย์" ได้ที่ใต้ข้อ ถ้าต้องการ)' }),
        h('li', { text: 'พักแล้วกลับมาทำต่อได้ ระบบบันทึกให้อัตโนมัติ' })),
      h('div', { class: 'btn-row' }, h('button', { class: 'btn', type: 'button', text: 'เริ่มทำแบบทดสอบ', onclick: start })),
      howItWorks(),
      h('p', { class: 'fine-print', text: 'ผลเป็นการประมาณ เฉพาะไวยากรณ์และคำศัพท์ (ไม่รวมการฟัง การอ่านยาว การเขียน และการพูด) ไม่ใช่ใบรับรองอย่างเป็นทางการ' }));
  }

  function renderQuiz() {
    const e = run.cur;
    const n = run.n;

    const bar = h('div', { class: 'progress', role: 'progressbar', 'aria-label': 'ความคืบหน้า',
      'aria-valuemin': '0', 'aria-valuemax': String(run.max), 'aria-valuenow': String(n - 1) },
    h('div', { class: 'progress-fill', style: { width: Math.min(100, ((n - 1) / run.max) * 100) + '%' } }));

    setView(
      h('section', { class: 'panel' },
        h('div', { class: 'focus-bar' },
          h('button', { class: 'focus-exit', type: 'button', 'aria-label': 'พักไว้ก่อน (บันทึกอัตโนมัติ)', title: 'พักไว้ก่อน (บันทึกอัตโนมัติ)', text: '←', onclick: goHome }),
          bar,
          h('span', { class: 'focus-count', text: 'ข้อ ' + n })),
        h('p', { class: 'question', 'data-tr': helpOn() ? true : null, text: e.q }),
        h('div', { class: 'choices', role: 'group', 'aria-label': 'ตัวเลือก' },
          e.order.map((orig, i) => h('button', {
            class: 'choice' + (e.pick === orig ? ' selected' : ''),
            type: 'button',
            'aria-pressed': String(e.pick === orig),
            onclick: () => choose(i),
          },
          h('span', { class: 'choice-key', 'aria-hidden': 'true', text: KEYS[i] }),
          h('span', { text: e.c[orig] })))),
        note && h('p', { class: 'meta', role: 'alert', text: note }),
        h('div', { class: 'exam-actions' },
          h('button', { class: 'btn btn-block', type: 'button', disabled: e.pick === null, text: 'ถัดไป', onclick: next })),
        h('div', { class: 'quiz-footer' },
          h('button', { class: 'btn btn-ghost btn-sm', type: 'button', 'aria-pressed': String(helpOn()), text: 'ช่วยแปลโจทย์: ' + (helpOn() ? 'เปิด' : 'ปิด'),
            onclick: () => { store.set('translate:test', !helpOn()); renderQuiz(); } }))));
  }

  function renderResult() {
    const f = finished;
    const info = LEVEL_TEXT[f.level];
    const lo = Math.max(0, Math.round(f.score - (f.se * 100) / 6));
    const hi = Math.min(100, Math.round(f.score + (f.se * 100) / 6));

    const near = f.near || [];

    const rows = LEVELS.map((lv) => {
      const r = f.byLevel[lv];
      return h('li', { class: 'stage-row' },
        h('span', { class: 'stage-lv', text: lv }),
        h('span', { class: 'bar' }, h('span', { class: 'bar-fill', style: { width: r.total ? Math.round((r.right / r.total) * 100) + '%' : '0%' } })),
        h('span', { class: 'stage-score', text: r.total ? r.right + '/' + r.total : '—' }),
        h('span', { class: 'stage-state', text: r.total ? '' : 'ไม่ได้ถูกถาม' }));
    });

    const target = TARGET[f.level];
    const recommended = lessons.filter((l) => l.level === target);

    const wrong = f.review;
    const review = wrong.length > 0 && h('div', { class: 'review' },
      h('h3', { text: 'ข้อที่ตอบผิด (' + wrong.length + ')' }),
      wrong.map((q) => h('div', { class: 'review-item' },
        h('p', { class: 'review-q', 'data-tr': true, text: '[' + q.level + '] ' + q.q }),
        h('p', { class: q.pick === null ? 'meta' : 'review-you', text: q.pick === null ? 'ไม่ได้ตอบ' : '✗ คุณตอบ: ' + q.c[q.pick] }),
        h('p', { class: 'review-right', text: '✓ เฉลย: ' + q.c[q.a] }),
        h('p', { class: 'review-expl', 'data-tr': true }, rich(q.e)),
        window.CEFR.markup && window.CEFR.markup.block({ bank: q.bank, key: q.key, q: q.q, answer: q.c[q.a] }))));

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
          h('ul', {}, recommended.slice(0, 5).map((l) => h('li', {}, h('a', { href: 'learn.html#' + l.id, text: l.title + ' — ' + l.en }), window.CEFR.pass && window.CEFR.pass.members('lesson:' + l.level) && !window.CEFR.pass.active() && h('span', { class: 'free-tag', text: ' สมาชิก' })))),
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
    if (view !== 'quiz' || !run || busy || e.ctrlKey || e.metaKey || e.altKey || dialogOpen()) return;
    if (e.key === 'Enter') {
      if (run.cur.pick !== null) { e.preventDefault(); next(); }
      return;
    }
    const idx = KEYS.indexOf(e.key);
    if (e.key.length === 1 && idx >= 0 && idx < run.cur.order.length) choose(idx);
  });

  render();
})();
