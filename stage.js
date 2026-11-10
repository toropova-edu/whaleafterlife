/* Whale Afterlife: the curtain. It opens when the show starts and closes over every change of scene. */
(() => {
  const f = document.getElementById('stageFrame');
  const reduced = () => document.documentElement.getAttribute('data-motion') === 'off';
  const wait = (ms) => new Promise((r) => setTimeout(r, reduced() ? 0 : ms));
  if (!f) { window.stage = { cut: async (fn) => fn() }; return; }

  if (!f.hasAttribute('data-quiet')) {                       // the show starts behind a closed curtain (not on the long scroll page)
    f.classList.add('shut');
    setTimeout(() => f.classList.remove('shut'), reduced() ? 0 : 450);
  }

  window.stage = {
    async cut(fn) {                                          // close, change the scenery, open again
      f.classList.add('shut');
      await wait(850);
      await fn();
      await wait(250);
      f.classList.remove('shut');
    },
  };
})();
