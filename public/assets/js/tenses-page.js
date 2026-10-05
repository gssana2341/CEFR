// /tenses — the 12 tenses on one page: summary grid (3 × 4) + formula, rules and signal words for each.
(function () {
  'use strict';

  const { h } = window.CEFR;
  const { tenseGrid, tenseDetail } = window.CEFR.markup;
  const list = window.CEFR_DATA.tenses;
  const root = document.getElementById('app');

  root.replaceChildren(
    h('p', { class: 'lead', text: 'สรุป 12 tenses พร้อมสูตร (บอกเล่า / ปฏิเสธ / คำถาม) กฎการใช้ และคำบอกเวลาที่ช่วยให้ตอบข้อสอบได้ไว คลิกช่องในตารางเพื่อไปที่ tense นั้น' }),
    h('p', { class: 'fine-print', style: { marginTop: '-16px', marginBottom: '20px' }, text: 'คลิกคำภาษาอังกฤษหรือลากคลุมข้อความเพื่อดูคำแปลได้ (ปุ่ม "แปล" มุมขวาบนใช้เปิด/ปิด)' }),
    h('h2', { class: 'section-title', style: { marginTop: '0' }, text: 'ตารางสรุป' }),
    tenseGrid(null, true),
    h('h2', { class: 'section-title', text: 'รายละเอียดแต่ละ tense' }),
    ...list.map((t) => h('article', { class: 'tense-section', id: t.id },
      h('h2', {}, t.en + ' ', h('span', { class: 'light', text: t.th })),
      tenseDetail(t)))
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
