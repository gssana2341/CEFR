// Word lookup on top of CEFR_DATA.glossary: exact match → irregular redirect → strip a regular ending
// (-s -es -ies -ed -ied -ing -er -est -ly …) and try the base form.
// Works in the browser (window.CEFR.createDictionary) and in Node (module.exports) for the coverage test.
(function (root) {
  'use strict';

  function createDictionary(glossary) {
    const G = glossary || {};
    const has = (w) => Object.prototype.hasOwnProperty.call(G, w);

    function candidates(w) {
      const out = [];
      const add = (s) => { if (s && s.length >= 2 && !out.includes(s)) out.push(s); };
      const undouble = (b) => (b.length > 2 && b[b.length - 1] === b[b.length - 2] ? b.slice(0, -1) : null);

      if (w.endsWith("'s")) add(w.slice(0, -2));                                    // anne's → anne

      // Order matters: try the longer base first so "times" → time (not tim), "uses" → use (not us).
      if (w.endsWith('ies')) add(w.slice(0, -3) + 'y');                              // studies → study
      if (w.endsWith('ves')) { add(w.slice(0, -3) + 'f'); add(w.slice(0, -3) + 'fe'); }
      if (w.endsWith('s') && !w.endsWith('ss')) add(w.slice(0, -1));                 // books → book, times → time
      if (w.endsWith('es')) add(w.slice(0, -2));                                     // watches → watch

      if (w.endsWith('ied')) add(w.slice(0, -3) + 'y');                              // studied → study
      if (w.endsWith('ed')) {                                                        // hated → hate, planned → plan, worked → work
        const b = w.slice(0, -2);
        add(w.slice(0, -1)); add(undouble(b)); add(b);
      }

      if (w.endsWith('ing')) {                                                       // using → use, running → run, working → work
        const b = w.slice(0, -3);
        add(b + 'e'); add(undouble(b)); add(b);
        if (w.endsWith('ying')) add(w.slice(0, -4) + 'ie');                          // lying → lie
      }

      if (w.endsWith('ier')) add(w.slice(0, -3) + 'y');                              // easier → easy
      if (w.endsWith('iest')) add(w.slice(0, -4) + 'y');
      if (w.endsWith('er')) { const b = w.slice(0, -2); add(b); add(w.slice(0, -1)); add(undouble(b)); } // taller, nicer, bigger
      if (w.endsWith('est')) { const b = w.slice(0, -3); add(b); add(w.slice(0, -2)); add(undouble(b)); } // tallest, nicest, biggest

      if (w.endsWith('ily')) add(w.slice(0, -3) + 'y');                              // easily → easy
      if (w.endsWith('ally')) add(w.slice(0, -4));                                   // basically → basic
      if (w.endsWith('ly')) { const b = w.slice(0, -2); add(b); add(b + 'e'); if (w.endsWith('bly') || w.endsWith('ply')) add(b + 'le'); }

      return out;
    }

    // Returns { word, lemma, note, direct, senses: [..] } or null when the word is unknown.
    function lookup(raw) {
      const w = String(raw).toLowerCase().replace(/[’‘]/g, "'").replace(/^['-]+|['-]+$/g, '');
      if (!w) return null;

      let key = has(w) ? w : candidates(w).find(has);
      if (!key) return null;

      let lemma = key;
      let note = null;
      let entry = G[key];
      for (let hops = 0; entry.startsWith('>') && hops < 3; hops++) {     // follow irregular redirects
        const [target, n] = entry.slice(1).split('|');
        lemma = target;
        note = note || n || null;
        entry = has(target) ? G[target] : '';
      }
      if (!entry) return null;

      return { word: String(raw), lemma, note, direct: key === w && lemma === w, senses: entry.split(' · ') };
    }

    return { lookup, candidates };
  }

  if (typeof module === 'object' && module.exports) module.exports = { createDictionary };
  if (root && root.CEFR) root.CEFR.createDictionary = createDictionary;
})(typeof window !== 'undefined' ? window : null);
