// "มีอะไรใหม่": a pop-up for each new update + a bell in the header to read the history any time.
// The entries are in assets/data/changelog.js (newest first). What the visitor has already seen is remembered on this device.
//   - the pop-up opens by itself once per new entry, only on the home page (never while answering questions)
//   - the bell has a dot while there is something unread
(function () {
  'use strict';

  const { h, store } = window.CEFR;
  const log = (window.CEFR_DATA && window.CEFR_DATA.changelog) || [];
  if (!log.length) return;

  const KEY = 'ui:seen-update';
  const latest = log[0].id;
  const unread = () => store.get(KEY, null) !== latest;
  const TAGS = { 'ใหม่': 'new', 'ปรับปรุง': 'better', 'ปลอดภัย': 'safe', 'เร็วๆ นี้': 'soon' };

  let dlg = null;
  let bell = null;

  // mark as read right when it is closed by a button (the 'close' event covers Esc); do not wait for an event
  function dismiss() {
    markSeen();
    if (dlg && dlg.open) dlg.close();
  }

  function markSeen() {
    store.set(KEY, latest);
    if (bell) bell.classList.remove('has-new');
  }

  function itemList(items) {
    return h('ul', { class: 'upd-list' }, items.map((it, i) => {
      const li = h('li', { class: 'upd-item' },
        h('span', { class: 'upd-tag upd-' + (TAGS[it.tag] || 'new'), text: it.tag }),
        h('div', {}, h('p', { class: 'upd-title', text: it.title }), h('p', { class: 'upd-text', text: it.text })));
      li.style.setProperty('--i', String(i));
      return li;
    }));
  }

  function latestView() {
    const e = log[0];
    return [
      h('p', { class: 'upd-date', text: e.date }),
      h('h2', { class: 'upd-h', id: 'upd-h', text: e.title }),
      e.summary && h('p', { class: 'upd-sum', text: e.summary }),
      itemList(e.items),
    ];
  }

  function historyView() {
    return [
      h('h2', { class: 'upd-h', id: 'upd-h', text: 'ประวัติการอัปเดต' }),
      h('div', { class: 'upd-history' }, log.map((e, i) => h('details', { class: 'upd-entry', open: i === 0 ? true : null },
        h('summary', {}, h('span', { class: 'upd-entry-title', text: e.title }), h('span', { class: 'upd-entry-date', text: e.date })),
        e.summary && h('p', { class: 'upd-sum', text: e.summary }),
        itemList(e.items)))),
    ];
  }

  function render(view) {
    const body = h('div', { class: 'upd-body' }, view === 'history' ? historyView() : latestView());
    const tabs = h('div', { class: 'upd-tabs', role: 'tablist' },
      [['latest', 'ล่าสุด'], ['history', 'ประวัติทั้งหมด']].map(([id, label]) => h('button', {
        class: 'upd-tab', type: 'button', role: 'tab', 'aria-selected': String(view === id), text: label, onclick: () => render(id),
      })));
    dlg.replaceChildren(
      h('div', { class: 'upd-glow', 'aria-hidden': 'true' }),
      h('button', { class: 'upd-close', type: 'button', 'aria-label': 'ปิด', text: '×', onclick: dismiss }),
      h('div', { class: 'upd-top' }, h('span', { class: 'upd-badge', text: 'มีอะไรใหม่' }), tabs),
      body,
      h('div', { class: 'upd-foot' },
        h('button', { class: 'btn btn-block', type: 'button', text: 'เริ่มเลย', onclick: dismiss })));
  }

  function open(view) {
    if (!dlg) {
      dlg = h('dialog', { class: 'dialog upd-dialog', 'aria-labelledby': 'upd-h' });
      dlg.addEventListener('close', markSeen);
      dlg.addEventListener('click', (e) => { if (e.target === dlg) dismiss(); });      // click on the dimmed background
      document.body.append(dlg);
    }
    render(view || 'latest');
    if (!dlg.open) dlg.showModal();
  }

  // ---------- the bell ----------
  const ICON = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>';
  const bar = document.querySelector('.header-actions');
  if (bar) {
    bell = h('button', { class: 'icon-btn upd-bell' + (unread() ? ' has-new' : ''), type: 'button', 'aria-label': 'มีอะไรใหม่ / ประวัติการอัปเดต', title: 'มีอะไรใหม่', onclick: () => open(unread() ? 'latest' : 'history') });
    bell.innerHTML = ICON;
    const theme = bar.querySelector('[data-theme-toggle]');
    if (theme) bar.insertBefore(bell, theme); else bar.append(bell);
  }

  // ---------- by itself: once per new entry, on the home page only ----------
  if (document.body.dataset.page === 'hub' && unread()) {
    setTimeout(() => { if (unread() && !document.querySelector('dialog[open]')) open('latest'); }, 900);
  }

  window.CEFR.updates = { open };
})();
