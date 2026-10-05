// CEFR placement test: 4 stages (A1 → A2 → B1 → B2), 10 questions each, no feedback while answering.
// Pass a stage with ≥ 70% to unlock the next one; the last stage you pass is your level.
(function () {
  'use strict';

  const { store, shuffle, pct, h, rich, confirmDialog, dialogOpen } = window.CEFR;

  const bank = window.CEFR_DATA.placement;
  const lessons = window.CEFR_DATA.lessons || [];
  const byId = new Map(bank.map((q) => [q.id, q]));
  const root = document.getElementById('app');
  const trToggle = document.querySelector('[data-translate-toggle]');

  const STAGES = ['A1', 'A2', 'B1', 'B2'];
  const PER_STAGE = 10;
  const PASS_RATIO = 0.7;
  const KEYS = '1234';
  const K = { state: 'placement:state', last: 'placement:last', history: 'placement:history' };

  const LEVEL_TEXT = {
    'pre-A1': {
      name: 'ต่ำกว่า A1',
      desc: 'ยังอยู่ในช่วงเริ่มต้น แนะนำให้เริ่มจากโครงสร้างพื้นฐาน เช่น to be, present simple และคำศัพท์ใกล้ตัว',
    },
    A1: {
      name: 'A1',
      desc: 'ใช้ประโยคง่ายๆ แนะนำตัวและถามตอบเรื่องใกล้ตัวได้ เมื่อคู่สนทนาพูดช้าและชัดเจน',
    },
    A2: {
      name: 'A2',
      desc: 'สื่อสารเรื่องที่คุ้นเคยในชีวิตประจำวัน เช่น ครอบครัว การซื้อของ งาน ด้วยประโยคสั้นๆ ได้',
    },
    B1: {
      name: 'B1',
      desc: 'รับมือสถานการณ์ส่วนใหญ่ได้ เล่าประสบการณ์ แผนการ และเหตุผลได้พอสมควร และเข้าใจประเด็นหลักของเรื่องที่คุ้นเคย',
    },
    B2: {
      name: 'B2',
      desc: 'เข้าใจเนื้อหาที่ซับซ้อนทั้งเรื่องทั่วไปและเฉพาะทาง และโต้ตอบได้คล่องพอจะสนทนากับเจ้าของภาษาได้อย่างไม่ติดขัด',
    },
  };

  let run = loadRun();     // unfinished run restored from storage
  let finished = null;     // last finished run (result screen)
  let view = 'intro';      // 'intro' | 'quiz' | 'between' | 'result'

  // ---------- State helpers ----------
  function itemsValid(items) {
    return Array.isArray(items) && items.every((it) => {
      const q = byId.get(it.id);
      if (!q || !Array.isArray(it.order) || it.order.length !== q.c.length) return false;
      if ([...it.order].sort((a, b) => a - b).some((v, i) => v !== i)) return false;
      return it.pick === null || (Number.isInteger(it.pick) && it.pick >= 0 && it.pick < q.c.length);
    });
  }

  function loadRun() {
    const r = store.get(K.state, null);
    const ok = r && r.v === 1 && Number.isInteger(r.stage) && r.stage >= 0 && r.stage < STAGES.length
      && itemsValid(r.items) && r.items.length > 0 && r.index >= 0 && r.index < r.items.length
      && Array.isArray(r.results) && r.results.length === r.stage   // one result per completed stage (also while "between")
      && itemsValid(r.log);
    if (!ok) {
      if (r) store.remove(K.state);
      return null;
    }
    return r;
  }

  const save = () => store.set(K.state, run);
  const isRight = (it) => it.pick !== null && it.pick === byId.get(it.id).a;
  const setView = (...nodes) => root.replaceChildren(...nodes.flat(Infinity).filter(Boolean));
  const showTranslateToggle = (on) => { if (trToggle) trToggle.hidden = !on; };

  function buildStage(stageIdx) {
    const pool = bank.filter((q) => q.level === STAGES[stageIdx]);
    return shuffle(pool).slice(0, PER_STAGE).map((q) => ({ id: q.id, order: shuffle(q.c.map((_, i) => i)), pick: null }));
  }

  // ---------- Flow ----------
  async function start() {
    if (run) {
      const ok = await confirmDialog('มีแบบทดสอบที่ทำค้างไว้ ต้องการเริ่มใหม่และลบผลเดิมทิ้งหรือไม่?', {
        okText: 'เริ่มใหม่', cancelText: 'กลับไปทำต่อ', danger: true,
      });
      if (!ok) return;
    }
    run = { v: 1, stage: 0, index: 0, items: buildStage(0), results: [], log: [], between: false };
    save();
    view = 'quiz';
    render();
  }

  function answer(displayIdx) {
    const it = run.items[run.index];
    if (displayIdx >= it.order.length) return;
    it.pick = it.order[displayIdx];
    save();
    renderQuiz();
  }

  function next() {
    const it = run.items[run.index];
    if (it.pick === null) return;
    if (run.index < run.items.length - 1) {
      run.index++;
      save();
      renderQuiz();
      window.scrollTo(0, 0);
    } else {
      endStage();
    }
  }

  function endStage() {
    const level = STAGES[run.stage];
    const score = run.items.filter(isRight).length;
    run.results.push({ level, score, total: run.items.length });
    run.log.push(...run.items);
    const passed = score / run.items.length >= PASS_RATIO;
    if (passed && run.stage < STAGES.length - 1) {
      run.stage++;
      run.index = 0;
      run.items = buildStage(run.stage);
      run.between = true;
      save();
      view = 'between';
      render();
    } else {
      finish();
    }
    window.scrollTo(0, 0);
  }

  function finish() {
    let reached = 0;
    for (const r of run.results) { if (r.score / r.total >= PASS_RATIO) reached++; else break; }
    const level = reached === 0 ? 'pre-A1' : STAGES[reached - 1];
    finished = { results: run.results, log: run.log, level, at: Date.now() };
    store.set(K.last, { level, at: finished.at, results: run.results });
    const history = store.get(K.history, []);
    history.unshift({ level, at: finished.at, results: run.results });
    store.set(K.history, history.slice(0, 10));
    store.remove(K.state);
    run = null;
    view = 'result';
    render();
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
    else if (view === 'between' && run) renderBetween();
    else if (view === 'result' && finished) renderResult();
    else { view = 'intro'; renderIntro(); }
  }

  const fmtDate = (ms) => new Date(ms).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

  function renderIntro() {
    const last = store.get(K.last, null);
    const total = STAGES.length * PER_STAGE;
    setView(
      run && h('div', { class: 'resume' },
        h('p', { text: 'มีแบบทดสอบที่ทำค้างไว้ — ระดับ ' + STAGES[run.stage] + (run.between ? ' (รอเริ่ม)' : ' ข้อ ' + (run.index + 1) + '/' + run.items.length) }),
        h('button', { class: 'btn', type: 'button', text: 'ทำต่อจากเดิม', onclick: () => { view = run.between ? 'between' : 'quiz'; render(); } })
      ),
      h('p', { class: 'lead', text: 'วัดระดับไวยากรณ์และคำศัพท์ของคุณตามมาตรฐาน CEFR ตั้งแต่ A1 ถึง B2 ใช้เวลาประมาณ 15–20 นาที' }),
      last && h('p', { class: 'meta stat-line', text: 'ผลล่าสุด: ระดับ ' + LEVEL_TEXT[last.level].name + ' · ' + fmtDate(last.at) }),
      h('ul', { class: 'rules' },
        h('li', { text: 'ทำทีละระดับ A1 → A2 → B1 → B2 ระดับละ ' + PER_STAGE + ' ข้อ (สุ่มข้อทุกครั้ง)' }),
        h('li', { text: 'ผ่านระดับด้วยคะแนน ≥ ' + Math.round(PASS_RATIO * 100) + '% จึงไปต่อระดับถัดไป ระดับสุดท้ายที่ผ่านคือระดับของคุณ' }),
        h('li', { text: 'ไม่มีเฉลยระหว่างทำ และปิดระบบแปลไว้ จะเห็นเฉลยและคำอธิบายหลังจบ' }),
        h('li', { text: 'พักแล้วกลับมาทำต่อได้ ระบบบันทึกให้อัตโนมัติ' })
      ),
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn', type: 'button', text: 'เริ่มทำแบบทดสอบ', onclick: start })
      ),
      h('p', { class: 'fine-print', text: 'สูงสุด ' + total + ' ข้อ · ผลเป็นการประมาณจากข้อสอบสั้นๆ เฉพาะไวยากรณ์และคำศัพท์ (ยังไม่รวมการฟัง การอ่านยาว การเขียน และการพูด) ไม่ใช่ใบรับรองอย่างเป็นทางการ' })
    );
  }

  function stageTrack() {
    return h('ol', { class: 'stage-track', 'aria-label': 'ระดับ' },
      STAGES.map((lv, i) => {
        const r = run.results[i];
        const state = r ? 'done' : i === run.stage ? 'now' : '';
        return h('li', { class: 'stage ' + state },
          h('span', { text: lv }), r && h('span', { class: 'stage-mark', text: ' ✓' }));
      }));
  }

  function renderQuiz() {
    const it = run.items[run.index];
    const q = byId.get(it.id);
    const last = run.index === run.items.length - 1;

    const bar = h('div', { class: 'progress', role: 'progressbar', 'aria-label': 'ความคืบหน้าของระดับนี้',
      'aria-valuemin': '0', 'aria-valuemax': String(run.items.length), 'aria-valuenow': String(run.index) },
    h('div', { class: 'progress-fill', style: { width: pct(run.index, run.items.length) + '%' } }));

    const nextBtn = h('button', {
      class: 'btn btn-block',
      type: 'button',
      disabled: it.pick === null,
      text: last ? 'จบระดับ ' + STAGES[run.stage] : 'ถัดไป',
      onclick: next,
    });

    setView(
      h('section', { class: 'panel' },
        stageTrack(),
        bar,
        h('div', { class: 'top-bar' },
          h('span', { text: 'ระดับ ' + STAGES[run.stage] + ' · ข้อ ' + (run.index + 1) + '/' + run.items.length })
        ),
        h('p', { class: 'question', text: q.q }),
        h('div', { class: 'choices', role: 'group', 'aria-label': 'ตัวเลือก' },
          it.order.map((orig, i) => h('button', {
            class: 'choice' + (it.pick === orig ? ' selected' : ''),
            type: 'button',
            'aria-pressed': String(it.pick === orig),
            onclick: () => answer(i),
          },
          h('span', { class: 'choice-key', 'aria-hidden': 'true', text: KEYS[i] }),
          h('span', { text: q.c[orig] })))),
        h('div', { class: 'exam-actions' }, nextBtn),
        h('div', { class: 'quiz-footer' },
          h('button', { class: 'btn btn-ghost btn-sm', type: 'button', text: '← พักไว้ก่อน (บันทึกอัตโนมัติ)', onclick: goHome })
        )
      )
    );
  }

  function renderBetween() {
    const r = run.results[run.results.length - 1];
    setView(
      h('section', { class: 'panel' },
        h('p', { class: 'eyebrow', text: 'ผ่านระดับ ' + r.level }),
        h('div', { class: 'score', text: r.score + ' / ' + r.total }),
        h('p', { class: 'score-sub', text: 'ไปต่อที่ระดับ ' + STAGES[run.stage] + ' (ยากขึ้นเล็กน้อย)' }),
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn', type: 'button', text: 'ทำระดับ ' + STAGES[run.stage], onclick: () => { run.between = false; save(); view = 'quiz'; render(); window.scrollTo(0, 0); } }),
          h('button', { class: 'btn btn-outline', type: 'button', text: 'พักไว้ก่อน', onclick: goHome })
        )
      )
    );
  }

  function renderResult() {
    const f = finished;
    const info = LEVEL_TEXT[f.level];
    const failed = f.results.find((r) => r.score / r.total < PASS_RATIO);
    const focusLevel = failed ? failed.level : null;
    const recommended = focusLevel ? lessons.filter((l) => l.level === focusLevel) : [];

    const rows = STAGES.map((lv, i) => {
      const r = f.results[i];
      const ok = r && r.score / r.total >= PASS_RATIO;
      return h('li', { class: 'stage-row' },
        h('span', { class: 'stage-lv', text: lv }),
        h('span', { class: 'bar' }, h('span', { class: 'bar-fill' + (ok ? ' ok' : ''), style: { width: r ? pct(r.score, r.total) + '%' : '0%' } })),
        h('span', { class: 'stage-score', text: r ? r.score + '/' + r.total : '—' }),
        h('span', { class: 'stage-state ' + (ok ? 'ok' : ''), text: r ? (ok ? 'ผ่าน' : 'ไม่ผ่าน') : 'ไม่ได้ทำ' }));
    });

    const wrongItems = f.log.filter((it) => !isRight(it));
    const review = wrongItems.length > 0 && h('div', { class: 'review' },
      h('h3', { text: 'ข้อที่ตอบผิด (' + wrongItems.length + ')' }),
      wrongItems.map((it) => {
        const q = byId.get(it.id);
        return h('div', { class: 'review-item' },
          h('p', { class: 'review-q', 'data-tr': true, text: '[' + q.level + '] ' + q.q }),
          h('p', { class: it.pick === null ? 'meta' : 'review-you', text: it.pick === null ? 'ไม่ได้ตอบ' : '✗ คุณตอบ: ' + q.c[it.pick] }),
          h('p', { class: 'review-right', text: '✓ เฉลย: ' + q.c[q.a] }),
          h('p', { class: 'review-expl', 'data-tr': true }, rich(q.e)));
      }));

    setView(
      h('section', { class: 'panel summary' },
        h('h2', { text: 'ผลการวัดระดับ (ประมาณการ)' }),
        h('div', { class: 'score level-big', text: info.name }),
        h('p', { class: 'score-sub', text: info.desc }),
        h('ul', { class: 'stage-rows' }, rows),
        recommended.length > 0 && h('div', { class: 'recommend' },
          h('h3', { text: 'แนะนำให้เรียนต่อ (ระดับ ' + focusLevel + ')' }),
          h('ul', {}, recommended.map((l) => h('li', {}, h('a', { href: 'learn.html#' + l.id, text: l.title + ' — ' + l.en }))))),
        !failed && h('p', { class: 'meta', text: 'คุณผ่านครบทุกระดับในแบบทดสอบนี้ ลองฝึกทำข้อสอบจำลองสอบจริงเพื่อทดสอบความพร้อม' }),
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn', type: 'button', text: 'ทำแบบทดสอบใหม่', onclick: start }),
          h('a', { class: 'btn btn-outline', href: 'index.html#learn', text: 'ไปที่บทเรียน' }),
          h('button', { class: 'btn btn-outline', type: 'button', text: 'กลับหน้าแรก', onclick: goHome })
        ),
        h('p', { class: 'fine-print', text: 'ผลนี้ประมาณจากข้อสอบสั้นๆ เฉพาะไวยากรณ์และคำศัพท์ ไม่ใช่ใบรับรองระดับอย่างเป็นทางการ' }),
        review
      )
    );
  }

  // ---------- Keyboard ----------
  document.addEventListener('keydown', (e) => {
    if (view !== 'quiz' || !run || e.ctrlKey || e.metaKey || e.altKey || dialogOpen()) return;
    const it = run.items[run.index];
    if (e.key === 'Enter') {
      if (it.pick !== null) { e.preventDefault(); next(); }
      return;
    }
    const idx = KEYS.indexOf(e.key);
    if (e.key.length === 1 && idx >= 0 && idx < it.order.length) answer(idx);
  });

  render();
})();
