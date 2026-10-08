// Copies build/toeic/ (made by extract.py) to the PRIVATE Supabase Storage bucket the site reads from (api/_toeic_store.js).
//
//   node tools/toeic/upload.mjs                  upload everything (creates the private bucket the first time)
//   node tools/toeic/upload.mjs --dry-run        only list what would be sent
//   node tools/toeic/upload.mjs --dir other/dir  another build folder
//
// Needs SUPABASE_URL and SUPABASE_SERVICE_KEY (the "service_role" key: server-only, never in a page, never committed) and optionally
// TOEIC_BUCKET (default "toeic") - in .env or the environment. The bucket is created PRIVATE; nothing here makes anything public.
// Re-running is safe: files are replaced (upsert).
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname, sep, resolve } from 'node:path';

const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const dir = resolve(args.includes('--dir') ? args[args.indexOf('--dir') + 1] : 'build/toeic');

if (existsSync('.env')) {
  for (const line of readFileSync('.env', 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
  }
}
const base = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const key = process.env.SUPABASE_SERVICE_KEY || '';
const bucket = process.env.TOEIC_BUCKET || 'toeic';
if (!flag('--dry-run') && (!base || !key)) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY (in .env or the environment) first.');
  process.exit(2);
}
if (!existsSync(join(dir, 'index.json'))) {
  console.error('No ' + join(dir, 'index.json') + ' - run tools/toeic/extract.py first.');
  process.exit(2);
}

const TYPES = { '.json': 'application/json', '.webp': 'image/webp', '.mp3': 'audio/mpeg' };
const files = [];
(function walk(d) {
  for (const name of readdirSync(d)) {
    const p = join(d, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (TYPES[extname(name)] && !name.startsWith('_')) files.push(p);        // pictures/audio/json only; review sheets and reports stay local
  }
})(dir);

const rel = (p) => relative(dir, p).split(sep).join('/');
const total = files.reduce((n, f) => n + statSync(f).size, 0);
console.log(files.length + ' files, ' + (total / 1048576).toFixed(1) + ' MB → bucket "' + bucket + '"' + (flag('--dry-run') ? ' (dry run)' : ''));
if (flag('--dry-run')) { for (const f of files) console.log('  ' + rel(f)); process.exit(0); }

const headers = { Authorization: 'Bearer ' + key, apikey: key };

// private bucket (created once)
{
  const r = await fetch(base + '/storage/v1/bucket', {
    method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: bucket, name: bucket, public: false }),
  });
  if (r.ok) console.log('created private bucket "' + bucket + '"');
  else {
    const t = await r.text();
    if (!/already exists|Duplicate|409/i.test(t) && r.status !== 409) { console.error('could not create the bucket (' + r.status + '): ' + t.slice(0, 200)); process.exit(1); }
  }
}

let done = 0;
for (const f of files) {
  const path = rel(f);
  const body = readFileSync(f);
  const r = await fetch(base + '/storage/v1/object/' + encodeURIComponent(bucket) + '/' + path.split('/').map(encodeURIComponent).join('/'), {
    method: 'POST', headers: { ...headers, 'Content-Type': TYPES[extname(f)], 'x-upsert': 'true', 'Cache-Control': 'max-age=3600' }, body,
  });
  if (!r.ok) { console.error('FAILED ' + path + ' (' + r.status + '): ' + (await r.text()).slice(0, 200)); process.exit(1); }
  done++;
  process.stdout.write('\r' + done + '/' + files.length + '  ' + path.padEnd(40));
}
console.log('\nuploaded. Test: set SUPABASE_URL / SUPABASE_SERVICE_KEY on Vercel (Production) and redeploy.');
