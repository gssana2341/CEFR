// /tenses — the 12 tenses on one page: summary grid (3 × 4) first, then every tense as a card grouped by time (past, present, future).
(function () {
  'use strict';

  const { h } = window.CEFR;
  const { tenseGrid, tenseDetail, GROUPS } = window.CEFR.markup;
  const list = window.CEFR_DATA.tenses;
  const root = document.getElementById('app');
  const EN = { past: 'Past', present: 'Present', future: 'Future' };

  root.replaceChildren(
    h('p', { class: 'lead', text: 'สูตร กฎการใช้ และคำบอกเวลาของทั้ง 12 tenses คลิกช่องในตารางเพื่อไปที่ tense นั้น หรือคลิกคำภาษาอังกฤษเพื่อดูคำแปล' }),
    tenseGrid(null, true),
    ...GROUPS.map(([grp, th]) => h('section', { class: 'tense-group g-' + grp },
      h('h2', { class: 'group-title' }, th, ' ', h('span', { class: 'light', text: EN[grp] })),
      h('div', { class: 'tense-list' }, list.filter((t) => t.group === grp).map((t) => h('article', { class: 'tense-section g-' + grp, id: t.id },
        h('header', { class: 'tense-head' },
          h('h3', {}, t.en, ' ', h('span', { class: 'light', text: t.th })),
          h('span', { class: 'tense-formula', text: t.short })),
        tenseDetail(t))))))
  );

  // scroll to the tense in the URL hash (the grid cells and the feedback card link here)
  function jump() {
    const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (el && el.classList.contains('tense-section')) el.scrollIntoView({ block: 'start' });
  }
  window.addEventListener('hashchange', jump);
  jump();
  // the browser may restore its own scroll position, and the web font moves the sections: jump again once both are settled
  window.addEventListener('load', () => setTimeout(jump, 0), { once: true });
  if (document.fonts && document.fonts.status !== 'loaded') document.fonts.ready.then(jump);
})();
