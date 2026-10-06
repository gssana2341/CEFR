// Fetches the question sets and the answers from the server (/api/content, /api/quiz). The question banks are no longer
// static files, so every page that shows questions goes through here. Exposes CEFR.content.
//
//   CEFR.content.load('grammar')            → fills CEFR_DATA.grammar with the questions (no answers) and returns them
//   CEFR.content.lesson('present-simple')   → one lesson (text + exercises); its sentence mark-up goes to CEFR_DATA.clues
//   CEFR.content.reveal('grammar', [{ n, pick }])  → asks for the answer + explanation of what the learner picked; they are
//                                              written onto the question objects (q.a, q.e) and its mark-up into CEFR_DATA.clues
//   CEFR.content.post(body)                 → any /api/quiz call
// Errors are ApiError with .status (401 sign in · 402 members only · 429 slow down · 0 offline) and .code.
(function () {
  'use strict';

  const D = (window.CEFR_DATA = window.CEFR_DATA || {});

  class ApiError extends Error {
    constructor(status, code, feature) {
      super(code || 'http_' + status);
      this.status = status;
      this.code = code || '';
      this.feature = feature || '';
    }
  }

  async function token() {
    const a = window.CEFR.auth;
    if (!a) return '';
    if (a.ready) await Promise.race([a.ready, new Promise((r) => setTimeout(r, 3000))]);   // Firebase restores the user a moment after load
    return a.getToken();
  }

  async function call(method, url, body) {
    const t = await token();
    let r;
    try {
      r = await fetch(url, {
        method,
        cache: 'no-store',
        headers: { ...(t ? { Authorization: 'Bearer ' + t } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(15000),
      });
    } catch {
      throw new ApiError(0, 'offline');
    }
    let d = null;
    try { d = await r.json(); } catch { /* not JSON */ }
    if (!r.ok) throw new ApiError(r.status, d && d.error, d && d.feature);
    return d;
  }

  // ---------- sentence mark-up delivered with an answer ----------
  function setClue(bank, key, clue) {
    if (!clue) return;
    D.clues = D.clues || {};
    D.clues[bank] = D.clues[bank] || {};
    D.clues[bank][key] = clue;
  }

  // ---------- question sets ----------
  const sets = {};
  function load(set) {
    if (!sets[set]) {
      sets[set] = call('GET', '/api/content?set=' + encodeURIComponent(set))
        .then((d) => { D[set] = d.questions || d.passages; return D[set]; })
        .catch((e) => { delete sets[set]; throw e; });
    }
    return sets[set];
  }

  const lessons = {};
  function lesson(id) {
    if (!lessons[id]) {
      lessons[id] = call('GET', '/api/content?set=lesson&id=' + encodeURIComponent(id))
        .then((d) => {
          if (d.clues) { D.clues = D.clues || {}; D.clues.lessons = D.clues.lessons || {}; D.clues.lessons[id] = d.clues; }
          return d.lesson;
        })
        .catch((e) => { delete lessons[id]; throw e; });
    }
    return lessons[id];
  }

  // ---------- answers ----------
  const post = (body) => call('POST', '/api/quiz', body);

  // items: [{ n, pick }] (at most 10 per call; more are sent in several calls)
  async function reveal(set, items) {
    const byN = new Map((D[set] || []).map((q) => [q.n, q]));
    for (let i = 0; i < items.length; i += 10) {
      const part = items.slice(i, i + 10);
      const d = await post({ op: 'check', set, items: part });
      for (const it of part) {
        const r = d.results[it.n];
        const q = byN.get(it.n);
        if (!r || !q) continue;
        q.a = r.a;
        q.e = r.e;
        setClue(set, it.n, r.clue);
      }
    }
  }

  // a Thai message for the errors that need more than "try again" (null for any other error)
  function special(e) {
    if (e && e.code === 'account_blocked') return 'บัญชีนี้ถูกระงับการเข้าถึงเนื้อหาสำหรับสมาชิกชั่วคราว เพราะมีการดึงเนื้อหาผิดปกติ หากเข้าใจผิด กรุณาติดต่อผู้ดูแล';
    if (e && e.code === 'daily_limit') return 'วันนี้เปิดบทเรียนครบโควตาแล้ว (บทใหม่ได้ไม่เกิน 15 บทต่อวัน บทที่เปิดไปแล้วเปิดซ้ำได้) กลับมาใหม่พรุ่งนี้';
    return null;
  }

  window.CEFR.content = { load, lesson, reveal, post, setClue, special, ApiError };
})();
