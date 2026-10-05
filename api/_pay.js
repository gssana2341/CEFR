// Shared helpers for the membership endpoints (files starting with "_" are not deployed as endpoints).
//
// === NEW FLOW (Firebase Auth + Firestore) ===
//   1. User signs in via Firebase Auth (Google or Email/Password) on the client
//   2. /api/checkout   creates a Stripe Checkout page; user's Firebase UID is stored in Stripe metadata
//   3. Stripe sends the customer back to /pricing?session_id=...
//   4. /api/claim      asks Stripe "is this session paid?" → saves the pass to Firestore under users/{uid}
//   5. /api/pass        verifies Firebase ID token → reads pass from Firestore
//
// === LEGACY FLOW (signed token, kept for backward compatibility) ===
//   Same as before: sign/verify HMAC tokens stored in localStorage.
//   Users with old tokens can still use them; the pricing page offers migration to Firebase.
//
// Env (Vercel → Settings → Environment Variables):
//   STRIPE_SECRET_KEY       sk_test_... while testing, sk_live_... when selling
//   PASS_SECRET             any long random string (legacy tokens; still needed for migration)
//   FIREBASE_PROJECT_ID     from Firebase Console
//   FIREBASE_CLIENT_EMAIL   from Firebase service account
//   FIREBASE_PRIVATE_KEY    from Firebase service account (keep the \n)
//   SITE_URL                optional, e.g. https://your-site.vercel.app  (default: taken from the request)
//   PAY_MODE=mock           local testing only: fake checkout, no Stripe (ignored on Vercel production)


'use strict';

const crypto = require('node:crypto');

const DAY = 86_400_000;

// One place for the price list. The browser only ever asks for a plan id; the amount is decided here.
const PLANS = [
  { id: 'd1', days: 1, baht: 20 },
  { id: 'd3', days: 3, baht: 60 },
  { id: 'd7', days: 7, baht: 120 },
  { id: 'd30', days: 30, baht: 550 },
];

const isMock = () => process.env.PAY_MODE === 'mock' && process.env.VERCEL_ENV !== 'production';
const secret = () => process.env.PASS_SECRET || (isMock() ? 'dev-only-secret' : '');

// best-effort limit per IP and endpoint (memory of one server instance - enough to stop careless hammering)
const hits = new Map();
function rateLimited(req, bucket, max, windowMs = 60_000) {
  const ip = String(req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || 'unknown').split(',')[0].trim();
  const key = bucket + ':' + ip;
  const now = Date.now();
  const rec = hits.get(key);
  if (!rec || now - rec.start > windowMs) {
    hits.set(key, { start: now, count: 1 });
    if (hits.size > 5000) hits.clear();
    return false;
  }
  return ++rec.count > max;
}

function send(res, status, body) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(status).send(JSON.stringify(body));
}

async function readJson(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > 10_000) return {};
    chunks.push(c);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString() || '{}'); } catch { return {}; }
}

const mac = (body) => crypto.createHmac('sha256', secret()).update(body).digest('base64url');

function sign(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return body + '.' + mac(body);
}

// → payload { exp, sid, plan } or null
function verify(token) {
  if (!secret() || typeof token !== 'string' || token.length > 600) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(mac(body));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString());
    return Number.isFinite(p.exp) ? p : null;
  } catch {
    return null;
  }
}

async function stripe(path, params) {
  const res = await fetch('https://api.stripe.com/v1/' + path, {
    method: params ? 'POST' : 'GET',
    headers: {
      Authorization: 'Bearer ' + process.env.STRIPE_SECRET_KEY,
      ...(params ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
    },
    body: params ? new URLSearchParams(params).toString() : undefined,
    signal: AbortSignal.timeout(8000),
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data.error && data.error.message) || 'stripe_error');
  return data;
}

function siteUrl(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '');
  const proto = String(req.headers['x-forwarded-proto'] || 'http').split(',')[0];
  return proto + '://' + req.headers.host;
}

module.exports = { DAY, PLANS, isMock, secret, send, readJson, sign, verify, stripe, siteUrl, rateLimited };
