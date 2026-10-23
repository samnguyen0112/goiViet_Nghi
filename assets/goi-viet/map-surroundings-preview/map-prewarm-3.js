/* Preview 3: prepare the map while the home screen is shown; the entry curtain then waits until the map is
   complete, so the first visible map frame is the finished one.
   The home screen prepares only what does not depend on the exact map area: data (decoded in workers by
   core-3.js), WebGL province textures and island tiles, and every sea/relief tile of the backdrop. The map
   controls are laid out only after entry; the overview zoom then is 0.81-1.0x the home-screen value (nine
   desktop sizes measured), and detail bands are at least √2 apart, so preparing both ends covers the entry
   band. The backdrop itself is drawn under the curtain, once the real area is known. */
(() => {
  'use strict';
  const intro = document.getElementById('introScreen');
  if (!intro || document.body.dataset.previewVersion !== '3') return;
  const LOW = 0.78, MARGIN = 120, WAITING_MS = 500, SAFETY_MS = 30000;
  let started = false, entered = false, holding = false, timer = 0, startedAt = 0, preparedAt = null, lastWait = null;
  const onHome = () => !intro.classList.contains('intro-hidden');
  // Gate read by the map modules: work for the map while the finished home screen is shown, before entry.
  const preparing = () => started && !entered && onHome() && intro.dataset.homeOpening === 'complete';
  const idle = fn => window.requestIdleCallback ? requestIdleCallback(fn, {timeout: 500}) : setTimeout(fn, 0);
  const camera = zoom => ({yaw: 0, pitch: 0.24, roll: 0, zoom, panX: 0, panY: 0, targetYaw: 0, targetPitch: 0.24, targetRoll: 0, targetZoom: zoom, targetPanX: 0, targetPanY: 0});
  function decodeImage(url) { const image = new Image(); image.decoding = 'async'; image.src = url; return image.decode().catch(() => {}); }
  function start() {
    if (started) return;
    started = true; startedAt = performance.now();
    // One loader per idle period; the large files are decoded in workers.
    const loads = [
      () => window.GoiVietNaturalTerrainRenderer?.ensure(), () => window.GoiVietHydrology?.ensure(),
      () => window.GoiVietNaturalLandscape?.ensure(), () => window.GoiVietNaturalRegionalRelief?.ensure(),
      () => decodeImage('assets/goi-viet/map-art/hanoi-lake-illustration.png'),
      () => decodeImage('assets/goi-viet/map-surroundings-preview/frame/reference-original.png')
    ];
    const next = () => { if (loads.length) idle(() => { Promise.resolve(loads.shift()()).catch(() => {}); next(); }); };
    next();
    schedule(0);
  }
  function schedule(ms) { if (!timer) timer = setTimeout(() => { timer = 0; idle(tick); }, ms); }
  function tick() {
    if (!preparing()) return; // resumed by the observers below
    if (document.hidden) { schedule(1000); return; }
    const dark = state.theme === 'dark', zoom = getBestOverviewZoom(cw, ch), high = camera(zoom), low = camera(+(zoom * LOW).toFixed(4));
    const terrain = window.GoiVietWebGLTerrain3, landscape = window.GoiVietNaturalLandscape;
    const textures = terrain ? Math.max(0, terrain.prepare(DATA.provinces34, high, dark)) + Math.max(0, terrain.prepare(DATA.provinces34, low, dark)) : 0;
    const islands = landscape ? landscape.prepareIslands(high, cw, ch, dark) & landscape.prepareIslands(low, cw, ch, dark) : true;
    const tiles = window.GoiVietRegionalPreview?.prepareTiles(low, cw, ch, dark, MARGIN);
    const done = !textures && islands && tiles === 'tiles' && !terrain?.inspect().pending && !window.GoiVietRasterTasks?.inspect().pending;
    if (done && preparedAt == null) preparedAt = Math.round(performance.now() - startedAt);
    // Once complete, a slow check notices a theme or window size change.
    schedule(done ? 1000 : 200);
  }
  function complete(frames0) {
    const terrain = window.GoiVietWebGLTerrain3, raster = window.GoiVietRasterTasks?.inspect(), backdrop = window.GoiVietRegionalPreview?.inspect();
    const t = terrain?.usable() ? terrain.inspect() : null;
    const ground = !t || t.active && !t.pending && t.frames > frames0;
    // A finished tile reaches the backdrop through a delayed update; the backdrop is complete only after it.
    const tiles = !raster || !raster.pending && !raster.auxiliaryTasks && !raster.updating;
    const sea = !backdrop || backdrop.geometryError || backdrop.backdropError || backdrop.backdropCommits > 0 && !backdrop.backdropPending && !backdrop.backdropDirty && !backdrop.coverageFallback && !backdrop.refinePending;
    return ground && tiles && Boolean(sea);
  }
  // Waits for a few evenly spaced frames: the GPU may still be rasterizing the backdrop after it is committed.
  function quiet(deadline, done) {
    let last = 0, count = 0;
    const step = time => { if (last) count = time - last < 25 ? count + 1 : 0; last = time; if (count >= 5 || performance.now() > deadline) done(); else requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  // Called by the entry curtain right after closeIntroModal(): the map is active with its real area. The
  // curtain is revealed only when the map is complete; waiting() runs once if that takes a while.
  function hold(reveal, waiting) {
    start();
    entered = true; holding = true;
    const terrain = window.GoiVietWebGLTerrain3, frames0 = terrain?.usable() ? terrain.inspect().frames : 0;
    terrain?.resetLod(); requestMapRender(2);
    const t0 = performance.now(); let shown = false, ok = 0;
    const check = () => {
      const elapsed = performance.now() - t0;
      if (!shown && elapsed > WAITING_MS) { shown = true; waiting(); }
      ok = complete(frames0) ? ok + 1 : 0;
      if (ok < 2 && elapsed < SAFETY_MS) { setTimeout(check, 50); return; }
      // Past the safety limit, let the Canvas fallback draw rather than keep a curtain up indefinitely.
      if (ok < 2) { console.warn('[Bản đồ] Hết thời gian chờ chuẩn bị bản đồ; mở bản đồ hiện có.'); holding = false; }
      requestMapRender(2);
      quiet(performance.now() + 3000, () => { holding = false; lastWait = Math.round(performance.now() - t0); reveal(); });
    };
    setTimeout(check, 50);
  }
  const resume = () => { if (!started && intro.dataset.homeOpening === 'complete' && onHome()) start(); else if (preparing()) schedule(0); };
  new MutationObserver(resume).observe(intro, {attributes: true, attributeFilter: ['data-home-opening', 'class']});
  document.addEventListener('visibilitychange', resume);
  resume();
  window.GoiVietMapPrewarm3 = Object.freeze({preparing, holding: () => holding, hold,
    inspect: () => ({started, entered, holding, preparing: preparing(), preparedMs: preparedAt, lastCurtainWaitMs: lastWait})});
})();
