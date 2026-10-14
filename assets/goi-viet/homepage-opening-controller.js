// One user-started entrance, then ambient motion. Visible copy stays in the DOM.
(() => {
  const $ = id => document.getElementById(id), intro = $('introScreen'), film = $('homeClipFilm'), canvas = $('homeSceneCanvas');
  const gate = $('btnHomeOpeningStart'), skipButton = $('btnHomeOpeningSkip'), replayButton = $('btnHomeOpeningReplay');
  const content = document.querySelector('.gv-home-content'), retry = $('btnHomeClipRetry'), status = $('homeClipStatus');
  if (!intro || !film || !canvas || !gate || !content) return;
  const config = window.GoiVietHomeOpeningConfig, layoutConfig = window.GoiVietHomeLayout;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const entries = [...content.querySelectorAll('[data-home-enter]')].map(node => ({ node, timing: node.dataset.homeEnter.split(',').map(Number), last: -1 }));
  let phase = 'waiting', elapsed = 0, scene = null, pending = null, failed = false, startRequested = false;
  let frame = 0, startedAt = 0, lastDraw = -Infinity, seen = false, manualHold = false, lastPhaseLabel = '';
  const visible = () => !document.hidden && !intro.classList.contains('intro-hidden') && intro.dataset.introStage === 'welcome' && !intro.classList.contains('intro-stage-leaving');
  const motionAllowed = () => !reduced.matches && !document.body.classList.contains('reduced-motion');
  const currentTime = () => frame ? Math.max(elapsed, (performance.now() - startedAt) / 1000) : elapsed;
  const getState = () => ({ phase, time: currentTime(), seen, loading: !!pending, failed, visible: visible() && !manualHold, ready: !!scene, paused: !frame });
  const music = window.GoiVietHomeMusic?.create(getState);
  function reveal(time) {
    content.inert = phase === 'waiting' || phase === 'preparing';
    for (const entry of entries) {
      const [start, end, dy] = entry.timing;
      const p = phase === 'complete' ? 1 : phase === 'playing' ? window.GoiVietHomeOpening.progress(time, start, end) : 0;
      if (p === entry.last) continue; entry.last = p;
      entry.node.style.setProperty('--home-enter-a', p.toFixed(4));
      entry.node.style.setProperty('--home-enter-y', `${(dy * (1 - p)).toFixed(2)}px`);
      entry.node.style.visibility = p > 0 ? 'visible' : 'hidden';
      entry.node.inert = p < 1; entry.node.setAttribute('aria-hidden', String(p < 1));
      if (entry.node.tagName === 'BUTTON') entry.node.disabled = p < 1;
    }
  }
  function setPhase(next) {
    phase = next; intro.dataset.homeOpening = next;
    gate.hidden = next === 'playing' || next === 'complete'; gate.disabled = next === 'preparing';
    skipButton.hidden = next === 'complete'; replayButton.hidden = next !== 'complete';
    $('homeOpeningHint').textContent = next === 'preparing' ? 'Đang chuẩn bị phong cảnh…' : 'Chạm vào màn hình để mở hành trình';
    if (next === 'complete') seen = true;
    reveal(elapsed);
  }
  function stop() {
    if (frame) { elapsed = Math.max(elapsed, (performance.now() - startedAt) / 1000); cancelAnimationFrame(frame); }
    frame = 0;
  }
  function layout() {
    if (!layoutConfig) return;
    const { width, height } = film.getBoundingClientRect(); if (!width || !height) return;
    const scale = Math.max(width / layoutConfig.width, height / layoutConfig.height);
    film.style.setProperty('--home-scene-width', `${layoutConfig.width * scale}px`);
    film.style.setProperty('--home-scene-height', `${layoutConfig.height * scale}px`); film.dataset.sceneFit = 'cover';
    const raster = Math.min(1, scale * (devicePixelRatio || 1));
    const w = Math.round(layoutConfig.width * raster), h = Math.round(layoutConfig.height * raster);
    if (scene) { scene.setResolution(w, h); scene.renderFrame(elapsed); }
    else if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  }
  function draw() {
    if (phase === 'playing' && elapsed >= config.duration) setPhase('complete');
    if (scene) scene.renderFrame(phase === 'waiting' || phase === 'preparing' ? 0 : elapsed);
    if (phase === 'playing') reveal(elapsed);
    const label = phase === 'waiting' ? 'Chạm để mở hành trình Gói Việt.' : phase === 'preparing' ? 'Đang chuẩn bị phong cảnh.' : scene?.phase(elapsed) || 'Trang chủ đã sẵn sàng.';
    if (label !== lastPhaseLabel) { $('homeOpeningStatus').textContent = label; lastPhaseLabel = label; }
    music?.sync();
  }
  function tick(now) {
    frame = 0; if (!visible() || !motionAllowed() || manualHold || !scene || failed || !['playing', 'complete'].includes(phase)) return;
    elapsed = (now - startedAt) / 1000;
    if (now - lastDraw >= 1000 / scene.metadata.fps - 1) {
      try { draw(); } catch (_) { fail(); return; } lastDraw = now;
    }
    frame = requestAnimationFrame(tick);
  }
  function fail() {
    stop(); failed = true; film.dataset.clipReady = 'false'; film.dataset.clipStatus = 'error';
    status.textContent = 'Chuyển động chưa tải được. Nội dung, ảnh nền và các nút vẫn dùng được.';
    if (startRequested || phase !== 'waiting') { elapsed = config.duration; startRequested = false; setPhase('complete'); music?.pause(); }
    retry.hidden = !visible() || phase !== 'complete';
  }
  function ensureScene() {
    if (pending) return pending; if (scene && !failed) return Promise.resolve(scene);
    film.dataset.clipStatus = 'loading'; failed = false; retry.hidden = true; status.textContent = '';
    pending = Promise.resolve().then(() => window.GoiVietHomeOpening.create(canvas)).then(value => {
      scene = value; film.homeScene = value; layout(); film.dataset.clipReady = 'true'; film.dataset.clipStatus = 'ready';
      film.dispatchEvent(new Event('home-scene-ready')); draw(); return value;
    }).catch(() => { fail(); return null; }).finally(() => {
      pending = null;
      if (startRequested && !failed && phase === 'preparing') begin(); else sync();
    });
    return pending;
  }
  function sync() {
    if (!visible()) {
      stop(); music?.pause();
      // A navigation action ends the entrance; hiding only the tab pauses it.
      if (intro.classList.contains('intro-hidden') || intro.dataset.introStage !== 'welcome' || intro.classList.contains('intro-stage-leaving')) {
        if (phase !== 'waiting' || intro.classList.contains('intro-hidden')) { elapsed = Math.max(config.duration, elapsed); startRequested = false; setPhase('complete'); }
      }
      return;
    }
    retry.hidden = !(failed && phase === 'complete');
    if (phase === 'playing' && !motionAllowed()) { stop(); elapsed = config.duration; setPhase('complete'); draw(); }
    if (!motionAllowed() || manualHold || failed) { stop(); music?.sync(); return; }
    if (!scene) { if (!pending) ensureScene(); return; }
    if (phase === 'waiting' || phase === 'preparing') { stop(); return; }
    if (frame) return;
    startedAt = performance.now() - elapsed * 1000; lastDraw = -Infinity;
    frame = requestAnimationFrame(tick); music?.sync(true);
  }
  function begin() {
    startRequested = false; stop(); elapsed = 0; manualHold = false; setPhase('playing');
    draw(); music?.begin(); skipButton.focus({ preventScroll: true }); sync();
  }
  function start() {
    if (phase === 'playing' || phase === 'preparing') return;
    $('homeMusicSettings').open = false; intro.scrollTo({ top: 0 }); manualHold = false;
    if (!motionAllowed()) { skip(); return; }
    if (failed) { skip(); return; }
    if (scene) begin();
    else { startRequested = true; setPhase('preparing'); ensureScene(); }
  }
  function skip() {
    stop(); startRequested = false; manualHold = false; elapsed = Math.max(config.duration, elapsed); setPhase('complete');
    music?.pause(); draw(); $('btnQuickStartWelcome').focus({ preventScroll: true }); sync();
  }
  function replay() { stop(); elapsed = 0; setPhase('waiting'); start(); }
  function seek(time, hold = true) {
    stop(); startRequested = false; manualHold = hold; elapsed = Math.max(0, Number(time) || 0);
    setPhase(elapsed >= config.duration ? 'complete' : 'playing'); draw(); music?.sync(true); sync();
  }
  gate.addEventListener('click', start); skipButton.addEventListener('click', skip); replayButton.addEventListener('click', replay);
  retry.addEventListener('click', () => { failed = false; ensureScene(); });
  const observer = new MutationObserver(sync);
  observer.observe(intro, { attributes: true, attributeFilter: ['class', 'data-intro-stage'] });
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  reduced.addEventListener('change', sync); document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', () => { stop(); music?.pause(); }); window.addEventListener('pageshow', sync);
  window.addEventListener('resize', layout); new ResizeObserver(layout).observe(film);
  // The existing modal trap cannot include unrevealed controls. Preserve native DOM order.
  window.addEventListener('keydown', event => {
    if (event.key !== 'Tab' || !visible()) return;
    const targets = [...intro.querySelectorAll('button:not([disabled]), summary, input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')].filter(node => {
      const style = getComputedStyle(node); return node.offsetParent !== null && !node.closest('[inert]') && style.visibility !== 'hidden' && style.display !== 'none';
    });
    if (!targets.length) return;
    event.preventDefault(); event.stopImmediatePropagation();
    const index = targets.indexOf(document.activeElement), next = event.shiftKey ? (index <= 0 ? targets.length - 1 : index - 1) : (index + 1) % targets.length;
    targets[next].focus({ preventScroll: false });
  }, true);
  setPhase('waiting'); layout(); gate.focus({ preventScroll: true });
  const ready = Promise.all([music?.ready, motionAllowed() ? ensureScene() : Promise.resolve(null)]);
  window.GoiVietHomeIntro = { ready, start, skip, replay, seek, getState: () => ({ ...getState(), music: music?.getState() }) };
  sync();
})();
