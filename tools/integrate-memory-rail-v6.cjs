// A common rail-space projection owns infrastructure, train and wheel contact.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),base='assets/goi-viet/memory-rail-v6/';
const config=JSON.parse(fs.readFileSync(path.join(root,base,'geometry.json')));
const asset=id=>JSON.parse(fs.readFileSync(path.join(root,base,id+'.json')));
const pc=(n,d)=>(n/d*100).toFixed(7)+'%';
function image(id,cls,rect,frame=[795,394]){
 const a=asset(id),[x,y,w]=rect;
 const set=[...a.variants.map(v=>base+v.file+' '+v.width+'w'),base+a.file+' '+a.width+'w'].join(', ');
 return `<img class="mc-source-layer n6-image ${cls}" data-ref-layer="${id}" data-native-asset="${id}" src="${base+a.file}" srcset="${set}" sizes="${cls.includes('train')?'45vw':'110vw'}" width="${a.width}" height="${a.height}" style="left:${pc(x,frame[0])};top:${pc(y,frame[1])};width:${pc(w,frame[0])};height:auto" alt="" loading="lazy" decoding="async">`;
}
let html=fs.readFileSync(path.join(root,'map-surroundings-preview-3.html'),'utf8');
const start=html.indexOf('<section class="mc-destination'),end=html.indexOf('</section>',start)+10;
let section=html.slice(start,end);
// Remove a previous v6 integration before replacing the v5 station/bridge/train range.
if(section.includes('n6-rail-space')){
 const oldStart=section.indexOf('<div class="n6-rail-space"'),oldEnd=section.indexOf('<img class="mc-source-layer n5-image n5-foreground',oldStart);
 section=section.slice(0,oldStart)+section.slice(oldEnd);
}else{
 const oldStart=section.indexOf('<img class="mc-source-layer n5-image n5-station'),oldEnd=section.indexOf('<img class="mc-source-layer n5-image n5-foreground',oldStart);
 if(oldStart<0||oldEnd<0)throw Error('Expected station through train markup');
 section=section.slice(0,oldStart)+section.slice(oldEnd);
}
const t=config.train,a=asset(t.id),height=t.width*a.height/a.width;
const ellipses=t.wheels.map(w=>`<ellipse cx="${w.x}" cy="${w.y+.2}" rx="${w.radius*.8}" ry=".48"/>`).join('');
function coachCanvas(p,index){
 const left=Math.floor(a.width*p.clip[0]/100),right=Math.ceil(a.width*p.clip[1]/100),width=right-left;
 return `<canvas class="n7-coach-wheels" width="${width}" height="${a.height}" data-native-left="${left}" data-coach-index="${index}" style="left:${pc(left,a.width)};width:${pc(width,a.width)}" aria-hidden="true"></canvas>`;
}
const parts=t.parts.map((p,index)=>`<div class="n6-train-part" data-train-part="${index}" style="clip-path:inset(-100% ${100-p.clip[1]}% -100% ${p.clip[0]}%);transform:translateY(${pc(p.offset,height)}) matrix(1,${p.shear},0,1,0,0)">${image(t.id,'n6-train-art',[0,0,t.width],[t.width,height])}${index===4?`<canvas class="n7-native-wheels" width="${a.width}" height="${a.height}" data-native-src="${base+a.file}" data-travel="${-config.motion.from[0]}" data-radius="${47*t.width/a.width}" aria-hidden="true"></canvas><i class="n6-chimney" style="left:${pc(t.chimney[0],t.width)};top:${pc(t.chimney[1],height)}"></i>`:coachCanvas(p,index)}</div>`).join('');
const contacts=t.wheels.map((w,index)=>`<i class="n6-wheel-contact" data-wheel="${index}" style="left:${pc(w.x,t.width)};top:${pc(w.y,height)}"></i>`).join('');
const train=`<div class="mc-train-group n5-train n6-train" data-mc-train data-mc-reveal style="left:${pc(t.x,795)};top:${pc(t.y,394)};width:${pc(t.width,795)};height:${pc(height,394)};--n6-arrival-duration:${config.motion.duration}ms"><svg class="n6-contact-shadow" viewBox="0 0 ${t.width} ${height}" aria-hidden="true">${ellipses}</svg>${parts}${contacts}</div>`;
const railY=x=>config.rail.authoringIntercept+config.rail.authoringSlope*x;
const rail=`<svg class="n6-rail-contact" viewBox="0 0 795 394" preserveAspectRatio="none" aria-hidden="true"><path d="M-32 ${railY(-32)}L827 ${railY(827)}" fill="none" stroke="#9d8669" stroke-width=".65"/><path d="M-32 ${railY(-32)-.25}L827 ${railY(827)-.25}" fill="none" stroke="#d0b993" stroke-width=".25"/></svg>`;
const geometry=`<div class="n6-rail-space" style="--n6-camera-shear:${config.cameraShear}">${image(config.infrastructureId,'n6-infrastructure',config.infrastructure)}${rail}${train}</div><canvas class="n6-smoke" aria-hidden="true"></canvas>`;
section=section.replace('<img class="mc-source-layer n5-image n5-foreground',geometry+'<img class="mc-source-layer n5-image n5-foreground');
section=section.replace('class="mc-exit-world"','class="mc-exit-world n6-exit-world"');
html=html.slice(0,start)+section+html.slice(end);
const css='assets/goi-viet/map-surroundings-preview/memory-rail-v6.css',js='assets/goi-viet/map-surroundings-preview/memory-train-smoke-v6.js';
if(!html.includes(css))html=html.replace('</head>',`<link rel="stylesheet" href="${css}?v=20261021-soft-white-3">\n<script src="${js}?v=20261021-soft-white-3" defer></script>\n</head>`);
html=html.replace(/memory-rail-v6\.css\?[^"\s]+/g,'memory-rail-v6.css?v=20261021-soft-white-3').replace(/memory-train-smoke-v6\.js\?[^"\s]+/g,'memory-train-smoke-v6.js?v=20261021-soft-white-3');
const wheelsJs='assets/goi-viet/map-surroundings-preview/memory-train-wheels-v7.js',wheelVersion='20261021-all-native-wheels-1';
html=html.replace(/memory-rail-v6\.css\?[^"\s]+/g,`memory-rail-v6.css?v=${wheelVersion}`);
if(!html.includes(wheelsJs))html=html.replace('</head>',`<script src="${wheelsJs}?v=${wheelVersion}" defer></script>\n</head>`);
html=html.replace(/memory-train-wheels-v7\.js\?[^"\s]+/g,`memory-train-wheels-v7.js?v=${wheelVersion}`);
fs.writeFileSync(path.join(root,'map-surroundings-preview-3.html'),html);
fs.writeFileSync(path.join(root,base,'assets.json'),JSON.stringify({version:6,assets:[config.infrastructureId,t.id].map(asset)},null,2));
console.log(JSON.stringify({infrastructure:config.infrastructure,train:{...t,height},cameraShear:config.cameraShear}));
