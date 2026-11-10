/* Whale Afterlife: blue whale story (button-driven, two branches) */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a, b) => a + Math.random() * (b - a);
  const reducedMotion = () => document.documentElement.getAttribute('data-motion') === 'off';

  const wait = (ms) => new Promise((r) => setTimeout(r, reducedMotion() ? 0 : ms));
  const tween = (ms, fn, easing = (t) => t) => new Promise((res) => {
    if (reducedMotion()) { fn(1); return res(); }
    const t0 = performance.now();
    const tick = (now) => { const t = clamp((now - t0) / ms); fn(easing(t)); if (t < 1) requestAnimationFrame(tick); else res(); };
    requestAnimationFrame(tick);
  });

  /* sprites */
  $$('[data-sprite]').forEach((img) => { img.src = `assets/sprites/${img.dataset.sprite}.png`; });

  const stage = $('#rw'), group = $('#group'), whale = $('#whale');
  const caps = $('.rw-caps');
  const birds = $$('.bird');
  const swimmers = [$('.bw-shark'), ...$$('.bw-fish')];
  const tourists = $$('.tourist'), crewM = $$('.crew-m');

  /* ---------- sea: one wave tile per colour, repeated sideways at a fixed size ---------- */
  $$('[data-wave]').forEach((el) => {
    const fill = el.dataset.wave;
    const crest = 'M0 20 C20 6 40 6 60 20 S100 34 120 20';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" preserveAspectRatio="none">` +
      `<path d="${crest} V40 H0Z" fill="${fill}"/>` +
      `<path d="${crest}" transform="translate(0 6)" fill="none" stroke="#fff" stroke-width="1.6" stroke-dasharray="5 6" opacity=".7"/></svg>`;
    const body = el.dataset.fill || `linear-gradient(${fill}, ${fill})`;
    el.style.backgroundImage = `url("data:image/svg+xml,${encodeURIComponent(svg)}"), ${body}`;
  });

  /* ---------- captions and progress ---------- */
  const showCap = (idx) => $$('.cap', caps).forEach((c) => {
    const on = +c.dataset.step === idx;
    c.classList.toggle('on', on); c.classList.remove('ready');
    if (on) $$('[data-act]', c).forEach((b) => { b.disabled = false; });      // buttons work again when a step is revisited
  });
  const setReady = (idx) => { const c = $$('.cap', caps).find((x) => +x.dataset.step === idx); if (c) c.classList.add('ready'); };
  const JOURNEY = { 0: 0, 1: 1, 2: 2, 3: 4, 4: 2, 5: 3, 6: 3, 7: 4 };
  const dots = $$('#journey li');
  const paint = (n) => dots.forEach((d, i) => {
    d.classList.toggle('done', i < n); d.classList.toggle('on', i === n);
    if (i === n) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current');
  });
  const setStep = (n) => { showCap(n); paint(JOURNEY[n]); };
  $('#journey').classList.add('show');
  const ready = (idx, ms = 350) => setTimeout(() => setReady(idx), reducedMotion() ? 0 : ms);

  /* ---------- the choice, as a popup ---------- */
  const modal = $('#rwModal');
  let returnFocus = null;
  function openModal() {
    if (!modal.hidden) return;
    returnFocus = document.activeElement;
    modal.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      modal.classList.add('open');
      const h = $('#q1 h2'); h.tabIndex = -1; h.focus({ preventScroll: true });
    }));
  }
  function closeModal(instant = false) {
    if (modal.hidden) return;
    modal.classList.remove('open');
    const done = () => { modal.hidden = true; };
    if (instant || reducedMotion()) done(); else setTimeout(done, 360);
    if (returnFocus && returnFocus.focus) returnFocus.focus({ preventScroll: true });
  }
  modal.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeModal(); });
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

  /* ---------- story pieces ---------- */
  const PUFFED = 'assets/sprites/blue-whale-puffed.png';
  const NORMAL = 'assets/sprites/blue-whale.png';

  function puff() {                                   // she swells like a balloon
    whale.src = PUFFED;
    group.classList.remove('puffed'); void group.offsetWidth; group.classList.add('puffed');
  }
  // every bird is placed from the whale's real outline: its feet land on her back, never in the air
  async function seatBirds() {
    try {
      await whale.decode();
      const W = whale.naturalWidth, H = whale.naturalHeight;
      if (!W || !group.offsetWidth) return;
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const ctx = cv.getContext('2d', { willReadFrequently: true }); ctx.drawImage(whale, 0, 0);
      const gw = group.offsetWidth;
      birds.forEach((b) => {
        const c = (b.offsetLeft + b.offsetWidth / 2) / gw, half = (b.offsetWidth * 0.3) / gw;
        const x0 = Math.max(0, Math.round((c - half) * W)), x1 = Math.min(W - 1, Math.round((c + half) * W));
        let sum = 0, n = 0;
        for (let x = x0; x <= x1; x += 3) {
          const col = ctx.getImageData(x, 0, 1, H).data;
          for (let y = 0; y < H; y++) if (col[y * 4 + 3] > 60) { sum += y; n++; break; }
        }
        if (n) b.style.bottom = `${((1 - sum / n / H) * 100 - 5).toFixed(1)}%`;     // 5% tucked into her back
      });
    } catch (e) { /* keep the CSS positions */ }
  }
  async function landBirds() {                        // branch A: guests from the sky and the sea
    await seatBirds();
    for (const b of birds) { b.classList.add('in'); await wait(380); }
    swimmers.forEach((s) => s.classList.add('in'));
  }
  const clearSea = () => { birds.forEach((b) => b.classList.remove('in')); swimmers.forEach((s) => s.classList.remove('in')); };
  const popList = async (list, gap) => { for (const el of list) { el.classList.add('in'); await wait(gap); } };

  // branch B: one hard cut to Alaska
  function cutToAlaska() {
    window.scrollTo(0, 0);
    clearSea();
    stage.classList.add('rw--ak');
    group.classList.remove('wipe');
    group.style.setProperty('--eat', -14);
    group.style.visibility = '';
    setStep(4);
    ready(4, 300);
  }
  async function visitors() {
    setStep(5);
    await popList(tourists, 200);
    setReady(5);
  }
  async function crewStep() {                         // tourists leave, the crew works from the tail to the head
    setStep(6);
    tourists.forEach((t) => t.classList.remove('in'));
    await wait(300);
    await popList(crewM, 160);
    await wait(500);
    group.classList.add('wipe');
    await tween(5000, (t) => group.style.setProperty('--eat', lerp(-14, 100, t).toFixed(2)));
    group.style.visibility = 'hidden';
    await wait(1500);                                 // a quiet beat: the empty beach, before the last card
    setStep(7);
    ready(7, 500);
  }
  function backToSea() {                              // "try the other way" from the beach: the sea branch
    window.scrollTo(0, 0);
    stage.classList.remove('rw--ak');
    tourists.forEach((t) => t.classList.remove('in')); crewM.forEach((c) => c.classList.remove('in'));
    group.classList.remove('wipe'); group.style.setProperty('--eat', -14); group.style.visibility = '';
    whale.src = PUFFED;
    setStep(2);
    landBirds();
    ready(2, 1800);
  }

  const actions = {
    start: () => { setStep(1); puff(); ready(1); },
    ask: () => openModal(),
    animals: () => { closeModal(true); setStep(2); landBirds(); ready(2, 1800); },
    a2: () => { setStep(3); ready(3); },
    shore: () => { closeModal(true); window.stage.cut(cutToAlaska); },
    shore2: () => window.stage.cut(cutToAlaska),
    b2: () => visitors(),
    b3: () => crewStep(),
    animals2: () => window.stage.cut(backToSea),
    recap: () => window.recap.open(),
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    if (b.dataset.act !== 'ask' && b.dataset.act !== 'recap') b.disabled = true;           // each step button works once per visit
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
  let lastTrail = 0;
  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' || reducedMotion()) return;
    const now = performance.now(); if (now - lastTrail < 90) return; lastTrail = now;
    spawnTrail(e.clientX, e.clientY);
  }, { passive: true });
  const POKES = [['.bw-whale', ['mmm…', 'hello', '♥']], ['.bird', ['caw!', 'squawk!']], ['.tourist', ['wow!', 'look!']],
    ['.crew-m', ['careful…', 'all good']], ['.bw-shark', ['hi there!']]];
  document.addEventListener('click', (e) => {
    for (const [sel, words] of POKES) {
      const t = e.target.closest(sel); if (!t) continue;
      t.classList.remove('poked'); void t.offsetWidth; t.classList.add('poked'); setTimeout(() => t.classList.remove('poked'), 700);
      floatText(e.clientX, e.clientY - 12, words[Math.floor(Math.random() * words.length)]);
      if (!reducedMotion()) for (let i = 0; i < 4; i++) spawnTrail(e.clientX + rand(-16, 16), e.clientY + rand(-10, 10));
      break;
    }
  });
  $$('.bubbles').forEach((box) => {
    for (let i = 0; i < (+box.dataset.bubbles || 10); i++) {
      const el = document.createElement('i'); const size = rand(6, 16);
      el.className = 'bub';
      el.style.cssText = `left:${rand(2, 98).toFixed(1)}%;width:${size.toFixed(0)}px;height:${size.toFixed(0)}px;animation-duration:${rand(7, 14).toFixed(1)}s;animation-delay:${(-Math.random() * 14).toFixed(1)}s;--dx:${rand(-30, 30).toFixed(0)}px`;
      box.appendChild(el);
    }
  });

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

  whale.src = NORMAL;
  setStep(0); ready(0, 600);
})();
