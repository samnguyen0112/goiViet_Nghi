// The welcome artwork is a native scene, with no click-to-pause or media player.
(() => {
  const intro = document.getElementById('introScreen');
  const film = document.getElementById('homeClipFilm');
  const canvas = document.getElementById('homeSceneCanvas');
  const retry = document.getElementById('btnHomeClipRetry');
  const status = document.getElementById('homeClipStatus');
  if (!intro || !film || !canvas || !retry || !status) return;
  const layoutConfig = window.GoiVietHomeLayout;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let scene = null;
  let pending = false;
  let failed = false;
  let frame = 0;
  let elapsed = 0;
  let startedAt = 0;
  let lastRenderedAt = -Infinity;
  const visible = () => !document.hidden && !intro.classList.contains('intro-hidden') &&
    !intro.classList.contains('intro-stage-leaving') && intro.dataset.introStage === 'welcome';

  // Fill ordinary desktop screens. On extreme ratios, keep all lettering and
  // actions inside the screen, extending scenery behind the intact artwork.
  const layout = () => {
    const { width, height } = film.getBoundingClientRect();
    if (!width || !height) return;
    const sw=layoutConfig.width,sh=layoutConfig.height,cover=Math.max(width/sw,height/sh);
    const left=(width-sw*cover)/2,top=(height-sh*cover)/2;
    const safe=layoutConfig.protectedRects.every(([x,y,w,h])=>left+x*cover>=8&&left+(x+w)*cover<=width-8&&top+y*cover>=8&&top+(y+h)*cover<=height-8);
    const scale=safe?cover:Math.min(width/sw,height/sh);
    film.style.setProperty('--home-scene-width',`${sw*scale}px`);film.style.setProperty('--home-scene-height',`${sh*scale}px`);
    film.dataset.sceneFit=safe?'cover':'contain';
    const rasterScale=Math.min(1,scale*(window.devicePixelRatio||1)),rw=Math.round(sw*rasterScale),rh=Math.round(sh*rasterScale);
    if(scene)scene.setResolution(rw,rh);else if(canvas.width!==rw||canvas.height!==rh){canvas.width=rw;canvas.height=rh;}

  };
  const stop = () => {
    if (frame) {
      elapsed = (performance.now() - startedAt) / 1000;
      cancelAnimationFrame(frame);
    }
    frame = 0;
  };
  const fail = () => {
    stop();
    failed = true;
    film.dataset.clipReady = 'false';
    film.dataset.clipStatus = 'error';
    status.textContent = 'Chuyển động chưa tải được. Ảnh trang chủ và các nút vẫn dùng được; có thể thử tải lại.';
    retry.hidden = !visible();
  };
  const tick = now => {
    frame = 0;
    if (!scene || !visible() || reduced.matches || failed) return;
    elapsed = (now - startedAt) / 1000;
    if (now - lastRenderedAt >= 1000 / scene.metadata.fps - 1) {
      try { scene.renderFrame(elapsed); }
      catch (_) { fail(); return; }
      lastRenderedAt = now;
    }
    frame = requestAnimationFrame(tick);
  };
  const sync = () => {
    retry.hidden = !(failed && visible());
    if (!visible() || reduced.matches || failed || !scene) { stop(); return; }
    if (frame) return;
    startedAt = performance.now() - elapsed * 1000;
    lastRenderedAt = -Infinity;
    frame = requestAnimationFrame(tick);
  };
  const load = async () => {
    if (pending) return;
    stop();
    pending = true;
    failed = false;
    retry.hidden = true;
    status.textContent = '';
    film.dataset.clipStatus = 'loading';
    try {
      scene = await window.GoiVietHomeScene.create(canvas);
      film.homeScene = scene;
      elapsed = 0;
      film.dataset.clipReady = 'true';
      film.dataset.clipStatus = 'ready';
      film.dispatchEvent(new Event('home-scene-ready'));
    } catch (_) { fail(); }
    finally { pending = false; sync(); }
  };
  retry.addEventListener('click', load);
  const observer = new MutationObserver(sync);
  observer.observe(intro, { attributes: true, attributeFilter: ['class', 'data-intro-stage'] });
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', sync);
  window.addEventListener('resize', layout);
  new ResizeObserver(layout).observe(film);
  layout();
  load();
})();

