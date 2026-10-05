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

  function syncThemeButtons() {
    const dark = effectiveTheme() === 'dark';
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      btn.textContent = dark ? '☀️' : '🌙';
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

  window.CEFR = { QUIZZES, store, shuffle, pct, h, rich, confirmDialog, dialogOpen };
})();
