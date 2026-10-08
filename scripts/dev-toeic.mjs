// Look at the TOEIC book sets on your own machine, as a (pretend) member, without Supabase, Stripe or Google sign-in:
//   npm run dev:toeic            then open http://localhost:3000/#toeic
//   npm run dev:toeic -- C:/other/build/folder     read the content from another folder (default: build/toeic)
// Everything is local: the content is read from the build folder, the "database" lives in memory (restart = fresh counters),
// and the pages are served with a pretend signed-in member. It does nothing on Vercel and never touches a real account.
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dir = resolve(process.argv[2] || join(root, 'build', 'toeic'));
if (!existsSync(join(dir, 'index.json'))) {
  console.error('No content in ' + dir + '\nRun: python tools/toeic/extract.py --src "<folder with the PDFs>" --out build/toeic');
  process.exit(1);
}
process.env.PAY_MODE = 'mock';
process.env.DEV_MOCK_MEMBER = '1';
process.env.TOEIC_DIR = dir;
delete process.env.FIREBASE_PRIVATE_KEY;
delete process.env.VERCEL;
delete process.env.VERCEL_ENV;

const require = createRequire(import.meta.url);
const { setUserPass } = require('../api/_firebase.js');
for (const uid of ['dev-member', 'dev-set1', 'dev-set2', 'dev-set3']) await setUserPass(uid, { exp: Date.now() + 30 * 86_400_000, plan: 'd30', sid: 'dev' });
console.log('TOEIC preview: content from ' + dir);
await import(pathToFileURL(join(root, 'scripts', 'dev-server.mjs')).href);