// Lift copies of the logo and printed actions. Hit areas stay steady.
(() => {
  const intro = document.getElementById('introScreen');
  const film = document.getElementById('homeClipFilm');
  const scene = document.getElementById('homeSceneCanvas');
  const poster = document.querySelector('.gv-home-poster');
  if (!intro || !film || !scene || !poster) return;
  const mouse = matchMedia('(hover: hover) and (pointer: fine)');
  const layoutConfig = window.GoiVietHomeLayout;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const actions = [];
  const homeVisible = () => !document.hidden && !intro.classList.contains('intro-hidden') &&
    !intro.classList.contains('intro-stage-leaving') && intro.dataset.introStage === 'welcome';
  const motionAllowed = () => !reduced.matches && !document.body.classList.contains('reduced-motion');

  for (const [id, crop] of Object.entries(layoutConfig.hotspots)) {
    const button = document.getElementById(id);
    if (!button) continue;
    button.style.setProperty('--home-hotspot-x',`${(crop[0]+crop[2]/2)/layoutConfig.width*100}%`);
    button.style.setProperty('--home-hotspot-y',`${(crop[1]+crop[3]/2)/layoutConfig.height*100}%`);
    button.style.setProperty('--home-hotspot-width',`${crop[2]/layoutConfig.width*100}%`);
    button.style.setProperty('--home-hotspot-height',`${crop[3]/layoutConfig.height*100}%`);
    const art = document.createElement('span');
    art.className = 'gv-home-action-art';
    art.setAttribute('aria-hidden', 'true');
    const canvas = document.createElement('canvas');
    canvas.width = crop[2];
    canvas.height = crop[3];
    art.append(canvas);
    button.append(art);
    const ctx = canvas.getContext('2d');
    const isLogo = id === 'homeLogoEffect';
    let logoFallback = null;
    let maskedLogo = null;
    let frame = 0;
    let point = null;
    const draw = () => {
      const still = poster.complete && poster.naturalWidth ? poster : null;
      if (isLogo) {
        const logo = film.homeScene?.logo || (logoFallback ||= still && window.GoiVietHomeScene.createLogoLayer(still));
        if (!logo || !ctx) { button.dataset.homeArtReady = 'false'; return; }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(logo.canvas, 0, 0);
        // Apply the sheen to the same transparent silhouette, never a rectangle.
        if (maskedLogo !== logo) {
          art.style.setProperty('--home-logo-mask', `url("${logo.canvas.toDataURL()}")`);
          maskedLogo = logo;
        }
        button.dataset.homeArtReady = 'true';
        return;
      }
      const source = film.dataset.clipReady === 'true' ? film.homeScene.actionSource : still;
      if (!source || !ctx) return;
      try {
        ctx.drawImage(source, ...crop, 0, 0, canvas.width, canvas.height);
        button.dataset.homeArtReady = 'true';
      } catch (_) { button.dataset.homeArtReady = 'false'; }
    };
    const resetTilt = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      point = null;
      button.style.removeProperty('--home-tilt-x');
      button.style.removeProperty('--home-tilt-y');
    };
    const reset = () => {
      resetTilt();
      button.classList.remove('is-home-hovered');
      if (isLogo) film.homeScene?.setLogoRaised(false);
    };
    button.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'mouse' || !mouse.matches || !homeVisible()) return;
      draw();
      button.classList.add('is-home-hovered');
      if (isLogo && button.dataset.homeArtReady === 'true') film.homeScene?.setLogoRaised(true);
    });
    button.addEventListener('pointermove', event => {
      if (!button.classList.contains('is-home-hovered') || !motionAllowed() || !homeVisible()) return;
      point = { x: event.clientX, y: event.clientY };
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!point || !homeVisible()) return;
        const rect = button.getBoundingClientRect();
        const x = Math.max(-1, Math.min(1, (point.x - rect.left) / rect.width * 2 - 1));
        const y = Math.max(-1, Math.min(1, (point.y - rect.top) / rect.height * 2 - 1));
        button.style.setProperty('--home-tilt-x', `${(4 - y * 2).toFixed(2)}deg`);
        button.style.setProperty('--home-tilt-y', `${(x * 2.5).toFixed(2)}deg`);
      });
    });
    button.addEventListener('pointerleave', reset);
    button.addEventListener('pointercancel', reset);
    button.addEventListener('pointerdown', draw);
    button.addEventListener('focus', draw);
    button.addEventListener('blur', resetTilt);
    actions.push({ button, draw, reset, resetTilt });
  }
  const sync = () => {
    for (const action of actions) {
      if (!homeVisible() || !mouse.matches) action.reset();
      else if (!motionAllowed()) action.resetTilt();
    }
  };
  const refresh = () => {
    for (const action of actions) {
      if (action.button.classList.contains('is-home-hovered') || action.button === document.activeElement) action.draw();
    }
    const logo = document.getElementById('homeLogoEffect');
    if (logo?.classList.contains('is-home-hovered') && logo.dataset.homeArtReady === 'true') film.homeScene?.setLogoRaised(true);
  };
  film.addEventListener('home-scene-ready', refresh);
  poster.addEventListener('load', refresh);
  window.addEventListener('resize', () => actions.forEach(action => action.reset()));
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', () => actions.forEach(action => action.reset()));
  mouse.addEventListener('change', sync);
  reduced.addEventListener('change', sync);
  const observer = new MutationObserver(sync);
  observer.observe(intro, { attributes: true, attributeFilter: ['class', 'data-intro-stage'] });
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
})();
