const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/memory-native-v4');
(async()=>{
 await fs.mkdir(path.join(out,'browser-temp'),{recursive:true});process.env.TEMP=process.env.TMP=path.join(out,'browser-temp');
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const report={errors:[],failedResources:[],viewports:[],images:[]};
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  page.on('pageerror',e=>report.errors.push(e.message));
  page.on('response',res=>{if(res.status()>=400&&res.url().includes('memory-native-v4'))report.failedResources.push({url:res.url(),status:res.status()});});
  await page.goto('http://127.0.0.1:8765/map-surroundings-preview-3.html',{waitUntil:'load'});
  await page.waitForFunction(()=>window.GoiVietMemoryChapter&&window.GoiVietHomeIntro);
  await page.evaluate(async()=>{window.GoiVietHomeIntro.skip();window.GoiVietMemoryChapter.begin();await document.fonts.ready;await Promise.all([...document.querySelectorAll('.mc img,.mc-seam img')].map(img=>{img.loading='eager';return img.decode();}));});
  report.images=await page.locator('#memoryChapter img').evaluateAll(images=>images.map(img=>({id:img.dataset.nativeAsset||'vietnam-vector',src:img.currentSrc,width:img.naturalWidth,height:img.naturalHeight})));
  assert(report.images.every(i=>i.width>0),'An image failed to decode');
  assert(report.images.every(i=>i.src.includes('memory-native-v4/')),'An old enlarged raster remains in the live chapter');
  for(const width of [1440,1920,820,700,390,320]){
   await page.setViewportSize({width,height:1000});
   await page.locator('.mc-destination').evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
   const geometry=await page.evaluate(()=>{
    const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
    return {destination:rect('.mc-destination'),content:rect('.mc-content'),chapter:rect('#memoryChapter'),copy:rect('.mc-destination-copy'),button:rect('#memoryOpenMap'),train:rect('.n4-arriving-train'),scene:rect('.n4-perspective-scene'),station:rect('.n4-station'),continuousRivers:document.querySelectorAll('.mc-world .n4-river-continuous').length,contentWidth:document.getElementById('introScreen').scrollWidth};
   });
   assert(Math.abs(geometry.copy.x+geometry.copy.width/2-width/2)<1,`${width}: final copy is not centered`);
   assert(geometry.button.x>=0&&geometry.button.right<=width+1,`${width}: CTA clipped`);
   assert(geometry.contentWidth<=width+1,`${width}: chapter overflows horizontally`);
   assert(geometry.copy.bottom<geometry.train.y+5,`${width}: final copy overlaps the train`);
   assert(geometry.train.right+10<geometry.station.x,`${width}: train obscures the station`);
   assert(geometry.station.x>=0&&geometry.station.right<=width+1,`${width}: station clipped`);
   assert(Math.abs(geometry.destination.bottom-geometry.content.bottom)<1,`${width}: blank space after final scene`);
   assert(Math.abs(geometry.destination.bottom-geometry.chapter.bottom)<1,`${width}: chapter extends below final scene`);
   assert.equal(geometry.continuousRivers,1,'River must be one continuous authored layer');
   await page.screenshot({path:path.join(out,`destination-${width}.png`)});
   report.viewports.push({width,...geometry});
   for(let i=0;i<9;i++){
    await page.locator('#memoryNextCard').evaluate(el=>el.click());
    const fits=await page.locator('.mc-card-question-frame').evaluate(el=>el.firstElementChild.offsetHeight<=el.clientHeight+1);
    assert(fits,`${width}: question ${i} overflows`);
   }
   if(width===1440||width===390){
    const frame=await page.locator('#memoryChapter').evaluate(el=>({top:el.offsetTop,height:el.offsetHeight})),tiles=[];
    for(let y=0;y<frame.height;y+=1000){
     const cropY=Math.min(y,Math.max(0,frame.height-1000));
     await page.locator('#introScreen').evaluate((el,top)=>el.scrollTo({top,behavior:'instant'}),frame.top+cropY);
     tiles.push({input:await page.screenshot(),left:0,top:Math.round(cropY)});
    }
    await sharp({create:{width,height:Math.ceil(frame.height),channels:4,background:'#fcf0d8'}}).composite(tiles).png().toFile(path.join(out,`chapter-${width}.png`));
   }
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.locator('#memoryOpenMap').scrollIntoViewIfNeeded();await page.locator('#memoryOpenMap').click();
  await page.waitForFunction(()=>document.getElementById('introScreen').classList.contains('intro-hidden'));report.mapEntry=true;
  assert.deepEqual(report.failedResources,[]);assert.deepEqual(report.errors,[]);
  await fs.writeFile(path.join(out,'checks.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({viewports:report.viewports.map(v=>v.width),decodedImages:report.images.length,mapEntry:report.mapEntry,errors:report.errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
