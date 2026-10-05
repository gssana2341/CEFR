// Firebase client-side initialisation (loaded before auth.js on every page).
// Uses the compat SDK so it works with plain <script> tags (no bundler).
// Exposes: window.CEFR_FIREBASE  { app, auth }
(function () {
  'use strict';

  const firebaseConfig = {
    apiKey: 'AIzaSyDW-owoLc8kaKmF1cddFzs6CGK8v4DgwIg',
    authDomain: 'cefr-6e6f6.firebaseapp.com',
    projectId: 'cefr-6e6f6',
    storageBucket: 'cefr-6e6f6.firebasestorage.app',
    messagingSenderId: '793053529031',
    appId: '1:793053529031:web:94d82ebc7acfa322d00fe2',
    measurementId: 'G-P2VFD7ZHF4',
  };

  const app = firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();

  // Set language to Thai for the sign-in UI
  auth.languageCode = 'th';

  window.CEFR_FIREBASE = { app, auth };
})();
