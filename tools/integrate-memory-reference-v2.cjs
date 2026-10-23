const fs=require('node:fs/promises'),path=require('node:path');
const root=path.resolve(__dirname,'..'),asset='assets/goi-viet/memory-reference-v2/';
const pct=n=>(n*100).toFixed(5)+'%';
const style=(r,f)=>`left:${pct((r[0]-f[0])/f[2])};top:${pct((r[1]-f[1])/f[3])};width:${pct(r[2]/f[2])};height:${pct(r[3]/f[3])}`;
(async()=>{
 const data=JSON.parse(await fs.readFile(path.join(root,asset,'layers.json'),'utf8'));
 const material=id=>data.materials.find(m=>m.id===id)?.file||id+'.webp';
 const image=(l,f,extra='')=>`<img class="mc-source-layer ${l.id} ${extra}" data-ref-layer="${l.id}" data-origin="${l.origin}" data-kind="${l.kind}" src="${asset+l.file}" style="${style(l.rect,f)}" width="${l.rect[2]}" height="${l.rect[3]}" alt="" loading="lazy" decoding="async">`;
 const family=(name,frame)=>data.layers.filter(l=>l.family===name).map(l=>image(l,frame)).join('\n');
 const bbox=(name)=>data.groups[name];
 const world=data.layers.filter(l=>l.family==='background'&&l.rect[1]<1190).map(l=>image(l,[0,0,971,1619])).join('\n');
 const exit=data.layers.filter(l=>(l.family==='background'&&l.rect[1]>=1190)||l.family==='exit').map(l=>image(l,bbox('exit'))).join('\n');
 const train=data.layers.filter(l=>l.family==='train').map(l=>image(l,[165,1463,383,78])).join('\n');
 const articles=[
  ['taste','Một vị nhà','Món gì khiến bạn nhớ bữa cơm nhà nhất?',1],
  ['story','Một chuyện cũ','Có chuyện nào ông bà vẫn thường kể?',2],
  ['tradition','Một nếp quen','Nhà mình còn giữ điều gì từ ngày xưa?',3]
 ].map(([name,title,question,number])=>`<article class="mc-memory mc-${name}" data-mc-reveal aria-labelledby="memory-${name}-title" style="${style(bbox(name),[0,0,971,1619])}"><div class="mc-art-group" aria-hidden="true">${family(name,bbox(name))}</div><div class="mc-memory-copy"><span class="mc-number" aria-hidden="true">0${number}</span><h3 id="memory-${name}-title">${title}</h3><p>${question}</p></div></article>`).join('\n');
 const html=`<div class="mc-seam" id="memorySeam" aria-hidden="true"><img src="${asset}seam-landscape.webp" alt="" width="2172" height="724"><canvas id="memorySeamCanvas"></canvas></div>
<section id="memoryChapter" class="mc mc-reference-v2" aria-labelledby="memoryTitle" aria-hidden="true" inert tabindex="-1">
 <div class="mc-content">
  <div class="mc-world" aria-hidden="true">${world}</div>
  <img class="mc-mobile-river" src="${asset}mobile-river.webp" alt="" aria-hidden="true" width="971" height="1246" loading="lazy">
  <header class="mc-introduction" data-mc-reveal>
   <p class="mc-eyebrow"><span></span>Từ những điều thân quen</p>
   <h2 id="memoryTitle">Có những điều<br>chỉ cần gợi, <em>là nhớ.</em></h2>
   <p class="mc-lead">Một tiếng gọi thân quen. Một mảnh quê nhà.</p>
  </header>
  ${articles}
  <section class="mc-conversation" aria-labelledby="memoryConversationTitle" data-mc-reveal style="${style([0,730,971,430],[0,0,971,1619])}">
   <div class="mc-tea mc-art-group" aria-hidden="true" style="${style(bbox('tea'),[0,730,971,430])}">${family('tea',bbox('tea'))}</div>
   <div class="mc-conversation-copy"><h2 id="memoryConversationTitle">Một lá bài mở.<br><em>Một câu chuyện được nối.</em></h2><p>Không cần trả lời đúng.<br>Chỉ cần lắng nghe nhau.</p><button id="memoryNextCard" class="mc-text-button" type="button" aria-controls="memoryCardQuestion">Thử một lời gợi khác <span aria-hidden="true">↻</span></button></div>
   <div class="mc-card-stack" data-mc-reveal>
    <div class="mc-card-under" aria-hidden="true"><img src="${asset+material('card-back')}" width="600" height="900" alt="" loading="lazy"></div>
    <div class="mc-card-tilt"><div class="mc-card-flipper" id="memoryCard">
     <div class="mc-card-front"><img class="mc-card-material" src="${asset+material('card-front')}" width="600" height="900" alt="" aria-hidden="true" loading="lazy"><div class="mc-card-frame"><p class="mc-card-category" id="memoryCardCategory">Vị nhà</p><div class="mc-card-question-frame"><p class="mc-card-question" id="memoryCardQuestion">Nếu được về nhà ăn một bữa, bạn muốn ăn món gì?</p></div></div></div>
     <div class="mc-card-reverse" aria-hidden="true"><img src="${asset+material('card-back')}" width="600" height="900" alt="" loading="lazy"></div>
    </div></div>
   </div>
   <div class="mc-card-source-fragment" aria-hidden="true">${family('card',[0,730,971,430])}</div>
   <p id="memoryCardAnnouncement" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></p>
  </section>
  <ol class="mc-steps" aria-label="Cách trải nghiệm hành trình" data-mc-reveal><li><span aria-hidden="true">01</span>Chọn một miền ký ức</li><li><span aria-hidden="true">02</span>Mở một lá bài</li><li><span aria-hidden="true">03</span>Cùng kể, cùng nghe</li></ol>
  <section class="mc-destination" aria-labelledby="memoryDestinationTitle" data-mc-reveal style="${style(bbox('exit'),[0,0,971,1619])}">
   <div class="mc-exit-world" aria-hidden="true">${exit}<div class="mc-train-group" data-mc-train style="${style([165,1463,383,78],bbox('exit'))}">${train}</div></div>
   <div class="mc-destination-copy"><h2 id="memoryDestinationTitle">Chuyện nhà mình,<br><em>nối thành chuyện quê hương.</em></h2><p>Bắt đầu từ một miền đất thân quen.</p><button id="memoryOpenMap" class="mc-primary mc-map-ticket" type="button" onclick="closeIntroModal()"><span class="mc-ticket-seal" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"><path d="m4 8 8-3 8 3 8-3v19l-8 3-8-3-8 3zM12 5v19M20 8v19"/><path d="m8 17 7-5 8 5" stroke-dasharray="2 2"/><circle cx="23" cy="17" r="2"/></svg></span><span class="mc-ticket-copy"><span class="mc-ticket-kicker" aria-hidden="true">Chuyến đi bắt đầu</span><span class="mc-ticket-title">Mở bản đồ ký ức</span></span><span class="mc-ticket-arrow" aria-hidden="true">→</span></button><p id="memoryMapStatus" class="mc-map-status" role="status" aria-live="polite"></p></div>
  </section>
 </div>
</section>
  </div>
</section>
`;
 const file=path.join(root,'map-surroundings-preview-3.html');let page=await fs.readFile(file,'utf8');
 const before=path.join(root,'verification/memory-reference-v2/before.html');try{await fs.access(before);}catch{await fs.writeFile(before,page);}
 const start=page.includes('<div class="mc-seam"')?page.indexOf('<div class="mc-seam"'):page.indexOf('    <section id="memoryChapter"');
 const end=page.indexOf('<div id="memoryMapTransition"');if(start<0||end<=start)throw new Error('Chapter integration markers not found');
 page=page.slice(0,start)+html+page.slice(end);
 page=page.replace(/memory-chapter-3\.css\?[^"\s]+/,'memory-reference-v2.css?v=20261019-exact-1').replace(/memory-chapter-3\.js\?[^"\s]+/,'memory-reference-v2.js?v=20261019-exact-1');
 if(!page.includes('data-memory-unlocked='))page=page.replace('<section id="introScreen"','<section id="introScreen" data-memory-unlocked="false"');
 const fallback=`window.GoiVietMemoryChapter ? window.GoiVietMemoryChapter.begin() : (document.getElementById('introScreen').dataset.memoryUnlocked='true',document.getElementById('memoryChapter').inert=false,document.getElementById('memoryChapter').removeAttribute('aria-hidden'),document.getElementById('memoryChapter').scrollIntoView())`;
 page=page.replace(/(<button[^>]*id="btnQuickStartWelcome"[^>]*onclick=")[^"]*(")/,`$1${fallback}$2`);
 page=page.replace(/(<button[^>]*id="btnProceedToGuide"[^>]*onclick=")[^"]*(")/,`$1${fallback}$2`).replace('>Xem cách chơi</button>','>Dạo một miền ký ức</button>');
 page=page.replace(/(memory-reference-v2\.(?:css|js)\?)[^"\s]+/g,(_,prefix)=>prefix+'v=20261019-seam-ticket-4');
 page=page.replace(/<a class="mc-scroll-cue"[^>]*>[\s\S]*?<\/a>/,`<button type="button" class="mc-scroll-cue" aria-controls="memoryChapter" onclick="${fallback}"><span>Mở một miền ký ức</span><span aria-hidden="true">↓</span></button>`);
 await fs.writeFile(file,page);await fs.writeFile(path.join(root,asset,'chapter-fragment.html'),html);
 console.log(JSON.stringify({referenceCanvas:[971,1619],layerImages:data.layers.length,updated:file}));
})().catch(e=>{console.error(e);process.exitCode=1;});
