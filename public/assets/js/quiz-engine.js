// Multiple-choice quiz engine — used by Part 1 (Grammar) and Part 2 (Conversations).
// A page opts in with <main id="app" data-quiz="grammar"> and loads its data file first.
(function () {
  'use strict';

  const { QUIZZES, store, shuffle, pct, h, rich, confirmDialog, dialogOpen } = window.CEFR;

  function mount(root) {
    const meta = QUIZZES[root.dataset.quiz];
    const data = window.CEFR_DATA[meta.dataKey];
    const byN = new Map(data.map((q) => [q.n, q]));
    const total = data.length;

    // Storage keys (namespaced per quiz so Part 1 / Part 2 never collide)
    const K = {
      state: meta.id + ':state',
      wrong: meta.id + ':wrong',
      stats: meta.id + ':stats',
      count: meta.id + ':count',
    };
    const KEYS = meta.labels === 'letter' ? 'ABCDE' : '12345';
    const maxChoices = Math.max(...data.map((q) => q.c.length));
    const keyHint = meta.labels === 'letter'
      ? KEYS[0] + '–' + KEYS[maxChoices - 1] + ' (หรือ 1–' + maxChoices + ')'
      : '1–' + maxChoices;

    // Questions without a book number (extra practice) show "level · topic" instead.
    const refLabel = (q) => (q.topic ? q.level + ' · ' + q.topic : 'หนังสือข้อ ' + q.n);

    let trOpen = false;         // "translate the whole question" panel (kept while answering one question)
    let trToken = 0;

    let view = 'home';          // 'home' | 'quiz' | 'summary'
    let round = loadRound();    // unfinished round restored from storage
    let finished = null;        // last finished round (summary screen)
    let count = store.get(K.count, 'all');
    if (count !== 'all' && !(count > 0 && count < total)) count = 'all';

    // ---------- State helpers ----------
    function loadRound() {
      const r = store.get(K.state, null);
      if (!r || r.v !== 1 || !Array.isArray(r.items) || !r.items.length) return null;
      const valid = r.items.every((it) => {
        const q = byN.get(it.n);
        if (!q || !Array.isArray(it.order) || it.order.length !== q.c.length) return false;
        if ([...it.order].sort((a, b) => a - b).some((v, i) => v !== i)) return false;
        return it.pick === null || (Number.isInteger(it.pick) && it.pick >= 0 && it.pick < q.c.length);
      });
      if (!valid || !(r.index >= 0 && r.index < r.items.length)) {
        store.remove(K.state);
        return null;
      }
      return r;
    }

    const isRight = (it) => it.pick !== null && it.pick === byN.get(it.n).a;
    const scoreOf = (r) => r.items.filter(isRight).length;
    const answeredOf = (r) => r.items.filter((it) => it.pick !== null).length;
    const getWrong = () => store.get(K.wrong, []).filter((n) => byN.has(n));

    function newItems(ns) {
      return ns.map((n) => ({
        n,
        order: shuffle(byN.get(n).c.map((_, i) => i)),
        pick: null,
      }));
    }

    async function requestStart(mode, ns) {
      if (round && answeredOf(round) > 0) {
        const ok = await confirmDialog('มีรอบที่ทำค้างไว้ ต้องการเริ่มรอบใหม่และลบรอบเดิมทิ้งหรือไม่?', {
          okText: 'เริ่มรอบใหม่',
          cancelText: 'กลับไปทำต่อ',
          danger: true,
        });
        if (!ok) return;
      }
      round = { v: 1, mode, index: 0, items: newItems(ns) };
      store.set(K.state, round);
      view = 'quiz';
      render();
    }

    function startNormal() {
      const n = count === 'all' ? total : count;
      return requestStart('normal', shuffle(data.map((q) => q.n)).slice(0, n));
    }

    // ---------- Actions ----------
    // The right answer is not in the page: it comes from the server once a pick is made (so it can not be read in advance).
    let busy = false;
    async function answer(displayIdx) {
      const it = round.items[round.index];
      if (busy || it.pick !== null || displayIdx >= it.order.length) return;
      const pick = it.order[displayIdx];
      busy = true;
      try {
        await window.CEFR.content.reveal(meta.dataKey, [{ n: it.n, pick }]);
      } catch (e) {
        busy = false;
        showError(e, () => renderQuiz());
        return;
      }
      busy = false;
      if (!round || round.items[round.index] !== it) return;
      it.pick = pick;

      // Wrong bank: add on a miss, clear once answered correctly (so it shrinks as you learn)
      const wrong = new Set(getWrong());
      if (it.pick === byN.get(it.n).a) wrong.delete(it.n); else wrong.add(it.n);
      store.set(K.wrong, [...wrong]);
      store.set(K.state, round);

      renderQuiz({ focusNext: true });
    }

    // Questions picked earlier (a round reopened after a reload) have no answer in memory yet: fetch them first.
    // Resolves true when every picked question in the list has its answer.
    async function ensureRevealed(items, retry) {
      const todo = items.filter((it) => it.pick !== null && byN.get(it.n).a === undefined);
      if (!todo.length) return true;
      setView(h('p', { class: 'meta', text: 'กำลังโหลดเฉลย…' }));
      try {
        await window.CEFR.content.reveal(meta.dataKey, todo.map((it) => ({ n: it.n, pick: it.pick })));
        return true;
      } catch (e) {
        showError(e, retry);
        return false;
      }
    }

    function showError(e, retry) {
      const msg = window.CEFR.content.special(e) ? window.CEFR.content.special(e)
        : e.status === 401 || e.status === 402 ? 'ชุดนี้สำหรับสมาชิก — เข้าสู่ระบบหรือเลือกแพ็กเกจเพื่อดูเฉลย'
        : e.status === 429 ? 'ตอบเร็วหรือบ่อยเกินไป รอสักครู่แล้วลองใหม่'
          : 'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่';
      setView(h('section', { class: 'panel' },
        h('p', { class: 'meta', role: 'alert', text: msg }),
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn', type: 'button', text: 'ลองอีกครั้ง', onclick: retry }),
          h('button', { class: 'btn btn-outline', type: 'button', text: 'กลับหน้าแรก', onclick: goHome }))));
    }

    function next() {
      const it = round.items[round.index];
      if (it.pick === null) return;
      if (round.index < round.items.length - 1) {
        round.index++;
        trOpen = false;
        store.set(K.state, round);
        renderQuiz();
        window.scrollTo(0, 0);
      } else {
        finish();
      }
    }

    async function finish() {
      if (!(await ensureRevealed(round.items, finish))) return;
      finished = round;
      round = null;
      store.remove(K.state);
      if (finished.mode === 'normal') {
        const score = scoreOf(finished);
        const t = finished.items.length;
        const stats = store.get(K.stats, { attempts: 0, last: null, best: null });
        stats.attempts += 1;
        stats.last = { score, total: t };
        if (!stats.best || pct(score, t) > pct(stats.best.score, stats.best.total)) {
          stats.best = { score, total: t };
        }
        store.set(K.stats, stats);
      }
      view = 'summary';
      render();
      window.scrollTo(0, 0);
    }

    function goHome() {
      view = 'home';
      render();
      window.scrollTo(0, 0);
    }

    async function resetProgress() {
      const ok = await confirmDialog('ล้างความคืบหน้า สถิติ และข้อที่เคยผิดของชุดนี้ทั้งหมด?', {
        okText: 'ล้างข้อมูล',
        danger: true,
      });
      if (!ok) return;
      [K.state, K.wrong, K.stats].forEach((k) => store.remove(k));
      round = null;
      render();
    }

    // ---------- Views ----------
    // replaceChildren() would print falsy values as text, so drop them first.
    const setView = (...nodes) => root.replaceChildren(...nodes.filter(Boolean));

    function render() {
      if (view === 'quiz' && round) {
        ensureRevealed([round.items[round.index]], render).then((ok) => { if (ok && view === 'quiz' && round) renderQuiz(); });
      } else if (view === 'summary' && finished) renderSummary();
      else { view = 'home'; renderHome(); }
    }

    function renderHome() {
      const wrong = getWrong();
      const stats = store.get(K.stats, null);
      const counts = [25, 50].filter((n) => n < total);

      const chips = h('div', { class: 'chips', role: 'group', 'aria-label': 'จำนวนข้อในรอบนี้' });
      const options = [...counts.map((n) => [n, n + ' ข้อ']), ['all', 'ทั้งหมด ' + total + ' ข้อ']];
      options.forEach(([value, label]) => {
        chips.append(h('button', {
          class: 'chip',
          type: 'button',
          text: label,
          'aria-pressed': String(count === value),
          onclick: () => {
            count = value;
            store.set(K.count, count);
            chips.querySelectorAll('.chip').forEach((b, i) => b.setAttribute('aria-pressed', String(options[i][0] === count)));
          },
        }));
      });

      const statParts = [];
      if (stats && stats.attempts) {
        statParts.push('ทำแล้ว ' + stats.attempts + ' รอบ');
        statParts.push('ล่าสุด ' + pct(stats.last.score, stats.last.total) + '%');
        statParts.push('ดีที่สุด ' + pct(stats.best.score, stats.best.total) + '%');
      }
      if (wrong.length) statParts.push('ยังไม่แม่น ' + wrong.length + ' ข้อ');

      const hasData = statParts.length > 0 || round;

      setView(
        round && h('div', { class: 'resume' },
          h('p', { text: 'มีรอบที่ทำค้างไว้ — ตอบแล้ว ' + answeredOf(round) + '/' + round.items.length + ' ข้อ' }),
          h('button', { class: 'btn', type: 'button', text: 'ทำต่อจากเดิม', onclick: () => { view = 'quiz'; render(); } })
        ),
        h('section', { class: 'panel' },
          h('p', { class: 'lead', text: meta.intro }),
          statParts.length > 0 && h('p', { class: 'meta stat-line', text: statParts.join(' · ') }),
          h('span', { class: 'label', text: 'จำนวนข้อในรอบนี้' }),
          chips,
          h('div', { class: 'btn-row' },
            h('button', { class: 'btn', type: 'button', text: 'เริ่มทำข้อสอบ', onclick: startNormal }),
            wrong.length > 0 && h('button', {
              class: 'btn btn-outline',
              type: 'button',
              text: 'ทบทวนข้อที่ยังไม่แม่น (' + wrong.length + ')',
              onclick: () => requestStart('wrong', shuffle(wrong)),
            })
          ),
          h('p', { class: 'fine-print', text: 'กดปุ่ม ' + keyHint + ' เพื่อเลือกคำตอบ และ Enter เพื่อไปข้อถัดไป · ความคืบหน้าบันทึกไว้ในเครื่องนี้โดยอัตโนมัติ' }),
          h('p', { class: 'fine-print', text: 'อยากรู้ความหมาย: คลิกที่คำภาษาอังกฤษ หรือลากคลุมข้อความ ในโจทย์ได้เลย (ปุ่ม "แปล" มุมขวาบนใช้เปิด/ปิดระบบนี้)' })
        ),
        hasData && h('div', { class: 'panel-foot' },
          h('button', { class: 'btn btn-ghost btn-sm', type: 'button', text: 'ล้างความคืบหน้าและสถิติ', onclick: resetProgress })
        )
      );
    }

    function renderQuiz(opts) {
      const it = round.items[round.index];
      const q = byN.get(it.n);
      const answered = it.pick !== null;
      const correct = answered && it.pick === q.a;
      const last = round.index === round.items.length - 1;

      const bar = h('div', {
        class: 'progress',
        role: 'progressbar',
        'aria-label': 'ความคืบหน้า',
        'aria-valuemin': '0',
        'aria-valuemax': String(round.items.length),
        'aria-valuenow': String(answeredOf(round)),
      }, h('div', { class: 'progress-fill', style: { width: pct(answeredOf(round), round.items.length) + '%' } }));

      const choices = h('div', { class: 'choices', role: 'group', 'aria-label': 'ตัวเลือก' },
        it.order.map((orig, i) => {
          const state = !answered ? '' : orig === q.a ? ' correct' : orig === it.pick ? ' wrong' : '';
          return h('button', {
            class: 'choice' + state,
            type: 'button',
            disabled: answered,
            onclick: () => answer(i),
          },
          h('span', { class: 'choice-key', 'aria-hidden': 'true', text: KEYS[i] }),
          h('span', { text: q.c[orig] }));
        })
      );

      const nextBtn = h('button', {
        class: 'btn btn-block',
        type: 'button',
        text: last ? 'ดูผลคะแนน' : 'ถัดไป',
        onclick: next,
      });

      const feedback = answered && h('div', { class: 'feedback ' + (correct ? 'ok' : 'bad'), 'aria-live': 'polite' },
        h('strong', { class: 'feedback-title', text: correct ? 'ถูกต้อง' : 'ผิด' }),
        h('p', { class: 'feedback-text', 'data-tr': true }, rich(q.e)),
        clueBlock(q),
        nextBtn
      );

      // "Translate the whole question": question lines + every choice (needs translate.js)
      const canTranslate = typeof window.CEFR.lookup === 'function' && window.CEFR.translateEnabled();
      const trPanel = h('div', { class: 'tr-panel', hidden: !trOpen });
      const trBtn = canTranslate && h('button', {
        class: 'btn btn-ghost btn-sm tr-all',
        type: 'button',
        text: trOpen ? 'ซ่อนคำแปล' : 'แปลทั้งข้อ',
        onclick: () => {
          trOpen = !trOpen;
          trBtn.textContent = trOpen ? 'ซ่อนคำแปล' : 'แปลทั้งข้อ';
          trPanel.hidden = !trOpen;
          if (trOpen) fillTranslation(trPanel, q);
        },
      });
      if (trOpen && canTranslate) fillTranslation(trPanel, q);

      setView(
        h('section', { class: 'panel' },
          bar,
          h('div', { class: 'top-bar' },
            h('span', { text: (round.index + 1) + ' / ' + round.items.length }),
            h('span', { text: (round.mode === 'wrong' ? 'ทบทวน · ' : '') + refLabel(q) })
          ),
          h('p', { class: 'question', 'data-tr': true, text: q.q }),
          trBtn,
          trPanel,
          choices,
          feedback,
          h('div', { class: 'quiz-footer' },
            h('button', { class: 'btn btn-ghost btn-sm', type: 'button', text: '← พักไว้ก่อน (บันทึกอัตโนมัติ)', onclick: goHome })
          )
        )
      );

      if (opts && opts.focusNext) nextBtn.focus();
    }

    // Arcs above the sentence + tense card (needs markup.js and the clues for this set; null when not annotated)
    const clueBlock = (q) => (window.CEFR.markup
      ? window.CEFR.markup.block({ bank: meta.dataKey, key: q.n, q: q.q, answer: q.c[q.a] })
      : null);

    // Fills the panel with a Thai translation of each question line and each choice.
    async function fillTranslation(panel, q) {
      const my = ++trToken;
      panel.replaceChildren(h('p', { class: 'meta', text: 'กำลังแปล…' }));
      const lines = q.q.split('\n').map((s) => s.trim()).filter(Boolean);
      const jobs = [...lines.map((t) => ({ t })), ...q.c.map((t, i) => ({ t, key: KEYS[i] }))];
      const res = await Promise.allSettled(jobs.map((j) => window.CEFR.lookup(j.t)));
      if (my !== trToken || !panel.isConnected) return;
      panel.replaceChildren(...jobs.map((j, i) => h('p', { class: 'tr-line' },
        j.key && h('span', { class: 'tr-key', text: j.key }),
        h('span', { class: 'tr-th', text: res[i].status === 'fulfilled' ? res[i].value.translation : '(แปลไม่สำเร็จ)' }))));
    }

    function renderSummary() {
      const score = scoreOf(finished);
      const t = finished.items.length;
      const p = pct(score, t);
      const wrongItems = finished.items.filter((it) => !isRight(it));
      const msg = p >= 90 ? 'ยอดเยี่ยม' : p >= 70 ? 'ดีมาก' : p >= 50 ? 'พอใช้ ทบทวนอีกนิดจะดีขึ้น' : 'ลองทบทวนข้อที่ผิดแล้วทำใหม่';

      const review = wrongItems.length > 0 && h('div', { class: 'review' },
        h('h3', { text: 'ข้อที่ตอบผิด (' + wrongItems.length + ')' }),
        wrongItems.map((it) => {
          const q = byN.get(it.n);
          return h('div', { class: 'review-item' },
            h('p', { class: 'review-q', 'data-tr': true, text: 'ข้อ ' + q.n + ': ' + q.q }),
            h('p', { class: 'review-you', text: '✗ คุณตอบ: ' + q.c[it.pick] }),
            h('p', { class: 'review-right', text: '✓ เฉลย: ' + q.c[q.a] }),
            h('p', { class: 'review-expl', 'data-tr': true }, rich(q.e)),
            clueBlock(q)
          );
        })
      );

      setView(
        h('section', { class: 'panel summary' },
          h('h2', { text: 'ผลคะแนน' }),
          h('div', { class: 'score', text: score + ' / ' + t }),
          h('p', { class: 'score-sub', text: p + '% · ' + msg }),
          h('div', { class: 'btn-row' },
            wrongItems.length > 0 && h('button', {
              class: 'btn',
              type: 'button',
              text: 'ทำเฉพาะข้อที่ผิด (' + wrongItems.length + ')',
              onclick: () => requestStart('wrong', shuffle(wrongItems.map((it) => it.n))),
            }),
            h('button', { class: 'btn btn-outline', type: 'button', text: 'ทำรอบใหม่', onclick: startNormal }),
            h('button', { class: 'btn btn-outline', type: 'button', text: 'กลับหน้าแรก', onclick: goHome })
          ),
          review
        )
      );
    }

    // ---------- Keyboard shortcuts ----------
    document.addEventListener('keydown', (e) => {
      if (view !== 'quiz' || !round || e.ctrlKey || e.metaKey || e.altKey || dialogOpen()) return;
      const it = round.items[round.index];
      if (e.key === 'Enter') {
        if (it.pick !== null) { e.preventDefault(); next(); }
        return;
      }
      if (it.pick !== null || e.key.length !== 1) return;
      const k = e.key.toUpperCase();
      const idx = '12345'.indexOf(k) >= 0 ? '12345'.indexOf(k) : 'ABCDE'.indexOf(k);
      if (idx >= 0 && idx < it.order.length) answer(idx);
    });

    render();
  }

  const root = document.getElementById('app');
  const pass = window.CEFR.pass;
  const feature = 'practice:' + root.dataset.quiz;
  let isMounted = false;

  const lock = () => root.replaceChildren(pass.lockPanel(feature, { freeHref: 'grammar.html', freeText: 'ไปทำ Grammar (ฟรี)' }));

  async function begin() {
    isMounted = true;
    root.replaceChildren(h('p', { class: 'meta', text: 'กำลังโหลดข้อสอบ…' }));
    try {
      await window.CEFR.content.load(root.dataset.quiz);
    } catch (e) {
      isMounted = false;
      if (pass && (e.status === 401 || e.status === 402)) { lock(); return; }
      root.replaceChildren(h('section', { class: 'panel' },
        h('p', { class: 'meta', role: 'alert', text: window.CEFR.content.special(e) || (e.status === 429 ? 'โหลดบ่อยเกินไป รอสักครู่แล้วลองใหม่' : 'โหลดข้อสอบไม่สำเร็จ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่') }),
        h('button', { class: 'btn', type: 'button', text: 'ลองอีกครั้ง', onclick: begin })));
      return;
    }
    mount(root);
  }

  function checkPass() {
    if (pass && !pass.allows(feature)) {
      lock();
    } else if (!isMounted) {
      begin();
    }
  }

  (pass ? pass.ready : Promise.resolve()).then(() => {
    checkPass();
    if (pass) document.addEventListener('cefr:pass', checkPass);
  });
})();
