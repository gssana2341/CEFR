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
    const msg = e.code === 'not_invited' ? 'ตอนนี้ชุดข้อสอบนี้เปิดให้เฉพาะผู้ทดสอบที่ได้รับเชิญ (ต้องเข้าสู่ระบบด้วยอีเมลที่ได้รับเชิญ)'
      : e.code === 'not_open' ? 'ชุดข้อสอบนี้ยังไม่เปิดให้ใช้งาน'
        : e.code === 'account_blocked' ? 'บัญชีนี้ถูกระงับการเข้าถึงเนื้อหาสำหรับสมาชิกชั่วคราว เพราะมีการดึงเนื้อหาผิดปกติ หากเข้าใจผิด กรุณาติดต่อผู้ดูแล'
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
    const locked = () => !d.beta && pass && pass.members('toeic') && !pass.active();       // invited testers need no membership
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

  // ---------- one Part: which set to practise it from ----------
  async function partMenu() {
    const info = PARTS[part];
    if (!info) return home();
    setHead('TOEIC · ฝึกตาม Part', 'Part ' + part, info.en + ' · ' + info.th);
    root.replaceChildren(h('p', { class: 'meta', text: 'กำลังโหลด…' }));
    let d;
    try { d = await api.call('GET', '/api/toeic'); } catch (e) { return showError(e, partMenu); }
    const locked = () => !d.beta && pass && pass.members('toeic') && !pass.active();       // invited testers need no membership
    const rows = (d.sets || []).filter((s) => s.parts[part]).map((s) => {
      const i = s.parts[part];
      const last = store.get(lastKey(s.id, part), null);
      const sub = [i.q + ' ข้อ', i.audio ? 'เสียง ' + mmss(i.audio) + ' นาที' : null, last ? 'ล่าสุด ' + last.right + '/' + last.total + ' (' + pct(last.right, last.total) + '%)' : null].filter(Boolean).join(' · ');
      return h('li', { class: 'acc-toeic' },
        h('a', { class: 'list-row', href: 'toeic-test.html?set=' + s.id + '&part=' + part },
          h('span', { class: 'part-no', text: String(s.id) }),
          h('span', { class: 'list-row-main' }, h('span', { class: 'list-row-title', text: s.title }), h('span', { class: 'list-row-sub', text: sub })),
          h('span', { class: 'list-row-side', text: locked() ? 'สมาชิก' : 'ฝึกได้' })));
    });
    if (part === 5) {
      rows.push(h('li', { class: 'acc-toeic' }, h('a', { class: 'list-row', href: 'toeic5.html' },
        h('span', { class: 'part-no', text: '+' }),
        h('span', { class: 'list-row-main' }, h('span', { class: 'list-row-title', text: 'ข้อสอบเขียนใหม่ของเว็บ' }), h('span', { class: 'list-row-sub', text: '30 ข้อ · มีคำอธิบายภาษาไทย' })),
        h('span', { class: 'list-row-side', text: 'ฟรี' }))));
    }
    root.replaceChildren(
      h('div', { class: 'toeic-nav' }, h('a', { class: 'btn btn-outline btn-sm', href: 'index.html#toeic', text: '← หน้า TOEIC' })),
      h('p', { class: 'lead', text: 'เลือกชุดที่จะฝึก Part นี้ ทำทีละข้อ ตอบแล้วเห็นเฉลย' }),
      h('ul', { class: 'list-rows tiles' }, rows));
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

  // ---------- practice: one question (or one conversation / passage) at a time ----------
  // Each step shows what the real test shows - the recording (Parts 1-4), the picture, the question - and after a pick the answer, the
  // reasoning (วิธีคิด) and, for Parts 1-4, the script of what was said. The answer is asked from the server per pick.
  function mount(P) {
    const ui = window.CEFR.toeicUi;
    const KEY = 'toeic:s' + set + 'p' + part;
    const textless = part <= 2;
    const steps = P.groups
      ? P.groups.map((g) => ({ id: g.id, g, items: g.items, at: g.at, label: g.label }))
      : P.items.map((q) => ({ id: String(q.n), items: [q], at: q.at }));
    const all = steps.flatMap((st) => st.items);
    const byN = new Map(all.map((q) => [q.n, q]));
    const stepOf = new Map(steps.flatMap((st, i) => st.items.map((q) => [q.n, i])));
    const rev = {};                                              // n -> { a, e, tx } once the server told us
    const fresh = () => api.call('GET', '/api/toeic?set=' + set + '&part=' + part).then((F) => F.audio.src);
    const wantAuto = () => store.get('toeic:autoplay', true) !== false;

    let st = store.get(KEY, null);
    if (!st || st.v !== 2) st = { v: 2, order: steps.map((_, i) => i), index: 0, picks: {} };
    for (const n of Object.keys(st.picks)) if (!byN.has(Number(n))) delete st.picks[n];
    if (!Array.isArray(st.order) || !st.order.length || st.order.some((i) => !steps[i])) st.order = steps.map((_, i) => i);
    st.index = Math.min(Math.max(0, st.index || 0), st.order.length);
    const persist = () => store.set(KEY, st);

    let player = null;
    let busy = false;
    const cards = new Map();

    const reveal = async (list) => {
      for (let i = 0; i < list.length; i += 60) {
        const chunk = list.slice(i, i + 60);
        const d = await api.call('POST', '/api/toeic', { op: 'check', set, part, items: chunk });
        for (const it of chunk) rev[it.n] = d.results[it.n];
      }
    };
    const paintCard = (n) => ui.paint(cards.get(n), byN.get(n), { pick: st.picks[n], a: (rev[n] || {}).a, e: (rev[n] || {}).e, reveal: Boolean(rev[n]) });
    const right = (n) => st.picks[n] !== undefined && rev[n] && st.picks[n] === rev[n].a;
    const leave = () => { if (player) { player.destroy(); player = null; } };

    // ---------- one step ----------
    function renderStep() {
      leave();
      cards.clear();
      const step = steps[st.order[st.index]];
      const total = st.order.length;

      const bar = h('div', { class: 'progress-fill', style: { width: Math.round((st.index / total) * 100) + '%' } });
      const nextBtn = h('button', { class: 'btn btn-block', type: 'button', text: st.index === total - 1 ? 'ดูผลคะแนน' : 'ถัดไป', hidden: true, onclick: next });
      const prevBtn = st.index > 0 && h('button', { class: 'btn btn-outline btn-block', type: 'button', text: '← ก่อนหน้า', onclick: () => { st.index--; persist(); renderStep(); window.scrollTo(0, 0); } });
      const script = h('details', { class: 'toeic-script', hidden: true });
      const syncStep = () => {
        const done = step.items.every((q) => rev[q.n]);
        nextBtn.hidden = !done;
        const tx = step.items.map((q) => rev[q.n] && rev[q.n].tx).find(Boolean);
        script.hidden = !tx;
        if (tx && !script.dataset.ready) {
          script.dataset.ready = '1';
          script.replaceChildren(h('summary', { text: 'ดูสคริปต์เสียง (English)' }),
            ...tx.split('\n').map((l) => h('p', { class: 'toeic-script-line', 'data-tr': true, text: l })));
        }
      };

      const pick = async (n, i) => {
        if (busy || rev[n]) return;
        busy = true;
        st.picks[n] = i;
        try { await reveal([{ n, pick: i }]); } catch (e) { delete st.picks[n]; busy = false; notice(e); return; }
        busy = false;
        persist();
        paintCard(n);
        syncStep();
        if (step.items.every((q) => rev[q.n])) nextBtn.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      };
      const make = (q) => { const c = ui.questionCard(q, { part, onPick: pick }); cards.set(q.n, c); paintCard(q.n); return c.el; };

      // the recording of this step
      let clip = null;
      if (P.audio && step.at) {
        player = ui.clipPlayer({ src: P.audio.src, start: step.at[0], end: step.at[1], cue: step.items[0].cue, refresh: fresh, autoplay: wantAuto() });
        const auto = h('label', { class: 'toeic-clip-opt' }, h('input', { type: 'checkbox', checked: wantAuto(), onchange: (e) => store.set('toeic:autoplay', e.target.checked) }), ' เล่นเสียงอัตโนมัติเมื่อเปิดข้อ');
        clip = h('div', { class: 'toeic-clip-box' }, player.el, auto);
      } else if (P.audio) {
        clip = h('div', { class: 'toeic-clip-box' }, ui.guard(h('audio', { controls: true, preload: 'none', controlsList: 'nodownload noplaybackrate', src: P.audio.src })));
      }

      const body = step.g ? ui.groupBlock(step.g, part, make) : make(step.items[0]);

      window.CEFR.setView('quiz');
      root.replaceChildren(h('section', { class: 'panel toeic-step' },
        h('div', { class: 'focus-bar' },
          h('button', { class: 'focus-exit', type: 'button', 'aria-label': 'พักไว้ก่อน (บันทึกอัตโนมัติ)', title: 'พักไว้ก่อน (บันทึกอัตโนมัติ)', text: '←', onclick: () => { leave(); location.href = 'toeic-test.html?part=' + part; } }),
          h('div', { class: 'progress' }, bar),
          h('span', { class: 'focus-count', text: (st.index + 1) + ' / ' + total })),
        h('p', { class: 'q-tag', text: 'ชุดที่ ' + set + ' · Part ' + part + ' ' + ui.PARTS[part].en }),
        clip, body, script,
        h('div', { class: 'toeic-step-nav' }, nextBtn, prevBtn)));
      syncStep();
    }

    function next() {
      leave();
      if (st.index < st.order.length - 1) { st.index++; persist(); renderStep(); window.scrollTo(0, 0); } else finish();
    }

    function notice(e) {
      const msg = e.status === 401 || e.status === 402 ? 'ต้องเข้าสู่ระบบด้วยบัญชีสมาชิกเพื่อดูเฉลย'
        : e.status === 429 ? 'ตอบเร็วหรือบ่อยเกินไป รอสักครู่แล้วลองใหม่' : 'เชื่อมต่อไม่สำเร็จ ลองใหม่อีกครั้ง';
      const old = root.querySelector('.toeic-notice');
      if (old) old.remove();
      root.querySelector('.toeic-step').prepend(h('p', { class: 'meta toeic-notice', role: 'alert', text: msg }));
    }

    // ---------- the end of the round ----------
    async function finish() {
      leave();
      window.CEFR.setView('summary');
      const need = all.filter((q) => st.picks[q.n] !== undefined && !rev[q.n]).map((q) => ({ n: q.n, pick: st.picks[q.n] }));
      if (need.length) { try { await reveal(need); } catch (e) { return showError(e, finish); } }
      const wrong = all.filter((q) => !right(q.n));
      const score = all.length - wrong.length;
      store.set(lastKey(set, part), { right: score, total: all.length, at: Date.now() });
      const msg = pct(score, all.length) >= 90 ? 'ยอดเยี่ยม' : pct(score, all.length) >= 70 ? 'ดีมาก' : pct(score, all.length) >= 50 ? 'พอใช้ ทบทวนข้อที่ผิดจะดีขึ้น' : 'ลองทบทวนข้อที่ผิดแล้วทำใหม่';
      const review = wrong.length > 0 && h('div', { class: 'review' },
        h('h3', { text: 'ข้อที่ผิดหรือไม่ได้ตอบ (' + wrong.length + ')' }),
        wrong.map((q) => {
          const r = rev[q.n] || {};
          return h('div', { class: 'review-item' },
            h('p', { class: 'review-q', 'data-tr': true, text: 'ข้อ ' + q.n + (q.q ? ': ' + q.q : '') }),
            st.picks[q.n] !== undefined && h('p', { class: 'review-you', text: '✗ คุณตอบ: (' + LETTERS[st.picks[q.n]] + ')' + (textless ? '' : ' ' + q.c[st.picks[q.n]]) }),
            h('p', { class: 'review-right', text: '✓ เฉลย: (' + LETTERS[r.a] + ')' + (textless ? '' : ' ' + q.c[r.a]) }),
            r.e && h('p', { class: 'review-expl', 'data-tr': true, text: r.e }));
        }));
      root.replaceChildren(h('section', { class: 'panel summary' },
        h('h2', { text: 'ผลคะแนน' }),
        h('div', { class: 'score', text: score + ' / ' + all.length }),
        h('p', { class: 'score-sub', text: pct(score, all.length) + '% · ' + msg }),
        h('div', { class: 'btn-row' },
          wrong.length > 0 && h('button', { class: 'btn', type: 'button', text: 'ทำเฉพาะข้อที่ผิด (' + wrong.length + ')', onclick: redoWrong }),
          h('button', { class: 'btn btn-outline', type: 'button', text: 'ทำรอบใหม่', onclick: restart }),
          h('a', { class: 'btn btn-outline', href: 'toeic-test.html?part=' + part, text: 'เลือกชุดอื่น' })),
        review));
      window.scrollTo(0, 0);
    }

    function restart() {
      st = { v: 2, order: steps.map((_, i) => i), index: 0, picks: {} };
      for (const k of Object.keys(rev)) delete rev[k];
      persist();
      renderStep();
      window.scrollTo(0, 0);
    }
    function redoWrong() {
      const wrongN = all.filter((q) => !right(q.n)).map((q) => q.n);
      for (const n of wrongN) { delete st.picks[n]; delete rev[n]; }
      st.order = [...new Set(wrongN.map((n) => stepOf.get(n)))].sort((x, y) => x - y);
      st.index = 0;
      persist();
      renderStep();
      window.scrollTo(0, 0);
    }

    // keyboard: A-D / 1-4 pick for the first open question of the step, Enter goes on
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || document.querySelector('dialog[open]') || !root.querySelector('.toeic-step')) return;
      const step = steps[st.order[st.index]];
      if (!step) return;
      if (e.key === 'Enter') { const b = root.querySelector('.toeic-step-nav .btn:not([hidden])'); if (b && !b.textContent.startsWith('←')) { e.preventDefault(); b.click(); } return; }
      if (e.key.length !== 1) return;
      const k = e.key.toUpperCase();
      const i = 'ABCD'.indexOf(k) >= 0 ? 'ABCD'.indexOf(k) : '1234'.indexOf(k);
      const open = step.items.find((q) => !rev[q.n]);
      if (i >= 0 && open && i < open.c.length) cards.get(open.n).buttons[i].click();
    });

    // a round reopened after a reload: bring back the answers already given (and the reasoning), then carry on
    const earlier = Object.keys(st.picks).map((n) => ({ n: Number(n), pick: st.picks[n] }));
    const start = () => (st.index >= st.order.length ? finish() : renderStep());
    if (earlier.length) reveal(earlier).then(start).catch(() => { for (const k of Object.keys(st.picks)) delete st.picks[k]; start(); });
    else start();
  }

  (tipsView ? tips : part && !set ? partMenu : part ? openPart : home)();
})();
