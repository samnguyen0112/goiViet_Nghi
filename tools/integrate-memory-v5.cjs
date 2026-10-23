// Register real HTML over independent native rasters against the approved chapter.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const base = 'assets/goi-viet/memory-reference-v5/';
const W = 795, H = 1458;
const old = JSON.parse(fs.readFileSync(path.join(root, 'assets/goi-viet/memory-native-v4/assets.json'))).assets;
const native = id => JSON.parse(fs.readFileSync(path.join(root, base, id + '.json')));
const pct = (n, d) => (n / d * 100).toFixed(5) + '%';
const pos = ([x,y,w,h], f = [0,0,W,H]) => { f ||= [0,0,W,H]; return `left:${pct(x-f[0],f[2])};top:${pct(y-f[1],f[3])};width:${pct(w,f[2])};height:${h == null ? 'auto' : pct(h,f[3])}`; };
function img(id, cls, rect, frame, reuse = false, sizes) {
  const a = reuse ? old[id] : native(id);
  const prefix = reuse ? 'assets/goi-viet/memory-native-v4/' : base;
  const set = [...a.variants.map(v => `${prefix+v.file} ${v.width}w`), `${prefix+a.file} ${a.width}w`].join(', ');
  return `<img class="mc-source-layer n5-image ${cls}" data-ref-layer="${id}" data-native-asset="${id}" data-origin="individual-native-generation" src="${prefix+a.file}" srcset="${set}" sizes="${sizes || `(max-width:700px) 85vw, ${pct(rect[2],W).replace('%','vw')}`}" width="${a.width}" height="${a.height}" style="${pos(rect,frame)}" alt="" loading="lazy" decoding="async">`;
}
const groups = {taste:[0,322,450,270],story:[447,84,348,360],tradition:[365,460,430,180],conversation:[0,680,W,380],tea:[0,620,315,394],exit:[0,1064,W,394]};
const taste = img('taste-tray-foliage','n5-tray',[0,335,340],groups.taste,true)
  +img('pho-bowl','n5-pho',[16,376,246],groups.taste,true)
  +img('sauce-dish','n5-sauce',[246,494,68],groups.taste,true)
  +'<svg class="n5-steam" viewBox="0 0 50 100" aria-hidden="true"><path d="M15 95C-8 73 40 65 17 42S29 12 22 2M32 92C14 68 51 57 34 36S43 13 37 4" fill="none" stroke="#fff9e7" stroke-width="2.5" stroke-linecap="round"/></svg>';
const story = img('village-gate','n5-gate',[447,84,348],groups.story,true)+img('bicycle','n5-bicycle',[698,249,64],groups.story,true);
const tradition = img('weaving-hands-basket','n5-weaving',[385,465,270],groups.tradition,true);
const tea = img('tea-window-table','n5-tea-support',[0,620,315],groups.tea,true)
  +img('family-letter','n5-tea-letter',[78,941,120],groups.tea,true)
  +img('tea-pot','n5-teapot',[108,845,101],groups.tea,true)
  +img('tea-cups','n5-cups',[170,903,103],groups.tea,true);
