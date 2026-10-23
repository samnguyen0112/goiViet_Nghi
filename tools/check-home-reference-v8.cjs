const fs=require('node:fs/promises'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const runtime='C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules',sharp=require(runtime+'/sharp'),{chromium}=require(runtime+'/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/home-reference-v8'),base=path.join(root,'assets/goi-viet');
const read=async p=>JSON.parse(await fs.readFile(p,'utf8')),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
async function pack(p){const box={window:{}};vm.runInNewContext(await fs.readFile(p,'utf8'),box);return box.window.GoiVietHomeLayeredData;}
(async()=>{
 const before=await read(path.join(out,'before/intro-checkpoints.json')),after=await read(path.join(out,'after/intro-checkpoints.json'));
 assert.deepEqual(after.states,before.states);assert.equal(after.errors.length,0);
 const report={introCheckpoints:after.states.length,introDOMStatesIdentical:true,protectedFiles:0,changedExistingFiles:[],packs:[],responsive:[],browserErrors:[]};
 for(const f of await read(path.join(out,'original-hashes.json'))){const changed=sha(await fs.readFile(path.join(root,f.file)))!==f.sha256;if(changed)report.changedExistingFiles.push(f.file);else report.protectedFiles++;}
 assert.deepEqual(report.changedExistingFiles.sort(),['assets/goi-viet/homepage-layered-scene.js','map-surroundings-preview-3.html']);
 for(const quality of ['2k','4k']){
  const old=await pack(path.join(base,'homepage-classic-3/assets-'+quality+'.js')),now=await pack(path.join(base,'homepage-reference-v8/assets-'+quality+'.js'));let replaced=0,unchanged=0;
  const normalized=JSON.parse(JSON.stringify(now.manifest));delete normalized.referenceArtwork;
  for(let i=0;i<old.manifest.layers.length;i++){
   const a=old.manifest.layers[i],b=now.manifest.layers[i];normalized.layers[i].file=a.file;
   if(a.file===b.file){assert.equal(old.sources[a.file],now.sources[b.file]);unchanged++;continue;}
   const decode=async uri=>sharp(Buffer.from(uri.split(',')[1],'base64')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   const [x,y]=await Promise.all([decode(old.sources[a.file]),decode(now.sources[b.file])]);assert.deepEqual(x.info,y.info);
   for(let p=3;p<x.data.length;p+=4)assert.equal(y.data[p],x.data[p],quality+':'+a.id+' alpha '+p);replaced++;
  }
  assert.deepEqual(normalized,JSON.parse(JSON.stringify(old.manifest)));assert.equal(replaced,12);
  report.packs.push({quality,layers:old.manifest.layers.length,replaced,unchanged,decodedAlphaIdentical:true,geometryAndMotionIdentical:true});
 }
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const page=await browser.newPage({viewport:{width:1518,height:1036}});page.on('pageerror',e=>report.browserErrors.push(e.message));
  await page.goto('file:///'+root.replaceAll('\\','/')+'/map-surroundings-preview-3.html');await page.waitForFunction(()=>window.GoiVietHomeIntro);await page.evaluate(async()=>{await GoiVietHomeIntro.ready;await document.fonts.ready;});
  assert.equal(await page.evaluate(()=>GoiVietHomeIntro.getState().phase),'waiting');
  await page.locator('#btnHomeOpeningStart').click();await page.waitForTimeout(1100);
  const playing=await page.evaluate(()=>GoiVietHomeIntro.getState());assert.equal(playing.phase,'playing');
  await page.locator('#btnHomeOpeningSkip').click();assert.equal(await page.evaluate(()=>GoiVietHomeIntro.getState().phase),'complete');
  await page.locator('#btnHomeOpeningReplay').click();assert.equal(await page.evaluate(()=>GoiVietHomeIntro.getState().phase),'playing');
  report.controls={start:true,skip:true,replay:true};await page.evaluate(()=>GoiVietHomeIntro.seek(12,true));
  for(const [width,height]of [[1518,1036],[1920,1080],[1440,900],[1366,768],[1280,720],[2560,1080],[820,1180],[390,844],[375,667],[320,568],[844,390],[568,320]]){
   await page.setViewportSize({width,height});await page.waitForTimeout(180);await page.evaluate(()=>GoiVietHomeIntro.seek(12,true));
   const state=await page.evaluate(()=>{const frame=document.querySelector('#intro'),cta=document.querySelector('#btnQuickStartWelcome'),r=cta.getBoundingClientRect();return{canvas:[homeSceneCanvas.width,homeSceneCanvas.height],failed:GoiVietHomeIntro.getState().failed,overflow:document.documentElement.scrollWidth>innerWidth,cta:{width:r.width,height:r.height,visible:getComputedStyle(cta).visibility}};});
   assert.equal(state.failed,false);assert.equal(state.overflow,false);assert.equal(state.cta.visible,'visible');assert.ok(state.cta.width>=44&&state.cta.height>=44);
   if(width===390||width===844)await page.screenshot({path:path.join(out,'after','responsive-'+width+'.png')});report.responsive.push({width,height,...state});
  }
  await page.setViewportSize({width:1518,height:1036});await page.evaluate(()=>GoiVietHomeIntro.seek(12,true));
  await page.locator('#btnHomeExploreMemory').click();await page.waitForTimeout(500);report.middleNavigation=await page.locator('#memoryChapter').evaluate(e=>({ariaHidden:e.getAttribute('aria-hidden'),inert:e.inert}));assert.notEqual(report.middleNavigation.ariaHidden,'true');assert.equal(report.middleNavigation.inert,false);
  const reduced=await browser.newPage({reducedMotion:'reduce',viewport:{width:1518,height:1036}});await reduced.goto('file:///'+root.replaceAll('\\','/')+'/map-surroundings-preview-3.html');await reduced.waitForFunction(()=>window.GoiVietHomeIntro);await reduced.evaluate(()=>GoiVietHomeIntro.ready);await reduced.locator('#btnHomeOpeningStart').click();assert.equal(await reduced.evaluate(()=>GoiVietHomeIntro.getState().phase),'complete');report.reducedMotion=true;
  await reduced.locator('#btnQuickStartWelcome').click();await reduced.waitForTimeout(300);assert.equal(await reduced.locator('#introScreen').evaluate(e=>e.classList.contains('intro-hidden')),true);report.mapNavigation=true;
  const high=await browser.newPage({viewport:{width:2560,height:1440}});await high.goto('file:///'+root.replaceAll('\\','/')+'/map-surroundings-preview-3.html');await high.waitForFunction(()=>window.GoiVietHomeIntro);await high.evaluate(()=>GoiVietHomeIntro.ready);assert.equal(await high.locator('#homeSceneCanvas').getAttribute('data-asset-quality'),'4k');await high.evaluate(()=>GoiVietHomeIntro.seek(12,true));assert.equal(await high.evaluate(()=>GoiVietHomeIntro.getState().failed),false);report.highResolutionBrowser=true;
  assert.equal(report.browserErrors.length,0);
 }finally{await browser.close();}
 await fs.writeFile(path.join(out,'verification-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1;});
