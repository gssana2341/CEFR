// Local stand-in for Vercel (no login needed): serves ./public, mirrors vercel.json
// (clean URLs, security headers, CSP), runs ./api/*.js functions, and falls back to 404.html.
// Usage: npm run dev            (PORT=4000 npm run dev to change the port)
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PUBLIC = join(ROOT, 'public');
const config = JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8'));

// DEV_MOCK_MEMBER=1 (with PAY_MODE=mock; see scripts/dev-toeic.mjs): the pages are served without the Firebase sign-in and with a
// pretend signed-in member instead, so everything behind a membership can be looked at locally. Can never be on at Vercel.
const MOCK_MEMBER = process.env.DEV_MOCK_MEMBER === '1' && process.env.PAY_MODE === 'mock' && !process.env.VERCEL && !process.env.VERCEL_ENV;
const MOCK_AUTH_JS = `// local preview only: a pretend signed-in member (one account per TOEIC set, so the daily Part cap is not hit while browsing)
(function () {
  var set = Number(new URLSearchParams(location.search).get('set')) || 0;
  var uid = set ? 'dev-set' + set : 'dev-member';
  window.CEFR.auth = { ready: Promise.resolve(), user: function () { return { uid: uid, displayName: 'สมาชิกจำลอง', email: null }; }, getToken: function () { return Promise.resolve('mock-' + uid); }, showLogin: function () {} };
  var tag = document.createElement('div');
  tag.textContent = 'โหมดดูในเครื่อง · สมาชิกจำลอง';
  tag.style.cssText = 'position:fixed;right:10px;bottom:10px;z-index:99;padding:4px 10px;border-radius:999px;background:#b45309;color:#fff;font:12px/1.4 system-ui;opacity:.85;pointer-events:none';
  document.addEventListener('DOMContentLoaded', function () { document.body.append(tag); });
})();
`;
function mockMemberHtml(html) {
  return html
    .replace(/<script[^>]*firebasejs[^>]*><\/script>\s*/g, '')
    .replace(/<script src="assets\/js\/(firebase-init|auth)\.js"><\/script>\s*/g, '')
    .replace('<script src="assets/js/common.js"></script>', '<script src="assets/js/common.js"></script>\n  <script src="_dev-auth.js"></script>');
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
};

function configHeaders(path) {
  const out = { 'Cache-Control': 'no-store' }; // dev: never serve stale files
  for (const rule of config.headers || []) {
    const re = new RegExp('^' + rule.source.replace(/\(\.\*\)/g, '.*') + '$');
    if (re.test(path)) for (const h of rule.headers) out[h.key] = h.value;
  }
  return out;
}

async function runApi(name, req, res, url) {
  if (name.startsWith('_')) return false; // helpers are not endpoints (same as Vercel)
  const file = join(ROOT, 'api', name + '.js');
  if (!existsSync(file)) return false;
  // Minimal Vercel-style helpers: req.query, res.status().send()/json()
  req.query = Object.fromEntries(url.searchParams);
  res.status = (code) => { res.statusCode = code; return res; };
  res.send = (body) => res.end(body);
  res.json = (obj) => { res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(obj)); };
  const mod = await import(pathToFileURL(file).href + '?t=' + Date.now()); // re-read on every call
  await (mod.default || mod)(req, res);
  return true;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    const path = decodeURIComponent(url.pathname);

    if (path.startsWith('/api/')) {
      const handled = await runApi(path.slice(5).replace(/\/$/, ''), req, res, url);
      if (handled) return;
    } else if (path.endsWith('.html')) { // cleanUrls
      res.writeHead(308, { Location: (path === '/index.html' ? '/' : path.slice(0, -5)) + url.search });
      return res.end();
    }

    if (MOCK_MEMBER && path === '/_dev-auth.js') {
      res.writeHead(200, { 'Content-Type': TYPES['.js'], ...configHeaders(path) });
      return res.end(MOCK_AUTH_JS);
    }

    let file = join(PUBLIC, path === '/' ? 'index.html' : path);
    if (!file.startsWith(PUBLIC + sep) && file !== PUBLIC) { res.writeHead(403); return res.end('Forbidden'); }
    if ((!existsSync(file) || statSync(file).isDirectory()) && existsSync(file + '.html')) file += '.html';

    if (!existsSync(file) || statSync(file).isDirectory()) {
      res.writeHead(404, { 'Content-Type': TYPES['.html'], ...configHeaders(path) });
      return res.end(readFileSync(join(PUBLIC, '404.html')));
    }
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', ...configHeaders(path) });
    res.end(MOCK_MEMBER && extname(file) === '.html' ? mockMemberHtml(readFileSync(file, 'utf8')) : readFileSync(file));
  } catch (e) {
    console.error(e);
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Server error: ' + e.message);
  }
});

let port = Number(process.env.PORT) || 3000;
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE' && port < (Number(process.env.PORT) || 3000) + 10) {
    server.listen(++port);
  } else {
    throw e;
  }
});
server.on('listening', () => console.log(`CEFR Quiz dev server → http://localhost:${port}`));
server.listen(port);
