// TOEIC exam room: a full Listening + Reading test the way it is sat, for one of the book sets.   toeic-exam.html?set=1
//
//   Listening  45 min  Parts 1-4  one continuous recording that plays once, Part after Part, no pause, no going back
//   Reading    75 min  Parts 5-7  a countdown, free movement between questions, an answer sheet, flags
//   Result     raw score and an ESTIMATED scaled score (5-495 each, 10-990 total), per-Part table, review of every question
//
// While the test runs nothing in the page knows an answer. When it is submitted the server returns the answers for the picks that were
// made (one call per Part). The run is saved in this browser, so a refresh does not lose the answers or the clock.
(function () {
  'use strict';

  const { h, store, pct, confirmDialog } = window.CEFR;
  const ui = window.CEFR.toeicUi;
  const api = window.CEFR.content;
  const pass = window.CEFR.pass;
  const root = document.getElementById('app');
  const set = Number(new URLSearchParams(location.search).get('set'));

  const KEY = 'toeic:exam:s' + set;
  const HIST = KEY + ':history';
  const SECTION = {
    listening: { title: 'Listening', parts: [1, 2, 3, 4], total: 100, minutes: 45 },
    reading: { title: 'Reading', parts: [5, 6, 7], total: 100, minutes: 75 },
  };
  const DIRECTIONS = {
    1: 'Part 1 · Photographs — ดูภาพแต่ละภาพ ฟังคำบรรยาย 4 ข้อความ (ไม่มีพิมพ์ในหนังสือ) แล้วเลือกข้อความที่ตรงกับภาพที่สุด',
    2: 'Part 2 · Question–Response — ฟังคำถามหรือประโยค 1 ข้อความ และคำตอบ 3 ข้อความ แล้วเลือกคำตอบที่เหมาะสมที่สุด (ตัวเลือกมีแค่ A–C)',
    3: 'Part 3 · Conversations — ฟังบทสนทนา 2–3 คน แล้วตอบคำถามกลุ่มละ 3 ข้อ บางข้อมีกราฟิกประกอบ',
    4: 'Part 4 · Talks — ฟังประกาศหรือบทพูดสั้น แล้วตอบคำถามกลุ่มละ 3 ข้อ บางข้อมีกราฟิกประกอบ',
    5: 'Part 5 · Incomplete Sentences — เลือกคำหรือวลีที่เติมช่องว่างได้ถูกต้องที่สุด',
    6: 'Part 6 · Text Completion — อ่านข้อความ แล้วเลือกคำ วลี หรือประโยคที่เติมช่องว่าง',
    7: 'Part 7 · Reading Comprehension — อ่านข้อความ อีเมล ประกาศ หรือเอกสารหลายชิ้น แล้วตอบคำถาม',
  };

  let run = store.get(KEY, null);          // the test in progress (null = none)
  const parts = {};                        // part number -> payload from the server (questions without answers)
  const partLoads = {};
  let timerId = 0;
  let audio = null;

  const sectionOfPart = (p) => (p <= 4 ? 'listening' : 'reading');
  const questionsOf = (P) => P.items || P.groups.flatMap((g) => g.items);
  const persist = () => store.set(KEY, run);
  const modeParts = () => (run.mode === 'listening' ? [1, 2, 3, 4] : run.mode === 'reading' ? [5, 6, 7] : [1, 2, 3, 4, 5, 6, 7]);

  // ---------- loading ----------
  function loadPart(p, force) {
    if (force) delete partLoads[p];
    if (!partLoads[p]) {
      partLoads[p] = api.call('GET', '/api/toeic?set=' + set + '&part=' + p)
        .then((P) => { parts[p] = P; return P; })
        .catch((e) => { delete partLoads[p]; throw e; });
    }
    return partLoads[p];
  }

  function showError(e, retry) {
    setView('intro');
    if (e.status === 401 || e.status === 402) {
      root.replaceChildren(pass.lockPanel('toeic', {
        title: 'ซ้อมสอบ TOEIC', text: 'ห้องสอบจำลองเปิดให้สมาชิก เลือกแพ็กเกจตั้งแต่ 1 วัน (20 บาท)', freeHref: 'index.html#toeic', freeText: 'กลับไปหน้า TOEIC',
      }));
      const again = () => { document.removeEventListener('cefr:pass', again); retry(); };
      document.addEventListener('cefr:pass', again);
      return;
    }
    const msg = e.code === 'not_invited' ? 'ตอนนี้ชุดข้อสอบนี้เปิดให้เฉพาะผู้ทดสอบที่ได้รับเชิญ (ต้องเข้าสู่ระบบด้วยอีเมลที่ได้รับเชิญ)'
      : e.code === 'not_open' ? 'ชุดข้อสอบนี้ยังไม่เปิดให้ใช้งาน'
        : e.code === 'account_blocked' ? 'บัญชีนี้ถูกระงับการเข้าถึงเนื้อหาสำหรับสมาชิกชั่วคราว'
      : e.code === 'daily_limit' ? 'วันนี้เปิดครบโควตาแล้ว (ได้ไม่เกิน 14 Part ต่างกันต่อวัน ซ้อมสอบเต็มชุดใช้ 7) กลับมาใหม่พรุ่งนี้'
        : e.status === 429 ? 'เปิดบ่อยเกินไป รอสักครู่แล้วลองใหม่'
          : e.status === 503 ? 'ชุดข้อสอบนี้ยังไม่เปิดให้ใช้งาน'
            : e.status === 404 ? 'ไม่พบชุดข้อสอบนี้'
              : 'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่';
    root.replaceChildren(h('section', { class: 'panel' },
      h('p', { class: 'meta', role: 'alert', text: msg }),
      h('div', { class: 'btn-row' },
        e.status !== 503 && e.status !== 404 && h('button', { class: 'btn', type: 'button', text: 'ลองอีกครั้ง', onclick: retry }),
        h('a', { class: 'btn btn-outline', href: 'index.html#toeic', text: 'กลับหน้า TOEIC' }))));
  }

  const setView = (name) => { window.CEFR.setView(name); };
  const stopAll = () => {
    clearInterval(timerId);
    timerId = 0;
    if (audio) { audio.onended = null; audio.onerror = null; audio.onpause = null; audio.pause(); audio.removeAttribute('src'); audio.load(); audio.remove(); audio = null; }
  };

  // ---------- intro ----------
  function intro() {
    stopAll();
    setView('intro');
    const history = store.get(HIST, []);
    const resume = run && run.phase !== 'done' && run.phase !== 'grading';
    const startCard = (mode, title, sub, minutes) => h('li', { class: 'acc-toeic' },
      h('button', { class: 'list-row', type: 'button', onclick: () => start(mode) },
        h('span', { class: 'list-row-main' },
          h('span', { class: 'list-row-title', text: title }),
          h('span', { class: 'list-row-sub', text: sub })),
        h('span', { class: 'list-row-side', text: minutes })));
    const last = history[0];
    root.replaceChildren(
      h('section', { class: 'panel toeic-intro' },
        h('p', { class: 'lead', text: 'จำลองห้องสอบจริง: เสียง Listening เล่นครั้งเดียวต่อเนื่อง ไม่มีปุ่มหยุดหรือย้อน · Reading จับเวลาถอยหลัง · ไม่เห็นเฉลยจนกว่าจะส่ง · คะแนนที่ได้เป็นค่าประมาณ' }),
        h('ul', { class: 'toeic-rules' },
          h('li', { text: 'Listening 100 ข้อ · 45 นาที · Part 1–4 (ฟังได้ครั้งเดียว และย้อนกลับไป Part ก่อนหน้าไม่ได้)' }),
          h('li', { text: 'Reading 100 ข้อ · 75 นาที · Part 5–7 (ข้ามไปมาได้ มีปุ่มทำเครื่องหมายไว้ทบทวน)' }),
          h('li', { text: 'เตรียมหูฟังและที่เงียบๆ ปรับเสียงให้พร้อมก่อนกดเริ่ม · คำตอบและเวลาบันทึกในเครื่องนี้ รีเฟรชหน้าแล้วทำต่อได้' }))),
      resume && h('section', { class: 'panel resume' },
        h('p', { text: 'มีการสอบที่ทำค้างไว้ — ' + (run.phase === 'listening' ? 'อยู่ที่ Listening Part ' + (run.lPart || 1) : run.phase === 'between' ? 'จบ Listening แล้ว รอเริ่ม Reading' : 'อยู่ที่ Reading') + ' · ตอบแล้ว ' + Object.keys(run.picks).length + ' ข้อ' }),
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn', type: 'button', text: 'ทำต่อ', onclick: mount }),
          h('button', { class: 'btn btn-outline', type: 'button', text: 'ทิ้งแล้วเริ่มใหม่', onclick: async () => { if (await confirmDialog('ทิ้งการสอบที่ค้างอยู่?', { okText: 'ทิ้ง', danger: true })) { run = null; store.remove(KEY); intro(); } } }))),
      !resume && h('ul', { class: 'list-rows tiles' },
        startCard('full', 'สอบเต็มชุด', 'Listening แล้วต่อด้วย Reading ทันที เหมือนวันสอบ', '2 ชั่วโมง'),
        startCard('listening', 'เฉพาะ Listening', 'Part 1–4 · 100 ข้อ', '45 นาที'),
        startCard('reading', 'เฉพาะ Reading', 'Part 5–7 · 100 ข้อ', '75 นาที')),
      last && h('section', { class: 'panel' },
        h('h3', { text: 'ผลที่ผ่านมา' }),
        history.slice(0, 5).map((r) => h('p', { class: 'meta', text: new Date(r.at).toLocaleDateString('th-TH') + ' · ' + modeName(r.mode) + ' · ' + scoreLine(r) }))),
      h('div', { class: 'btn-row' }, h('a', { class: 'btn btn-outline', href: 'index.html#toeic', text: '← กลับหน้า TOEIC' })));
  }
  const modeName = (m) => (m === 'listening' ? 'Listening' : m === 'reading' ? 'Reading' : 'เต็มชุด');
  const scoreLine = (r) => [r.L && 'L ' + r.L.right + '/' + r.L.total + ' (~' + r.L.scaled + ')', r.R && 'R ' + r.R.right + '/' + r.R.total + ' (~' + r.R.scaled + ')', r.total && 'รวม ~' + r.total].filter(Boolean).join(' · ');

  function start(mode) {
    run = { v: 1, set, mode, phase: mode === 'reading' ? 'reading' : 'listening', lPart: 1, picks: {}, flags: {}, startedAt: Date.now() };
    if (mode === 'reading') run.readingEndsAt = Date.now() + SECTION.reading.minutes * 60_000;
    persist();
    mount();
  }

  function mount() {
    stopAll();
    if (!run) return intro();
    if (run.phase === 'listening') return listening();
    if (run.phase === 'between') return between();
    if (run.phase === 'reading') return reading();
    if (run.phase === 'done') return result();
    return intro();
  }

  // ---------- Listening ----------
  function listening() {
    setView('exam');
    const bar = h('div', { class: 'progress-fill' });
    const label = h('span', { class: 'toeic-bar-label' });
    const vol = h('input', { type: 'range', min: '0', max: '1', step: '0.05', value: '1', 'aria-label': 'ระดับเสียง', class: 'toeic-vol' });
    const area = h('div', { class: 'toeic-exam-body' });
    const tap = h('button', { class: 'btn toeic-tap', type: 'button', hidden: true, text: 'แตะเพื่อเล่นเสียงต่อ' });
    const head = h('div', { class: 'toeic-exam-bar' },
      h('span', { class: 'toeic-bar-title', text: 'Listening' }), label,
      h('div', { class: 'progress' }, bar), vol);
    root.replaceChildren(head, tap, area);

    audio = new Audio();
    audio.preload = 'auto';
    audio.hidden = true;                                         // no controls: the recording is not pausable, seekable or downloadable from the page
    audio.setAttribute('controlsList', 'nodownload');
    ui.guard(audio);
    document.body.append(audio);
    vol.addEventListener('input', () => { audio.volume = Number(vol.value); });
    let p = run.lPart || 1;
    let P = null;

    const renderPart = () => {
      const cards = new Map();
      const pick = (n, i) => { run.picks[n] = i; persist(); const c = cards.get(n); ui.paint(c, qOf(n), { pick: i }); };
      const qOf = (n) => questionsOf(P).find((q) => q.n === n);
      const make = (q) => { const c = ui.questionCard(q, { part: p, onPick: pick, onPictureFail: () => refreshLinks(p) }); cards.set(q.n, c); ui.paint(c, q, { pick: run.picks[q.n] }); return c.el; };
      const body = P.groups ? P.groups.map((g) => ui.groupBlock(g, p, make, () => refreshLinks(p))) : [h('div', { class: 'toeic-list' }, P.items.map(make))];
      area.replaceChildren(h('p', { class: 'meta toeic-directions', text: DIRECTIONS[p] }), ...body);
      window.scrollTo({ top: 0 });
    };

    const play = async () => {
      try { await audio.play(); tap.hidden = true; } catch { tap.hidden = false; }
    };
    tap.addEventListener('click', play);

    // a link lives ~25 minutes: ask for a fresh one and carry on from the same second
    let refreshing = false;
    async function refreshLinks(part) {
      if (refreshing) return;
      refreshing = true;
      try {
        const fresh = await loadPart(part, true);
        if (part === p && P) {
          const t = audio.currentTime;
          audio.src = fresh.audio.src;
          audio.addEventListener('loadedmetadata', () => { audio.currentTime = t; play(); }, { once: true });
        }
      } catch { /* offline: the clock keeps running, the sound stops */ }
      setTimeout(() => { refreshing = false; }, 4000);
    }

    async function playPart(n) {
      p = n;
      run.lPart = n;
      persist();
      label.textContent = 'Part ' + n + ' · กำลังโหลด…';
      try { P = await loadPart(n, true); } catch (e) { return showError(e, () => { setView('exam'); listening(); }); }
      renderPart();
      audio.src = P.audio.src;
      audio.volume = Number(vol.value);
      audio.onended = () => { if (p < 4) playPart(p + 1); else partsDone(); };
      audio.onerror = () => refreshLinks(p);
      audio.onpause = () => { if (!audio.ended && run && run.phase === 'listening') play(); };           // the recording can not be paused
      audio.ontimeupdate = () => {
        const d = audio.duration || P.audio.sec;
        bar.style.width = Math.min(100, (audio.currentTime / d) * 100) + '%';
        label.textContent = 'Part ' + p + ' · ' + ui.mmss(audio.currentTime) + ' / ' + ui.mmss(d);
      };
      play();
    }

    function partsDone() {
      if (run.mode === 'listening') return submit(true);
      run.phase = 'between';
      persist();
      between();
    }
    playPart(p);
  }

  function between() {
    stopAll();
    setView('intro');
    root.replaceChildren(h('section', { class: 'panel' },
      h('h2', { text: 'จบส่วน Listening' }),
      h('p', { class: 'lead', text: 'ตอบแล้ว ' + countAnswered('listening') + '/100 ข้อ ย้อนกลับมาแก้ไม่ได้แล้ว · พร้อมแล้วกดเริ่ม Reading เวลา 75 นาทีจะเริ่มนับทันที' }),
      h('div', { class: 'btn-row' }, h('button', { class: 'btn', type: 'button', text: 'เริ่ม Reading', onclick: () => { run.phase = 'reading'; run.readingEndsAt = Date.now() + SECTION.reading.minutes * 60_000; persist(); reading(); } }))));
  }
  const countAnswered = (sec) => Object.keys(run.picks).filter((n) => (sec === 'listening' ? Number(n) <= 100 : Number(n) > 100)).length;

  // ---------- Reading ----------
  async function reading() {
    setView('exam');
    root.replaceChildren(h('p', { class: 'meta', text: 'กำลังโหลดข้อสอบ…' }));
    try { await Promise.all([5, 6, 7].map((p) => loadPart(p, true))); } catch (e) { return showError(e, reading); }

    const timer = h('span', { class: 'toeic-timer', role: 'timer' });
    const count = h('span', { class: 'meta' });
    const cards = new Map();
    const pal = new Map();
    const flagged = () => Object.keys(run.flags).length;

    const refreshPalette = () => {
      for (const [n, b] of pal) {
        b.classList.toggle('done', run.picks[n] !== undefined);
        b.classList.toggle('flag', Boolean(run.flags[n]));
      }
      const ans = countAnswered('reading');
      count.textContent = 'ตอบแล้ว ' + ans + '/100' + (flagged() ? ' · ทำเครื่องหมาย ' + flagged() : '');
    };
    const pick = (n, i) => { run.picks[n] = i; persist(); const c = cards.get(n); ui.paint(c, c.q, { pick: i }); refreshPalette(); };
    const flag = (n, btn) => { if (run.flags[n]) delete run.flags[n]; else run.flags[n] = 1; persist(); btn.setAttribute('aria-pressed', String(Boolean(run.flags[n]))); btn.textContent = run.flags[n] ? 'เอาเครื่องหมายออก' : 'ทำเครื่องหมายไว้ทบทวน'; refreshPalette(); };
    const make = (q) => {
      const c = ui.questionCard(q, { part: partOf(q.n), onPick: pick, flag, onPictureFail: () => refreshLinks(partOf(q.n)) });
      c.q = q;
      cards.set(q.n, c);
      ui.paint(c, q, { pick: run.picks[q.n] });
      if (run.flags[q.n]) { c.flagBtn.setAttribute('aria-pressed', 'true'); c.flagBtn.textContent = 'เอาเครื่องหมายออก'; }
      return c.el;
    };

    // pictures whose link expired (a 75-minute test outlives a 25-minute link): fetch fresh links and swap them in by position
    let refreshing = false;
    async function refreshLinks(part) {
      if (refreshing) return;
      refreshing = true;
      try {
        const fresh = await loadPart(part, true);
        const flat = [...(fresh.groups || []).flatMap((g) => [...(g.imgs || []), ...g.items.filter((i) => i.img).map((i) => i.img)])];
        const imgs = [...document.querySelectorAll('[data-part="' + part + '"] img')];
        imgs.forEach((im, k) => { if (flat[k]) im.src = flat[k]; });
      } catch { /* try again on the next failure */ }
      setTimeout(() => { refreshing = false; }, 4000);
    }

    const sections = [5, 6, 7].map((p) => {
      const P = parts[p];
      const body = P.groups ? P.groups.map((g) => ui.groupBlock(g, p, make, () => refreshLinks(p))) : [h('div', { class: 'toeic-list' }, P.items.map(make))];
      return h('section', { class: 'toeic-part', id: 'part' + p, 'data-part': p },
        h('h2', { class: 'toeic-part-title' }, 'Part ' + p + ' ', h('span', { class: 'light', text: ui.PARTS[p].en })),
        h('p', { class: 'meta toeic-directions', text: DIRECTIONS[p] }), ...body);
    });

    const palette = h('div', { class: 'toeic-palette' },
      [5, 6, 7].map((p) => h('div', { class: 'pal-part' },
        h('span', { class: 'meta', text: 'Part ' + p }),
        h('div', { class: 'pal-grid' }, questionsOf(parts[p]).map((q) => {
          const b = h('button', { class: 'pal', type: 'button', text: String(q.n), 'aria-label': 'ไปข้อ ' + q.n, onclick: () => { const el = document.getElementById('q' + q.n); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
          pal.set(q.n, b);
          return b;
        })))));

    const submitBtn = h('button', { class: 'btn btn-sm', type: 'button', text: 'ส่งข้อสอบ', onclick: () => confirmSubmit() });
    const head = h('div', { class: 'toeic-exam-bar' },
      h('span', { class: 'toeic-bar-title', text: 'Reading' }), timer, count, submitBtn);
    root.replaceChildren(head, h('div', { class: 'toeic-exam-layout' }, h('div', { class: 'toeic-exam-main' }, sections),
      h('aside', { class: 'toeic-exam-side' }, h('details', { class: 'toeic-side-box', open: window.innerWidth > 900 }, h('summary', { text: 'กระดาษคำตอบ' }), palette))));
    refreshPalette();
    window.scrollTo({ top: 0 });

    async function confirmSubmit() {
      const un = 100 - countAnswered('reading');
      const ok = await confirmDialog(un ? 'ยังไม่ได้ตอบ ' + un + ' ข้อ ต้องการส่งข้อสอบเลยหรือไม่?' : 'ส่งข้อสอบ?', { okText: 'ส่งข้อสอบ', cancelText: 'กลับไปทำต่อ' });
      if (ok) submit(false);
    }

    const tick = () => {
      const left = Math.max(0, Math.round((run.readingEndsAt - Date.now()) / 1000));
      timer.textContent = ui.mmss(left);
      timer.classList.toggle('warn', left <= 300);
      if (left <= 0) { clearInterval(timerId); submit(false, true); }
    };
    tick();
    timerId = setInterval(tick, 1000);
  }
  const partOf = (n) => (n <= 6 ? 1 : n <= 31 ? 2 : n <= 70 ? 3 : n <= 100 ? 4 : n <= 130 ? 5 : n <= 146 ? 6 : 7);

  // ---------- grading ----------
  async function submit(fromListening, timeUp) {
    stopAll();
    setView('intro');
    run.phase = 'grading';
    run.finishedAt = Date.now();
    persist();
    root.replaceChildren(h('section', { class: 'panel' }, h('p', { class: 'lead', text: timeUp ? 'หมดเวลา กำลังตรวจข้อสอบ…' : 'กำลังตรวจข้อสอบ…' })));
    const key = {};
    try {
      for (const p of modeParts()) {
        const P = parts[p] || await loadPart(p);
        const items = questionsOf(P).map((q) => ({ n: q.n, pick: run.picks[q.n] === undefined ? 0 : run.picks[q.n] }));
        const d = await api.call('POST', '/api/toeic', { op: 'check', set, part: p, items });
        for (const it of items) { key[it.n] = d.results[it.n].a; if (d.results[it.n].e) (run.expl = run.expl || {})[it.n] = d.results[it.n].e; }
      }
    } catch (e) {
      run.phase = fromListening ? 'listening' : 'reading';
      persist();
      return showError(e, () => submit(fromListening));
    }
    const partScore = {};
    for (const p of modeParts()) {
      const ns = questionsOf(parts[p]).map((q) => q.n);
      partScore[p] = { right: ns.filter((n) => run.picks[n] !== undefined && run.picks[n] === key[n]).length, total: ns.length };
    }
    const sec = (name) => {
      const ps = SECTION[name].parts.filter((p) => partScore[p]);
      if (!ps.length) return null;
      const right = ps.reduce((s, p) => s + partScore[p].right, 0);
      const total = ps.reduce((s, p) => s + partScore[p].total, 0);
      return { right, total, scaled: ui.scaled(name, Math.round((right / total) * 100)) };
    };
    const L = sec('listening');
    const R = sec('reading');
    run.result = { at: Date.now(), mode: run.mode, L, R, total: L && R ? L.scaled + R.scaled : 0, parts: partScore, key, seconds: Math.round((run.finishedAt - run.startedAt) / 1000), timeUp: Boolean(timeUp) };
    run.phase = 'done';
    persist();
    const hist = store.get(HIST, []);
    hist.unshift({ at: run.result.at, mode: run.mode, L, R, total: run.result.total });
    store.set(HIST, hist.slice(0, 10));
    result();
  }

  // ---------- result ----------
  function result() {
    stopAll();
    setView('intro');
    const r = run.result;
    const tile = (big, small) => h('div', { class: 'stat-tile' }, h('strong', { text: big }), h('span', { text: small }));
    const rows = Object.keys(r.parts).map((p) => h('tr', {}, h('td', { text: 'Part ' + p + ' ' + ui.PARTS[p].en }), h('td', { text: r.parts[p].right + ' / ' + r.parts[p].total }), h('td', { text: pct(r.parts[p].right, r.parts[p].total) + '%' })));
    root.replaceChildren(
      h('section', { class: 'panel summary toeic-result' },
        h('h2', { text: 'ผลการสอบ · ชุดที่ ' + set + ' · ' + modeName(r.mode) }),
        r.timeUp && h('p', { class: 'meta', text: 'หมดเวลา ระบบส่งคำตอบให้อัตโนมัติ' }),
        h('div', { class: 'stat-tiles' },
          r.L && tile(r.L.right + ' / ' + r.L.total, 'Listening · ประมาณ ' + r.L.scaled + ' / 495'),
          r.R && tile(r.R.right + ' / ' + r.R.total, 'Reading · ประมาณ ' + r.R.scaled + ' / 495'),
          r.total ? tile('~' + r.total, 'คะแนนรวมโดยประมาณ (10–990) · ระดับ ' + ui.cefrOf(r.total)) : null),
        h('p', { class: 'meta', text: 'คะแนนรวมเป็นค่าประมาณจากตารางแปลงที่ใช้กันทั่วไป (คลาดเคลื่อนได้ราว ±50) ไม่ใช่คะแนนทางการของ ETS · ใช้เวลา ' + Math.round(r.seconds / 60) + ' นาที' }),
        h('table', { class: 'toeic-table' }, h('thead', {}, h('tr', {}, h('th', { text: 'ส่วน' }), h('th', { text: 'ถูก' }), h('th', { text: '%' }))), h('tbody', {}, rows)),
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn', type: 'button', text: 'ดูเฉลยและวิธีคิดทีละข้อ', onclick: () => review('wrong') }),
          h('button', { class: 'btn btn-outline', type: 'button', text: 'สอบใหม่', onclick: () => { run = null; store.remove(KEY); intro(); } }),
          h('a', { class: 'btn btn-outline', href: 'index.html#toeic', text: 'กลับหน้า TOEIC' }))));
  }

  // ---------- review ----------
  async function review(filter) {
    setView('intro');
    root.replaceChildren(h('p', { class: 'meta', text: 'กำลังโหลดข้อสอบสำหรับดูเฉลย…' }));
    try { await Promise.all(modeParts().map((p) => loadPart(p))); } catch (e) { return showError(e, () => review(filter)); }
    const key = run.result.key;
    const wrong = (n) => run.picks[n] === undefined || run.picks[n] !== key[n];
    const chips = h('div', { class: 'chips', role: 'group', 'aria-label': 'ตัวกรอง' });
    const FILTERS = [['wrong', 'ข้อที่ผิดหรือไม่ได้ตอบ'], ['all', 'ทุกข้อ']];
    FILTERS.forEach(([f, label]) => chips.append(h('button', { class: 'chip', type: 'button', text: label, 'aria-pressed': String(f === filter), onclick: () => review(f) })));
    const blocks = [];
    for (const p of modeParts()) {
      const P = parts[p];
      const make = (q) => {
        const c = ui.questionCard(q, { part: p, onPictureFail: () => loadPart(p, true).then(() => review(filter)) });
        ui.paint(c, q, { pick: run.picks[q.n], a: key[q.n], e: (run.expl || {})[q.n], reveal: true });
        return c.el;
      };
      const keep = (q) => filter === 'all' || wrong(q.n);
      const body = [];
      if (P.groups) for (const g of P.groups) { if (g.items.some(keep)) body.push(ui.groupBlock({ ...g, items: g.items.filter(keep) }, p, make)); }
      else { const its = P.items.filter(keep); if (its.length) body.push(h('div', { class: 'toeic-list' }, its.map(make))); }
      if (body.length) blocks.push(h('section', { class: 'toeic-part' }, h('h2', { class: 'toeic-part-title' }, 'Part ' + p + ' ', h('span', { class: 'light', text: ui.PARTS[p].en })),
        p <= 4 && h('p', { class: 'meta', text: 'ฟังเสียงของ Part นี้ซ้ำได้ที่ ' }, h('a', { href: 'toeic-test.html?set=' + set + '&part=' + p, text: 'โหมดฝึก' })), ...body));
    }
    root.replaceChildren(
      h('div', { class: 'btn-row' }, h('button', { class: 'btn btn-outline btn-sm', type: 'button', text: '← สรุปผล', onclick: result })), chips,
      ...(blocks.length ? blocks : [h('p', { class: 'lead', text: 'ไม่มีข้อที่ผิดเลย' })]));
  }

  // ---------- go ----------
  if (!(set >= 1 && set <= 99)) {
    root.replaceChildren(h('section', { class: 'panel' }, h('p', { class: 'lead', text: 'ไม่พบชุดข้อสอบ' }), h('a', { class: 'btn btn-outline', href: 'index.html#toeic', text: 'กลับหน้า TOEIC' })));
    return;
  }
  const title = document.getElementById('toeic-title');
  if (title) title.replaceChildren('ซ้อมสอบจริง ', h('span', { class: 'light', text: 'ชุดที่ ' + set }));
  document.title = 'ซ้อมสอบ TOEIC ชุดที่ ' + set + ' — CEFR Quiz';
  // a test still open in this browser is offered for resuming; a run that was being graded when the page closed goes back to its last section
  if (run && run.v === 1 && run.set === set) {
    if (run.phase === 'grading') { run.phase = run.mode === 'listening' ? 'listening' : 'reading'; persist(); }
  } else run = null;
  intro();
})();
