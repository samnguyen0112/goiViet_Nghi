/* Preview-5 station components. The map, journey, cards and reader own their respective state. */
(() => {
  'use strict';

  const panel = document.getElementById('stationPanel');
  const list = document.getElementById('demoPlaceList');
  const search = document.getElementById('provSearchInput');
  const clear = document.getElementById('stationSearchClear');
  const i18n = window.GoiVietI18n;
  const labels = {
    title: ['Các ga di sản', 'Heritage stations'],
    subtitle: ['Mỗi điểm dừng, một miền thương nhớ.', 'Every stop holds a memory.'],
    collapse: ['Thu gọn', 'Collapse'],
    expand: ['Mở danh sách ga', 'Show stations'],
    scope: ['Chọn danh sách nhà ga', 'Choose station list'],
    featured: ['3 ga khởi đầu', '3 starting stations'],
    allStations: ['Tất cả 36 ga', 'All 36 stations'],
    allStationAreas: ['34 tỉnh thành · 2 quần đảo', '34 provinces · 2 archipelagos'],
    searchLabel: ['Tìm ga, danh thắng hoặc món ăn', 'Find a station, landmark or dish'],
    searchHint: ['Tìm ga, danh thắng, món ăn…', 'Find a station, landmark, dish…'],
    clear: ['Xóa tìm kiếm', 'Clear search'],
    results: ['Thẻ thông tin các ga và hành trình', 'Stations and journey details'],
    otherStations: ['Ghé thêm một ga', 'Visit another station'],
    searchResults: ['Kết quả tìm kiếm', 'Search results'],
    chooseStation: ['Chọn ga để bắt đầu', 'Choose a station to begin'],
    chooseStationHint: ['Chọn một điểm trên bản đồ hoặc trong danh sách bên dưới.', 'Pick a stop on the map or from the list below.'],
    selected: ['Ga đang chọn', 'Selected station'],
    selectedIsland: ['Hải trình đang chọn', 'Selected island route'],
    enter: ['Vào ga', 'Depart'],
    islandRoute: ['Hải trình', 'Set sail'],
    explore: ['Khám phá', 'Explore'],
    arrive: ['Đến ngay', 'Go to station'],
    landmarks: ['Danh thắng', 'Landmark'],
    heritage: ['Di sản', 'Heritage'],
    flavor: ['Hương vị', 'Local flavor'],
    highlights: ['Điểm nhấn văn hóa', 'Cultural highlights'],
    illustration: ['Minh họa', 'Illustration'],
    hero: ['Mở câu chuyện tại {place}', 'Open a story from {place}'],
    cards: ['Chơi thẻ', 'Play cards'],
    remaining: ['Còn {count} lá', '{count} cards left'],
    lastCard: ['Còn 1 lá', '1 card left'],
    noCards: ['Đã rút hết', 'All cards drawn'],
    book: ['Đọc sách', 'Read book'],
    bookReady: ['Sách văn hóa', 'Culture book'],
    stories: ['Câu chuyện văn hóa', 'Cultural stories'],
    read: ['Đọc', 'Read'],
    reread: ['Đọc lại', 'Read again'],
    shared: ['Đã chia sẻ', 'Shared'],
    opened: ['Đã mở chuyện', 'Story opened'],
    verified: ['Điểm mẫu có nguồn', 'Sourced example'],
    demo: ['Nội dung demo', 'Demo content'],
    journal: ['Sổ hành trình', 'Journey journal'],
    journalHint: ['Ga đã ghé, kỷ niệm và bưu thiếp', 'Stops, memories and postcards'],
    visited: ['Ga đã ghé', 'Visited stations'],
    visitedEmpty: ['Mở một câu chuyện để lưu ga đầu tiên.', 'Open a story to record your first stop.'],
    memories: ['Kỷ niệm đã lưu', 'Saved memories'],
    memoriesEmpty: ['Cả nhà có thể ghi kỷ niệm khi chơi thẻ.', 'Save a family memory while playing cards.'],
    visit: ['Tới ga', 'Go to station'],
    postcard: ['Mở bưu thiếp', 'Open postcard'],
    noResults: ['Chưa tìm thấy ga phù hợp', 'No matching stations'],
    noResultsHint: ['Thử tên ga, danh thắng hoặc món ăn khác.', 'Try another station name, landmark or dish.']
  };
  const dict = { vi: {}, en: {} };
  for (const [key, [vi, en]] of Object.entries(labels)) {
    dict.vi['station.' + key] = vi;
    dict.en['station.' + key] = en;
  }
  i18n.add(dict);
  const t = (key, vars) => i18n.t('station.' + key, vars);
  const icon = name => `<svg class="gv-station-icon" aria-hidden="true" focusable="false"><use href="#gv-station-${name}"/></svg>`;

  const hanoiArt = 'assets/goi-viet/map-surroundings-preview/station-hanoi-5.webp';
  const localArt = {
    hn: hanoiArt,
    hue: 'assets/goi-viet/map-surroundings-preview/landmarks/hue.svg',
    hcm: 'assets/goi-viet/map-surroundings-preview/landmarks/saigon.svg'
  };

  function statusLabel(place, progress) {
    if (progress.activityCompleted) return t('shared');
    if (progress.storyOpened) return t('opened');
    return t(place.isVerifiedSample ? 'verified' : 'demo');
  }

  function renderCompactStation(place, highlights, progress, island) {
    const source = localArt[place.id];
    return `
      <div class="place-card gv-station-compact" id="placeCard-${place.id}">
        <button type="button" class="place-compact-row" id="station-pick-${place.id}" data-station-action="select" data-place="${place.id}">
          <span class="gv-station-thumb" aria-hidden="true">
            ${source ? `<img src="${source}" alt="" loading="lazy" decoding="async">` : icon(island ? 'ship' : 'train')}
          </span>
          <span class="gv-station-compact-copy">
            <strong>${escapeHTML(place.name)}</strong>
            <small>${escapeHTML(highlights.landmark)} · ${escapeHTML(highlights.cuisine)}</small>
          </span>
          <span class="gv-station-compact-end">
            <span class="gv-station-badge${progress.storyOpened || progress.activityCompleted ? ' is-explored' : ''}">${statusLabel(place, progress)}</span>
            ${icon('chevron')}
          </span>
        </button>
      </div>`;
  }

  function renderStationList(stations, { searching, hasSelection, featured }) {
    if (!stations.length) return '';
    let heading = featured ? t('featured') : t('allStations');
    if (hasSelection) heading = t('otherStations');
    if (searching) heading = t('searchResults');
    const prompt = !searching && !hasSelection ? `
      <div class="gv-station-welcome">
        <span class="gv-station-welcome-mark">${icon('train')}</span>
        <div><h3>${t('chooseStation')}</h3><p>${t('chooseStationHint')}</p></div>
      </div>` : '';
    return `
      ${prompt}
      <section class="gv-station-other" aria-labelledby="stationOtherTitle">
        <h3 id="stationOtherTitle">${heading}</h3>
        <div class="gv-station-other-items">${stations.join('')}</div>
      </section>`;
  }

  function renderStationArt(place, highlights, firstStoryId, island) {
    const fallback = localArt[place.id];
    const source = place.id === 'hn' ? null : getStorySafeUrl(place.photoUrl);
    return `
      <button type="button" id="story-hero-${place.id}" class="gv-station-art" data-station-action="story"
        data-place="${place.id}" data-story="${firstStoryId}" aria-label="${escapeHTML(t('hero', { place: place.name }))}"
        title="${escapeHTML(place.photoTitle || highlights.landmark)}">
        <span class="gv-station-art-fallback" aria-hidden="true">
          ${fallback ? `<img src="${fallback}" alt="" loading="lazy" decoding="async">` : icon(island ? 'ship' : 'landmark')}
        </span>
        ${source ? `<img class="gv-station-art-photo" src="${escapeHTML(source)}" alt="" loading="lazy" decoding="async">` : ''}
        ${place.id === 'hn' ? `<span class="gv-station-art-label" aria-hidden="true">${t('illustration')}</span>` : ''}
        <span class="gv-station-art-cue">${icon('explore')}</span>
      </button>`;
  }

  function renderHighlights(highlights) {
    const rows = [
      ['landmark', 'landmarks', highlights.landmark],
      ['heritage', 'heritage', highlights.heritage],
      ['food', 'flavor', highlights.cuisine]
    ];
    return `<dl class="gv-station-highlights" aria-label="${t('highlights')}">
      ${rows.map(([symbol, key, value]) => `
        <div><dt>${icon(symbol)}<span>${t(key)}</span></dt><dd>${escapeHTML(value)}</dd></div>`).join('')}
    </dl>`;
  }

  function renderModes(place, remaining) {
    const reader = window.GoiVietBooks;
    let bookStatus = i18n.t('book.soon.title');
    if (reader?.canRead(place.id)) {
      bookStatus = reader.statusOf(place.id) === 'published' ? t('bookReady') : i18n.t('book.draft');
    }
    let deckStatus = t('noCards');
    if (remaining === 1) deckStatus = t('lastCard');
    else if (remaining > 1) deckStatus = t('remaining', { count: remaining });
    return `
      <div class="gv-station-modes">
        <button type="button" id="deck-open-${place.id}" class="gv-station-mode gv-station-play" data-station-action="deck" data-place="${place.id}">
          ${icon('cards')}<span><strong>${t('cards')}</strong><small>${deckStatus}</small></span>
        </button>
        <button type="button" id="book-open-${place.id}" class="gv-station-mode gv-station-read" data-station-action="book" data-place="${place.id}">
          ${icon('book')}<span><strong>${t('book')}</strong><small>${bookStatus}</small></span>
        </button>
      </div>`;
  }

  function renderStories(place, stories, opened) {
    return `
      <details class="gv-station-stories" data-place="${place.id}">
        <summary id="station-stories-${place.id}"><span>${t('stories')}</span><span class="gv-station-story-count">${stories.length}</span>${icon('chevron')}</summary>
        <div class="gv-station-story-items">
          <div class="gv-station-story-context">
            <p>${escapeHTML(place.tagline || place.summary)}</p>
          </div>
          ${stories.map((story, index) => {
            const wasRead = opened.includes(story.id);
            return `<button type="button" id="story-open-${story.id}" class="story-item-btn gv-station-story" data-station-action="story"
              data-place="${place.id}" data-story="${story.id}">
              <span class="gv-station-story-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
              <strong>${escapeHTML(getStoryReadingPresentation(story).title)}</strong>
              <span class="gv-station-story-link">${t(wasRead ? 'reread' : 'read')}${icon('chevron')}</span>
            </button>`;
          }).join('')}
        </div>
      </details>`;
  }

  function renderSelectedStation({ place, highlights, stories, remaining, opened, island }) {
    const name = place.name.replace(/^(Thành phố|Tỉnh|TP\.)\s+/i, '');
    const ready = t(island ? 'islandRoute' : 'enter');
    return `
      <div class="place-card selected gv-station-selected" id="placeCard-${place.id}">
        <section class="gv-station-sheet" aria-labelledby="station-title-${place.id}">
          ${renderStationArt(place, highlights, stories[0].id, island)}
          <div class="gv-station-identity">
            <div>
              <span class="gv-station-kicker">${t(island ? 'selectedIsland' : 'selected')}</span>
              <h3 id="station-title-${place.id}" tabindex="-1" title="${escapeHTML(place.name)}">${escapeHTML(name)}</h3>
            </div>
            <button type="button" class="station-board-action" id="station-journey-${place.id}" data-station-action="journey"
              data-place="${place.id}" data-story="${stories[0].id}" data-ready-label="${ready}" data-explore-label="${t('explore')}" data-arrive-label="${t('arrive')}">
              ${icon(island ? 'ship' : 'train')}<span data-journey-label>${ready}</span>
            </button>
          </div>
          <p class="journey-preview-note" role="status" hidden></p>
          ${renderHighlights(highlights)}
        </section>
        ${renderModes(place, remaining)}
        ${renderStories(place, stories, opened)}
      </div>`;
  }

  const openDrawers = new Set();
  let lastMarkup;

  function update(markup) {
    clear.hidden = !search.value;
    const nextMarkup = markup || `
      <div class="gv-station-empty">
        ${icon('search')}<strong>${t('noResults')}</strong><p>${t('noResultsHint')}</p>
      </div>`;
    if (lastMarkup === nextMarkup) return;
    const drawer = list.querySelector('.gv-station-stories');
    if (drawer) {
      if (drawer.open) openDrawers.add(drawer.dataset.place);
      else openDrawers.delete(drawer.dataset.place);
    }
    const active = document.activeElement;
    const keepFocus = list.contains(active);
    list.innerHTML = nextMarkup;
    lastMarkup = nextMarkup;
    const newDrawer = list.querySelector('.gv-station-stories');
    if (newDrawer) newDrawer.open = openDrawers.has(newDrawer.dataset.place);
    if (keepFocus) {
      const target = document.getElementById(active.id) || list.querySelector('.gv-station-identity h3');
      (target || list.closest('.preview-panel-scroll')).focus({ preventScroll: true });
    }
  }

  function localize() {
    const elements = [panel, document.getElementById('previewPanelOpen')];
    for (const element of elements) {
      element.querySelectorAll('[data-station-text]').forEach(node => { node.textContent = t(node.dataset.stationText); });
      element.querySelectorAll('[data-station-label]').forEach(node => { node.setAttribute('aria-label', t(node.dataset.stationLabel)); });
      element.querySelectorAll('[data-station-placeholder]').forEach(node => { node.placeholder = t(node.dataset.stationPlaceholder); });
    }
  }

  clear.addEventListener('click', () => {
    search.value = '';
    onSearchProvinceInput('');
    search.focus();
  });
  list.addEventListener('click', event => {
    const button = event.target.closest('button[data-station-action]');
    if (!button || button.disabled) return;
    const { place, story, stationAction, journeyAction } = button.dataset;
    if (stationAction === 'select') selectDemoPlace(place);
    else if (stationAction === 'story' || (stationAction === 'journey' && journeyAction === 'explore')) openStoryModal(place, story, button);
    else if (stationAction === 'journey') {
      if (window.GoiVietJourneyPreview) window.GoiVietJourneyPreview.start(place);
      else selectDemoPlace(place);
    } else if (stationAction === 'deck') openDeckModal(place, button);
    else if (stationAction === 'book') window.GoiVietBooks?.open(place, { source: button });
  });
  list.addEventListener('error', event => {
    if (event.target instanceof HTMLImageElement) event.target.hidden = true;
  }, true);
  document.addEventListener('goiviet:langchange', () => {
    localize();
    renderDemoPlaceList();
  });
  document.addEventListener('DOMContentLoaded', () => renderDemoPlaceList(), { once: true });

  if (i18n.lang() !== 'vi') localize();
  window.GoiVietStationPanel = Object.freeze({
    renderCompactStation,
    renderStationList,
    renderSelectedStation,
    clearSelection() {
      if (!state.selectedPlaceId) return;
      state.selectedPlaceId = null;
      renderDemoPlaceList();
    },
    visitLabel: () => t('visit'),
    update
  });
})();
