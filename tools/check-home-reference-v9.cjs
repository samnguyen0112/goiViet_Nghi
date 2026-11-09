// Actual Preview 3: P1 playback, entrance invariants, fallbacks, quality levels and source isolation.
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const runtime=path.join(require('node:os').homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(runtime+'/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/t2-p1-upgrade'),url=pathToFileURL(path.join(root,'map-surroundings-preview-3.html')).href;
const report={checks:[],errors:[],checkpoints:[],performance:[]};
const check=(name,ok,detail)=>{report.checks.push({name,passed:!!ok,detail});assert.ok(ok,name+': '+JSON.stringify(detail));};
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--allow-file-access-from-files']});
 const open=async(options={},target=url,setup)=>{
  const p=await browser.newPage({viewport:{width:1920,height:1080},...options});p.on('pageerror',e=>report.errors.push(e.message));if(setup)await setup(p);
  await p.goto(target,{waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.GoiVietHomeIntro);await p.evaluate(async()=>{await GoiVietHomeIntro.ready;await document.fonts.ready});return p;
 };
 const seek=async(p,t)=>{await p.bringToFront();await p.evaluate(t=>GoiVietHomeIntro.seek(t,true),t);await p.waitForFunction(()=>(homeClipFilm.homeScene?.native?.layerRenderer?.inspect?.().pending??0)===0);await p.evaluate(t=>GoiVietHomeIntro.seek(t,true),t);};
 const entries=p=>p.evaluate(()=>[...document.querySelectorAll('[data-home-enter]')].map(e=>({id:e.id,opacity:getComputedStyle(e).opacity,transform:getComputedStyle(e).transform,inert:e.inert,disabled:e.disabled,visibility:getComputedStyle(e).visibility})));
 try{
  const before=await fs.readFile(path.join(out,'preview3.before.html'),'utf8');
  await fs.writeFile(path.join(out,'baseline.html'),before.replace('<head>','<head><base href="'+pathToFileURL(root+path.sep).href+'">'));
  const p=await open(),old=await open({},pathToFileURL(path.join(out,'baseline.html')).href);
  check('Starts at the real waiting gate',await p.evaluate(()=>GoiVietHomeIntro.getState().phase==='waiting'));
  await p.bringToFront();await p.locator('#btnHomeOpeningStart').click();await p.waitForFunction(()=>GoiVietHomeIntro.getState().phase==='playing');
  const originalCanvases=await old.evaluate(()=>[...document.querySelectorAll('#homeClipFilm canvas')].map(c=>[c.id,c.className]));
  check('Uses 64 native v9 layers with only the existing crane compositor, no added screenshot overlay',await p.evaluate(expected=>homeSceneCanvas.dataset.layerCount==='64'&&homeClipFilm.homeScene.native.layerRenderer.manifest.referenceArtwork.version===9&&JSON.stringify([...document.querySelectorAll('#homeClipFilm canvas')].map(c=>[c.id,c.className]))===JSON.stringify(expected)&&getComputedStyle(homeSceneCanvas).filter==='none',originalCanvases));
  for(const t of [0,2.5,5.5,8,12,20]){
   await seek(old,t);await seek(p,t);const a=await entries(old),b=await entries(p);check('Entrance timing and DOM geometry unchanged at '+t,JSON.stringify(a)===JSON.stringify(b));
   await p.screenshot({path:path.join(out,'preview3-'+t+'s.png')});
   if(t===12)await p.locator('#homeSceneCanvas').evaluate(c=>c.toDataURL('image/png')).then(data=>fs.writeFile(path.join(out,'browser-canvas-t12.png'),Buffer.from(data.split(',')[1],'base64')));
   report.checkpoints.push(t);
  }
  for(const [label,page] of [['v8',old],['v9',p]]){
   await seek(page,12);
   const perf=await page.evaluate(async()=>{
    const costs=[];for(let i=0;i<32;i++){
     await new Promise(r=>requestAnimationFrame(r));const start=performance.now();
     GoiVietHomeIntro.seek(12+(i%16)/30,true);if(i>=16)costs.push(performance.now()-start);
    }
    costs.sort((a,b)=>a-b);const scene=homeClipFilm.homeScene;
    return {targetFPS:scene.metadata.fps,medianRenderMS:costs[Math.floor(costs.length/2)],p90RenderMS:costs[Math.floor(costs.length*.9)],failed:GoiVietHomeIntro.getState().failed};
   });report.performance.push({label,...perf});
  }
  check('Frame budget unchanged; warmed render median within 15% or 2ms',report.performance[0].targetFPS===report.performance[1].targetFPS&&!report.performance[1].failed&&report.performance[1].medianRenderMS<=Math.max(report.performance[0].medianRenderMS*1.15,report.performance[0].medianRenderMS+2),report.performance);
  await old.close();await seek(p,12);
  await p.locator('#btnHomeOpeningReplay').click();check('Replay remains usable',await p.evaluate(()=>GoiVietHomeIntro.getState().phase==='playing'));
  await p.locator('#btnHomeOpeningSkip').click();check('Skip reveals all controls',await p.evaluate(()=>!btnQuickStartWelcome.disabled&&!btnHomeExploreMemory.disabled));
  await p.locator('#btnHomeExploreMemory').click();await p.waitForFunction(()=>introScreen.dataset.memoryUnlocked==='true');await p.screenshot({path:path.join(out,'memory-seam.png')});
  await p.evaluate(()=>GoiVietHomeIntro.replay());await p.waitForFunction(()=>introScreen.dataset.memoryUnlocked==='false');await p.locator('#btnHomeOpeningSkip').click();
  await p.locator('#btnQuickStartWelcome').click();await p.waitForFunction(()=>introScreen.classList.contains('intro-hidden'));check('Map entry remains usable',true);await p.close();
  for(const [width,height] of [[1366,768],[390,844],[2560,1440]]){
   const r=await open({viewport:{width,height}});await seek(r,12);const data=await r.evaluate(()=>({quality:homeSceneCanvas.dataset.assetQuality,palette:homeClipFilm.homeScene.native.layerRenderer.manifest.referenceArtwork.palette,overflow:document.documentElement.scrollWidth>innerWidth,failed:GoiVietHomeIntro.getState().failed}));
   check('P1 loaded and fits at '+width,!data.failed&&!data.overflow&&data.palette==='P1',data);await r.locator('#btnQuickStartWelcome').click({trial:true});await r.screenshot({path:path.join(out,'responsive-'+width+'.png')});await r.close();
  }
  for(const reduce of [true,false]){
   const r=await open(reduce?{reducedMotion:'reduce'}:{},url,reduce?undefined:p=>p.route('**/homepage-reference-v9/assets-*.js*',r=>r.abort()));
   await r.locator('#btnHomeOpeningStart').click();await r.waitForFunction(()=>GoiVietHomeIntro.getState().phase==='complete');
   check(reduce?'Reduced motion uses the v9 rendered poster':'Failed bundle falls back to v9 poster and usable controls',await r.evaluate(()=>document.querySelector('.gv-home-poster').currentSrc.includes('homepage-reference-v9/poster-')&&document.querySelector('.gv-home-poster').naturalWidth>0&&!btnQuickStartWelcome.disabled));await r.close();
  }
  const rollbackHtml=(await fs.readFile(path.join(root,'map-surroundings-preview-3.html'),'utf8')).replace('data-home-art="reference-v9"','data-home-art="reference-v8"').replace('<head>','<head><base href="'+pathToFileURL(root+path.sep).href+'">');
  await fs.writeFile(path.join(out,'rollback.html'),rollbackHtml);const rollback=await open({},pathToFileURL(path.join(out,'rollback.html')).href);
  check('One-attribute rollback selects both v8 layers and v8 poster',await rollback.evaluate(()=>homeClipFilm.homeScene.native.layerRenderer.manifest.referenceArtwork.version===8&&document.querySelector('.gv-home-poster').currentSrc.includes('homepage-reference-v8')));await rollback.close();
  const hashes=JSON.parse(await fs.readFile(path.join(out,'source-hashes.json'),'utf8'));let count=0;
  for(const [file,hash] of Object.entries(hashes)){if(file==='map-surroundings-preview-3.html')continue;const current=crypto.createHash('sha256').update(await fs.readFile(path.join(root,file))).digest('hex');assert.equal(current,hash,'Unexpected shared source change: '+file);count++;}
  check('All tracked files except Preview 3 are byte-identical, including v8 and older pages',count>0,{files:count});
  check('No browser JavaScript errors',report.errors.length===0,report.errors);
 }finally{await browser.close();await fs.writeFile(path.join(out,'browser-report.json'),JSON.stringify(report,null,2));}
 console.log(JSON.stringify({passed:report.checks.length,errors:report.errors,performance:report.performance}));
})().catch(e=>{console.error(e);process.exitCode=1});
