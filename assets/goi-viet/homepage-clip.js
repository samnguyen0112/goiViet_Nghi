// Own only the welcome video's playback; the existing buttons keep their original handlers.
(() => {
  const intro = document.getElementById('introScreen');
  const film = document.getElementById('homeClipFilm');
  const video = document.getElementById('homeClipVideo');
  const retry = document.getElementById('btnHomeClipRetry');
  const status = document.getElementById('homeClipStatus');
  if (!intro || !film || !video || !retry || !status) return;

  let failed = false;
  let blocked = false;
  let pending = null;
  const active = () => !document.hidden &&
    !intro.classList.contains('intro-hidden') &&
    !intro.classList.contains('intro-stage-leaving') &&
    intro.getAttribute('data-intro-stage') === 'welcome' &&
    !document.body.classList.contains('reduced-motion');

  const updateRetry = () => {
    retry.hidden = !(active() && (failed || blocked));
    retry.textContent = failed ? 'Thử tải lại chuyển động' : 'Phát chuyển động';
  };
  const sync = () => {
    updateRetry();
    if (!active()) {
      video.pause();
      return;
    }
    if (failed || blocked || pending || !video.paused) return;
    video.muted = true;
    pending = video.play();
    if (!pending) return;
    pending.then(() => {
      blocked = false;
      film.dataset.clipStatus = 'ready';
      status.textContent = '';
      if (!active()) video.pause();
    }).catch(error => {
      if (active() && error.name !== 'AbortError' && !failed) {
        blocked = true;
        film.dataset.clipStatus = 'blocked';
        status.textContent = 'Chạm Phát chuyển động để xem clip. Các nút khám phá và hướng dẫn vẫn dùng được.';
      }
    }).finally(() => {
      pending = null;
      updateRetry();
      if (active() && !blocked && !failed && video.paused) sync();
    });
  };
  const loaded = () => {
    failed = false;
    film.dataset.clipReady = 'true';
    film.dataset.clipStatus = blocked ? 'blocked' : 'ready';
    updateRetry();
  };
  const mediaError = () => {
    failed = true;
    video.pause();
    film.dataset.clipStatus = 'error';
    status.textContent = 'Chuyển động chưa tải được. Ảnh trang chủ và các nút vẫn dùng được; có thể thử tải lại.';
    updateRetry();
  };
  video.addEventListener('loadeddata', loaded);
  video.addEventListener('error', mediaError);
  video.querySelector('source').addEventListener('error', mediaError);
  if (video.readyState >= 2) loaded();
  if (video.error) mediaError();

  retry.addEventListener('click', () => {
    const reload = failed;
    failed = false;
    blocked = false;
    status.textContent = '';
    film.dataset.clipStatus = 'loading';
    if (reload) {
      film.dataset.clipReady = 'false';
      video.load();
    }
    sync();
  });
  // Clicking the scenery pauses/resumes it without putting extra artwork over the clip.
  film.addEventListener('click', event => {
    if (!event.target.closest('button') && typeof toggleReducedMotion === 'function') {
      toggleReducedMotion();
    }
  });
  const observer = new MutationObserver(sync);
  observer.observe(intro, { attributes: true, attributeFilter: ['class', 'data-intro-stage'] });
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', () => video.pause());
  window.addEventListener('pageshow', sync);
  sync();
})();

// Button feedback samples the original artwork, preserving its Vietnamese lettering.
(() => {
  const intro = document.getElementById('introScreen');
  const video = document.getElementById('homeClipVideo');
  const poster = document.querySelector('.gv-home-poster');
  if (!intro || !video || !poster) return;
  const mouse = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const actions = [];
  const homeVisible = () => !document.hidden && !intro.classList.contains('intro-hidden') &&
    !intro.classList.contains('intro-stage-leaving') && intro.dataset.introStage === 'welcome';
  const motionAllowed = () => !reduced.matches && !document.body.classList.contains('reduced-motion');

  for (const [id, crop] of [
    ['btnQuickStartWelcome', [578, 864, 280, 54]],
    ['btnProceedToGuide', [872, 864, 145, 54]]
  ]) {
    const button = document.getElementById(id);
    if (!button) continue;
    const art = document.createElement('span');
    art.className = 'gv-home-action-art';
    art.setAttribute('aria-hidden', 'true');
    const canvas = document.createElement('canvas');
    canvas.width = crop[2];
    canvas.height = crop[3];
    art.append(canvas);
    button.append(art);
    const ctx = canvas.getContext('2d');
    let frame = 0;
    let point = null;
    const draw = () => {
      const source = video.readyState >= 2 && !video.error ? video :
        poster.complete && poster.naturalWidth ? poster : null;
      if (!source || !ctx) return;
      try {
        ctx.drawImage(source, ...crop, 0, 0, canvas.width, canvas.height);
        button.dataset.homeArtReady = 'true';
      } catch (_) {
        // A media frame may be unavailable while seeking. Keep the printed button visible.
        button.dataset.homeArtReady = 'false';
      }
    };
    const resetTilt = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      point = null;
      button.style.removeProperty('--home-tilt-x');
      button.style.removeProperty('--home-tilt-y');
    };
    const reset = () => { resetTilt(); button.classList.remove('is-home-hovered'); };
    button.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'mouse' || !mouse.matches || !homeVisible()) return;
      draw();
      button.classList.add('is-home-hovered');
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
  };
  video.addEventListener('loadeddata', refresh);
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
