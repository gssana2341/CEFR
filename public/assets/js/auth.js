// Auth UI – adds a login/logout button to the site header and manages the Firebase Auth state.
//
// When signed in:
//   - Shows user avatar + display name (or email) + a dropdown with "ออกจากระบบ"
//   - Fires 'cefr:auth' event on document with detail { uid, email, displayName, photoURL }
//
// When signed out:
//   - Shows a "เข้าสู่ระบบ" button that opens a sign-in dialog (Google + Email/Password)
//   - Fires 'cefr:auth' event with detail null
//
// Other scripts can read the current user synchronously via CEFR.auth.user()
// and get a fresh ID token via CEFR.auth.getToken().

(function () {
  'use strict';

  const { h, confirmDialog } = window.CEFR;
  const { auth } = window.CEFR_FIREBASE;

  const billingOn = () => Boolean(window.CEFR_DATA && window.CEFR_DATA.billing && window.CEFR_DATA.billing.enabled);

  let currentUser = null;
  let idTokenCache = '';

  // ---------- public API ----------
  const api = {
    user: () => currentUser,
    /** @returns {Promise<string>} fresh Firebase ID token */
    async getToken() {
      const u = auth.currentUser;
      if (!u) return '';
      try { idTokenCache = await u.getIdToken(); } catch { /* stale is fine for a bit */ }
      return idTokenCache;
    },
    ready: new Promise((resolve) => {
      auth.onAuthStateChanged(() => resolve());
    }),
  };
  window.CEFR.auth = api;

  // ---------- render the header widget ----------
  function renderWidget(user) {
    // find every header-actions div and add/replace the auth widget
    document.querySelectorAll('.header-actions').forEach((bar) => {
      const old = bar.querySelector('.auth-widget');
      if (old) old.remove();

      const widget = h('div', { class: 'auth-widget' });

      if (user) {
        // avatar
        const photo = user.photoURL;
        const initial = (user.displayName || user.email || '?')[0].toUpperCase();
        const avatar = photo
          ? h('img', { class: 'auth-avatar', src: photo, alt: '', referrerpolicy: 'no-referrer', width: '32', height: '32' })
          : h('span', { class: 'auth-avatar auth-avatar-text', text: initial });

        // dropdown
        const menu = h('div', { class: 'auth-menu', hidden: true },
          h('p', { class: 'auth-menu-name', text: user.displayName || '' }),
          h('p', { class: 'auth-menu-email', text: user.email || '' }),
          h('hr', { class: 'auth-menu-sep' }),
          billingOn() && h('a', { class: 'auth-menu-item', href: 'pricing.html', text: 'สมาชิก / แพ็กเกจ' }),
          h('button', {
            class: 'auth-menu-item', type: 'button', text: 'ออกจากระบบ',
            onclick: async () => {
              const ok = await confirmDialog('ต้องการออกจากระบบ?');
              if (ok) auth.signOut();
            },
          }));

        const toggle = h('button', {
          class: 'auth-toggle', type: 'button', 'aria-label': 'บัญชีผู้ใช้',
          onclick: (e) => {
            e.stopPropagation();
            const show = menu.hidden;
            menu.hidden = !show;
            if (show) {
              const close = () => { menu.hidden = true; document.removeEventListener('click', close); };
              setTimeout(() => document.addEventListener('click', close), 0);
            }
          },
        }, avatar);

        if (billingOn()) widget.append(h('a', { class: 'header-link header-pill', href: 'pricing.html', text: 'สมาชิก' }));
        widget.append(toggle, menu);
      } else {
        if (billingOn()) widget.append(h('a', { class: 'header-link header-pill', href: 'pricing.html', text: 'สมาชิก' }));
        widget.append(h('button', {
          class: 'btn btn-sm btn-outline auth-login-btn', type: 'button', text: 'เข้าสู่ระบบ',
          onclick: () => showLoginDialog(),
        }));
      }

      // insert before the theme toggle
      const themeBtn = bar.querySelector('[data-theme-toggle]');
      if (themeBtn) bar.insertBefore(widget, themeBtn);
      else bar.append(widget);
    });
  }

  // ---------- login dialog ----------
  function showLoginDialog() {
    const existing = document.getElementById('auth-dialog');
    if (existing) { existing.showModal(); return; }

    const errMsg = h('p', { class: 'auth-err', 'aria-live': 'polite' });
    
    // Google button
    const googleBtn = h('button', {
      class: 'btn btn-outline btn-block auth-google', type: 'button',
      onclick: async () => {
        errMsg.textContent = '';
        googleBtn.disabled = true;
        googleBtn.textContent = 'กำลังดำเนินการ…';
        try {
          const provider = new firebase.auth.GoogleAuthProvider();
          await auth.signInWithPopup(provider);
          dlg.close();
        } catch (e) {
          if (e.code !== 'auth/popup-closed-by-user') errMsg.textContent = friendlyError(e.code);
        } finally {
          googleBtn.disabled = false;
          googleBtn.textContent = 'เข้าสู่ระบบด้วย Google';
          // Re-insert icon after text change
          googleBtn.prepend(gIcon);
        }
      },
    },
      h('svg', { class: 'auth-google-icon', viewBox: '0 0 48 48', width: '18', height: '18', 'aria-hidden': 'true' }),
      'เข้าสู่ระบบด้วย Google');

    const form = h('div', { class: 'auth-form' },
      h('h2', { class: 'auth-title', text: 'เข้าสู่ระบบ' }),
      h('p', { class: 'auth-desc', text: 'เข้าสู่ระบบด้วย Google เพื่อเก็บสิทธิ์สมาชิกอย่างปลอดภัย ไม่หายแม้เปลี่ยนเครื่อง' }),
      googleBtn,
      errMsg
    );

    // draw the google "G" icon via SVG path
    const gIcon = form.querySelector('.auth-google-icon');
    gIcon.innerHTML = '<path fill="#4285F4" d="M44.5 24.3c0-1.6-.1-3.1-.4-4.6H24v8.7h11.5c-.5 2.7-2 5-4.2 6.5v5.4h6.8c4-3.7 6.4-9.1 6.4-16z"/><path fill="#34A853" d="M24 48c5.7 0 10.5-1.9 14-5.2l-6.8-5.4c-1.9 1.3-4.3 2-7.2 2-5.5 0-10.2-3.7-11.9-8.7H5v5.5C8.4 42.8 15.7 48 24 48z"/><path fill="#FBBC05" d="M12.1 30.6A14.6 14.6 0 0 1 11.2 24c0-2.3.4-4.5 1-6.6V12H5A24 24 0 0 0 5 36l7.1-5.5z"/><path fill="#EA4335" d="M24 9.5c3.1 0 5.9 1.1 8.1 3.2l6.1-6.1C34.5 3.1 29.7 0 24 0 15.7 0 8.4 5.2 5 12.8l7.1 5.5c1.7-5 6.4-8.7 11.9-8.7z"/>';

    const dlg = h('dialog', { class: 'dialog auth-dialog', id: 'auth-dialog' },
      h('button', {
        class: 'auth-close', type: 'button', 'aria-label': 'ปิด',
        onclick: () => dlg.close(),
      }, '✕'),
      form);

    dlg.addEventListener('cancel', (e) => { e.preventDefault(); dlg.close(); });
    document.body.append(dlg);
    dlg.showModal();
  }

  function friendlyError(code) {
    const MAP = {
      'auth/invalid-email': 'รูปแบบอีเมลไม่ถูกต้อง',
      'auth/user-disabled': 'บัญชีนี้ถูกระงับ',
      'auth/user-not-found': 'ไม่พบบัญชีนี้ — ลองสมัครสมาชิก',
      'auth/wrong-password': 'รหัสผ่านไม่ถูกต้อง',
      'auth/invalid-credential': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
      'auth/email-already-in-use': 'อีเมลนี้มีบัญชีอยู่แล้ว — ลองเข้าสู่ระบบ',
      'auth/weak-password': 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
      'auth/too-many-requests': 'เข้าสู่ระบบผิดหลายครั้ง ลองใหม่ทีหลัง',
      'auth/network-request-failed': 'เชื่อมต่อไม่ได้ ตรวจสอบอินเทอร์เน็ต',
      'auth/popup-blocked': 'เบราว์เซอร์บล็อก popup — ลองอนุญาต popup แล้วกดอีกครั้ง',
    };
    return MAP[code] || 'เกิดข้อผิดพลาด กรุณาลองใหม่';
  }

  // ---------- auth state listener ----------
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      currentUser = { uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL };
      try { idTokenCache = await user.getIdToken(); } catch { /* ok */ }
    } else {
      currentUser = null;
      idTokenCache = '';
    }
    renderWidget(currentUser);
    document.dispatchEvent(new CustomEvent('cefr:auth', { detail: currentUser }));
  });

  // expose showLoginDialog for other scripts
  api.showLogin = showLoginDialog;
})();
