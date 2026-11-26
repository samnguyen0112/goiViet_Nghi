/* Preview-5 copy of heritage-frame.js (A-04): guards --hf-scale writes and caches frame insets/obstacles
   until viewport, controls, language, theme, fonts or map activation change. Other pages keep heritage-frame.js. */
/* Original approved artwork rendered with CSS nine-slice borders.
   The source PNG is byte-identical to the user reference; UI geometry stays independent. */
(() => {
  'use strict';
  const scene = document.getElementById('mapScene');
  const intro = document.getElementById('introScreen');
  if (!scene || !intro) return;
  const active = () => intro.classList.contains('intro-hidden');
  const frame = document.createElement('div');
  frame.className = 'heritage-frame';
  frame.setAttribute('aria-hidden', 'true');
  frame.inert = true;
  // CSS border-image performs nine-slice rendering directly from the ORIGINAL PNG.
  // The center is omitted. Corners retain their aspect ratio; no illustration is redrawn.
  frame.innerHTML = '<div class="hf-original-art"></div>'
    + ['top', 'right', 'bottom', 'left'].map(edge => '<div class="hf-rail" data-edge="' + edge + '"></div>').join('')
    + ['tl', 'tr', 'bl', 'br'].map(corner => '<div class="hf-corner" data-corner="' + corner + '"></div>').join('');
  scene.append(frame);

  const rails = {
    top: frame.querySelector('.hf-rail[data-edge="top"]'),
    right: frame.querySelector('.hf-rail[data-edge="right"]'),
    bottom: frame.querySelector('.hf-rail[data-edge="bottom"]'),
    left: frame.querySelector('.hf-rail[data-edge="left"]')
  };
  const obstacleEls = [...frame.querySelectorAll('.hf-rail,.hf-corner')];

  let lastScale = '';
  let cachedInsets = null;
  let obstacleBounds = [];
  let obstaclesDirty = true;
  let lastActive = active();

  function invalidateCache() {
    cachedInsets = null;
    obstaclesDirty = true;
  }

  function fitArtwork() {
    const scale = Math.min(scene.clientWidth / 1589, scene.clientHeight / 989);
    const value = String(scale);
    if (lastScale !== value) {
      lastScale = value;
      scene.style.setProperty('--hf-scale', value);
      invalidateCache();
    }
  }
  fitArtwork();

  function insets() {
    const isActive = active();
    if (isActive !== lastActive) {
      lastActive = isActive;
      invalidateCache();
    }
    if (cachedInsets) return { ...cachedInsets };
    const css = getComputedStyle(scene);
    // Resolve max()/env()/clamp() through the actual rail dimensions.
    const gap = parseFloat(css.getPropertyValue('--hf-gap')) || 0;
    const result = {
      left: rails.left.getBoundingClientRect().width,
      right: rails.right.getBoundingClientRect().width,
      top: rails.top.getBoundingClientRect().height,
      bottom: rails.bottom.getBoundingClientRect().height,
      gap
    };
    if (isActive && (result.left || result.right || result.top || result.bottom)) {
      cachedInsets = result;
    }
    return { ...result };
  }

  function updateObstacles() {
    const isActive = active();
    if (isActive !== lastActive) {
      lastActive = isActive;
      invalidateCache();
    }
    if (!obstaclesDirty && obstacleBounds.length) return;
    const next = obstacleEls.map(el => {
      const r = el.getBoundingClientRect();
      return { left: r.left - 3, right: r.right + 3, top: r.top - 3, bottom: r.bottom + 3 };
    });
    obstacleBounds = next;
    if (isActive && next.some(b => b.right - b.left > 6 && b.bottom - b.top > 6)) {
      obstaclesDirty = false;
    }
  }

  function constrainMapArea(area) {
    if (!active() || !area) return;
    const edge = insets();
    area.left = Math.max(area.left, edge.left + edge.gap);
    area.right = Math.min(area.right, innerWidth - edge.right - edge.gap);
    area.bottom = Math.min(area.bottom, innerHeight - edge.bottom - edge.gap - 12);
  }

  let pending = 0, syncing = false;
  function syncSafeArea() {
    if (pending || syncing || !active()) return;
    pending = requestAnimationFrame(() => {
      pending = 0;
      if (active() && typeof syncHeaderOffset === 'function') {
        syncing = true;
        try { fitArtwork(); updateObstacles(); syncHeaderOffset(); } finally { syncing = false; }
      }
    });
  }

  function onEnvironmentChange() {
    invalidateCache();
    syncSafeArea();
  }

  window.GoiVietHeritageFrame = Object.freeze({ active, constrainMapArea, insets, obstacles: () => active() ? obstacleBounds : [] });
  // Preserve the old layout notification contract used by the drawer and compass.
  window.GoiVietMapFrame = Object.freeze({ active, syncSafeArea, inspect: () => ({ active: active(), mounted: frame.isConnected, mode: 'original-nine-slice', sourceSize: [1589, 989], insets: insets() }) });

  new MutationObserver(() => {
    const nowActive = active();
    if (nowActive !== lastActive) {
      lastActive = nowActive;
      invalidateCache();
    }
    syncSafeArea();
  }).observe(intro, { attributes: true, attributeFilter: ['class'] });

  new MutationObserver(onEnvironmentChange).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  document.addEventListener('goiviet:langchange', onEnvironmentChange);
  window.addEventListener('resize', onEnvironmentChange, { passive: true });
  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(onEnvironmentChange);
    for (const el of [scene, document.querySelector('.top-header'), document.querySelector('.bottom-dock')]) {
      if (el) observer.observe(el);
    }
  }
  document.fonts?.addEventListener?.('loadingdone', onEnvironmentChange);
  document.fonts?.ready.then(onEnvironmentChange);

  // A direct link for reviewing the map frame; the normal homepage flow is unchanged.
  if (location.hash === '#heritage-frame') {
    const openPreview = () => { if (typeof closeIntroModal === 'function') closeIntroModal(); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', openPreview, { once: true });
    else requestAnimationFrame(openPreview);
  }
  syncSafeArea();
})();
