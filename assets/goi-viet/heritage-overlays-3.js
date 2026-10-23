// Preview 3 copy: the sound and reduced-motion switches write their state only when it changes.
/* Presentation only: keep the existing memories, export consent and controls. */
(() => {
  'use strict';
  const settings = document.querySelector('#headerSettings .control-options');
  if (!settings) return;
  const title = document.createElement('p'); title.className = 'settings-title'; title.textContent = 'Tùy chọn hành trình'; settings.prepend(title);
  for (const [selector, symbol] of [['#btnSoundToggle','♫'],['#btnTheme','◐'],['#btnReducedMotion','≈'],['button[onclick*="openIntroModal"]','◇']]) {
    const button = settings.querySelector(selector); if (!button) continue;
    const icon = document.createElement('i'); icon.className = 'settings-icon'; icon.setAttribute('aria-hidden','true'); icon.textContent = symbol; button.prepend(icon);
  }
  function syncSwitches() {
    for (const id of ['btnSoundToggle','btnReducedMotion']) {
      const button = document.getElementById(id); if (!button) continue;
      const enabled = /:\s*Bật(?:\s*\([^)]*\))?\s*$/u.test(button.textContent);
      // The observer fires for any change inside the menu; most leave these switches as they are.
      if (button.dataset.enabled !== String(enabled)) button.dataset.enabled = String(enabled);
      if (button.getAttribute('aria-pressed') !== String(enabled)) button.setAttribute('aria-pressed', String(enabled));
    }
  }
  new MutationObserver(syncSwitches).observe(settings,{childList:true,subtree:true,characterData:true}); syncSwitches();
  const source = document.getElementById('mapSourcesContent');
  if (!source) return;
  const chevron = () => {
    const arrow = document.createElement('span'); arrow.className = 'map-source-chevron'; arrow.setAttribute('aria-hidden','true');
    arrow.innerHTML = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m4 6 4 4 4-4"/></svg>';
    return arrow;
  };
  const sourceSummary = source.parentElement.querySelector(':scope > summary');
  sourceSummary.querySelector('.map-source-chevron')?.remove(); sourceSummary.append(chevron());
  const lead = document.createElement('p'); lead.className = 'settings-source-intro'; lead.textContent = 'Bản đồ và tuyến đi mang tính minh họa cho hành trình văn hóa.';
  const links = document.createElement('div'); links.className = 'settings-source-links';
  const details = document.createElement('details'); details.className = 'settings-source-details';
  const summary = document.createElement('summary'); summary.textContent = 'Chi tiết nguồn & giấy phép'; summary.append(chevron());
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
})();
