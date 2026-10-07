// TOEIC full test sets (the book content): menu of sets and one page per Part.
//   toeic-test.html                   → the sets and their Parts
//   toeic-test.html?set=1&part=3      → one Part: audio (Parts 1-4), passages as pictures (Parts 6-7), questions
//
// Nothing here knows an answer in advance. /api/toeic hands out the part without answers (members only), pictures and audio come
// as links that expire, and the right answer of a question arrives only after it was picked (practice) or when the whole Part
// is submitted (exam mode).
(function () {
  'use strict';

  const { h, store, pct } = window.CEFR;
  const root = document.getElementById('app');
  const api = window.CEFR.content;
  const pass = window.CEFR.pass;

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
  const params = new URLSearchParams(location.search);
  const set = Number(params.get('set'));
  const part = Number(params.get('part'));
  const tipsView = params.get('tips');                          // 'grammar' | 'vocab' | 'phrases' | '1' (first section)
  const lastKey = (s, p) => 'toeic:s' + s + 'p' + p + ':last';

  const mmss = (sec) => Math.floor(sec / 60) + ':' + String(Math.round(sec % 60)).padStart(2, '0');
  const setHead = (eyebrow, title, light) => {
    const e = document.getElementById('toeic-eyebrow');
    const t = document.getElementById('toeic-title');
    if (e) e.textContent = eyebrow;
    if (t) t.replaceChildren(title + ' ', h('span', { class: 'light', text: light || '' }));
    document.title = title + ' ' + (light || '') + ' — CEFR Quiz';
  };

  // Media is shown, never offered: no right-click menu, no dragging (a deterrent, not a lock)
  const guard = (el) => { el.addEventListener('contextmenu', (e) => e.preventDefault()); el.addEventListener('dragstart', (e) => e.preventDefault()); return el; };

  // ---------- errors ----------
  let retryOnSignIn = null;
  document.addEventListener('cefr:pass', () => { const f = retryOnSignIn; retryOnSignIn = null; if (f) f(); });
  document.addEventListener('cefr:auth', () => { const f = retryOnSignIn; retryOnSignIn = null; if (f) f(); });

  function showError(e, retry) {
    if (e.status === 401 || e.status === 402) {
      retryOnSignIn = retry;
      root.replaceChildren(pass.lockPanel('toeic', {
        title: 'ชุดข้อสอบ TOEIC เต็มชุด',
        text: 'ชุดนี้เปิดให้สมาชิก ข้อสอบ Listening + Reading พร้อมไฟล์เสียงและเฉลย เลือกแพ็กเกจตั้งแต่ 1 วัน (20 บาท)',
        freeHref: 'index.html#toeic', freeText: 'กลับไปหน้า TOEIC',
      }));
      return;
    }
    const msg = e.code === 'account_blocked' ? 'บัญชีนี้ถูกระงับการเข้าถึงเนื้อหาสำหรับสมาชิกชั่วคราว เพราะมีการดึงเนื้อหาผิดปกติ หากเข้าใจผิด กรุณาติดต่อผู้ดูแล'
      : e.code === 'daily_limit' ? 'วันนี้เปิดครบโควตาแล้ว (ได้ไม่เกิน 14 Part ต่อวัน Part ที่เปิดไปแล้วเปิดซ้ำได้) กลับมาใหม่พรุ่งนี้'
        : e.status === 429 ? 'เปิดหรือตอบเร็วเกินไป รอสักครู่แล้วลองใหม่'
          : e.status === 503 ? 'ชุดข้อสอบนี้ยังไม่เปิดให้ใช้งาน'
            : e.status === 404 ? 'ไม่พบ Part นี้'
              : 'เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ ตรวจสอบอินเทอร์เน็ตแล้วลองใหม่';
    root.replaceChildren(h('section', { class: 'panel' },
      h('p', { class: 'meta', role: 'alert', text: msg }),
      h('div', { class: 'btn-row' },
        e.status !== 503 && e.status !== 404 && h('button', { class: 'btn', type: 'button', text: 'ลองอีกครั้ง', onclick: retry }),
        h('a', { class: 'btn btn-outline', href: part ? 'toeic-test.html' : 'index.html#toeic', text: part ? 'กลับไปเลือกชุด' : 'กลับหน้า TOEIC' }))));
  }

  // ---------- menu ----------
  async function home() {
    setHead('TOEIC · ข้อสอบเต็มชุด', 'ชุดข้อสอบ', 'Listening + Reading');
    root.replaceChildren(h('p', { class: 'meta', text: 'กำลังโหลด…' }));
    let d;
    try { d = await api.call('GET', '/api/toeic'); } catch (e) { return showError(e, home); }
    if (!d.available || !d.sets.length) {
      root.replaceChildren(h('section', { class: 'panel' },
        h('p', { class: 'lead', text: 'ชุดข้อสอบนี้ยังไม่เปิดให้ใช้งาน กลับมาใหม่เร็วๆ นี้' }),
        h('a', { class: 'btn btn-outline', href: 'index.html#toeic', text: 'กลับหน้า TOEIC' })));
      return;
    }
    const locked = () => pass && pass.members('toeic') && !pass.active();
    const draw = () => {
      const blocks = [];
      if (locked()) {
        blocks.push(pass.lockPanel('toeic', {
          title: 'ชุดข้อสอบ TOEIC เต็มชุด',
          text: 'ดูรายการได้ แต่การเปิดข้อสอบสำหรับสมาชิก เลือกแพ็กเกจตั้งแต่ 1 วัน (20 บาท)',
          freeHref: 'index.html#toeic', freeText: 'กลับไปหน้า TOEIC',
        }));
      }
      if (d.tips && d.tips.length) {
        blocks.push(
          h('div', { class: 'part-group' }, h('h2', { text: 'ทริกและเทคนิค' }), h('p', { class: 'meta', text: 'สรุปจาก Ebook เสริมคะแนน' })),
          h('ul', { class: 'list-rows tiles' }, d.tips.map((t) => h('li', { class: 'acc-toeic' },
            h('a', { class: 'list-row', href: 'toeic-test.html?tips=' + t.id },
              h('span', { class: 'list-row-main' },
                h('span', { class: 'list-row-title', text: t.title }),
                h('span', { class: 'list-row-sub', text: t.sub + ' · ' + t.pages + ' หน้า' })))))));
      }
      for (const s of d.sets) {
        const rows = Object.keys(PARTS).filter((p) => s.parts[p]).map((p) => {
          const info = s.parts[p];
          const last = store.get(lastKey(s.id, p), null);
          const sub = [info.q + ' ข้อ', info.audio ? 'เสียง ' + mmss(info.audio) + ' นาที' : null,
            last ? 'ล่าสุด ' + last.right + '/' + last.total + ' (' + pct(last.right, last.total) + '%)' : null].filter(Boolean).join(' · ');
          return h('li', { class: 'acc-toeic' },
            h('a', { class: 'list-row', href: 'toeic-test.html?set=' + s.id + '&part=' + p },
              h('span', { class: 'part-no', text: p }),
              h('span', { class: 'list-row-main' },
                h('span', { class: 'list-row-title' }, 'Part ' + p + ' ', h('span', { class: 'light', text: PARTS[p].en + ' · ' + PARTS[p].th })),
                h('span', { class: 'list-row-sub', text: sub })),
              h('span', { class: 'list-row-side', text: PARTS[p].group })));
        });
        blocks.push(
          h('div', { class: 'part-group' }, h('h2', { text: s.title }), h('p', { class: 'meta', text: 'Listening 100 ข้อ + Reading 100 ข้อ' })),
          h('ul', { class: 'list-rows tiles' }, rows));
      }
      root.replaceChildren(...blocks);
    };
    draw();
    document.addEventListener('cefr:pass', draw);
  }

  // ---------- tips: the Ebook pages, shown as printed ----------
  async function tips() {
    setHead('TOEIC · ทริกและเทคนิค', 'ทริก', 'เสริมคะแนน TOEIC');
    root.replaceChildren(h('p', { class: 'meta', text: 'กำลังโหลด…' }));
    let d;
    try { d = await api.call('GET', '/api/toeic?op=tips'); } catch (e) { return showError(e, tips); }
    let current = d.sections.find((x) => x.id === tipsView) || d.sections[0];

    const zoom = (src, cap) => {
      const dlg = h('dialog', { class: 'dialog toeic-zoom', 'aria-label': cap || 'ภาพขยาย' },
        h('div', { class: 'toeic-zoom-bar' },
          h('span', { class: 'meta', text: cap || '' }),
          h('button', { class: 'btn btn-outline btn-sm', type: 'button', text: 'ปิด', onclick: () => { dlg.close(); dlg.remove(); } })),
        h('div', { class: 'toeic-zoom-body' }, guard(h('img', { class: 'toeic-zoom-img', src, alt: cap || '', draggable: 'false' }))));
      dlg.addEventListener('cancel', () => dlg.remove());
      dlg.addEventListener('click', (e) => { if (e.target === dlg) { dlg.close(); dlg.remove(); } });
      document.body.append(dlg);
      dlg.showModal();
    };

    const list = h('div', { class: 'toeic-tips' });
    const chips = h('div', { class: 'chips', role: 'group', 'aria-label': 'เลือกเล่ม' });
    const draw = () => {
      chips.querySelectorAll('.chip').forEach((b, i) => b.setAttribute('aria-pressed', String(d.sections[i] === current)));
      list.replaceChildren(
        h('p', { class: 'lead', text: current.sub }),
        ...current.pages.map((pg) => h('figure', { class: 'toeic-tip' },
          h('figcaption', { class: 'q-no', text: pg.cap }),
          guard(h('img', { class: 'toeic-passage', src: pg.src, alt: current.title + ' · ' + pg.cap, draggable: 'false', onclick: () => zoom(pg.src, pg.cap) })),
          h('button', { class: 'btn btn-outline btn-sm', type: 'button', text: 'ขยายดู', onclick: () => zoom(pg.src, pg.cap) }))));
    };
    d.sections.forEach((sec) => chips.append(h('button', { class: 'chip', type: 'button', text: sec.title, onclick: () => { current = sec; draw(); } })));
    root.replaceChildren(
      h('div', { class: 'toeic-nav' }, h('a', { class: 'btn btn-outline btn-sm', href: 'toeic-test.html', text: '← ชุดข้อสอบ' })),
      chips, list);
    draw();
  }

  // ---------- one Part ----------
  async function openPart() {
    const info = PARTS[part];
    if (!info || !(set >= 1 && set <= 99)) return home();
    setHead('TOEIC · ชุดที่ ' + set + ' · ' + info.group, 'Part ' + part, info.en);
    root.replaceChildren(h('p', { class: 'meta', text: 'กำลังโหลด…' }));
    let P;
    try { P = await api.call('GET', '/api/toeic?set=' + set + '&part=' + part); } catch (e) { return showError(e, openPart); }
    mount(P);
  }

  function mount(P) {
    const KEY = 'toeic:s' + set + 'p' + part;
    const items = P.items || P.groups.flatMap((g) => g.items);
    const byN = new Map(items.map((q) => [q.n, q]));
    const textless = part <= 2;                                  // Parts 1-2: the choices are only heard / seen as letters
    const rev = {};                                              // n -> { a, e } once the server told us
    let saved = store.get(KEY, null);
    if (!saved || saved.v !== 1) saved = { v: 1, mode: 'practice', picks: {}, submitted: false };
    for (const n of Object.keys(saved.picks)) if (!byN.has(Number(n))) delete saved.picks[n];
    const picks = saved.picks;
    let mode = saved.mode === 'exam' ? 'exam' : 'practice';
    let submitted = Boolean(saved.submitted);
    let busy = false;

    const persist = () => store.set(KEY, { v: 1, mode, picks, submitted });
    const cards = new Map();                                     // n -> { el, buttons[], note }
    const bar = h('div', { class: 'progress-fill' });
    const count = h('span', { class: 'meta', 'aria-live': 'polite' });
    const summary = h('div', { class: 'toeic-summary' });
    const submitBtn = h('button', { class: 'btn', type: 'button', text: 'ส่งคำตอบ', onclick: submit });

    const picture = (src, cls, alt) => guard(h('img', { class: cls, src, alt, draggable: 'false', decoding: 'async' }));

    // ---------- audio (Parts 1-4) ----------
    let audioEl = null;
    let pictures = [];                                           // [{ el, from }] so a refreshed link can replace them
    if (P.audio) {
      audioEl = guard(h('audio', { controls: true, preload: 'metadata', controlsList: 'nodownload noplaybackrate', src: P.audio.src }));
      let refreshing = false;
      audioEl.addEventListener('error', async () => {
        if (refreshing) return;
        refreshing = true;
        const t = audioEl.currentTime;
        const was = !audioEl.paused;
        try {                                                    // the link lives ~25 minutes: ask for a new one and carry on from the same second
          const fresh = await api.call('GET', '/api/toeic?set=' + set + '&part=' + part);
          audioEl.src = fresh.audio.src;
          audioEl.addEventListener('loadedmetadata', () => { audioEl.currentTime = t; if (was) audioEl.play().catch(() => {}); }, { once: true });
        } catch { /* offline: the controls show the problem */ }
        setTimeout(() => { refreshing = false; }, 5000);
      });
    }

    // ---------- questions ----------
    function choice(q, i) {
      const label = textless ? '' : q.c[i];
      const btn = h('button', { class: 'choice', type: 'button', onclick: () => pick(q.n, i), 'aria-label': 'ตัวเลือก ' + (LETTERS[i] || '') },
        h('span', { class: 'choice-key', text: LETTERS[i] }),
        label && h('span', { 'data-tr': true, text: label }));
      return btn;
    }

    function card(q) {
      const note = h('p', { class: 'toeic-ans meta', 'aria-live': 'polite' });
      const buttons = q.c.map((_, i) => choice(q, i));
      const el = h('div', { class: 'toeic-q', id: 'q' + q.n },
        h('p', { class: 'q-no', text: 'ข้อ ' + q.n }),
        q.img && picture(q.img, 'toeic-photo', 'ภาพประกอบข้อ ' + q.n),
        q.q && h('p', { class: 'question', 'data-tr': true, text: q.q }),
        h('div', { class: 'choices' + (textless ? ' letters' : '') }, buttons),
        note);
      cards.set(q.n, { el, buttons, note });
      return el;
    }

    const body = [];
    if (P.groups) {
      for (const g of P.groups) {
        const ns = g.items.map((q) => q.n);
        const range = ns.length > 1 ? 'ข้อ ' + ns[0] + '–' + ns[ns.length - 1] : 'ข้อ ' + ns[0];
        body.push(h('section', { class: 'toeic-group' },
          h('h3', { class: 'toeic-group-title' }, range, g.label ? ' · ' + g.label : ''),
          g.imgs && h('div', { class: 'toeic-pass' }, g.imgs.map((src, k) => picture(src, 'toeic-passage', 'เนื้อหาที่ใช้ตอบ ' + range + (g.imgs.length > 1 ? ' (' + (k + 1) + '/' + g.imgs.length + ')' : '')))),
          g.items.map(card)));
      }
    } else {
      body.push(h('div', { class: 'toeic-list' }, P.items.map(card)));
    }

    // ---------- painting ----------
    function paint(n) {
      const c = cards.get(n);
      const r = rev[n];
      const p = picks[n];
      c.buttons.forEach((b, i) => {
        b.disabled = Boolean(r);
        b.classList.toggle('selected', !r && p === i);
        b.classList.toggle('correct', Boolean(r) && r.a === i);
        b.classList.toggle('wrong', Boolean(r) && p === i && r.a !== i);
      });
      if (r) {
        const ok = p === r.a;
        const q = byN.get(n);
        c.note.className = 'toeic-ans meta ' + (ok ? 'ok' : 'bad');
        c.note.replaceChildren(...[
          ok ? 'ถูกต้อง' : (p === undefined ? 'ไม่ได้ตอบ · ' : 'ผิด · ') + 'เฉลย (' + LETTERS[r.a] + ')' + (textless ? '' : ' ' + q.c[r.a]),
          r.e && h('span', { class: 'toeic-expl', 'data-tr': true, text: r.e })].filter(Boolean));     // replaceChildren would print a falsy value as text
      } else {
        c.note.className = 'toeic-ans meta';
        c.note.textContent = '';
      }
    }

    function refresh() {
      const answered = Object.keys(picks).length;
      const total = items.length;
      bar.style.width = Math.round((answered / total) * 100) + '%';
      count.textContent = 'ตอบแล้ว ' + answered + '/' + total + ' ข้อ';
      submitBtn.hidden = !(mode === 'exam' && !submitted) && !(mode === 'practice' && answered === total && !submitted);
      submitBtn.textContent = mode === 'exam' ? 'ส่งคำตอบและดูผล' : 'ดูผลคะแนน';
      submitBtn.disabled = answered === 0;
      syncChips();
    }

    // ---------- answers ----------
    async function reveal(list) {
      for (let i = 0; i < list.length; i += 60) {
        const chunk = list.slice(i, i + 60);
        const d = await api.call('POST', '/api/toeic', { op: 'check', set, part, items: chunk });
        for (const it of chunk) rev[it.n] = d.results[it.n];
      }
    }

    async function pick(n, i) {
      if (busy || rev[n] || (submitted && mode === 'exam')) return;
      picks[n] = i;
      if (mode === 'exam') { persist(); paint(n); refresh(); return; }
      busy = true;
      try {
        await reveal([{ n, pick: i }]);
      } catch (e) {
        delete picks[n];
        busy = false;
        notice(e);
        return;
      }
      busy = false;
      persist();
      paint(n);
      refresh();
    }

    async function submit() {
      if (busy) return;
      busy = true;
      submitBtn.disabled = true;
      try {
        // practice: everything picked is already revealed; exam: reveal all picks now (unanswered ones are shown too)
        const need = items.filter((q) => !rev[q.n]).map((q) => ({ n: q.n, pick: picks[q.n] === undefined ? 0 : picks[q.n] }));
        if (need.length) await reveal(need);
      } catch (e) {
        busy = false;
        submitBtn.disabled = false;
        notice(e);
        return;
      }
      busy = false;
      submitted = true;
      persist();
      items.forEach((q) => paint(q.n));
      const right = items.filter((q) => picks[q.n] !== undefined && picks[q.n] === rev[q.n].a).length;
      store.set(lastKey(set, part), { right, total: items.length, at: Date.now() });
      showSummary(right);
      refresh();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function showSummary(right) {
      const total = items.length;
      const wrong = items.filter((q) => picks[q.n] === undefined || picks[q.n] !== rev[q.n].a).map((q) => q.n);
      summary.replaceChildren(h('section', { class: 'panel summary toeic-result' },
        h('h2', { text: 'ผลคะแนน' }),
        h('div', { class: 'score', text: right + ' / ' + total }),
        h('p', { class: 'score-sub', text: pct(right, total) + '%' + (wrong.length ? ' · ผิดหรือไม่ได้ตอบ ข้อ ' + wrong.join(', ') : ' · ถูกทุกข้อ') }),
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn', type: 'button', text: 'ทำใหม่', onclick: restart }),
          h('a', { class: 'btn btn-outline', href: 'toeic-test.html', text: 'เลือก Part อื่น' }))));
    }

    function restart() {
      for (const k of Object.keys(picks)) delete picks[k];
      for (const k of Object.keys(rev)) delete rev[k];
      submitted = false;
      summary.replaceChildren();
      persist();
      items.forEach((q) => paint(q.n));
      refresh();
      window.scrollTo({ top: 0 });
    }

    function notice(e) {
      const msg = e.status === 401 || e.status === 402 ? 'ต้องเข้าสู่ระบบด้วยบัญชีสมาชิกเพื่อดูเฉลย'
        : e.status === 429 ? 'ตอบเร็วหรือบ่อยเกินไป รอสักครู่แล้วลองใหม่' : 'เชื่อมต่อไม่สำเร็จ ลองใหม่อีกครั้ง';
      summary.replaceChildren(h('p', { class: 'meta', role: 'alert', text: msg }));
    }

    // ---------- chrome ----------
    const modeChips = h('div', { class: 'chips', role: 'group', 'aria-label': 'โหมด' });
    const MODES = [['practice', 'ฝึก · เฉลยทีละข้อ'], ['exam', 'จำลองสอบ · ตรวจตอนท้าย']];
    const syncChips = () => modeChips.querySelectorAll('.chip').forEach((b, i) => {
      b.setAttribute('aria-pressed', String(MODES[i][0] === mode));
      b.disabled = Object.keys(picks).length > 0 && MODES[i][0] !== mode;     // the mode is fixed once answering has begun (reset with ทำใหม่)
    });
    MODES.forEach(([m, label]) => modeChips.append(h('button', {
      class: 'chip', type: 'button', text: label,
      onclick: () => { if (Object.keys(picks).length) return; mode = m; persist(); syncChips(); refresh(); },
    })));
    const head = h('section', { class: 'panel toeic-head' },
      h('div', { class: 'toeic-nav' },
        h('a', { class: 'btn btn-outline btn-sm', href: 'toeic-test.html', text: '← ทุก Part' }),
        part > 1 && h('a', { class: 'btn btn-outline btn-sm', href: 'toeic-test.html?set=' + set + '&part=' + (part - 1), text: 'Part ' + (part - 1) }),
        part < 7 && h('a', { class: 'btn btn-outline btn-sm', href: 'toeic-test.html?set=' + set + '&part=' + (part + 1), text: 'Part ' + (part + 1) })),
      audioEl && h('div', { class: 'toeic-audio' },
        h('span', { class: 'label', text: 'ไฟล์เสียง Part ' + part + ' · ' + mmss(P.audio.sec) + ' นาที' }),
        audioEl,
        h('p', { class: 'meta', text: 'ในข้อสอบจริงเสียงจะเล่นครั้งเดียวต่อเนื่อง ลองฟังจบรอบเดียวแล้วค่อยตอบ' })),
      h('span', { class: 'label', text: 'โหมด' }),
      modeChips,
      h('div', { class: 'progress' }, bar),
      count,
      h('div', { class: 'btn-row toeic-submit' }, submitBtn));

    root.replaceChildren(head, summary, ...body);
    items.forEach((q) => paint(q.n));
    refresh();

    // a Part reopened after a reload: bring back the answers the learner had already given
    const earlier = Object.keys(picks).map((n) => ({ n: Number(n), pick: picks[n] }));
    if (earlier.length && (mode === 'practice' || submitted)) {
      reveal(earlier).then(() => {
        items.forEach((q) => paint(q.n));
        if (submitted) {
          const right = items.filter((q) => picks[q.n] !== undefined && rev[q.n] && picks[q.n] === rev[q.n].a).length;
          showSummary(right);
        }
        refresh();
      }).catch(notice);
    }
  }

  (tipsView ? tips : part ? openPart : home)();
})();
