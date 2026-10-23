const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/memory-native-v4');
(async()=>{
 await fs.mkdir(path.join(out,'browser-temp'),{recursive:true});process.env.TEMP=process.env.TMP=path.join(out,'browser-temp');
 const manifest=JSON.parse(await fs.readFile(path.join(root,'assets/goi-viet/memory-native-v4/assets.json'),'utf8'));
 for(const [id,a]of Object.entries(manifest.assets)){
  assert(a.width<=a.generatedWidth&&a.height<=a.generatedHeight,id+': enlarged native export');
  assert(a.variants.every(v=>v.width<a.width),id+': enlarged responsive export');
 }
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),report={errors:[],frames:[]};
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/map-surroundings-preview-3.html',{waitUntil:'load'});
  await page.waitForFunction(()=>window.GoiVietMemoryChapter&&window.GoiVietHomeIntro);
  await page.mouse.move(700,600);await page.mouse.wheel(0,1000);
  assert.equal(await page.locator('#introScreen').evaluate(el=>el.scrollTop),0,'Homepage wheel lock broken');
  assert(await page.locator('#memoryChapter').evaluate(el=>el.inert),'Chapter accessible before entry');
  await page.evaluate(async()=>{window.GoiVietHomeIntro.skip();window.GoiVietMemoryChapter.begin();await document.fonts.ready;await Promise.all([...document.querySelectorAll('.mc img')].map(img=>{img.loading='eager';return img.decode();}));});
  await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'memoryNextCard','Tab misses chapter action');
  await page.locator('.mc-destination').evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
  await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(()=>document.body.classList.remove('reduced-motion'));
  const group=page.locator('.n4-arriving-train');
  await group.evaluate(el=>{el.classList.add('is-visible');for(const a of el.getAnimations()){a.pause();a.currentTime=0;}});
  const composition=JSON.parse(await fs.readFile(path.join(root,'assets/goi-viet/memory-native-v4/composition.json'),'utf8'));
  let previousX=-Infinity,baseline,firstX;
  for(const time of [0,1800,4200,6800]){
   await group.evaluate((el,time)=>{for(const a of el.getAnimations()){a.pause();a.currentTime=time;}},time);
   const g=await page.evaluate(c=>{
    const el=document.querySelector('.n4-perspective-train'),train=el.getBoundingClientRect(),scene=document.querySelector('.n4-perspective-scene').getBoundingClientRect();
    const railAt=x=>scene.top+c.railIntercept*scene.height/546+c.railSlope*(x-scene.left);
    const contacts=c.wheelContacts.map(([x,y])=>{const px=train.left+x/2030*train.width,py=train.top+y/405*train.height;return {x:px,y:py,rail:railAt(px)};});
    return {x:train.x,right:train.right,y:train.y,width:train.width,height:train.height,stationLeft:document.querySelector('.n4-station').getBoundingClientRect().left,transform:getComputedStyle(el).transform,sceneTransform:getComputedStyle(document.querySelector('.n4-perspective-scene')).transform,pixelsPerUnit:scene.width/971,contacts};
   },composition);
   assert(g.x>=previousX,'Train reverses during arrival');previousX=g.x;
   assert(g.right+10<g.stationLeft,'Train hides station during arrival');
   if(baseline===undefined){baseline=g.y;firstX=g.x;}
   assert.equal(g.transform,'none','Train perspective distorted by CSS transform');
   assert.equal(g.sceneTransform,'none','Scene perspective distorted by CSS transform');
   assert(Math.abs(g.y-baseline-(g.x-firstX)*composition.railSlope)<.2,'Train leaves diagonal route');
   assert(g.contacts.every(p=>Math.abs(p.y-p.rail)<4*g.pixelsPerUnit),'Painted wheel contacts leave the rail: '+JSON.stringify(g));
   await page.screenshot({path:path.join(out,'train-'+time+'.png')});report.frames.push({time,...g});
  }
  assert(report.frames[3].x-report.frames[2].x<report.frames[1].x-report.frames[0].x,'Arrival does not slow down');
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await group.evaluate(el=>getComputedStyle(el).animationName),'none','Reduced-motion train is still animated');
  await page.emulateMedia({reducedMotion:'no-preference'});
  // Flush matchMedia change handlers before exercising the manual setting.
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  await page.evaluate(()=>document.body.classList.add('reduced-motion'));
  assert.equal(await group.evaluate(el=>getComputedStyle(el).animationName),'none','Manual reduced-motion setting ignored');
  assert.deepEqual(report.errors,[]);
  report.nativeAssets=Object.keys(manifest.assets).length;report.noUpscaling=true;report.scrollLock=true;report.keyboard=true;report.reducedMotion=true;
  await fs.writeFile(path.join(out,'motion-checks.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({nativeAssets:report.nativeAssets,noUpscaling:true,scrollLock:true,keyboard:true,reducedMotion:true,errors:report.errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
