const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/memory-native-wheels');
(async()=>{
 await fs.mkdir(out,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const report={errors:[],phases:[],layouts:[]};
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  page.on('pageerror',e=>report.errors.push(e.message));
  await page.route('http://memory.local/**',async route=>{
   try{const file=path.resolve(root,'.'+decodeURIComponent(new URL(route.request().url()).pathname));if(!file.startsWith(root+path.sep))return route.abort();
    const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.mp3':'audio/mpeg'};
    let body=await fs.readFile(file);
    if(process.argv.includes('--debug-assets')&&file.endsWith('memory-train-wheels-v7.js'))body=Buffer.from(body.toString().replace('ready=true;schedule();','window.NativeWheelDebug={body,rod,wheels};ready=true;schedule();'));
    await route.fulfill({body,contentType:types[path.extname(file)]||'application/octet-stream'});
   }catch{await route.fulfill({status:404,body:''});}
  });
  await page.goto('http://memory.local/map-surroundings-preview-3.html');
  await page.waitForFunction(()=>window.GoiVietMemoryWheels?.getState().ready&&window.GoiVietMemoryChapter&&window.GoiVietHomeIntro);
  if(process.argv.includes('--debug-assets')){
   for(const id of ['body','rod','texture']){
    const data=await page.evaluate(id=>(id==='texture'?window.NativeWheelDebug.wheels[1].texture:window.NativeWheelDebug[id]).toDataURL('image/png').split(',')[1],id);
    let image=sharp(Buffer.from(data,'base64'));
    image=id==='texture'?image.resize(448,448):image.extract({left:1535,top:315,width:440,height:189}).resize(1760,756);
    await image.png().toFile(path.join(out,`debug-${id}.png`));
   }
  }
  await page.evaluate(async()=>{GoiVietHomeIntro.skip();GoiVietMemoryChapter.begin();await document.fonts.ready;await Promise.all([...document.querySelectorAll('#memoryChapter img')].map(async i=>{i.loading='eager';try{await i.decode();}catch{}}));});
  await page.locator('.n6-exit-world').scrollIntoViewIfNeeded();
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.waitForFunction(()=>document.querySelector('.n6-train').getAnimations().length>0);
  // Sample actual browser animation poses, including braking and the final stop.
  for(const time of [8500,8750,9000,9250,9500,10000,11000,11900,12000]){
   await page.locator('.n6-train').evaluate((el,t)=>{const a=el.getAnimations()[0];a.pause();a.currentTime=t;document.getElementById('introScreen').dispatchEvent(new Event('scroll'));},time);
   await page.waitForFunction(t=>{const s=GoiVietMemoryWheels.getState();return s.mode===(t>=12000?'stopped':'paused')&&Math.abs(s.distance-(Number.parseFloat(getComputedStyle(document.querySelector('.n6-train')).translate)/(document.querySelector('.n6-exit-world').getBoundingClientRect().width/795)+397.5))<.015;},time);
   const state=await page.evaluate(()=>GoiVietMemoryWheels.getState());
   assert(state.ready);assert.equal(state.nativePerspective,true);assert(state.phase>=0);
   for(let i=1;i<3;i++){
    const length=Math.hypot(state.pins[i].x-state.pins[i-1].x,state.pins[i].y-state.pins[i-1].y);
    assert(Math.abs(length-([0,Math.hypot(101,19),Math.hypot(97,17)][i]))<1e-9);
   }
   report.phases.push({time,...state});
   if([8500,9000,9500,12000].includes(time)){
    const data=await page.locator('.n7-native-wheels').evaluate(c=>c.toDataURL('image/png').split(',')[1]);
    await sharp(Buffer.from(data,'base64')).extract({left:1500,top:260,width:602,height:244}).resize(1204,488).png().toFile(path.join(out,`native-engine-${time}.png`));
   }
  }
  const end=await page.evaluate(()=>GoiVietMemoryWheels.getState());
  await page.waitForTimeout(450);const still=await page.evaluate(()=>GoiVietMemoryWheels.getState());
  assert.equal(still.phase,end.phase);assert.equal(still.draws,end.draws);assert(!still.running);assert.equal(still.mode,'stopped');
  report.stationaryWheelsStop=true;
  for(const width of [320,390,795,1440]){
   await page.setViewportSize({width,height:Math.max(700,Math.ceil(width*394/795))});
   await page.locator('.n6-exit-world').scrollIntoViewIfNeeded();await page.waitForTimeout(150);
   const layout=await page.evaluate(()=>({width:innerWidth,overflow:document.getElementById('introScreen').scrollWidth>innerWidth,originalVisibility:getComputedStyle(document.querySelector('[data-train-part="4"] .n6-train-art')).visibility,animatedVisibility:getComputedStyle(document.querySelector('.n7-native-wheels')).visibility}));
   assert(!layout.overflow);assert.equal(layout.animatedVisibility,'visible');report.layouts.push(layout);
   await page.locator('.n6-exit-world').screenshot({path:path.join(out,`scene-${width}.png`)});
  }
  // The original native pixels must remain identical outside the moving parts.
  const original=await sharp(path.join(root,'assets/goi-viet/memory-rail-v6/train-front-stack.webp')).ensureAlpha().raw().toBuffer();
  const data=await page.locator('.n7-native-wheels').evaluate(c=>c.toDataURL('image/png').split(',')[1]);
  const animated=await sharp(Buffer.from(data,'base64')).ensureAlpha().raw().toBuffer();
  let changed=0,compared=0;
  for(let y=0;y<504;y++)for(let x=1535;x<2102;x++){
   if(y>315&&x<1960)continue;
   const i=(y*2102+x)*4;if(original[i+3]<250)continue;
   compared++;if(Math.max(...[0,1,2,3].map(c=>Math.abs(original[i+c]-animated[i+c])))>2)changed++;
  }
  assert.equal(changed,0);report.bodyPixels={compared,changed};
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(100);
  assert.equal(await page.locator('[data-train-part="4"] .n6-train-art').evaluate(el=>getComputedStyle(el).visibility),'visible');
  assert(!await page.evaluate(()=>GoiVietMemoryWheels.getState().running));report.reducedMotionUsesOriginal=true;
  await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(200);
  await page.locator('#introScreen').evaluate(el=>el.scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(150);
  assert(!await page.evaluate(()=>GoiVietMemoryWheels.getState().running));report.offscreenPauses=true;
  const hashes=JSON.parse(await fs.readFile(path.join(out,'original-hashes.json'),'utf8'));
  for(const h of hashes){assert.equal(crypto.createHash('sha256').update(await fs.readFile(h.Path)).digest('hex').toUpperCase(),h.Hash);}
  report.originalFilesUnchanged=true;
  const before=await fs.readFile(path.join(out,'before.html'),'utf8'),after=await fs.readFile(path.join(root,'map-surroundings-preview-3.html'),'utf8');
  const normalize=s=>s.replace(/<canvas class="n7-(?:native|coach)-wheels"[^>]*><\/canvas>/g,'').replace(/<script src="assets\/goi-viet\/map-surroundings-preview\/memory-train-wheels-v7.js[^>]+><\/script>\s*/,'').replace(/memory-rail-v6\.css\?[^"\s]+/g,'memory-rail-v6.css');
  assert.equal(normalize(after),normalize(before));report.otherMarkupUnchanged=true;
  assert.deepEqual(report.errors,[]);await fs.writeFile(path.join(out,'checks.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