let html = fs.readFileSync(path.join(root,'map-surroundings-preview-3.html'),'utf8');
html = html.replace('class="mc mc-reference-v2 mc-native-v4"','class="mc mc-reference-v2 mc-native-v4 mc-reference-v5"');
const riverId = 'river-registered';
const world = img('chapter-ridges','n5-ridges',[0,-6,W]) + img(riverId,'n5-river',[0,0,W]);
html = html.replace(/<div class="mc-world"[^>]*>[\s\S]*?<\/div>/,`<div class="mc-world" aria-hidden="true">${world}</div>`);
html = html.replace(/<img[^>]*class="[^"]*mc-mobile-river[^>]*>/, img(riverId,'mc-mobile-river n5-mobile-river',[0,0,W],null,false,'150vw'));
for (const [name,art] of Object.entries({taste,story,tradition})) {
  const re = new RegExp(`(<article class="mc-memory mc-${name}"[^>]*style=")[^"]*("[^>]*><div class="mc-art-group"[^>]*>)[\\s\\S]*?(<\\/div><div class="mc-memory-copy">)`);
  if (!re.test(html)) throw Error('Missing group '+name);
  html = html.replace(re,`$1${pos(groups[name])}$2${art}$3`);
}
html = html.replace(/(<section class="mc-conversation"[^>]*style=")[^"]*(")/,`$1${pos(groups.conversation)}$2`);
html = html.replace(/<div class="mc-tea mc-art-group"[^>]*>[\s\S]*?<\/div>/,`<div class="mc-tea mc-art-group" aria-hidden="true" style="${pos(groups.tea,groups.conversation)}">${tea}</div>`);
const exitStart = html.indexOf('<section class="mc-destination');
const exitEnd = html.indexOf('</section>',exitStart)+10;
const copy = html.slice(exitStart,exitEnd).match(/<div class="mc-destination-copy">[\s\S]*?<\/div>/)?.[0];
if (!copy) throw Error('Destination copy missing');
const f = [0,0,W,394];
let scene = img('bay-water','n5-bay',[0,0,W],f,false,'(max-width:700px) 795px, 100vw')
  +img('bay-left-shore','n5-left-shore',[0,26,285],f)
  +img('bay-right-shore','n5-right-shore',[573,46,222],f);
const boats = [[421,210,26],[469,195,14],[571,210,25],[609,203,20],[650,198,10],[704,185,15]];
for (const [i,rect] of boats.entries()) scene += img('sailboat-single','n5-boat n5-boat-'+i,rect,f,false,'(max-width:700px) 30px, 4vw');
scene += img('station-palms','n5-station',[448,219,245],f)
  +img('bridge-causeway','n5-bridge',[0,229,W],f,false,'(max-width:700px) 100vw, 100vw');
const trainId = fs.existsSync(path.join(root,base,'train-right-refined.json')) ? 'train-right-refined' : 'train-right';
const train = native(trainId), tw = 350, th = tw * train.height/train.width;
scene += `<div class="mc-train-group n5-train" data-mc-train data-mc-reveal style="${pos([30,222,tw,th],f)}">`
  +img(trainId,'n5-train-art',[0,0,tw],[0,0,tw,th],false,'(max-width:700px) 350px, 44vw')+'</div>'
  +img('foreground-frame','n5-foreground',[0,132,W],f,false,'(max-width:700px) 795px, 100vw');
html = html.slice(0,exitStart)+`<section class="mc-destination n4-destination n5-destination" aria-labelledby="memoryDestinationTitle" data-mc-reveal style="${pos(groups.exit)}"><div class="mc-exit-world" aria-hidden="true">${scene}</div>${copy}</section>`+html.slice(exitEnd);
if (!html.includes('memory-reference-v5.css')) html = html.replace('</head>','<link rel="stylesheet" href="assets/goi-viet/map-surroundings-preview/memory-reference-v5.css?v=20261020-reference-1">\n</head>');
html = html.replace(/memory-reference-v5\.css\?[^"\s]+/g,'memory-reference-v5.css?v=20261020-reference-final');
html = html.replace('home-classic-3.css?v=20261020-station-refined"','home-classic-3.css?v=20261020-station-refined-fit"');
fs.writeFileSync(path.join(root,'map-surroundings-preview-3.html'),html);
fs.writeFileSync(path.join(root,base,'composition.json'),JSON.stringify({frame:[W,H],reference:'references/chapter.png',groups,river:{id:riverId,rect:[0,0,795,1458.64471]},boats,station:[448,219,245],bridge:{id:'bridge-causeway',rect:[0,229,795],rotation:-2.7},railSlope:.15,train:{id:trainId,rect:[30,222,tw,th],direction:'right',coaches:'rear red, blue, green, front red',rotation:3.8},nativeGeometry:true},null,2));
const records = fs.readdirSync(path.join(root,base)).filter(n=>n.endsWith('.json')&&!['composition.json','assets.json'].includes(n)).map(n=>JSON.parse(fs.readFileSync(path.join(root,base,n)))).filter(a=>a.id&&a.source&&a.file);
fs.writeFileSync(path.join(root,base,'assets.json'),JSON.stringify({version:5,method:'Separate native ImageGen layers; unmodified PNG originals and lossless native WebP. Responsive exports downsample only.',assets:records},null,2));
console.log(JSON.stringify({chapter:[W,H],newAssets:records.length,train:trainId}));
// Preserve the subsequent rail/architecture/smoke refinement when rebuilding v5.
if (fs.existsSync(path.join(root,'assets/goi-viet/memory-rail-v6/geometry.json'))) require('./integrate-memory-rail-v6.cjs');
