// English → Thai translation helper.
//   • click a word inside any [data-tr] element → popover with its meaning
//   • drag-select a phrase / sentence inside [data-tr] → popover with the translation
// Lookups go to /api/translate (cached at the edge); if that is unavailable the browser asks
// MyMemory directly. Results are cached in localStorage. Exposes CEFR.translate(text).
(function () {
  'use strict';

  const { store, h } = window.CEFR;
  const ASSETS = document.currentScript ? new URL('../', document.currentScript.src) : null;  // …/assets/

  const MAX_CHARS = 300;
  const CACHE_MAX = 400;
  const SKIP = 'button, a, select, input, textarea, summary, label, [role="button"]';

  let enabled = store.get('translate', true) !== false;

  // ---------- Lookup (cache → /api → MyMemory) ----------
  const cache = new Map(Object.entries(store.get('trcache', {})));
  let saveTimer = 0;

  const keyOf = (text) => (/\s/.test(text) ? text : text.toLowerCase());

  function remember(key, value) {
    cache.delete(key);
    cache.set(key, value);
    while (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value);
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => store.set('trcache', Object.fromEntries(cache)), 500);
  }

  async function getJson(url, ms) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), ms);
    try {
      const r = await fetch(url, { signal: ctrl.signal });
      if (!r.ok) { const e = new Error('http ' + r.status); e.status = r.status; throw e; }
      return await r.json();
    } finally {
      clearTimeout(timer);
    }
  }

  const decode = (s) => String(s).replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

  // MyMemory sometimes appends a romanisation ("… S̄t̄hānī tảrwc …") after the Thai text — cut it off.
  function stripRomanization(s) {
    const at = s.search(/\s[A-Za-z]*[̀-ͯĀ-ɏḀ-ỿ]/);
    return at > 0 && /[฀-๿]/.test(s.slice(0, at)) ? s.slice(0, at).trim() : s;
  }

  async function viaMyMemory(text) {
    const j = await getJson('https://api.mymemory.translated.net/get?langpair=en%7Cth&q=' + encodeURIComponent(text), 8000);
    const main = j && j.responseData && j.responseData.translatedText;
    if (!main || Number(j.responseStatus) !== 200 || /MYMEMORY WARNING|INVALID/i.test(String(main))) throw new Error('mymemory unavailable');
    const translation = stripRomanization(decode(main).trim());
    const alts = [];
    for (const m of j.matches || []) {
      const t = stripRomanization(decode(m.translation || '').trim());
      if (t && t !== translation && /[฀-๿]/.test(t) && Number(m.match) >= 0.6 && !alts.includes(t) && t.length <= 60) alts.push(t);
      if (alts.length >= 3) break;
    }
    return { q: text, translation, alts: /\s/.test(text) ? [] : alts, provider: 'mymemory' };
  }

  async function translate(text) {
    const key = keyOf(text);
    if (cache.has(key)) return cache.get(key);
    let data;
    try {
      data = await getJson('/api/translate?q=' + encodeURIComponent(text), 9000);
    } catch (e) {
      if (e.status === 400) throw e;      // not translatable — no point retrying elsewhere
      data = await viaMyMemory(text);     // /api missing (local file, quota, outage) → ask directly
    }
    if (!data || !data.translation) throw new Error('empty translation');
    remember(key, data);
    return data;
  }

  // ---------- Dictionary (single words) ----------
  // Free MT engines are unreliable for isolated words ("the" → "ชื่อ"), so single words are answered
  // from the bundled glossary first; only unknown words and phrases/sentences go to the API.
  const isWord = (t) => /^[A-Za-z]+(?:['’-][A-Za-z]+)*$/.test(t);

  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = url;
      s.onload = resolve;
      s.onerror = reject;
      document.head.append(s);
    });
  }

  let dictPromise = null;
  function getDictionary() {
    if (!dictPromise) {
      dictPromise = (async () => {
        if (!ASSETS) return null;
        if (!window.CEFR.createDictionary) await loadScript(new URL('js/dictionary.js', ASSETS).href);
        if (!window.CEFR_DATA || !window.CEFR_DATA.glossary) await loadScript(new URL('data/glossary.js', ASSETS).href);
        return window.CEFR.createDictionary(window.CEFR_DATA.glossary);
      })().catch(() => null);
    }
    return dictPromise;
  }

  // → { source: 'dict'|'api', translation, alts[], lemma?, note?, derived?, auto? }
  async function lookup(text) {
    text = String(text).replace(/[​‌⁠]/g, '');   // invisible per-account tags in the lesson text (see api/_watermark.js)
    if (isWord(text)) {
      const dict = await getDictionary();
      const hit = dict && dict.lookup(text);
      if (hit) {
        return { source: 'dict', translation: hit.senses[0], alts: hit.senses.slice(1), lemma: hit.lemma, note: hit.note, derived: !hit.direct };
      }
    }
    const d = await translate(text);
    return { source: 'api', translation: d.translation, alts: d.alts || [], auto: isWord(text) };
  }

  // ---------- Text helpers ----------
  function isEnglish(text) {
    const latin = (text.match(/[A-Za-z]/g) || []).length;
    const thai = (text.match(/[฀-๿]/g) || []).length;
    return latin > 0 && latin >= thai;
  }

  const elementOf = (node) => (node && node.nodeType === 1 ? node : node && node.parentElement);
  const regionOf = (node) => { const el = elementOf(node); return el ? el.closest('[data-tr]') : null; };

  function caretRangeAt(x, y) {
    if (document.caretPositionFromPoint) {
      const p = document.caretPositionFromPoint(x, y);
      if (!p) return null;
      const r = document.createRange();
      r.setStart(p.offsetNode, p.offset);
      r.collapse(true);
      return r;
    }
    return document.caretRangeFromPoint ? document.caretRangeFromPoint(x, y) : null;
  }

  function wordRangeAt(x, y) {
    const caret = caretRangeAt(x, y);
    if (!caret || caret.startContainer.nodeType !== 3) return null;
    const node = caret.startContainer;
    const text = node.nodeValue;
    const isWordChar = (c) => /[A-Za-z'’-]/.test(c);
    let s = caret.startOffset;
    let e = s;
    while (s > 0 && isWordChar(text[s - 1])) s--;
    while (e < text.length && isWordChar(text[e])) e++;
    while (s < e && /['’-]/.test(text[s])) s++;
    while (e > s && /['’-]/.test(text[e - 1])) e--;
    if (s >= e) return null;
    const range = document.createRange();
    range.setStart(node, s);
    range.setEnd(node, e);
    // the caret snaps to the nearest text — make sure the pointer is really over the word
    const over = [...range.getClientRects()].some((b) => x >= b.left - 2 && x <= b.right + 2 && y >= b.top - 2 && y <= b.bottom + 2);
    return over ? range : null;
  }

  // ---------- Popover ----------
  let pop = null;
  let current = null;   // { key } of what the popover is showing
  let token = 0;

  function close() {
    token++;
    current = null;
    if (pop) { pop.remove(); pop = null; }
  }

  // User-initiated dismissal (× / Esc). The word must also be un-selected, otherwise the
  // selection listeners see it still highlighted and immediately re-open the popup.
  function dismiss() {
    close();
    const sel = window.getSelection();
    if (sel) sel.removeAllRanges();
  }

  function speak(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  }

  function place(range) {
    const rects = range.getClientRects();
    const r = rects.length ? rects[rects.length - 1] : range.getBoundingClientRect();
    const docW = document.documentElement.clientWidth;
    const left = Math.min(Math.max(8, r.left), Math.max(8, docW - pop.offsetWidth - 8));
    pop.style.left = left + window.scrollX + 'px';
    pop.style.top = r.bottom + window.scrollY + 8 + 'px';
  }

  function show(range, text) {
    const key = keyOf(text);
    if (pop && current && current.key === key) return;
    close();
    const my = token;
    current = { key };

    const body = h('div', { class: 'tr-body', 'aria-live': 'polite' }, h('span', { class: 'tr-wait', text: 'กำลังแปล…' }));
    const speaker = 'speechSynthesis' in window && h('button', { class: 'tr-btn', type: 'button', 'aria-label': 'ฟังเสียงอ่าน', title: 'ฟังเสียงอ่าน', onclick: () => speak(text) });
    if (speaker) {
      speaker.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
    }
    const head = h('div', { class: 'tr-head' },
      h('strong', { class: 'tr-src', text: text.length > 60 ? text.slice(0, 57) + '…' : text }),
      speaker,
      h('button', { class: 'tr-btn', type: 'button', 'aria-label': 'ปิด', title: 'ปิด', text: '×', onclick: dismiss })
    );
    pop = h('div', { class: 'tr-pop', role: 'dialog', 'aria-label': 'คำแปล' }, head, body);
    document.body.append(pop);
    place(range);

    const run = () => {
      body.replaceChildren(h('span', { class: 'tr-wait', text: 'กำลังแปล…' }));
      lookup(text).then((d) => {
        if (my !== token || !pop) return;
        body.replaceChildren(...[
          h('div', { class: 'tr-main', text: d.translation }),
          d.alts.length > 0 && h('div', { class: 'tr-alts', text: 'ความหมายอื่น: ' + d.alts.join(' · ') }),
          d.source === 'dict' && (d.derived || d.note) && h('div', { class: 'tr-note', text: '← ' + d.lemma + (d.note ? ' (' + d.note + ')' : '') }),
          d.source === 'api' && h('div', { class: 'tr-note', text: d.auto ? 'ไม่พบในพจนานุกรม — แปลอัตโนมัติ อาจไม่ตรงบริบท' : 'แปลโดยเครื่อง อาจคลาดเคลื่อน ใช้เป็นแนวทางเท่านั้น' }),
        ].filter(Boolean));
        place(range);
        pop.scrollIntoView({ block: 'nearest' });
      }).catch((e) => {
        if (my !== token || !pop) return;
        body.replaceChildren(...[
          h('span', { class: 'tr-err', text: e.status === 400 ? 'ข้อความนี้แปลไม่ได้' : 'แปลไม่สำเร็จ (ออฟไลน์หรือบริการแปลไม่ตอบสนอง)' }),
          e.status !== 400 && h('button', { class: 'tr-retry', type: 'button', text: 'ลองใหม่', onclick: run }),
        ].filter(Boolean));
      });
    };
    run();
  }

  // ---------- Triggers ----------
  let pointerDown = false;
  let selTimer = 0;

  function handleSelection() {
    if (!enabled) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    if (!regionOf(range.startContainer) || !regionOf(range.endContainer)) return;
    const text = sel.toString().replace(/[​‌⁠]/g, '').replace(/\s+/g, ' ').trim();
    if (!text || !isEnglish(text)) return;
    if (text.length > MAX_CHARS) {
      close();
      const my = token;
      pop = h('div', { class: 'tr-pop', role: 'dialog' }, h('span', { class: 'tr-err', text: 'เลือกข้อความสั้นลง (ไม่เกิน ' + MAX_CHARS + ' ตัวอักษร)' }));
      document.body.append(pop);
      place(range);
      setTimeout(() => { if (my === token) close(); }, 2500);
      return;
    }
    show(range, text);
  }

  document.addEventListener('pointerdown', (e) => {
    pointerDown = true;
    if (pop && !pop.contains(e.target)) close();
  });

  document.addEventListener('pointerup', (e) => {
    pointerDown = false;
    if (pop && pop.contains(e.target)) return;      // clicks on the popup's own buttons are not a new selection
    setTimeout(handleSelection, 10);
  });

  // Touch selection handles / keyboard selection: wait until the selection settles.
  document.addEventListener('selectionchange', () => {
    clearTimeout(selTimer);
    selTimer = setTimeout(() => { if (!pointerDown) handleSelection(); }, 400);
  });

  // A plain click (no drag) on a word
  document.addEventListener('click', (e) => {
    if (!enabled || e.detail === 0) return;                  // detail 0 = keyboard-triggered click
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) return;                     // selection path handles it
    const el = elementOf(e.target);
    if (!el || !el.closest('[data-tr]') || el.closest(SKIP)) return;
    const range = wordRangeAt(e.clientX, e.clientY);
    if (!range || !regionOf(range.startContainer)) return;
    const word = range.toString();
    if (!isEnglish(word)) return;
    sel.removeAllRanges();
    sel.addRange(range);                                      // native highlight of the chosen word
    show(range, word);
  });

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && pop) dismiss(); });

  // ---------- On/off toggle (header button) ----------
  // Shows its state in words: "แปล: เปิด" / "แปล: ปิด".
  function syncToggles() {
    document.querySelectorAll('[data-translate-toggle]').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(enabled));
      btn.textContent = enabled ? 'แปล: เปิด' : 'แปล: ปิด';
      btn.title = enabled
        ? 'ระบบแปลเปิดอยู่ — คลิกคำหรือลากคลุมข้อความเพื่อดูคำแปล (กดเพื่อปิด)'
        : 'ระบบแปลปิดอยู่ — กดเพื่อเปิด แล้วคลิกคำหรือลากคลุมข้อความเพื่อดูคำแปล';
    });
  }

  document.querySelectorAll('[data-translate-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      enabled = !enabled;
      store.set('translate', enabled);
      if (!enabled) dismiss();
      syncToggles();
    });
  });
  syncToggles();

  window.CEFR.translate = translate;   // machine translation of any text (API)
  window.CEFR.lookup = lookup;         // dictionary for single words, API otherwise
  window.CEFR.translateEnabled = () => enabled;
})();
