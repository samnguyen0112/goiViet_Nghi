/* Jade mountains and antique gold lowlands, selected by the user.
   One continuous height-based material avoids artificial province color bands.
   Map only: original homepage palettes are restored when the intro opens. */
(() => {
  'use strict';
  const intro = document.getElementById('introScreen');
  if (!intro) return;
  const rgb = hex => Object.freeze([1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)));
  function group(id, label, baseHex, companionHex, lightHex, deepHex) {
    const light = rgb(lightHex), deep = rgb(deepHex);
    return Object.freeze({ id, label, hex: Object.freeze([baseHex, companionHex]), light, deep,
      materialKey: 'jade-gold',
      palette: Object.freeze({ top: rgb(baseHex), wall: Object.freeze(deep.map(v => Math.round(v * .76))), highlight: light }) });
  }
  const groups = Object.freeze({
    jade: group('jade', 'Ngọc bích', '#477D6A', '#2D6259', '#80A58B', '#28544D'),
    gold: group('gold', 'Vàng cổ', '#D8BA7D', '#B18E53', '#E4CA94', '#AA864B'),
    transition: group('transition', 'Đồi và duyên hải', '#A0AD80', '#638F77', '#C2BB89', '#536F59')
  });
  // These groups supply fallback faces and block sides. The DEM surface uses
  // the same continuous ramp everywhere, including within merged provinces.
  const uplands = new Set(['db', 'lc_old', 'lc', 'sl', 'tq', 'cb', 'ls', 'tn', 'pt', 'qng', 'gl', 'dl', 'ld']);
  const lowlands = new Set(['hn', 'bn', 'hy', 'hp', 'nb', 'qn', 'hcm', 'dna', 'tni', 'dt', 'vl', 'ct', 'ag', 'cm']);
  const forProvince = id => uplands.has(id) ? groups.jade : lowlands.has(id) ? groups.gold : groups.transition;
  const heightColors = Object.freeze([
    [0, '#D8BA7D'], [50, '#CCB77E'], [150, '#B2B082'], [320, '#8EA484'],
    [600, '#648F79'], [1000, '#437B6C'], [1600, '#2D6259'], [2400, '#244B47'], [3200, '#203D3B']
  ].map(([metres, hex]) => Object.freeze({ metres, hex, rgb: rgb(hex) })));
  function colorAtHeight(metres) {
    const height = Math.max(0, Number(metres) || 0);
    let i = 1; while (i < heightColors.length - 1 && height > heightColors[i].metres) i++;
    const a = heightColors[i - 1], b = heightColors[i], t = Math.max(0, Math.min(1, (height - a.metres) / (b.metres - a.metres)));
    return a.rgb.map((value, channel) => value + (b.rgb[channel] - value) * t);
  }
  const ringGroups = new WeakMap();
  DATA.provinces34.forEach(p => (p.polyRings || []).forEach(ring => ringGroups.set(ring, forProvince(p.id))));
  window.GoiVietMapPalette = Object.freeze({ groups, heightColors, colorAtHeight, forProvince, forRing: ring => ringGroups.get(ring) || groups.gold });
  const originals = new Map(DATA.provinces34.map(province => [province, province.pal]));
  const originalIslands = { archipelago: ISLAND_PALETTE.archipelago, specialZone: ISLAND_PALETTE.specialZone };
  let warm = false;
  function sync() {
    const next = intro.classList.contains('intro-hidden');
    if (warm === next) return;
    warm = next;
    for (const [province, original] of originals) province.pal = warm ? forProvince(province.id).palette : original;
    ISLAND_PALETTE.archipelago = warm ? groups.gold.palette : originalIslands.archipelago;
    ISLAND_PALETTE.specialZone = warm ? groups.gold.palette : originalIslands.specialZone;
    requestMapRender(2);
  }
  new MutationObserver(sync).observe(intro, { attributes: true, attributeFilter: ['class'] });
  sync();
})();
