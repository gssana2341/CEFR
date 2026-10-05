// Membership pass on the browser side – Firebase Auth version.
//
// Now uses Firebase Auth: the pass is stored in Firestore (server-side).
// When logged in, /api/pass is called with the Firebase ID token.
// Legacy signed tokens are still supported for backward compatibility and migration.
//
// Features are named strings. Which ones need a membership is set in assets/data/billing.js:
//   'exam' · 'markup' · 'practice:<set id>' · 'lesson:<A1|A2|B1|B2>'
//   CEFR.pass.allows(f)    true when billing is off, the feature is free, or the pass is active
//   CEFR.pass.members(f)   true when the feature is for members (shows the "สมาชิก" tag)
//   CEFR.pass.lockPanel(f) a ready-made "members only" box
//   CEFR.pass.trial(key)   a few free looks per day at the sentence mark-up
//   CEFR.pass.setToken(t)  store a legacy pass and re-check it (backward compat)
// Note: this only hides the features in the page. The question files are plain static files, so it is a
// "soft" lock - to lock content for real it has to be served from an API instead.
(function () {
  'use strict';

  const { h } = window.CEFR;
  const KEY = 'cefr:pass';          // the signed pass (legacy)
  const EXP = 'cefr:pass:exp';      // last expiry the server confirmed (ms) - used while offline / checking
  const TRIAL = 'cefr:markup:free'; // { day, keys[] } the free mark-up looks used today
  const PENDING = 'cefr:pending';   // checkouts started on this browser: [{ id, at }] - lets us find a payment whose page was closed
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

  // ---------- check pass via API ----------
  async function check() {
    // If logged in with Firebase, use ID token; otherwise use legacy token
    const authApi = window.CEFR && window.CEFR.auth;
    const idToken = authApi ? await authApi.getToken() : '';

    if (idToken) {
      // Firebase Auth path: check via Authorization header
      try {
        const r = await fetch('/api/pass', {
          cache: 'no-store',
          headers: { Authorization: 'Bearer ' + idToken },
          signal: AbortSignal.timeout(6000),
        });
        if (r.ok) {
          const d = await r.json();
          exp = d.valid ? d.exp : 0;
          write(EXP, String(exp));
        }
      } catch { /* offline or slow: keep the last confirmed expiry */ }
    } else if (token) {
      // Legacy path: check via query parameter
      try {
        const r = await fetch('/api/pass?token=' + encodeURIComponent(token), { cache: 'no-store', signal: AbortSignal.timeout(4000) });
        if (r.ok) {
          const d = await r.json();
          exp = d.valid ? d.exp : 0;
          write(EXP, String(exp));
        }
      } catch { /* offline or slow: keep the last confirmed expiry */ }
    } else {
      exp = 0;
      write(EXP, '0');
    }
  }

  const ready = cfg().enabled ? check() : Promise.resolve();
  ready.then(() => document.dispatchEvent(new CustomEvent('cefr:pass')));

  // ---------- auto-migrate legacy token when user logs in ----------
  async function autoMigrate() {
    if (!token) return;
    const authApi = window.CEFR && window.CEFR.auth;
    if (!authApi) return;
    const idToken = await authApi.getToken();
    if (!idToken) return;
    try {
      const r = await fetch('/api/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + idToken,
        },
        body: JSON.stringify({ token }),
        signal: AbortSignal.timeout(6000),
      });
      if (r.ok) {
        const d = await r.json();
        if (d.migrated && d.exp > exp) {
          exp = d.exp;
          write(EXP, String(exp));
          document.dispatchEvent(new CustomEvent('cefr:pass'));
        }
        // Clear legacy token after successful migration
        token = '';
        write(KEY, '');
      }
    } catch { /* migration can be retried later */ }
  }

  // Listen for Firebase auth state changes
  document.addEventListener('cefr:auth', async (e) => {
    if (e.detail) {
      // User just logged in — migrate legacy token if present, then refresh pass
      await autoMigrate();
      await check();
    } else {
      // User logged out — fall back to legacy token
      token = read(KEY);
      await check();
    }
    document.dispatchEvent(new CustomEvent('cefr:pass'));
  });

  // ---------- paid but closed the page before it came back? ----------
  const pendingList = () => {
    try {
      const l = JSON.parse(read(PENDING) || '[]');
      return Array.isArray(l) ? l.filter((p) => p && typeof p.id === 'string' && Date.now() - p.at < 2 * 86_400_000) : [];
    } catch { return []; }
  };
  const addPending = (id) => write(PENDING, JSON.stringify([...pendingList().filter((p) => p.id !== id), { id, at: Date.now() }].slice(-5)));
  const clearPending = (id) => write(PENDING, JSON.stringify(pendingList().filter((p) => p.id !== id)));

  // ask the server about every checkout started here: paid ones turn into a pass, unpaid ones wait (up to 2 days)
  async function recover() {
    if (new URLSearchParams(location.search).has('session_id')) return;   // the pricing page is claiming right now
    const list = pendingList();
    if (!list.length) return;
    const keep = [];
    let got = false;

    // Build auth header if available
    const authApi = window.CEFR && window.CEFR.auth;
    const idToken = authApi ? await authApi.getToken() : '';
    const headers = { 'Cache-Control': 'no-store' };
    if (idToken) headers.Authorization = 'Bearer ' + idToken;

    for (const p of list) {
      try {
        const r = await fetch('/api/claim?session_id=' + encodeURIComponent(p.id), {
          cache: 'no-store',
          headers,
          signal: AbortSignal.timeout(6000),
        });
        if (r.ok) {
          const d = await r.json();
          if (d.exp > exp) { token = d.token; exp = d.exp; write(KEY, token); write(EXP, String(exp)); got = true; }
        } else if (r.status === 402 || r.status >= 500) keep.push(p);      // not paid yet / server busy: try again later
      } catch { keep.push(p); }
    }
    write(PENDING, JSON.stringify(keep));
    if (got) {
      document.dispatchEvent(new CustomEvent('cefr:pass'));
      document.dispatchEvent(new CustomEvent('cefr:recovered'));
    }
  }
  ready.then(recover);

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
    const root = h('section', { class: 'panel lock-panel' });

    function render() {
      const authApi = window.CEFR && window.CEFR.auth;
      const isLoggedIn = authApi && authApi.user();

      root.replaceChildren(
        h('p', { class: 'eyebrow', text: 'สำหรับสมาชิก' }),
        h('h2', { class: 'lock-title', text: o.title || nameOf(feature) }),
        h('p', { class: 'lead', text: o.text || 'ส่วนนี้เปิดให้สมาชิก เลือกแพ็กเกจตั้งแต่ 1 วัน (20 บาท) แล้วใช้ได้ทุกอย่างทันที' }),
        h('div', { class: 'btn-row' },
          !isLoggedIn && h('button', {
            class: 'btn', type: 'button', text: 'เข้าสู่ระบบ',
            onclick: () => authApi && authApi.showLogin(),
          }),
          h('a', { class: isLoggedIn ? 'btn' : 'btn btn-outline', href: 'pricing.html?need=' + encodeURIComponent(feature), text: 'ดูแพ็กเกจ' }),
          h('a', { class: 'btn btn-outline', href: o.freeHref || 'index.html#home', text: o.freeText || 'กลับหน้าหลัก' })
        )
      );
    }

    render();
    document.addEventListener('cefr:auth', render);
    return root;
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
    addPending,
    clearPending,
    trialLeft() { return Math.max(0, trialLimit() - trialState().keys.length); },
    // Re-check pass (called after login/logout)
    recheck: check,
  };

  // the "สมาชิก" tab is only added when selling is on
  if (cfg().enabled) document.querySelectorAll('nav.tabs[data-section]').forEach((el) => window.CEFR.renderNav(el, el.dataset.section));
})();
