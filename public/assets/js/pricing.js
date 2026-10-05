// /pricing — pick a plan, pay on Stripe's page, come back with ?session_id= and get the pass.
(function () {
  'use strict';

  const { h } = window.CEFR;
  const pass = window.CEFR.pass;
  const root = document.getElementById('app');
  const params = new URLSearchParams(location.search);

  const D = window.CEFR_DATA;
  const premium = (D.billing || {}).premium || {};
  const SETS = { grammar: 'Grammar', conversations: 'Conversations', cloze: 'Cloze Test', extra: 'ฝึกเพิ่มเติม' };
  const lessonCount = (levels) => (D.lessons || []).filter((l) => levels.includes(l.level)).length;
  const freeLevels = ['A1', 'A2', 'B1', 'B2'].filter((lv) => !(premium.lessonLevels || []).includes(lv));

  // what the visitor gets for free / with a membership (built from assets/data/billing.js so it never goes stale)
  function lists() {
    const member = [];
    const free = [];
    const sets = (premium.practice || []).map((id) => SETS[id] || id);
    const freeSets = Object.keys(SETS).filter((id) => !(premium.practice || []).includes(id)).map((id) => SETS[id]);
    if (sets.length) member.push('ฝึกทำข้อสอบเพิ่ม: ' + sets.join(' · '));
    if ((premium.lessonLevels || []).length) member.push('บทเรียนระดับ ' + premium.lessonLevels.join(' · ') + ' (' + lessonCount(premium.lessonLevels) + ' บท)');
    if (premium.exam) member.push('สอบจำลองแบบจับเวลา (EF SET / ยืดหยุ่น)');
    if (premium.markup) member.push('เส้นโยงบนประโยคและสูตร tense ไม่จำกัด');
    if (freeSets.length) free.push('ฝึกทำข้อสอบ: ' + freeSets.join(' · '));
    if (freeLevels.length) free.push('บทเรียนระดับ ' + freeLevels.join(' · ') + ' (' + lessonCount(freeLevels) + ' บท)');
    free.push('ทดสอบระดับ CEFR (ปรับความยากอัตโนมัติ)', 'สรุป 12 tenses', 'คลิกคำเพื่อแปล');
    if (premium.markup && premium.markupFreePerDay) free.push('ดูเส้นโยงบนประโยคฟรีวันละ ' + premium.markupFreePerDay + ' ข้อ');
    return { member, free };
  }

  function needText(n) {
    if (!n) return '';
    if (n === 'exam') return 'สอบจำลอง';
    if (n === 'markup') return 'เส้นโยงบนประโยคและสูตร tense';
    if (n.startsWith('practice:')) return 'ชุดฝึก ' + (SETS[n.slice(9)] || n.slice(9));
    if (n.startsWith('lesson:')) return 'บทเรียนระดับ ' + n.slice(7);
    return '';
  }
  const fmtDate = (ms) => new Date(ms).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  const setView = (...nodes) => root.replaceChildren(...nodes.flat(Infinity).filter(Boolean));
  const getJson = (url) => fetch(url, { cache: 'no-store' }).then((r) => r.json().then((d) => ({ ok: r.ok, status: r.status, d })));

  // ---------- coming back from the payment page ----------
  async function claim(sessionId) {
    setView(h('p', { class: 'lead', text: 'กำลังยืนยันการชำระเงิน…' }));
    let out;
    try { out = await getJson('/api/claim?session_id=' + encodeURIComponent(sessionId)); } catch { out = null; }
    if (!out || !out.ok) {
      const unpaid = out && out.status === 402;
      setView(
        h('p', { class: 'lead', text: unpaid ? 'ยังไม่เห็นการชำระเงิน — ถ้าเพิ่งโอน รอสักครู่แล้วลองใหม่' : 'ยืนยันไม่สำเร็จ ลองรีเฟรชหน้านี้อีกครั้ง' }),
        h('div', { class: 'btn-row' },
          h('button', { class: 'btn', type: 'button', text: 'ลองอีกครั้ง', onclick: () => claim(sessionId) }),
          h('a', { class: 'btn btn-outline', href: 'pricing.html', text: 'กลับหน้าแพ็กเกจ' })));
      return;
    }
    await pass.setToken(out.d.token);
    history.replaceState(null, '', 'pricing.html');
    setView(
      h('div', { class: 'resume' },
        h('p', { text: 'ชำระเงินเรียบร้อย — เป็นสมาชิกถึง ' + fmtDate(out.d.exp) + ' (เหลือ ' + pass.daysLeft() + ' วัน)' }),
        h('div', { class: 'btn-row' }, h('a', { class: 'btn', href: 'index.html#home', text: 'เริ่มใช้งาน' }))),
      codeBox());
  }

  // ---------- the member code (to move to another device) ----------
  function codeBox() {
    const input = h('input', { class: 'input', type: 'text', placeholder: 'วางรหัสสมาชิกที่นี่', autocomplete: 'off', spellcheck: 'false' });
    const msg = h('p', { class: 'card-meta', 'aria-live': 'polite' });
    const mine = pass.token();
    return h('details', { class: 'band-details' },
      h('summary', { text: 'ย้ายเครื่อง / ใช้รหัสสมาชิก' }),
      h('p', { class: 'card-meta', text: 'สมาชิกเก็บอยู่ในเบราว์เซอร์นี้ ถ้าเปลี่ยนเครื่องให้คัดลอกรหัสไปใส่ในเครื่องใหม่' }),
      mine && h('div', { class: 'btn-row' },
        h('button', { class: 'btn btn-outline btn-sm', type: 'button', text: 'คัดลอกรหัสของฉัน', onclick: async (e) => {
          try { await navigator.clipboard.writeText(mine); e.target.textContent = 'คัดลอกแล้ว'; } catch { msg.textContent = 'คัดลอกไม่ได้ — ลองกดค้างที่รหัสด้านล่าง'; msg.append(h('code', { text: mine })); }
        } })),
      h('div', { class: 'btn-row', style: { marginTop: '12px' } }, input,
        h('button', { class: 'btn btn-sm btn-outline', type: 'button', text: 'ใช้รหัส', onclick: async () => {
          if (!input.value.trim()) return;
          const ok = await pass.setToken(input.value);
          msg.textContent = ok ? 'ใช้รหัสสำเร็จ — เป็นสมาชิกถึง ' + fmtDate(pass.exp()) : 'รหัสนี้ใช้ไม่ได้หรือหมดอายุแล้ว';
          if (ok) setTimeout(show, 900);
        } })),
      msg);
  }

  // ---------- the plans ----------
  async function buy(plan, button) {
    button.disabled = true;
    button.textContent = 'กำลังไปหน้าชำระเงิน…';
    try {
      const r = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: plan.id, token: pass.token() }),
      });
      const d = await r.json();
      if (!r.ok || !d.url) throw new Error(d.error || 'failed');
      location.href = d.url;
    } catch {
      button.disabled = false;
      button.textContent = 'ซื้อ';
      window.alert('เปิดหน้าชำระเงินไม่สำเร็จ ลองใหม่อีกครั้ง');
    }
  }

  function planCard(p, ready) {
    const btn = h('button', { class: 'btn', type: 'button', text: ready ? 'ซื้อ' : 'ยังไม่เปิดขาย', disabled: !ready });
    btn.addEventListener('click', () => buy(p, btn));
    return h('article', { class: 'card plan' },
      h('div', { class: 'plan-main' },
        h('h2', { class: 'card-title', text: p.days + ' วัน' }),
        h('p', { class: 'card-meta', text: 'วันละ ' + (p.baht / p.days).toFixed(p.baht % p.days ? 1 : 0) + ' บาท' })),
      h('p', { class: 'plan-price' }, String(p.baht), h('span', { class: 'light', text: ' บาท' })),
      btn);
  }

  async function show() {
    let info = null;
    try { info = (await getJson('/api/plans')).d; } catch { /* static preview without the API */ }
    const ready = Boolean(info && info.ready);
    const need = needText(params.get('need'));
    const { member, free } = lists();
    const active = pass.active();

    setView(
      need && h('p', { class: 'notice', text: need + ' สำหรับสมาชิก — เลือกแพ็กเกจด้านล่าง' }),
      active
        ? h('p', { class: 'lead', text: 'คุณเป็นสมาชิกถึง ' + fmtDate(pass.exp()) + ' (เหลือ ' + pass.daysLeft() + ' วัน) · ซื้อเพิ่มได้ วันจะต่อท้ายให้' })
        : h('p', { class: 'lead', text: 'เลือกแพ็กเกจ ใช้ได้ครบทุกอย่างตามจำนวนวัน ซื้อเพิ่มตอนไหนก็ได้' }),
      h('div', { class: 'stack' }, info ? info.plans.map((p) => planCard(p, ready)) : h('p', { class: 'card-meta', text: 'โหลดแพ็กเกจไม่ได้ในตอนนี้' })),
      h('div', { class: 'plan-lists' },
        h('div', {}, h('h3', { class: 'plan-h', text: 'สมาชิกได้เพิ่ม' }), h('ul', { class: 'rules' }, member.map((f) => h('li', { text: f })))),
        h('div', {}, h('h3', { class: 'plan-h', text: 'ใช้ฟรีได้เสมอ' }), h('ul', { class: 'rules' }, free.map((f) => h('li', { text: f }))))),
      h('p', { class: 'fine-print', text: 'ชำระผ่าน PromptPay หรือบัตร (หน้าชำระเงินของ Stripe) เว็บนี้ไม่เก็บข้อมูลบัตรของคุณ' }),
      codeBox());
  }

  const sid = params.get('session_id');
  if (sid) claim(sid); else show();
})();
