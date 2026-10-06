// Runs every test script in this folder one after the other (works the same on Windows, macOS and Linux).
// Usage: npm test
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
let failed = false;
for (const file of ['test-claims.mjs', 'test-sync.mjs', 'test-api.mjs']) {
  console.log('\n— ' + file);
  const r = spawnSync(process.execPath, [join(here, file)], { stdio: 'inherit' });
  if (r.status !== 0) failed = true;
}
process.exit(failed ? 1 : 0);
