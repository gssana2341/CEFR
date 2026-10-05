// Mirrors the learner's progress to Firestore (through /api/sync) while they are signed in, so it follows them to
// another phone or computer. The browser's localStorage stays the working copy: nothing changes for a signed-out visitor.
//
//   • every store.set / store.remove of a progress key is noted (when + "not sent yet") and sent a moment later
//   • on sign-in and on every page load the cloud copy is read; per key the newer one wins. A device that never synced
//     a key merges instead of overwriting (history lists are joined, lesson progress keeps the best of both)
//   • if the cloud copy changed what is on screen, the page reloads once so it shows the synced data
// Which keys are synced is decided in api/_sync.js (and mirrored in KEYS below).
(function () {
  'use strict';

  const { store } = window.CEFR;
  const NS = 'cefr:';
  const META = 'sync:meta';      // { key: t }  when each key last changed (here or in the cloud, the version we know)
  const DIRTY = 'sync:dirty';    // [key]       changed here and not sent yet
  const KEYS = [
    /^(grammar|conversations|extra|cloze):(state|wrong|stats|count|best|order)$/,
    /^placement:(state|last|history)$/,
    /^exam:history$/,
    /^learn:progress$/,
  ];
  const isSyncKey = (k) => typeof k === 'string' && KEYS.some((re) => re.test(k));

  const rawSet = store.set.bind(store);
  const rawRemove = store.remove.bind(store);
  const rawText = (k) => { try { return localStorage.getItem(NS + k); } catch { return null; } };

  const meta = () => store.get(META, {});
  const dirty = () => new Set(store.get(DIRTY, []));
  const saveMeta = (m) => rawSet(META, m);
  const saveDirty = (d) => rawSet(DIRTY, [...d]);

  const user = () => (window.CEFR.auth && window.CEFR.auth.user && window.CEFR.auth.user()) || null;
  let lastToken = '';
  async function token() {
    try { lastToken = (await window.CEFR.auth.getToken()) || lastToken; } catch { /* keep the old one */ }
    return lastToken;
  }

  // ---------- note local changes ----------
  function touch(key) {
    const m = meta();
    m[key] = Date.now();
    saveMeta(m);
    const d = dirty();
    d.add(key);
    saveDirty(d);
    schedulePush();
  }

  store.set = (key, value) => { const ok = rawSet(key, value); if (ok && isSyncKey(key)) touch(key); return ok; };
  store.remove = (key) => { rawRemove(key); if (isSyncKey(key)) touch(key); };

  // ---------- send ----------
  let pushTimer = 0;
  function schedulePush() {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(push, 1500);
  }

  function changesToSend() {
    const m = meta();
    const out = {};
    for (const key of dirty()) {
      const v = rawText(key);                         // already JSON text; null → the key was removed
      out[key] = { v: v === null ? null : v, t: m[key] || Date.now() };
    }
    return out;
  }

  async function push(opts) {
    if (!user()) return;
    const changes = changesToSend();
    if (!Object.keys(changes).length) return;
    try {
      const r = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (opts && opts.cached ? lastToken : await token()) },
        body: JSON.stringify({ changes }),
        keepalive: Boolean(opts && opts.cached),
      });
      if (!r.ok) return;                              // stays dirty, tried again next time
      const d = await r.json();
      const done = new Set([...(d.applied || []), ...Object.entries(d.skipped || {}).filter(([, why]) => why !== 'too_many_keys').map(([k]) => k)]);
      const now = dirty();
      // a key changed again while this request was on its way stays dirty
      for (const k of done) if (JSON.stringify(rawText(k)) === JSON.stringify(changes[k] && changes[k].v)) now.delete(k);
      saveDirty(now);
    } catch { /* offline: stays dirty */ }
  }

  // ---------- merge ----------
  // Used when this device has data for a key it never synced and the cloud has a value too: join instead of overwrite.
  function merge(key, local, remote) {
    if (Array.isArray(local) && Array.isArray(remote)) {
      const seen = new Set();
      const out = [];
      for (const x of [...remote, ...local]) {
        const id = JSON.stringify(x);
        if (!seen.has(id)) { seen.add(id); out.push(x); }
      }
      if (out.every((x) => x && typeof x === 'object' && Number.isFinite(x.at))) out.sort((a, b) => b.at - a.at);   // histories, newest first
      return out.slice(0, 50);
    }
    if (key === 'learn:progress' && local && remote && typeof local === 'object' && typeof remote === 'object') {
      const out = { ...remote };
      for (const [id, mine] of Object.entries(local)) {
        const theirs = out[id];
        if (!theirs) out[id] = mine;
        else out[id] = { ...theirs, ...mine, done: Boolean(theirs.done || mine.done), score: Math.max(theirs.score || 0, mine.score || 0), at: Math.max(theirs.at || 0, mine.at || 0) };
      }
      return out;
    }
    if (key === 'placement:last' && local && remote) return (local.at || 0) > (remote.at || 0) ? local : remote;
    return remote;
  }

  // ---------- read the cloud copy ----------
  let pulling = false;
  let lastPull = 0;
  async function pull(force) {
    if (pulling || !user() || (!force && Date.now() - lastPull < 20000)) return;
    pulling = true;
    lastPull = Date.now();
    try {
      const r = await fetch('/api/sync', { headers: { Authorization: 'Bearer ' + (await token()) }, cache: 'no-store' });
      if (!r.ok) return;
      const remote = (await r.json()).data || {};
      const m = meta();
      const d = dirty();
      const changed = [];

      for (const [key, c] of Object.entries(remote)) {
        if (!isSyncKey(key)) continue;
        const localT = m[key] || 0;
        const localText = rawText(key);
        if (c.t <= localT) {                                   // this device is as new or newer
          if (c.t < localT) d.add(key);
          continue;
        }
        let nextText = c.v;
        if (c.v !== null && localText !== null && localT === 0) {   // never synced here: join instead of overwrite
          let local; let theirs;
          try { local = JSON.parse(localText); theirs = JSON.parse(c.v); } catch { local = undefined; }
          if (local !== undefined) {
            const joined = JSON.stringify(merge(key, local, theirs));
            if (joined !== c.v) { nextText = joined; d.add(key); }   // the joined version is newer than the cloud's
          }
        }
        if (nextText === c.v) d.delete(key);                  // the cloud copy simply replaces what we had
        if (nextText === localText) { m[key] = c.t; continue; }
        if (nextText === null) rawRemove(key); else { try { rawSet(key, JSON.parse(nextText)); } catch { continue; } }
        m[key] = d.has(key) ? Date.now() : c.t;
        changed.push(key);
      }

      // local keys the cloud does not have yet → send them
      for (const k of Object.keys(localStorage)) {
        if (!k.startsWith(NS)) continue;
        const key = k.slice(NS.length);
        if (isSyncKey(key) && !remote[key]) { if (!m[key]) m[key] = Date.now(); d.add(key); }
      }

      saveMeta(m);
      saveDirty(d);
      await push();
      if (changed.length) {
        document.dispatchEvent(new CustomEvent('cefr:synced', { detail: { keys: changed } }));
        // the page already drew itself from the old data: reload once so it shows the synced progress
        const last = Number(sessionStorage.getItem('cefr:sync-reload')) || 0;
        if (Date.now() - last > 15000) {
          try { sessionStorage.setItem('cefr:sync-reload', String(Date.now())); } catch { /* fine */ }
          location.reload();
        }
      }
    } catch { /* offline or not signed in: try again next time */ } finally {
      pulling = false;
    }
  }

  // ---------- when to run ----------
  document.addEventListener('cefr:auth', (e) => { if (e.detail) pull(true); });
  if (window.CEFR.auth && window.CEFR.auth.ready) window.CEFR.auth.ready.then(() => { if (user()) pull(true); });
  window.addEventListener('online', () => { push(); });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') push({ cached: true }); });

  window.CEFR.sync = { pull: () => pull(true), push, merge, isSyncKey };
})();
