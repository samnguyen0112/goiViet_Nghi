const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve(__dirname,'../verification/memory-chapter-3'),url='http://127.0.0.1:8765/map-surroundings-preview-3.html';
async function sample(page,scroll=false){return page.evaluate(async scrolling=>{
 const deltas=[],root=document.getElementById('introScreen');let last=performance.now();
 for(let i=0;i<120;i++)await new Promise(resolve=>requestAnimationFrame(now=>{deltas.push(now-last);last=now;if(scrolling)root.scrollTop+=7;resolve();}));
 deltas.shift();deltas.sort((a,b)=>a-b);return {frames:deltas.length,p50:deltas[Math.floor(deltas.length*.5)],p95:deltas[Math.floor(deltas.length*.95)],max:Math.max(...deltas)};
},scroll);}
(async()=>{
await fs.mkdir(out,{recursive:true});process.env.TEMP=process.env.TMP=path.join(out,'browser-temp');
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const report={browser:browser.version(),mode:'headless Chromium, loopback HTTP, DPR 1; mobile viewport emulation, not hardware',devices:[]};
try{
 for(const [name,width,height] of [['desktop',1440,900],['mobile',390,844]]){
  const page=await browser.newPage({viewport:{width,height},reducedMotion:'no-preference',deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(url,{waitUntil:'load'});await page.evaluate(async()=>{await window.GoiVietHomeIntro.ready;await document.fonts.ready;window.GoiVietHomeIntro.seek(12,false);});
  await page.waitForTimeout(200);const hero=await sample(page);
  await page.evaluate(()=>window.GoiVietMemoryChapter.begin());await page.waitForTimeout(1200);
  const paintBefore=await page.evaluate(()=>document.getElementById('homeClipFilm').homeScene.frames);
  const chapterScroll=await sample(page,true);
  const paintAfter=await page.evaluate(()=>document.getElementById('homeClipFilm').homeScene.frames);
  assert.equal(paintAfter,paintBefore,'Hero renderer kept painting while fully outside viewport');
  await page.locator('.mc-destination').evaluate(el=>el.scrollIntoView({behavior:'instant'}));
  await page.locator('.mc img').evaluateAll(imgs=>Promise.all(imgs.map(async i=>{i.loading='eager';await i.decode().catch(()=>{});})));
  const resources=await page.evaluate(()=>performance.getEntriesByType('resource').filter(e=>e.name.includes('/memory-chapter-3/')&&!e.name.includes('/map-surroundings-preview/')).map(e=>({file:e.name.split('/').pop(),bytes:e.encodedBodySize,duration:e.duration})));
  const bytes=resources.reduce((n,r)=>n+r.bytes,0);
  assert(bytes<(name==='mobile'?3:6)*1024*1024,'New chapter resources exceeded planned image budget');
  const cdp=await page.context().newCDPSession(page);await cdp.send('Performance.enable');
  const heap=async()=>{await cdp.send('HeapProfiler.collectGarbage');const {metrics}=await cdp.send('Performance.getMetrics');return metrics.find(m=>m.name==='JSHeapUsedSize').value;};
  // Warm the map's lazy resources once before measuring repeat visits.
  await page.locator('#memoryOpenMap').click();await page.waitForFunction(()=>document.getElementById('introScreen').classList.contains('intro-hidden'));await page.waitForTimeout(1400);
  await page.locator('.brand-group').click();await page.evaluate(()=>window.GoiVietHomeIntro.skip());
  const heapBefore=await heap();
  for(let i=0;i<3;i++){await page.locator('#memoryMapShortcut').click();await page.waitForFunction(()=>document.getElementById('introScreen').classList.contains('intro-hidden'));await page.waitForTimeout(500);await page.locator('.brand-group').click();await page.evaluate(()=>window.GoiVietHomeIntro.skip());}
  const heapAfter=await heap();
  assert.deepEqual(errors,[]);report.devices.push({name,width,height,hero,chapterScroll,heroPaintsWhileReading:paintAfter-paintBefore,chapterBytes:bytes,resources,heapBefore,heapAfter,heapDelta:heapAfter-heapBefore,errors});
  await page.close();
 }
 await fs.writeFile(path.join(out,'performance.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
