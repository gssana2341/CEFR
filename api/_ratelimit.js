// A request limit shared by every server instance (files starting with "_" are not endpoints).
//
// _pay.js rateLimited() only counts inside one warm instance, so a client that is sent to a fresh instance starts at zero.
// This one keeps the counter in Firestore (ratelimit/{hash}), so it is the same everywhere. It costs one transaction per
// call: use it on the endpoints that cost money or hand out content, and keep the cheap in-memory one in front of it.
//
//   if (await limited(req, 'content', 60, { uid, windowMs, cost })) return send(res, 429, { error: 'rate_limited' });
//
// Counters are keyed by uid when the caller is signed in (an IP is shared by a whole school), otherwise by IP.
// Each counter document carries `expireAt`; switch on a Firestore TTL policy for ratelimit.expireAt so old ones vanish.
// If Firestore is down the limiter lets the request through (the in-memory limit still applies): never lock everyone out.
'use strict';

const crypto = require('node:crypto');
const { clientIp, rateLimited } = require('./_pay');
const { db } = require('./_firebase');

// → true when the caller is over the limit
async function limited(req, bucket, max, opts) {
  const o = opts || {};
  const windowMs = o.windowMs || 60_000;
  const cost = Math.max(1, Math.floor(o.cost) || 1);       // e.g. the number of answers checked in one call
  if (rateLimited(req, bucket, Math.max(max * 2, max + 10), windowMs)) return true;   // cheap local check first

  const who = o.uid ? 'u:' + o.uid : 'ip:' + clientIp(req);
  const slot = Math.floor(Date.now() / windowMs);
  // hashed, so no part of a uid / header can ever shape a document path
  const id = crypto.createHash('sha256').update(bucket + '|' + who + '|' + slot).digest('base64url');
  try {
    const ref = db.collection('ratelimit').doc(id);
    const n = await db.runTransaction(async (t) => {
      const snap = await t.get(ref);
      const next = (snap.exists && Number.isFinite(snap.data().n) ? snap.data().n : 0) + cost;
      t.set(ref, { n: next, bucket, expireAt: new Date((slot + 2) * windowMs) });
      return next;
    });
    return n > max;
  } catch (e) {
    console.error('[ratelimit] store unavailable, using the local limit only:', e.message);
    return false;
  }
}

module.exports = { limited };
