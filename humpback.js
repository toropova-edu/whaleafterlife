/* Whale Afterlife: humpback story (button-driven, two endings) */
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
  const WAVE_IMG = { '#16707A': 'wave-deep', '#5FB0B0': 'wave-mid', '#A9D6D3': 'wave-light' };
  const WAVE_FILL = { 'wave-deep': '#276C75', 'wave-mid': '#609FA4', 'wave-light': '#A3CDCC' };
  const WAVE_AR = { 'wave-deep': 8.43, 'wave-mid': 8.26, 'wave-light': 6.2 };
  $$('[data-wave]').forEach((el) => {
    const n = WAVE_IMG[el.dataset.wave] || 'wave-mid';
    const body = el.dataset.fill || `linear-gradient(${WAVE_FILL[n]}, ${WAVE_FILL[n]})`;   // below the crest: flat colour or a gradient
    el.style.setProperty('--ar', WAVE_AR[n]);
    el.style.backgroundImage = `url("assets/sprites/${n}.png"), ${body}`;
  });

  /* ---------- captions and progress ---------- */
  const showCap = (idx) => $$('.cap', caps).forEach((c) => { c.classList.toggle('on', +c.dataset.step === idx); c.classList.remove('ready'); });
  const setReady = (idx) => { const c = $$('.cap', caps).find((x) => +x.dataset.step === idx); if (c) c.classList.add('ready'); };
  const JOURNEY = { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 3, 6: 4 };
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
  const setState = (cls) => ['hb--freed', 'hb--gone', 'hb--weak'].forEach((c) => stage.classList.toggle(c, c === cls));
  async function sailIn() {
    await tween(2400, (t) => { boat.style.transform = `translateX(${lerp(62, 0, t).toFixed(2)}vw)`; }, easeOutSine);
    for (const c of crew) { c.classList.add('in'); await wait(160); }
  }
  const sailOut = () => {
    crew.forEach((c) => c.classList.remove('in'));
    return tween(1800, (t) => { boat.style.transform = `translateX(${lerp(0, 62, t).toFixed(2)}vw)`; });
  };

  function toRescue() {                      // back to the moment of the second choice
    closeModal(true);
    setState(null);
    $('#hearts').classList.remove('on');
    boat.style.transform = 'translateX(0)';
    crew.forEach((c) => c.classList.add('in'));
    $$('[data-act]').forEach((b) => { b.disabled = false; });
    setStep(2); ready(2);
  }
  function reset() {
    closeModal(true);
    setState(null);
    boat.style.transform = '';
    crew.forEach((c) => c.classList.remove('in'));
    $('#hearts').classList.remove('on');
    $$('[data-act]').forEach((b) => { b.disabled = false; });
    window.recap.close(true);
    setStep(0); ready(0, 500);
  }

  const actions = {
    spot: async () => { setStep(1); setTimeout(() => setReady(1), reducedMotion() ? 0 : 900); await sailIn(); },
    ask: () => openModal('q1'),
    rescue: () => { closeModal(true); setStep(2); ready(2); },
    decide: () => openModal('q2'),
    keep: () => { closeModal(true); setState('hb--freed'); setStep(3); ready(3, 900); },
    years: () => { setStep(4); ready(4); $('#hearts').classList.add('on'); confetti(); sailOut(); },
    tomorrow: () => { closeModal(true); window.stage.cut(() => { setState('hb--gone'); sailOut(); setStep(5); ready(5, 300); }); },
    weak: () => window.stage.cut(() => { setState('hb--weak'); setStep(6); ready(6, 300); }),
    retry: () => window.stage.cut(toRescue),
    recap: () => window.recap.open(),
    again: () => window.stage.cut(reset),
  };
  const KEEP_ENABLED = new Set(['ask', 'decide', 'recap']);
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
  const POKES = [['#whale', ['mmm…', 'hello', '♪']], ['.crew', ['hi!', 'careful…']], ['.rw-boat__hull', ['toot toot!']]];
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
