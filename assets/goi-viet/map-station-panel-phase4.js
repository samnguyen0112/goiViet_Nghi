/* Keep a focused topic fully inside its horizontal strip. No camera/state work. */
(() => {
  'use strict';
  const strip = document.querySelector('#stationPanel .topic-filter-bar');
  if (!strip) return;
  strip.addEventListener('focusin', event => {
    if (!document.getElementById('introScreen')?.classList.contains('intro-hidden')) return;
    const button = event.target.closest('button.topic-btn');
    if (!button || !strip.contains(button)) return;
    const container = strip.getBoundingClientRect();
    const control = button.getBoundingClientRect();
    const left = container.left + 6;
    const right = container.right - 6;
    const delta = control.left < left ? control.left - left
      : control.right > right ? control.right - right : 0;
    if (delta) strip.scrollLeft += delta;
  });
})();
