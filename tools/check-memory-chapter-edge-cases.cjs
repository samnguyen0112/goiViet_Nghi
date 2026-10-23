const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/memory-chapter-3');
const url='http://127.0.0.1:8765/map-surroundings-preview-3.html';
async function pause(page,ms=60){await page.waitForTimeout(ms);}
async function init(page,skip=true){await page.goto(url,{waitUntil:'load'});await page.waitForFunction(()=>window.GoiVietHomeIntro);if(skip)await page.evaluate(async()=>{window.GoiVietHomeIntro.skip();await document.fonts.ready;});}
async function main(){
 await fs.mkdir(out,{recursive:true});process.env.TEMP=process.env.TMP=path.join(out,'browser-temp');
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const report={environment:{browser:browser.version(),platform:process.platform,realMobile:false},checks:{},errors:[]};
 const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 page.on('pageerror',e=>report.errors.push(e.message));
 try{
  // Current homepage assets can be edited by another task. Compare lifecycle
  // rendering against a fresh same-run baseline, and retain the earlier capture.
  const baselinePage=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
  await baselinePage.goto(url,{waitUntil:'load'});
  await baselinePage.evaluate(async()=>{await window.GoiVietHomeIntro.ready;await document.fonts.ready;window.GoiVietHomeIntro.seek(12,true);});
  const captureStatic=()=>{
    const film=document.getElementById('homeClipFilm'),engine=film.homeScene.native.layerRenderer;
    const ambient=engine.manifest.layers.filter(l=>['tree','cloud','bird','leaf','smoke'].includes(l.kind));
    ambient.forEach(l=>engine.enabled.delete(l.id));film.homeScene.renderFrame(12);
    const data=document.getElementById('homeSceneCanvas').toDataURL();
    ambient.forEach(l=>engine.enabled.add(l.id));film.homeScene.renderFrame(12);return data;
  };
  const baselineData=await baselinePage.evaluate(captureStatic);
  const baselineImage=Buffer.from(baselineData.split(',')[1],'base64');
  await fs.writeFile(path.join(out,'home-scene-current-baseline.png'),baselineImage);await baselinePage.close();
  // Actual wheel input while the full-screen gate is waiting must not trap the user.
  await init(page,false);await page.mouse.move(700,650);await page.mouse.wheel(0,1100);
  await page.waitForFunction(()=>window.GoiVietHomeIntro.getState().phase==='complete');
  assert(await page.locator('#introScreen').evaluate(el=>el.scrollTop>0));report.checks.wheelFromWaiting=true;
  await page.evaluate(()=>window.GoiVietMemoryChapter.begin());await pause(page);
  const scrollBefore=await page.locator('#introScreen').evaluate(el=>el.scrollTop);
  await page.keyboard.press('PageDown');await pause(page,350);
  assert(await page.locator('#introScreen').evaluate(el=>el.scrollTop)>scrollBefore);report.checks.pageDownScroll=true;
  await page.evaluate(()=>window.GoiVietMemoryChapter.begin());
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'memoryNextCard','Tab from chapter anchor jumped to hero');
  await page.locator('#homeMusicSettings > summary').focus();await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'btnQuickStartWelcome','Tab entered a closed music disclosure');
  const snapshot=await page.locator('#introScreen').ariaSnapshot();await fs.writeFile(path.join(out,'accessibility-tree.yml'),snapshot);
  assert(snapshot.includes('Có những điều'));assert(snapshot.includes('Đổi lời gợi'));report.checks.keyboardAndSemantics=true;
  // All nine card questions must fit inside the printed frame, without height jumps.
  report.cardGeometry=[];
  for(const width of [320,360,390,430,700,720,820,1440]){
   await page.setViewportSize({width,height:900});
   const heights=[];
   for(let n=0;n<9;n++){
    await page.locator('#memoryNextCard').click();
    const box=await page.locator('.mc-card-frame').evaluate(el=>({height:el.clientHeight,scroll:el.scrollHeight,front:el.parentElement.offsetHeight}));
    assert(box.scroll<=box.height+1,`${width}: card content overflows ${JSON.stringify(box)}`);heights.push(box.front);
   }
   assert(Math.max(...heights)-Math.min(...heights)<=1,`${width}: changing questions changed card height ${heights}`);
   report.cardGeometry.push({width,heights});
  }
  report.checks.allQuestionsFit=true;
  await page.setViewportSize({width:1440,height:900});
  // Preference changes both before and after the midpoint must commit exactly once.
  for(const delay of [100,450]){
   await page.emulateMedia({reducedMotion:'no-preference'});await page.locator('#memoryNextCard').scrollIntoViewIfNeeded();
   const before=await page.evaluate(()=>window.GoiVietMemoryChapter.getState().questionIndex);
   await page.locator('#memoryNextCard').click();await pause(page,delay);
   await page.emulateMedia({reducedMotion:'reduce'});await pause(page,850);
   const state=await page.evaluate(()=>window.GoiVietMemoryChapter.getState());
   assert.equal(state.questionIndex,(before+1)%9);assert.equal(state.flipping,false);
   assert.equal(await page.locator('#memoryNextCard').getAttribute('aria-disabled'),null);
  }
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.evaluate(()=>toggleReducedMotion());await pause(page);
  const userMotion=await page.locator('.mc-river-ripple').first().evaluate(el=>getComputedStyle(el).animationName);
  assert.equal(userMotion,'none');await page.evaluate(()=>toggleReducedMotion());report.checks.motionPreferenceChanges=true;
  await page.evaluate(()=>{window.GoiVietHomeIntro.skip();window.GoiVietMemoryChapter.enterMap();});
  await pause(page,80);await page.keyboard.press('Escape');
  await page.waitForFunction(()=>document.getElementById('introScreen').classList.contains('intro-hidden'));
  await page.locator('.brand-group').click();await pause(page,750);
  assert(await page.locator('#introScreen').evaluate(el=>!el.classList.contains('intro-hidden')),'Old transition timer closed a newly reopened homepage');
  assert.equal(await page.evaluate(()=>window.GoiVietMemoryChapter.getState().exiting),false);report.checks.cancelAndReopenAnimatedTransition=true;
  // Suspend only the hero's artwork, retain the same renderer when scrolling back.
  await page.evaluate(async()=>{await window.GoiVietHomeIntro.ready;window.GoiVietHomeIntro.skip();window.GoiVietMemoryChapter.begin();});
  await pause(page,1000);
  assert.equal(await page.evaluate(()=>window.GoiVietHomeIntro.getState().artworkVisible),false);
  assert.equal(await page.evaluate(()=>window.GoiVietHomeIntro.getState().paused),true);
  await page.evaluate(()=>window.GoiVietHomeIntro.replay());
  await page.waitForFunction(()=>document.getElementById('introScreen').scrollTop===0);
  await page.waitForFunction(()=>window.GoiVietHomeIntro.getState().phase==='playing');
  await page.waitForFunction(()=>window.GoiVietHomeIntro.getState().artworkVisible);
  await page.locator('#btnHomeOpeningSkip').click();
  assert.equal(await page.evaluate(()=>window.GoiVietHomeIntro.getState().phase),'complete');
  const framesBefore=await page.evaluate(()=>document.getElementById('homeClipFilm').homeScene.frames);
  await page.evaluate(()=>window.dispatchEvent(new Event('pagehide')));assert(await page.evaluate(()=>window.GoiVietHomeIntro.getState().paused));
  await page.evaluate(()=>window.dispatchEvent(new Event('pageshow')));await pause(page,100);
  const framesAfter=await page.evaluate(()=>document.getElementById('homeClipFilm').homeScene.frames);
  assert(framesAfter>framesBefore);report.checks.heroSuspendReplayAndPageLifecycle=true;
  // Preserve the exact pre-change rendered artwork at a deterministic timestamp.
  await page.evaluate(()=>window.GoiVietHomeIntro.seek(12,true));await pause(page);
  const data=await page.evaluate(captureStatic);
  const after=Buffer.from(data.split(',')[1],'base64');
  await fs.writeFile(path.join(out,'home-scene-after.png'),after);
  const before=baselineImage;
  const a=await sharp(after).raw().toBuffer({resolveWithObject:true}),b=await sharp(before).raw().toBuffer({resolveWithObject:true});
  assert.equal(a.info.width,b.info.width);assert.equal(a.info.height,b.info.height);
  let different=0;for(let i=0;i<a.data.length;i++)if(a.data[i]!==b.data[i])different++;
  report.homeArtwork={width:a.info.width,height:a.info.height,differentChannels:different,comparison:'static terrain and architecture; ambient sprite caches excluded'};
  assert.equal(different,0,'Homepage artwork changed after suspend/replay');
  await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>window.GoiVietHomeIntro.skip());
  // A silent local fixture checks configured music state without user audio or services.
  const samples=40*8000,wav=Buffer.alloc(44+samples*2);wav.write('RIFF',0);wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(8000,24);wav.writeUInt32LE(16000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(samples*2,40);
  await page.locator('#homeMusicSettings > summary').click();
  await page.locator('#homeMusicContinue').check();
  await page.locator('#homeMusicFile').setInputFiles({name:'memory-test-silence.wav',mimeType:'audio/wav',buffer:wav});
  await page.waitForFunction(()=>window.GoiVietHomeIntro.getState().music.time!==null);
  await page.waitForFunction(()=>!window.GoiVietHomeIntro.getState().music.paused);
  const musicBefore=await page.evaluate(()=>window.GoiVietHomeIntro.getState().music);
  await page.evaluate(()=>window.GoiVietMemoryChapter.begin());await pause(page,400);
  const musicAfter=await page.evaluate(()=>window.GoiVietHomeIntro.getState().music);
  assert.equal(musicAfter.paused,false);assert(musicAfter.time>=musicBefore.time);assert.equal(musicAfter.keep,true);
  report.checks.musicContinuesThroughChapter=true;
  // Repeated activation must call the authoritative map transition once.
  await page.locator('#memoryOpenMap').scrollIntoViewIfNeeded();
  await page.evaluate(()=>{window.__mapEntryCount=0;window.__mapOriginal=window.closeIntroModal;window.closeIntroModal=()=>{window.__mapEntryCount++;window.__mapOriginal();};for(let n=0;n<10;n++)document.getElementById('memoryOpenMap').click();});
  await page.waitForFunction(()=>document.getElementById('introScreen').classList.contains('intro-hidden'));
  assert.equal(await page.evaluate(()=>window.__mapEntryCount),1);await page.evaluate(()=>window.closeIntroModal=window.__mapOriginal);
  await page.waitForFunction(()=>window.GoiVietRegionalPreview?.inspect().geometryLoaded);
  assert.equal(await page.evaluate(()=>window.GoiVietHomeIntro.getState().music.paused),true);
  const zoom=await page.evaluate(()=>state.cam.targetZoom);await page.locator('#mainCanvas').focus();await page.keyboard.press('+');
  assert(await page.evaluate(z=>state.cam.targetZoom>z,zoom));
  const pan=await page.evaluate(()=>state.cam.targetPanX);await page.keyboard.press('ArrowRight');assert.notEqual(await page.evaluate(()=>state.cam.targetPanX),pan);
  report.checks.mapZoomAndPan=true;
  await page.locator('.brand-group').click();await pause(page);await page.evaluate(()=>window.GoiVietHomeIntro.skip());
  // Simulate a failed destination render, then verify retry and curtain cleanup.
  await page.evaluate(()=>{window.__mapOriginal=window.closeIntroModal;window.closeIntroModal=()=>{throw new Error('Deliberate QA map failure');};window.GoiVietMemoryChapter.begin();});
  await page.locator('#memoryOpenMap').click();await pause(page,100);
  assert((await page.locator('#memoryMapStatus').innerText()).includes('thử lại'));
  assert.equal(await page.locator('#memoryMapTransition').evaluate(el=>getComputedStyle(el).visibility),'hidden');
  await page.evaluate(()=>window.closeIntroModal=window.__mapOriginal);await page.locator('#memoryOpenMap').click();
  await page.waitForFunction(()=>document.getElementById('introScreen').classList.contains('intro-hidden'));report.checks.mapFailureAndRetry=true;
  // Natural repeated visits, each returning to the top and retaining one controller.
  for(let n=0;n<3;n++){
   await page.locator('.brand-group').click();await pause(page);await page.evaluate(()=>window.GoiVietHomeIntro.skip());
   assert.equal(await page.locator('#introScreen').evaluate(el=>el.scrollTop),0);
   await page.locator('#memoryMapShortcut').click();await page.waitForFunction(()=>document.getElementById('introScreen').classList.contains('intro-hidden'));
  }
  assert.equal(await page.locator('#memoryChapter').count(),1);report.checks.repeatedVisits=true;
  // Failed new artwork must not hide text or disable map entry.
  const images=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce',isMobile:true,hasTouch:true});
  images.on('pageerror',e=>report.errors.push(e.message));
  await images.route('**/memory-chapter-3/*.webp',route=>route.abort());await init(images);
  const touch=await images.context().newCDPSession(images);
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:200,y:700}]});
  for(let y=650;y>=250;y-=50){await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:200,y}]});await pause(images,16);}
  await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(images,250);
  assert(await images.locator('#introScreen').evaluate(el=>el.scrollTop)>100);report.checks.touchSwipe=true;
  await images.locator('#introScreen').evaluate(el=>el.scrollTo({top:0,behavior:'instant'}));
  await images.locator('#btnQuickStartWelcome').tap();await pause(images);
  assert(await images.locator('#memoryTitle').isVisible());await images.locator('#memoryNextCard').tap();
  await images.locator('#memoryOpenMap').tap();await images.waitForFunction(()=>document.getElementById('introScreen').classList.contains('intro-hidden'));
  await images.close();report.checks.failedArtworkAndTouch=true;
  // A missing enhancement script leaves normal anchors and map buttons working.
  const script=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  script.on('pageerror',e=>report.errors.push(e.message));
  await script.route('**/memory-chapter-3.js*',route=>route.abort());await init(script);
  await script.locator('#btnQuickStartWelcome').click();await pause(script);
  assert(await script.locator('#introScreen').evaluate(el=>el.scrollTop>500));assert(await script.locator('#memoryTitle').isVisible());
  await script.locator('#memoryOpenMap').click();await script.waitForFunction(()=>document.getElementById('introScreen').classList.contains('intro-hidden'));
  await script.close();report.checks.missingEnhancementScript=true;
  // The static poster path must also work when homepage animated assets fail.
  const failedHome=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
  failedHome.on('pageerror',e=>report.errors.push(e.message));
  await failedHome.route('**/homepage-balanced-3/assets-*.js*',route=>route.abort());await init(failedHome);
  await failedHome.evaluate(()=>window.GoiVietHomeIntro.ready);assert.equal(await failedHome.evaluate(()=>window.GoiVietHomeIntro.getState().failed),true);
  await failedHome.locator('#btnQuickStartWelcome').click();await failedHome.waitForFunction(()=>document.getElementById('introScreen').scrollTop>500);
  assert(await failedHome.locator('#memoryTitle').isVisible());await failedHome.close();report.checks.homePosterFallback=true;
  // Ordinary direct-file preview, without relaxed local-file-access flags.
  const file=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  file.on('pageerror',e=>report.errors.push(e.message));
  await file.goto(pathToFileURL(path.join(root,'map-surroundings-preview-3.html')).href,{waitUntil:'load'});
  await file.evaluate(async()=>{window.GoiVietHomeIntro.skip();await document.fonts.ready;window.GoiVietMemoryChapter.begin();});
  await file.locator('#memoryNextCard').click();await file.screenshot({path:path.join(out,'direct-file-card.png')});
  await file.locator('#memoryOpenMap').click();await file.waitForFunction(()=>document.getElementById('introScreen').classList.contains('intro-hidden'));
  await file.close();report.checks.directFile=true;
  const directMap=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  directMap.on('pageerror',e=>report.errors.push(e.message));await directMap.goto(url+'?view=map',{waitUntil:'load'});
  await directMap.waitForFunction(()=>document.getElementById('introScreen').classList.contains('intro-hidden'));
  assert.equal(await directMap.locator('#mapScene').getAttribute('inert'),null);await directMap.close();report.checks.directMapUrl=true;
  const zoomPage=await browser.newPage({viewport:{width:720,height:450},deviceScaleFactor:2,reducedMotion:'reduce'});
  await init(zoomPage);await zoomPage.locator('#btnQuickStartWelcome').click();
  assert(await zoomPage.locator('#introScreen').evaluate(el=>el.scrollWidth<=el.clientWidth+1));
  await zoomPage.locator('#memoryNextCard').click();await zoomPage.screenshot({path:path.join(out,'zoom-200-emulated.png')});
  await zoomPage.close();report.checks.zoom200EffectiveViewport=true;
  for(const name of ['map-surroundings-preview.html','map-surroundings-preview-2.html']){
   const sibling=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
   sibling.on('pageerror',e=>report.errors.push(name+': '+e.message));
   await sibling.goto('http://127.0.0.1:8765/'+name,{waitUntil:'load'});
   await sibling.waitForFunction(()=>window.GoiVietHomeIntro);await sibling.evaluate(()=>{window.GoiVietHomeIntro.skip();window.GoiVietHomeIntro.setArtworkVisible(false);});
   assert.equal(await sibling.evaluate(()=>window.GoiVietHomeIntro.getState().artworkVisible),true,'Preview 3 suspension leaked into another preview');
   await sibling.locator('#btnQuickStartWelcome').focus();await sibling.keyboard.press('Tab');
   assert(await sibling.evaluate(()=>document.getElementById('introScreen').contains(document.activeElement)));
   await sibling.close();
  }
  report.checks.siblingPreviewControllerRegression=true;
  assert.deepEqual(report.errors,[]);await fs.writeFile(path.join(out,'edge-checks.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({checks:report.checks,homeArtwork:report.homeArtwork,errors:report.errors}));
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
