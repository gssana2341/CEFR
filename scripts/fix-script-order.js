const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../public');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const scripts = `  <script src="assets/js/common.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.9.0/firebase-auth-compat.js"></script>
  <script src="assets/js/firebase-init.js"></script>
  <script src="assets/js/auth.js"></script>`;

const oldScripts = `  <script src="https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.9.0/firebase-auth-compat.js"></script>
  <script src="assets/js/firebase-init.js"></script>
  <script src="assets/js/auth.js"></script>
  <script src="assets/js/common.js"></script>`;

for (const file of files) {
  const p = path.join(dir, file);
  let content = fs.readFileSync(p, 'utf8');
  content = content.replace(oldScripts, scripts);
  fs.writeFileSync(p, content);
  console.log('Fixed ' + file);
}
