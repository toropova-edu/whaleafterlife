/* Whale Afterlife: fin whale journey (sprites + button-driven stages) */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const easeOutSine = (t) => Math.sin((t * Math.PI) / 2);
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const rand = (a, b) => a + Math.random() * (b - a);
  const reducedMotion = () => document.documentElement.getAttribute('data-motion') === 'off';
  const SPRITES = 'assets/sprites/';
  const body = document.body;

  /* time-based helpers: every stage change is smooth and independent of scrolling */
  const wait = (ms) => new Promise((r) => setTimeout(r, reducedMotion() ? 0 : ms));
  const tween = (ms, fn, easing = ease) => new Promise((res) => {
    if (reducedMotion()) { fn(1); return res(); }
    const t0 = performance.now();
    const tick = (now) => {
      const t = clamp((now - t0) / ms);
      fn(easing(t));
      if (t < 1) requestAnimationFrame(tick); else res();
    };
    requestAnimationFrame(tick);
  });
  const scrollToEl = (el) => el.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });

  /* captions: one visible at a time; its button fades in when the step is ready */
  const showCap = (root, idx) => $$('.cap', root).forEach((c) => { c.classList.toggle('on', +c.dataset.step === idx); c.classList.remove('ready'); });
  const setReady = (root, idx) => { const c = $$('.cap', root).find((x) => +x.dataset.step === idx); if (c) c.classList.add('ready'); };

  /* ---------- reef scene: worms, anemones ---------- */
  const ribs = $('#ribs');
  const pops = [];  // { el, kind, s }

  const addPop = (kind, src, x, y, rot, s, flip) => {
    const el = document.createElement('div');
    el.className = `pop pop--${kind}`;
    el.style.left = `${x.toFixed(2)}%`;
    el.style.top = `${y.toFixed(2)}%`;
    el.style.rotate = `${rot.toFixed(1)}deg`;
    const img = new Image();
    img.src = SPRITES + src; img.alt = ''; img.decoding = 'async';
    img.style.animationDelay = `${(-Math.random() * 3).toFixed(2)}s`;
    if (flip) img.style.scale = '-1 1';
    el.appendChild(img);
    ribs.appendChild(el);
    pops.push({ el, kind, s });
  };

  if (ribs) {
    // outer edge of the front rib arch measured from the sprite: [left %, top %, right %, rib thickness %]
    const K = 392 / 529;   // height/width of the arch box, to compare % of height with % of width
    const OUTER = [[14.6, 21, 85.1, 9.1], [9.6, 30, 90, 7.4], [6, 39, 93.6, 6.6], [3.4, 48, 96.2, 6.2], [1.7, 57, 97.9, 5.9],
                   [.6, 66, 99.1, 5.9], [.4, 75, 99.4, 5.7], [.8, 84, 98.9, 5.7], [2.1, 93, 97.5, 5.1]];
    const normalAngle = (pts, i, side) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      const tx = b[0] - a[0], ty = (b[1] - a[1]) * K;
      const n = side < 0 ? [-ty, tx] : [ty, -tx];            // outward normal
      const deg = Math.atan2(n[0], -n[1]) * 180 / Math.PI;    // 0 = straight up
      return side < 0 ? clamp(deg * .8, -72, -26) : clamp(deg * .8, 26, 72);
    };
    const L = OUTER.map(([l, t]) => [l, t]);
    const R = OUTER.map(([, t, r]) => [r, t]);
    const LEFT_ROWS = [1, 4, 7], RIGHT_ROWS = [0, 3, 5];        // only a few, never in a tidy line
    OUTER.forEach(([l, t, r, th], i) => {
      const sl = .9 + (i % 3) * .1, sr = 1.1 - (i % 3) * .08;
      // base sits on the rib body (a bit inside the edge), so there is no gap
      if (LEFT_ROWS.includes(i)) addPop('worm', i % 2 ? 'worm-2.png' : 'worm-1.png', l + th * .42, t, normalAngle(L, i, -1), sl, false);
      if (RIGHT_ROWS.includes(i)) addPop('worm', i % 2 ? 'worm-1.png' : 'worm-2.png', r - th * .42, t, normalAngle(R, i, 1), sr, i % 2 === 0);
    });

    // anemones: uneven gaps, different heights and sizes (some neighbours, some loners)
    [[-9, 95, 1.05, 1], [3, 99, .7, 0], [17, 92, .9, 1], [26, 99, .6, 0], [37, 101, .5, 1],
     [64, 101, .55, 0], [73, 93, .95, 1], [90, 99, .7, 0], [99, 92, 1.0, 1], [111, 97, .8, 0]].forEach(([x, y, s, f], i) => {
      addPop('anemone', i % 2 ? 'anemone-2.png' : 'anemone-1.png', x, y, (i % 2 ? 1 : -1) * rand(2, 8), s * 1.05, !!f);
    });
  }

  /* ---------- ambient details ---------- */
  (function sparkles() {
    const box = $('#sparkles');
    if (!box) return;
    for (let i = 0; i < 16; i++) {
      const el = document.createElement('i');
      const size = rand(8, 22);
      el.className = 'spark';
      el.style.cssText = `left:${rand(18, 82).toFixed(1)}%;top:${rand(16, 62).toFixed(1)}%;width:${size.toFixed(0)}px;height:${size.toFixed(0)}px;animation-delay:${(-Math.random() * 2.4).toFixed(2)}s`;
      box.appendChild(el);
    }
  })();

  (function bubbles() {
    $$('.bubbles').forEach((box) => {
      const n = +box.dataset.bubbles || 12;
      for (let i = 0; i < n; i++) {
        const el = document.createElement('i');
        const size = rand(6, 18);
        el.className = 'bub';
        el.style.cssText = `left:${rand(2, 98).toFixed(1)}%;width:${size.toFixed(0)}px;height:${size.toFixed(0)}px;` +
          `animation-duration:${rand(7, 15).toFixed(1)}s;animation-delay:${(-Math.random() * 14).toFixed(1)}s;--dx:${rand(-30, 30).toFixed(0)}px`;
        box.appendChild(el);
      }
    });
  })();

  (function snow() {
    const box = $('#snow');
    if (!box) return;
    for (let i = 0; i < 34; i++) {
      const el = document.createElement('i');
      const size = 2 + Math.random() * 4;
      el.style.cssText = `left:${(Math.random() * 100).toFixed(1)}%;width:${size}px;height:${size}px;opacity:${(.25 + Math.random() * .5).toFixed(2)};` +
        `animation-duration:${(16 + Math.random() * 20).toFixed(1)}s;animation-delay:${(-Math.random() * 30).toFixed(1)}s;--dx:${(Math.random() * 60 - 30).toFixed(0)}px`;
      box.appendChild(el);
    }
  })();

  /* ---------- descent: still driven by scroll, ends with a button ---------- */
  const descent = $('#descent');
  const descentScene = (p) => {
    const whale = $('#fallWhale');
    const e = ease(p);
    const x = Math.sin(p * 5) * 2.2;
    const y = lerp(-24, -12, e);
    const r = lerp(-6, 12, ease(seg(p, .05, .95)));
    whale.style.transform = `translate(${x.toFixed(2)}vw, ${y.toFixed(2)}vh) rotate(${r.toFixed(2)}deg)`;
    $$('.cap', descent).forEach((c) => {
      const [a, b] = c.dataset.show.split(',').map(Number);
      const on = p >= a && p < b;
      c.classList.toggle('on', on);
      c.classList.toggle('ready', on);
    });
  };

  /* ---------- the feast ---------- */
  const feastEl = $('#feast');
  const feastWhale = $('#feastWhale');
  const feast = { state: 'idle' };
  const setEat = (e) => feastWhale.style.setProperty('--eat', e.toFixed(2));
  const fadeIn = (el, ms = 800) => { el.style.transition = `opacity ${ms}ms ease`; el.style.opacity = 1; };

  async function feastLand() {
    if (feast.state !== 'idle' || !body.classList.contains('unlocked')) return;
    feast.state = 'landing';
    showCap(feastEl, -1);
    await tween(1900, (t) => { feastWhale.style.transform = `translateY(${lerp(-86, 0, t).toFixed(2)}vh) rotate(${lerp(14, 0, t).toFixed(2)}deg)`; });
    sandPuff();
    showCap(feastEl, 0);
    await wait(250);
    setReady(feastEl, 0);
    feast.state = 'landed';
  }

  function spawnNom() {
    const stage = $('.stage', feastEl), swarm = $('#swarm');
    const s = stage.getBoundingClientRect(), w = swarm.getBoundingClientRect();
    const el = document.createElement('span');
    el.className = 'nom';
    el.textContent = ['nom', 'nom nom', 'nom!', 'yum'][Math.floor(Math.random() * 4)];
    el.style.left = `${(w.left - s.left + rand(0, w.width)).toFixed(0)}px`;
    el.style.top = `${(w.top - s.top + rand(-6, 30)).toFixed(0)}px`;
    $('#noms').appendChild(el);
    setTimeout(() => el.remove(), 1800);
  }

  async function feastEat() {
    if (feast.state !== 'landed') return false;
    feast.state = 'eating';
    showCap(feastEl, 1);
    $('#swarm').classList.add('on');
    const crab = $('#crab');
    fadeIn(crab);
    tween(2600, (t) => { crab.style.transform = `translateX(${lerp(-30, 0, t).toFixed(2)}vw)`; });
    setTimeout(() => fadeIn($('#crab2')), 1800);
    const hag = $('#hagfish');
    setTimeout(() => { fadeIn(hag); tween(3800, (t) => { hag.style.transform = `translateX(${lerp(34, 0, t).toFixed(2)}vw)`; }); }, 900);
    const timer = setInterval(spawnNom, 700);
    await tween(4500, (t) => setEat(lerp(-14, 100, t)), (t) => t);
    clearInterval(timer);
    $('#swarm').classList.remove('on');
    fadeIn($('#starFeast')); setTimeout(() => fadeIn($('#starFeast2')), 600);
    showCap(feastEl, 2);
    await wait(250);
    setReady(feastEl, 2);
    feast.state = 'done';
  }

  /* ---------- the reef ---------- */
  const caveEl = $('#cave');
  const cave = { state: 'idle' };

  let popId = 0;
  // on narrow screens the ribcage is wider than the screen: creatures that would be cut off are left out
  const fitPops = () => {
    if (!ribs) return;
    const vw = document.documentElement.clientWidth;
    if (!ribs.getBoundingClientRect().width) return;
    pops.forEach((p) => {                               // measure each one at its full size, rotation included
      p.el.classList.remove('pop--off');
      const keep = p.el.style.scale;
      p.el.style.transition = 'none'; p.el.style.scale = p.s.toFixed(3);
      const b = p.el.firstElementChild.getBoundingClientRect();
      const seen = Math.max(0, Math.min(b.right, vw) - Math.max(b.left, 0));
      p.el.classList.toggle('pop--off', seen < b.width * .8);
      p.el.style.scale = keep; p.el.style.transition = '';
    });
  };
  addEventListener('resize', fitPops);
  const popGroup = async (kind, gap) => {
    const mine = ++popId;
    fitPops();
    for (const o of pops.filter((p) => p.kind === kind && !p.el.classList.contains('pop--off'))) {
      o.el.style.scale = o.s.toFixed(3);
      if (mine === popId) await wait(gap);      // a newer step started: finish the rest right away
    }
  };

  async function caveStart() {
    if (cave.state !== 'idle' || !body.classList.contains('cave-open')) return;
    cave.state = 'worms';
    showCap(caveEl, 0);
    setTimeout(() => { setReady(caveEl, 0); cave.state = 'worms-done'; }, 350);
    await popGroup('worm', 130);
  }
  async function caveReef() {
    if (cave.state !== 'worms-done') return false;
    cave.state = 'reef';
    showCap(caveEl, 1);
    setTimeout(() => { setReady(caveEl, 1); cave.state = 'reef-done'; }, 350);
    await popGroup('anemone', 110);
  }
  async function caveHome() {
    if (cave.state !== 'reef-done') return false;
    cave.state = 'home';
    showCap(caveEl, 2);
    const octo = $('#octo');
    setTimeout(() => setReady(caveEl, 2), 350);
    await tween(2200, (t) => { octo.style.transform = `translateX(${lerp(70, 0, t).toFixed(2)}vw)`; }, easeOutSine);
    $('#eggs').style.scale = 1;
    setTimeout(() => { $('#eggs2').style.scale = 1; }, 350);
    ribs.classList.add('happy');
    const sp = $('#sparkles'); sp.style.transition = 'opacity 1.6s ease'; sp.style.opacity = 1;
    cave.state = 'home-done';
  }

  /* ---------- scroll loop: descent + depth gauge ---------- */
  const story = $('#fin');
  const depthEl = $('#depth'), depthNum = $('#depthNum'), rays = $('#rays');
  const MAX_DEPTH = 1500;
  let lastDepth = -1;
  const journeyEl = $('#journey'), journeyDots = $$('#journey li');
  const modal = $('#choiceModal');
  let lastJourney = -2;

  function update() {
    const vh = innerHeight;
    const r = descent.getBoundingClientRect();
    const total = r.height - vh;
    if (total > 0 && r.bottom > -vh * .5 && r.top < vh * 1.5) descentScene(clamp(-r.top / total));

    const sr = story.getBoundingClientRect();
    const inStory = sr.top < 40 && sr.bottom > 40;
    body.classList.toggle('in-story', inStory);

    let depth;
    if (r.top > 0) depth = 0;
    else depth = MAX_DEPTH * ease(clamp(-r.top / total));
    const shown = Math.round(depth / 10) * 10;
    if (shown !== lastDepth) {
      depthNum.textContent = shown.toLocaleString('en-US');
      depthEl.style.setProperty('--d', (depth / MAX_DEPTH).toFixed(4));
      lastDepth = shown;
    }
    depthEl.classList.toggle('show', inStory && r.top < vh * .6 && r.bottom > vh * .45);
    const jl = journeyDots[1] && journeyDots[1].querySelector('span');
    if (jl) jl.textContent = shown > 0 ? `Act II: Descent · ${shown.toLocaleString('en-US')} m` : 'Act II: Descent';
    rays.style.opacity = inStory ? clamp(1 - depth / 650).toFixed(2) : 0;

    // story progress pill
    const secs = [[$('.s-surface'), 0], [descent, 1], [feastEl, 3], [caveEl, 4]];
    let idx = -1;
    secs.forEach(([s, i]) => { const b = s.getBoundingClientRect(); if (b.height > 0 && b.top <= vh / 2 && b.bottom > vh / 2) idx = i; });
    if (modal && !modal.hidden && idx <= 1) idx = 2;
    if (idx === 4 && (cave.state === 'home' || cave.state === 'home-done')) idx = 5;
    journeyEl.classList.toggle('show', inStory && idx >= 0);
    if (idx !== lastJourney) {
      journeyDots.forEach((d, i) => { d.classList.toggle('done', i < idx); d.classList.toggle('on', i === idx); if (i === idx) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current'); });
      lastJourney = idx;
    }
  }

  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; update(); });
  }, { passive: true });
  addEventListener('resize', update);

  /* ---------- choices ---------- */
  const panels = $$('.flow-panel');
  const show = (id, focus = true) => {
    panels.forEach((p) => { p.hidden = p.id !== id; });
    const el = document.getElementById(id);
    if (focus && el) {
      const target = $('h2', el);
      target.tabIndex = -1;
      target.focus({ preventScroll: true });
    }
  };
  $('#flow').addEventListener('click', (e) => {
    const b = e.target.closest('[data-go]');
    if (b) show(b.dataset.go);
  });

  /* ---------- the landing choice opens as a popup over the scene ---------- */
  let modalReturnFocus = null;
  function openModal() {
    if (!modal || !modal.hidden) return;
    modalReturnFocus = document.activeElement;
    show('q1', false);
    modal.hidden = false;
    document.documentElement.style.overflow = 'hidden';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      modal.classList.add('open');
      const h2 = $('#q1 h2'); h2.tabIndex = -1; h2.focus({ preventScroll: true });
    }));
    update();
  }
  function closeModal(instant = false) {
    if (!modal || modal.hidden) return;
    modal.classList.remove('open');
    document.documentElement.style.overflow = '';
    const done = () => { modal.hidden = true; update(); };
    if (instant || reducedMotion()) done(); else setTimeout(done, 360);
    if (modalReturnFocus && modalReturnFocus.focus) modalReturnFocus.focus({ preventScroll: true });
  }
  modal.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (modal.hidden) return;
    if (e.key === 'Escape') { closeModal(); return; }
    if (e.key === 'Tab') {                                    // keep focus inside the popup
      const f = $$('button:not([hidden]):not([disabled])', modal).filter((b) => b.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- buttons that move the story forward ---------- */
  function resetAll() {
    closeModal(true);
    body.classList.remove('unlocked', 'cave-open', 'finished');
    feast.state = 'idle'; cave.state = 'idle';
    feastWhale.style.transform = ''; setEat(-14);
    $('#swarm').classList.remove('on');
    ['#crab', '#crab2', '#starFeast', '#starFeast2', '#hagfish'].forEach((s) => { const el = $(s); el.style.opacity = ''; el.style.transform = ''; });
    pops.forEach((o) => { o.el.style.scale = ''; });
    ['#eggs', '#eggs2'].forEach((s) => { $(s).style.scale = ''; });
    $('#octo').style.transform = '';
    ribs.classList.remove('happy');
    $('#sparkles').style.opacity = '';
    showCap(feastEl, -1); showCap(caveEl, -1);
    $$('[data-act]').forEach((b) => { b.disabled = false; });
    show('q1', false);
  }

  const actions = {
    'to-choices': () => openModal(),
    eat: () => feastEat(),
    years: () => window.stage.cut(() => { body.classList.add('cave-open'); window.scrollTo({ top: 0, behavior: 'instant' }); update(); }),
    reef: () => caveReef(),
    home: () => caveHome(),
    finish: () => { body.classList.add('finished'); window.recap.open(); setTimeout(confetti, 900); },
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b || b.disabled) return;
    const keep = b.dataset.act === 'to-choices';
    if (!keep) b.disabled = true;                              // each step button works once
    Promise.resolve(actions[b.dataset.act]()).then((ok) => { if (ok === false) b.disabled = false; });
  });

  $('#continue').addEventListener('click', () => {
    closeModal(true);
    window.stage.cut(() => { body.classList.add('unlocked'); window.scrollTo({ top: 0, behavior: 'instant' }); update(); });
  });
  $('#replay').addEventListener('click', () => { window.recap.close(true); window.stage.cut(() => { resetAll(); descent.scrollIntoView({ behavior: 'instant', block: 'start' }); update(); }); });

  /* motion switch in the header */
  const mt = $('#motionToggle'), ml = $('#motionLabel');
  const paintMotion = () => {
    const on = !reducedMotion();
    mt.setAttribute('aria-pressed', String(on));
    ml.textContent = on ? 'Motion: on' : 'Motion: off';
  };
  mt.addEventListener('click', () => {
    const on = reducedMotion();                               // flip
    document.documentElement.setAttribute('data-motion', on ? 'on' : 'off');
    try { localStorage.setItem('motion', on ? 'on' : 'off'); } catch (e) { /* private mode */ }
    paintMotion();
  });
  paintMotion();

  /* start each stage when it is on screen */
  const watch = (el, fn) => new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) fn(); });
  }, { threshold: .6 }).observe(el);
  watch($('.stage', feastEl), feastLand);
  watch($('.stage', caveEl), caveStart);


  /* ---------- more details ---------- */
  // sprite icons inside the chips
  const CHIP_ICONS = { 'Sinking': 'fish-teal', 'Not every whale sinks': 'jellyfish', '1,500 m': 'starfish', 'Touchdown': 'starfish', 'Dinner time': 'fish-coral',
    'A few months later': 'crab', 'Years go by': 'worm-1', 'Settling in': 'anemone-1', 'Home sweet home': 'octopus', 'A quiet detour': 'crab', 'Perfect landing': 'starfish' };
  $$('.chip').forEach((chip) => {
    const ic = CHIP_ICONS[chip.textContent.trim()];
    if (!ic) return;
    const img = new Image();
    img.src = `${SPRITES}${ic}.png`; img.alt = ''; img.className = 'chip__icon';
    chip.prepend(img);
  });

  // glints on the waves
  (function glints() {
    const sec = $('.s-surface');
    if (!sec) return;
    for (let i = 0; i < 12; i++) {
      const el = document.createElement('i');
      const size = rand(8, 16);
      el.className = 'glint';
      el.style.cssText = `left:${rand(3, 97).toFixed(1)}%;top:${rand(-58, 26).toFixed(0)}px;width:${size.toFixed(0)}px;height:${size.toFixed(0)}px;animation-delay:${(-Math.random() * 3).toFixed(2)}s;animation-duration:${rand(2.4, 4.4).toFixed(1)}s`;
      sec.appendChild(el);
    }
  })();

  // floating words and pointer bubbles
  function floatText(x, y, text) {
    const el = document.createElement('span');
    el.className = 'floaty'; el.textContent = text;
    el.style.left = `${x}px`; el.style.top = `${y}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }
  function spawnTrail(x, y) {
    const el = document.createElement('i');
    const s = rand(5, 11);
    el.className = 'trail';
    el.style.cssText = `left:${x}px;top:${y}px;width:${s.toFixed(1)}px;height:${s.toFixed(1)}px;--dx:${rand(-14, 14).toFixed(0)}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1400);
  }
  let lastTrail = 0;
  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' || reducedMotion() || !body.classList.contains('in-story')) return;
    const now = performance.now();
    if (now - lastTrail < 80) return;
    lastTrail = now;
    spawnTrail(e.clientX, e.clientY);
  }, { passive: true });

  // click or tap a creature and it reacts
  const POKES = [
    ['.crab', ['snip snip!', 'click-clack', 'hi!']], ['.star', ['hehe', 'twirl!', '♥']], ['.jelly', ['bloop', 'glow~', 'boop']],
    ['.octo', ['♥', 'hello!', 'hehe']], ['.eggs', ['shh… sleeping', '♥']], ['.swim__fish', ['blub', 'swish!']],
    ['.pop--worm', ['wiggle', 'tickles!']], ['.pop--anemone', ['boop', 'wave!']],
    ['.shark', ['hi there!', 'friendly!']], ['.hagfish', ['slurp', 'wiggle']], ['.squid', ['blup', 'bloop!']],
    ['.isopod', ['crunch', 'hello']], ['.snail', ['slooow…', 'hi']], ['.urchin', ['ouch!', 'prickly']]
  ];
  document.addEventListener('click', (e) => {
    for (const [sel, words] of POKES) {
      const t = e.target.closest(sel);
      if (!t) continue;
      t.classList.remove('poked'); void t.offsetWidth; t.classList.add('poked');
      setTimeout(() => t.classList.remove('poked'), 700);
      floatText(e.clientX, e.clientY - 12, words[Math.floor(Math.random() * words.length)]);
      if (!reducedMotion()) for (let i = 0; i < 4; i++) spawnTrail(e.clientX + rand(-16, 16), e.clientY + rand(-10, 10));
      break;
    }
  });

  // dust cloud when she touches down
  function sandPuff() {
    if (reducedMotion()) return;
    const stage = $('.stage', feastEl);
    const w = feastWhale.getBoundingClientRect(), s = stage.getBoundingClientRect();
    for (let i = 0; i < 18; i++) {
      const el = document.createElement('i');
      const size = rand(18, 42);
      el.className = 'puff';
      el.style.cssText = `left:${(w.left - s.left + rand(.08, .92) * w.width).toFixed(0)}px;top:${(w.bottom - s.top - rand(6, 26)).toFixed(0)}px;` +
        `width:${size.toFixed(0)}px;height:${size.toFixed(0)}px;--dx:${rand(-90, 90).toFixed(0)}px;--dy:${rand(-44, -8).toFixed(0)}px;animation-delay:${rand(0, .25).toFixed(2)}s`;
      $('#noms').appendChild(el);
      setTimeout(() => el.remove(), 2300);
    }
  }

  // hearts and sparkles rising at the end
  function confetti() {
    if (reducedMotion()) return;
    const colors = ['#F4A6A0', '#F2CC8F', '#FFFFFF', '#A9D6D3', '#E07A5F'];
    for (let i = 0; i < 32; i++) {
      const el = document.createElement('i');
      el.className = 'conf';
      el.textContent = Math.random() < .5 ? '♥' : '✦';
      el.style.cssText = `left:${rand(3, 97).toFixed(1)}%;color:${colors[Math.floor(Math.random() * colors.length)]};font-size:${rand(14, 30).toFixed(0)}px;` +
        `animation-duration:${rand(3.6, 6.8).toFixed(1)}s;animation-delay:${rand(0, 1.5).toFixed(2)}s;--dx:${rand(-70, 70).toFixed(0)}px`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 9500);
    }
  }

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
  }, { threshold: .25 });
  $$('.reveal').forEach((el) => io.observe(el));

  update();
})();
