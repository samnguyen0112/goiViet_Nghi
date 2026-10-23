// Capture the actual scroll surface in tiles, so offscreen masked images paint.
const fs = require('node:fs/promises'), path = require('node:path');
const {chromium} = require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp = require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = path.resolve(__dirname,'..'), out = path.join(root,'verification/memory-reference-v5');
(async()=>{
 await fs.mkdir(out,{recursive:true});
 const browser = await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const report = {screens:[],errors:[]};
 try {
  for(const width of [795,1440,390,320]) {
   const page = await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
   page.on('pageerror',e=>report.errors.push(e.message));
   await page.goto('file:///'+root.replaceAll('\\','/')+'/map-surroundings-preview-3.html');
   await page.waitForFunction(()=>window.GoiVietMemoryChapter&&window.GoiVietHomeIntro);
   await page.evaluate(async()=>{
    window.GoiVietHomeIntro.skip(); window.GoiVietMemoryChapter.begin();
    await document.fonts.ready;
    await Promise.all([...document.querySelectorAll('#memoryChapter img')].map(async image=>{
     image.loading='eager'; try{await image.decode();}catch{}
    })); document.activeElement.blur();
   });
   const info = await page.evaluate(()=>{
    const intro=document.getElementById('introScreen'),chapter=document.getElementById('memoryChapter');
    return {height:Math.round(chapter.getBoundingClientRect().height),
     y:chapter.getBoundingClientRect().top+intro.scrollTop-intro.getBoundingClientRect().top,
     overflow:intro.scrollWidth>innerWidth,
     missing:[...chapter.querySelectorAll('img')].filter(i=>!i.naturalWidth).map(i=>i.src)};
   });
   const tiles=[];
   for(let offset=0;offset<info.height;) {
    await page.locator('#introScreen').evaluate((el,y)=>el.scrollTo({top:y,behavior:'instant'}),info.y+offset);
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    const clipY=await page.locator('#memoryChapter').evaluate((el,y)=>Math.max(0,Math.round(el.getBoundingClientRect().top+y)),offset);
    const height=Math.min(900-clipY,info.height-offset);
    if(height<=0)throw Error('Capture made no progress');
    tiles.push({input:await page.screenshot({clip:{x:0,y:clipY,width,height}}),left:0,top:offset});
    offset+=height;
   }
   await sharp({create:{width,height:info.height,channels:3,background:'#fcf0d8'}}).composite(tiles).png().toFile(path.join(out,`chapter-${width}.png`));
   report.screens.push({width,...info}); await page.close();
  }
  const after = path.join(out,'chapter-795.png');
  await sharp(after).extract({left:0,top:1064,width:795,height:394}).png().toFile(path.join(out,'exit-final.png'));
  const reference=await sharp(path.join(root,'assets/goi-viet/memory-reference-v5/references/chapter.png')).resize(795,1458).png().toBuffer();
  const before=await sharp(path.join(out,'before-chapter.png')).resize({width:795}).extend({bottom:4,background:'#fcf0d8'}).png().toBuffer();
  const caption=(label)=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="795" height="55"><rect width="795" height="55" fill="#f7edd8"/><text x="397" y="35" text-anchor="middle" font-family="Georgia" font-size="24" fill="#174f44">${label}</text></svg>`);
  await sharp({create:{width:2385,height:1513,channels:3,background:'#fcf0d8'}}).composite([
   {input:caption('Ảnh tham chiếu'),left:0,top:0},{input:caption('Trước khi sửa'),left:795,top:0},{input:caption('Preview 3 đã cập nhật'),left:1590,top:0},
   {input:reference,left:0,top:55},{input:before,left:795,top:55},{input:await fs.readFile(after),left:1590,top:55}
  ]).png().toFile(path.join(out,'reference-before-after.png'));
  await fs.writeFile(path.join(out,'visual-checks.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
