// Recompose the existing live chapter from independently generated native assets.
const fs = require('node:fs/promises'), path = require('node:path');
const root = path.resolve(__dirname, '..'), base = 'assets/goi-viet/memory-native-v4/';
(async () => {
  const manifest = JSON.parse(await fs.readFile(path.join(root, base, 'assets.json'), 'utf8'));
  const a = manifest.assets, W = 971, H = 1776;
  const percent = (n, d) => (n / d * 100).toFixed(5) + '%';
  const position = ([x,y,w,h], frame = [0,0,W,H]) => `left:${percent(x-frame[0],frame[2])};top:${percent(y-frame[1],frame[3])};width:${percent(w,frame[2])};${h == null ? 'height:auto' : 'height:'+percent(h,frame[3])}`;
  const srcset = id => [...a[id].variants.map(v => `${base+v.file} ${v.width}w`), `${base+a[id].file} ${a[id].width}w`].join(', ');
  const img = (id, cls, rect, frame, sizes = null, extra = '') => {
    const responsive = sizes || `(max-width:700px) 80vw, ${(rect[2]/W*100).toFixed(2)}vw`;
    return `<img class="mc-source-layer n4-image ${cls}" data-ref-layer="${id}" data-native-asset="${id}" data-origin="individual-native-generation" src="${base+a[id].file}" srcset="${srcset(id)}" sizes="${responsive}" width="${a[id].width}" height="${a[id].height}" style="${position(rect,frame)}" alt="" loading="lazy" decoding="async" ${extra}>`;
  };
  const layer = (id, cls, x,y,w,h = null) => img(id,cls,[x,y,w,h]);
  const groups = { taste:[0,274,550,388], story:[517,122,454,360], tradition:[425,483,546,260], tea:[0,685,418,482], conversation:[0,730,971,430], exit:[0,1230,971,546] };
  const local = (id,cls,rect,frame) => img(id,cls,rect,frame);
  const taste = local('taste-tray-foliage','n4-taste-base',[0,354,450,null],groups.taste) +
    local('pho-bowl','n4-pho',[30,404,310,null],groups.taste) +
    local('sauce-dish','n4-sauce',[305,559,82,null],groups.taste) +
    '<svg class="n4-steam" viewBox="0 0 50 100" aria-hidden="true"><path d="M15 95C-8 73 40 65 17 42S29 12 22 2M32 92C14 68 51 57 34 36S43 13 37 4" fill="none" stroke="#fff9e7" stroke-width="3" stroke-linecap="round"/></svg>';
  const story = local('village-gate','n4-gate',[550,110,410,null],groups.story) +
    local('bicycle','n4-bicycle',[817,293,105,null],groups.story) +
    local('family-letter','n4-letter',[565,330,200,null],groups.story);
  const tradition = local('weaving-hands-basket','n4-weaving',[425,483,390,null],groups.tradition);
  const tea = local('tea-window-table','n4-tea-support',[0,685,386,null],groups.tea) +
    local('family-letter','n4-tea-letter',[95,1055,143,null],groups.tea) +
    local('tea-pot','n4-teapot',[165,970,133,null],groups.tea) +
    local('tea-cups','n4-cups',[233,1027,141,null],groups.tea);
  const world = layer('chapter-mountains-left','n4-upper-left',0,0,440) +
    layer('chapter-mountains-right','n4-upper-right',490,0,481) +
    layer('chapter-mountains-left','n4-upper-distance',205,-30,570) +
    layer('cloud-scroll','n4-upper-cloud-left',-45,20,220) +
    layer('cloud-scroll','n4-upper-cloud-right',810,44,230) +
    // The river includes its own continuous painted banks. Extra rectangular
    // foliage cutouts created hard seams beside the letter and basket.
    layer('river-continuous','n4-river-continuous',0,25,971,1205);
  const file = path.join(root, 'map-surroundings-preview-3.html');
  let html = await fs.readFile(file, 'utf8');
  const backup = path.join(root, 'verification/memory-native-v4/before-native.html');
  try { await fs.access(backup); } catch { await fs.writeFile(backup, html); }
  html = html.replace('class="mc mc-reference-v2"', 'class="mc mc-reference-v2 mc-native-v4"');
  html = html.replace(/<div class="mc-world"[^>]*>[\s\S]*?<\/div>/, `<div class="mc-world" aria-hidden="true">${world}</div>`);
  for (const [name, art] of Object.entries({ taste, story, tradition })) {
    const re = new RegExp(`(<article class="mc-memory mc-${name}"[^>]*style=")[^"]*("[^>]*><div class="mc-art-group"[^>]*>)[\\s\\S]*?(<\\/div><div class="mc-memory-copy">)`);
    if (!re.test(html)) throw Error('Missing artwork group: '+name);
    html = html.replace(re, `$1${position(groups[name])}$2${art}$3`);
  }
  html = html.replace(/(<section class="mc-conversation"[^>]*style=")[^"]*(")/, `$1${position(groups.conversation)}$2`);
  html = html.replace(/<div class="mc-tea mc-art-group"[^>]*>[\s\S]*?<\/div>/, `<div class="mc-tea mc-art-group" aria-hidden="true" style="${position(groups.tea,groups.conversation)}">${tea}</div>`);
  html = html.replace(/<img[^>]*class="[^"]*mc-mobile-river[^>]*>/, img('river-continuous','mc-mobile-river n4-mobile-river',[0,0,100,100],[0,0,100,100],'100vw','aria-hidden="true"'));
  html = html.replace(/<img[^>]*src="assets\/goi-viet\/(?:memory-reference-v2\/card-front-hd|memory-native-v4\/card-front)\.webp"[^>]*>/g,
    img('card-front','mc-card-material',[0,0,100,100],[0,0,100,100],'(max-width:700px) 250px, 26vw','aria-hidden="true"'));
  html = html.replace(/<img[^>]*src="assets\/goi-viet\/(?:memory-reference-v2\/card-back-hd|memory-native-v4\/card-back)\.webp"[^>]*>/g,
    img('card-back','',[0,0,100,100],[0,0,100,100],'(max-width:700px) 250px, 28vw','aria-hidden="true"'));
  const start = html.indexOf('<section class="mc-destination'), end = html.indexOf('</section>',start)+10;
  if (start < 0 || end < start) throw Error('Destination marker missing');
  const old = html.slice(start,end), copy = old.match(/<div class="mc-destination-copy">[\s\S]*?<\/div>/)?.[0];
  if (!copy) throw Error('Live destination copy missing');
  // Perspective is painted into the new assets; no CSS skew or rotation.
  const f = [0,0,971,546], railSlope = .145;
  const sceneImage = (id,cls,rect,sizes) => img(id,cls,rect,f,sizes);
  const scene = sceneImage('station-perspective-scene','n4-perspective-scene',[0,0,971,546],'(max-width:700px) 760px, 100vw') +
    '<div class="n4-station n4-station-bounds" style="'+position([569,380,167,76],f)+'"></div>' +
    '<div class="mc-train-group n4-arriving-train n4-perspective-train" data-mc-train data-mc-reveal style="'+position([38,325,457,107],f)+'">'+
    sceneImage('train-perspective-v2','n4-painted-train',[0,0,100,100],'(max-width:700px) 360px, 48vw').replace(/style="[^"]*"/, 'style="left:0;top:0;width:100%;height:100%"')+'</div>';
  const destination = `<section class="mc-destination n4-destination" aria-labelledby="memoryDestinationTitle" data-mc-reveal style="${position(groups.exit)}"><div class="mc-exit-world" aria-hidden="true">${scene}</div>${copy}</section>`;
  html = html.slice(0,start)+destination+html.slice(end);
  const nativeCSS = '<link rel="stylesheet" href="assets/goi-viet/map-surroundings-preview/memory-native-v4.css?v=20261019-native-2">';
  if (!html.includes('memory-native-v4.css')) html = html.replace(/(<link rel="stylesheet" href="assets\/goi-viet\/map-surroundings-preview\/memory-reference-v2.css[^>]+>)/, '$1\n'+nativeCSS);
  html = html.replace(/memory-native-v4\.css\?[^"\s]+/g,'memory-native-v4.css?v=20261019-letter-polish-2');
  html = html.replace(/(<div class="mc-seam"[^>]*>)[\s\S]*?(<canvas id="memorySeamCanvas"><\/canvas><\/div>)/,
    `$1${img('chapter-mountains-left','n4-seam-left',[0,0,60,100],[0,0,100,100],'60vw')}${img('chapter-mountains-right','n4-seam-right',[40,0,60,100],[0,0,100,100],'60vw')}$2`);
  await fs.writeFile(file,html);
  await fs.writeFile(path.join(root,base,'composition.json'),JSON.stringify({ frame:[W,H],groups, railSlope, railIntercept:364, wheelContacts:[[54,171],[211,188],[350,205],[543,226],[685,243],[900,270],[1060,292],[1370,331],[1540,345],[1635,361],[1735,379],[1835,394]], perspective:'painted three-quarter reference viewpoint; no affine distortion', station:[569,380,167,76], train:[38,325,457,107], stationGap:74, river:'single continuous native generation', generatedAssets:Object.keys(a).length, trainAssembly:'single coherent perspective cutout', nativeOnly:true },null,2));
  console.log(JSON.stringify({ updated:file,generatedAssets:Object.keys(a).length,frame:[W,H],perspective:true }));
})().catch(error=>{console.error(error);process.exitCode=1;});
