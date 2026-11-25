/* P5-06 (2026-11-19): conversation-card covers rebuilt from the group's Canva design.
   The 15 decks below have a Canva cover. Their eight photos are the group's own uploads, cropped to the frame
   boxes (assets/goi-viet/card-covers-5/<deck>/<frame>.webp); the frames, paper and words are drawn here, so the
   label follows each card (Địa danh, Văn hóa, Nét đẹp, Món ăn) and the VI/EN choice. Other decks keep the
   plain red card. Sources of the photos: assets/goi-viet/card-covers-5/SOURCES.md. */
(function () {
  'use strict';
  const BASE = 'assets/goi-viet/card-covers-5/';
  const NS = 'http://www.w3.org/2000/svg';
  // [frame, box on the 630 x 880 card, size of the outline's own coordinate space, outline] from the Canva template.
  const FRAMES = [
    ['tl',[0,46.6,144.7,154.6],[248,265],'M0,0L248,0L248,265L0,265L0,0Z'],
    ['tc',[158.7,46.6,331.9,237.4],[569,407],'M0,0L0,203.49C0,315.43 0.23,407 0.51,407C0.78,407 8.1,405.23 16.75,403.05C25.42,400.88 52.31,393.49 76.51,386.62C100.7,379.75 130.63,371.61 143,368.5C155.37,365.39 174.95,360.9 186.51,358.5C198.06,356.11 216.72,352.54 228,350.58C239.28,348.62 258.63,345.66 271,343.99C283.37,342.34 302.72,340.08 314,339C325.28,337.91 346.2,336.33 360.51,335.51C374.67,334.68 400.39,334 418,334C418.17,334 418.34,334 418.51,334C436.11,334 461.3,334.68 474.51,335.51C487.71,336.32 505.71,337.68 514.51,338.52C523.3,339.36 538.38,341.17 548,342.53C557.62,343.89 566.29,345 567.25,345C568.9,344.99 569,336.11 569,172.48L569,0Z'],
    ['tr',[505.2,46.6,124.8,346.5],[214,594],'M0,0L0,351.54C15.12,367.82 23.59,377.48 28.57,383.51C33.56,389.56 40.86,398.9 44.81,404.26C48.77,409.62 55.42,419.3 59.62,425.75C63.81,432.22 70.05,442.46 73.49,448.5C76.92,454.55 82.66,465.35 86.25,472.5C89.84,479.66 95.36,491.81 98.52,499.5C101.67,507.21 106.25,519.35 108.71,526.5C111.16,533.66 114.86,545.58 116.92,553.01C118.98,560.44 121.99,572.7 123.59,580.26L126.51,594L214,594L214,0Z'],
    ['ml',[0,215.2,144.7,365.7],[248,627],'M0,0L0,627L148,627C136.17,606.47 129.83,594.43 126.27,587C122.72,579.57 117.31,567.43 114.27,560C111.22,552.57 107.19,542 105.32,536.49C103.44,531 100.11,520.2 97.91,512.49C95.71,504.8 92.56,492.2 90.91,484.49C89.27,476.8 87.02,464.88 85.91,458C84.8,451.12 83.22,438.29 82.36,429.49C81.41,419.62 80.81,403.16 80.81,386.49C80.81,369.42 81.37,353.8 82.34,344C83.19,335.48 84.83,322.43 85.99,315C87.15,307.57 89.44,295.43 91.1,288C92.76,280.57 95.65,268.99 97.55,262.25C99.44,255.5 102.96,244.26 105.36,237.25C107.76,230.24 112.32,218.2 115.47,210.49C118.63,202.8 124.15,190.65 127.74,183.49C131.33,176.34 137.19,165.32 140.79,159C144.38,152.68 148.47,145.81 149.9,143.76C152.41,140.13 152.77,139.99 160.99,138.96C165.67,138.37 180.3,136.09 193.5,133.89C206.69,131.7 224.37,128.46 232.75,126.7L248,123.5L248,0Z'],
    ['mr',[443.9,407.1,186.1,299.8],[319,514],'M234.89,0L235.41,3.25C235.7,5.04 236.45,12.12 237.09,19C237.73,25.88 238.22,43.43 238.21,58C238.18,73.93 237.56,90.88 236.64,100.49C235.79,109.29 234.2,122.12 233.09,129C231.98,135.88 229.73,147.8 228.09,155.49C226.44,163.2 223.29,175.8 221.09,183.49C218.89,191.2 215.56,202 213.68,207.49C211.81,213 207.79,223.57 204.76,231C201.72,238.43 195.83,251.48 191.67,260C187.51,268.52 182.79,277.75 181.19,280.49L178.27,285.49C152.87,289.89 135.15,293.34 122.51,296.01C109.86,298.68 89.6,303.36 77.51,306.4C65.4,309.45 43.12,315.49 28,319.83L0.51,327.71L0,514L319,514L319,0Z'],
    ['bl',[0,595.6,205.9,238.6],[353,409],'M0,0L0,409L353,409L353,49.49C332.46,47.45 318.4,45.76 308.51,44.4C298.6,43.04 281.72,40.35 271,38.41C260.28,36.46 244.08,33.12 235,30.97C225.92,28.81 212.2,25.22 204.51,23C196.8,20.77 186.95,17.73 182.6,16.23C175.05,13.63 174.45,13.19 169.6,6.75L164.52,0Z'],
    ['bc',[220.5,602.6,208.8,231.5],[358,396.853],'M357.25,0C356.84,0.08 346.37,2.73 334,5.91C321.63,9.07 301.6,13.72 289.51,16.24C277.4,18.76 258.51,22.39 247.51,24.28C236.51,26.19 217.38,29.11 205,30.79C192.63,32.46 173.05,34.72 161.51,35.8C149.95,36.88 132.18,38.33 122,39.03C111.64,39.74 84.13,40.31 59.51,40.32C59.02,40.32 58.54,40.32 58.05,40.32C34.38,40.32 11.93,40 7.75,39.6L0,38.85L0,396.85L358,396.85C358,89.31 357.67,0 357.25,0Z'],
    ['br',[443.9,721.6,186.1,112.6],[239.25,144.75],'M0,144.75L239.25,144.75L239.25,0L0,0L0,144.75Z'],
  ];
  // Per deck: the place printed on the cover, an optional kicker (i18n key) and frames that differ from the template.
  const COVERS = {
    hn: { place: 'Hà Nội' },
    th: { place: 'Thanh Hóa', frames: { br: [[443.9, 714.9, 186.1, 119.3], [239.25, 153.375], 'M0,153.375L239.25,153.375L239.25,0L0,0L0,153.375Z'] } },
    hcm: { place: 'Hồ Chí Minh' },
    dn: { place: 'Đà Nẵng' },
    hue: { place: 'Huế' },
    ct: { place: 'Cần Thơ' },
    bn: { place: 'Bắc Ninh', kicker: 'cover.kickerQuanHo' },
    ag: { place: 'An Giang' },
    dl: { place: 'Đắk Lắk' },
    nb: { place: 'Ninh Bình' },
    pt: { place: 'Phú Thọ' },
    qng: { place: 'Quảng Ngãi' },
    qn: { place: 'Quảng Ninh' },
    qt: { place: 'Quảng Trị' },
    sl: { place: 'Sơn La' },
  };
  const T = key => (window.GoiVietI18n ? window.GoiVietI18n.t(key) : key);
  const has = id => Object.prototype.hasOwnProperty.call(COVERS, id);
  const el = (tag, attrs, parent) => {
    const node = document.createElementNS(NS, tag);
    for (const name in attrs) node.setAttribute(name, attrs[name]);
    if (parent) parent.append(node);
    return node;
  };
  let defs = null;

  // One <symbol> per deck, built the first time its deck opens and shared by its four cards.
  function artFor(id) {
    const symbolId = 'gvCoverArt-' + id;
    if (document.getElementById(symbolId)) return symbolId;
    if (!defs) {
      const holder = el('svg', { 'aria-hidden': 'true', focusable: 'false', class: 'gv-cover-defs' });
      defs = el('defs', {}, holder);
      document.body.append(holder);
    }
    const symbol = el('symbol', { id: symbolId, viewBox: '0 0 630 880' }, defs);
    FRAMES.forEach(([frame, box, size, outline]) => {
      const own = (COVERS[id].frames || {})[frame];
      const [[x, y, w, h], [vw, vh], d] = own || [box, size, outline];
      const clipId = own ? `gvCoverClip-${id}-${frame}` : `gvCoverClip-${frame}`;
      const transform = `translate(${x} ${y}) scale(${w / vw} ${h / vh})`;
      if (!document.getElementById(clipId)) el('path', { d, transform }, el('clipPath', { id: clipId, clipPathUnits: 'userSpaceOnUse' }, defs));
      el('image', { href: `${BASE}${id}/${frame}.webp`, x, y, width: w, height: h, preserveAspectRatio: 'none', 'clip-path': `url(#${clipId})` }, symbol);
      el('path', { d, transform, class: 'gv-cover-line' }, symbol);
    });
    return symbolId;
  }

  function text(className, value) {
    const span = document.createElement('span');
    span.className = className;
    span.textContent = value;
    return span;
  }

  // A deck's cover for one label, as a decorative element (aria-hidden): used on the fan cards and on the face of a
  // drawn Canva card (card-canva-5.js).
  function art(place, label) {
    if (!place || !has(place.id)) return null;
    const cover = COVERS[place.id];
    const wrap = document.createElement('span');
    wrap.className = 'gv-cover';
    wrap.setAttribute('aria-hidden', 'true');
    const stage = document.createElement('span');
    stage.className = 'gv-cover-stage';
    const art = el('svg', { class: 'gv-cover-art', viewBox: '0 0 630 880', focusable: 'false' });
    el('use', { href: '#' + artFor(place.id) }, art);
    const labelEl = text('gv-cover-label', label);
    // Long labels (EN "Local charm", "Landmarks") are set a little smaller so they stay inside the red centre.
    labelEl.style.setProperty('--fit', Math.min(1, 8 / Math.max(8, [...label].length)).toFixed(3));
    const placeEl = text('gv-cover-place', cover.place);
    placeEl.style.setProperty('--fit', Math.min(1, 9 / Math.max(9, [...cover.place].length)).toFixed(3));
    stage.append(art, text('gv-cover-kicker', T(cover.kicker || 'cover.kicker')), labelEl, placeEl, text('gv-cover-quote', T('cover.quote')));
    wrap.append(stage);
    return wrap;
  }

  // Preview-5 uses the topic as the large title, including on decks with a plain cover.
  function decorate(button, place, label, topic) {
    button.querySelector('.conversation-card-title').textContent = label;
    if (topic === 'Nét đẹp') button.querySelector('.conversation-card-emblem').textContent = '🌾';
    const wrap = art(place, label);
    if (!wrap) return false;
    button.classList.add('has-canva-cover');
    button.prepend(wrap);
    return true;
  }

  // Fetch a deck's eight photos as soon as its "open deck" button is pointed at or focused, so the covers are
  // complete when the fan appears (about 80 KB per deck; nothing is fetched for decks the player never opens).
  const warmed = new Set();
  function prefetch(id) {
    if (!has(id) || warmed.has(id)) return;
    warmed.add(id);
    FRAMES.forEach(([frame]) => { const image = new Image(); image.decoding = 'async'; image.src = `${BASE}${id}/${frame}.webp`; });
  }
  const warm = event => {
    const opener = event.target && event.target.closest && event.target.closest('[id^="deck-open-"]');
    if (opener) prefetch(opener.id.slice('deck-open-'.length));
  };
  document.addEventListener('pointerover', warm, { passive: true });
  document.addEventListener('focusin', warm);

  window.GoiVietCardCovers = { has, art, decorate, prefetch, decks: Object.keys(COVERS) };
})();
