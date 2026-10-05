// Firebase Admin SDK – shared initialisation for all API endpoints.
// Reads credentials from Vercel environment variables:
//   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
//
// Exports:
//   db          – Firestore instance
//   verifyAuth  – (req) → { uid } or null  (validates the Authorization: Bearer <idToken> header)
//   getUserPass – (uid) → { exp, plan, sid } or null
//   setUserPass – (uid, { exp, plan, sid }) → void

'use strict';

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { redeemWith, migrateWith } = require('./_claims');

// Initialise once per cold-start
if (getApps().length === 0) {
  const key = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  if (process.env.FIREBASE_PROJECT_ID && key) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: key,
      }),
    });
  } else {
    // Local / unconfigured: initialise without credentials (will fail on real calls)
    initializeApp({ projectId: 'demo-cefr' });
  }
}

const db = getFirestore();

// Verify the Firebase ID token sent as "Authorization: Bearer <token>"
async function verifyAuth(req) {
  const hdr = String(req.headers.authorization || '');
  if (!hdr.startsWith('Bearer ')) return null;
  const idToken = hdr.slice(7);
  if (!idToken || idToken.length > 4000) return null;
  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    return { uid: decoded.uid, email: decoded.email || null };
  } catch {
    return null;
  }
}

// Read pass from Firestore: users/{uid}
async function getUserPass(uid) {
  try {
    const doc = await db.collection('users').doc(uid).get();
    if (!doc.exists) return null;
    const d = doc.data();
    return Number.isFinite(d.exp) ? d : null;
  } catch {
    return null;
  }
}

// Write pass to Firestore: users/{uid}
async function setUserPass(uid, data) {
  await db.collection('users').doc(uid).set(
    {
      exp: data.exp,
      plan: data.plan || null,
      sid: data.sid || null,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

// Credit a paid session once (see _claims.js)
const redeemSession = (uid, sid, opts) => redeemWith(db, FieldValue.serverTimestamp(), uid, sid, opts);
// Move an old signed pass into an account once (see _claims.js)
const migrateLegacy = (uid, legacy) => migrateWith(db, FieldValue.serverTimestamp(), uid, legacy);

module.exports = { db, verifyAuth, getUserPass, setUserPass, redeemSession, migrateLegacy };
