// Lesson page (explanation, examples, mini exercises). The list of lessons is the hub's เรียน tab.
// Routing is hash-based: learn.html#present-simple → that lesson; no hash → redirect to index.html#learn.
(function () {
  'use strict';

  const { store, shuffle, h, rich } = window.CEFR;
  const lessons = window.CEFR_DATA.lessons;
  const root = document.getElementById('app');

  const KEYS = '12345';

  const getProgress = () => store.get('learn:progress', {});
  const setView = (...nodes) => root.replaceChildren(...nodes.flat(Infinity).filter(Boolean));

  // ---------- Lesson page ----------
  function renderTable(t) {
    return h('div', { class: 'table-wrap' },
      h('table', { class: 'table', 'data-tr': true },
        h('thead', {}, h('tr', {}, t.head.map((c) => h('th', {}, rich(c))))),
        h('tbody', {}, t.rows.map((r) => h('tr', {}, r.map((c) => h('td', {}, rich(c))))))));
  }

  function renderSection(s) {
    return h('section', { class: 'lesson-section' },
      h('h2', { class: 'lesson-h', text: s.title }),
      (s.body || []).map((p) => h('p', { class: 'lesson-p', 'data-tr': true }, rich(p))),
      s.table && renderTable(s.table),
      s.examples && h('ul', { class: 'examples' },
        s.examples.map(([en, th]) => h('li', {},
          h('span', { class: 'ex-en', 'data-tr': true, text: en }),
          h('span', { class: 'ex-th', text: th })))),
      s.note && h('p', { class: 'note ' + s.note.kind, 'data-tr': true },
        h('strong', { text: s.note.kind === 'warn' ? 'ระวัง · ' : 'จำไว้ · ' }), rich(s.note.text)));
  }

  function renderExercises(lesson) {
    const box = h('div', { class: 'exercises' });
    let correct = 0;
    let answered = 0;

    function finish() {
      const progress = getProgress();
      const prev = progress[lesson.id];
      const score = correct;
      progress[lesson.id] = { done: true, score: prev && prev.score > score ? prev.score : score, total: lesson.exercises.length, at: Date.now() };
      store.set('learn:progress', progress);
      const idx = lessons.indexOf(lesson);
      const next = lessons[idx + 1];
      box.append(h('div', { class: 'ex-done' },
        h('strong', { text: 'ได้ ' + correct + ' / ' + lesson.exercises.length + ' ข้อ' }),
        h('div', { class: 'btn-row' },
          next && h('a', { class: 'btn', href: '#' + next.id, text: 'บทถัดไป: ' + next.title }),
          h('button', { class: 'btn btn-outline', type: 'button', text: 'ทำแบบฝึกหัดใหม่', onclick: build }),
          h('a', { class: 'btn btn-outline', href: 'index.html#learn', text: 'บทเรียนทั้งหมด' }))));
    }

    function build() {
      correct = 0;
      answered = 0;
      box.replaceChildren(...lesson.exercises.map((ex, i) => {
        const order = shuffle(ex.c.map((_, j) => j));
        const fb = h('div', { class: 'feedback', 'aria-live': 'polite', hidden: true });
        const btns = order.map((orig, k) => h('button', {
          class: 'choice',
          type: 'button',
          onclick: () => {
            if (btns[0].disabled) return;
            btns.forEach((b) => { b.disabled = true; });
            const ok = orig === ex.a;
            answered++;
            if (ok) correct++;
            btns[k].classList.add(ok ? 'correct' : 'wrong');
            if (!ok) btns[order.indexOf(ex.a)].classList.add('correct');
            fb.className = 'feedback ' + (ok ? 'ok' : 'bad');
            fb.replaceChildren(...[
              h('strong', { class: 'feedback-title', text: ok ? 'ถูกต้อง' : 'ผิด' }),
              h('p', { class: 'feedback-text', 'data-tr': true }, rich(ex.e)),
              window.CEFR.markup && window.CEFR.markup.block({ bank: 'lessons', key: lesson.id + '#' + i, q: ex.q, answer: ex.c[ex.a] }),
            ].filter(Boolean));
            fb.hidden = false;
            if (answered === lesson.exercises.length) finish();
          },
        },
        h('span', { class: 'choice-key', 'aria-hidden': 'true', text: KEYS[k] }),
        h('span', { text: ex.c[orig] })));
        return h('div', { class: 'exercise' },
          h('p', { class: 'ex-no', text: 'ข้อ ' + (i + 1) }),
          h('p', { class: 'question', 'data-tr': true, text: ex.q }),
          h('div', { class: 'choices' }, btns),
          fb);
      }));
    }

    build();
    return box;
  }

  function renderLesson(lesson) {
    document.title = lesson.title + ' (' + lesson.en + ') — บทเรียน — CEFR Quiz';
    const idx = lessons.indexOf(lesson);
    const prev = lessons[idx - 1];
    const next = lessons[idx + 1];

    const pass = window.CEFR.pass;
    if (pass && !pass.allows('lesson:' + lesson.level)) {
      setView(
        h('a', { class: 'back-link', href: 'index.html#learn', text: '← บทเรียนทั้งหมด' }),
        h('p', { class: 'eyebrow lesson-eyebrow', text: 'บทเรียน · ' + lesson.level + ' · ' + lesson.minutes + ' นาที' }),
        h('h1', { class: 'page-title' }, lesson.title + ' ', h('span', { class: 'light', text: lesson.en })),
        h('p', { class: 'lead', 'data-tr': true }, rich(lesson.intro)),
        pass.lockPanel('lesson:' + lesson.level, {
          title: 'บทเรียนระดับ ' + lesson.level + ' สำหรับสมาชิก',
          text: 'บทเรียนระดับ A1 อ่านได้ฟรี ตั้งแต่ A2 ขึ้นไปเป็นของสมาชิก เลือกแพ็กเกจตั้งแต่ 1 วัน (20 บาท)',
          freeHref: 'index.html#learn', freeText: 'กลับไปบทเรียนฟรี',
        }));
      return;
    }

    setView(
      h('a', { class: 'back-link', href: 'index.html#learn', text: '← บทเรียนทั้งหมด' }),
      h('p', { class: 'eyebrow lesson-eyebrow', text: 'บทเรียน · ' + lesson.level + ' · ' + lesson.minutes + ' นาที' }),
      h('h1', { class: 'page-title' }, lesson.title + ' ', h('span', { class: 'light', text: lesson.en })),
      h('p', { class: 'lead', 'data-tr': true }, rich(lesson.intro)),
      h('p', { class: 'fine-print', style: { marginTop: '-16px', marginBottom: '24px' }, text: 'คลิกที่คำภาษาอังกฤษ หรือลากคลุมข้อความ เพื่อดูคำแปล · ปุ่ม "แปล" มุมขวาบนใช้เปิด/ปิดระบบนี้' }),
      lesson.sections.map(renderSection),
      h('section', { class: 'lesson-section' },
        h('h2', { class: 'lesson-h', text: 'ลองทำดู' }),
        renderExercises(lesson)),
      h('nav', { class: 'lesson-nav' },
        prev ? h('a', { href: '#' + prev.id, text: '← ' + prev.title }) : h('span'),
        next ? h('a', { href: '#' + next.id, text: next.title + ' →' }) : h('span'))
    );
  }

  // ---------- Router ----------
  function route() {
    const id = decodeURIComponent(location.hash.slice(1));
    const lesson = lessons.find((l) => l.id === id);
    if (lesson) renderLesson(lesson); else location.replace('index.html#learn');   // the lesson list lives in the hub's เรียน tab
    window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', route);
  (window.CEFR.pass ? window.CEFR.pass.ready : Promise.resolve()).then(route);
})();
