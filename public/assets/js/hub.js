// Home page: progressive enhancement. The cards and links are already in index.html;
// this fills in live counts and the learner's saved progress from localStorage.
(function () {
  'use strict';

  const { QUIZZES, store, pct, h } = window.CEFR;
  const D = window.CEFR_DATA;

  function pill(text, cls) {
    return h('span', { class: 'pill' + (cls ? ' ' + cls : ''), text });
  }

  function mcqInfo(meta) {
    const total = D[meta.dataKey].length;
    const pills = [pill(total + ' ข้อ')];
    let cta = 'เริ่มทำข้อสอบ';

    const state = store.get(meta.id + ':state', null);
    if (state && Array.isArray(state.items) && state.items.length) {
      const answered = state.items.filter((it) => it && it.pick !== null).length;
      pills.push(pill('ทำค้างอยู่ ' + answered + '/' + state.items.length, 'good'));
      cta = 'ทำต่อจากเดิม';
    }
    const stats = store.get(meta.id + ':stats', null);
    if (stats && stats.best) pills.push(pill('ดีที่สุด ' + pct(stats.best.score, stats.best.total) + '%'));
    const wrong = store.get(meta.id + ':wrong', []);
    if (Array.isArray(wrong) && wrong.length) pills.push(pill('ข้อที่ยังไม่แม่น ' + wrong.length, 'warn'));
    return { pills, cta };
  }

  function clozeInfo(meta) {
    const passages = D[meta.dataKey];
    const blanks = passages.reduce((sum, p) => sum + p.blanks.length, 0);
    const pills = [pill(passages.length + ' บทความ'), pill(blanks + ' ช่องว่าง')];
    let cta = 'เริ่มทำข้อสอบ';

    const state = store.get('cloze:state', null);
    if (state && Array.isArray(state.order) && state.order.length) {
      pills.push(pill('ทำค้างอยู่ ' + state.index + '/' + state.order.length, 'good'));
      cta = 'ทำต่อจากเดิม';
    }
    const best = store.get('cloze:best', {});
    const done = Object.keys(best || {}).filter((i) => passages[i]).length;
    if (done) pills.push(pill('เคยทำแล้ว ' + done + '/' + passages.length + ' บท'));
    return { pills, cta };
  }

  document.querySelectorAll('.hub-card[data-quiz]').forEach((card) => {
    const meta = QUIZZES[card.dataset.quiz];
    if (!meta || !D[meta.dataKey]) return;
    const info = meta.kind === 'cloze' ? clozeInfo(meta) : mcqInfo(meta);
    card.querySelector('[data-stats]').replaceChildren(...info.pills);
    card.querySelector('[data-cta]').textContent = info.cta;
  });
})();
