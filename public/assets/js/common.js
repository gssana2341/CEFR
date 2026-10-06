// Shared helpers + quiz registry. Exposes a single global: window.CEFR
(function () {
  'use strict';

  // ---------- Registry of quizzes (hub + engines read this) ----------
  // (page titles / descriptions live in each HTML file)
  const QUIZZES = {
    grammar: {
      id: 'grammar',
      kind: 'mcq',
      dataKey: 'grammar',
      page: 'grammar.html',
      intro: 'สุ่มลำดับข้อและตัวเลือกใหม่ทุกครั้ง ตอบแล้วเห็นเฉลยพร้อมคำอธิบายทันที',
      labels: 'number',
    },
    conversations: {
      id: 'conversations',
      kind: 'mcq',
      dataKey: 'conversations',
      page: 'conversations.html',
      intro: 'แบบทดสอบความเข้าใจบริบทการสนทนา สุ่มลำดับข้อและตัวเลือกใหม่ทุกครั้ง',
      labels: 'letter',
    },
    extra: {
      id: 'extra',
      kind: 'mcq',
      dataKey: 'extra',
      page: 'extra.html',
      intro: 'ข้อสอบใหม่นอกหนังสือ แบ่งตามหัวข้อ: Phrasal verbs, Collocations, Prepositions, Word forms, ภาษาพูดในชีวิตประจำวัน และข้อผิดพลาดที่พบบ่อย',
      labels: 'number',
    },
    toeic5: {
      id: 'toeic5',
      kind: 'mcq',
      dataKey: 'toeic5',
      page: 'toeic5.html',
      intro: 'ข้อสอบ TOEIC Part 5 เติมคำให้ถูกไวยากรณ์และความหมาย 4 ตัวเลือก (A–D) ตอบแล้วเห็นเฉลยพร้อมคำอธิบาย',
      labels: 'letter',
    },
    cloze: {
      id: 'cloze',
      kind: 'cloze',
      dataKey: 'cloze',
      page: 'cloze.html',
      intro: 'อ่านบทความ แล้วเลือกคำตอบจากช่อง Dropdown ในเนื้อเรื่องให้ครบทุกช่องก่อนกดส่ง',
    },
  };

  // ---------- localStorage wrapper (never throws; keys namespaced) ----------
  const NS = 'cefr:';
  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(NS + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(NS + key, JSON.stringify(value));
        return true;
      } catch (e) {
        return false;
      }
    },
    remove(key) {
      try { localStorage.removeItem(NS + key); } catch (e) { /* ignore */ }
    },
  };

  // ---------- Small utilities ----------
  // Fisher–Yates; returns a new array.
  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const pct = (score, total) => (total ? Math.round((score / total) * 100) : 0);

  // Tiny DOM builder: h('div', {class: 'x', onclick: fn}, child, 'text', ...)
  function h(tag, props, ...kids) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props || {})) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k === 'style') Object.assign(node.style, v);
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid === undefined || kid === null || kid === false) continue;
      node.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return node;
  }

  // Text with **bold** segments → DocumentFragment (data is plain text, never HTML).
  function rich(text) {
    const frag = document.createDocumentFragment();
    String(text).split('**').forEach((part, i) => {
      if (!part) return;
      frag.append(i % 2 ? h('strong', { text: part }) : document.createTextNode(part));
    });
    return frag;
  }

  // Accessible replacement for window.confirm(); resolves true/false.
  function confirmDialog(message, opts) {
    const o = Object.assign({ okText: 'ตกลง', cancelText: 'ยกเลิก', danger: false }, opts);
    return new Promise((resolve) => {
      let settled = false;
      const dlg = h('dialog', { class: 'dialog', 'aria-label': message });
      const done = (value) => {
        if (settled) return;
        settled = true;
        dlg.close();
        dlg.remove();
        resolve(value);
      };
      dlg.append(
        h('p', { text: message }),
        h('div', { class: 'dialog-actions' },
          h('button', { class: 'btn btn-outline', type: 'button', text: o.cancelText, onclick: () => done(false) }),
          h('button', { class: 'btn' + (o.danger ? ' btn-danger' : ''), type: 'button', text: o.okText, onclick: () => done(true) })
        )
      );
      dlg.addEventListener('cancel', (e) => { e.preventDefault(); done(false); });
      document.body.append(dlg);
      dlg.showModal();
    });
  }

  const dialogOpen = () => !!document.querySelector('dialog[open]');

  // ---------- Theme toggle ----------
  function effectiveTheme() {
    const set = document.documentElement.dataset.theme;
    if (set === 'light' || set === 'dark') return set;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  const SVG_OPEN = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">';
  const ICON_SUN = SVG_OPEN + '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  const ICON_MOON = SVG_OPEN + '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';

  function syncThemeButtons() {
    const dark = effectiveTheme() === 'dark';
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      btn.innerHTML = dark ? ICON_SUN : ICON_MOON;
      btn.setAttribute('aria-label', dark ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด');
      btn.setAttribute('title', dark ? 'โหมดสว่าง' : 'โหมดมืด');
    });
  }

  function initTheme() {
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = effectiveTheme() === 'dark' ? 'light' : 'dark';
        document.documentElement.dataset.theme = next;
        try { localStorage.setItem('cefr:theme', next); } catch (e) { /* ignore */ }
        syncThemeButtons();
      });
    });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', syncThemeButtons);
    syncThemeButtons();
  }

  initTheme();

  // ---------- Section tabs (shown on every page) ----------
  // <nav class="tabs" data-section="practice"> is filled in here; the hub re-renders it when you switch tab.
  const NAV = [
    ['home', 'หน้าหลัก', 'index.html#home'],
    ['learn', 'เรียน', 'index.html#learn'],
    ['practice', 'ฝึก', 'index.html#practice'],
    ['test', 'ทดสอบ', 'index.html#test'],
    ['toeic', 'TOEIC', 'index.html#toeic'],
  ];

  // (the membership page is reached from the account area in the header, not from the tab bar)
  function renderNav(el, active) {
    el.replaceChildren(...NAV.map(([id, label, href]) => h('a', { href, text: label, 'aria-current': id === active ? 'page' : null })));
  }

  // Which screen of a page is showing ('home' | 'quiz' | 'exam' | 'summary' ...). While a question is on screen the page
  // goes into focus mode (body.focus): no tab bar, title or footer - only the question (see "Focus mode" in style.css).
  function setView(name) {
    document.body.dataset.view = name;
    document.body.classList.toggle('focus', name === 'quiz' || name === 'exam');
  }

  document.querySelectorAll('nav.tabs[data-section]').forEach((el) => renderNav(el, el.dataset.section));

  window.CEFR = { QUIZZES, store, shuffle, pct, h, rich, confirmDialog, dialogOpen, renderNav, setView };
})();
