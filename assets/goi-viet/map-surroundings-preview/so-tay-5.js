/* P5-07 (2026-11-26, v2 2026-11-27): Sổ tay hành khách, the passenger handbook between the memory chapter and the map
   (preview-5 only). #memoryOpenGuide at the end of the memory chapter opens it. "Lên tàu" and "Vào thẳng bản đồ" take
   the chapter's own way into the map (GoiVietMemoryChapter.enterMap: curtain, then map-prewarm-5 holds it until the map
   is ready). While the handbook is open the home screen stays open underneath (only hidden from view), so the map keeps
   being prepared.
   Each stop has one instruction column (a short list of things to do, ticked as they are done, the next one ringed in
   gold on the stage) and one large stage that practises the real flow with the page's own data and words: a map drawn
   from DATA and the map's own regional geography, rivers and landmark art (34 provinces, Hoàng Sa, Trường Sa, the
   neighbours, the North–South railway and the three sample stations with their boards), the station's four cards
   (Canva covers, real questions, answers and activities), the lotus seal, a practice postcard, then the map's buttons.
   Nothing here writes to the journey, the deck, the memories, the progress or the browser's storage.
   Text: sotay.* in i18n-ui-5.js and the page's own keys. Styles: so-tay-5.css. */
(() => {
  'use strict';
  const dialog = document.getElementById('soTayDialog');
  const intro = document.getElementById('introScreen');
  const opener = document.getElementById('memoryOpenGuide');
  if (!dialog || !intro || !opener) return;
  const SCRIPT_URL = (document.currentScript && document.currentScript.src) || location.href;
  // The same file and version preview-5.js loads for the map, so the browser and the offline copy share one entry.
  const GEO_URL = new URL('regional-geometry.js?v=seamless-20261015', SCRIPT_URL).href;

  const I = window.GoiVietI18n;
  const T = (key, vars) => (I ? I.t(key, vars) : key);
  const $ = (sel, root = dialog) => root.querySelector(sel);
  const $$ = (sel, root = dialog) => Array.from(root.querySelectorAll(sel));
  const NS = 'http://www.w3.org/2000/svg';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const motion = () => !reduced.matches && !document.body.classList.contains('reduced-motion');
  const STATIONS = ['hn', 'hue', 'hcm'];
  const NAMES = { hn: 'Hà Nội', hue: 'Huế', hcm: 'TP.HCM' };
  const LAST = 4;
  // North–South railway towns (lon, lat), from Hà Nội to Sài Gòn; the ends and Huế snap to the station points.
  const RAIL = [[105.84, 21.02], [105.91, 20.54], [105.97, 20.25], [105.78, 19.81], [105.68, 18.68], [106.24, 18.05],
    [106.6, 17.47], [107.1, 16.82], [107.58, 16.46], [108.2, 16.05], [108.48, 15.57], [108.8, 15.12], [109.13, 13.8],
    [109.3, 13.09], [109.18, 12.25], [108.95, 11.6], [108.0, 10.98], [106.82, 10.95], [106.68, 10.78]];
  const RAIL_STATION = { hn: 0, hue: 8, hcm: RAIL.length - 1 };
  const MAP_LABELS = { hs: 'sotay.map.hs', ts: 'sotay.map.ts' };
  const COUNTRY_LABELS = { laos: 'sotay.map.laos', cambodia: 'sotay.map.cambodia', thailand: 'sotay.map.thailand' };
  // Laos's own anchor sits on the narrow strip by the Vietnamese border; its label goes to the north of the country.
  const COUNTRY_AT = { laos: [102.6, 19.7] };
  const STOP_NUMBERS = ['sotay.step.1', 'sotay.step.2', 'sotay.step.3', 'sotay.step.4', 'sotay.step.5'];
  // Landmark art of the map (landmark-assets.js) beside each station, and the red-sailed boat: world box [x, y, w, h]
  // relative to the station point (or absolute for the boat).
  const ART = { hn: [16, -86, 54, 72], hue: [-126, -74, 110, 66], hcm: [-104, -82, 84, 70] };
  const BOAT = [628, 236, 78, 80];

  const timers = new Set();
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); return id; };
  const clearTimers = () => { timers.forEach(clearTimeout); timers.clear(); };
  const restart = (el, className) => { if (!el || !motion()) return; el.classList.remove(className); void el.offsetWidth; el.classList.add(className); };

  const S = {
    open: false, step: 0, tried: [false, false, false, false], trigger: null, saved: [], boarding: false, built: false,
    picked: null, at: null, travelling: false, place: 'hn', fanPlace: null, drawing: false, boardCards: false,
    cardIdx: null, answer: null, eliminated: null, revealed: false, asDontKnow: false, toSeal: false,
    unsealed: false, actIdx: 0, finished: null, timerEnd: 0, timerId: 0, saves: 0, memory: null,
    rideRaf: 0, tour: 0, vb: null, content: null, railLen: 0, stationLen: {}, stationAt: {}, mapPaths: '',
    trainPt: null, fitRaf: 0, geo: null, geoPromise: null, rivers: false, targetKey: '',
    say: [], sayId: 0, boardFail: 0
  };

  // ---------------------------------------------------------------- data from the page
  const deckOf = id => (typeof ALL_DECKS_MAP !== 'undefined' && ALL_DECKS_MAP && ALL_DECKS_MAP[id]) || null;
  const geoData = () => (typeof DATA !== 'undefined' && DATA && Array.isArray(DATA.provinces34) ? DATA : null);
  // The station names exactly as the map's quick-start chips print them (they follow the language).
  const placeName = id => {
    const chip = document.querySelector(`#arrivalStartHint [data-arrival-pick="${id}"]`);
    return (chip && chip.textContent.trim()) || NAMES[id] || id;
  };
  const label = (prefix, vi) => {
    if (!vi) return '';
    const key = prefix + '.' + vi, value = T(key);
    return value === key ? vi : value;
  };
  const currentCard = () => { const deck = deckOf(S.place); return deck && Array.isArray(deck.cards) ? deck.cards[S.cardIdx == null ? 0 : S.cardIdx] || deck.cards[0] : null; };
  const canva = card => Boolean(card && window.GoiVietCanvaCards && window.GoiVietCanvaCards.has(card));
  const letter = i => String.fromCharCode(65 + i);

  // ---------------------------------------------------------------- announcements
  const status = document.getElementById('soTayStatus');
  function announce(text) {
    if (!text || !status) return;
    S.say.push(text);
    clearTimeout(S.sayId);
    S.sayId = setTimeout(() => {
      const message = S.say.join(' ');
      S.say = [];
      status.textContent = '';
      requestAnimationFrame(() => { status.textContent = message; });
    }, 80);
  }

  // ---------------------------------------------------------------- the map (stop 1)
  const svgEl = (tag, attrs, parent) => {
    const node = document.createElementNS(NS, tag);
    for (const name in attrs) node.setAttribute(name, attrs[name]);
    if (parent) parent.append(node);
    return node;
  };
  const f1 = v => (+v).toFixed(1);
  const ringPath = rings => rings.filter(r => r && r.length > 2).map(r => 'M' + r.map(p => f1(p[0]) + ',' + f1(p[1])).join('L') + 'Z').join('');
  // Drops points closer than `step` world units to the last kept one (the map is drawn far smaller than the source).
  const thin = (points, step) => {
    const out = [];
    let lx = Infinity, ly = Infinity;
    points.forEach((p, i) => {
      if (i === points.length - 1 || Math.abs(p[0] - lx) + Math.abs(p[1] - ly) >= step) { out.push(p); lx = p[0]; ly = p[1]; }
    });
    return out;
  };
  const boxOf = points => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of points) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }
    return [x0, y0, x1, y1];
  };
  const meets = (b, e) => !(b[2] < e[0] || b[0] > e[2] || b[3] < e[1] || b[1] > e[3]);
  const toWorld = (lon, lat) => (typeof lonLatToWorld === 'function' ? lonLatToWorld(lon, lat) : [(lon - 101.5) * 60, (23.8 - lat) * 62.5]);
  // A smooth curve through every point (Catmull-Rom as cubic Béziers): the move, then one segment per pair of points.
  function smoothSegments(points) {
    const parts = [`M${f1(points[0][0])},${f1(points[0][1])}`];
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i], p1 = points[i], p2 = points[i + 1], p3 = points[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      parts.push(`C${f1(c1[0])},${f1(c1[1])} ${f1(c2[0])},${f1(c2[1])} ${f1(p2[0])},${f1(p2[1])}`);
    }
    return parts;
  }
  const stationPoint = (D, id) => {
    const p = D.provinces34.find(q => q.id === id);
    return p && (p.adminPt || p.center);
  };
  const artUrl = id => {
    const art = window.GoiVietRegionalArt && window.GoiVietRegionalArt[id];
    return art ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(art) : '';
  };

  function buildMap() {
    const D = geoData();
    const svg = $('.st-map');
    if (!D || !svg) { $('.st-stage-map').classList.add('is-nomap'); return; }
    svg.textContent = '';
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    const grow = (x, y) => { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; };
    for (const p of D.provinces34) (p.polyRings || []).forEach(r => r.forEach(pt => grow(pt[0], pt[1])));
    const isleBoxes = {};
    for (const id of ['hoang-sa', 'truong-sa']) {
      const a = (D.islands || []).find(i => i.id === id);
      if (!a || !a.subIslands3D) continue;
      const box = boxOf(a.subIslands3D.map(s => [s.cx, s.cy]));
      isleBoxes[id] = box;
      grow(box[0] - 18, box[1] - 16); grow(box[2] + 18, box[3] + 16);
    }
    // What must stay in view; the rest of the stage is filled with more sea and land around it (fitView).
    S.content = { x: minX - 30, y: minY - 26, w: maxX - minX + 70, h: maxY - minY + 56 };
    const C = S.content;
    S.ext = [C.x - 640, C.y - 420, C.x + C.w + 1100, C.y + C.h + 420];

    svg.innerHTML = '<defs>'
      + '<linearGradient id="stLandFill" gradientUnits="userSpaceOnUse" x1="0" y1="' + f1(C.y) + '" x2="0" y2="' + f1(C.y + C.h) + '">'
      + '<stop offset="0" class="st-land-stop-a"/><stop offset=".55" class="st-land-stop-b"/><stop offset="1" class="st-land-stop-c"/></linearGradient>'
      + '<filter id="stLandShade" x="-15%" y="-15%" width="130%" height="130%"><feGaussianBlur stdDeviation="7"/></filter>'
      + '<pattern id="stWaves" width="64" height="40" patternUnits="userSpaceOnUse"><path d="M4 12q5-5 10 0t10 0M36 32q5-5 10 0t10 0" class="st-wave"/></pattern>'
      + '</defs>';
    const layer = name => svgEl('g', { class: 'st-l-' + name }, svg);
    const L = {};
    for (const name of ['sea', 'coast', 'neighbors', 'lakes', 'shade', 'land', 'rivers', 'borders', 'outline', 'isles', 'rail', 'labels']) L[name] = layer(name);
    S.layers = L;
    // Sea: chart waves and a 2° graticule.
    const E = S.ext;
    svgEl('rect', { x: f1(E[0]), y: f1(E[1]), width: f1(E[2] - E[0]), height: f1(E[3] - E[1]), fill: 'url(#stWaves)', class: 'st-waves' }, L.sea);
    let grid = '';
    for (let lon = 96; lon <= 134; lon += 2) { const a = toWorld(lon, 30), b = toWorld(lon, 0); grid += `M${f1(a[0])},${f1(a[1])}L${f1(b[0])},${f1(b[1])}`; }
    for (let lat = 0; lat <= 30; lat += 2) { const a = toWorld(94, lat), b = toWorld(136, lat); grid += `M${f1(a[0])},${f1(a[1])}L${f1(b[0])},${f1(b[1])}`; }
    svgEl('path', { d: grid, class: 'st-grid' }, L.sea);
    // Vietnam: 34 provinces over a soft shadow.
    const paths = [];
    for (const p of D.provinces34) {
      const d = ringPath(p.polyRings || []);
      paths.push(d);
      svgEl('path', { d, class: 'st-prov', 'data-id': p.id }, L.land);
    }
    S.mapPaths = paths.join('');
    svgEl('path', { d: S.mapPaths, class: 'st-land-shade', filter: 'url(#stLandShade)', transform: 'translate(5 9)' }, L.shade);
    // Hoàng Sa and Trường Sa: every island and reef the map draws, and a dashed outline around each archipelago.
    for (const id of ['hoang-sa', 'truong-sa']) {
      const a = (D.islands || []).find(i => i.id === id);
      const box = isleBoxes[id];
      if (!a || !box) continue;
      for (const s of a.subIslands3D) {
        if (s.reefRing && s.reefRing.length > 2) svgEl('path', { d: ringPath([s.reefRing]), class: 'st-reef' }, L.isles);
        if (s.landRing && s.landRing.length > 2) svgEl('path', { d: ringPath([s.landRing]), class: 'st-isle' }, L.isles);
        else svgEl('circle', { cx: s.cx, cy: s.cy, r: 3.2, class: 'st-isle' }, L.isles);
      }
      const [x0, y0, x1, y1] = box;
      svgEl('ellipse', { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, rx: (x1 - x0) / 2 + 20, ry: (y1 - y0) / 2 + 18, class: 'st-archipelago' }, L.isles);
      const key = id === 'hoang-sa' ? 'hs' : 'ts';
      const text = svgEl('text', id === 'hoang-sa'
        ? { x: (x0 + x1) / 2, y: y1 + 52, 'text-anchor': 'middle', class: 'st-isle-label', 'data-key': key }
        : { x: x0 - 30, y: (y0 + y1) / 2 - 4, 'text-anchor': 'end', class: 'st-isle-label', 'data-key': key }, L.labels);
      svgEl('tspan', { x: text.getAttribute('x'), dy: 0, class: 'st-isle-label-1' }, text);
      svgEl('tspan', { x: text.getAttribute('x'), dy: '1.2em', class: 'st-isle-label-2' }, text);
      S[key + 'Box'] = { x0, x1, y0, y1 };
    }
    const sea = svgEl('text', { x: 612, y: 712, 'text-anchor': 'middle', class: 'st-sea-label' }, L.labels);
    svgEl('tspan', { x: 612, dy: 0, class: 'st-sea-label-1' }, sea);
    svgEl('tspan', { x: 612, dy: '1.25em', class: 'st-sea-label-2' }, sea);
    // Compass rose in the gulf south-west of Cà Mau.
    const rose = svgEl('g', { class: 'st-rose', transform: `translate(${f1(C.x + 74)} ${f1(C.y + C.h - 86)})` }, L.labels);
    rose.innerHTML = '<circle r="40" class="st-rose-ring"/><circle r="31" class="st-rose-inner"/>'
      + '<path d="M0-36L7 0 0 36-7 0Z" class="st-rose-ns"/><path d="M0-36L7 0H-7Z" class="st-rose-north"/>'
      + '<path d="M-36 0 0-6 36 0 0 6Z" class="st-rose-ew"/><circle r="4" class="st-rose-pin"/>'
      + '<text y="-46" text-anchor="middle" class="st-rose-letter"></text>';
    // The rail through the three stations: dark bed and cream sleepers.
    const points = RAIL.map(([lon, lat]) => toWorld(lon, lat));
    for (const id of STATIONS) { const at = stationPoint(D, id); if (at) { points[RAIL_STATION[id]] = at; S.stationAt[id] = at; } }
    const parts = smoothSegments(points);
    const d = parts.join('');
    svgEl('path', { d, class: 'st-rail-bed' }, L.rail);
    const rail = svgEl('path', { d, class: 'st-rail-line' }, L.rail);
    S.vb = { x: C.x, y: C.y, w: C.w, h: C.h };
    S.rail = rail;
    S.railLen = rail.getTotalLength();
    // Length along the rail at each station: the curve passes through every point, so a station's length is the length
    // of the same curve cut at its point (one measure each, instead of sampling the whole rail).
    const cut = svgEl('path', { d: parts[0] }, null);
    for (const id of STATIONS) {
      const k = RAIL_STATION[id];
      if (!S.stationAt[id]) continue;
      if (k === 0) { S.stationLen[id] = 0; continue; }
      if (k === points.length - 1) { S.stationLen[id] = S.railLen; continue; }
      cut.setAttribute('d', parts.slice(0, k + 1).join(''));
      L.rail.append(cut);
      S.stationLen[id] = cut.getTotalLength();
      cut.remove();
    }
    // Landmark art and the boat: decorative images over the drawing.
    const artLayer = $('.st-map-art');
    artLayer.textContent = '';
    for (const id of [...STATIONS, 'sailboat']) {
      const src = artUrl(id);
      if (!src) continue;
      const img = document.createElement('img');
      img.src = src;
      img.alt = '';
      img.decoding = 'async';
      img.className = 'st-art' + (id === 'sailboat' ? ' st-boat' : '');
      img.dataset.art = id;
      artLayer.append(img);
    }
    // Station pins: HTML buttons over the drawing, so they get the page's focus ring and are easy to tap.
    const pins = $('.st-map-pins');
    pins.textContent = '';
    for (const id of STATIONS) {
      if (!S.stationAt[id]) continue;
      const pin = document.createElement('button');
      pin.type = 'button';
      pin.className = 'st-pin';
      pin.dataset.station = id;
      pin.dataset.side = id === 'hn' ? 'left' : 'right';
      pin.setAttribute('aria-pressed', 'false');
      pin.innerHTML = '<span class="st-pin-ring" aria-hidden="true"></span><span class="st-pin-dot" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 4.6l2.1 4.6 5 .5-3.8 3.4 1.1 4.9L12 15.5l-4.4 2.5 1.1-4.9L4.9 9.7l5-.5z"/></svg></span><span class="st-pin-label"></span>';
      pin.addEventListener('click', event => pick(id, false, event.detail === 0));
      pins.append(pin);
    }
    const train = $('.st-map-train');
    if (!train.firstChild) { const loco = $('.st-rail-train svg'); if (loco) train.append(loco.cloneNode(true)); }
    mapTexts();
    if (window.ResizeObserver) new ResizeObserver(() => { cancelAnimationFrame(S.fitRaf); S.fitRaf = requestAnimationFrame(fitView); }).observe($('.st-map-wrap'));
    fitView();
  }

  // The regional geography of the map (neighbours, coastlines, borders) and its rivers arrive after the first paint.
  function loadGeometry() {
    if (window.GoiVietRegionalGeometry) return Promise.resolve(window.GoiVietRegionalGeometry);
    if (S.geoPromise) return S.geoPromise;
    S.geoPromise = new Promise(resolve => {
      const done = () => resolve(window.GoiVietRegionalGeometry || null);
      const loading = Array.from(document.scripts).find(s => s.src && s.src.includes('regional-geometry.js'));
      if (loading) {
        loading.addEventListener('load', done, { once: true });
        loading.addEventListener('error', done, { once: true });
        setTimeout(done, 12000);
        return;
      }
      const script = document.createElement('script');
      script.src = GEO_URL;
      script.onload = done;
      script.onerror = done;
      document.head.append(script);
    });
    return S.geoPromise;
  }
  function drawGeography(G) {
    if (!G || S.geo || !S.layers) return;
    S.geo = G;
    const L = S.layers, E = S.ext;
    let land = '';
    for (const poly of G.land || []) {
      if (!poly || !poly[0] || !meets(boxOf(poly[0]), E)) continue;
      for (const ring of poly) {
        const b = boxOf(ring);
        if (b[2] - b[0] < 3 && b[3] - b[1] < 3) continue;
        const r = thin(ring, 2.4);
        if (r.length > 3) land += 'M' + r.map(p => f1(p[0]) + ',' + f1(p[1])).join('L') + 'Z';
      }
    }
    svgEl('path', { d: land, class: 'st-coast-glow' }, L.coast);
    svgEl('path', { d: land, class: 'st-coast-foam' }, L.coast);
    svgEl('path', { d: land, class: 'st-neighbor', 'fill-rule': 'evenodd' }, L.neighbors);
    let borders = '';
    for (const line of G.borders || []) {
      if (!line || line.length < 2 || !meets(boxOf(line), E)) continue;
      borders += 'M' + thin(line, 2).map(p => f1(p[0]) + ',' + f1(p[1])).join('L');
    }
    svgEl('path', { d: borders, class: 'st-border' }, L.borders);
    let outer = '';
    for (const poly of G.vietnamOuter || []) outer += ringPath((Array.isArray(poly[0][0]) ? poly : [poly]).map(r => thin(r, 1.6)));
    if (outer) svgEl('path', { d: outer, class: 'st-outline' }, L.outline);
    for (const c of G.countries || []) {
      const key = COUNTRY_LABELS[c.id];
      if (!key || !Array.isArray(c.anchor)) continue;
      const at = COUNTRY_AT[c.id] ? toWorld(...COUNTRY_AT[c.id]) : c.anchor;
      svgEl('text', { x: f1(at[0]), y: f1(at[1]), 'text-anchor': 'middle', class: 'st-country', 'data-key': key }, L.labels);
    }
    mapTexts();
    const core = window.GoiVietNaturalCore;
    if (core && typeof core.load === 'function') core.load('hydrology-data.js', 'GoiVietHydrologyData').then(drawRivers, () => {});
  }
  function drawRivers(H) {
    if (!H || S.rivers || !S.layers) return;
    S.rivers = true;
    const L = S.layers, E = S.ext;
    const by = { 1: '', 2: '', 3: '' };
    for (const r of H.rivers || []) {
      if (r.rank > 6 || r.kind === 'Lake Centerline' || !Array.isArray(r.bounds) || !meets(r.bounds, E)) continue;
      const pts = thin(r.points || [], 2);
      if (pts.length < 2) continue;
      by[r.rank <= 2 ? 1 : r.rank <= 4 ? 2 : 3] += 'M' + pts.map(p => f1(p[0]) + ',' + f1(p[1])).join('L');
    }
    for (const k of [3, 2, 1]) if (by[k]) svgEl('path', { d: by[k], class: 'st-river st-river-' + k }, L.rivers);
    let lakes = '';
    for (const lake of H.lakes || []) {
      if (lake.rank > 5 || !Array.isArray(lake.bounds) || !meets(lake.bounds, E)) continue;
      lakes += ringPath((lake.rings || []).map(r => thin(r, 1.6)));
    }
    if (lakes) svgEl('path', { d: lakes, class: 'st-lake', 'fill-rule': 'evenodd' }, L.lakes);
  }

  // Fits the drawing to the stage: what must stay in view keeps its shape, more sea and land fill the rest. On wide
  // stages the station board floats over the eastern sea, so Vietnam and both archipelagos stay left of it.
  function fitView() {
    const wrap = $('.st-map-wrap'), svg = $('.st-map'), C = S.content;
    if (!wrap || !svg || !C) return;
    const W = wrap.clientWidth, H = wrap.clientHeight;
    if (!W || !H) return;
    const side = $('.st-map-side');
    const floating = side && getComputedStyle(side).position === 'absolute';
    const free = floating ? Math.max(.5, 1 - (side.offsetWidth + 28) / W) : 1;
    const A = W / H;
    let vb;
    if (A >= C.w / C.h) {
      const w = C.h * A, extra = w - C.w;
      const west = floating ? Math.max(0, Math.min(extra * .22, free * w - C.w)) : extra / 2;
      vb = { x: C.x - west, y: C.y, w, h: C.h };
    } else {
      const h = C.w / A;
      vb = { x: C.x, y: C.y - (h - C.h) / 2, w: C.w, h };
    }
    S.vb = vb;
    S.size = { W, H };
    svg.setAttribute('viewBox', `${f1(vb.x)} ${f1(vb.y)} ${f1(vb.w)} ${f1(vb.h)}`);
    const pct = (v, start, size) => ((v - start) / size * 100).toFixed(3) + '%';
    for (const pin of $$('.st-pin')) {
      const at = S.stationAt[pin.dataset.station];
      if (!at) continue;
      pin.style.left = pct(at[0], vb.x, vb.w);
      pin.style.top = pct(at[1], vb.y, vb.h);
    }
    for (const img of $$('.st-art')) {
      const id = img.dataset.art;
      const at = id === 'sailboat' ? [0, 0] : S.stationAt[id];
      const box = id === 'sailboat' ? BOAT : ART[id];
      if (!at || !box) continue;
      img.style.left = pct(at[0] + box[0], vb.x, vb.w);
      img.style.top = pct(at[1] + box[1], vb.y, vb.h);
      img.style.width = (box[2] / vb.w * 100).toFixed(3) + '%';
      img.style.height = (box[3] / vb.h * 100).toFixed(3) + '%';
    }
    placeTrain();
  }

  function placeTrain() {
    const train = $('.st-map-train');
    if (!S.trainPt || !S.vb || !S.size || !train) return;
    const { W, H } = S.size, vb = S.vb;
    train.style.setProperty('--tx', ((S.trainPt.x - vb.x) / vb.w * W).toFixed(1) + 'px');
    train.style.setProperty('--ty', ((S.trainPt.y - vb.y) / vb.h * H).toFixed(1) + 'px');
  }
  function trainTo(len) {
    if (!S.rail) return;
    S.trainPt = S.rail.getPointAtLength(Math.max(0, Math.min(S.railLen, len)));
    placeTrain();
  }

  function mapTexts() {
    const svg = $('.st-map');
    if (!svg) return;
    // Each label is one key; a line break splits it over the two lines of the drawing.
    const lines = (text, value) => { const [a, b = ''] = value.split('\n'); text.children[0].textContent = a; text.children[1].textContent = b; };
    for (const text of svg.querySelectorAll('.st-isle-label')) lines(text, T(MAP_LABELS[text.dataset.key]));
    const sea = svg.querySelector('.st-sea-label');
    if (sea) lines(sea, T('sotay.map.sea'));
    for (const text of svg.querySelectorAll('.st-country')) text.textContent = T(text.dataset.key);
    const north = svg.querySelector('.st-rose-letter');
    if (north) north.textContent = T('sotay.map.north');
    for (const pin of $$('.st-pin')) {
      const name = T('sotay.s1.pin', { place: placeName(pin.dataset.station) });
      pin.querySelector('.st-pin-label').textContent = name;
      pin.setAttribute('aria-label', name);
    }
  }

  function ride(from, to, done) {
    const train = $('.st-map-train');
    if (!S.rail || from == null || to == null) { done(); return; }
    train.classList.toggle('is-reverse', to < from);
    train.classList.add('is-shown');
    cancelAnimationFrame(S.rideRaf);
    if (!motion()) { trainTo(to); done(); return; }
    trainTo(from);
    const duration = Math.min(2400, Math.max(1000, Math.abs(to - from) * 2.6));
    const start = performance.now();
    const step = now => {
      const k = Math.min(1, (now - start) / duration);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      trainTo(from + (to - from) * e);
      if (k < 1) S.rideRaf = requestAnimationFrame(step);
      else done();
    };
    train.classList.add('is-moving');
    S.rideRaf = requestAnimationFrame(step);
  }

  function pick(id, suggested, fromKeyboard) {
    if (S.travelling) return;
    S.picked = id;
    for (const pin of $$('.st-pin')) {
      const on = pin.dataset.station === id;
      pin.classList.toggle('is-picked', on);
      pin.setAttribute('aria-pressed', String(on));
    }
    for (const path of $$('.st-prov')) path.classList.toggle('is-picked', path.dataset.id === id);
    const here = $('.st-here');
    here.dataset.suggested = suggested ? 'true' : 'false';
    hereTexts();
    if (id === S.at) { here.hidden = true; showBoard(id); }
    else {
      $('.st-board').hidden = true;
      here.hidden = false;
      restart(here, 'is-popping');
    }
    announce(T('sotay.s1.srPick', { place: placeName(id) }));
    tasks();
    if (fromKeyboard && !here.hidden) $('[data-st-explore]').focus();
  }
  function hereTexts() {
    const here = $('.st-here');
    if (!S.picked) return;
    here.querySelector('.st-here-kicker').textContent = T(here.dataset.suggested === 'true' ? 'sotay.s1.suggested' : 'sotay.s1.here');
    here.querySelector('.st-here-place').textContent = placeName(S.picked);
  }

  function drawTicket() {
    if (S.travelling) return;
    const chip = $('[data-st-ticket]');
    const options = STATIONS.filter(id => id !== S.at && id !== S.picked);
    const id = options[Math.floor(Math.random() * options.length)] || STATIONS[0];
    if (!motion()) { pick(id, true); return; }
    chip.classList.add('is-shaking');
    later(() => { chip.classList.remove('is-shaking'); pick(id, true); }, 650);
  }

  function explore() {
    if (S.travelling || !S.picked) return;
    const dest = S.picked;
    if (dest === S.at) { showBoard(dest); return; }
    S.travelling = true;
    $('.st-board').hidden = true;
    $('.st-here').hidden = true;
    const origin = S.at || (dest === 'hue' ? 'hn' : 'hue');
    const arriving = $('.st-arriving');
    arriving.hidden = false;
    restart(arriving, 'is-popping');
    const arrive = () => {
      S.at = dest;
      $('.st-map-train').classList.remove('is-moving');
      const open = () => {
        arriving.hidden = true;
        S.travelling = false;
        showBoard(dest);
        announce(T('sotay.s1.srArrive', { place: placeName(dest) }));
        punch(0);
        tasks();
        const cards = $('.st-mode-cards');
        if (cards && dialog.contains(document.activeElement) && document.activeElement.closest('.st-map-side, .st-map-pins')) cards.focus({ preventScroll: true });
      };
      if (motion()) later(open, 520); else open();
    };
    tasks();
    ride(S.stationLen[origin], S.stationLen[dest], arrive);
  }

  function showBoard(id) {
    const deck = deckOf(id);
    const board = $('.st-board');
    S.place = id;
    boardTexts();
    $('.st-board-note').hidden = true;
    $('[data-st-book]').setAttribute('aria-expanded', 'false');
    $('.st-here').hidden = true;
    board.hidden = false;
    restart(board, 'is-popping');
    if (S.fanPlace && S.fanPlace !== id) resetDeck();
    return deck;
  }
  function boardTexts() {
    const board = $('.st-board');
    if (board.hidden && !S.at) return;
    const deck = deckOf(S.place);
    $('.st-board-region').textContent = deck ? deck.region || '' : '';
    $('.st-board-name').textContent = placeName(S.place);
    $('.st-board-summary').textContent = deck ? deck.summary || deck.tagline || '' : '';
    for (const dd of $$('[data-st-fact]', board)) dd.textContent = deck && deck.highlights ? deck.highlights[dd.dataset.stFact] || '' : '';
  }

  // ---------------------------------------------------------------- the deck (stop 2)
  function resetDeck() {
    S.fanPlace = null;
    S.cardIdx = null; S.answer = null; S.eliminated = null; S.revealed = false; S.asDontKnow = false; S.toSeal = false;
    S.unsealed = false; S.actIdx = 0; S.finished = null;
    $('.st-front').hidden = true;
    $('.st-deck').hidden = false;
    tasks();
  }
  function renderFan() {
    const fan = $('.st-fan');
    const deck = deckOf(S.place);
    const cards = deck && Array.isArray(deck.cards) ? deck.cards.slice(0, 4) : [];
    fan.textContent = '';
    fan.setAttribute('aria-label', T('sotay.s2.fan', { place: placeName(S.place) }));
    fan.style.setProperty('--n', cards.length || 1);
    cards.forEach((card, i) => {
      const topic = label('topic', card.topic);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'st-fan-card';
      button.style.setProperty('--i', i);
      button.style.setProperty('--o', (i - (cards.length - 1) / 2).toFixed(2));
      button.setAttribute('aria-label', T('sotay.s2.card', { topic }));
      const art = window.GoiVietCardCovers && window.GoiVietCardCovers.art({ id: S.place }, topic);
      if (art) button.append(art);
      else {
        const plain = document.createElement('span');
        plain.className = 'st-fan-plain';
        plain.setAttribute('aria-hidden', 'true');
        plain.innerHTML = '<span class="st-fan-plain-topic"></span><span class="st-fan-plain-place"></span>';
        plain.firstChild.textContent = topic;
        plain.lastChild.textContent = placeName(S.place);
        button.append(plain);
      }
      const badge = document.createElement('span');
      badge.className = 'st-fan-badge';
      badge.setAttribute('aria-hidden', 'true');
      badge.textContent = topic;
      button.append(badge);
      button.addEventListener('click', () => draw(i, false));
      fan.append(button);
    });
    S.fanPlace = S.place;
  }
  function ensureFan() {
    if (S.fanPlace !== S.place || !$('.st-fan').childElementCount) {
      if (S.fanPlace && S.fanPlace !== S.place) resetDeck();
      renderFan();
    }
    if (S.cardIdx != null) { $('.st-deck').hidden = true; $('.st-front').hidden = false; renderFront(); }
  }

  function draw(index, random) {
    if (S.drawing) return;
    const fan = $('.st-fan');
    const cards = $$('.st-fan-card', fan);
    if (!cards.length) return;
    const i = random ? Math.floor(Math.random() * cards.length) : index;
    S.drawing = true;
    const finish = () => {
      S.drawing = false;
      fan.classList.remove('is-gathering', 'is-shuffling');
      cards.forEach(c => c.classList.remove('is-picked'));
      showFront(i);
    };
    if (!motion()) { finish(); return; }
    if (random) {
      fan.classList.add('is-gathering');
      later(() => fan.classList.add('is-shuffling'), 340);
      later(() => { fan.classList.remove('is-shuffling'); cards[i].classList.add('is-picked'); }, 1180);
      later(finish, 1650);
    } else {
      cards[i].classList.add('is-picked');
      later(finish, 460);
    }
  }

  function showFront(i) {
    S.cardIdx = i; S.answer = null; S.eliminated = null; S.revealed = false; S.asDontKnow = false; S.toSeal = false;
    S.unsealed = false; S.actIdx = 0; S.finished = null;
    $('.st-deck').hidden = true;
    const front = $('.st-front');
    front.hidden = false;
    renderFront();
    restart(front, 'is-flipping');
    const card = currentCard();
    punch(1);
    tasks();
    announce(T('sotay.s2.srDrawn', { topic: label('topic', card && card.topic), question: $('.st-question').textContent }));
    const first = $('.st-option[tabindex="0"]') || $('[data-st-goto="2"]', front);
    if (first) first.focus({ preventScroll: true });
  }

  function renderFront() {
    const card = currentCard();
    if (!card) return;
    const open = canva(card);
    const front = $('.st-front');
    front.classList.toggle('is-open-question', open);
    $('.st-front-topic').textContent = `${label('topic', card.topic)} • ${placeName(S.place)}`;
    $('.st-question').textContent = open ? window.GoiVietCanvaCards.question(card) || card.question : card.question;
    const list = $('.st-options');
    list.textContent = '';
    list.hidden = open;
    if (!open) {
      (card.options || []).forEach((text, i) => {
        const option = document.createElement('button');
        option.type = 'button';
        option.className = 'st-option';
        option.setAttribute('role', 'radio');
        option.dataset.index = i;
        const mark = document.createElement('span');
        mark.className = 'st-option-letter';
        mark.textContent = letter(i);
        const words = document.createElement('span');
        words.className = 'st-option-text';
        words.textContent = text;
        option.append(mark, words);
        option.addEventListener('click', () => choose(i));
        option.addEventListener('keydown', event => optionKeys(event, i));
        list.append(option);
      });
    }
    syncOptions();
    const hint = $('[data-st-hint]'), reveal = $('[data-st-reveal]'), check = $('[data-st-check]');
    hint.hidden = open || S.revealed || S.eliminated != null;
    reveal.hidden = open || S.revealed;
    check.hidden = open || S.revealed;
    const error = $('.st-front-error');
    if (S.revealed || open) error.hidden = true;
    const result = $('.st-result');
    if (open) {
      result.hidden = false;
      result.dataset.tone = 'open';
      result.querySelector('.st-result-head').textContent = T('sotay.s2.open');
      result.querySelector('.st-result-text').textContent = '';
      result.querySelector('.st-result-text').hidden = true;
    } else if (S.revealed) {
      const right = S.answer === card.correctIndex;
      result.hidden = false;
      result.dataset.tone = S.asDontKnow ? 'learn' : right ? 'right' : 'learn';
      result.querySelector('.st-result-head').textContent = T(S.asDontKnow ? 'js.deck.learn' : right ? 'js.deck.correct' : 'js.deck.wrong');
      const text = result.querySelector('.st-result-text');
      text.hidden = false;
      text.textContent = card.explanation || '';
    } else result.hidden = true;
  }
  function syncOptions() {
    const card = currentCard();
    const options = $$('.st-option');
    const focusable = S.answer != null ? S.answer : options.findIndex(o => +o.dataset.index !== S.eliminated);
    options.forEach(option => {
      const i = +option.dataset.index;
      const on = S.answer === i;
      option.setAttribute('aria-checked', String(on));
      option.tabIndex = i === focusable ? 0 : -1;
      option.classList.toggle('is-out', S.eliminated === i);
      option.setAttribute('aria-disabled', String(S.revealed || S.eliminated === i));
      option.classList.toggle('is-correct', S.revealed && card && i === card.correctIndex);
      option.classList.toggle('is-wrong', S.revealed && !S.asDontKnow && on && card && i !== card.correctIndex);
    });
  }
  function choose(i) {
    if (S.revealed || S.eliminated === i) return;
    S.answer = i;
    $('.st-front-error').hidden = true;
    syncOptions();
    tasks();
  }
  function optionKeys(event, i) {
    const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    if (!(event.key in keys)) return;
    event.preventDefault();
    const options = $$('.st-option').filter(o => +o.dataset.index !== S.eliminated);
    const at = options.findIndex(o => +o.dataset.index === i);
    const next = options[(at + keys[event.key] + options.length) % options.length];
    if (!next) return;
    if (!S.revealed) choose(+next.dataset.index);
    next.focus();
  }
  function giveHint() {
    const card = currentCard();
    if (!card || S.revealed || S.eliminated != null) return;
    S.eliminated = (card.options || []).findIndex((_, i) => i !== card.correctIndex);
    if (S.answer === S.eliminated) S.answer = null;
    const error = $('.st-front-error');
    error.dataset.tone = 'info';
    error.textContent = T('sotay.s2.hintRemoved', { letter: letter(S.eliminated) });
    error.hidden = false;
    renderFront();
    tasks();
    ($('.st-option[tabindex="0"]') || $('[data-st-check]')).focus();
  }
  function check(asDontKnow) {
    const card = currentCard();
    if (!card || S.revealed) return;
    if (!asDontKnow && S.answer == null) {
      const error = $('.st-front-error');
      error.dataset.tone = 'warn';
      error.textContent = T('sotay.s2.pickFirst');
      error.hidden = false;
      ($('.st-option[tabindex="0"]') || $('.st-option')).focus();
      return;
    }
    S.revealed = true;
    S.asDontKnow = Boolean(asDontKnow);
    renderFront();
    restart($('.st-result'), 'is-popping');
    tasks();
    announce(`${$('.st-result-head').textContent} ${card.explanation || ''}`);
    $('[data-st-goto="2"]', $('.st-front')).focus();
  }

  // ---------------------------------------------------------------- the lotus seal (stop 3)
  function activities(card) {
    if (!card) return [{ kind: '', text: '' }];
    const list = [];
    const challenge = canva(card) ? window.GoiVietCanvaCards.activity(card) : null;
    if (challenge) list.push({ kind: challenge.kind, text: challenge.text });
    for (const raw of card.activities || []) {
      const m = /^【([^】]+)】\s*([\s\S]*)$/.exec(raw);
      list.push(m ? { kind: m[1], text: m[2] } : { kind: '', text: raw });
    }
    return list.length ? list : [{ kind: '', text: '' }];
  }
  function renderBack() {
    const card = currentCard();
    const back = $('.st-back');
    const acts = activities(card);
    const act = acts[S.actIdx % acts.length];
    back.classList.toggle('is-open', S.unsealed);
    $('.st-seal').setAttribute('aria-hidden', String(S.unsealed));
    $('.st-wax').tabIndex = S.unsealed ? -1 : 0;
    $('.st-activity').hidden = !S.unsealed;
    const kind = $('.st-activity-kind');
    kind.textContent = act.kind;
    kind.hidden = !act.kind;
    $('.st-activity-text').textContent = act.text;
    $('[data-st-swap]').hidden = acts.length < 2;
    back.classList.toggle('is-stamped', Boolean(S.finished));
  }
  function unseal() {
    if (S.unsealed) return;
    const go = () => {
      S.unsealed = true;
      renderBack();
      punch(2);
      tasks();
      announce(T('sotay.s3.srOpen', { activity: $('.st-activity-text').textContent }));
      $('.st-activity-text').focus({ preventScroll: true });
    };
    if (!motion()) { go(); return; }
    $('.st-wax').classList.add('is-pressed');
    later(() => { $('.st-wax').classList.remove('is-pressed'); go(); }, 380);
  }
  function swapActivity() {
    const acts = activities(currentCard());
    S.actIdx = (S.actIdx + 1) % acts.length;
    renderBack();
    restart($('.st-activity-text'), 'is-popping');
  }
  function timerLabel() {
    const labelEl = $('.st-timer-label');
    if (!S.timerEnd) { labelEl.textContent = T('table.timerStart'); return; }
    const left = Math.max(0, S.timerEnd - performance.now());
    labelEl.textContent = T('sotay.s3.timerLeft', { s: Math.ceil(left / 1000) });
  }
  function tick() {
    const button = $('[data-st-timer]');
    const left = Math.max(0, S.timerEnd - performance.now());
    button.style.setProperty('--p', (1 - left / 60000).toFixed(3));
    timerLabel();
    if (left <= 0) { stopTimer(); return; }
    S.timerId = setTimeout(tick, 250);
  }
  function toggleTimer() {
    if (S.timerEnd) { stopTimer(); return; }
    S.timerEnd = performance.now() + 60000;
    $('[data-st-timer]').setAttribute('aria-pressed', 'true');
    tick();
  }
  function stopTimer() {
    clearTimeout(S.timerId);
    S.timerEnd = 0;
    const button = $('[data-st-timer]');
    if (!button) return;
    button.setAttribute('aria-pressed', 'false');
    button.style.setProperty('--p', 0);
    timerLabel();
  }
  function finishCard(how) {
    if (!S.unsealed || S.finished) return;
    S.finished = how;
    stopTimer();
    renderBack();
    restart($('.st-postmark'), 'is-stamping');
    tasks();
    announce(T('sotay.s3.srDone'));
    later(() => { if (S.open && S.step === 2) goTo(3); }, motion() ? 760 : 0);
  }

  // ---------------------------------------------------------------- the practice postcard (stop 4)
  function enterMemory() {
    const input = $('#soTayPlace');
    if (!input.value && !S.memory) input.value = placeName(S.at || S.place);
    renderPostcard(false);
  }
  function renderPostcard(fresh) {
    const done = S.finished ? 1 : 0;
    $('.st-postcard-place').textContent = placeName(S.at || S.place);
    const note = $('.st-postcard-note');
    note.textContent = '';
    if (S.memory) {
      const place = document.createElement('strong');
      place.textContent = S.memory.place;
      note.append(place);
      note.append(S.memory.note ? ' · ' : ' ');
      const words = document.createElement('span');
      words.className = S.memory.note ? 'st-handwriting' : 'st-muted';
      words.textContent = S.memory.note || T('sotay.s4.noNote');
      note.append(words);
    } else {
      const muted = document.createElement('span');
      muted.className = 'st-muted';
      muted.textContent = T('sotay.s4.noNote');
      note.append(muted);
    }
    $('.st-milestone-text').textContent = T('sotay.s4.progress', { done });
    $$('.st-milestone-dots i').forEach((dot, i) => dot.classList.toggle('is-on', i < done));
    $('.st-postcard-count').textContent = T('sotay.s4.count', { n: S.saves });
    const card = $('.st-postcard');
    card.classList.toggle('has-memory', Boolean(S.memory));
    if (fresh) restart(card, 'is-stamping');
  }
  function saveMemory(event) {
    event.preventDefault();
    const input = $('#soTayPlace');
    const error = $('#soTayPlaceError');
    const place = input.value.trim();
    if (!place) {
      error.hidden = false;
      input.setAttribute('aria-invalid', 'true');
      input.focus();
      return;
    }
    error.hidden = true;
    input.removeAttribute('aria-invalid');
    S.memory = { place, note: $('#soTayNote').value.trim() };
    S.saves = Math.min(5, S.saves + 1);
    renderPostcard(true);
    punch(3);
    tasks();
    announce(T('sotay.s4.srSaved'));
  }

  // ---------------------------------------------------------------- the last stop
  function buildScreen() {
    const svg = $('.st-screen-map');
    if (!svg || svg.childElementCount || !S.mapPaths || !S.content) return;
    const C = S.content;
    svg.setAttribute('viewBox', `${f1(C.x)} ${f1(C.y)} ${f1(C.w)} ${f1(C.h)}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svgEl('path', { d: S.mapPaths, class: 'st-screen-land' }, svg);
    for (const box of [S.hsBox, S.tsBox].filter(Boolean)) {
      svgEl('ellipse', { cx: (box.x0 + box.x1) / 2, cy: (box.y0 + box.y1) / 2, rx: (box.x1 - box.x0) / 2 + 14, ry: (box.y1 - box.y0) / 2 + 12, class: 'st-screen-isles' }, svg);
    }
  }
  function setHot(n) {
    $$('.st-step-last [data-st-mark]').forEach(el => el.classList.toggle('is-hot', n != null && el.dataset.stMark === String(n)));
  }
  function stopTour() { clearInterval(S.tour); S.tour = 0; }
  function startTour() {
    stopTour();
    if (!motion()) return;
    let n = 1;
    setHot(n);
    S.tour = setInterval(() => {
      n += 1;
      if (n > 7) { stopTour(); setHot(null); return; }
      setHot(n);
    }, 1350);
  }
  function enterKit() {
    buildScreen();
    readyText();
    startTour();
  }
  function readyText() {
    const n = S.tried.filter(Boolean).length;
    const ready = $('.st-ready');
    ready.textContent = n === 4 ? T('sotay.s5.ready') : T('sotay.s5.partial', { n });
    ready.classList.toggle('is-full', n === 4);
  }

  // ---------------------------------------------------------------- things to do, rail and stops
  // Each stop lists what to try, in order: the first one not done yet is "now", and its control on the stage gets a
  // gold ring (three pulses, then it stays). When everything is done, the ring moves to "Tiếp".
  const TASKS = [
    [{ id: 'pick', done: () => Boolean(S.picked), target: () => $$('.st-pin') },
      { id: 'explore', done: () => Boolean(S.at), target: () => [$('[data-st-explore]')] },
      { id: 'cards', done: () => S.boardCards, target: () => [$('.st-mode-cards')] }],
    [{ id: 'draw', done: () => S.cardIdx != null, target: () => [$('[data-st-shuffle]')] },
      { id: 'answer', kind: 'closed', done: () => S.answer != null || S.revealed, target: () => [$('.st-options')] },
      { id: 'check', kind: 'closed', done: () => S.revealed, target: () => [$('[data-st-check]')] },
      { id: 'talk', kind: 'open', done: () => S.toSeal, target: () => [$('.st-front [data-st-goto="2"]')] }],
    [{ id: 'seal', done: () => S.unsealed, target: () => [$('.st-wax')] },
      { id: 'finish', done: () => Boolean(S.finished), target: () => [$('[data-st-finish="done"]')] }],
    [{ id: 'place', done: () => Boolean(S.memory) || Boolean($('#soTayPlace').value.trim()), target: () => [$('#soTayPlace')] },
      { id: 'note', done: () => Boolean(S.memory) || Boolean($('#soTayNote').value.trim()), target: () => [$('#soTayNote')] },
      { id: 'save', done: () => Boolean(S.memory), target: () => [$('.st-memory [type="submit"]')] }],
    []
  ];
  function tasks() {
    if (!S.built) return;
    const n = S.step;
    const section = $(`.st-step[data-st-step="${n}"]`);
    const open = n === 1 && S.cardIdx != null && canva(currentCard());
    let now = null, shown = 0;
    for (const t of TASKS[n]) {
      const li = $(`[data-st-task="${t.id}"]`, section);
      if (!li) continue;
      const on = !t.kind || (t.kind === 'open') === open;
      li.hidden = !on;
      if (!on) continue;
      shown += 1;
      const done = t.done();
      const state = done ? 'done' : now ? 'todo' : 'now';
      if (!done && !now) now = t;
      li.dataset.state = state;
      if (state === 'now') li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current');
      li.querySelector('.st-task-state').textContent = state === 'done' ? ', ' + T('sotay.task.done') : state === 'now' ? ', ' + T('sotay.task.now') : '';
    }
    // When everything is done, the ring moves on: to the card's own way to the seal at stop 2, else to Tiếp.
    const onward = n === 1 && !$('.st-front').hidden ? $('.st-front [data-st-goto="2"]') : $('.st-next');
    const targets = now ? now.target().filter(el => el && !el.hidden && !el.closest('[hidden]')) : shown ? [onward] : [];
    const key = n + ':' + (now ? now.id : 'next') + ':' + targets.length;
    for (const el of $$('.st-target')) if (!targets.includes(el)) el.classList.remove('st-target');
    for (const el of targets) {
      if (key !== S.targetKey && motion()) { el.classList.remove('st-target'); void el.offsetWidth; }
      el.classList.add('st-target');
    }
    S.targetKey = key;
  }

  function railTexts() {
    $$('.st-stop').forEach((stop, i) => {
      const state = stop.querySelector('.st-stop-state');
      if (state) state.textContent = i < LAST && S.tried[i] ? ', ' + T('sotay.rail.done') : '';
    });
  }
  function punch(n) {
    if (S.tried[n]) return;
    S.tried[n] = true;
    $(`.st-step[data-st-step="${n}"]`).classList.add('is-tried');
    railTexts();
    railState();
    restart($(`.st-stop[data-st-goto="${n}"] .st-stop-dot`), 'is-popping');
    if (S.step === LAST) readyText();
    announce(T('sotay.sr.punch', { n: n + 1 }));
  }
  function railState() {
    $$('.st-stop').forEach((stop, i) => {
      stop.classList.toggle('is-current', i === S.step);
      stop.classList.toggle('is-past', i < S.step);
      stop.classList.toggle('is-done', i < LAST && S.tried[i]);
      if (i === S.step) stop.setAttribute('aria-current', 'step');
      else stop.removeAttribute('aria-current');
    });
    dialog.style.setProperty('--st-progress', (S.step / LAST).toFixed(3));
  }
  function navTexts() {
    const next = $('.st-next');
    next.querySelector('.st-next-label').textContent = T(S.step === LAST ? 'sotay.board' : 'sotay.next');
    next.classList.toggle('is-board', S.step === LAST);
    const prev = $('.st-prev');
    prev.classList.toggle('is-hidden', S.step === 0);
    prev.tabIndex = S.step === 0 ? -1 : 0;
    prev.setAttribute('aria-hidden', String(S.step === 0));
    $('.st-keys').hidden = S.step === LAST;
    $('.st-ready').hidden = S.step !== LAST;
  }

  function goTo(n, { focus = true, say = !focus } = {}) {
    n = Math.max(0, Math.min(LAST, n));
    const prev = S.step;
    S.step = n;
    $$('.st-step').forEach((section, i) => {
      const on = i === n;
      section.hidden = !on;
      section.classList.toggle('is-current', on);
    });
    const section = $(`.st-step[data-st-step="${n}"]`);
    if (prev !== n && motion()) {
      section.classList.toggle('is-back', n < prev);
      restart(section, 'is-entering');
    }
    if (prev === 2 && n !== 2) stopTimer();
    if (n !== LAST) { stopTour(); setHot(null); }
    if (n === 0) requestAnimationFrame(fitView);
    if (n === 1) ensureFan();
    if (n === 2) renderBack();
    if (n === 3) enterMemory();
    if (n === LAST) enterKit();
    railState();
    navTexts();
    S.targetKey = '';
    tasks();
    const heading = document.getElementById(section.getAttribute('aria-labelledby'));
    if (focus && heading) heading.focus({ preventScroll: true });
    else if (heading && say) announce(T('sotay.sr.step', { label: T(STOP_NUMBERS[n]), title: heading.textContent }));
  }

  // Everything written by this script, again in the current language (the data objects already follow it).
  function refreshTexts() {
    if (!S.built) return;
    mapTexts();
    hereTexts();
    if (!$('.st-board').hidden) boardTexts();
    if (S.fanPlace && !S.drawing) renderFan();
    if (S.cardIdx != null) { renderFront(); renderBack(); }
    if (S.step === 3 || S.memory) renderPostcard(false);
    timerLabel();
    railTexts();
    navTexts();
    readyText();
    tasks();
    const error = $('.st-front-error');
    if (!error.hidden && error.dataset.tone === 'warn') error.textContent = T('sotay.s2.pickFirst');
    if (!error.hidden && error.dataset.tone === 'info' && S.eliminated != null) error.textContent = T('sotay.s2.hintRemoved', { letter: letter(S.eliminated) });
  }

  function build() {
    if (S.built) return;
    S.built = true;
    buildMap();
    $('.st-question').tabIndex = -1;
    $('.st-activity-text').tabIndex = -1;
    $('[data-st-book]').setAttribute('aria-expanded', 'false');
    railTexts();
  }

  // ---------------------------------------------------------------- open, close, board
  function open(trigger) {
    if (S.open || intro.classList.contains('intro-hidden')) return;
    const chapter = window.GoiVietMemoryChapter;
    if (chapter && chapter.getState && chapter.getState().exiting) return;
    S.open = true;
    S.boarding = false;
    S.trigger = trigger || document.activeElement;
    dialog.hidden = false;
    dialog.classList.remove('is-boarding', 'is-open');
    build();
    // Everything else on the page is inert while the handbook is open; the earlier values come back on close.
    S.saved = Array.from(document.body.children)
      .filter(node => node !== dialog && node.id !== 'memoryMapTransition' && !/^(SCRIPT|STYLE|LINK|TEMPLATE)$/.test(node.tagName))
      .map(node => [node, node.inert]);
    S.saved.forEach(([node]) => { node.inert = true; });
    document.body.classList.add('st-open');
    refreshTexts();
    goTo(S.step, { focus: false, say: false });
    requestAnimationFrame(() => requestAnimationFrame(() => { if (S.open) dialog.classList.add('is-open'); }));
    // Once the sheet covers the page, stop painting the chapter under it (the home screen itself stays open).
    later(() => { if (S.open) document.body.classList.add('st-covering'); }, motion() ? 380 : 0);
    // The map's own geography: usually already loaded by the map's preparation, then drawn in the next frame (while the
    // sheet fades in); otherwise loaded after the sheet has settled, so opening stays smooth.
    if (!S.geo && window.GoiVietRegionalGeometry) requestAnimationFrame(() => drawGeography(window.GoiVietRegionalGeometry));
    else if (!S.geo) later(() => { loadGeometry().then(drawGeography); }, motion() ? 520 : 0);
    const heading = document.getElementById($(`.st-step[data-st-step="${S.step}"]`).getAttribute('aria-labelledby'));
    requestAnimationFrame(() => { if (S.open && heading) heading.focus({ preventScroll: true }); });
  }
  function release() {
    S.saved.forEach(([node, was]) => { node.inert = was; });
    S.saved = [];
    // Show the home screen again at once (without its 0.24 s visibility transition), so focus can return to it.
    document.body.classList.add('st-uncover');
    document.body.classList.remove('st-covering');
    void intro.offsetWidth;
    requestAnimationFrame(() => requestAnimationFrame(() => document.body.classList.remove('st-uncover')));
  }
  function settle() {
    stopTimer();
    stopTour();
    cancelAnimationFrame(S.rideRaf);
    clearTimers();
    S.drawing = false;
    $('.st-fan').classList.remove('is-gathering', 'is-shuffling');
    $$('.st-fan-card').forEach(card => card.classList.remove('is-picked'));
    if (S.travelling) {
      // The train arrives at once; the board opens when the handbook is opened again.
      S.travelling = false;
      S.at = S.picked;
      if (S.at != null && S.stationLen[S.at] != null) trainTo(S.stationLen[S.at]);
      $('.st-map-train').classList.remove('is-moving');
      $('.st-arriving').hidden = true;
      if (S.at) { showBoard(S.at); punch(0); }
    }
  }
  function close({ restoreFocus = true } = {}) {
    if (!S.open || S.boarding) return;
    S.open = false;
    settle();
    release();
    dialog.classList.remove('is-open');
    const hide = () => { if (!S.open) { dialog.hidden = true; document.body.classList.remove('st-open'); } };
    if (motion()) setTimeout(hide, 300); else hide();
    if (restoreFocus) {
      const back = S.trigger && S.trigger.isConnected && !S.trigger.closest('#soTayDialog') ? S.trigger : opener;
      back.focus({ preventScroll: true });
    }
  }
  function finishBoarding() {
    clearTimeout(S.boardFail);
    S.open = false;
    S.boarding = false;
    dialog.classList.remove('is-open', 'is-boarding');
    dialog.hidden = true;
    document.body.classList.remove('st-open', 'st-covering');
  }
  function board({ skip = false } = {}) {
    if (!S.open || S.boarding) return;
    const chapter = window.GoiVietMemoryChapter;
    if (!chapter || typeof chapter.enterMap !== 'function') {
      close({ restoreFocus: false });
      document.getElementById('memoryOpenMap')?.click();
      return;
    }
    S.boarding = true;
    if (!skip) dialog.classList.add('is-boarding');
    announce(T('sotay.sr.boarding'));
    const go = () => {
      settle();
      // The page underneath is interactive again before the map code runs; the sheet still covers it.
      release();
      const watch = new MutationObserver(() => {
        if (!intro.classList.contains('intro-hidden')) return;
        watch.disconnect();
        finishBoarding();
      });
      watch.observe(intro, { attributes: true, attributeFilter: ['class'] });
      chapter.enterMap();
      if (intro.classList.contains('intro-hidden')) { watch.disconnect(); finishBoarding(); return; }
      // If the map does not open, the chapter shows its message under the button: close the sheet so it is seen.
      S.boardFail = setTimeout(() => {
        watch.disconnect();
        if (intro.classList.contains('intro-hidden')) { finishBoarding(); return; }
        S.boarding = false;
        dialog.classList.remove('is-boarding');
        close({ restoreFocus: false });
        document.getElementById('memoryOpenMap')?.focus({ preventScroll: true });
      }, 4000);
    };
    if (!skip && motion()) later(go, 640); else go();
  }

  // ---------------------------------------------------------------- events
  opener.addEventListener('click', event => { event.preventDefault(); open(opener); });
  dialog.addEventListener('click', event => {
    const target = event.target.closest('button');
    if (!target || !dialog.contains(target) || target.getAttribute('aria-disabled') === 'true') return;
    if (target.matches('[data-st-goto]')) {
      if (target.matches('.st-mode-cards')) S.boardCards = true;
      if (target.closest('.st-front')) S.toSeal = true;
      goTo(+target.dataset.stGoto);
      return;
    }
    const action = target.dataset.stAction;
    if (action === 'close') { close(); return; }
    if (action === 'map') { board({ skip: true }); return; }
    if (action === 'prev') { goTo(S.step - 1); return; }
    if (action === 'next') { if (S.step === LAST) board(); else goTo(S.step + 1); return; }
    if (target.matches('[data-st-ticket]')) { drawTicket(); return; }
    if (target.matches('[data-st-explore]')) { explore(); return; }
    if (target.matches('[data-st-book]')) {
      const note = $('.st-board-note');
      note.hidden = !note.hidden;
      target.setAttribute('aria-expanded', String(!note.hidden));
      return;
    }
    if (target.matches('[data-st-shuffle]')) { draw(0, true); return; }
    if (target.matches('[data-st-hint]')) { giveHint(); return; }
    if (target.matches('[data-st-reveal]')) { check(true); return; }
    if (target.matches('[data-st-check]')) { check(false); return; }
    if (target.matches('[data-st-again]')) { resetDeck(); renderFan(); $('.st-fan-card') && $('.st-fan-card').focus(); return; }
    if (target.matches('[data-st-unseal]')) { unseal(); return; }
    if (target.matches('[data-st-swap]')) { swapActivity(); return; }
    if (target.matches('[data-st-timer]')) { toggleTimer(); return; }
    if (target.matches('[data-st-finish]')) finishCard(target.dataset.stFinish);
  });
  $('.st-memory').addEventListener('submit', saveMemory);
  $('#soTayPlace').addEventListener('input', () => {
    tasks();
    if (!$('#soTayPlace').value.trim()) return;
    $('#soTayPlaceError').hidden = true;
    $('#soTayPlace').removeAttribute('aria-invalid');
  });
  $('#soTayNote').addEventListener('input', tasks);
  dialog.addEventListener('keydown', event => {
    if (!S.open) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); return; }
    // Tab wraps inside the sheet (the rest of the page is inert as well).
    if (event.key === 'Tab') {
      const focusable = $$('button, input, [tabindex="0"]').filter(el => !el.disabled && el.tabIndex >= 0 && el.offsetParent !== null && getComputedStyle(el).visibility !== 'hidden');
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
      return;
    }
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    if (event.target.closest('input, textarea, select, [role="radiogroup"], [contenteditable="true"]')) return;
    event.preventDefault();
    event.stopPropagation();
    goTo(S.step + (event.key === 'ArrowRight' ? 1 : -1));
  });
  const kit = $('.st-step-last');
  kit.addEventListener('pointerover', event => {
    const item = event.target.closest('[data-st-mark]');
    if (!item) return;
    stopTour();
    setHot(item.dataset.stMark);
  });
  kit.addEventListener('pointerleave', () => { if (!S.tour) setHot(null); });
  document.addEventListener('goiviet:langchange', refreshTexts);
  // If the home screen is replayed or closed by other code while the sheet is open, the sheet goes with it.
  new MutationObserver(() => {
    if (!S.open || S.boarding) return;
    if (intro.classList.contains('intro-hidden') || intro.dataset.memoryUnlocked !== 'true') close({ restoreFocus: false });
  }).observe(intro, { attributes: true, attributeFilter: ['class', 'data-memory-unlocked'] });

  window.GoiVietSoTay = Object.freeze({
    open: () => open(opener),
    close: () => close(),
    goTo: n => { if (S.open) goTo(n); },
    inspect: () => ({ open: S.open, step: S.step, tried: S.tried.slice(), boarding: S.boarding, at: S.at, picked: S.picked,
      place: S.place, card: currentCard() ? currentCard().id : null, cardDrawn: S.cardIdx != null, answer: S.answer,
      revealed: S.revealed, unsealed: S.unsealed, finished: S.finished, saves: S.saves, timer: Boolean(S.timerEnd),
      map: Boolean(S.vb), stations: Object.keys(S.stationLen), geography: Boolean(S.geo), rivers: S.rivers,
      tasks: $$(`.st-step[data-st-step="${S.step}"] [data-st-task]:not([hidden])`).map(li => li.dataset.stTask + ':' + li.dataset.state),
      target: $$('.st-target').map(el => el.dataset.stTask || el.dataset.station || el.className.split(' ')[0]) })
  });
})();
