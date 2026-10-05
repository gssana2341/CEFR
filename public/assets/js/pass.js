// Membership pass on the browser side: keeps the token, asks /api/pass if it is still valid,
// and tells the rest of the site whether a premium feature is allowed.
//   CEFR.pass.allows('exam')   → true when billing is off, the feature is free, or the pass is active
//   CEFR.pass.setToken(t)      → store a pass (after paying or typing a code) and re-check it
// Note: this only hides the features in the page. The question files are plain static files, so it is a
// "soft" lock - to lock content for real it has to be served from an API instead.
(function () {
  'use strict';

  const KEY = 'cefr:pass';          // the signed pass
  const EXP = 'cefr:pass:exp';      // last expiry the server confirmed (ms) - used while offline / checking
  const cfg = () => (window.CEFR_DATA && window.CEFR_DATA.billing) || {};
  const read = (k) => { try { return localStorage.getItem(k) || ''; } catch { return ''; } };
  const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } };

  let token = read(KEY);
  let exp = Number(read(EXP)) || 0;

  const allows = (feature) => {
    const c = cfg();
    if (!c.enabled || !(c.premium || {})[feature]) return true;
    return exp > Date.now();
  };

  async function check() {
    if (!token) { exp = 0; write(EXP, '0'); return; }
    try {
      const r = await fetch('/api/pass?token=' + encodeURIComponent(token), { cache: 'no-store' });
      if (r.ok) {
        const d = await r.json();
        exp = d.valid ? d.exp : 0;
        write(EXP, String(exp));
      }
    } catch { /* offline: keep the last confirmed expiry */ }
  }

  const ready = cfg().enabled ? check() : Promise.resolve();
  ready.then(() => document.dispatchEvent(new CustomEvent('cefr:pass')));

  window.CEFR.pass = {
    allows,
    ready,
    token: () => token,
    exp: () => exp,
    active: () => exp > Date.now(),
    daysLeft: () => Math.max(0, Math.ceil((exp - Date.now()) / 86_400_000)),
    async setToken(t) { token = String(t || '').trim(); write(KEY, token); await check(); return exp > Date.now(); },
  };

  // the "สมาชิก" tab is only added when selling is on
  if (cfg().enabled) document.querySelectorAll('nav.tabs[data-section]').forEach((el) => window.CEFR.renderNav(el, el.dataset.section));
})();
