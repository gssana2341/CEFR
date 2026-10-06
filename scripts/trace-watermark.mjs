// Finds out which account a leaked piece of text came from (see api/_watermark.js).
//
//   node scripts/trace-watermark.mjs leaked.txt              prints the invisible tag(s) found in the file
//   node scripts/trace-watermark.mjs leaked.txt --firestore  also looks the tag up among the accounts in Firestore
//                                                            (needs FIREBASE_* and the same WATERMARK_SECRET / PASS_SECRET as the
//                                                            deployment, e.g. in .env)
//   node scripts/trace-watermark.mjs leaked.txt --uid abc    checks the text against one account id
//
// The text must still contain the zero-width characters: copy it straight from the leak, do not retype it.
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// a minimal .env reader (KEY=value, optional quotes) - the real environment wins
if (existsSync(join(root, '.env'))) {
  for (const line of readFileSync(join(root, '.env'), 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
  }
}

const { decode, tagOf } = require('../api/_watermark.js');
const [file, ...flags] = process.argv.slice(2);
if (!file) { console.error('usage: node scripts/trace-watermark.mjs <file> [--firestore | --uid <id>]'); process.exit(2); }

const found = decode(readFileSync(file, 'utf8'));
if (!found.length) { console.log('no tag found: the text was stripped of zero-width characters, or it never carried one (anonymous visitors get none)'); process.exit(1); }

const counts = new Map();
for (const t of found) counts.set(t, (counts.get(t) || 0) + 1);
console.log('tags found:');
for (const [t, n] of counts) console.log('  ' + t + '  (' + n + ' time' + (n > 1 ? 's' : '') + ')');

const uidAt = flags.indexOf('--uid');
if (uidAt >= 0) {
  const uid = flags[uidAt + 1];
  console.log(counts.has(tagOf(uid)) ? '\nMATCH: this text carries the tag of account ' + uid : '\nno match for account ' + uid);
}

if (flags.includes('--firestore')) {
  const { db } = require('../api/_firebase.js');
  const snap = await db.collection('users').get();
  let hit = 0;
  snap.forEach((doc) => {
    if (counts.has(tagOf(doc.id))) {
      hit++;
      const d = doc.data();
      console.log('\nMATCH: account ' + doc.id + (d.email ? ' <' + d.email + '>' : '') + (d.name ? ' ' + d.name : ''));
    }
  });
  if (!hit) console.log('\nno account matches (is WATERMARK_SECRET / PASS_SECRET the same as on the server?)');
}
