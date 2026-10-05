// Cloze-test engine (Part 3): read a passage, fill every blank from a drop-down, submit.
(function () {
  'use strict';

  const { QUIZZES, store, shuffle, pct, h, rich, confirmDialog, dialogOpen } = window.CEFR;

  const meta = QUIZZES.cloze;
  const data = window.CEFR_DATA.cloze;
  const root = document.getElementById('app');
  const totalBlanks = data.reduce((sum, p) => sum + p.blanks.length, 0);

  const K = { state: 'cloze:state', best: 'cloze:best', stats: 'cloze:stats', order: 'cloze:order' };

  let view = 'home';              // 'home' | 'quiz' | 'summary'
  let session = loadSession();    // unfinished round restored from storage
  let finished = null;            // last finished round (summary screen)
  let cur = null;                 // passage currently on screen (in memory only)
  let orderMode = store.get(K.order, 'random');
  if (orderMode !== 'random' && orderMode !== 'sequential') orderMode = 'random';

  // ---------- State helpers ----------
  // session = { v, mode: 'all'|'single', order: [passageIdx], index: completedCount, results: {idx: {score,total,wrong}} }
  function loadSession() {
    const s = store.get(K.state, null);
    const validIdx = (i) => Number.isInteger(i) && i >= 0 && i < data.length;
    if (!s || s.v !== 1 || !Array.isArray(s.order) || !s.order.length || !s.order.every(validIdx)
        || !(s.index >= 0 && s.index < s.order.length) || typeof s.results !== 'object' || !s.results) {
      store.remove(K.state);
      return null;
    }
    return s;
  }

  const bestMap = () => store.get(K.best, {});

  async function requestStart(mode, order) {
    if (session && session.index > 0) {
      const ok = await confirmDialog('มีรอบที่ทำค้างไว้ ต้องการเริ่มรอบใหม่และลบรอบเดิมทิ้งหรือไม่?', {
        okText: 'เริ่มรอบใหม่',
        cancelText: 'กลับไปทำต่อ',
        danger: true,
      });
      if (!ok) return;
    }
    session = { v: 1, mode, order, index: 0, results: {} };
    store.set(K.state, session);
    openPassage(0);
  }

  function startAll() {
    const all = data.map((_, i) => i);
    return requestStart('all', orderMode === 'random' ? shuffle(all) : all);
  }

  function openPassage(pos) {
    const idx = session.order[pos];
    cur = {
      pos,
      idx,
      // shuffled options per blank; correctness by index so duplicate words can't confuse it
      opts: data[idx].blanks.map((b) => shuffle(b.c.map((text, j) => ({ text, isCorrect: j === b.a })))),
      submitted: false,
      last: pos === session.order.length - 1,
    };
    view = 'quiz';
    render();
    window.scrollTo(0, 0);
  }

  function goHome() {
    view = 'home';
    render();
    window.scrollTo(0, 0);
  }

  async function resetProgress() {
    const ok = await confirmDialog('ล้างความคืบหน้าและสถิติของชุดนี้ทั้งหมด?', { okText: 'ล้างข้อมูล', danger: true });
    if (!ok) return;
    [K.state, K.best, K.stats].forEach((k) => store.remove(k));
    session = null;
    render();
  }

  // Called when the last passage of a round is submitted.
  function finalizeRound() {
    finished = session;
    session = null;
    store.remove(K.state);
    if (finished.mode === 'all') {
      const { score, total } = totals(finished);
      const stats = store.get(K.stats, { attempts: 0, last: null, best: null });
      stats.attempts += 1;
      stats.last = { score, total };
      if (!stats.best || pct(score, total) > pct(stats.best.score, stats.best.total)) stats.best = { score, total };
      store.set(K.stats, stats);
    }
  }

  function totals(s) {
    let score = 0;
    let total = 0;
    s.order.forEach((idx) => {
      const r = s.results[idx];
      if (r) { score += r.score; total += r.total; }
    });
    return { score, total };
  }

  // ---------- Views ----------
  const setView = (...nodes) => root.replaceChildren(...nodes.filter(Boolean));

  function render() {
    if (view === 'quiz' && cur) renderPassage();
    else if (view === 'summary' && finished) renderSummary();
    else { view = 'home'; renderHome(); }
  }

  function renderHome() {
    const stats = store.get(K.stats, null);
    const best = bestMap();
    const doneCount = Object.keys(best).filter((i) => data[i]).length;

    const modes = [['random', 'สุ่มลำดับบทความ'], ['sequential', 'เรียงตามบท 1 → ' + data.length]];
    const chips = h('div', { class: 'chips', role: 'group', 'aria-label': 'ลำดับบทความ' },
      modes.map(([value, label]) => h('button', {
        class: 'btn btn-outline chip',
        type: 'button',
        text: label,
        'aria-pressed': String(orderMode === value),
        onclick: () => {
          orderMode = value;
          store.set(K.order, orderMode);
          chips.querySelectorAll('.chip').forEach((b, i) => b.setAttribute('aria-pressed', String(modes[i][0] === orderMode)));
        },
      }))
    );

    const pills = [];
    if (doneCount) pills.push(h('span', { class: 'pill', text: 'เคยทำแล้ว ' + doneCount + '/' + data.length + ' บทความ' }));
    if (stats && stats.attempts) {
      pills.push(h('span', { class: 'pill', text: 'ทำครบชุด ' + stats.attempts + ' รอบ' }));
      pills.push(h('span', { class: 'pill good', text: 'ดีที่สุด ' + pct(stats.best.score, stats.best.total) + '%' }));
    }

    const chapterGrid = h('div', { class: 'chapters' },
      data.map((p, idx) => {
        const b = best[idx];
        const cls = !b ? '' : b.score === b.total ? ' perfect' : ' partial';
        return h('button', {
          class: 'chapter' + cls,
          type: 'button',
          onclick: () => requestStart('single', [idx]),
        },
        h('span', { class: 'chapter-name', text: p.topic }),
        h('span', { class: 'chapter-score', text: b ? 'ดีที่สุด ' + b.score + '/' + b.total : p.blanks.length + ' ช่องว่าง' }));
      })
    );

    setView(
      session && h('div', { class: 'resume' },
        h('p', { text: 'มีรอบที่ทำค้างไว้ — ส่งแล้ว ' + session.index + '/' + session.order.length + ' บทความ' }),
        h('button', { class: 'btn', type: 'button', text: 'ทำต่อจากเดิม', onclick: () => openPassage(session.index) })
      ),
      h('section', { class: 'card notebook' },
        h('h2', { class: 'lined', text: 'พร้อมแล้วเริ่มได้เลย' }),
        h('p', { class: 'lined', text: data.length + ' บทความ รวม ' + totalBlanks + ' ช่องว่าง — ' + meta.intro }),
        pills.length > 0 && h('div', { class: 'stats' }, pills),
        h('p', { style: { fontWeight: '700', margin: '0 0 10px' }, text: 'ลำดับบทความ' }),
        chips,
        h('button', { class: 'btn btn-block', type: 'button', text: 'เริ่มทำทั้ง ' + data.length + ' บทความ', onclick: startAll }),
        h('p', { class: 'fine-print', text: 'กด Enter เพื่อส่งคำตอบและไปบทความถัดไป · ความคืบหน้าบันทึกไว้ในเครื่องนี้โดยอัตโนมัติ' })
      ),
      h('section', { class: 'card', style: { padding: '20px' } },
        h('h2', { style: { margin: '0 0 4px', fontSize: '1.15rem' }, text: 'หรือเลือกฝึกทีละบทความ' }),
        h('p', { class: 'fine-print', style: { margin: '0 0 14px' }, text: 'เหมาะสำหรับทบทวนเฉพาะบทที่ยังไม่แม่น' }),
        chapterGrid
      ),
      (session || doneCount > 0 || (stats && stats.attempts)) && h('div', { class: 'center' },
        h('button', { class: 'btn btn-ghost btn-sm', type: 'button', text: 'ล้างความคืบหน้าและสถิติ', onclick: resetProgress })
      )
    );
  }

  function renderPassage() {
    const p = data[cur.idx];
    const n = session.order.length;
    const selects = [];

    const body = [];
    p.text.split(/\{(\d+)\}/).forEach((part, i) => {
      if (i % 2 === 0) { body.push(part); return; }
      const num = Number(part);
      const select = h('select', {
        class: 'blank-select',
        'aria-label': 'ช่องว่างที่ ' + num,
        onchange: (e) => e.target.classList.remove('is-missing'),
      },
      h('option', { value: '', disabled: true, selected: true, text: '-- เลือก --' }),
      cur.opts[num - 1].map((o, j) => h('option', { value: String(j), text: o.text })));
      selects[num - 1] = select;
      body.push(h('span', { class: 'blank' }, h('strong', { class: 'blank-no', text: '(' + num + ')' }), ' ', select));
    });

    const msg = h('p', { class: 'form-msg', role: 'alert', hidden: true });
    const feedback = h('div', { class: 'feedback', 'aria-live': 'polite', hidden: true });
    const submitBtn = h('button', { class: 'btn btn-block', type: 'button', text: 'ส่งคำตอบ (Enter)', onclick: submit });

    function submit() {
      if (cur.submitted) return;
      const missing = selects.filter((s) => s.value === '');
      if (missing.length) {
        selects.forEach((s) => s.classList.toggle('is-missing', s.value === ''));
        msg.textContent = 'กรุณาเลือกคำตอบให้ครบทุกช่องก่อนกดส่ง (เหลืออีก ' + missing.length + ' ช่อง)';
        msg.hidden = false;
        missing[0].focus();
        return;
      }
      msg.hidden = true;
      cur.submitted = true;

      let score = 0;
      const wrong = [];
      const items = [];
      selects.forEach((select, i) => {
        const b = p.blanks[i];
        const picked = cur.opts[i][Number(select.value)];
        const right = cur.opts[i].find((o) => o.isCorrect);
        select.disabled = true;
        if (picked.isCorrect) {
          score++;
          select.classList.add('is-correct');
          items.push(h('li', {}, h('strong', { class: 'ok', text: '✔ ข้อ ' + (i + 1) + ': ' }), rich(b.e)));
        } else {
          select.classList.add('is-wrong');
          select.after(h('span', { class: 'fix', text: '✔ ' + right.text }));
          wrong.push({ i, pick: picked.text });
          items.push(h('li', {}, h('strong', { class: 'bad', text: '❌ ข้อ ' + (i + 1) + ': ' }), '(ผิด ที่ถูกคือ ', h('strong', { text: right.text }), ') — ', rich(b.e)));
        }
      });

      // Persist per-passage result + best score
      const result = { score, total: p.blanks.length, wrong };
      session.results[cur.idx] = result;
      session.index = cur.pos + 1;
      const best = bestMap();
      if (!best[cur.idx] || score > best[cur.idx].score) {
        best[cur.idx] = { score, total: result.total };
        store.set(K.best, best);
      }
      if (cur.last) finalizeRound(); else store.set(K.state, session);

      const nextBtn = h('button', {
        class: 'btn btn-block',
        type: 'button',
        text: cur.last ? 'ดูผลคะแนน (Enter)' : 'บทความถัดไป (Enter)',
        onclick: next,
      });
      feedback.append(
        h('strong', { class: 'feedback-title', text: 'คุณตอบถูก ' + score + ' / ' + result.total + ' ข้อในบทความนี้' }),
        h('ul', {}, items),
        nextBtn
      );
      feedback.className = 'feedback ' + (score === result.total ? 'ok' : 'bad');
      feedback.hidden = false;
      submitBtn.remove();
      nextBtn.focus();
    }

    cur.submit = submit;

    const bar = h('div', {
      class: 'progress',
      role: 'progressbar',
      'aria-label': 'ความคืบหน้า',
      'aria-valuemin': '0',
      'aria-valuemax': String(n),
      'aria-valuenow': String(cur.pos),
    },h('div', { class: 'progress-fill', style: { width: pct(cur.pos, n) + '%' } }));

    setView(
      h('section', { class: 'card notebook' },
        bar,
        h('div', { class: 'top-bar' },
          h('span', { text: 'บทความที่ ' + (cur.pos + 1) + '/' + n }),
          n === 1 && h('span', { class: 'badge review', text: 'ฝึกทีละบทความ' })
        ),
        h('div', { class: 'topic', text: p.topic }),
        h('div', { class: 'passage' }, body),
        msg,
        submitBtn,
        feedback,
        h('div', { class: 'quiz-footer' },
          h('button', { class: 'btn btn-ghost btn-sm', type: 'button', text: '🏠 พักไว้ก่อน (บันทึกถึงบทความที่ส่งแล้ว)', onclick: goHome })
        )
      )
    );
  }

  function next() {
    if (!cur || !cur.submitted) return;
    if (cur.last) {
      view = 'summary';
      render();
      window.scrollTo(0, 0);
    } else {
      openPassage(session.index);
    }
  }

  function renderSummary() {
    const { score, total } = totals(finished);
    const p = pct(score, total);
    const msg = p >= 90 ? 'ยอดเยี่ยมมาก! 🎉' : p >= 70 ? 'ดีมาก เก่งขึ้นเรื่อยๆ 👍' : p >= 50 ? 'พอใช้ ทบทวนอีกนิดจะดีขึ้น 💪' : 'ไม่เป็นไร ลองทบทวนบทที่ผิดแล้วทำใหม่ 📚';

    const rows = finished.order.map((idx) => {
      const pass = data[idx];
      const r = finished.results[idx];
      const detail = r.wrong.length === 0
        ? h('p', { text: 'ถูกทุกช่อง 🎉' })
        : r.wrong.map((w) => {
          const b = pass.blanks[w.i];
          return h('p', {},
            h('strong', { text: '(' + (w.i + 1) + ') ' }),
            h('span', { class: 'review-you', text: '✗ ' + w.pick }),
            ' → ',
            h('span', { class: 'review-right', text: '✔ ' + b.c[b.a] }),
            h('br'),
            rich(b.e));
        });
      return h('li', {},
        h('details', {},
          h('summary', {}, h('span', { text: pass.topic }), h('span', { text: r.score + '/' + r.total })),
          h('div', { class: 'detail' }, detail)));
    });

    setView(
      h('section', { class: 'card summary' },
        h('h2', { text: 'สรุปผลคะแนน' }),
        h('div', { class: 'score', text: score + ' / ' + total }),
        h('p', { class: 'score-sub', text: p + '% · ' + msg }),
        h('div', { class: 'btn-row center' },
          h('button', {
            class: 'btn',
            type: 'button',
            text: finished.mode === 'single' ? 'ทำบทความนี้อีกครั้ง' : 'ทำรอบใหม่',
            onclick: () => (finished.mode === 'single' ? requestStart('single', finished.order) : startAll()),
          }),
          h('button', { class: 'btn btn-outline', type: 'button', text: 'กลับหน้าแรก', onclick: goHome })
        ),
        h('ul', { class: 'passage-results' }, rows)
      )
    );
  }

  // ---------- Keyboard: Enter submits, then advances ----------
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || view !== 'quiz' || !cur || e.ctrlKey || e.metaKey || e.altKey || dialogOpen()) return;
    e.preventDefault();
    if (cur.submitted) next(); else cur.submit();
  });

  render();
})();
