const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/home-letter-review');
(async()=>{
 await fs.mkdir(path.join(out,'browser-temp'),{recursive:true});process.env.TEMP=process.env.TMP=path.join(out,'browser-temp');
 const b=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),report={errors:[],resources:[],home:[],letter:[],animation:[]};
 try{
  const p=await b.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});p.on('pageerror',e=>report.errors.push(e.message));p.on('response',r=>{if(r.status()>=400&&r.url().includes('127.0.0.1'))report.resources.push(r.url());});
  await p.goto('http://127.0.0.1:8765/map-surroundings-preview-3.html');await p.waitForFunction(()=>window.GoiVietHomeIntro&&window.GoiVietMemoryChapter);
  await p.evaluate(async()=>{window.GoiVietHomeIntro.skip();await document.fonts.ready;await document.querySelector('.gv-home-poster').decode();});
  for(const [width,height]of [[1440,900],[1366,768],[1280,720],[1920,1080],[2560,1080],[820,1180],[700,1000],[390,844],[375,667],[320,568],[844,390],[568,320],[3840,2160]]){
   await p.setViewportSize({width,height});await p.locator('#introScreen').evaluate(e=>e.scrollTo({top:0,behavior:'instant'}));
   const info=await p.evaluate(()=>{const r=s=>{const b=document.querySelector(s).getBoundingClientRect();return {x:b.x,y:b.y,right:b.right,bottom:b.bottom,width:b.width,height:b.height};};const image=document.querySelector('.gv-home-poster');return {hero:r('#introWelcomeStage'),logo:r('.gv-home-logo'),panel:r('#homepageContent'),button:r('#btnQuickStartWelcome'),stations:[...document.querySelectorAll('.gv-home-station')].map(e=>({x:e.getBoundingClientRect().x,right:e.getBoundingClientRect().right})),overflow:document.querySelector('#introScreen').scrollWidth,poster:image.currentSrc,decoded:image.naturalWidth>0};});
   assert(info.overflow<=width+1,width+': horizontal overflow');assert(info.logo.x>=-1&&info.logo.right<=width+1,width+': clipped logo');assert(info.button.width>=44&&info.button.height>=44,width+': CTA too small');assert(info.decoded&&info.poster.includes('homepage-classic-3'),width+': stale homepage poster');
   assert(info.stations.every(r=>r.x>=-1&&r.right<=width+1),width+': station navigation clipped');
   await p.screenshot({path:path.join(out,'home-'+width+'x'+height+'.png')});
   await p.locator('#btnQuickStartWelcome').scrollIntoViewIfNeeded();assert(await p.locator('#btnQuickStartWelcome').isVisible(),width+': inaccessible homepage CTA');
   report.home.push({width,height,...info});
  }
  await p.setViewportSize({width:1920,height:1080});await p.evaluate(async()=>{window.GoiVietMemoryChapter.begin();await Promise.all([...document.querySelectorAll('.mc img')].map(i=>{i.loading='eager';return i.decode()}));});
  assert.equal(await p.locator('#memoryChapter').evaluate(e=>getComputedStyle(e).outlineStyle),'none','Whole-chapter focus outline creates a red seam');
  assert.equal(await p.locator('.n4-bank-story,.n4-bank-weaving,.n4-bank-taste,.n4-bank-conversation').count(),0,'Rectangular decorative bank fragments remain');
  for(const width of [1920,1440,820,700,390,320]){await p.setViewportSize({width,height:1080});await p.locator('.n4-letter').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,'letter-'+width+'.png')});const q=await p.locator('.mc-story .mc-memory-copy').evaluate(e=>({height:e.clientHeight,scroll:e.scrollHeight,width:e.clientWidth,scrollWidth:e.scrollWidth,children:[...e.children].map(c=>({tag:c.tagName,width:c.clientWidth,scroll:c.scrollWidth,font:getComputedStyle(c).font,whiteSpace:getComputedStyle(c).whiteSpace}))}));assert(q.children.every(c=>c.scroll<=c.width+1),width+': clipped story label '+JSON.stringify(q));report.letter.push({width,...q});}
  await p.close();
  const a=await b.newPage({viewport:{width:1440,height:900}});a.on('pageerror',e=>report.errors.push(e.message));await a.goto('http://127.0.0.1:8765/map-surroundings-preview-3.html');await a.waitForFunction(()=>window.GoiVietHomeIntro);await a.evaluate(async()=>{await window.GoiVietHomeIntro.ready;await document.fonts.ready;});
  for(const time of [3.5,6,8,12,20]){await a.evaluate(t=>window.GoiVietHomeIntro.seek(t,true),time);const state=await a.evaluate(()=>{const e=document.querySelector('#homeClipFilm').homeScene?.native?.layerRenderer;return {state:window.GoiVietHomeIntro.getState(),art:e?.manifest.homeComposition.trainArtwork,parts:e?.manifest.layers.find(l=>l.id==='train').spriteParts?.length};});assert(!state.state.failed&&state.art==='native-painted-perspective-20261019'&&state.parts===4,'Animated homepage uses stale train');await a.screenshot({path:path.join(out,'home-animation-'+time+'.png')});report.animation.push({time,...state});}
  await a.locator('#btnHomeOpeningReplay').click();await a.locator('#btnHomeOpeningSkip').click();assert.equal(await a.locator('#introScreen').getAttribute('data-home-opening'),'complete');
  assert.deepEqual(report.errors,[]);assert.deepEqual(report.resources,[]);await fs.writeFile(path.join(out,'checks.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({homeSizes:report.home.length,letterSizes:report.letter.length,animationFrames:report.animation.length,replaySkip:true,errors:report.errors}));
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
