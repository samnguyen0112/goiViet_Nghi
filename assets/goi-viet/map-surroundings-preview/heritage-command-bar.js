/* Presentation of the regional preview header. Existing controls own all actions and state. */
(() => {
  'use strict';
  const intro = document.getElementById('introScreen');
  const header = document.querySelector('#mapScene .top-header');
  if (!intro || !header) return;
  const active = () => intro.classList.contains('intro-hidden');
  const svgNS = 'http://www.w3.org/2000/svg';
  const paths = {
    ticket: '<path d="M4 5h16v5a2 2 0 0 0 0 4v5H4v-5a2 2 0 0 0 0-4V5Z"/><path d="M9 5v2m0 3v1m0 3v1m0 2v2m4-10h4m-4 4h3"/>',
    postcard: '<rect x="2.5" y="4.5" width="19" height="15" rx="1.5"/><path d="M13 5v14M5.5 14h4m-4 3h4M16 8h3v4h-3z"/><path d="m5 11 2-3 3 4"/>',
    settings: '<path d="m10 3-.6 2.3-2 .9L5.2 5.5 3.4 8.6 5 10.2v2.4l-1.6 1.6 1.8 3.1 2.2-.7 2 .9.6 2.5h3.6l.6-2.5 2-.9 2.2.7 1.8-3.1-1.6-1.6v-2.4l1.6-1.6-1.8-3.1-2.2.7-2-.9L13.6 3Z"/><circle cx="11.8" cy="11.5" r="3"/>'
  };
  function icon(kind) {
    const el = document.createElementNS(svgNS, 'svg');
    el.setAttribute('viewBox', '0 0 24 24');
    el.setAttribute('fill', 'none');
    el.setAttribute('stroke', 'currentColor');
    el.setAttribute('stroke-width', '1.5');
    el.setAttribute('stroke-linecap', 'round');
    el.setAttribute('stroke-linejoin', 'round');
    el.setAttribute('aria-hidden', 'true');
    el.setAttribute('focusable', 'false');
    el.setAttribute('class', 'ui-ref-icon heritage-bar-icon heritage-' + kind + '-icon');
    el.innerHTML = paths[kind];
    return el;
  }
  function textSpan(className, text) {
    const el = document.createElement('span');
    el.className = className;
    el.textContent = text;
    return el;
  }
  function decorateTurn() {
    const label = document.getElementById('currentTurnLabel');
    if (!label || label.querySelector('.heritage-turn-name')) return;
    const match = label.textContent.trim().match(/^(Lượt:)\s*(.*?)\s*(\([^()]*\))$/u);
    if (!match) return;
    label.replaceChildren(
      textSpan('heritage-turn-prefix', match[1]), document.createTextNode(' '),
      textSpan('heritage-turn-name', match[2]), document.createTextNode(' '),
      textSpan('heritage-turn-pawn', match[3])
    );
  }
  function decorateProgress() {
    const label = document.getElementById('cardProgressLabel');
    const match = label?.textContent.match(/^(.*?)\s*(\d+)\s*\/\s*(\d+)$/u);
    if (!match) return;
    if (!label.querySelector('.heritage-progress-count')) {
      label.replaceChildren(
        textSpan('heritage-progress-prefix', match[1]), document.createTextNode(' '),
        textSpan('heritage-progress-count', match[2] + ' / ' + match[3])
      );
    }
    const banner = label.parentElement;
    let track = banner.querySelector('.heritage-progress-track');
    if (!track) {
      track = document.createElement('span');
      track.className = 'heritage-progress-track';
      track.setAttribute('aria-hidden', 'true');
      for (let i = 1; i <= 3; i++) track.append(textSpan('heritage-progress-stamp', String(i)));
      banner.append(track);
    }
    [...track.children].forEach((el, i) => el.classList.toggle('is-stamped', i < Number(match[2])));
  }
  function decorateControls() {
    const change = header.querySelector('.turn-banner .small-wood-btn');
    change?.setAttribute('aria-label', 'Đổi lượt');
    for (const [selector, kind] of [['.header-actions > .craft-btn-red', 'ticket'], ['.header-actions > .craft-btn-green', 'postcard']]) {
      const button = header.querySelector(selector);
      if (button && !button.querySelector('.heritage-' + kind + '-icon')) button.querySelector('svg')?.replaceWith(icon(kind));
      if (kind === 'postcard') button?.setAttribute('aria-label', 'Bưu thiếp');
    }
    const summary = header.querySelector('#headerSettings > summary');
    if (summary && !summary.querySelector('.heritage-settings-icon')) {
      summary.replaceChildren(icon('settings'), textSpan('heritage-settings-text', 'Tùy chọn'));
      summary.setAttribute('aria-label', 'Tùy chọn');
      summary.title = 'Tùy chọn';
    }
  }
  const observer = new MutationObserver(decorate);
  function decorate() {
    if (!active()) return;
    observer.disconnect();
    try { decorateTurn(); decorateProgress(); decorateControls(); }
    finally { observer.observe(header, {childList: true, subtree: true, characterData: true}); }
  }
  new MutationObserver(decorate).observe(intro, {attributes: true, attributeFilter: ['class']});
  observer.observe(header, {childList: true, subtree: true, characterData: true});
  decorate();
})();
