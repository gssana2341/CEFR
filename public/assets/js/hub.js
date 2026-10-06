// Home page with four tabs (หน้าหลัก · เรียน · ฝึก · ทดสอบ), switched by the URL hash:
//   index.html#home | #learn | #practice | #test
// Everything here is built from CEFR_DATA and the learner's progress in localStorage.
(function () {
  'use strict';

  const { store, pct, h, renderNav } = window.CEFR;
  const D = window.CEFR_DATA;
  const root = document.getElementById('app');
  const nav = document.querySelector('nav.tabs');

  const TABS = ['home', 'learn', 'practice', 'test', 'toeic'];
  const TITLES = { home: 'CEFR Quiz — เรียน ฝึก และวัดระดับภาษาอังกฤษ', learn: 'เรียน — CEFR Quiz', practice: 'ฝึก — CEFR Quiz', test: 'ทดสอบ — CEFR Quiz', toeic: 'TOEIC — CEFR Quiz' };
  const LEVEL_NAMES = { A1: ['A1', 'เริ่มต้น'], A2: ['A2', 'พื้นฐาน'], B1: ['B1', 'กลาง'], B2: ['B2', 'กลางค่อนสูง'] };
  const PASS_RATIO = 0.7;

  const dateTh = (ms) => new Date(ms).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  const clock = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const levelName = (l) => (l === 'pre-A1' ? 'ต่ำกว่า A1' : l === 'B2+' ? 'B2 ขึ้นไป' : l);
  const btn = (text, href, primary) => h('a', { class: 'btn' + (primary ? '' : ' btn-outline'), href, text });
  const accBtn = (text, href) => h('a', { class: 'btn btn-acc', href, text });   // button in the colour of its area
  // members-only feature that this visitor has not unlocked → show the "สมาชิก" tag
  const billingOn = () => !!((window.CEFR_DATA.billing || {}).enabled);
  const lockedFor = (feature) => { const p = window.CEFR.pass; return !!(p && p.members(feature) && !p.active()); };

  // ---------- Progress readers ----------
  const lessonProgress = () => store.get('learn:progress', {});
  const lessonsDone = () => D.lessons.filter((l) => (lessonProgress()[l.id] || {}).done).length;
  const placementLast = () => store.get('placement:last', null);
  const placementRunning = () => { const s = store.get('placement:state', null); return !!(s && s.v === 3); };   // older test versions are discarded
  const examHistory = () => store.get('exam:history', []);

  // An exam still in progress (current section's clock not yet run out, or waiting between sections).
  function examRunning() {
    const s = store.get('exam:state', null);
    return s && s.v === 2 && (s.between || s.secEndsAt > Date.now()) ? s : null;
  }
  const examLeft = (s) => (s.between ? 'รอเริ่มส่วนถัดไป' : 'เหลือเวลา ' + clock(s.secEndsAt - Date.now()));

  // The EF SET-style format (first profile): total minutes of the sections that are available now.
  const efProfile = () => D.exam.profiles[0];
  const examMinutes = () => efProfile().sections.filter((s) => s.parts.length && !s.comingSoon).reduce((sum, s) => sum + s.minutes, 0);
  const examSectionNames = () => efProfile().sections.filter((s) => s.parts.length && !s.comingSoon).map((s) => s.title).join(' + ');

  // The level where the learner failed their placement stage → the lessons worth doing first.
  function focusLevel() {
    const last = placementLast();
    if (!last) return null;
    if (last.target) return last.target;                       // adaptive test: the level above the one reached
    if (!Array.isArray(last.results)) return null;             // older result from the stage-by-stage test
    const failed = last.results.find((r) => r.score / r.total < PASS_RATIO);
    return failed ? failed.level : null;
  }

  function nextLesson() {
    const prog = lessonProgress();
    const todo = D.lessons.filter((l) => !(prog[l.id] || {}).done);
    const focus = focusLevel();
    return todo.find((l) => l.level === focus) || todo[0] || null;
  }

  // Per practice set: { meta[], cta, resume: 'ตอบแล้ว 3/25' | null }
  function practiceInfo(id) {
    if (id === 'cloze') {
      const passages = D.manifest.cloze;
      const blanks = passages.reduce((s, p) => s + p.blanks, 0);
      const meta = [passages.length + ' บทความ', blanks + ' ช่องว่าง'];
      let resume = null;
      const st = store.get('cloze:state', null);
      if (st && Array.isArray(st.order) && st.order.length) resume = 'ส่งแล้ว ' + st.index + '/' + st.order.length + ' บทความ';
      const done = Object.keys(store.get('cloze:best', {}) || {}).filter((i) => passages[i]).length;
      if (done) meta.push('เคยทำแล้ว ' + done + '/' + passages.length + ' บท');
      return { meta, cta: resume ? 'ทำต่อ' : 'เริ่มทำ', resume };
    }
    const meta = [D.manifest.counts[id] + ' ข้อ'];
    let resume = null;
    const st = store.get(id + ':state', null);
    if (st && Array.isArray(st.items) && st.items.length) {
      resume = 'ตอบแล้ว ' + st.items.filter((it) => it && it.pick !== null).length + '/' + st.items.length + ' ข้อ';
    }
    const stats = store.get(id + ':stats', null);
    if (stats && stats.best) meta.push('คะแนนดีที่สุด ' + pct(stats.best.score, stats.best.total) + '%');
    const wrong = store.get(id + ':wrong', []);
    if (Array.isArray(wrong) && wrong.length) meta.push('ยังไม่แม่น ' + wrong.length + ' ข้อ');
    return { meta, cta: resume ? 'ทำต่อ' : 'เริ่มทำ', resume };
  }

  const PRACTICE = [
    { id: 'grammar', title: 'Grammar', thai: 'ไวยากรณ์ A1–B1', desc: 'เลือกคำตอบที่ถูกต้องจากบทสนทนาสั้นๆ ครอบคลุมไวยากรณ์ A1–B1', href: 'grammar.html' },
    { id: 'conversations', title: 'Conversations', thai: 'บทสนทนา', desc: 'อ่านบทสนทนาแล้วเลือกว่าผู้พูดหมายความว่าอะไร', href: 'conversations.html' },
    { id: 'cloze', title: 'Cloze Test', thai: 'เติมคำ', desc: 'เลือกคำใส่ช่องว่างในบทความ ทำทั้งชุดหรือเลือกทีละบทก็ได้', href: 'cloze.html' },
    { id: 'extra', title: 'Extra', thai: 'ข้อสอบใหม่', desc: 'Phrasal verbs, collocations, prepositions, word forms และภาษาพูด', href: 'extra.html' },
  ];

  const practiceStarted = () => PRACTICE.some((p) => {
    const st = store.get(p.id + ':stats', null);
    return (st && st.attempts) || store.get(p.id + ':state', null) || Object.keys(store.get(p.id + ':best', {}) || {}).length;
  });

  // ---------- Panels ----------
  function continueCard() {
    const items = [];
    const ps = placementRunning() ? store.get('placement:state', null) : null;
    if (ps && ps.v === 3 && Number.isInteger(ps.n)) {
      items.push({ title: 'ทดสอบระดับ CEFR', meta: 'ทำไปแล้ว ' + (ps.n - 1) + ' ข้อ', href: 'placement.html' });
    }
    const ex = examRunning();
    if (ex) items.push({ title: 'สอบจำลอง', meta: examLeft(ex), href: 'exam.html' });
    PRACTICE.forEach((p) => {
      const info = practiceInfo(p.id);
      if (info.resume) items.push({ title: p.title + ' ' + p.thai, meta: info.resume, href: p.href });
    });
    if (!items.length) return null;
    return h('section', { class: 'continue' },
      h('h2', { text: 'ทำต่อจากที่ค้างไว้' }),
      items.slice(0, 3).map((it) => h('div', { class: 'continue-item' },
        h('div', {}, h('p', { class: 'continue-title', text: it.title }), h('p', { class: 'continue-meta', text: it.meta })),
        btn('ทำต่อ', it.href, true))));
  }

  // one dismissible line instead of a boxed banner (the choice is remembered on this device)
  function noticeLine() {
    const KEY = 'ui:notice:1';
    if (store.get(KEY, false)) return null;
    const line = h('div', { class: 'notice-line', role: 'note' },
      h('span', { text: 'ระบบจะทยอยเพิ่มข้อสอบไปจนถึงระดับ C2 และกำลังทำพาร์ทการฟัง (Listening) รอติดตามได้เลย' }),
      h('button', { class: 'notice-close', type: 'button', 'aria-label': 'ปิดประกาศ', text: '×', onclick: () => { store.set(KEY, true); line.remove(); } }));
    return line;
  }

  // a tile: the whole tile is the link (practice, test, TOEIC); without an href it is shown as "coming soon"
  function listRow(href, title, thai, sub, side, acc, chip, lead) {
    const inner = [
      lead,
      h('span', { class: 'list-row-main' },
        h('span', { class: 'list-row-title' }, title, thai && [' ', h('span', { class: 'light', text: thai })]),
        sub && h('span', { class: 'list-row-sub', text: sub })),
      side && h('span', { class: 'list-row-side' + (chip ? ' chip-acc' : ''), text: side })];
    return h('li', { class: acc ? 'acc-' + acc : null },
      href ? h('a', { class: 'list-row', href }, inner) : h('div', { class: 'list-row soon-row' }, inner));
  }

  function homePanel() {
    const last = placementLast();
    const hist = examHistory();
    const done = lessonsDone();
    const nl = nextLesson();
    const wrongTotal = PRACTICE.reduce((s, p) => s + ((store.get(p.id + ':wrong', []) || []).length || 0), 0);
    const questions = PRACTICE.reduce((s, p) => s + (p.id === 'cloze' ? D.manifest.cloze.reduce((a, c) => a + c.blanks, 0) : D.manifest.counts[p.id]), 0);

    // Which step is next? The first one not yet finished: placement → all lessons → some practice → a mock exam.
    const finishedSteps = [!!last, done === D.lessons.length, practiceStarted(), hist.length > 0];
    const rec = finishedSteps.indexOf(false) + 1;  // 1-based, 0 = everything done

    const placeRunning = placementRunning();
    const steps = [
      { acc: 'placement', title: 'วัดระดับของคุณ', desc: 'ทำแบบทดสอบ 15 นาที เพื่อรู้ว่าอยู่ระดับไหน และควรเริ่มเรียนจากบทไหน',
        meta: last ? 'ผลล่าสุด: ระดับ ' + levelName(last.level) + ' (' + dateTh(last.at) + ')' : 'ปรับความยากอัตโนมัติ · ประมาณ 20–25 ข้อ',
        status: last ? 'ระดับ ' + levelName(last.level) : '', href: 'placement.html', cta: placeRunning ? 'ทำต่อ' : last ? 'ทำอีกครั้ง' : 'เริ่มทดสอบ', done: !!last },
      { acc: 'learn', title: 'เรียนไวยากรณ์', desc: 'บทเรียนภาษาไทย ' + D.lessons.length + ' บท ครบทั้ง 12 tenses มีตัวอย่างและแบบฝึกหัดท้ายบท',
        meta: 'เรียนแล้ว ' + done + '/' + D.lessons.length + ' บท' + (nl ? ' · บทถัดไป: ' + nl.title : ''),
        status: done + '/' + D.lessons.length + ' บท', href: nl ? 'learn.html#' + nl.id : 'index.html#learn', cta: done ? 'เรียนต่อ' : 'เริ่มเรียน', done: done === D.lessons.length },
      { acc: 'grammar', title: 'ฝึกทำข้อสอบ', desc: 'แบบฝึกหัด ' + questions + ' ข้อ ใน 4 ชุด ตอบแล้วเห็นเฉลยพร้อมคำอธิบายทันที',
        meta: wrongTotal ? 'มีข้อที่ยังไม่แม่น ' + wrongTotal + ' ข้อ รอทบทวน' : null,
        status: wrongTotal ? 'ยังไม่แม่น ' + wrongTotal + ' ข้อ' : '', href: 'index.html#practice', cta: 'เลือกชุดฝึก', done: false },
      { acc: 'exam', title: 'ซ้อมสอบจริง', desc: 'สอบจำลองตามกติกา EF SET จับเวลาแยกส่วน (' + examSectionNames() + ' ' + examMinutes() + ' นาที) ย้อนกลับไม่ได้',
        meta: hist.length ? 'ผลล่าสุด ' + pct(hist[0].score, hist[0].total) + '% (' + dateTh(hist[0].at) + ')' : null,
        status: hist.length ? pct(hist[0].score, hist[0].total) + '%' : '', href: 'exam.html', cta: examRunning() ? 'กลับไปสอบ' : 'เริ่มสอบจำลอง', done: hist.length > 0 },
    ];
    const next = rec ? steps[rec - 1] : null;

    const others = steps.map((st, i) => (next && i === rec - 1 ? null : h('li', { class: 'acc-' + st.acc },
      h('a', { class: 'step-row', href: st.href },
        h('span', { class: 'step-mark' + (st.done ? ' done' : ''), 'aria-hidden': 'true', text: st.done ? '✓' : String(i + 1) }),
        h('span', { class: 'step-row-title', text: st.title }),
        h('span', { class: 'step-row-status', text: st.status })))));

    return h('div', {},
      h('h1', { class: 'page-title', text: 'เรียน ฝึก และวัดระดับ CEFR' }),
      h('p', { class: 'lead', text: 'ภาษาอังกฤษระดับ A1–B2 อธิบายเป็นภาษาไทย ตอบแล้วเห็นเฉลยทันที คลิกคำเพื่อดูคำแปลได้ทุกหน้า' }),
      noticeLine(),
      h('div', { class: 'home-grid' },
        h('div', {},
          continueCard(),
          next && h('section', { class: 'next-card acc-' + next.acc },
            h('p', { class: 'next-label', text: 'ขั้นต่อไป · ขั้นที่ ' + rec + ' จาก 4' }),
            h('h2', { class: 'next-title', text: next.title }),
            h('p', { class: 'next-desc', text: next.desc }),
            next.meta && h('p', { class: 'next-meta', text: next.meta }),
            h('div', { class: 'next-actions' }, accBtn(next.cta, next.href)))),
        h('div', {},
          h('p', { class: 'home-side-title', text: next ? 'ขั้นตอนอื่นๆ' : 'ขั้นตอนทั้งหมด' }),
          h('ol', { class: 'path-compact', 'aria-label': 'ขั้นตอนที่แนะนำ' }, others))));
  }

  function learnPanel() {
    const prog = lessonProgress();
    const last = placementLast();
    const focus = focusLevel();
    const levels = [...new Set(D.lessons.map((l) => l.level))];
    const numberOf = new Map(D.lessons.map((l, i) => [l.id, i + 1]));
    // open the level the learner should work on: the one placement suggested, else the first with lessons left
    const openLevel = (focus && levels.includes(focus) ? focus : null)
      || levels.find((lv) => D.lessons.some((l) => l.level === lv && !(prog[l.id] || {}).done)) || levels[0];
    return h('div', {},
      h('h1', { class: 'page-title', text: 'บทเรียนไวยากรณ์' }),
      h('p', { class: 'tab-intro', text: 'เรียนแล้ว ' + lessonsDone() + '/' + D.lessons.length + ' บท · เลือกบท อ่านคำอธิบาย แล้วทำแบบฝึกหัดท้ายบท' }),
      last && h('p', { class: 'card-meta', style: { marginTop: '-12px', marginBottom: '20px' }, text: focus ? 'จากผลวัดระดับ (' + levelName(last.level) + ') แนะนำให้เริ่มที่บทระดับ ' + focus : 'คุณผ่านทุกระดับในการวัดระดับแล้ว เรียนทบทวนบทไหนก็ได้' }),
      levels.map((lv) => {
        const list = D.lessons.filter((l) => l.level === lv);
        const doneN = list.filter((l) => (prog[l.id] || {}).done).length;
        return h('details', { class: 'level-fold', open: lv === openLevel ? true : null },
          h('summary', {},
            h('span', { class: 'level-name' }, (LEVEL_NAMES[lv] || [lv])[0], ' ', h('span', { class: 'light', text: (LEVEL_NAMES[lv] || ['', ''])[1] })),
            h('span', { class: 'level-count', text: doneN + '/' + list.length })),
          h('ul', { class: 'lesson-list' }, list.map((l) => {
            const p = prog[l.id];
            const isDone = p && p.done;
            const state = isDone ? '✓ ' + p.score + '/' + p.total : lockedFor('lesson:' + l.level) ? 'สมาชิก' : l.level === focus ? 'แนะนำ' : l.minutes + ' นาที';
            return h('li', {}, h('a', { class: 'lesson-link', href: 'learn.html#' + l.id },
              h('span', { class: 'lesson-no', text: String(numberOf.get(l.id)).padStart(2, '0') }),
              h('span', { class: 'lesson-name' }, l.title + ' ', h('span', { class: 'light', text: l.en })),
              h('span', { class: 'lesson-state' + (isDone ? ' done' : ''), text: state })));
          })));
      }),
      h('ul', { class: 'list-rows tiles', style: { marginTop: '28px' } },
        listRow('tenses.html', 'สรุป 12 Tenses', 'Tense summary', 'ตารางสูตร กฎการใช้ และคำบอกเวลา', 'เปิดดู', 'learn')));
  }

  function practicePanel() {
    return h('div', {},
      h('h1', { class: 'page-title', text: 'ฝึกทำข้อสอบ' }),
      h('p', { class: 'tab-intro', text: 'ตอบแล้วเห็นเฉลยพร้อมคำอธิบายทันที ข้อที่ผิดจะถูกเก็บไว้ให้ทบทวนภายหลัง' }),
      h('ul', { class: 'list-rows tiles' }, PRACTICE.map((p) => {
        const info = practiceInfo(p.id);
        const locked = lockedFor('practice:' + p.id);
        const side = locked ? 'สมาชิก' : info.resume ? 'ทำต่อ' : 'เริ่มทำ';
        return listRow(locked ? 'pricing.html?need=practice:' + p.id : p.href, p.title, p.thai,
          [...info.meta, info.resume && 'ค้างอยู่: ' + info.resume].filter(Boolean).join(' · '), side, p.id, !locked);
      })));
  }

  function testPanel() {
    const last = placementLast();
    const hist = examHistory();
    const running = examRunning();
    const examLocked = lockedFor('exam');
    return h('div', {},
      h('h1', { class: 'page-title', text: 'ทดสอบ' }),
      h('p', { class: 'tab-intro', text: 'ไม่แน่ใจว่าจะเริ่มตรงไหน ให้ทดสอบระดับก่อน แล้วค่อยซ้อมสอบจริงเมื่อฝึกมาพอสมควร' }),
      h('ul', { class: 'list-rows tiles' },
        listRow('placement.html', 'ทดสอบระดับ', 'Placement test',
          ['ปรับความยากอัตโนมัติ · ประมาณ 20–25 ข้อ', last && 'ผลล่าสุด: ' + levelName(last.level) + ' (' + dateTh(last.at) + ')'].filter(Boolean).join(' · '),
          placementRunning() ? 'ทำต่อ' : last ? 'ทำอีกครั้ง' : 'เริ่มทดสอบ', 'placement', true),
        listRow(examLocked && !running ? 'pricing.html?need=exam' : 'exam.html', 'สอบจำลอง', 'Mock exam',
          ['แบบ EF SET ' + examMinutes() + ' นาที · แบบยืดหยุ่น ' + D.exam.profiles[1].sections[0].minutes + ' นาที', hist.length && 'ผลล่าสุด ' + pct(hist[0].score, hist[0].total) + '% (' + dateTh(hist[0].at) + ')', running && 'กำลังสอบอยู่ · ' + examLeft(running)].filter(Boolean).join(' · '),
          examLocked ? 'สมาชิก' : running ? 'กลับไปสอบ' : 'เริ่มสอบ', 'exam', !examLocked)));
  }

  // ---------- TOEIC ----------
  // The seven parts of the real test. A part with a `set` is available now; the others are listed so the whole
  // structure is visible (Listening needs audio, see the plan in README).
  const TOEIC_PARTS = [
    { part: 1, title: 'Photographs', thai: 'ภาพถ่าย', group: 'Listening', q: 6 },
    { part: 2, title: 'Question–Response', thai: 'ถาม–ตอบสั้น', group: 'Listening', q: 25 },
    { part: 3, title: 'Conversations', thai: 'บทสนทนา', group: 'Listening', q: 39 },
    { part: 4, title: 'Talks', thai: 'บทพูดสั้น', group: 'Listening', q: 30 },
    { part: 5, title: 'Incomplete Sentences', thai: 'เติมประโยค', group: 'Reading', q: 30, set: 'toeic5', href: 'toeic5.html' },
    { part: 6, title: 'Text Completion', thai: 'เติมข้อความ', group: 'Reading', q: 16 },
    { part: 7, title: 'Reading Comprehension', thai: 'อ่านจับใจความ', group: 'Reading', q: 54 },
  ];

  function toeicPanel() {
    const tile = (big, small) => h('div', { class: 'stat-tile' }, h('strong', { text: big }), h('span', { text: small }));
    const partRow = (p) => {
      const lead = h('span', { class: 'part-no', text: String(p.part) });
      if (!p.set) return listRow(null, p.title, p.thai, 'ข้อสอบจริง ' + p.q + ' ข้อ', 'เร็วๆ นี้', 'toeic', false, lead);
      const info = practiceInfo(p.set);
      return listRow(p.href, p.title, p.thai, [...info.meta, info.resume && 'ค้างอยู่: ' + info.resume].filter(Boolean).join(' · '),
        info.resume ? 'ทำต่อ' : 'เริ่มทำ', 'toeic', true, lead);
    };
    const parts = (group) => TOEIC_PARTS.filter((p) => p.group === group);
    return h('div', { class: 'acc-toeic' },
      h('h1', { class: 'page-title' }, 'TOEIC ', h('span', { class: 'light', text: 'ฝึก · เรียน · ซ้อมสอบ' })),
      h('p', { class: 'tab-intro', text: 'ที่รวมสำหรับเตรียมสอบ TOEIC: ฝึกตาม Part ข้อสอบเก่าและชุดจำลอง และแนวทางทำข้อสอบ ตอนนี้เปิด Part 5 แล้ว ส่วนที่เหลือทยอยเพิ่ม' }),
      h('div', { class: 'stat-tiles' },
        tile('200 ข้อ', 'ข้อสอบจริง 2 ชั่วโมง'),
        tile('Listening', '100 ข้อ · 45 นาที · Part 1–4'),
        tile('Reading', '100 ข้อ · 75 นาที · Part 5–7'),
        tile('10–990', 'ช่วงคะแนนรวม')),
      h('div', { class: 'part-group' }, h('h2', { text: 'Listening' }), h('p', { class: 'meta', text: 'ต้องใช้ไฟล์เสียง กำลังเตรียมระบบ' })),
      h('ul', { class: 'list-rows tiles' }, parts('Listening').map(partRow)),
      h('div', { class: 'part-group' }, h('h2', { text: 'Reading' }), h('p', { class: 'meta', text: 'ฝึกได้ทีละ Part' })),
      h('ul', { class: 'list-rows tiles' }, parts('Reading').map(partRow)),
      h('div', { class: 'part-group' }, h('h2', { text: 'ข้อสอบเก่าและชุดจำลอง' })),
      h('ul', { class: 'list-rows tiles' },
        listRow(null, 'คลังข้อสอบเก่า', null, 'รวบรวมชุดที่ใช้ได้อย่างถูกลิขสิทธิ์ แสดงที่มาของทุกชุด', 'เร็วๆ นี้', 'toeic'),
        listRow(null, 'ชุดจำลอง 200 ข้อ', null, 'จับเวลาเหมือนจริง พร้อมคะแนนประมาณ 10–990', 'เร็วๆ นี้', 'toeic')),
      h('div', { class: 'part-group' }, h('h2', { text: 'เรียนเพื่อ TOEIC' })),
      h('ul', { class: 'list-rows tiles' },
        listRow('index.html#learn', 'ไวยากรณ์ที่ออกบ่อย', null, 'tense, preposition, word form — ใช้บทเรียนในแท็บเรียนได้เลย', 'ไปที่บทเรียน', 'toeic', true),
        listRow(null, 'กลยุทธ์ทำแต่ละ Part', null, 'เทคนิคและกับดักที่พบบ่อย', 'เร็วๆ นี้', 'toeic'),
        listRow(null, 'ศัพท์ธุรกิจที่ออกบ่อย', null, 'จัดตามหัวข้อ: สำนักงาน การเงิน การเดินทาง', 'เร็วๆ นี้', 'toeic')));
  }

  // ---------- Tabs ----------
  const panels = {};
  function build() {
    panels.home = h('section', { class: 'tab-panel', id: 'tab-home' }, homePanel());
    panels.learn = h('section', { class: 'tab-panel', id: 'tab-learn' }, learnPanel());
    panels.practice = h('section', { class: 'tab-panel', id: 'tab-practice' }, practicePanel());
    panels.test = h('section', { class: 'tab-panel', id: 'tab-test' }, testPanel());
    panels.toeic = h('section', { class: 'tab-panel', id: 'tab-toeic' }, toeicPanel());
    root.replaceChildren(...TABS.map((t) => panels[t]));
  }

  function currentTab() {
    const name = location.hash.slice(1);
    return TABS.includes(name) ? name : 'home';
  }

  function show() {
    const tab = currentTab();
    build();                                   // rebuild so progress is always fresh
    TABS.forEach((t) => { panels[t].hidden = t !== tab; });
    renderNav(nav, tab);
    document.title = TITLES[tab];
    window.scrollTo(0, 0);
  }

  document.addEventListener('cefr:pass', () => {
    const tab = currentTab();
    build();
    TABS.forEach((t) => { panels[t].hidden = t !== tab; });
  });
  window.addEventListener('hashchange', show);
  window.addEventListener('pageshow', (e) => { if (e.persisted) show(); });   // back button → refresh progress
  show();
})();
