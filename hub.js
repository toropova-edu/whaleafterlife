/* Whale Afterlife: home page (whale chooser) */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const reducedMotion = () => document.documentElement.getAttribute('data-motion') === 'off';
  const rand = (a, b) => a + Math.random() * (b - a);

  // bubbles drifting behind the cards
  document.querySelectorAll('.bubbles').forEach((box) => {
    for (let i = 0; i < (+box.dataset.bubbles || 8); i++) {
      const el = document.createElement('i');
      const size = rand(6, 18);
      el.className = 'bub';
      el.style.cssText = `left:${rand(2, 98).toFixed(1)}%;width:${size.toFixed(0)}px;height:${size.toFixed(0)}px;` +
        `animation-duration:${rand(7, 15).toFixed(1)}s;animation-delay:${(-Math.random() * 14).toFixed(1)}s;--dx:${rand(-30, 30).toFixed(0)}px`;
      box.appendChild(el);
    }
  });

  // motion switch (the choice is remembered)
  const mt = $('#motionToggle'), ml = $('#motionLabel');
  const paint = () => { const on = !reducedMotion(); mt.setAttribute('aria-pressed', String(on)); ml.textContent = on ? 'Motion: on' : 'Motion: off'; };
  mt.addEventListener('click', () => {
    const on = reducedMotion();
    document.documentElement.setAttribute('data-motion', on ? 'on' : 'off');
    try { localStorage.setItem('motion', on ? 'on' : 'off'); } catch (e) { /* private mode */ }
    paint();
  });
  paint();
})();
