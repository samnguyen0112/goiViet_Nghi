const fs=require('node:fs/promises'),path=require('node:path');
const {chromium}=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
(async()=>{
const out=path.resolve(__dirname,'../verification/memory-chapter-3');process.env.TEMP=process.env.TMP=path.join(out,'browser-temp');
const b=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
try{
const page=await b.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
await page.goto('http://127.0.0.1:8765/map-surroundings-preview-3.html',{waitUntil:'load'});
await page.evaluate(async()=>{window.GoiVietHomeIntro.skip();await document.fonts.ready;window.GoiVietMemoryChapter.begin();});
await page.locator('.mc-destination').evaluate(el=>el.scrollIntoView({behavior:'instant'}));
await page.locator('.mc img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode().catch(()=>{}))));
const height=await page.locator('#memoryChapter').evaluate(el=>el.offsetHeight);
const top=await page.locator('#memoryChapter').evaluate(el=>el.offsetTop);
const tiles=[];
for(let y=0;y<height;y+=850){const target=Math.max(0,Math.min(y,height-900));await page.locator('#introScreen').evaluate((el,t)=>el.scrollTop=t,top+target);await page.waitForTimeout(60);const png=await page.screenshot();tiles.push({input:png,top:target,left:0});}
const stitched=await sharp({create:{width:1440,height,channels:4,background:'#fcf1dc'}}).composite(tiles).png().toBuffer();
await sharp(stitched).resize({width:1000}).png().toFile(path.join(out,'chapter-desktop-full.png'));
await page.setViewportSize({width:390,height:844});
await page.locator('#introScreen').evaluate(el=>el.scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(100);
await page.screenshot({path:path.join(out,'homepage-mobile.png')});
const mobileHeight=await page.locator('#memoryChapter').evaluate(el=>el.offsetHeight),mobileTop=await page.locator('#memoryChapter').evaluate(el=>el.offsetTop),mobileTiles=[];
for(let y=0;y<mobileHeight;y+=794){const target=Math.max(0,Math.min(y,mobileHeight-844));await page.locator('#introScreen').evaluate((el,t)=>el.scrollTop=t,mobileTop+target);await page.waitForTimeout(60);mobileTiles.push({input:await page.screenshot(),top:target,left:0});}
await sharp({create:{width:390,height:mobileHeight,channels:4,background:'#fcf1dc'}}).composite(mobileTiles).png().toFile(path.join(out,'chapter-mobile-full.png'));
await page.locator('.mc-conversation').evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
await page.waitForTimeout(100);await page.screenshot({path:path.join(out,'inspect-mobile-card.png')});
const diagnostics=await page.locator('.mc-card-stack').evaluate(el=>[el,...el.querySelectorAll('*')].map(n=>{const s=getComputedStyle(n),r=n.getBoundingClientRect();return {class:typeof n.className==='string'?n.className:n.tagName,rect:[r.x,r.y,r.width,r.height],transform:s.transform,opacity:s.opacity,visibility:s.visibility,backface:s.backfaceVisibility,display:s.display,position:s.position,zIndex:s.zIndex};}));
await fs.writeFile(path.join(out,'card-rendering.json'),JSON.stringify(diagnostics,null,2));console.log(JSON.stringify({desktopHeight:height,mobileHeight,output:out}));
}finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
