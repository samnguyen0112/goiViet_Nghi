/* Arrival flow shared by preview-5 and its standalone demo. */
(() => {
  'use strict';
  const I = window.GoiVietI18n;
  const t = (key, vars) => I.t('arrival.' + key, vars);
  const $ = id => document.getElementById(id);
  const name = id => {
    if (ISLAND_MAP[id]) return t('islandName', { place: id === 'hoang-sa' ? 'Hoàng Sa' : 'Trường Sa' });
    const raw = CULTURAL_PLACE_MAP[id]?.short || CULTURAL_PLACE_MAP[id]?.name || id;
    if (I.lang() === 'vi' && id === 'hcm') return 'TP.HCM';
    return raw?.replace(/^(TP\.|Tỉnh|Thành phố)\s+/i, '') || '';
  };
  const scene = $('mapScene'), panel = $('stationPanel'), canvas = $('mainCanvas');
  const integrated = document.body.hasAttribute('data-arrival-preview');
  const journey = () => window.GoiVietJourneyPreview;
  const visited = new Set(['hn']);
  let sheetId = null, renderedId = null, sheetKey = '', journalKey = '', pickedOnce = false;
  let ticket = null, bannerTimer = 0, tooltipFrame = 0, pointer = null;
  let pendingArrival = null, pendingReveal = null, suppressedPin = null;
  const pendingSeals = new Set(), knownSeals = new Set();
  const seals = () => new Set(state.completedStamps.map(s => normalizePlaceId(s.placeId)));
  const regionKey = place => ISLAND_MAP[place.id] ? '__islands' : contentVi(place, 'region');
  function region(place) {
    if (ISLAND_MAP[place.id]) return t('islands');
    return I.lang() === 'en' ? window.GoiVietContent.english(regionKey(place)) : regionKey(place);
  }
  let focusFrame = 0, focusRevision = 0;

  const sheet = document.createElement('section');
  sheet.id = 'arrivalSheet';
  sheet.className = 'giay-do-surface khung-moc';
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'false');
  sheet.setAttribute('aria-labelledby', 'arrivalStationTitle');
  sheet.hidden = true;
  sheet.addEventListener('error', event => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || !image.matches('.gv-station-art-photo')) return;
    image.hidden = true;
    image.parentElement.querySelector('.gv-station-art-ambience')?.remove();
  }, true);
  scene.append(sheet);

  const hint = document.createElement('div');
  hint.id = 'arrivalStartHint';
  hint.className = 'giay-do-surface';
  hint.innerHTML = '<span data-arrival-text="hint"></span><div class="arrival-start-chips">' +
    ['hn', 'hue', 'hcm'].map(id => `<button type="button" data-arrival-pick="${id}"></button>`).join('') + '</div>';
  scene.append(hint);
  hint.addEventListener('click', event => {
    const button = event.target.closest('[data-arrival-pick]');
    if (button) selectDemoPlace(button.dataset.arrivalPick);
  });

  const journalSection = document.createElement('section');
  journalSection.id = 'arrivalVisitedJournal';
  journalSection.innerHTML = '<h3 id="arrivalVisitedCount"></h3><ul id="arrivalVisitedList"></ul><h3 id="arrivalSealedCount"></h3><ul id="arrivalSealedList"></ul>';
  panel.querySelector('.gv-station-journal-body').prepend(journalSection);
  journalSection.addEventListener('click', event => {
    const button = event.target.closest('[data-arrival-pick]');
    if (button) selectStationFromJournal(button.dataset.arrivalPick);
  });

  const tooltip = document.createElement('div');
  tooltip.id = 'arrivalPinTip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.hidden = true;
  scene.append(tooltip);

  function localize() {
    if (!integrated) document.title = t('title');
    scene.querySelectorAll('[data-arrival-text]').forEach(el => { el.textContent = t(el.dataset.arrivalText); });
    hint.querySelectorAll('[data-arrival-pick]').forEach(el => { el.textContent = name(el.dataset.arrivalPick); });
    $('previewPanelOpen').setAttribute('aria-label', t('list'));
    $('previewPanelClose').setAttribute('aria-label', t('closeList'));
    syncList();
    refresh();
    journey()?.syncControls();
    updateTooltip();
    updateToast();
    if ($('mapStationArrivalBanner').classList.contains('show') && (pendingArrival || sheetId)) bannerContent(pendingArrival || sheetId);
  }

  function syncList() {
    const hidden = panel.hidden;
    panel.inert = hidden;
    panel.setAttribute('aria-hidden', String(hidden));
    for (const id of ['previewPanelOpen', 'previewPanelClose', 'btnMobileTogglePanel']) {
      $(id)?.setAttribute('aria-expanded', String(!hidden));
    }
    const toggle = $('previewPanelOpen');
    const actions = scene.querySelector('.top-header .header-actions');
    const host = hidden ? actions : scene;
    if (toggle.parentElement !== host) {
      if (hidden) actions.insertBefore(toggle, actions.querySelector('.gv-lang-toggle-header'));
      else scene.append(toggle);
    }
    toggle.setAttribute('aria-label', t(hidden ? 'list' : 'closeList'));
    toggle.title = t(hidden ? 'list' : 'closeList');
    const label = toggle.querySelector('span');
    const text = t(hidden ? 'list' : 'closeList');
    if (label.textContent !== text) label.textContent = text;
    const symbol = toggle.querySelector('use'), href = '#gv-station-' + (hidden ? 'list' : 'close');
    if (symbol.getAttribute('href') !== href) symbol.setAttribute('href', href);
    if (!hidden) {
      const height = Math.round(panel.getBoundingClientRect().height) + 'px';
      if (scene.style.getPropertyValue('--arrival-directory-height') !== height) scene.style.setProperty('--arrival-directory-height', height);
    }
  }

  function closeList(restore = false) {
    window.GoiVietPreviewPolish?.setCollapsed(true, { focus: restore });
    panel.hidden = true;
    document.body.classList.add('preview-panel-collapsed');
    syncList();
  }

  function openList() {
    if (pendingArrival) cancelArrival();
    closeSheet({ restore: false, announce: false });
    window.GoiVietPreviewPolish?.setCollapsed(false);
    panel.hidden = false;
    document.body.classList.remove('preview-panel-collapsed');
    syncList();
    $('provSearchInput').focus({ preventScroll: true });
    window.GoiVietMapFrame?.syncSafeArea();
  }

  function focusRoute() {
    if (panel.hidden) scene.querySelector('.journey-route-info')?.focus({ preventScroll: true });
  }

  function selected() {
    cancelArrival();
    suppressedPin = state.hoveredItem?.id || journey()?.inspect().selected;
    pickedOnce = true;
    hint.hidden = true;
    tooltip.hidden = true;
    closeList(false);
    closeSheet({ restore: false, announce: false });
    focusRoute();
    journey()?.syncControls();
    updateToast();
  }

  function refreshJournal() {
    const earned = seals();
    const progress = $('cardProgressLabel');
    progress.title = t('sealHint');
    progress.setAttribute('aria-label', progress.textContent + '. ' + t('sealHint'));
    for (const id of earned) if (!knownSeals.has(id)) { knownSeals.add(id); pendingSeals.add(id); }
    const key = I.lang() + ':' + [...visited].join(',') + ':' + [...earned].join(',');
    if (journalKey === key) return;
    journalKey = key;
    $('arrivalVisitedCount').textContent = t('visited', { n: visited.size });
    $('arrivalVisitedList').innerHTML = [...visited].map(id => `<li><button type="button" class="gv-station-journal-stop" data-arrival-pick="${id}">${escapeHTML(name(id))}</button></li>`).join('');
    $('arrivalSealedCount').textContent = t('sealedCount', { n: earned.size });
    $('arrivalSealedList').innerHTML = [...earned].map(id => `<li><button type="button" class="gv-station-journal-stop" data-arrival-pick="${id}">${escapeHTML(name(id))}</button></li>`).join('');
  }

  function refresh() {
    refreshJournal();
    if (!sheetId) return;
    const place = CULTURAL_PLACE_MAP[sheetId];
    const remaining = Math.max(0, place.cards.length - (state.drawnCardIdsByPlace[sheetId] || []).length);
    const sealed = seals().has(sheetId);
    const islandEntry = integrated && ISLAND_MAP[sheetId] && window.GoiVietNaturalLandscape;
    const islandLabel = islandEntry && t(window.GoiVietFamilyVoyage?.entryLabel() ? 'postOffice' : 'islandChart');
    const key = [sheetId, I.lang(), remaining, getCurrentPlayerName(), visited.size, sealed, islandLabel].join('|');
    if (sheetKey === key) { sealFeedback(); return; }
    sheetKey = key;
    const component = window.GoiVietStationPanel;
    const markup = `
      <div class="arrival-sheet-header"><span class="arrival-reached"></span>${islandEntry ? `
        <button type="button" class="arrival-island-entry" data-arrival-action="island" aria-haspopup="dialog">
          <svg class="gv-station-icon" aria-hidden="true"><use href="#gv-station-ship"/></svg><span></span>
        </button>` : ''}</div>
      <div class="arrival-visual">
        <div class="arrival-art-wrap">${component.renderStationArt(place, place.highlights, place.stories[0].id, Boolean(ISLAND_MAP[sheetId]))}</div>
        <div class="arrival-identity"><span class="arrival-station-kicker"></span><h3 id="arrivalStationTitle" tabindex="-1"></h3><small class="arrival-turn"></small></div>
      </div>
      <p class="arrival-summary"></p>
      <div class="arrival-highlights">${component.renderHighlights(place.highlights)}</div>
      ${component.renderModes(place, remaining)}
      <div class="arrival-sheet-foot"><small class="arrival-seal-status"></small><button type="button" data-arrival-action="other"><span class="arrival-other-label"></span><svg class="gv-station-icon" aria-hidden="true"><use href="#gv-station-chevron"/></svg></button></div>
      <button type="button" class="arrival-close" data-arrival-action="close"><svg class="gv-station-icon" aria-hidden="true"><use href="#gv-station-close"/></svg></button>`;
    if (renderedId !== sheetId) {
      sheet.innerHTML = markup;
      renderedId = sheetId;
    } else {
      // Keep the source buttons alive: the existing modal focus stack owns references to them.
      const next = document.createElement('template');
      next.innerHTML = markup;
      for (const selector of ['.arrival-highlights', '.gv-station-mode']) {
        const targets = sheet.querySelectorAll(selector), sources = next.content.querySelectorAll(selector);
        targets.forEach((el, i) => { el.innerHTML = sources[i].innerHTML; });
      }
      const art = sheet.querySelector('.gv-station-art'), newArt = next.content.querySelector('.gv-station-art');
      art.setAttribute('aria-label', newArt.getAttribute('aria-label'));
      art.title = newArt.title;
      const photo = art.querySelector('.gv-station-art-photo');
      if (photo) photo.alt = newArt.querySelector('.gv-station-art-photo').alt;
      const credit = sheet.querySelector('.gv-station-photo-credit');
      if (credit) credit.innerHTML = next.content.querySelector('.gv-station-photo-credit').innerHTML;
    }
    sheet.dataset.place = sheetId;
    sheet.classList.toggle('arrival-long-name', name(sheetId).length > 12);
    sheet.querySelector('.arrival-station-kicker').textContent = region(place);
    sheet.querySelector('.arrival-reached').textContent = t(ISLAND_MAP[sheetId] ? 'reachedIslands' : 'sheetArrival');
    if (islandEntry) sheet.querySelector('.arrival-island-entry span').textContent = islandLabel;
    sheet.querySelector('.arrival-turn').textContent = t('sheetTurn', { player: getCurrentPlayerName() });
    $('arrivalStationTitle').textContent = name(sheetId);
    sheet.querySelector('.arrival-summary').textContent = place.tagline || place.summary || '';
    sheet.classList.toggle('arrival-island', Boolean(ISLAND_MAP[sheetId]));
    sheet.classList.toggle('arrival-has-seal', sealed);
    sheet.querySelector('.arrival-seal-status').textContent = t(sealed ? 'sealed' : 'unsealed');
    let stamp = sheet.querySelector('.arrival-stamp');
    if (!stamp) {
      stamp = document.createElement('span'); stamp.className = 'arrival-stamp';
      stamp.innerHTML = '<span class="arrival-stamp-title"></span><small class="arrival-stamp-sub"></small>';
      sheet.querySelector('.gv-station-art').append(stamp);
    }
    stamp.querySelector('.arrival-stamp-title').textContent = t('stampTitle', { n: [...visited].indexOf(sheetId) + 1 });
    stamp.querySelector('.arrival-stamp-sub').textContent = t('stampSub');
    sheet.querySelector('.arrival-other-label').textContent = t('chooseOther');
    sheet.querySelector('.arrival-close').setAttribute('aria-label', t('close'));
    sheet.querySelector('.gv-station-modes').setAttribute('role', 'group');
    sheet.querySelector('.gv-station-modes').setAttribute('aria-label', t('sheetModes'));
    const credit = sheet.querySelector('.gv-station-photo-credit');
    if (credit) {
      const summary = credit.querySelector('summary');
      const originalTitle = summary.title;
      summary.textContent = t('sheetPhoto');
      if (!credit.querySelector('.arrival-credit-title')) {
        const title = document.createElement('strong');
        title.className = 'arrival-credit-title';
        title.textContent = originalTitle;
        credit.querySelector('div').prepend(title);
      }
    }
    fitSheet();
    sealFeedback();
  }

  function sealFeedback() {
    if (sheet.hidden || getTopOpenModalElement() || !pendingSeals.has(sheetId)) return;
    pendingSeals.delete(sheetId);
    if (!state.reducedMotion) {
      sheet.classList.add('arrival-seal-celebrate');
      setTimeout(() => sheet.classList.remove('arrival-seal-celebrate'), 550);
    }
  }

  // Fit actual translated content rather than clipping text or hiding the play modes.
  // Runs only on arrival/content changes/resize, never on the map's animation loop.
  function fitSheet() {
    if (sheet.hidden) return;
    const art = sheet.querySelector('.gv-station-art');
    if (!art) return;
    art.style.removeProperty('width');
    if (innerWidth < 768) return;
    const style = getComputedStyle(sheet), outer = sheet.getBoundingClientRect();
    const limit = parseFloat(style.maxHeight);
    const footer = sheet.querySelector('.arrival-sheet-foot').getBoundingClientRect();
    const excess = footer.bottom - outer.top + parseFloat(style.paddingBottom) + 2 - limit;
    if (excess > 0) {
      const height = Math.max(70, art.getBoundingClientRect().height - excess - 2);
      art.style.width = Math.floor(height * 16 / 9) + 'px';
    }
  }

  function focusCurrent() {
    cancelAnimationFrame(focusFrame);
    const revision = ++focusRevision;
    // syncSafeArea also runs on rAF; wait for it before centring the world point.
    window.GoiVietMapFrame?.syncSafeArea();
    focusFrame = requestAnimationFrame(() => {
      focusFrame = requestAnimationFrame(() => {
        if (revision !== focusRevision || sheet.hidden) return;
        syncHeaderOffset();
        fitSheet();
        const point = window.GoiVietJourneyNetwork.node(sheetId)?.point;
        if (!point) return;
        Object.assign(state.cam, {
          targetYaw: 0, targetPitch: .24, targetZoom: Math.max(.75, Math.min(1.18, state.cam.targetZoom)),
          targetPanX: MAP_CENTER_X - point[0], targetPanY: MAP_CENTER_Y - point[1]
        });
        window.GoiVietRegionalPreview?.constrainCamera();
        requestMapRender();
      });
    });
  }

  function openSheet(id, { announce = true, focusMode = null, stampAnimate = false } = {}) {
    const status = journey()?.presentation();
    if (status?.trip || status?.currentId !== id || !visited.has(id)) return false;
    if (pendingArrival) cancelArrival();
    closeList(false);
    sheetId = id;
    refresh();
    sheet.hidden = false;
    sheet.classList.toggle('arrival-first-stamp', stampAnimate && !state.reducedMotion);
    if (stampAnimate) setTimeout(() => sheet.classList.remove('arrival-first-stamp'), 580);
    sheet.classList.toggle('arrival-no-motion', state.reducedMotion);
    fitSheet();
    sheet.querySelectorAll('.gv-station-mode').forEach(el => el.classList.remove('arrival-mode-cue'));
    const target = focusMode ? $((focusMode === 'deck' ? 'deck-open-' : 'book-open-') + id) : $('arrivalStationTitle');
    if (focusMode) target?.classList.add('arrival-mode-cue');
    target?.focus({ preventScroll: true });
    journey()?.syncControls();
    focusCurrent();
    sealFeedback();
    if (announce) announceSR(t('sr.open', { place: name(id) }));
    return true;
  }

  function closeSheet({ restore = true, announce = true } = {}) {
    if (sheet.hidden) return false;
    sheet.hidden = true;
    focusRevision++;
    cancelAnimationFrame(focusFrame);
    journey()?.syncControls();
    window.GoiVietMapFrame?.syncSafeArea();
    if (restore) {
      const reopen = $('arrivalOpenInfo');
      (reopen?.checkVisibility() ? reopen : canvas).focus({ preventScroll: true });
    }
    if (announce) announceSR(t('sr.close'));
    return true;
  }

  function bannerContent(id) {
    $('mapArrivalKicker').textContent = '';
    $('mapArrivalTitle').textContent = name(id);
    // The original verse remains the content source; EN displays its existing meaning.
    let verse = I.lang() === 'en' ? getFolkVerseGloss(CULTURAL_PLACE_MAP[id]) : getFolkVerseForPlace(CULTURAL_PLACE_MAP[id]);
    if (!verse.includes('\n')) {
      const words = verse.split(/\s+/); let cut = 1;
      while (cut < words.length - 1 && words.slice(0, cut).join(' ').length < verse.length / 2) cut++;
      verse = words.slice(0, cut).join(' ') + '\n' + words.slice(cut).join(' ');
    }
    $('mapArrivalVerse').textContent = verse;
  }

  function cancelArrival() {
    const had = Boolean(pendingArrival);
    clearTimeout(bannerTimer); pendingArrival = null; pendingReveal = null;
    $('mapStationArrivalBanner').classList.remove('show');
    // The journey bar hides "Mở thông tin ga" during the banner; offer it again.
    if (had) journey()?.syncControls();
  }

  // A click on the map during the banner skips the wait instead of losing the station sheet.
  function revealArrival() {
    if (!pendingArrival || !pendingReveal) return false;
    clearTimeout(bannerTimer);
    $('mapStationArrivalBanner').classList.remove('show');
    const reveal = pendingReveal;
    pendingReveal = null;
    reveal();
    return true;
  }

  function positionBanner(banner, destination) {
    const canvasRect = canvas.getBoundingClientRect();
    const area = mapScreenArea || { left: 14, right: cw - 14, top: 160, bottom: ch - 130 };
    const { width, height } = banner.getBoundingClientRect();
    const origin = journey()?.presentation().arrival?.originId;
    const points = [...new Set(['hn', origin, destination])].flatMap(id => {
      const point = id && window.GoiVietJourneyNetwork.node(id)?.point;
      if (!point) return [];
      const [x, y] = project3D(...point, 38, state.cam, cw, ch);
      return [[x + canvasRect.left, y + canvasRect.top]];
    });
    const center = canvasRect.left + (area.left + area.right) / 2;
    const left = canvasRect.left + area.left + width / 2 + 8;
    const right = canvasRect.left + area.right - width / 2 - 8;
    const top = Math.max(canvasRect.top + area.top + 8, 8);
    const routeTop = $('journeyRouteBar')?.getBoundingClientRect().top || innerHeight;
    const bottom = Math.max(top, Math.min(canvasRect.top + area.bottom, routeTop) - height - 12);
    const helper = scene.querySelector('.left-helper')?.getBoundingClientRect();
    for (const y of [top, bottom]) {
      for (const x of [center, right, left]) {
        if (x - width / 2 < 8 || x + width / 2 > innerWidth - 8) continue;
        if (helper && x - width / 2 < helper.right && x + width / 2 > helper.left &&
          y < helper.bottom && y + height > helper.top) continue;
        if (points.some(([px, py]) => Math.abs(px - x) < width / 2 + 40 && py > y - 35 && py < y + height + 35)) continue;
        banner.style.left = x + 'px';
        banner.style.top = y + 'px';
        return;
      }
    }
    banner.style.left = center + 'px';
    banner.style.top = bottom + 'px';
  }

  function onArrive(id, { stationary = false, instant = false } = {}) {
    cancelArrival();
    const first = !visited.has(id);
    visited.add(id);
    suppressedPin = id; tooltip.hidden = true;
    const focusMode = ticket?.id === id ? ticket.mode : null;
    ticket = null;
    const reveal = () => {
      pendingArrival = null; pendingReveal = null;
      openSheet(id, { announce: false, focusMode, stampAnimate: first });
      announceSR(t('sr.arrive', { place: name(id) }));
    };
    const banner = $('mapStationArrivalBanner');
    banner.classList.remove('show');
    if (!state.reducedMotion && !stationary && !instant) {
      pendingArrival = id; pendingReveal = reveal;
      bannerContent(id);
      banner.classList.add('show');
      positionBanner(banner, id);
      bannerTimer = setTimeout(() => { banner.classList.remove('show'); reveal(); }, 1200);
      journey()?.syncControls();
    } else reveal();
  }

  function playFromReading(id, source, kind) {
    if (!(source instanceof Element)) return false;
    const book = window.GoiVietBooks?.inspect();
    const valid = kind === 'book' ? book?.open && book.placeId === id && source.closest('#bookModal [data-act="play"]') :
      $('storyModal').classList.contains('open') && state.activeStory?.place.id === id && source.closest('#btnStoryDeck');
    if (!valid) return false;
    // A book opened from a drawn card can return to that same, still-open deck.
    if (kind === 'book' && $('deckModal').classList.contains('open') && state.deckPlaceId === id) {
      window.GoiVietBooks.close();
      return true;
    }
    if (journey()?.inspect().running || journey()?.inspect().currentId !== id || sheet.hidden || sheetId !== id) return false;
    const target = $('deck-open-' + id);
    if (kind === 'book') window.GoiVietBooks.close(); else closeStoryModal();
    openDeckModal(id, target);
    return true;
  }

  function turnMessage() {
    const s = journey()?.inspect();
    return s?.selected && !s.running && s.selected !== s.currentId ? t('turnReady', { player: getCurrentPlayerName(), place: name(s.selected) }) : '';
  }
  function updateToast() {
    const toast = $('turnHandoffToast');
    if (!toast.classList.contains('show')) return;
    const text = turnMessage() || uiT('js.turn.toast', { name: getCurrentPlayerName() }).replace(/<\/?strong>/g, '');
    const label = toast.lastElementChild;
    if (label && label.textContent !== text) label.textContent = text;
  }

  function canOpen(id, mode, { source = document.activeElement, cardId = null } = {}) {
    const fromCard = mode === 'book' && source instanceof Element && source.dataset.cardBook === id &&
      $('deckModal').classList.contains('open') && state.activeCardPlaceId === id &&
      Boolean(state.activeCard) && (!cardId || cardId === state.activeCard.id);
    if (fromCard) return true;
    if (journey()?.inspect().running || journey()?.inspect().currentId !== id || sheet.hidden || sheetId !== id) return false;
    if (source instanceof Element && sheet.contains(source)) {
      const action = source.closest('[data-station-action]')?.dataset.stationAction;
      return mode === 'deck' ? action === 'deck' : action === 'book' || action === 'story';
    }
    return false;
  }

  function boardTicket(raw, mode) {
    const id = normalizePlaceId(raw);
    ticket = { id, mode };
    if (!['hn', 'hue', 'hcm'].includes(id)) setPlaceScope('all');
    selectDemoPlace(id);
    if (!journey().start(id)) ticket = null;
  }

  function updateTooltip() {
    tooltipFrame = 0;
    const item = state.hoveredItem;
    const place = pointer && (item?.type === 'demo' || item?.type === 'prov') && CULTURAL_PLACE_MAP[item.id];
    if (suppressedPin && place?.id !== suppressedPin) suppressedPin = null;
    if (place?.id === suppressedPin) { tooltip.hidden = true; return; }
    if (!place || getTopOpenModalElement() || !panel.hidden || !sheet.hidden || isDraggingMain) {
      tooltip.hidden = true;
      return;
    }
    const text = [place.short || place.name, place.highlights?.landmark, place.highlights?.cuisine,
      visited.has(place.id) ? t('visitedBadge') : ''].filter(Boolean).join(' · ');
    if (tooltip.textContent !== text) tooltip.textContent = text;
    tooltip.hidden = false;
    const rect = tooltip.getBoundingClientRect();
    tooltip.style.left = Math.max(8, Math.min(innerWidth - rect.width - 8, pointer.x + 16)) + 'px';
    tooltip.style.top = Math.max(8, Math.min(innerHeight - rect.height - 8, pointer.y + 18)) + 'px';
  }
  // The existing mouse handler uses hitTestCanvasAt and updates state.hoveredItem.
  // This DOM tooltip shares that result; moving it never requests a map repaint.
  window.addEventListener('mousemove', event => {
    if (suppressedPin && (event.target !== canvas || state.hoveredItem?.id !== suppressedPin)) suppressedPin = null;
    pointer = event.target === canvas ? { x: event.clientX, y: event.clientY } : null;
    if (!tooltipFrame) tooltipFrame = requestAnimationFrame(updateTooltip);
  }, { passive: true });

  sheet.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.dataset.arrivalAction === 'close') closeSheet();
    else if (button.dataset.arrivalAction === 'other') openList();
    else if (button.dataset.arrivalAction === 'island' && ISLAND_MAP[sheetId]) window.GoiVietNaturalLandscape.openDetail(sheetId, button);
    else if (button.dataset.stationAction) openPlaceMode(sheetId, button.dataset.stationAction === 'deck' ? 'deck' : 'book', { source: button });
  });
  sheet.addEventListener('animationend', event => { if (event.target === sheet) focusCurrent(); });
  $('provSearchInput').addEventListener('keydown', event => {
    if (event.key !== 'Enter' || event.isComposing) return;
    const first = $('demoPlaceList').querySelector('[data-station-action="select"]');
    if (first) { event.preventDefault(); first.click(); }
  });
  for (const id of ['bookModal', 'deckModal']) {
    const modal = $(id);
    if (modal) new MutationObserver(() => { if (!modal.classList.contains('open')) refresh(); }).observe(modal, { attributes: true, attributeFilter: ['class'] });
  }
  new MutationObserver(refresh).observe($('currentTurnLabel'), { childList: true, characterData: true, subtree: true });
  document.addEventListener('goiviet:langchange', localize);
  window.addEventListener('resize', () => { if (!sheet.hidden) { refresh(); fitSheet(); focusCurrent(); } }, { passive: true });

  window.GoiVietArrivalDemo = Object.freeze({
    selected, refresh, onArrive, openSheet, closeSheet, canOpen, playFromReading, boardTicket, focusRoute, syncList, region, regionKey, stationName: name, turnMessage,
    isSheetOpen: () => !sheet.hidden,
    isArrivalPending: () => Boolean(pendingArrival),
    hasVisited: id => visited.has(id),
    visited: () => [...visited],
    toggleList: () => panel.hidden ? openList() : closeList(true),
    escape() { if (!panel.hidden) { closeList(true); return true; } return closeSheet(); },
    blankMap() { if (revealArrival()) return; if (!closeSheet() && !journey()?.presentation().arrival) journey()?.clear(); },
    routeCleared() { cancelArrival(); closeSheet({ restore: false, announce: false }); ticket = null; },
    nextStation(id) { announceSR(t('next', { place: name(id) })); focusRoute(); updateToast(); },
    resetSession() {
      cancelArrival(); pendingSeals.clear(); knownSeals.clear();
      closeSheet({ restore: false, announce: false });
      closeList(false);
      visited.clear(); visited.add('hn');
      sheetId = renderedId = null; sheetKey = journalKey = '';
      pickedOnce = false; hint.hidden = false; ticket = null;
      refreshJournal();
    },
    inspect: () => ({ sheetId, open: !sheet.hidden, listOpen: !panel.hidden, visited: [...visited], sealed: [...seals()], pendingArrival, pickedOnce, ticket })
  });
  localize();
  syncList();
})();
