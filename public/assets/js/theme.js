// Runs in <head> before first paint so a saved light/dark choice never flashes.
(function () {
  try {
    var t = localStorage.getItem('cefr:theme');
    if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  } catch (e) { /* storage blocked — fall back to system preference */ }
})();
