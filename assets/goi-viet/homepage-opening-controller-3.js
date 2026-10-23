// Preview 3 copy: reveal() and the phase controls write the DOM only when a value changes.
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
  let gateFadeTimer = 0;
  let frame = 0, startedAt = 0, lastDraw = -Infinity, nextDrawAt = -Infinity, seen = false, manualHold = false, lastPhaseLabel = '', artworkVisible = true;
  const visible = () => !document.hidden && !intro.classList.contains('intro-hidden') && intro.dataset.introStage === 'welcome' && !intro.classList.contains('intro-stage-leaving');
  const motionAllowed = () => !reduced.matches && !document.body.classList.contains('reduced-motion');
  const currentTime = () => frame ? Math.max(elapsed, (performance.now() - startedAt) / 1000) : elapsed;
  const getState = () => ({ phase, time: currentTime(), seen, loading: !!pending, failed, visible: visible() && !manualHold, ready: !!scene, paused: !frame });
  const music = window.GoiVietHomeMusic?.create(getState);
  let keyboardNavigation = true;
  window.addEventListener('pointerdown', () => { keyboardNavigation = false; }, true);
  window.addEventListener('keydown', event => {
    if (['Tab', 'Enter', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) keyboardNavigation = true;
  }, true);
  function focusAfterAction(button) {
    if (keyboardNavigation) button.focus({ preventScroll: true });
  }
  // Write only real changes: reveal() runs on every frame of the fade, and replacing even identical text restyles the whole page.
  const assign = (node, key, value) => { if (node[key] !== value) node[key] = value; };
  function reveal(time) {
    content.inert = ['waiting', 'preparing', 'fading'].includes(phase);
    for (const entry of entries) {
      const [start, end, dy] = entry.timing;
      const p = phase === 'complete' ? 1 : phase === 'playing' ? window.GoiVietHomeOpening.progress(time, start, end) : 0;
      if (p === entry.last) continue; entry.last = p;
      entry.node.style.setProperty('--home-enter-a', p.toFixed(4));
      entry.node.style.setProperty('--home-enter-y', `${(dy * (1 - p)).toFixed(2)}px`);
      // These change only when p reaches 0 or 1, not on every frame of the fade.
      const locked = p < 1;
      assign(entry.node.style, 'visibility', p > 0 ? 'visible' : 'hidden'); assign(entry.node, 'inert', locked);
      if (entry.node.getAttribute('aria-hidden') !== String(locked)) entry.node.setAttribute('aria-hidden', String(locked));
      if (entry.node.tagName === 'BUTTON') assign(entry.node, 'disabled', locked);
    }
  }
  function setPhase(next) {
    if (next !== 'fading') { clearTimeout(gateFadeTimer); gateFadeTimer = 0; }
    phase = next; assign(intro.dataset, 'homeOpening', next);
    assign(gate, 'hidden', next === 'playing' || next === 'complete'); assign(gate, 'disabled', next === 'preparing' || next === 'fading');
    assign($('homeOpeningGate'), 'hidden', next === 'playing' || next === 'complete');
    if (gate.getAttribute('aria-busy') !== String(next === 'preparing')) gate.setAttribute('aria-busy', String(next === 'preparing'));
    assign(skipButton, 'hidden', next === 'complete'); assign(replayButton, 'hidden', next !== 'complete');
    assign($('homeOpeningHint'), 'textContent', next === 'preparing' ? 'Đang chuẩn bị phong cảnh…' : 'Một chạm, mở chuyện quê mình.');
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
    const size = window.GoiVietPixelBudget?.introSize(layoutConfig.width * raster, layoutConfig.height * raster);
    const w = size?.width ?? Math.round(layoutConfig.width * raster), h = size?.height ?? Math.round(layoutConfig.height * raster);
    if (scene) {
      if (window.GoiVietPixelBudget && !visible()) return;
      scene.setResolution(w, h); scene.renderFrame(elapsed);
    }
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
    if (!artworkVisible) return;
    elapsed = (now - startedAt) / 1000;
    const interval = 1000 / scene.metadata.fps;
    if (window.GoiVietPixelBudget ? now + .25 >= nextDrawAt : now - lastDraw >= interval - 1) {
      try { draw(); } catch (_) { fail(); return; } lastDraw = now;
      // Retain the cadence remainder on 90/120/144 Hz displays. Missed deadlines
      // are skipped, never replayed as a burst of catch-up canvas paints.
      nextDrawAt = Number.isFinite(nextDrawAt) ? nextDrawAt + Math.max(1, Math.floor((now-nextDrawAt)/interval)+1)*interval : now+interval;
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
      scene?.native?.layerRenderer?.suspend?.();
      // A navigation action ends the entrance; hiding only the tab pauses it.
      if (intro.classList.contains('intro-hidden') || intro.dataset.introStage !== 'welcome' || intro.classList.contains('intro-stage-leaving')) {
        if (phase !== 'waiting' || intro.classList.contains('intro-hidden')) { elapsed = Math.max(config.duration, elapsed); startRequested = false; setPhase('complete'); }
      }
      return;
    }
    if (!artworkVisible) { stop(); scene?.native?.layerRenderer?.suspend?.(); music?.sync(); return; }
    if (scene?.native?.layerRenderer?.resume?.()) layout();
    assign(retry, 'hidden', !(failed && phase === 'complete'));
    if (['playing', 'fading'].includes(phase) && !motionAllowed()) { stop(); elapsed = config.duration; setPhase('complete'); draw(); }
    if (!motionAllowed() || manualHold || failed) { stop(); music?.sync(); return; }
    if (!scene) { if (!pending) ensureScene(); return; }
    if (['waiting', 'preparing', 'fading'].includes(phase)) { stop(); return; }
    if (frame) return;
    startedAt = performance.now() - elapsed * 1000; lastDraw = nextDrawAt = -Infinity;
    frame = requestAnimationFrame(tick); music?.sync(true);
  }
  function begin() {
    startRequested = false; stop(); elapsed = 0; manualHold = false;
    setPhase('fading');
    // Start music within the user gesture; hold the landscape clock until the paper is clear.
    music?.begin(); focusAfterAction(skipButton);
    gateFadeTimer = setTimeout(() => { if (phase === 'fading') playScene(); }, 350);
  }
  function playScene() {
    startRequested = false; stop(); elapsed = 0; manualHold = false; setPhase('playing');
    draw(); music?.begin(); focusAfterAction(skipButton); sync();
  }
  function start() {
    if (['playing', 'preparing', 'fading'].includes(phase)) return;
    $('homeMusicSettings').open = false; intro.scrollTo({ top: 0 }); manualHold = false;
    if (!motionAllowed()) { skip(); return; }
    if (failed) { skip(); return; }
    if (scene) begin();
    else { startRequested = true; setPhase('preparing'); ensureScene(); }
  }
  function skip() {
    stop(); startRequested = false; manualHold = false; elapsed = Math.max(config.duration, elapsed); setPhase('complete');
    music?.pause(); draw(); focusAfterAction($('btnQuickStartWelcome')); sync();
  }
  function replay() { window.GoiVietMemoryChapter?.reset?.(); stop(); elapsed = 0; if (scene && motionAllowed() && !failed) playScene(); else { setPhase('waiting'); start(); } }
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
    const focusScope = intro.querySelector('dialog[open]') || intro;
    const targets = [...focusScope.querySelectorAll('button:not([disabled]), summary, input:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])')].filter(node => {
      const closedDetails = node.closest('details:not([open])');
      if (closedDetails && node !== closedDetails.querySelector('summary')) return false;
      const style = getComputedStyle(node); return node.offsetParent !== null && !node.closest('[inert]') && style.visibility !== 'hidden' && style.display !== 'none';
    });
    if (!targets.length) return;
    event.preventDefault(); event.stopImmediatePropagation();
    const index = targets.indexOf(document.activeElement);
    let next = event.shiftKey ? (index <= 0 ? targets.length - 1 : index - 1) : (index + 1) % targets.length;
    if (index < 0 && document.body.dataset.previewVersion === '3' && document.activeElement.closest('#memoryChapter')) {
      // A section focus anchor is outside the tab sequence: continue in DOM order.
      const following = targets.findIndex(node => document.activeElement.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING);
      next = event.shiftKey ? (following < 0 ? targets.length - 1 : (following - 1 + targets.length) % targets.length) : (following < 0 ? 0 : following);
    }
    targets[next].focus({ preventScroll: false });
  }, true);
  setPhase('waiting'); layout();
  const ready = Promise.all([music?.ready, motionAllowed() ? ensureScene() : Promise.resolve(null)]);
  window.GoiVietHomeIntro = { ready, start, skip, replay, seek,
    setArtworkVisible(value) {
      // Preview 3's long chapter can suspend painting without pausing opted-in music.
      if (document.body.dataset.previewVersion !== '3') return;
      artworkVisible = !!value; sync();
    },
    getState: () => ({ ...getState(), artworkVisible, music: music?.getState() }) };
  sync();
})();
