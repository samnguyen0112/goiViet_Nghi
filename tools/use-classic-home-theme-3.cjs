const fs=require('node:fs/promises'),path=require('node:path');
const root=path.resolve(__dirname,'..');
function stage(html){
 const begin=html.indexOf('<div id="introWelcomeStage"');if(begin<0)throw Error('Welcome stage missing');
 const re=/<\/?div\b[^>]*>/g;re.lastIndex=begin;let depth=0,m;
 while((m=re.exec(html))){depth+=m[0].startsWith('</')?-1:1;if(!depth)return {begin,end:re.lastIndex,text:html.slice(begin,re.lastIndex)};}
 throw Error('Unclosed welcome stage');
}
(async()=>{
 const file=path.join(root,'map-surroundings-preview-3.html');
 let html=await fs.readFile(file,'utf8');const old=await fs.readFile(path.join(root,'map-surroundings-preview-2.html'),'utf8');
 const before=stage(html),reference=stage(old);let next=reference.text;
 const earlier=await fs.readFile(path.join(root,'verification/classic-home-theme-3/before-welcome.html'),'utf8');
 for(const id of ['btnHomeOpeningSkip','btnHomeOpeningReplay']){
  const re=new RegExp('<button\\b[^>]*id="'+id+'"[\\s\\S]*?<\\/button>');
  const control=earlier.match(re)?.[0];if(!control)throw Error('Missing original control '+id);
  next=next.replace(re,control);
 }
 next=next.replace(/<summary>[\s\S]*?<\/summary>/,earlier.match(/<summary>[\s\S]*?<\/summary>/)[0]);
 const out=path.join(root,'verification/classic-home-theme-3');await fs.mkdir(out,{recursive:true});
 if(!html.includes('data-home-theme="classic"'))await fs.writeFile(path.join(out,'before-welcome.html'),before.text);
 next=next.replace(/<p class="gv-home-verse"[\s\S]*?<\/p>/,`<p class="gv-home-verse" data-home-enter="6.6,7.9,9"><span>Mở chuyện nhà mình.</span><span>Một lá bài nhỏ, một khoảng gần nhau.</span></p>`);
 next=next.replace('Sân ga đoàn viên · Lời mời khởi hành xuyên Việt','Gói tinh hoa · Mở kết nối')
  .replace('Cùng gia đình khám phá văn hóa Việt Nam','Có những điều, gợi là nhớ.')
  .replace('Chọn một địa điểm, đọc câu chuyện và rút lá bài để cùng chia sẻ kỷ niệm.','Lật một lá bài, cùng nhau kể chuyện quê hương.')
  .replace('Cả nhà dùng chung một thiết bị, không cần đăng nhập.','Cùng gia đình · Không cần đăng nhập')
  .replace('36 điểm hẹn di sản','Chọn miền thân quen').replace('34 tỉnh thành &amp; 2 quần đảo','Bắt đầu từ một nơi bạn nhớ')
  .replace('Lật thẻ, mở chuyện Việt','Lật một lá bài nhỏ').replace('Một phút sẻ chia và lắng nghe','Gợi một món ăn, một chuyện cũ')
  .replace('Cả nhà chung hành trình','Kể chuyện nhà mình')
  .replace('<span class="gv-invitation-feature-phrase">Chung một thiết bị ·</span> <span class="gv-invitation-feature-phrase">Không chấm điểm</span>','Cùng sẻ chia, cùng lắng nghe');
 const begin='window.GoiVietMemoryChapter.begin()';
 next=next.replace('onclick="closeIntroModal()">Bắt đầu khám phá','onclick="'+begin+'">Mở câu chuyện đầu tiên');
 next=next.replace(/<button\b[^>]*id="btnProceedToGuide"[\s\S]*?<\/button>/,`<button type="button" class="mc-scroll-cue classic-next-cue" aria-label="Mở miền ký ức" aria-controls="memoryChapter" data-home-enter="10.5,11.6,7" onclick="${begin}"><svg viewBox="0 0 24 32" fill="none" aria-hidden="true"><path d="M12 3v25m-7-7 7 7 7-7"/></svg></button>`);
 // Regional shortcuts keep their selected destination but enter the memory
 // chapter before the map, consistently with preview-3's existing journey.
 next=next.replaceAll(";closeIntroModal()",';window.GoiVietMemoryChapter.begin()');
 for(const [region,city]of [['Bắc','Hà Nội'],['Trung','Cố đô Huế'],['Nam','TP.HCM']]){
  next=next.replace(`<span>Ga miền ${region} <span aria-hidden="true">·</span> <strong>${city}</strong></span>`,`<span class="classic-station-copy"><small>Ga miền ${region}</small><strong>${city}</strong></span>`);
 }
 html=html.slice(0,before.begin)+next+html.slice(before.end);
 html=html.replace(/<link[^>]+href="assets\/goi-viet\/map-surroundings-preview\/(?:home-controls-3|home-story-3|home-details-3|home-invitation-3|invitation-card-3|invitation-memory-4)\.css[^>]*>\s*/g,'');
 if(!html.includes('data-home-theme="classic"'))html=html.replace('data-preview-version="3"','data-preview-version="3" data-home-theme="classic"');
 if(!html.includes('home-classic-3.css'))html=html.replace('</head>','<link rel="stylesheet" href="assets/goi-viet/map-surroundings-preview/home-classic-3.css?v=20261019-1">\n</head>');
 html=html.replace(/home-classic-3\.css\?v=[^"]+/,'home-classic-3.css?v=20261019-2');
 html=html.replace('</head>','<link rel="stylesheet" href="assets/goi-viet/map-surroundings-preview/home-controls-3.css?v=20261019-restored">\n</head>');
 html=html.replace(/homepage-layered-scene\.js\?v=[^"]+/,'homepage-layered-scene.js?v=classic-home-20261019');
 await fs.writeFile(file,html);
 console.log('Preview-3 now uses classic preview-2 homepage artwork and fonts with current copy.');
})().catch(e=>{console.error(e);process.exitCode=1;});
