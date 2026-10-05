// A tiny in-memory stand-in for Firestore, used only for local development with PAY_MODE=mock and in tests
// (files starting with "_" are not endpoints). Supports what api/*.js uses:
//   db.collection(a).doc(b).collection(c).doc(d) · .get() · .set(data, { merge }) · .delete()
//   db.collection(...).get() → snapshot with .size, .forEach(doc), doc.id / doc.data()
//   db.runTransaction(async (t) => { await t.get(ref); t.set(ref, data, opts); })
'use strict';

function createMemDb() {
  const store = new Map();                          // "users/u1/data/grammar~wrong" → data

  const docRef = (path) => ({
    path,
    id: path.split('/').pop(),
    async get() {
      const d = store.get(path);
      return { exists: d !== undefined, id: path.split('/').pop(), data: () => (d === undefined ? undefined : { ...d }) };
    },
    async set(data, opts) {
      store.set(path, opts && opts.merge ? { ...(store.get(path) || {}), ...data } : { ...data });
    },
    async delete() { store.delete(path); },
    collection: (name) => collRef(path + '/' + name),
  });

  const collRef = (path) => ({
    path,
    doc: (id) => docRef(path + '/' + id),
    async get() {
      const docs = [];
      for (const [p, d] of store) {
        if (p.startsWith(path + '/') && !p.slice(path.length + 1).includes('/')) {
          docs.push({ exists: true, id: p.slice(path.length + 1), data: () => ({ ...d }) });
        }
      }
      return { size: docs.length, docs, forEach: (fn) => docs.forEach(fn) };
    },
  });

  return {
    collection: (name) => collRef(name),
    async runTransaction(fn) {
      const writes = [];
      const t = {
        async get(ref) { return ref.get(); },
        set(ref, data, opts) { writes.push([ref, data, opts]); },
      };
      const out = await fn(t);                      // nothing is written if fn throws
      for (const [ref, data, opts] of writes) await ref.set(data, opts);
      return out;
    },
    _store: store,
  };
}

module.exports = { createMemDb };
