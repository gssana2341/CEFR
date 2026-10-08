// Pieces shared by the TOEIC pages (practice: toeic-engine.js, exam room: toeic-exam.js). Exposes CEFR.toeicUi.
//
//   questionCard(q, { part, onPick, flag })  → { el, buttons, note, n }   one question: number, picture, stem, choices
//   paint(card, q, { pick, a, e, reveal })   colours the choices (selected, or right / wrong once the answer is known)
//   groupBlock(group, part, makeCard)        a passage (pictures) with its questions
//   picture(src, cls, alt, onFail)           an <img> that can not be dragged or saved from a menu; onFail(img) when the link expired
//   clipPlayer({ src, start, end, cue, refresh, autoplay }) → { el, destroy, setSrc, play }   plays one stretch of a Part's recording
//   PARTS, LETTERS, mmss(sec), scaled(section, raw), cefrOf(total)
// Nothing here knows an answer: the pages pass it in after the server has said it.
(function () {
  'use strict';

  const { h } = window.CEFR;

  const PARTS = {
    1: { en: 'Photographs', th: 'ภาพถ่าย', group: 'Listening' },
    2: { en: 'Question–Response', th: 'ถาม–ตอบสั้น', group: 'Listening' },
    3: { en: 'Conversations', th: 'บทสนทนา', group: 'Listening' },
    4: { en: 'Talks', th: 'บทพูดสั้น', group: 'Listening' },
    5: { en: 'Incomplete Sentences', th: 'เติมประโยค', group: 'Reading' },
    6: { en: 'Text Completion', th: 'เติมข้อความ', group: 'Reading' },
    7: { en: 'Reading Comprehension', th: 'อ่านจับใจความ', group: 'Reading' },
  };
  const LETTERS = 'ABCD';
  const mmss = (sec) => Math.floor(sec / 60) + ':' + String(Math.round(sec % 60)).padStart(2, '0');

  // Media is shown, never offered: no right-click menu, no dragging (a deterrent, not a lock)
  const guard = (el) => { el.addEventListener('contextmenu', (e) => e.preventDefault()); el.addEventListener('dragstart', (e) => e.preventDefault()); return el; };
  function picture(src, cls, alt, onFail) {
    const img = guard(h('img', { class: cls, src, alt, draggable: 'false', decoding: 'async' }));
    if (onFail) img.addEventListener('error', () => onFail(img));
    return img;
  }

  // ---------- one question ----------
  function questionCard(q, o) {
    const opt = o || {};
    const textless = opt.part <= 2;                              // Parts 1-2: the choices are only heard / seen as letters
    const note = h('p', { class: 'toeic-ans meta', 'aria-live': 'polite' });
    const buttons = q.c.map((text, i) => h('button', {
      class: 'choice', type: 'button', 'aria-label': 'ตัวเลือก ' + LETTERS[i],
      onclick: () => opt.onPick && opt.onPick(q.n, i),
    }, h('span', { class: 'choice-key', text: LETTERS[i] }), !textless && h('span', { 'data-tr': true, text })));
    const flagBtn = opt.flag && h('button', { class: 'btn btn-ghost btn-sm toeic-flag', type: 'button', 'aria-pressed': 'false', text: 'ทำเครื่องหมายไว้ทบทวน',
      onclick: () => opt.flag(q.n, flagBtn) });
    const el = h('div', { class: 'toeic-q', id: 'q' + q.n },
      h('p', { class: 'q-no', text: 'ข้อ ' + q.n }),
      q.img && picture(q.img, 'toeic-photo', 'ภาพประกอบข้อ ' + q.n, opt.onPictureFail),
      q.q && h('p', { class: 'question', 'data-tr': true, text: q.q }),
      h('div', { class: 'choices' + (textless ? ' letters' : '') }, buttons),
      flagBtn, note);
    return { el, buttons, note, n: q.n, part: opt.part, flagBtn };
  }

  // st = { pick, a, e, reveal }: reveal = the answer is known (practice after a pick, exam review)
  function paint(c, q, st) {
    const textless = c.part <= 2;
    const known = Boolean(st.reveal && st.a !== undefined);
    c.buttons.forEach((b, i) => {
      b.disabled = Boolean(st.locked) || known;
      b.classList.toggle('selected', !known && st.pick === i);      // always a real boolean: toggle(name, undefined) would flip the class
      b.classList.toggle('correct', known && st.a === i);
      b.classList.toggle('wrong', known && st.pick === i && st.a !== i);
    });
    if (known) {
      const ok = st.pick === st.a;
      c.note.className = 'toeic-ans meta ' + (ok ? 'ok' : 'bad');
      c.note.replaceChildren(...[
        ok ? 'ถูกต้อง' : (st.pick === undefined ? 'ไม่ได้ตอบ · ' : 'ผิด · ') + 'เฉลย (' + LETTERS[st.a] + ')' + (textless ? '' : ' ' + q.c[st.a]),
        st.e && h('span', { class: 'toeic-expl', 'data-tr': true, text: st.e })].filter(Boolean));     // replaceChildren would print a falsy value as text
    } else {
      c.note.className = 'toeic-ans meta';
      c.note.textContent = '';
    }
  }

  // ---------- a passage with its questions ----------
  function groupBlock(g, part, makeCard, onPictureFail) {
    const ns = g.items.map((q) => q.n);
    const range = ns.length > 1 ? 'ข้อ ' + ns[0] + '–' + ns[ns.length - 1] : 'ข้อ ' + ns[0];
    return h('section', { class: 'toeic-group' },
      h('h3', { class: 'toeic-group-title' }, range, g.label ? ' · ' + g.label : ''),
      g.imgs && h('div', { class: 'toeic-pass' }, g.imgs.map((src, k) => picture(src, 'toeic-passage', 'เนื้อหาที่ใช้ตอบ ' + range + (g.imgs.length > 1 ? ' (' + (k + 1) + '/' + g.imgs.length + ')' : ''), onPictureFail))),
      g.items.map(makeCard));
  }

  // ---------- one stretch of a Part's recording (practice) ----------
  // The recording of a Part is one long file; the stretch of this question / conversation is [start, end] seconds. `cue` = the moment the
  // first question is read out: by default a conversation or talk is played up to there (the questions are printed), and a switch plays on
  // to the end. refresh() must return a promise of a fresh link when the current one has expired.
  function clipPlayer(o) {
    const audio = guard(new Audio());
    audio.preload = 'auto';
    audio.src = o.src;
    const hasCue = o.cue !== undefined && o.cue > o.start + 3;
    let withQuestions = !hasCue;
    const stop = () => (withQuestions ? o.end : o.cue);
    let wantPlay = false;

    const bar = h('div', { class: 'progress-fill' });
    const time = h('span', { class: 'meta toeic-clip-time' });
    const playBtn = h('button', { class: 'btn btn-sm', type: 'button', onclick: () => (audio.paused ? play() : audio.pause()) });
    const speed = h('select', { class: 'toeic-speed', 'aria-label': 'ความเร็วเสียง', onchange: () => { audio.playbackRate = Number(speed.value); } },
      [['0.75', '0.75×'], ['1', '1×'], ['1.25', '1.25×']].map(([v, t]) => h('option', { value: v, text: t, selected: v === '1' })));
    const full = hasCue && h('label', { class: 'toeic-clip-opt' },
      h('input', { type: 'checkbox', onchange: (e) => { withQuestions = e.target.checked; paint(); } }), ' เล่นรวมตอนอ่านคำถาม');
    const label = () => (audio.paused ? (audio.currentTime > o.start + 0.3 && audio.currentTime < stop() - 0.3 ? '▶ เล่นต่อ' : '▶ ฟัง') : '❚❚ หยุด');
    function paint() {
      const len = Math.max(1, stop() - o.start);
      const t = Math.min(len, Math.max(0, audio.currentTime - o.start));
      bar.style.width = Math.round((t / len) * 100) + '%';
      time.textContent = mmss(t) + ' / ' + mmss(len);
      playBtn.textContent = label();
    }
    function play() {
      if (audio.currentTime < o.start - 0.2 || audio.currentTime >= stop() - 0.2) audio.currentTime = o.start;
      wantPlay = true;
      audio.play().catch(() => { wantPlay = false; });
    }
    function restart() { audio.currentTime = o.start; play(); }
    audio.addEventListener('timeupdate', () => {
      if (audio.currentTime >= stop()) { audio.pause(); audio.currentTime = o.start; wantPlay = false; }
      paint();
    });
    audio.addEventListener('play', paint);
    audio.addEventListener('pause', paint);
    audio.addEventListener('loadedmetadata', () => { if (audio.currentTime < o.start) audio.currentTime = o.start; paint(); });
    let refreshing = false;
    audio.addEventListener('error', async () => {                // the link lives ~25 minutes
      if (refreshing || !o.refresh) return;
      refreshing = true;
      const was = wantPlay;
      const t = audio.currentTime;
      try {
        audio.src = await o.refresh();
        audio.addEventListener('loadedmetadata', () => { audio.currentTime = Math.max(o.start, t); if (was) play(); }, { once: true });
      } catch { /* offline */ }
      setTimeout(() => { refreshing = false; }, 4000);
    });
    const el = h('div', { class: 'toeic-clip' },
      h('div', { class: 'toeic-clip-row' }, playBtn,
        h('button', { class: 'btn btn-outline btn-sm', type: 'button', text: '↺ ฟังใหม่', onclick: restart }), speed, time),
      h('div', { class: 'progress' }, bar), full);
    paint();
    if (o.autoplay) setTimeout(play, 250);
    return {
      el,
      play,
      setSrc: (src) => { audio.src = src; },
      destroy: () => { audio.onended = null; audio.pause(); audio.removeAttribute('src'); audio.load(); },
    };
  }

  // ---------- score estimate ----------
  // ETS does not publish its conversion tables and they differ a little from test to test. These are the commonly quoted
  // approximate ones (raw correct out of 100 -> scaled 5-495), joined by straight lines. Good for "about where am I", not an official score.
  const L_TABLE = [[0, 5], [5, 15], [10, 30], [15, 45], [20, 65], [25, 85], [30, 110], [35, 135], [40, 160], [45, 190], [50, 215], [55, 245], [60, 275], [65, 310], [70, 340], [75, 370], [80, 400], [85, 430], [90, 460], [95, 485], [100, 495]];
  const R_TABLE = [[0, 5], [5, 15], [10, 30], [15, 45], [20, 65], [25, 85], [30, 105], [35, 130], [40, 155], [45, 180], [50, 205], [55, 235], [60, 265], [65, 295], [70, 325], [75, 355], [80, 385], [85, 415], [90, 445], [95, 470], [100, 495]];
  function scaled(section, raw) {
    const t = section === 'listening' ? L_TABLE : R_TABLE;
    const r = Math.max(0, Math.min(100, raw));
    for (let i = 1; i < t.length; i++) {
      if (r <= t[i][0]) {
        const [x0, y0] = t[i - 1];
        const [x1, y1] = t[i];
        return Math.round((y0 + ((y1 - y0) * (r - x0)) / (x1 - x0)) / 5) * 5;
      }
    }
    return 495;
  }
  // ETS's published mapping of a Listening+Reading total to CEFR (approximate bands)
  function cefrOf(total) {
    if (total >= 945) return 'C1';
    if (total >= 785) return 'B2';
    if (total >= 550) return 'B1';
    if (total >= 225) return 'A2';
    if (total >= 120) return 'A1';
    return 'ต่ำกว่า A1';
  }

  window.CEFR.toeicUi = { PARTS, LETTERS, mmss, guard, picture, questionCard, paint, groupBlock, clipPlayer, scaled, cefrOf };
})();
