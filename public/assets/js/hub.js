// Home page: progressive enhancement. The rows and links are already in index.html;
// this fills in live counts and the learner's saved progress from localStorage.
(function () {
  'use strict';

  const { QUIZZES, store, pct } = window.CEFR;
  const D = window.CEFR_DATA;

  const dateTh = (ms) => new Date(ms).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });

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

  function clozeInfo() {
    const passages = D.cloze;
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

  function placementInfo() {
    const parts = [D.placement.length + ' ข้อ', '4 ระดับ', '~15 นาที'];
    let cta = 'เริ่มทำ';
    if (store.get('placement:state', null)) { parts.push('ทำค้างอยู่'); cta = 'ทำต่อ'; }
    const last = store.get('placement:last', null);
    if (last && last.level) {
      parts.push('ผลล่าสุด ' + (last.level === 'pre-A1' ? 'ต่ำกว่า A1' : last.level) + ' (' + dateTh(last.at) + ')');
      if (cta === 'เริ่มทำ') cta = 'ทำอีกครั้ง';
    }
    return { parts, cta };
  }

  function learnInfo() {
    const progress = store.get('learn:progress', {});
    const done = D.lessons.filter((l) => progress[l.id] && progress[l.id].done).length;
    const parts = [D.lessons.length + ' บทเรียน', 'เรียนแล้ว ' + done + '/' + D.lessons.length];
    return { parts, cta: done ? 'เรียนต่อ' : 'เรียน' };
  }

  function examInfo() {
    const cfg = D.exam;
    const items = cfg.parts.reduce((s, p) => s + p.count, 0);
    const parts = [cfg.durationMin + ' นาที'];
    let cta = 'เริ่มสอบ';
    const state = store.get('exam:state', null);
    if (state && state.startedAt && state.startedAt + state.durationMs > Date.now()) { parts.push('กำลังสอบอยู่'); cta = 'กลับไปสอบ'; }
    const history = store.get('exam:history', []);
    if (history.length) parts.push('ล่าสุด ' + pct(history[0].score, history[0].total) + '%');
    else parts.push(cfg.parts.length + ' ส่วน');
    return { parts, cta, items };
  }

  const INFO = {
    placement: placementInfo,
    learn: learnInfo,
    exam: examInfo,
    cloze: clozeInfo,
  };

  document.querySelectorAll('.hub-row[data-quiz]').forEach((row) => {
    const id = row.dataset.quiz;
    const meta = QUIZZES[id];
    const info = INFO[id] ? INFO[id]() : meta && D[meta.dataKey] ? mcqInfo(meta) : null;
    if (!info) return;
    row.querySelector('[data-stats]').textContent = info.parts.join(' · ');
    row.querySelector('[data-cta]').textContent = info.cta;
  });
})();
