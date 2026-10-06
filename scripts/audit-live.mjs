// Checks the DEPLOYED site the way an outsider would, and says what is fine and what still needs a click in a console.
// Usage:  npm run audit:live            (default site)   ·   node scripts/audit-live.mjs https://your-site.example
//
// Read-only: it never creates, changes or reads anybody's data. The Firebase web key is public by design (it identifies the
// project); what protects the project is the Firestore rules, the sign-in providers and - extra - the key's restrictions.
import { execSync } from 'node:child_process';

const SITE = (process.argv[2] || 'https://cefr-silk.vercel.app').replace(/\/$/, '');
const results = [];
const note = (level, title, detail) => results.push({ level, title, detail });
const get = async (url, opts = {}) => {
  try { return await fetch(url, { signal: AbortSignal.timeout(15000), ...opts }); } catch (e) { return { status: 0, text: async () => '', error: e.message }; }
};

// ---- 1. files that must never be public ----
for (const p of ['.env', '.git/config', 'package.json', 'vercel.json', 'firestore.rules', 'content/lessons.js', 'api/_firebase.js', 'assets/data/conversations.js', 'assets/data/lessons.js']) {
  const r = await get(SITE + '/' + p, { redirect: 'manual' });
  const exposed = r.status === 200;
  note(exposed ? 'FAIL' : 'ok', '/' + p + ' is not downloadable', exposed ? 'HTTP 200: this file is public' : 'HTTP ' + r.status);
}

// ---- 2. the question banks are gated ----
{
  const r = await get(SITE + '/api/content?set=conversations');
  note(r.status === 401 ? 'ok' : 'FAIL', 'members-only set is refused without a sign-in', 'HTTP ' + r.status + ' (expected 401)');
  const g = await get(SITE + '/api/content?set=grammar');
  const body = await g.text();
  note(/"a":\d|"e":"/.test(body) ? 'FAIL' : 'ok', 'free question lists carry no answers', /"a":\d|"e":"/.test(body) ? 'answers found in the list' : 'no answer fields');
}

// ---- 3. the public Firebase key: what can an outsider do with it? ----
{
  const js = await (await get(SITE + '/assets/js/firebase-init.js')).text();
  const key = (js.match(/apiKey:\s*'([^']+)'/) || [])[1];
  const project = (js.match(/projectId:\s*'([^']+)'/) || [])[1];
  if (!key || !project) note('warn', 'Firebase web config found in the page', 'could not read it; skipping the key checks');
  else {
    note('info', 'Firebase web config is visible in the page source', 'normal and unavoidable for a web app: it names the project, it is not a password');
    const base = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`;
    const read = await get(`${base}/ratelimit?pageSize=1&key=${key}`);
    note(read.status === 403 ? 'ok' : 'FAIL', 'Firestore: an outsider cannot read', 'HTTP ' + read.status + (read.status === 403 ? '' : ' - the rules are open: deploy firestore.rules NOW'));
    const write = await get(`${base}/zz_probe/probe?currentDocument.exists=true&key=${key}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{"fields":{}}' });
    note(write.status === 403 ? 'ok' : 'FAIL', 'Firestore: an outsider cannot write', 'HTTP ' + write.status + (write.status === 403 ? '' : ' - the rules are open: deploy firestore.rules NOW'));

    const probe = (referer) => get(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${key}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(referer ? { Referer: referer } : {}) },
      body: JSON.stringify({ email: 'audit-probe@example.invalid', password: 'x', returnSecureToken: true }),
    });
    const pw = await (await probe()).text();
    note(/PASSWORD_LOGIN_DISABLED/.test(pw) ? 'ok' : 'warn', 'e-mail / password sign-up is switched off', /PASSWORD_LOGIN_DISABLED/.test(pw) ? 'provider disabled' : 'the provider answers: if the site only offers Google, disable Email/Password in Firebase Authentication');
    const other = await (await probe('https://evil.example/')).text();
    const blocked = /API_KEY_HTTP_REFERRER_BLOCKED|referer .* are blocked|HTTP_REFERRER/i.test(other);
    note(blocked ? 'ok' : 'warn', 'the key only works from this site (HTTP referrer restriction)', blocked ? 'requests from another site are refused' : 'a request pretending to come from another site was accepted. Restrict the key: Google Cloud Console > APIs & Services > Credentials > the Browser key > Websites');
  }
}

// ---- 4. secrets in the repository ----
try {
  const hits = execSync(`git ls-files | grep -v "^node_modules/" | xargs grep -n -I -E "sk_live_[0-9A-Za-z]{10,}|whsec_[0-9A-Za-z]{10,}|-----BEGIN (RSA |EC )?PRIVATE KEY|\\"private_key\\" *:" || true`, { encoding: 'utf8', shell: 'bash' }).trim();
  note(hits ? 'FAIL' : 'ok', 'no private keys or live Stripe keys in the repository', hits || 'none found');
  const env = execSync('git log --all --oneline -- .env | wc -l', { encoding: 'utf8', shell: 'bash' }).trim();
  note(env === '0' ? 'ok' : 'FAIL', '.env was never committed', env === '0' ? 'not in any commit' : env + ' commit(s) touch .env: rotate every key in it');
} catch { note('warn', 'repository scan', 'needs git and bash'); }

// ---- report ----
const icon = { ok: '  ok  ', info: ' info ', warn: ' WARN ', FAIL: ' FAIL ' };
for (const r of results) console.log(`[${icon[r.level]}] ${r.title}\n         ${r.detail}`);
const fails = results.filter((r) => r.level === 'FAIL').length;
const warns = results.filter((r) => r.level === 'warn').length;
console.log(`\n${fails ? fails + ' failure(s)' : 'no failures'}, ${warns} warning(s)`);
process.exit(fails ? 1 : 0);
