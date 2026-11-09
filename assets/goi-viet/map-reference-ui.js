/* Presentation only. Existing handlers, data and map renderer remain unchanged.
   Decorations are applied only on map entry and restored before showing home. */
(() => {
  'use strict';
  const intro = document.getElementById('introScreen');
  const list = document.getElementById('demoPlaceList');
  if (!intro || !list) return;
  const legacyStation = !list.closest('.gv-station-v5');
  const originals = new Map();
  const cardOriginals = new WeakMap();
  const openStories = new Set();
  const paths = {
    star: '<path d="m12 2 3 6.5 7 1-5 5 1.2 7L12 18l-6.2 3.5L7 14.5l-5-5 7-1z" fill="currentColor" stroke="none"/>',
    train: '<path d="M6 3h12v13H6zM8 7h3m2 0h3M8 11h3m2 0h3M8 16l-3 5m11-5 3 5M7 19h10"/><circle cx="9" cy="14" r=".7"/><circle cx="15" cy="14" r=".7"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 7 9-7"/>',
    turn: '<path d="M20 8a8 8 0 0 0-14-3L3 8m0-5v5h5M4 16a8 8 0 0 0 14 3l3-3m0 5v-5h-5"/>',
    all: '<path d="m12 2 4 4-4 4-4-4zm10 10-4 4-4-4 4-4zM12 22l-4-4 4-4 4 4zM2 12l4-4 4 4-4 4z" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>',
    food: '<path d="M3 11h18q-1 8-9 8t-9-8zm6 9h6M15 3l-4 8m8-7-5 7M5 6q-2 2 0 4"/><path d="M3 11h18q-1 8-9 8t-9-8z" fill="currentColor" fill-opacity=".12"/>',
    art: '<path d="M12 3a9 9 0 1 0 0 18h1.2c1.8 0 2.8-2.1 1.7-3.5-.8-1.1-.1-2.5 1.2-2.5H18a3 3 0 0 0 3-3 9 9 0 0 0-9-9Z"/><g fill="currentColor" stroke="none"><circle cx="7" cy="10" r="1.2"/><circle cx="10" cy="7" r="1.2"/><circle cx="14" cy="7" r="1.2"/><circle cx="17" cy="10" r="1.2"/></g>',
    festival: '<path d="M9 3h6M12 1v2M7 5q-5 6 0 12h10q5-6 0-12ZM9 5q-2 6 0 12m6-12q2 6 0 12M12 5v12M9 19h6M12 19v3"/>',
    craft: '<path d="M9 3h6M9 3v4q-5 4-5 8t4 6h8q4-2 4-6t-5-8V3M8 11q4 3 8 0M7 17q5-3 10 0"/>',
    landmark: '<circle cx="17" cy="5" r="2" fill="currentColor" fill-opacity=".18"/><path d="m2 16 6-10 5 8 3-5 6 7M3 19q4-2 8 0t10 0M6 22h12"/>',
    heritage: '<path d="M6 4h12v13H8q-4 0-4 3V7q0-3 2-3zm12 13q-4 0-4 3H4q0 2 3 2h13V7h-2M9 8h6m-6 4h4"/>',
    temple: '<path d="M3 21h18M5 21V10h14v11M3 10h18M6 7h12M8 4h8M12 2v2M8 14v4m4-4v4m4-4v4"/>'
  };
  const icon = (key, className = 'ui-ref-icon') => `<svg class="${className}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[key]}</svg>`;
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const active = () => intro.classList.contains('intro-hidden');
  let applying = false;
  const observer = new MutationObserver(() => { if (active()) apply(); });
  function observeCards() {
    if (legacyStation) observer.observe(list, { childList: true, subtree: true });
  }
  function setFace(node, content) {
    if (!node || originals.has(node)) return;
    originals.set(node, node.innerHTML);
    node.innerHTML = content;
  }
  function decorateControls() {
    setFace(document.querySelector('#mapScene .turn-banner .small-wood-btn'), icon('turn')+'<span>Đổi lượt</span>');
    setFace(document.querySelector('#mapScene .header-actions > .craft-btn-red'), icon('train')+'<span class="ui-ref-ticket-short">Rút vé</span><span class="ui-ref-ticket-full">Rút vé ngẫu nhiên</span>');
    setFace(document.querySelector('#mapScene .header-actions > .craft-btn-green'), icon('mail')+'<span>Bưu Thiếp</span>');
    if (!legacyStation) return;
    setFace(document.getElementById('tabScopeFeatured'), icon('star')+'<span>3 ga khởi đầu</span>');
    const allScope = document.getElementById('tabScopeAll');
    setFace(allScope, allScope?.dataset.scopeLabel ? '<span>'+escape(allScope.dataset.scopeLabel)+'</span>' : '<span>Tất cả 36 ga tỉnh &amp; đảo</span>');
    const topics = {all:'all','Ẩm thực':'food','Nghệ thuật':'art','Lễ hội':'festival','Nghề truyền thống':'craft'};
    document.querySelectorAll('#stationPanel .topic-btn').forEach(button => {
      const text = button.textContent.trim();
      setFace(button, icon(topics[button.dataset.topic] || 'craft')+`<span class="ui-ref-topic-label">${escape(text)}</span>`);
    });
  }
  function decorateCard(card) {
    if (cardOriginals.has(card)) return;
    cardOriginals.set(card, card.innerHTML);
    const id = card.id.replace('placeCard-', '');
    const name = card.querySelector('.place-hero-title').textContent.trim();
    const short = name.replace(/^(Thành phố|Tỉnh)\s+/i, '');
    const island = id === 'hoang-sa' || id === 'truong-sa';
    const board = card.querySelector('.station-board-name');
    board.innerHTML = icon('star')+`<span>${island ? 'HẢI TRÌNH' : 'GA '+escape(short.toLocaleUpperCase('vi-VN'))} <span class="ui-ref-station-note">• ${island ? escape(short) : 'Trạm dừng nghỉ'}</span></span>`;
    const action = card.querySelector('.station-board-action');
    action.innerHTML = `<span class="ui-ref-action-full">${island ? 'Xem hải trình' : 'Đưa tàu vào ga'}</span><span class="ui-ref-action-short">${island ? 'Hải trình' : 'Vào ga'}</span> <span aria-hidden="true">→</span>`;
    action.setAttribute('aria-label', island ? 'Xem hải trình' : 'Đưa tàu vào ga');
    const title = card.querySelector('.place-hero-title');
    title.insertAdjacentHTML('afterbegin', icon('star'));
    card.querySelector('.place-region-pill').insertAdjacentHTML('afterbegin', icon('temple'));
    const hero = card.querySelector('.place-hero-banner');
    if (id === 'hn') {
      hero.classList.add('ui-ref-art-hero');
      hero.insertAdjacentHTML('beforeend','<span class="ui-ref-illustration-label">Minh họa</span>');
    } else {
      const image = hero.querySelector('.place-hero-img');
      if (image) {
        const sync = () => hero.classList.toggle('ui-ref-photo-hero', image.complete && image.naturalWidth > 0);
        image.addEventListener('load', sync); image.addEventListener('error', sync); sync();
      }
    }
    // These represent categories, not a landmark or dish from any one province.
    const highlights = ['landmark','heritage','food'];
    card.querySelectorAll('.highlight-chip-box').forEach((box, i) => box.insertAdjacentHTML('beforeend', icon(highlights[i], 'ui-ref-highlight-art ui-ref-highlight-symbol')));
    const draw = card.querySelector('.quick-deck-btn > span:first-child');
    draw.innerHTML = icon('star')+`<span>Rút thẻ bài <span class="ui-ref-deck-station">• ${island ? escape(short) : 'Ga '+escape(short)}</span></span>`;
    const oldStories = card.querySelector('.place-stories');
    const details = document.createElement('details');
    details.className = 'place-stories ui-ref-story-drawer';
    details.dataset.place = id;
    const summary = document.createElement('summary'); summary.className = 'stories-header-row';
    const heading = oldStories.querySelector('h3'); summary.appendChild(heading);
    summary.insertAdjacentHTML('beforeend', '<span class="ui-ref-story-toggle"><span class="ui-ref-story-open-copy">Nhấp để đọc</span><span class="ui-ref-story-close-copy">Thu gọn</span><span aria-hidden="true"> →</span></span>');
    details.appendChild(summary);
    const items = document.createElement('div'); items.className = 'ui-ref-story-items';
    [...oldStories.querySelectorAll('.story-item-btn')].forEach(button => items.appendChild(button));
    details.appendChild(items); details.open = openStories.has(id);
    details.addEventListener('toggle', () => {
      if (!active() || !details.isConnected) return;
      if (details.open) openStories.add(id); else openStories.delete(id);
    });
    oldStories.replaceWith(details);
  }
  function apply() {
    if (applying || !active()) return;
    applying = true; observer.disconnect();
    try {
      decorateControls();
      if (legacyStation) list.querySelectorAll('.place-card.selected').forEach(decorateCard);
    } finally {
      applying = false;
      observeCards();
    }
  }
  function restore() {
    observer.disconnect();
    originals.forEach((html,node) => { if (node.isConnected) node.innerHTML = html; }); originals.clear();
    if (!legacyStation) return;
    list.querySelectorAll('.place-card.selected').forEach(card => {
      const html = cardOriginals.get(card); if (html === undefined) return;
      card.innerHTML = html; cardOriginals.delete(card);
    });
    observeCards();
  }
  new MutationObserver(() => { if (active()) apply(); else restore(); }).observe(intro,{attributes:true,attributeFilter:['class']});
  observeCards();
  if (active()) apply();
})();
