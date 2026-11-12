/* Preview-5 copy of heritage-overlays-3.js (P5-03 slice 2): interface text follows the VI/EN choice (GoiVietI18n).
   Other pages keep heritage-overlays-3.js. */
// Preview 3 copy: the sound and reduced-motion switches write their state only when it changes.
/* Presentation only: keep the existing memories, export consent and controls. */
(() => {
  'use strict';
  const settings = document.querySelector('#headerSettings .control-options');
  if (!settings) return;
  const T = (key, fallback, vars) => { const I = window.GoiVietI18n; if (!I) return fallback; const value = I.t(key, vars); return value === key ? fallback : value; };
  const svg = paths => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';
  const header = document.createElement('div'); header.className = 'settings-header';
  const mark = document.createElement('i'); mark.className = 'settings-header-mark'; mark.setAttribute('aria-hidden', 'true');
  mark.innerHTML = svg('<path d="M4 7h4m4 0h8M4 17h8m4 0h4"/><circle cx="10" cy="7" r="2"/><circle cx="14" cy="17" r="2"/>');
  const heading = document.createElement('div');
  const title = document.createElement('p'); title.className = 'settings-title'; title.textContent = T('overlay.title', 'Tùy chọn hành trình');
  const subtitle = document.createElement('p'); subtitle.className = 'settings-subtitle'; subtitle.textContent = T('settings.subtitle', 'Âm thanh, giao diện và hiệu ứng.');
  heading.append(title, subtitle); header.append(mark, heading); settings.prepend(header);
  const options = [
    ['#btnSoundToggle', '<path d="m11 5-6 4H2v6h3l6 4V5Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>', 'settings.soundHint', 'Tiếng tàu và giai điệu dân gian.'],
    ['#btnTheme', '<path d="M20.9 13a9 9 0 1 1-9.9-9.9A7 7 0 0 0 20.9 13Z"/>', 'settings.darkHint', 'Sắc trầm dịu mắt khi khám phá.'],
    ['#btnReducedMotion', '<path d="M3 8c3-4 6 4 9 0s6 4 9 0M3 16c3-4 6 4 9 0s6 4 9 0"/>', 'settings.motionHint', 'Tiết chế hiệu ứng và chuyển cảnh.']
  ];
  for (const [selector, paths, hintKey, fallback] of options) {
    const button = settings.querySelector(selector); if (!button) continue;
    button.classList.add('settings-option');
    button.type = 'button';
    const icon = document.createElement('i'); icon.className = 'settings-icon'; icon.setAttribute('aria-hidden', 'true'); icon.innerHTML = svg(paths); button.prepend(icon);
    const label = button.querySelector('span'); label.classList.add('settings-option-label');
    const hint = document.createElement('small'); hint.className = 'settings-option-hint'; hint.id = button.id + '-hint'; hint.textContent = T(hintKey, fallback); button.append(hint);
    button.setAttribute('aria-labelledby', label.id);
    button.setAttribute('aria-describedby', hint.id);
  }
  function syncSwitches() {
    for (const id of ['btnSoundToggle','btnTheme','btnReducedMotion']) {
      const button = document.getElementById(id); if (!button) continue;
      const enabled = id === 'btnTheme' ? document.documentElement.dataset.theme === 'dark'
        : typeof state === 'object' && state ? Boolean(id === 'btnSoundToggle' ? state.soundEnabled : state.reducedMotion)
          : button.getAttribute('aria-pressed') === 'true';
      // The observer fires for any change inside the menu; most leave these switches as they are.
      if (button.dataset.enabled !== String(enabled)) button.dataset.enabled = String(enabled);
      if (button.getAttribute('aria-pressed') !== String(enabled)) button.setAttribute('aria-pressed', String(enabled));
    }
    const motionHint = document.getElementById('btnReducedMotion-hint');
    const deviceReduced = document.getElementById('btnReducedMotion').disabled;
    const message = deviceReduced ? T('settings.motionDevice', 'Đang theo cài đặt của thiết bị.') : T('settings.motionHint', 'Tiết chế hiệu ứng và chuyển cảnh.');
    if (motionHint.textContent !== message) motionHint.textContent = message;
  }
  new MutationObserver(syncSwitches).observe(settings,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['disabled']});
  new MutationObserver(syncSwitches).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  syncSwitches();
  const source = document.getElementById('mapSourcesContent');
  if (!source) return;
  const chevron = () => {
    const arrow = document.createElement('span'); arrow.className = 'map-source-chevron'; arrow.setAttribute('aria-hidden','true');
    arrow.innerHTML = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m4 6 4 4 4-4"/></svg>';
    return arrow;
  };
  const sourceSummary = source.parentElement.querySelector(':scope > summary');
  const sourceIcon = document.createElement('i'); sourceIcon.className = 'settings-icon'; sourceIcon.setAttribute('aria-hidden', 'true');
  sourceIcon.innerHTML = svg('<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"/><path d="M9 3v15M15 6v15"/>'); sourceSummary.prepend(sourceIcon);
  sourceSummary.querySelector('.map-source-chevron')?.remove(); sourceSummary.append(chevron());
  const lead = document.createElement('p'); lead.className = 'settings-source-intro'; lead.textContent = T('overlay.lead', 'Bản đồ và tuyến đi mang tính minh họa cho hành trình văn hóa.');
  const links = document.createElement('div'); links.className = 'settings-source-links';
  const details = document.createElement('details'); details.className = 'settings-source-details';
  const summary = document.createElement('summary'); summary.textContent = T('overlay.details', 'Chi tiết nguồn & giấy phép'); summary.append(chevron());
  const full = document.createElement('div'); full.className = 'settings-source-full'; details.append(summary,full);
  // Modules continue appending their original credits here. Move, never discard,
  // those nodes; async duplicate checks use descendant selectors and still work.
  full.append(...source.childNodes); source.append(lead,links,details);
  const credits = new MutationObserver(collectCredits);
  function collectCredits() {
    credits.disconnect();
    for (const node of [...source.childNodes]) if (![lead,links,details].includes(node)) full.append(node);
    const names = [['naturalearthdata.com','Natural Earth'],['openstreetmap.org','OpenStreetMap'],['copernicus.eu','Copernicus DEM'],['gebco.net','GEBCO']];
    for (const [domain,label] of names) {
      if ([...links.children].some(a=>a.textContent===label)) continue;
      const original = [...full.querySelectorAll('a[href]')].find(a=>a.href.includes(domain));
      if (original) { const copy=original.cloneNode(false); copy.textContent=label; links.append(copy); }
    }
    credits.observe(source,{childList:true,subtree:true});
  }
  collectCredits();
  document.addEventListener('goiviet:langchange', () => {
    title.textContent = T('overlay.title', 'Tùy chọn hành trình');
    subtitle.textContent = T('settings.subtitle', 'Âm thanh, giao diện và hiệu ứng.');
    for (const [selector, , hintKey, fallback] of options) {
      const hint = settings.querySelector(selector + ' .settings-option-hint');
      if (hint) hint.textContent = T(hintKey, fallback);
    }
    lead.textContent = T('overlay.lead', 'Bản đồ và tuyến đi mang tính minh họa cho hành trình văn hóa.');
    if (summary.firstChild && summary.firstChild.nodeType === 3) summary.firstChild.nodeValue = T('overlay.details', 'Chi tiết nguồn & giấy phép');
    syncSwitches();
  });
})();
