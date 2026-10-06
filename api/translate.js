// Vercel Function — GET /api/translate?q=<English word or short text>
// Returns { q, translation, alts: [...], provider } (English → Thai).
//
// Providers, tried in order:
//   1. Google Cloud Translation (official)  — only if env GOOGLE_TRANSLATE_API_KEY is set
//   2. MyMemory (free, official public API) — set MYMEMORY_EMAIL to raise the free daily quota
//
// Successful answers are cached at Vercel's edge (translations rarely change), so a word that has
// been looked up once costs nothing for the next visitors and quota is hardly ever consumed.

'use strict';

const MAX_CHARS = 300;
const TIMEOUT_MS = 4500; // two providers in the worst case → stays under Vercel's 10 s default limit
const RATE_LIMIT = { windowMs: 60_000, max: 90 }; // per IP, per server instance (best effort)
const hits = new Map();

const THAI = /[฀-๿]/;

function decodeEntities(s) {
  return String(s)
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

// MyMemory sometimes appends a romanisation ("… S̄t̄hānī tảrwc …") after the Thai text — cut it off.
function stripRomanization(s) {
  const at = s.search(/\s[A-Za-z]*[̀-ͯĀ-ɏḀ-ỿ]/);
  return at > 0 && THAI.test(s.slice(0, at)) ? s.slice(0, at).trim() : s;
}

function rateLimited(ip) {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now - rec.start > RATE_LIMIT.windowMs) {
    hits.set(ip, { start: now, count: 1 });
    if (hits.size > 5000) hits.clear(); // keep memory bounded
    return false;
  }
  rec.count += 1;
  return rec.count > RATE_LIMIT.max;
}

async function viaGoogle(q, key) {
  const r = await fetch('https://translation.googleapis.com/language/translate/v2?key=' + encodeURIComponent(key), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q, source: 'en', target: 'th', format: 'text' }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!r.ok) throw new Error('google ' + r.status);
  const j = await r.json();
  const t = j && j.data && j.data.translations && j.data.translations[0];
  if (!t || !t.translatedText) throw new Error('google empty');
  return { translation: decodeEntities(t.translatedText), alts: [], provider: 'google' };
}

async function viaMyMemory(q, email) {
  let url = 'https://api.mymemory.translated.net/get?langpair=en%7Cth&q=' + encodeURIComponent(q);
  if (email) url += '&de=' + encodeURIComponent(email);
  const r = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!r.ok) throw new Error('mymemory ' + r.status);
  const j = await r.json();
  const main = j && j.responseData && j.responseData.translatedText;
  // MyMemory reports quota problems inside a normal-looking 200 response.
  if (!main || Number(j.responseStatus) !== 200 || /MYMEMORY WARNING|INVALID/i.test(String(main))) {
    throw new Error('mymemory unavailable');
  }
  const translation = stripRomanization(decodeEntities(main).trim());
  const alts = [];
  for (const m of j.matches || []) {
    const t = stripRomanization(decodeEntities(m.translation || '').trim());
    if (t && t !== translation && THAI.test(t) && Number(m.match) >= 0.6 && !alts.includes(t) && t.length <= 60) alts.push(t);
    if (alts.length >= 3) break;
  }
  // Alternative meanings are only reliable for single words (phrase matches are noisy).
  return { translation, alts: /\s/.test(q) ? [] : alts, provider: 'mymemory' };
}

module.exports = async function handler(req, res) {
  const send = (status, body, cache) => {
    res.setHeader('Cache-Control', cache || 'no-store');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(status).send(JSON.stringify(body));
  };

  if (req.method !== 'GET') return send(405, { error: 'method_not_allowed' });

  const q = String((req.query && req.query.q) || '').replace(/\s+/g, ' ').trim();
  const letters = (q.match(/[A-Za-z]/g) || []).length;
  const thai = (q.match(/[฀-๿]/g) || []).length;
  if (!q || q.length > MAX_CHARS || letters === 0 || thai > letters) return send(400, { error: 'bad_request' });

  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  if (rateLimited(ip)) return send(429, { error: 'rate_limited' });

  const providers = [];
  if (process.env.GOOGLE_TRANSLATE_API_KEY) providers.push(() => viaGoogle(q, process.env.GOOGLE_TRANSLATE_API_KEY));
  providers.push(() => viaMyMemory(q, process.env.MYMEMORY_EMAIL));

  let lastError = null;
  for (const run of providers) {
    try {
      const out = await run();
      // 30 days at the edge; serve stale for a day while revalidating.
      return send(200, { q, ...out }, 'public, s-maxage=2592000, stale-while-revalidate=86400');
    } catch (e) {
      lastError = e;
    }
  }
  console.error('[translate] all providers failed:', lastError && lastError.message);
  return send(502, { error: 'upstream_unavailable' });
};
