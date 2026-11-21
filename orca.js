/* Whale Afterlife: orca story (button-driven, two endings) */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const easeOutSine = (t) => Math.sin((t * Math.PI) / 2);
  const rand = (a, b) => a + Math.random() * (b - a);
  const reducedMotion = () => document.documentElement.getAttribute('data-motion') === 'off';

  const wait = (ms) => new Promise((r) => setTimeout(r, reducedMotion() ? 0 : ms));
  const tween = (ms, fn, easing = ease) => new Promise((res) => {
    if (reducedMotion()) { fn(1); return res(); }
    const t0 = performance.now();
    const tick = (now) => { const t = clamp((now - t0) / ms); fn(easing(t)); if (t < 1) requestAnimationFrame(tick); else res(); };
    requestAnimationFrame(tick);
  });

  /* sprites: the PNG from assets/sprites (fin whale only as a last resort) */
  $$('[data-sprite]').forEach((img) => {
    const n = img.dataset.sprite;
    const list = [`assets/sprites/${n}.png`];
    let i = 0;
    const next = () => { if (i < list.length) img.src = list[i++]; };
    img.addEventListener('error', next);
    next();
  });

  const stage = $('#rw'), whale = $('#whale'), boat = $('#boat');
  const caps = $('.rw-caps');
  const crew = $$('.crew');

  /* ---------- sea: one wave tile per colour, repeated sideways at a fixed size ---------- */
  $$('[data-wave]').forEach((el) => {
    const fill = el.dataset.wave;
    // one period: starts and ends at the same height and slope, so the tiles join seamlessly
    const crest = 'M0 20 C20 6 40 6 60 20 S100 34 120 20';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" preserveAspectRatio="none">` +
      `<path d="${crest} V40 H0Z" fill="${fill}"/>` +
      `<path d="${crest}" transform="translate(0 6)" fill="none" stroke="#fff" stroke-width="1.6" stroke-dasharray="5 6" opacity=".7"/></svg>`;
    const body = el.dataset.fill || `linear-gradient(${fill}, ${fill})`;   // below the crest: flat colour or a gradient
    el.style.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(svg)}"), ${body}`;
  });

  /* ---------- captions and progress ---------- */
  const showCap = (idx) => $$('.cap', caps).forEach((c) => { c.classList.toggle('on', +c.dataset.step === idx); c.classList.remove('ready'); });
  const setReady = (idx) => { const c = $$('.cap', caps).find((x) => +x.dataset.step === idx); if (c) c.classList.add('ready'); };
  const JOURNEY = { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 2, 6: 3, 7: 3, 8: 4 };
  const dots = $$('#journey li');
  const paint = (n) => dots.forEach((d, i) => {
    d.classList.toggle('done', i < n); d.classList.toggle('on', i === n);
    if (i === n) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current');
  });
  const setStep = (n) => { showCap(n); paint(JOURNEY[n]); };
  $('#journey').classList.add('show');
  const ready = (idx, ms = 350) => setTimeout(() => setReady(idx), reducedMotion() ? 0 : ms);

  /* ---------- the choices, as one popup with three panels ---------- */
  const modal = $('#rwModal');
  const panels = $$('.flow-panel');
  const show = (id, focus = true) => {
    panels.forEach((p) => { p.hidden = p.id !== id; });
    const el = document.getElementById(id);
    if (focus && el) { const h = $('h2', el); h.tabIndex = -1; h.focus({ preventScroll: true }); }
  };
  let returnFocus = null;
  function openModal(panel) {
    if (!modal.hidden) return;
    returnFocus = document.activeElement;
    show(panel, false);
    modal.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      modal.classList.add('open');
      const h = $(`#${panel} h2`); h.tabIndex = -1; h.focus({ preventScroll: true });
    }));
  }
  function closeModal(instant = false) {
    if (modal.hidden) return;
    modal.classList.remove('open');
    const done = () => { modal.hidden = true; };
    if (instant || reducedMotion()) done(); else setTimeout(done, 360);
    if (returnFocus && returnFocus.focus) returnFocus.focus({ preventScroll: true });
  }
  modal.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) closeModal();
    const g = e.target.closest('[data-go]'); if (g) show(g.dataset.go);
  });
  document.addEventListener('keydown', (e) => {
    if (modal.hidden) return;
    if (e.key === 'Escape') { closeModal(); return; }
    if (e.key === 'Tab') {
      const f = $$('button:not([hidden]):not([disabled])', modal).filter((b) => b.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- story steps ---------- */
  const FLAGS = ['oc--family', 'oc--close', 'oc--passed', 'rw--shore', 'oc--shore', 'oc--found', 'oc--sci'];
  const flag = (...on) => FLAGS.forEach((c) => stage.classList.toggle(c, on.includes(c)));
  const enableAll = () => $$('[data-act]').forEach((b) => { b.disabled = false; });

  function toChoice() {                       // back to the moment of the choice, family around
    closeModal(true);
    flag('oc--family');
    $('#hearts').classList.remove('on');
    enableAll();
    setStep(1); ready(1);
  }
  function reset() {
    closeModal(true);
    flag();
    $('#hearts').classList.remove('on');
    enableAll();
    window.recap.close(true);
    setStep(0); ready(0, 500);
  }

  const actions = {
    meet: () => { flag('oc--family'); setStep(1); ready(1, 900); },
    ask: () => openModal('q1'),
    // road one: a peaceful goodbye among the family
    family: () => { closeModal(true); setStep(2); ready(2); },
    goodbye: () => { flag('oc--family', 'oc--close'); setStep(3); ready(3, 900); },
    lead: () => { flag('oc--family', 'oc--passed'); setStep(4); ready(4, 1200); $('#hearts').classList.add('on'); confetti(); },
    // road two: found on a shore of the White Sea
    mystery: () => { closeModal(true); window.stage.cut(() => { flag('rw--shore', 'oc--shore'); setStep(5); ready(5, 300); }); },
    found: () => { flag('rw--shore', 'oc--shore', 'oc--found'); setStep(6); ready(6, 600); },
    photo: () => { flag('rw--shore', 'oc--shore', 'oc--found', 'oc--sci'); setStep(7); ready(7, 600); },
    teeth: () => { setStep(8); ready(8); const r = $('#whale').getBoundingClientRect(); floatText(r.left + r.width / 2, r.top, 'pu-pu-pu'); },
    retry: () => window.stage.cut(toChoice),
    recap: () => window.recap.open(),
    again: () => window.stage.cut(reset),
  };
  const KEEP_ENABLED = new Set(['ask', 'recap']);
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    if (!KEEP_ENABLED.has(b.dataset.act)) b.disabled = true;                // each step button works once
    actions[b.dataset.act]();
  });

  /* ---------- small details ---------- */
  function floatText(x, y, text) {
    const el = document.createElement('span');
    el.className = 'floaty'; el.textContent = text; el.style.left = `${x}px`; el.style.top = `${y}px`;
    document.body.appendChild(el); setTimeout(() => el.remove(), 1500);
  }
  function spawnTrail(x, y) {
    const el = document.createElement('i'); const s = rand(5, 11);
    el.className = 'trail';
    el.style.cssText = `left:${x}px;top:${y}px;width:${s.toFixed(1)}px;height:${s.toFixed(1)}px;--dx:${rand(-14, 14).toFixed(0)}px`;
    document.body.appendChild(el); setTimeout(() => el.remove(), 1400);
  }
  function confetti() {
    if (reducedMotion()) return;
    const colors = ['#F4A6A0', '#F2CC8F', '#FFFFFF', '#A9D6D3', '#E07A5F'];
    for (let i = 0; i < 28; i++) {
      const el = document.createElement('i');
      el.className = 'conf'; el.textContent = Math.random() < .5 ? '♥' : '✦';
      el.style.cssText = `left:${rand(3, 97).toFixed(1)}%;color:${colors[Math.floor(Math.random() * colors.length)]};font-size:${rand(14, 28).toFixed(0)}px;` +
        `animation-duration:${rand(3.6, 6.8).toFixed(1)}s;animation-delay:${rand(0, 1.4).toFixed(2)}s;--dx:${rand(-70, 70).toFixed(0)}px`;
      document.body.appendChild(el); setTimeout(() => el.remove(), 9500);
    }
  }
  let lastTrail = 0;
  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' || reducedMotion()) return;
    const now = performance.now(); if (now - lastTrail < 90) return; lastTrail = now;
    spawnTrail(e.clientX, e.clientY);
  }, { passive: true });
  const POKES = [['#whale', ['mmm…', 'hello', '♪']], ['.oc-person', ['hi!', 'oh…']], ['.oc-calf', ['…']]];
  document.addEventListener('click', (e) => {
    for (const [sel, words] of POKES) {
      const t = e.target.closest(sel); if (!t) continue;
      t.classList.remove('poked'); void t.offsetWidth; t.classList.add('poked'); setTimeout(() => t.classList.remove('poked'), 700);
      floatText(e.clientX, e.clientY - 12, words[Math.floor(Math.random() * words.length)]);
      if (!reducedMotion()) for (let i = 0; i < 4; i++) spawnTrail(e.clientX + rand(-16, 16), e.clientY + rand(-10, 10));
      break;
    }
  });
  (function bubbles() {
    $$('.bubbles').forEach((box) => {
      for (let i = 0; i < (+box.dataset.bubbles || 10); i++) {
        const el = document.createElement('i'); const size = rand(6, 16);
        el.className = 'bub';
        el.style.cssText = `left:${rand(2, 98).toFixed(1)}%;width:${size.toFixed(0)}px;height:${size.toFixed(0)}px;animation-duration:${rand(7, 14).toFixed(1)}s;animation-delay:${(-Math.random() * 14).toFixed(1)}s;--dx:${rand(-30, 30).toFixed(0)}px`;
        box.appendChild(el);
      }
    });
  })();

  /* ---------- motion switch ---------- */
  const mt = $('#motionToggle'), ml = $('#motionLabel');
  const paintMotion = () => { const on = !reducedMotion(); mt.setAttribute('aria-pressed', String(on)); ml.textContent = on ? 'Motion: on' : 'Motion: off'; };
  mt.addEventListener('click', () => {
    const on = reducedMotion();
    document.documentElement.setAttribute('data-motion', on ? 'on' : 'off');
    try { localStorage.setItem('motion', on ? 'on' : 'off'); } catch (e) { /* private mode */ }
    paintMotion();
  });
  paintMotion();

  setStep(0); ready(0, 600);
})();
