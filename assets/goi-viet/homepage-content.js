// Manage only the scenery. Content and actions work independently of asset loading.
(() => {
  const intro = document.getElementById('introScreen');
  const film = document.getElementById('homeClipFilm');
  const canvas = document.getElementById('homeSceneCanvas');
  const retry = document.getElementById('btnHomeClipRetry');
  const status = document.getElementById('homeClipStatus');
  if (!intro || !film || !canvas || !retry || !status) return;
  const config = window.GoiVietHomeLayout;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let scene = null, pending = false, failed = false;
  let frame = 0, elapsed = 0, startedAt = 0, lastRenderedAt = -Infinity;
  const visible = () => !document.hidden && !intro.classList.contains('intro-hidden') &&
    !intro.classList.contains('intro-stage-leaving') && intro.dataset.introStage === 'welcome';
  const motionAllowed = () => !reduced.matches && !document.body.classList.contains('reduced-motion');

  const layout = () => {
    if (!config) return;
    const { width, height } = film.getBoundingClientRect();
    if (!width || !height) return;
    const scale = Math.max(width / config.width, height / config.height);
    film.style.setProperty('--home-scene-width', `${config.width * scale}px`);
    film.style.setProperty('--home-scene-height', `${config.height * scale}px`);
    film.dataset.sceneFit = 'cover';
    const raster = Math.min(1, scale * (window.devicePixelRatio || 1));
    const w = Math.round(config.width * raster), h = Math.round(config.height * raster);
    if (scene) scene.setResolution(w, h);
    else if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  };
  const stop = () => {
    if (frame) { elapsed = (performance.now() - startedAt) / 1000; cancelAnimationFrame(frame); }
    frame = 0;
  };
  const fail = () => {
    stop(); failed = true;
    film.dataset.clipReady = 'false'; film.dataset.clipStatus = 'error';
    status.textContent = 'Chuyển động chưa tải được. Nội dung, ảnh nền và các nút vẫn dùng được.';
    retry.hidden = !visible();
  };
  const tick = now => {
    frame = 0;
    if (!scene || !visible() || !motionAllowed() || failed) return;
    elapsed = (now - startedAt) / 1000;
    if (now - lastRenderedAt >= 1000 / scene.metadata.fps - 1) {
      try { scene.renderFrame(elapsed); } catch (_) { fail(); return; }
      lastRenderedAt = now;
    }
    frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    retry.hidden = !(failed && visible());
    if (!visible() || !motionAllowed() || failed) { stop(); return; }
    if (!scene) { if (!pending) load(); return; }
    if (frame) return;
    startedAt = performance.now() - elapsed * 1000;
    lastRenderedAt = -Infinity;
    frame = requestAnimationFrame(tick);
  };
  const load = async () => {
    if (pending || !visible() || !motionAllowed()) return;
    stop(); pending = true; failed = false; retry.hidden = true; status.textContent = '';
    film.dataset.clipStatus = 'loading';
    try {
      scene = await window.GoiVietHomeScene.create(canvas);
      film.homeScene = scene; layout(); elapsed = 0;
      film.dataset.clipReady = 'true'; film.dataset.clipStatus = 'ready';
      film.dispatchEvent(new Event('home-scene-ready'));
    } catch (_) { fail(); }
    finally { pending = false; sync(); }
  };
  retry.addEventListener('click', load);
  const observer = new MutationObserver(sync);
  observer.observe(intro, { attributes: true, attributeFilter: ['class', 'data-intro-stage'] });
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', sync);
  window.addEventListener('resize', layout);
  new ResizeObserver(layout).observe(film);
  layout(); requestAnimationFrame(sync);
})();
