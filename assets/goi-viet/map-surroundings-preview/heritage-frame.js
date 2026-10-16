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

  function fitArtwork() {
    const scale = Math.min(scene.clientWidth / 1589, scene.clientHeight / 989);
    scene.style.setProperty('--hf-scale', String(scale));
  }
  fitArtwork();
  function insets() {
    const css = getComputedStyle(scene);
    // Resolve max()/env()/clamp() through the actual rail dimensions.
    const size = edge => frame.querySelector(`.hf-rail[data-edge="${edge}"]`).getBoundingClientRect();
    const gap = parseFloat(css.getPropertyValue('--hf-gap')) || 0;
    return {left: size('left').width, right: size('right').width, top: size('top').height, bottom: size('bottom').height, gap};
  }
  let obstacleBounds = [];
  function updateObstacles() {
    obstacleBounds = [...frame.querySelectorAll('.hf-rail,.hf-corner')].map(el => {
      const r = el.getBoundingClientRect();
      return {left: r.left - 3, right: r.right + 3, top: r.top - 3, bottom: r.bottom + 3};
    });
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
  window.GoiVietHeritageFrame = Object.freeze({active, constrainMapArea, insets, obstacles: () => active() ? obstacleBounds : []});
  // Preserve the old layout notification contract used by the drawer and compass.
  window.GoiVietMapFrame = Object.freeze({active, syncSafeArea, inspect: () => ({active: active(), mounted: frame.isConnected, mode: 'original-nine-slice', sourceSize: [1589, 989], insets: insets()})});
  new MutationObserver(syncSafeArea).observe(intro, {attributes: true, attributeFilter: ['class']});
  window.addEventListener('resize', syncSafeArea, {passive: true});
  document.fonts.ready.then(syncSafeArea);
  // A direct link for reviewing the map frame; the normal homepage flow is unchanged.
  if (location.hash === '#heritage-frame') {
    const openPreview = () => { if (typeof closeIntroModal === 'function') closeIntroModal(); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', openPreview, {once: true});
    else requestAnimationFrame(openPreview);
  }
  syncSafeArea();
})();
