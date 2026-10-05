// Mock exam: timed, no feedback while answering, free navigation between questions, flag for review,
// automatic submission when time runs out. Parts come from CEFR_DATA.exam (assets/data/exam.js).
(function () {
  'use strict';

  const { store, shuffle, pct, h, rich, confirmDialog, dialogOpen } = window.CEFR;

  const D = window.CEFR_DATA;
  const cfg = D.exam;
  const root = document.getElementById('app');
  const trToggle = document.querySelector('[data-translate-toggle]');

  const K = { state: 'exam:state', history: 'exam:history' };
  const KEYS = '12345';
  const DURATION_MS = cfg.durationMin * 60000;

  const parts = cfg.parts.filter((p) => p.type === 'mcq' || p.type === 'cloze'); // other types: see README
  const partById = new Map(parts.map((p) => [p.id, p]));
  const mcqLookup = {};
  parts.filter((p) => p.type === 'mcq').forEach((p) => { mcqLookup[p.source] = new Map(D[p.source].map((q) => [q.n, q])); });

  let state = loadState();     // exam in progress (persisted)
  let finished = null;         // result of the exam just submitted
  let view = 'intro';          // 'intro' | 'exam' | 'result'
  let timerId = 0;
  let filter = 'all';

  // ---------- Items ----------
  const questionOf = (it) => mcqLookup[partById.get(it.part).source].get(it.n);
  const passageOf = (it) => D.cloze[it.idx];
  const pointsOf = (it) => (it.kind === 'mcq' ? 1 : passageOf(it).blanks.length);
  const unitsAnswered = (it) => (it.kind === 'mcq' ? (it.pick !== null ? 1 : 0) : it.picks.filter((p) => p !== null).length);
  const earnedOf = (it) => (it.kind === 'mcq'
    ? (it.pick === questionOf(it).a ? 1 : 0)
    : passageOf(it).blanks.reduce((s, b, i) => s + (it.picks[i] === b.a ? 1 : 0), 0));

  function buildItems() {
    const items = [];
    for (const part of parts) {
      if (part.type === 'mcq') {
        shuffle(D[part.source]).slice(0, part.count).forEach((q) => {
          items.push({ part: part.id, kind: 'mcq', n: q.n, order: shuffle(q.c.map((_, i) => i)), pick: null, flag: false });
        });
      } else {
        shuffle(D.cloze.map((_, i) => i)).slice(0, part.count).forEach((idx) => {
          const blanks = D.cloze[idx].blanks;
          items.push({
            part: part.id, kind: 'cloze', idx,
            orders: blanks.map((b) => shuffle(b.c.map((_, i) => i))),
            picks: blanks.map(() => null),
            flag: false,
          });
        });
      }
    }
    return items;
  }

  function loadState() {
    const s = store.get(K.state, null);
    if (!s || s.v !== 1 || !Array.isArray(s.items) || !s.items.length || !(s.startedAt > 0)) return null;
    const ok = s.items.every((it) => {
      const part = partById.get(it.part);
      if (!part) return false;
      if (it.kind === 'mcq') return part.type === 'mcq' && mcqLookup[part.source].has(it.n);
      return part.type === 'cloze' && D.cloze[it.idx] && Array.isArray(it.picks) && it.picks.length === D.cloze[it.idx].blanks.length;
    });
    if (!ok || !(s.index >= 0 && s.index < s.items.length)) { store.remove(K.state); return null; }
    return s;
  }

  const save = () => store.set(K.state, state);
  const remaining = () => Math.max(0, state.startedAt + state.durationMs - Date.now());
  const totalPoints = (items) => items.reduce((s, it) => s + pointsOf(it), 0);

  function fmtClock(ms) {
    const s = Math.ceil(ms / 1000);
    const hh = Math.floor(s / 3600);
    const mm = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    const two = (n) => String(n).padStart(2, '0');
    return (hh ? hh + ':' : '') + two(mm) + ':' + two(ss);
  }

  const fmtDate = (ms) => new Date(ms).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  const setView = (...nodes) => root.replaceChildren(...nodes.flat(Infinity).filter(Boolean));

  // ---------- Flow ----------
  async function start() {
    if (state) {
      const ok = await confirmDialog('มีการสอบที่ยังไม่ได้ส่ง ต้องการละทิ้งและเริ่มสอบใหม่หรือไม่?', {
        okText: 'เริ่มสอบใหม่', cancelText: 'ยกเลิก', danger: true,
      });
      if (!ok) return;
    }
    state = { v: 1, startedAt: Date.now(), durationMs: DURATION_MS, index: 0, items: buildItems() };
    save();
    enterExam();
  }

  function enterExam() {
    view = 'exam';
    window.addEventListener('beforeunload', warnLeave);
    clearInterval(timerId);
    timerId = setInterval(tick, 500);
    render();
    window.scrollTo(0, 0);
  }

  function warnLeave(e) { e.preventDefault(); e.returnValue = ''; }

  function tick() {
    if (!state) return;
    const ms = remaining();
    const el = document.getElementById('exam-timer');
    if (el) {
      el.textContent = fmtClock(ms);
      el.classList.toggle('low', ms <= 5 * 60000);
    }
    if (ms <= 0) submit(true);
  }

  async function askSubmit() {
    const left = state.items.reduce((s, it) => s + pointsOf(it) - unitsAnswered(it), 0);
    const flagged = state.items.filter((it) => it.flag).length;
    const msg = 'ส่งข้อสอบตอนนี้? ' + (left ? 'ยังไม่ได้ตอบ ' + left + ' ข้อ' : 'ตอบครบทุกข้อแล้ว') + (flagged ? ' · ทำเครื่องหมายไว้ ' + flagged + ' ข้อ' : '') + ' เมื่อส่งแล้วแก้ไขไม่ได้';
    if (await confirmDialog(msg, { okText: 'ส่งข้อสอบ', cancelText: 'กลับไปทำต่อ' })) submit(false);
  }

  function submit(auto) {
    if (!state) return;
    clearInterval(timerId);
    window.removeEventListener('beforeunload', warnLeave);
    const endedAt = Math.min(Date.now(), state.startedAt + state.durationMs);
    const items = state.items;
    const byPart = parts.map((p) => {
      const its = items.filter((it) => it.part === p.id);
      return { id: p.id, title: p.title, score: its.reduce((s, it) => s + earnedOf(it), 0), total: totalPoints(its) };
    });
    const score = byPart.reduce((s, p) => s + p.score, 0);
    const total = totalPoints(items);
    const usedMs = endedAt - state.startedAt;
    finished = { items, byPart, score, total, usedMs, auto, at: endedAt };

    const history = store.get(K.history, []);
    history.unshift({ at: endedAt, score, total, usedMs, auto });
    store.set(K.history, history.slice(0, 10));
    store.remove(K.state);
    state = null;
    filter = 'all';
    view = 'result';
    render();
    window.scrollTo(0, 0);
  }

  function goIntro() {
    clearInterval(timerId);
    window.removeEventListener('beforeunload', warnLeave);
    view = 'intro';
    render();
    window.scrollTo(0, 0);
  }

  async function discard() {
    if (!(await confirmDialog('ละทิ้งการสอบที่ค้างอยู่?', { okText: 'ละทิ้ง', danger: true }))) return;
    store.remove(K.state);
    state = null;
    render();
  }

  // ---------- Answer handlers ----------
  function go(i) {
    if (i < 0 || i >= state.items.length) return;
    state.index = i;
    save();
    renderExam();
    window.scrollTo(0, 0);
  }

  function pickMcq(displayIdx) {
    const it = state.items[state.index];
    if (it.kind !== 'mcq' || displayIdx >= it.order.length) return;
    const orig = it.order[displayIdx];
    it.pick = it.pick === orig ? null : orig;   // click again to un-answer
    save();
    renderExam();
  }

  function clearAnswer() {
    const it = state.items[state.index];
    if (it.kind === 'mcq') it.pick = null; else it.picks = it.picks.map(() => null);
    save();
    renderExam();
  }

  function toggleFlag() {
    const it = state.items[state.index];
    it.flag = !it.flag;
    save();
    renderExam();
  }

  // ---------- Views ----------
  function render() {
    if (trToggle) trToggle.hidden = view !== 'result';
    if (view === 'exam' && state) renderExam();
    else if (view === 'result' && finished) renderResult();
    else { view = 'intro'; renderIntro(); }
  }

  function renderIntro() {
    const history = store.get(K.history, []);
    const itemsPreview = parts.map((p) => {
      const n = p.type === 'cloze' ? p.count + ' บทความ' : p.count + ' ข้อ';
      return p.title + ' — ' + n;
    });
    setView(
      state && h('div', { class: 'resume' },
        h('p', { text: 'มีการสอบที่ยังไม่ได้ส่ง — เหลือเวลา ' + fmtClock(remaining()) }),
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn', type: 'button', text: 'กลับไปสอบต่อ', onclick: () => { if (remaining() <= 0) submit(true); else enterExam(); } }),
          h('button', { class: 'btn btn-outline', type: 'button', text: 'ละทิ้ง', onclick: discard }))
      ),
      h('p', { class: 'lead', text: 'จำลองบรรยากาศสอบจริง จับเวลา ไม่มีเฉลยระหว่างทำ และไม่มีระบบแปลช่วย' }),
      h('ul', { class: 'rules' },
        h('li', { text: 'เวลา ' + cfg.durationMin + ' นาที — หมดเวลาแล้วระบบส่งข้อสอบให้อัตโนมัติ' }),
        itemsPreview.map((t) => h('li', { text: t })),
        h('li', { text: 'ข้ามไปมาระหว่างข้อได้ เปลี่ยนคำตอบได้ และทำเครื่องหมายข้อที่อยากกลับมาดู' }),
        h('li', { text: 'เฉลยและคำอธิบายจะแสดงหลังส่งข้อสอบ (และเปิดระบบแปลได้ตอนทบทวน)' }),
        h('li', { text: 'ปิดหน้าเว็บแล้วกลับมาได้ แต่เวลายังเดินต่อ' })
      ),
      h('div', { class: 'btn-row' },
        h('button', { class: 'btn', type: 'button', text: 'เริ่มสอบ', onclick: start })),
      history.length > 0 && h('div', { class: 'review' },
        h('h3', { text: 'ผลการสอบครั้งก่อน' }),
        h('ul', { class: 'history' }, history.slice(0, 5).map((r) => h('li', {},
          h('span', { text: fmtDate(r.at) }),
          h('span', { text: r.score + '/' + r.total + ' (' + pct(r.score, r.total) + '%)' }),
          h('span', { class: 'meta', text: 'ใช้เวลา ' + fmtClock(r.usedMs) + (r.auto ? ' · หมดเวลา' : '') })))))
    );
  }

  function navigator() {
    return h('div', { class: 'navigator' },
      parts.map((p) => {
        const idxs = state.items.map((it, i) => (it.part === p.id ? i : -1)).filter((i) => i >= 0);
        return h('div', { class: 'nav-part' },
          h('p', { class: 'meta', text: p.title }),
          h('div', { class: 'nav-cells' }, idxs.map((i, k) => {
            const it = state.items[i];
            const done = unitsAnswered(it);
            const status = done === 0 ? '' : done === pointsOf(it) ? ' done' : ' partial';
            return h('button', {
              class: 'cell' + status + (it.flag ? ' flagged' : '') + (i === state.index ? ' current' : ''),
              type: 'button',
              'aria-label': p.title + ' ข้อ ' + (k + 1) + (it.flag ? ' (ทำเครื่องหมายไว้)' : '') + (done === pointsOf(it) ? ' ตอบแล้ว' : ''),
              'aria-current': i === state.index ? 'true' : null,
              text: (it.kind === 'cloze' ? 'C' : '') + (k + 1),
              onclick: () => go(i),
            });
          })));
      }));
  }

  function renderExam() {
    const it = state.items[state.index];
    const part = partById.get(it.part);
    const inPart = state.items.filter((x) => x.part === it.part);
    const posInPart = inPart.indexOf(it) + 1;
    const answered = state.items.reduce((s, x) => s + unitsAnswered(x), 0);
    const total = totalPoints(state.items);

    let body;
    if (it.kind === 'mcq') {
      const q = questionOf(it);
      body = [
        h('p', { class: 'question', text: q.q }),
        h('div', { class: 'choices', role: 'group', 'aria-label': 'ตัวเลือก' },
          it.order.map((orig, i) => h('button', {
            class: 'choice' + (it.pick === orig ? ' selected' : ''),
            type: 'button',
            'aria-pressed': String(it.pick === orig),
            onclick: () => pickMcq(i),
          },
          h('span', { class: 'choice-key', 'aria-hidden': 'true', text: KEYS[i] }),
          h('span', { text: q.c[orig] })))),
      ];
    } else {
      const p = passageOf(it);
      const nodes = [];
      p.text.split(/\{(\d+)\}/).forEach((tok, i) => {
        if (i % 2 === 0) { nodes.push(tok); return; }
        const num = Number(tok);
        const select = h('select', {
          class: 'blank-select',
          'aria-label': 'ช่องว่างที่ ' + num,
          onchange: (e) => {
            it.picks[num - 1] = e.target.value === '' ? null : Number(e.target.value);
            save();
            updateBar();
          },
        },
        h('option', { value: '', text: '— เลือก —' }),
        it.orders[num - 1].map((orig) => h('option', { value: String(orig), text: p.blanks[num - 1].c[orig] })));
        select.value = it.picks[num - 1] === null ? '' : String(it.picks[num - 1]);
        nodes.push(h('span', { class: 'blank' }, h('span', { class: 'blank-no', text: '(' + num + ')' }), ' ', select));
      });
      body = [h('span', { class: 'topic', text: p.topic }), h('div', { class: 'passage' }, nodes)];
    }

    const status = h('span', { class: 'meta', id: 'exam-count', text: 'ตอบแล้ว ' + answered + '/' + total });
    function updateBar() {
      const a = state.items.reduce((s, x) => s + unitsAnswered(x), 0);
      status.textContent = 'ตอบแล้ว ' + a + '/' + total;
    }

    setView(
      h('div', { class: 'exam-bar' },
        h('span', { class: 'exam-timer' + (remaining() <= 5 * 60000 ? ' low' : ''), id: 'exam-timer', role: 'timer', 'aria-label': 'เวลาที่เหลือ', text: fmtClock(remaining()) }),
        status,
        h('button', { class: 'btn btn-sm btn-outline', type: 'button', text: 'ส่งข้อสอบ', onclick: askSubmit })
      ),
      h('section', { class: 'panel' },
        h('div', { class: 'top-bar' },
          h('span', { text: part.title + ' · ' + (it.kind === 'cloze' ? 'บทความ ' : 'ข้อ ') + posInPart + '/' + inPart.length }),
          it.flag && h('span', { text: 'ทำเครื่องหมายไว้' })),
        body,
        h('div', { class: 'exam-actions' },
          h('button', { class: 'btn btn-outline', type: 'button', text: '← ก่อนหน้า', disabled: state.index === 0, onclick: () => go(state.index - 1) }),
          h('button', { class: 'btn', type: 'button', text: state.index === state.items.length - 1 ? 'ตรวจทานก่อนส่ง' : 'ถัดไป →', onclick: () => (state.index === state.items.length - 1 ? askSubmit() : go(state.index + 1)) })),
        h('div', { class: 'btn-row exam-tools' },
          h('button', { class: 'btn btn-ghost btn-sm', type: 'button', 'aria-pressed': String(it.flag), text: it.flag ? 'ยกเลิกเครื่องหมาย' : 'ทำเครื่องหมายไว้ทบทวน', onclick: toggleFlag }),
          h('button', { class: 'btn btn-ghost btn-sm', type: 'button', text: 'ล้างคำตอบ', onclick: clearAnswer }))
      ),
      h('details', { class: 'nav-details', open: true },
        h('summary', { text: 'รายการข้อทั้งหมด' }),
        navigator()),
      h('p', { class: 'fine-print', text: 'คีย์ลัด: 1–' + (it.kind === 'mcq' ? it.order.length : 5) + ' เลือกคำตอบ · ลูกศรซ้าย/ขวา ย้ายข้อ' })
    );
  }

  function renderResult() {
    const f = finished;
    const p = pct(f.score, f.total);

    const rows = f.byPart.map((bp) => h('li', { class: 'stage-row part' },
      h('span', { class: 'stage-lv', text: bp.title }),
      h('span', { class: 'bar' }, h('span', { class: 'bar-fill', style: { width: pct(bp.score, bp.total) + '%' } })),
      h('span', { class: 'stage-score', text: bp.score + '/' + bp.total })));

    const FILTERS = [
      ['all', 'ทั้งหมด', () => true],
      ['wrong', 'ที่ตอบผิด', (it) => earnedOf(it) < pointsOf(it)],
      ['skipped', 'ที่ไม่ได้ตอบ', (it) => unitsAnswered(it) < pointsOf(it)],
      ['flagged', 'ที่ทำเครื่องหมาย', (it) => it.flag],
    ];
    const active = FILTERS.find(([k]) => k === filter);
    const shown = f.items.filter(active[2]);

    const chips = h('div', { class: 'chips' }, FILTERS.map(([k, label, fn]) => h('button', {
      class: 'chip',
      type: 'button',
      'aria-pressed': String(filter === k),
      text: label + ' (' + f.items.filter(fn).length + ')',
      onclick: () => { filter = k; renderResult(); },
    })));

    const list = shown.map((it) => {
      if (it.kind === 'mcq') {
        const q = questionOf(it);
        return h('div', { class: 'review-item' },
          h('p', { class: 'review-q', 'data-tr': true, text: partById.get(it.part).title.split(' · ')[0] + ' ข้อ ' + q.n + ': ' + q.q }),
          it.pick === null
            ? h('p', { class: 'meta', text: 'ไม่ได้ตอบ' })
            : h('p', { class: it.pick === q.a ? 'review-right' : 'review-you', text: (it.pick === q.a ? '✓ ' : '✗ ') + 'คุณตอบ: ' + q.c[it.pick] }),
          it.pick !== q.a && h('p', { class: 'review-right', text: '✓ เฉลย: ' + q.c[q.a] }),
          h('p', { class: 'review-expl', 'data-tr': true }, rich(q.e)));
      }
      const pass = passageOf(it);
      const filled = pass.text.replace(/\{(\d+)\}/g, (_, k) => '[' + pass.blanks[k - 1].c[pass.blanks[k - 1].a] + ']');
      const wrongBlanks = pass.blanks.map((b, i) => ({ b, i })).filter(({ b, i }) => it.picks[i] !== b.a);
      return h('div', { class: 'review-item' },
        h('p', { class: 'review-q', text: pass.topic + ' — ' + earnedOf(it) + '/' + pass.blanks.length }),
        wrongBlanks.map(({ b, i }) => h('p', { 'data-tr': true },
          h('strong', { text: '(' + (i + 1) + ') ' }),
          it.picks[i] === null ? h('span', { class: 'meta', text: 'ไม่ได้ตอบ' }) : h('span', { class: 'review-you', text: '✗ ' + b.c[it.picks[i]] }),
          ' → ', h('span', { class: 'review-right', text: '✓ ' + b.c[b.a] }), h('br'), rich(b.e))),
        h('details', {}, h('summary', { class: 'meta', text: 'ดูบทความพร้อมคำตอบที่ถูก' }), h('p', { class: 'passage-filled', 'data-tr': true, text: filled })));
    });

    setView(
      h('section', { class: 'panel summary' },
        h('h2', { text: 'ผลการสอบจำลอง' }),
        h('div', { class: 'score', text: f.score + ' / ' + f.total }),
        h('p', { class: 'score-sub', text: p + '% · ใช้เวลา ' + fmtClock(f.usedMs) + ' จาก ' + cfg.durationMin + ' นาที' + (f.auto ? ' · หมดเวลา ระบบส่งให้อัตโนมัติ' : '') }),
        h('ul', { class: 'stage-rows' }, rows),
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn', type: 'button', text: 'สอบใหม่อีกครั้ง', onclick: start }),
          h('button', { class: 'btn btn-outline', type: 'button', text: 'กลับหน้าแรก', onclick: goIntro })),
        h('div', { class: 'review' },
          h('h3', { text: 'ทบทวนข้อสอบ' }),
          chips,
          list.length ? list : h('p', { class: 'meta', text: 'ไม่มีข้อในหมวดนี้' }))
      )
    );
  }

  // ---------- Keyboard ----------
  document.addEventListener('keydown', (e) => {
    if (view !== 'exam' || !state || e.ctrlKey || e.metaKey || e.altKey || dialogOpen()) return;
    if (e.target && /^(SELECT|INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
    const it = state.items[state.index];
    if (e.key === 'ArrowRight') { go(state.index + 1); return; }
    if (e.key === 'ArrowLeft') { go(state.index - 1); return; }
    const idx = KEYS.indexOf(e.key);
    if (it.kind === 'mcq' && e.key.length === 1 && idx >= 0 && idx < it.order.length) pickMcq(idx);
  });

  // ---------- Init ----------
  if (state && remaining() <= 0) submit(true);   // time ran out while the tab was closed
  else render();
})();
