// Mock exam. Formats come from CEFR_DATA.exam.profiles (assets/data/exam.js):
//   • "EF SET" style  — separately timed sections, no going back, no feedback while answering
//   • "flexible"      — one timer, free navigation, flag questions for review
// Time running out ends the current section automatically; the last section submits the exam.
(function () {
  'use strict';

  const { store, shuffle, pct, h, rich, confirmDialog, dialogOpen } = window.CEFR;

  const D = window.CEFR_DATA;
  const cfg = D.exam;
  const root = document.getElementById('app');
  const trToggle = document.querySelector('[data-translate-toggle]');
  const helpOn = () => store.get('translate:test', false) === true;   // click-to-translate on the question while testing (off by default)

  const K = { state: 'exam:state', history: 'exam:history' };
  const KEYS = '12345';
  const SUPPORTED = ['mcq', 'cloze'];            // other part types (e.g. listening): see README
  const EF_URL = 'https://www.efset.org/';

  // Keep only the parts this engine can run; a section is "active" when it has parts and isn't coming soon.
  const profiles = cfg.profiles.map((p) => ({ ...p, sections: p.sections.map((s) => ({ ...s, parts: s.parts.filter((pt) => SUPPORTED.includes(pt.type)) })) }));
  const profileById = new Map(profiles.map((p) => [p.id, p]));
  const activeSections = (p) => p.sections.filter((s) => s.parts.length > 0 && !s.comingSoon);
  const totalMinutes = (p) => activeSections(p).reduce((sum, s) => sum + s.minutes, 0);

  const mcqCache = {};
  const lookupMcq = (src) => (mcqCache[src] = mcqCache[src] || new Map(D[src].map((q) => [q.n, q])));

  let state = null;            // exam in progress (persisted; restored in init() once its questions have been loaded)
  let introNote = '';          // a message for the start screen (e.g. the questions could not be loaded)
  let submitting = false;
  let finished = null;         // result of the exam just submitted
  let view = 'intro';          // 'intro' | 'exam' | 'result'
  let timerId = 0;
  let filter = 'all';

  // ---------- Question sets from the server ----------
  const setsOf = (profile) => [...new Set(activeSections(profile).flatMap((sec) => sec.parts.map((pt) => pt.source)))];
  const loadSets = (profile) => Promise.all(setsOf(profile).map((src) => window.CEFR.content.load(src)));
  const loadMessage = (e) => (e.status === 401 || e.status === 402 ? 'สอบจำลองสำหรับสมาชิก — เข้าสู่ระบบหรือเลือกแพ็กเกจก่อน'
    : e.status === 429 ? 'โหลดบ่อยเกินไป รอสักครู่แล้วลองใหม่' : 'โหลดข้อสอบไม่สำเร็จ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่');

  // The answers are not in the page. When the exam is submitted the server grades every pick and sends the right answer,
  // the explanation and (for members) the sentence mark-up; they are written onto the question objects so the
  // scoring and the review below work as before.
  async function gradeAll() {
    const mcq = state.items.filter((it) => it.kind === 'mcq');
    const cloze = state.items.filter((it) => it.kind === 'cloze');
    const d = await window.CEFR.content.post({
      op: 'exam',
      items: mcq.map((it) => ({ src: it.src, n: it.n, pick: it.pick })),
      cloze: cloze.map((it) => ({ idx: it.idx, picks: it.picks })),
    });
    for (const it of mcq) {
      const r = d.results[it.src + ':' + it.n];
      const q = questionOf(it);
      if (!r) throw new Error('bad_answer');
      q.a = r.a;
      q.e = r.e;
      window.CEFR.content.setClue(it.src, it.n, r.clue);
    }
    for (const it of cloze) {
      const blanks = d.cloze[it.idx];
      if (!blanks) throw new Error('bad_answer');
      passageOf(it).blanks.forEach((b, i) => { b.a = blanks[i].a; b.e = blanks[i].e; });
    }
  }

  // ---------- Items ----------
  const questionOf = (it) => lookupMcq(it.src).get(it.n);
  const passageOf = (it) => D.cloze[it.idx];
  const pointsOf = (it) => (it.kind === 'mcq' ? 1 : passageOf(it).blanks.length);
  const unitsAnswered = (it) => (it.kind === 'mcq' ? (it.pick !== null ? 1 : 0) : it.picks.filter((p) => p !== null).length);
  const earnedOf = (it) => (it.kind === 'mcq'
    ? (it.pick === questionOf(it).a ? 1 : 0)
    : passageOf(it).blanks.reduce((s, b, i) => s + (it.picks[i] === b.a ? 1 : 0), 0));
  const totalPoints = (items) => items.reduce((s, it) => s + pointsOf(it), 0);

  function buildItems(profile) {
    const items = [];
    for (const sec of activeSections(profile)) {
      for (const part of sec.parts) {
        if (part.type === 'mcq') {
          shuffle(D[part.source]).slice(0, part.count).forEach((q) => {
            items.push({ sec: sec.id, part: part.id, kind: 'mcq', src: part.source, n: q.n, order: shuffle(q.c.map((_, i) => i)), pick: null, flag: false });
          });
        } else {
          shuffle(D.cloze.map((_, i) => i)).slice(0, part.count).forEach((idx) => {
            const blanks = D.cloze[idx].blanks;
            items.push({
              sec: sec.id, part: part.id, kind: 'cloze', idx,
              orders: blanks.map((b) => shuffle(b.c.map((_, i) => i))),
              picks: blanks.map(() => null),
              flag: false,
            });
          });
        }
      }
    }
    return items;
  }

  function loadState() {
    const s = store.get(K.state, null);
    const profile = s && profileById.get(s.profile);
    if (!s || s.v !== 2 || !profile || !Array.isArray(s.items) || !s.items.length || !(s.secEndsAt > 0)) return null;
    const secs = activeSections(profile);
    const ok = s.items.every((it) => {
      if (!secs.some((x) => x.id === it.sec)) return false;
      if (it.kind === 'mcq') return D[it.src] && lookupMcq(it.src).has(it.n);
      return it.kind === 'cloze' && D.cloze[it.idx] && Array.isArray(it.picks) && it.picks.length === D.cloze[it.idx].blanks.length;
    });
    if (!ok || !(s.secIndex >= 0 && s.secIndex < secs.length) || !(s.index >= 0 && s.index < s.items.length)) {
      store.remove(K.state);
      return null;
    }
    return s;
  }

  // ---------- State helpers ----------
  const save = () => store.set(K.state, state);
  const prof = () => profileById.get(state.profile);
  const secs = () => activeSections(prof());
  const curSec = () => secs()[state.secIndex];
  const itemsOfSec = (secId) => state.items.filter((it) => it.sec === secId);
  const remaining = () => Math.max(0, state.secEndsAt - Date.now());
  const partTitle = (profile, secId, partId) => {
    const sec = profile.sections.find((s) => s.id === secId);
    return (sec && sec.parts.find((p) => p.id === partId) || {}).title || partId;
  };

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

  const locked = () => Boolean(window.CEFR.pass && !window.CEFR.pass.allows('exam'));

  // ---------- Flow ----------
  async function start(profileId) {
    if (window.CEFR.pass && !window.CEFR.pass.allows('exam')) { location.href = 'pricing.html?need=exam'; return; }
    if (state) {
      const ok = await confirmDialog('มีการสอบที่ยังไม่ได้ส่ง ต้องการละทิ้งและเริ่มสอบใหม่หรือไม่?', {
        okText: 'เริ่มสอบใหม่', cancelText: 'ยกเลิก', danger: true,
      });
      if (!ok) return;
    }
    const profile = profileById.get(profileId);
    try {
      await loadSets(profile);
    } catch (e) {
      introNote = loadMessage(e);
      view = 'intro';
      render();
      return;
    }
    introNote = '';
    const now = Date.now();
    state = {
      v: 2, profile: profileId, secIndex: 0, startedAt: now, secStartedAt: now,
      secEndsAt: now + activeSections(profile)[0].minutes * 60000,
      between: false, secLog: [], items: buildItems(profile), index: 0,
    };
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
    if (!state || state.between) return;
    const ms = remaining();
    const el = document.getElementById('exam-timer');
    if (el) {
      el.textContent = fmtClock(ms);
      el.classList.toggle('low', ms <= 5 * 60000);
    }
    if (ms <= 0) endSection(true);
  }

  function endSection(auto) {
    const sec = curSec();
    const now = Date.now();
    if (!state.secLog.some((l) => l.id === sec.id)) state.secLog.push({ id: sec.id, usedMs: Math.min(now, state.secEndsAt) - state.secStartedAt, auto: !!auto });
    if (state.secIndex < secs().length - 1) {
      state.secIndex++;
      state.between = true;
      save();
      render();
      window.scrollTo(0, 0);
    } else {
      submit(auto);
    }
  }

  function startNextSection() {
    const sec = curSec();
    const now = Date.now();
    state.between = false;
    state.secStartedAt = now;
    state.secEndsAt = now + sec.minutes * 60000;
    state.index = state.items.findIndex((it) => it.sec === sec.id);
    save();
    render();
    window.scrollTo(0, 0);
  }

  async function askEndSection() {
    const sec = curSec();
    const last = state.secIndex === secs().length - 1;
    let msg;
    if (prof().oneWay) {
      msg = last
        ? 'ส่งข้อสอบ? หลังจากนี้ย้อนกลับมาแก้ไขไม่ได้'
        : 'จบส่วน ' + sec.title + '? ย้อนกลับมาแก้ไขไม่ได้ และเวลาของส่วนถัดไปจะเริ่มนับเมื่อคุณกดเริ่ม';
    } else {
      const its = itemsOfSec(sec.id);
      const left = its.reduce((s, it) => s + pointsOf(it) - unitsAnswered(it), 0);
      const flagged = its.filter((it) => it.flag).length;
      msg = 'ส่งข้อสอบตอนนี้? ' + (left ? 'ยังไม่ได้ตอบ ' + left + ' ข้อ' : 'ตอบครบทุกข้อแล้ว') + (flagged ? ' · ทำเครื่องหมายไว้ ' + flagged + ' ข้อ' : '') + ' เมื่อส่งแล้วแก้ไขไม่ได้';
    }
    if (await confirmDialog(msg, { okText: last ? 'ส่งข้อสอบ' : 'จบส่วนนี้', cancelText: 'กลับไปทำต่อ' })) endSection(false);
  }

  async function submit(auto) {
    if (!state || submitting) return;
    submitting = true;
    clearInterval(timerId);
    window.removeEventListener('beforeunload', warnLeave);
    setView(h('p', { class: 'meta', text: 'กำลังตรวจคำตอบ…' }));
    for (;;) {
      try {
        await gradeAll();
        break;
      } catch (e) {
        // the answers are saved on this device, so nothing is lost: try again or come back later
        const again = await confirmDialog(loadMessage(e) + ' — คำตอบของคุณยังอยู่ในเครื่องนี้ ลองส่งอีกครั้งหรือไม่?', { okText: 'ลองอีกครั้ง', cancelText: 'ไว้ทีหลัง' });
        if (!again) { submitting = false; goIntro(); return; }
      }
    }
    submitting = false;
    const profile = prof();
    const now = Date.now();
    const sections = activeSections(profile).map((sec) => {
      const its = state.items.filter((it) => it.sec === sec.id);
      const log = state.secLog.find((l) => l.id === sec.id) || { usedMs: 0, auto: false };
      return {
        id: sec.id, title: sec.title, minutes: sec.minutes, usedMs: log.usedMs, auto: log.auto,
        score: its.reduce((s, it) => s + earnedOf(it), 0), total: totalPoints(its),
        parts: sec.parts.map((p) => {
          const pi = its.filter((it) => it.part === p.id);
          return { id: p.id, title: p.title, score: pi.reduce((s, it) => s + earnedOf(it), 0), total: totalPoints(pi) };
        }),
      };
    });
    const score = sections.reduce((s, x) => s + x.score, 0);
    const total = sections.reduce((s, x) => s + x.total, 0);
    const usedMs = sections.reduce((s, x) => s + x.usedMs, 0);
    finished = { profile, items: state.items, sections, score, total, usedMs, auto: sections.some((x) => x.auto) || !!auto, at: now };

    const history = store.get(K.history, []);
    history.unshift({ at: now, profile: profile.id, title: profile.title, score, total, usedMs, auto: finished.auto });
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
    if (i < 0 || i >= state.items.length || state.items[i].sec !== curSec().id) return;
    state.index = i;
    save();
    renderExam();
    window.scrollTo(0, 0);
  }

  const canAdvance = (it) => !prof().oneWay || unitsAnswered(it) === pointsOf(it);

  function next() {
    const it = state.items[state.index];
    if (!canAdvance(it)) return;
    const its = itemsOfSec(curSec().id);
    if (it === its[its.length - 1]) askEndSection(); else go(state.index + 1);
  }

  function pickMcq(displayIdx) {
    const it = state.items[state.index];
    if (it.kind !== 'mcq' || displayIdx >= it.order.length) return;
    const orig = it.order[displayIdx];
    it.pick = !prof().oneWay && it.pick === orig ? null : orig;   // flexible mode: click again to un-answer
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
    if (view === 'exam' && state) { if (state.between) renderBetween(); else renderExam(); }
    else if (view === 'result' && finished) renderResult();
    else { view = 'intro'; renderIntro(); }
  }

  function profileCard(p) {
    const parts = activeSections(p).flatMap((s) => s.parts)
      .map((pt) => pt.title.replace(/^Part \d · /, '') + ' ' + pt.count + (pt.type === 'cloze' ? ' บทความ' : ' ข้อ'));
    const minutes = totalMinutes(p);
    return h('article', { class: 'card' },
      h('div', { class: 'card-head' }, h('h2', { class: 'card-title', text: p.title }), p.tag && h('span', { class: 'rec-tag', text: p.tag })),
      h('p', { class: 'card-desc', text: p.desc }),
      h('ul', { class: 'sec-list' }, p.sections.map((s) => {
        const soon = s.comingSoon || !s.parts.length;
        return h('li', { class: soon ? 'soon' : '' }, h('span', { text: s.title }), h('span', { text: soon ? 'เร็วๆ นี้ · ' + s.minutes + ' นาที' : s.minutes + ' นาที' }));
      })),
      h('p', { class: 'card-meta', text: 'รวม ' + minutes + ' นาที · ' + parts.join(' · ') }),
      h('div', { class: 'card-actions' }, h('button', { class: 'btn', type: 'button', text: locked() ? 'ปลดล็อกด้วยสมาชิก' : 'เริ่มสอบ ' + p.title, onclick: () => start(p.id) })));
  }

  function rulesBox() {
    return h('section', { class: 'rules-box' },
      h('h2', { class: 'section-title', text: 'กติกาและเวลา — อ้างอิง EF SET' }),
      h('p', { class: 'card-meta', style: { margin: '0 0 6px' }, text: 'ตามข้อมูลจากหน้าทางการของ EF SET (efset.org, ef.com)' }),
      h('ul', { class: 'rules' },
        h('li', { text: 'EF SET ชุด 50 นาที แบ่งเป็น Reading 25 นาที และ Listening 25 นาที แต่ละส่วนมีนาฬิกาของตัวเอง' }),
        h('li', { text: 'แต่ละข้อหรือแต่ละบทไม่จำกัดเวลา จับเวลาเฉพาะทั้งส่วน' }),
        h('li', { text: 'ย้อนกลับไปข้อก่อนหน้าไม่ได้ ต้องทำแต่ละบทให้เสร็จก่อนไปต่อ' }),
        h('li', { text: 'Listening ฟังได้ 2 รอบต่อไฟล์เสียง (ส่วนนี้ของเว็บนี้ยังไม่เปิด)' }),
        h('li', { text: 'ควรหาที่เงียบและทำให้จบในครั้งเดียว' }),
        h('li', { text: 'คะแนน 0–100 เทียบกับระดับ CEFR (ตารางด้านล่าง)' })),
      h('details', { class: 'band-details' },
        h('summary', { text: 'ตารางเทียบคะแนน EF SET กับ CEFR' }),
        h('table', { class: 'table' },
          h('thead', {}, h('tr', {}, h('th', { text: 'CEFR' }), h('th', { text: 'ระดับ' }), h('th', { text: 'คะแนน EF SET' }))),
          h('tbody', {}, cfg.bands.map((b) => h('tr', {}, b.map((c) => h('td', { text: c }))))))),
      h('p', { class: 'card-meta', style: { margin: '20px 0 6px' }, text: 'ที่เว็บนี้ต่างจาก EF SET' }),
      h('ul', { class: 'rules' },
        h('li', { text: 'EF SET ปรับความยากตามคำตอบของคุณ (adaptive) แต่สอบจำลองที่นี่เป็นข้อสอบชุดคงที่ (แบบปรับความยากอยู่ที่หน้าทดสอบระดับ)' }),
        h('li', { text: 'เนื้อหาเน้นไวยากรณ์และคำศัพท์ระดับ A1–B1 ไม่ใช่ข้อสอบของ EF' }),
        h('li', { text: 'แบบ EF SET ต้องตอบก่อนไปข้อถัดไป (ข้อกำหนดของเว็บนี้)' }),
        h('li', { text: 'คะแนนที่แสดงเป็นเปอร์เซ็นต์ของข้อสอบชุดนี้ ไม่ใช่คะแนน EF SET จึงไม่แปลงเป็นระดับ CEFR ให้ — ดูระดับของคุณได้ที่หน้าทดสอบระดับ' }),
        h('li', { text: 'EF SET ยังมีชุด 4 ทักษะ 90 นาที (รวมเขียนและพูด) ซึ่งเว็บนี้ไม่ได้จำลอง' })),
      h('p', { class: 'fine-print' }, 'ต้องการผลอย่างเป็นทางการ ลองทำข้อสอบจริงฟรีได้ที่ ',
        h('a', { href: EF_URL, target: '_blank', rel: 'noopener noreferrer', text: 'efset.org' }), ' (เว็บนี้ไม่เกี่ยวข้องกับ EF)'));
  }

  function renderIntro() {
    const history = store.get(K.history, []);
    const sec = state && !state.between ? curSec() : null;
    setView(
      state && h('div', { class: 'resume' },
        h('p', { text: state.between
          ? 'มีการสอบที่ค้างอยู่ — รอเริ่มส่วน ' + curSec().title
          : 'มีการสอบที่ยังไม่ได้ส่ง (' + prof().title + ' · ' + sec.title + ') — เหลือเวลา ' + fmtClock(remaining()) }),
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn', type: 'button', text: 'กลับไปสอบต่อ', onclick: () => { if (!state.between && remaining() <= 0) endSection(true); else enterExam(); } }),
          h('button', { class: 'btn btn-outline', type: 'button', text: 'ละทิ้ง', onclick: discard }))
      ),
      introNote && h('p', { class: 'meta', role: 'alert', text: introNote }),
      h('p', { class: 'lead', text: 'ซ้อมสอบแบบจับเวลา ไม่มีเฉลยระหว่างทำ และปิดระบบแปลไว้เหมือนข้อสอบจริง (เปิด "ช่วยแปลโจทย์" เองได้ใต้ข้อ) ส่งแล้วจึงเห็นคะแนนและเฉลยทุกข้อ เลือกรูปแบบที่ต้องการ' }),
      h('div', { class: 'stack' }, profiles.map(profileCard)),
      rulesBox(),
      history.length > 0 && h('div', { class: 'review' },
        h('h3', { text: 'ผลการสอบครั้งก่อน' }),
        h('ul', { class: 'history' }, history.slice(0, 5).map((r) => h('li', {},
          h('span', { text: fmtDate(r.at) + (r.title ? ' · ' + r.title : '') }),
          h('span', { text: r.score + '/' + r.total + ' (' + pct(r.score, r.total) + '%)' }),
          h('span', { class: 'meta', text: 'ใช้เวลา ' + fmtClock(r.usedMs) + (r.auto ? ' · หมดเวลา' : '') })))))
    );
  }

  function renderBetween() {
    const done = state.secLog[state.secLog.length - 1];
    const sec = curSec();
    const prevSec = secs()[state.secIndex - 1];
    setView(
      h('section', { class: 'panel' },
        h('p', { class: 'eyebrow', text: 'จบส่วน ' + prevSec.title }),
        h('div', { class: 'score', text: fmtClock(done.usedMs) }),
        h('p', { class: 'score-sub', text: 'เวลาที่ใช้ในส่วน ' + prevSec.title + (done.auto ? ' (หมดเวลา)' : '') }),
        h('p', { text: 'ส่วนถัดไป: ' + sec.title + ' — ' + sec.minutes + ' นาที เวลาจะเริ่มนับเมื่อคุณกดปุ่มด้านล่าง' }),
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn', type: 'button', text: 'เริ่มส่วน ' + sec.title, onclick: startNextSection }))
      )
    );
  }

  function navigator() {
    const sec = curSec();
    return h('div', { class: 'navigator' },
      sec.parts.map((p) => {
        const idxs = state.items.map((it, i) => (it.sec === sec.id && it.part === p.id ? i : -1)).filter((i) => i >= 0);
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
    const profile = prof();
    const oneWay = profile.oneWay;
    const sec = curSec();
    const it = state.items[state.index];
    const its = itemsOfSec(sec.id);
    const pos = its.indexOf(it) + 1;
    const inPart = its.filter((x) => x.part === it.part);
    const answered = its.reduce((s, x) => s + unitsAnswered(x), 0);
    const total = totalPoints(its);
    const isLast = it === its[its.length - 1];
    const ptitle = partTitle(profile, sec.id, it.part);

    let body;
    if (it.kind === 'mcq') {
      const q = questionOf(it);
      body = [
        h('p', { class: 'question', 'data-tr': helpOn() ? true : null, text: q.q }),
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

    const status = h('span', { class: 'meta', text: 'ตอบแล้ว ' + answered + '/' + total });
    const nextBtn = h('button', {
      class: 'btn',
      type: 'button',
      disabled: !canAdvance(it),
      text: isLast ? (oneWay ? (state.secIndex === secs().length - 1 ? 'ส่งข้อสอบ' : 'จบส่วน ' + sec.title) : 'ตรวจทานก่อนส่ง') : 'ถัดไป →',
      onclick: next,
    });
    function updateBar() {
      const a = its.reduce((s, x) => s + unitsAnswered(x), 0);
      status.textContent = 'ตอบแล้ว ' + a + '/' + total;
      nextBtn.disabled = !canAdvance(it);
    }

    setView(
      h('div', { class: 'exam-bar' },
        h('div', { class: 'exam-timebox' },
          h('span', { class: 'exam-timer' + (remaining() <= 5 * 60000 ? ' low' : ''), id: 'exam-timer', role: 'timer', 'aria-label': 'เวลาที่เหลือของส่วนนี้', text: fmtClock(remaining()) }),
          h('span', { class: 'exam-sec', text: profile.sections.length > 1 ? sec.title + ' · ' + sec.minutes + ' นาที' : profile.title })),
        status,
        !oneWay && h('button', { class: 'btn btn-sm btn-outline', type: 'button', text: 'ส่งข้อสอบ', onclick: askEndSection })
      ),
      h('section', { class: 'panel' },
        oneWay && h('div', { class: 'progress', role: 'progressbar', 'aria-label': 'ความคืบหน้าของส่วนนี้', 'aria-valuemin': '0', 'aria-valuemax': String(its.length), 'aria-valuenow': String(pos - 1) },
          h('div', { class: 'progress-fill', style: { width: pct(pos - 1, its.length) + '%' } })),
        h('div', { class: 'top-bar' },
          h('span', { text: oneWay
            ? ptitle + ' · ข้อ ' + pos + '/' + its.length
            : ptitle + ' · ' + (it.kind === 'cloze' ? 'บทความ ' : 'ข้อ ') + (inPart.indexOf(it) + 1) + '/' + inPart.length }),
          it.flag && h('span', { text: 'ทำเครื่องหมายไว้' })),
        body,
        oneWay
          ? h('div', { class: 'exam-actions' }, nextBtn)
          : h('div', { class: 'exam-actions' },
            h('button', { class: 'btn btn-outline', type: 'button', text: '← ก่อนหน้า', disabled: state.index === state.items.findIndex((x) => x.sec === sec.id), onclick: () => go(state.index - 1) }),
            nextBtn),
        !oneWay && h('div', { class: 'btn-row exam-tools' },
          h('button', { class: 'btn btn-ghost btn-sm', type: 'button', 'aria-pressed': String(it.flag), text: it.flag ? 'ยกเลิกเครื่องหมาย' : 'ทำเครื่องหมายไว้ทบทวน', onclick: toggleFlag }),
          h('button', { class: 'btn btn-ghost btn-sm', type: 'button', text: 'ล้างคำตอบ', onclick: clearAnswer })),
        oneWay && !canAdvance(it) && h('p', { class: 'fine-print', text: 'ต้องตอบให้ครบก่อนไปข้อถัดไป และย้อนกลับมาแก้ไม่ได้' }),
        it.kind === 'mcq' && h('div', { class: 'quiz-footer' },
          h('button', { class: 'btn btn-ghost btn-sm', type: 'button', 'aria-pressed': String(helpOn()), text: 'ช่วยแปลโจทย์: ' + (helpOn() ? 'เปิด' : 'ปิด'),
            onclick: () => { store.set('translate:test', !helpOn()); renderExam(); } }))
      ),
      !oneWay && h('details', { class: 'nav-details', open: true },
        h('summary', { text: 'รายการข้อทั้งหมด' }),
        navigator()),
      h('p', { class: 'fine-print', text: oneWay
        ? 'คีย์ลัด: 1–' + (it.kind === 'mcq' ? it.order.length : 5) + ' เลือกคำตอบ · Enter ไปข้อถัดไป'
        : 'คีย์ลัด: 1–' + (it.kind === 'mcq' ? it.order.length : 5) + ' เลือกคำตอบ · ลูกศรซ้าย/ขวา ย้ายข้อ' })
    );
  }

  function renderResult() {
    const f = finished;
    const p = pct(f.score, f.total);
    const multi = f.sections.length > 1;

    const rows = f.sections.flatMap((s) => s.parts.map((bp) => h('li', { class: 'stage-row part' },
      h('span', { class: 'stage-lv', text: multi ? s.title + ' · ' + bp.title : bp.title }),
      h('span', { class: 'bar' }, h('span', { class: 'bar-fill', style: { width: pct(bp.score, bp.total) + '%' } })),
      h('span', { class: 'stage-score', text: bp.score + '/' + bp.total }))));

    const FILTERS = [
      ['all', 'ทั้งหมด', () => true],
      ['wrong', 'ที่ตอบผิด', (it) => earnedOf(it) < pointsOf(it)],
      ['skipped', 'ที่ไม่ได้ตอบ', (it) => unitsAnswered(it) < pointsOf(it)],
      ['flagged', 'ที่ทำเครื่องหมาย', (it) => it.flag],
    ].filter(([k]) => k !== 'flagged' || f.items.some((it) => it.flag));
    const active = FILTERS.find(([k]) => k === filter) || FILTERS[0];
    const shown = f.items.filter(active[2]);

    const chips = h('div', { class: 'chips' }, FILTERS.map(([k, label, fn]) => h('button', {
      class: 'chip',
      type: 'button',
      'aria-pressed': String(filter === k),
      text: label + ' (' + f.items.filter(fn).length + ')',
      onclick: () => { filter = k; renderResult(); },
    })));

    const list = shown.map((it) => {
      const tag = multi ? f.sections.find((s) => s.id === it.sec).title : '';
      if (it.kind === 'mcq') {
        const q = questionOf(it);
        return h('div', { class: 'review-item' },
          h('p', { class: 'review-q', 'data-tr': true, text: (tag ? tag + ' · ' : '') + partTitle(f.profile, it.sec, it.part).replace(/^Part \d · /, '') + ' ข้อ ' + q.n + ': ' + q.q }),
          it.pick === null
            ? h('p', { class: 'meta', text: 'ไม่ได้ตอบ' })
            : h('p', { class: it.pick === q.a ? 'review-right' : 'review-you', text: (it.pick === q.a ? '✓ ' : '✗ ') + 'คุณตอบ: ' + q.c[it.pick] }),
          it.pick !== q.a && h('p', { class: 'review-right', text: '✓ เฉลย: ' + q.c[q.a] }),
          h('p', { class: 'review-expl', 'data-tr': true }, rich(q.e)),
          window.CEFR.markup && window.CEFR.markup.block({ bank: it.src, key: q.n, q: q.q, answer: q.c[q.a] }));
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
        h('h2', { text: 'ผลการสอบจำลอง · ' + f.profile.title }),
        h('div', { class: 'score', text: f.score + ' / ' + f.total }),
        h('p', { class: 'score-sub', text: p + '% · ใช้เวลา ' + fmtClock(f.usedMs) + (f.auto ? ' · มีส่วนที่หมดเวลา ระบบส่งให้อัตโนมัติ' : '') }),
        h('ul', { class: 'stage-rows' }, rows),
        multi && h('p', { class: 'card-meta', text: f.sections.map((s) => s.title + ' ใช้เวลา ' + fmtClock(s.usedMs) + ' จาก ' + s.minutes + ':00').join(' · ') }),
        h('p', { class: 'fine-print', text: 'คะแนนข้างบนเป็นเปอร์เซ็นต์ของข้อสอบชุดนี้ ไม่ใช่คะแนน EF SET (0–100) และไม่แปลงเป็นระดับ CEFR — ดูระดับของคุณที่หน้าทดสอบระดับ' }),
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn', type: 'button', text: 'สอบใหม่อีกครั้ง', onclick: () => start(f.profile.id) }),
          h('button', { class: 'btn btn-outline', type: 'button', text: 'กลับหน้าเลือกรูปแบบ', onclick: goIntro })),
        h('div', { class: 'review' },
          h('h3', { text: 'ทบทวนข้อสอบ' }),
          chips,
          list.length ? list : h('p', { class: 'meta', text: 'ไม่มีข้อในหมวดนี้' }))
      )
    );
  }

  // ---------- Keyboard ----------
  document.addEventListener('keydown', (e) => {
    if (view !== 'exam' || !state || state.between || e.ctrlKey || e.metaKey || e.altKey || dialogOpen()) return;
    if (e.target && /^(SELECT|INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
    const it = state.items[state.index];
    const oneWay = prof().oneWay;
    if (e.key === 'Enter' && oneWay && canAdvance(it)) { e.preventDefault(); next(); return; }
    if (!oneWay && e.key === 'ArrowRight') { go(state.index + 1); return; }
    if (!oneWay && e.key === 'ArrowLeft') { go(state.index - 1); return; }
    const idx = KEYS.indexOf(e.key);
    if (it.kind === 'mcq' && e.key.length === 1 && idx >= 0 && idx < it.order.length) pickMcq(idx);
  });

  // ---------- Init ----------
  async function init() {
    setView(h('p', { class: 'meta', text: 'กำลังโหลด…' }));
    const saved = store.get(K.state, null);
    const savedProfile = saved && profileById.get(saved.profile);
    if (savedProfile) {
      try {
        await loadSets(savedProfile);
        state = loadState();
      } catch (e) {
        introNote = 'โหลดข้อสอบที่ค้างอยู่ไม่สำเร็จ — ' + loadMessage(e);
      }
    }
    if (state && !state.between && remaining() <= 0) { view = 'exam'; endSection(true); }   // time ran out while the tab was closed
    else render();
  }
  init();

  if (window.CEFR.pass) {
    document.addEventListener('cefr:pass', () => {
      if (view === 'intro' && !submitting) render();
    });
  }
})();
