// Home page: progressive enhancement. The rows and links are already in index.html;
// this fills in live counts and the learner's saved progress from localStorage.
(function () {
  'use strict';

  const { QUIZZES, store, pct } = window.CEFR;
  const D = window.CEFR_DATA;

  function mcqInfo(meta) {
    const parts = [D[meta.dataKey].length + ' ข้อ'];
    let cta = 'เริ่มทำ';

    const state = store.get(meta.id + ':state', null);
    if (state && Array.isArray(state.items) && state.items.length) {
      const answered = state.items.filter((it) => it && it.pick !== null).length;
      parts.push('ทำค้างอยู่ ' + answered + '/' + state.items.length);
      cta = 'ทำต่อ';
    }
    const stats = store.get(meta.id + ':stats', null);
    if (stats && stats.best) parts.push('ดีที่สุด ' + pct(stats.best.score, stats.best.total) + '%');
    const wrong = store.get(meta.id + ':wrong', []);
    if (Array.isArray(wrong) && wrong.length) parts.push('ยังไม่แม่น ' + wrong.length);
    return { parts, cta };
  }

  function clozeInfo(meta) {
    const passages = D[meta.dataKey];
    const blanks = passages.reduce((sum, p) => sum + p.blanks.length, 0);
    const parts = [passages.length + ' บทความ', blanks + ' ช่องว่าง'];
    let cta = 'เริ่มทำ';

    const state = store.get('cloze:state', null);
    if (state && Array.isArray(state.order) && state.order.length) {
      parts.push('ทำค้างอยู่ ' + state.index + '/' + state.order.length);
      cta = 'ทำต่อ';
    }
    const best = store.get('cloze:best', {});
    const done = Object.keys(best || {}).filter((i) => passages[i]).length;
    if (done) parts.push('เคยทำแล้ว ' + done + '/' + passages.length + ' บท');
    return { parts, cta };
  }

  document.querySelectorAll('.hub-row[data-quiz]').forEach((row) => {
    const meta = QUIZZES[row.dataset.quiz];
    if (!meta || !D[meta.dataKey]) return;
    const info = meta.kind === 'cloze' ? clozeInfo(meta) : mcqInfo(meta);
    row.querySelector('[data-stats]').textContent = info.parts.join(' · ');
    row.querySelector('[data-cta]').textContent = info.cta;
  });
})();
