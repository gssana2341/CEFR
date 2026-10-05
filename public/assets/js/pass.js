// Membership pass on the browser side: keeps the token, asks /api/pass if it is still valid,
// and tells the rest of the site whether a premium feature is allowed.
//
// Features are named strings. Which ones need a membership is set in assets/data/billing.js:
//   'exam' · 'markup' · 'practice:<set id>' · 'lesson:<A1|A2|B1|B2>'
//   CEFR.pass.allows(f)    true when billing is off, the feature is free, or the pass is active
//   CEFR.pass.members(f)   true when the feature is for members (shows the "สมาชิก" tag)
//   CEFR.pass.lockPanel(f) a ready-made "members only" box
//   CEFR.pass.trial(key)   a few free looks per day at the sentence mark-up
//   CEFR.pass.setToken(t)  store a pass (after paying or typing a code) and re-check it
// Note: this only hides the features in the page. The question files are plain static files, so it is a
// "soft" lock - to lock content for real it has to be served from an API instead.
(function () {
  'use strict';

  const { h } = window.CEFR;
  const KEY = 'cefr:pass';          // the signed pass
  const EXP = 'cefr:pass:exp';      // last expiry the server confirmed (ms) - used while offline / checking
  const TRIAL = 'cefr:markup:free'; // { day, keys[] } the free mark-up looks used today
  const cfg = () => (window.CEFR_DATA && window.CEFR_DATA.billing) || {};
  const read = (k) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
  const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } };

  let token = read(KEY);
  let exp = Number(read(EXP)) || 0;

  // is this feature on the members-only list?
  function members(feature) {
    const c = cfg();
    if (!c.enabled) return false;
    const p = c.premium || {};
    if (String(feature).startsWith('practice:')) return (p.practice || []).includes(feature.slice(9));
    if (String(feature).startsWith('lesson:')) return (p.lessonLevels || []).includes(feature.slice(7));
    return Boolean(p[feature]);
  }
  const active = () => exp > Date.now();
  const allows = (feature) => !members(feature) || active();

  async function check() {
    if (!token) { exp = 0; write(EXP, '0'); return; }
    try {
      const r = await fetch('/api/pass?token=' + encodeURIComponent(token), { cache: 'no-store', signal: AbortSignal.timeout(4000) });
      if (r.ok) {
        const d = await r.json();
        exp = d.valid ? d.exp : 0;
        write(EXP, String(exp));
      }
    } catch { /* offline or slow: keep the last confirmed expiry */ }
  }

  const ready = cfg().enabled ? check() : Promise.resolve();
  ready.then(() => document.dispatchEvent(new CustomEvent('cefr:pass')));

  // ---------- "members only" box ----------
  const WHAT = {
    exam: 'สอบจำลอง',
    markup: 'เส้นโยงบนประโยคและสูตร tense',
  };
  function nameOf(feature) {
    if (WHAT[feature]) return WHAT[feature];
    if (String(feature).startsWith('practice:')) {
      const NAMES = { grammar: 'Grammar', conversations: 'Conversations', cloze: 'Cloze Test', extra: 'ฝึกเพิ่มเติม' };
      return 'ชุดฝึก ' + (NAMES[feature.slice(9)] || feature.slice(9));
    }
    if (String(feature).startsWith('lesson:')) return 'บทเรียนระดับ ' + feature.slice(7);
    return feature;
  }

  function lockPanel(feature, opts) {
    const o = opts || {};
    return h('section', { class: 'panel lock-panel' },
      h('p', { class: 'eyebrow', text: 'สำหรับสมาชิก' }),
      h('h2', { class: 'lock-title', text: o.title || nameOf(feature) }),
      h('p', { class: 'lead', text: o.text || 'ส่วนนี้เปิดให้สมาชิก เลือกแพ็กเกจตั้งแต่ 1 วัน (20 บาท) แล้วใช้ได้ทุกอย่างทันที' }),
      h('div', { class: 'btn-row' },
        h('a', { class: 'btn', href: 'pricing.html?need=' + encodeURIComponent(feature), text: 'ดูแพ็กเกจ' }),
        h('a', { class: 'btn btn-outline', href: o.freeHref || 'index.html#home', text: o.freeText || 'กลับหน้าหลัก' })),
      active() ? null : h('p', { class: 'fine-print', text: 'มีรหัสสมาชิกอยู่แล้ว? ใส่ที่หน้าแพ็กเกจ (ย้ายเครื่อง / ใช้รหัสสมาชิก)' }));
  }

  // ---------- a few free looks at the mark-up each day ----------
  const today = () => new Date().toISOString().slice(0, 10);
  function trialState() {
    try {
      const s = JSON.parse(read(TRIAL) || 'null');
      if (s && s.day === today() && Array.isArray(s.keys)) return s;
    } catch { /* corrupted: start over */ }
    return { day: today(), keys: [] };
  }
  const trialLimit = () => Math.max(0, Number((cfg().premium || {}).markupFreePerDay) || 0);

  window.CEFR.pass = {
    allows,
    members,
    ready,
    lockPanel,
    token: () => token,
    exp: () => exp,
    active,
    daysLeft: () => Math.max(0, Math.ceil((exp - Date.now()) / 86_400_000)),
    async setToken(t) { token = String(t || '').trim(); write(KEY, token); await check(); return exp > Date.now(); },
    // → { ok, left }: may this question's mark-up be shown for free? (looking again at the same one costs nothing)
    trial(key) {
      const s = trialState();
      if (s.keys.includes(key)) return { ok: true, left: trialLimit() - s.keys.length };
      if (s.keys.length >= trialLimit()) return { ok: false, left: 0 };
      s.keys.push(key);
      write(TRIAL, JSON.stringify(s));
      return { ok: true, left: trialLimit() - s.keys.length };
    },
    trialLeft() { return Math.max(0, trialLimit() - trialState().keys.length); },
  };

  // the "สมาชิก" tab is only added when selling is on
  if (cfg().enabled) document.querySelectorAll('nav.tabs[data-section]').forEach((el) => window.CEFR.renderNav(el, el.dataset.section));
})();
