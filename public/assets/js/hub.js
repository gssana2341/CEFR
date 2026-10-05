// Home page with four tabs (หน้าหลัก · เรียน · ฝึก · ทดสอบ), switched by the URL hash:
//   index.html#home | #learn | #practice | #test
// Everything here is built from CEFR_DATA and the learner's progress in localStorage.
(function () {
  'use strict';

  const { store, pct, h, renderNav } = window.CEFR;
  const D = window.CEFR_DATA;
  const root = document.getElementById('app');
  const nav = document.querySelector('nav.tabs');

  const TABS = ['home', 'learn', 'practice', 'test'];
  const TITLES = { home: 'CEFR Quiz — เรียน ฝึก และวัดระดับภาษาอังกฤษ', learn: 'เรียน — CEFR Quiz', practice: 'ฝึก — CEFR Quiz', test: 'ทดสอบ — CEFR Quiz' };
  const LEVEL_NAMES = { A1: ['A1', 'เริ่มต้น'], A2: ['A2', 'พื้นฐาน'], B1: ['B1', 'กลาง'], B2: ['B2', 'กลางค่อนสูง'] };
  const PASS_RATIO = 0.7;

  const dateTh = (ms) => new Date(ms).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  const clock = (ms) => { const s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
  const levelName = (l) => (l === 'pre-A1' ? 'ต่ำกว่า A1' : l === 'B2+' ? 'B2 ขึ้นไป' : l);
  const btn = (text, href, primary) => h('a', { class: 'btn' + (primary ? '' : ' btn-outline'), href, text });
  const accBtn = (text, href) => h('a', { class: 'btn btn-acc', href, text });   // button in the colour of its exam set
  // members-only feature that this visitor has not unlocked → show the "สมาชิก" tag
  const billingOn = () => !!((window.CEFR_DATA.billing || {}).enabled);
  const freeTag = (feature) => billingOn() && !(window.CEFR.pass && window.CEFR.pass.members(feature)) && h('span', { class: 'free-tag', text: 'ฟรี' });
  const lockedFor = (feature) => { const p = window.CEFR.pass; return !!(p && p.members(feature) && !p.active()); };

  // ---------- Progress readers ----------
  const lessonProgress = () => store.get('learn:progress', {});
  const lessonsDone = () => D.lessons.filter((l) => (lessonProgress()[l.id] || {}).done).length;
  const placementLast = () => store.get('placement:last', null);
  const placementRunning = () => { const s = store.get('placement:state', null); return !!(s && s.v === 2); };   // older test versions are discarded
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
      const passages = D.cloze;
      const blanks = passages.reduce((s, p) => s + p.blanks.length, 0);
      const meta = [passages.length + ' บทความ', blanks + ' ช่องว่าง'];
      let resume = null;
      const st = store.get('cloze:state', null);
      if (st && Array.isArray(st.order) && st.order.length) resume = 'ส่งแล้ว ' + st.index + '/' + st.order.length + ' บทความ';
      const done = Object.keys(store.get('cloze:best', {}) || {}).filter((i) => passages[i]).length;
      if (done) meta.push('เคยทำแล้ว ' + done + '/' + passages.length + ' บท');
      return { meta, cta: resume ? 'ทำต่อ' : 'เริ่มทำ', resume };
    }
    const meta = [D[id].length + ' ข้อ'];
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
    if (ps && ps.v === 2 && Array.isArray(ps.answers)) {
      items.push({ title: 'ทดสอบระดับ CEFR', meta: 'ทำไปแล้ว ' + ps.answers.length + ' ข้อ', href: 'placement.html' });
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

  function step(no, title, desc, meta, actions, opts) {
    return h('li', { class: 'step' + (opts.recommended ? ' recommended' : '') },
      h('span', { class: 'step-no', 'aria-hidden': 'true', text: String(no) }),
      h('div', { class: 'step-body' },
        h('p', { class: 'step-title' }, title + ' ', opts.recommended && h('span', { class: 'rec-tag', text: 'แนะนำถัดไป' }), opts.done && h('span', { class: 'done-tag', text: '✓ ทำแล้ว' })),
        h('p', { class: 'step-desc', text: desc }),
        meta && h('p', { class: 'step-meta', text: meta })),
      h('div', { class: 'step-actions' }, actions));
  }

  function homePanel() {
    const last = placementLast();
    const hist = examHistory();
    const done = lessonsDone();
    const nl = nextLesson();
    const wrongTotal = PRACTICE.reduce((s, p) => s + ((store.get(p.id + ':wrong', []) || []).length || 0), 0);
    const questions = PRACTICE.reduce((s, p) => s + (p.id === 'cloze' ? D.cloze.reduce((a, c) => a + c.blanks.length, 0) : D[p.id].length), 0);

    // Which step is next? The first one not yet finished: placement → all lessons → some practice → a mock exam.
    const finishedSteps = [!!last, done === D.lessons.length, practiceStarted(), hist.length > 0];
    const rec = finishedSteps.indexOf(false) + 1;  // 1-based, 0 = everything done

    const placeRunning = placementRunning();
    return h('div', {},
      h('h1', { class: 'page-title', text: 'เรียน ฝึก และวัดระดับ CEFR' }),
      h('p', { class: 'lead', text: 'ภาษาอังกฤษระดับ A1–B2 อธิบายเป็นภาษาไทย ตอบแล้วเห็นเฉลยทันที และคลิกคำหรือลากคลุมข้อความเพื่อดูคำแปลได้ทุกหน้า' }),
      h('div', { style: { padding: '14px 16px', background: 'var(--subtle)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: '24px', fontSize: '15px' } },
        h('strong', { text: '📢 ประกาศ: ' }),
        h('span', { text: 'ระบบจะทยอยอัปเดตข้อสอบไปจนถึงระดับ C2 และขณะนี้กำลังอยู่ในระหว่างการจัดทำพาร์ทการฟัง (Listening) รอติดตามได้เลยครับ' })
      ),
      continueCard(),
      h('h2', { class: 'section-title', text: 'เริ่มอย่างไรดี — 4 ขั้นตอนที่แนะนำ' }),
      h('ol', { class: 'path' },
        step(1, 'วัดระดับของคุณ', 'ทำแบบทดสอบ 15 นาที เพื่อรู้ว่าอยู่ระดับ A1–B2 และควรเริ่มเรียนจากบทไหน',
          last ? 'ผลล่าสุด: ระดับ ' + levelName(last.level) + ' (' + dateTh(last.at) + ')' : 'ปรับความยากอัตโนมัติ · ประมาณ 20–25 ข้อ',
          btn(placeRunning ? 'ทำต่อ' : last ? 'ทำอีกครั้ง' : 'เริ่มทดสอบ', 'placement.html', rec === 1), { recommended: rec === 1, done: !!last }),
        step(2, 'เรียนไวยากรณ์', 'บทเรียนภาษาไทย ' + D.lessons.length + ' บท ครบทั้ง 12 tenses มีตัวอย่างและแบบฝึกหัดท้ายบท',
          'เรียนแล้ว ' + done + '/' + D.lessons.length + ' บท' + (nl ? ' · บทถัดไป: ' + nl.title : ''),
          [nl && btn(done ? 'เรียนต่อ' : 'เริ่มเรียน', 'learn.html#' + nl.id, rec === 2), h('a', { class: 'link-btn', href: 'index.html#learn', text: 'ดูบทเรียนทั้งหมด' })],
          { recommended: rec === 2, done: done === D.lessons.length }),
        step(3, 'ฝึกทำข้อสอบ', 'แบบฝึกหัด ' + questions + ' ข้อ ใน 4 ชุด ตอบแล้วเห็นเฉลยพร้อมคำอธิบายทันที',
          wrongTotal ? 'มีข้อที่ยังไม่แม่น ' + wrongTotal + ' ข้อ รอทบทวน' : null,
          btn('เลือกชุดฝึก', 'index.html#practice', rec === 3), { recommended: rec === 3, done: false }),
        step(4, 'ซ้อมสอบจริง', 'สอบจำลองตามกติกา EF SET: จับเวลาแยกส่วน (' + examSectionNames() + ' ' + examMinutes() + ' นาที) ย้อนกลับไม่ได้ ไม่มีเฉลยระหว่างทำ',
          hist.length ? 'ผลล่าสุด ' + pct(hist[0].score, hist[0].total) + '% (' + dateTh(hist[0].at) + ')' : null,
          btn(examRunning() ? 'กลับไปสอบ' : 'เริ่มสอบจำลอง', 'exam.html', rec === 4), { recommended: rec === 4, done: hist.length > 0 })
      )
    );
  }

  function learnPanel() {
    const prog = lessonProgress();
    const last = placementLast();
    const focus = focusLevel();
    const levels = [...new Set(D.lessons.map((l) => l.level))];
    let no = 0;
    return h('div', {},
      h('h1', { class: 'page-title', text: 'บทเรียนไวยากรณ์' }),
      h('p', { class: 'tab-intro', text: 'เลือกบทที่ต้องการ อ่านคำอธิบาย ดูตัวอย่าง แล้วทำแบบฝึกหัดท้ายบท · เรียนแล้ว ' + lessonsDone() + '/' + D.lessons.length + ' บท' }),
      last && h('p', { class: 'card-meta', style: { marginTop: '-12px', marginBottom: '20px' }, text: focus ? 'จากผลวัดระดับ (' + levelName(last.level) + ') แนะนำให้เริ่มที่บทระดับ ' + focus : 'คุณผ่านทุกระดับในการวัดระดับแล้ว เรียนทบทวนบทไหนก็ได้' }),
      levels.map((lv) => [
        h('h2', { class: 'level-title' }, (LEVEL_NAMES[lv] || [lv])[0], h('span', { class: 'meta', text: (LEVEL_NAMES[lv] || ['', ''])[1] })),
        h('ul', { class: 'lesson-list' }, D.lessons.filter((l) => l.level === lv).map((l) => {
          no++;
          const p = prog[l.id];
          const done = p && p.done;
          return h('li', {}, h('a', { class: 'lesson-link', href: 'learn.html#' + l.id },
            h('span', { class: 'lesson-no', text: String(no).padStart(2, '0') }),
            h('span', { class: 'lesson-name' }, l.title + ' ', h('span', { class: 'light', text: l.en })),
            h('span', { class: 'lesson-state' + (done ? ' done' : ''), text: done ? '✓ ' + p.score + '/' + p.total : lockedFor('lesson:' + l.level) ? 'สมาชิก' : l.level === focus ? 'แนะนำ' : '' }),
            h('span', { class: 'lesson-sub', text: l.minutes + ' นาที · แบบฝึกหัด ' + l.exercises.length + ' ข้อ' })));
        })),
      ]),
      h('h2', { class: 'level-title' }, 'ตารางอ้างอิง', h('span', { class: 'meta', text: 'เปิดดูได้ตลอด' })),
      h('ul', { class: 'lesson-list' },
        h('li', {}, h('a', { class: 'lesson-link', href: 'tenses.html' },
          h('span', { class: 'lesson-no', text: '12' }),
          h('span', { class: 'lesson-name' }, 'สรุป 12 Tenses ', h('span', { class: 'light', text: 'Tense summary' })),
          h('span', { class: 'lesson-state' }),
          h('span', { class: 'lesson-sub', text: 'ตารางสูตร กฎการใช้ และคำบอกเวลา · ในข้อสอบจะมีเส้นโยงชี้ว่าข้อไหนใช้ tense อะไร' }))))
    );
  }

  function practicePanel() {
    return h('div', {},
      h('h1', { class: 'page-title', text: 'ฝึกทำข้อสอบ' }),
      h('p', { class: 'tab-intro', text: 'เลือกชุดข้อสอบที่ต้องการ ตอบแล้วเห็นเฉลยพร้อมคำอธิบายทันที ข้อที่ตอบผิดจะถูกเก็บไว้ให้ทบทวนภายหลัง' }),
      h('div', { class: 'cards' }, PRACTICE.map((p) => {
        const info = practiceInfo(p.id);
        const locked = lockedFor('practice:' + p.id);
        return h('article', { class: 'card acc acc-' + p.id },
          h('div', { class: 'card-head' },
            h('h2', { class: 'card-title' }, p.title + ' ', h('span', { class: 'light', text: p.thai })),
            locked ? h('span', { class: 'rec-tag', text: 'สมาชิก' }) : freeTag('practice:' + p.id)),
          h('p', { class: 'card-desc', text: p.desc }),
          h('p', { class: 'card-meta', text: info.meta.join(' · ') }),
          info.resume && h('p', { class: 'card-meta', text: 'ค้างอยู่: ' + info.resume }),
          h('div', { class: 'card-actions' }, locked ? accBtn('ปลดล็อกด้วยสมาชิก', 'pricing.html?need=practice:' + p.id) : accBtn(info.cta, p.href)));
      })));
  }

  function testPanel() {
    const last = placementLast();
    const hist = examHistory();
    const running = examRunning();
    return h('div', {},
      h('h1', { class: 'page-title', text: 'ทดสอบ' }),
      h('p', { class: 'tab-intro', text: 'ไม่แน่ใจว่าจะเริ่มตรงไหน ให้ทดสอบระดับก่อน แล้วค่อยซ้อมสอบจริงเมื่อฝึกมาพอสมควร' }),
      h('div', { class: 'stack' },
        h('article', { class: 'card acc acc-placement' },
          h('div', { class: 'card-head' }, h('h2', { class: 'card-title' }, 'ทดสอบระดับ ', h('span', { class: 'light', text: 'Placement test' })), freeTag('placement')),
          h('p', { class: 'card-desc', text: 'รู้ว่าตอนนี้ภาษาอังกฤษของคุณอยู่ระดับ A1, A2, B1 หรือ B2 ใช้เวลาประมาณ 15 นาที ได้ผลพร้อมคำแนะนำบทเรียนที่ควรเรียนต่อ' }),
          h('p', { class: 'card-meta', text: ['ปรับความยากอัตโนมัติ · ประมาณ 20–25 ข้อ', last && 'ผลล่าสุด: ' + levelName(last.level) + ' (' + dateTh(last.at) + ')'].filter(Boolean).join(' · ') }),
          h('div', { class: 'card-actions' }, accBtn(placementRunning() ? 'ทำต่อ' : last ? 'ทำอีกครั้ง' : 'เริ่มทดสอบ', 'placement.html'))),
        h('article', { class: 'card acc acc-exam' },
          h('div', { class: 'card-head' }, h('h2', { class: 'card-title' }, 'สอบจำลอง ', h('span', { class: 'light', text: 'Mock exam' })), lockedFor('exam') && h('span', { class: 'rec-tag', text: 'สมาชิก' })),
          h('p', { class: 'card-desc', text: 'ซ้อมสอบตามกติกาของ EF SET: จับเวลาแยกส่วน ย้อนกลับไม่ได้ ไม่มีเฉลยระหว่างทำ และปิดระบบแปลไว้เหมือนข้อสอบจริง หรือเลือกแบบยืดหยุ่นที่ข้ามไปมาได้ ส่งแล้วจึงเห็นคะแนนและเฉลยทุกข้อ' }),
          h('p', { class: 'card-meta', text: ['แบบ EF SET ' + examMinutes() + ' นาที · แบบยืดหยุ่น ' + D.exam.profiles[1].sections[0].minutes + ' นาที', hist.length && 'ผลล่าสุด ' + pct(hist[0].score, hist[0].total) + '% (' + dateTh(hist[0].at) + ')', running && 'กำลังสอบอยู่ · ' + examLeft(running)].filter(Boolean).join(' · ') }),
          h('div', { class: 'card-actions' }, accBtn(running ? 'กลับไปสอบ' : lockedFor('exam') ? 'ปลดล็อกด้วยสมาชิก' : 'เลือกรูปแบบและเริ่มสอบ', lockedFor('exam') && !running ? 'pricing.html?need=exam' : 'exam.html')))
      ));
  }

  // ---------- Tabs ----------
  const panels = {};
  function build() {
    panels.home = h('section', { class: 'tab-panel', id: 'tab-home' }, homePanel());
    panels.learn = h('section', { class: 'tab-panel', id: 'tab-learn' }, learnPanel());
    panels.practice = h('section', { class: 'tab-panel', id: 'tab-practice' }, practicePanel());
    panels.test = h('section', { class: 'tab-panel', id: 'tab-test' }, testPanel());
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
