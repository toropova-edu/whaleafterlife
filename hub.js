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

  // paper waves at the bottom: one wave tile per colour, repeated sideways
  document.querySelectorAll('[data-wave]').forEach((el) => {
    const fill = el.dataset.wave;
    const crest = 'M0 20 C20 6 40 6 60 20 S100 34 120 20';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" preserveAspectRatio="none">` +
      `<path d="${crest} V40 H0Z" fill="${fill}"/>` +
      `<path d="${crest}" transform="translate(0 6)" fill="none" stroke="#fff" stroke-width="1.6" stroke-dasharray="5 6" opacity=".7"/></svg>`;
    const body = el.dataset.fill || `linear-gradient(${fill}, ${fill})`;
    el.style.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(svg)}"), ${body}`;
  });

  // the top bar is see-through over the sky, and gets its paper back once you scroll
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('nav--solid', window.scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

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
