const fs=require('node:fs/promises'),path=require('node:path');
const {chromium}=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const out=path.resolve(__dirname,'../verification/memory-reference-v2');
async function captureChapter(page,name){
 const {width,height}=await page.locator('#memoryChapter').evaluate(e=>({width:Math.round(e.clientWidth),height:Math.round(e.clientHeight)}));const vh=page.viewportSize().height,tiles=[];
 for(let y=0;y<height;y+=vh){const h=Math.min(vh,height-y);const screen=await page.evaluate(y=>{const root=document.getElementById('introScreen'),e=document.getElementById('memoryChapter');root.scrollTo({top:e.getBoundingClientRect().top-root.getBoundingClientRect().top+root.scrollTop+y,behavior:'instant'});return e.getBoundingClientRect().top+y;},y);await page.waitForTimeout(40);tiles.push({input:await page.screenshot({clip:{x:0,y:Math.max(0,screen),width,height:h}}),left:0,top:y});}
 await sharp({create:{width,height,channels:4,background:'#fff'}}).composite(tiles).png().toFile(path.join(out,name));
}
(async()=>{const temp=path.join(out,'browser-temp');await fs.mkdir(temp,{recursive:true});process.env.TEMP=temp;process.env.TMP=temp;
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{const page=await browser.newPage({viewport:{width:971,height:800},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('file:///D:/HCMUS/vietnam-heritage-map-2/map-surroundings-preview-3.html',{waitUntil:'load'});await page.waitForFunction(()=>window.GoiVietMemoryChapter);await page.evaluate(()=>window.GoiVietHomeIntro.skip());
 await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.querySelectorAll('.mc img,.mc-seam img')].map(async i=>{i.loading='eager';await i.decode().catch(()=>{});}));});
 await page.screenshot({path:path.join(out,'home-native.png')});
 await page.evaluate(()=>window.GoiVietMemoryChapter.begin());await page.waitForTimeout(150);
 await captureChapter(page,'chapter-native.png');
 await page.evaluate(()=>{const intro=document.getElementById('introScreen');intro.scrollTop=400;});await page.waitForTimeout(100);await page.screenshot({path:path.join(out,'seam-native.png')});
 console.log(JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('#introWelcomeStage,.mc-seam,.mc')].map(e=>({name:e.className,id:e.id,rect:e.getBoundingClientRect().toJSON(),style:getComputedStyle(e).cssText,margin:getComputedStyle(e).margin,display:getComputedStyle(e).display,position:getComputedStyle(e).position,z:getComputedStyle(e).zIndex})))));
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>window.GoiVietMemoryChapter.begin());await page.waitForTimeout(150);
 await captureChapter(page,'chapter-mobile.png');
 console.log(JSON.stringify({errors,layout:await page.evaluate(()=>({state:window.GoiVietMemoryChapter.getState(),chapter:document.getElementById('memoryChapter').getBoundingClientRect().toJSON(),intro:document.getElementById('introScreen').getBoundingClientRect().toJSON(),canvas:document.querySelector('#memorySeamCanvas').width}))}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
