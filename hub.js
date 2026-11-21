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
  const WAVE_IMG = { '#16707A': 'wave-deep', '#5FB0B0': 'wave-mid', '#A9D6D3': 'wave-light' };
  const WAVE_FILL = { 'wave-deep': '#276C75', 'wave-mid': '#609FA4', 'wave-light': '#A3CDCC' };
  const WAVE_AR = { 'wave-deep': 8.43, 'wave-mid': 8.26, 'wave-light': 6.2 };
  document.querySelectorAll('[data-wave]').forEach((el) => {
    const n = WAVE_IMG[el.dataset.wave] || 'wave-mid';
    const body = el.dataset.fill || `linear-gradient(${WAVE_FILL[n]}, ${WAVE_FILL[n]})`;   // below the crest: flat colour or a gradient
    el.style.setProperty('--ar', WAVE_AR[n]);
    el.style.backgroundImage = `url("assets/sprites/${n}.png"), ${body}`;
  });

  // the top bar is see-through over the sky, and gets its paper back once you scroll
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('nav--solid', window.scrollY > 24);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // after a couple of stories have been read to the end, show where the facts come from
  try {
    const seen = JSON.parse(localStorage.getItem('seen') || '[]');
    if (seen.length >= 2) $('#sourcesUnlock').hidden = false;
  } catch (e) { /* private mode */ }

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
