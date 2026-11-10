/* Whale Afterlife: the "Her story, in short" window, shared by all story pages */
(() => {
  const m = document.getElementById('recapModal');
  if (!m) return;
  let back = null;
  const reduced = () => document.documentElement.getAttribute('data-motion') === 'off';

  function open() {
    if (!m.hidden) return;
    back = document.activeElement;
    m.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      m.classList.add('open');
      const h = m.querySelector('h2'); h.tabIndex = -1; h.focus({ preventScroll: true });
    }));
  }
  function close(instant = false) {
    if (m.hidden) return;
    m.classList.remove('open');
    document.documentElement.style.overflow = '';
    const done = () => { m.hidden = true; };
    if (instant || reduced()) done(); else setTimeout(done, 360);
    if (back && back.focus) back.focus({ preventScroll: true });
  }
  window.recap = { open, close };

  m.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
  document.addEventListener('keydown', (e) => {
    if (m.hidden) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'Tab') {                                   // keep focus inside the window
      const f = [...m.querySelectorAll('button:not([disabled]), a[href]')].filter((b) => b.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
})();
