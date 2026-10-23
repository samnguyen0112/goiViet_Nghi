const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/memory-rail-v6');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),report={errors:[],contacts:[],smoke:[],assets:[]};
 const geometry=JSON.parse(await fs.readFile(path.join(root,'assets/goi-viet/memory-rail-v6/geometry.json'),'utf8'));
 try{
  const page=await browser.newPage({viewport:{width:1200,height:595},reducedMotion:'reduce'});
  page.on('pageerror',e=>report.errors.push(e.message));
  await page.route('http://memory.local/**',async route=>{
   try{const file=path.resolve(root,'.'+decodeURIComponent(new URL(route.request().url()).pathname));if(!file.startsWith(root+path.sep))return route.abort();
    const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.mp3':'audio/mpeg'};
    await route.fulfill({body:await fs.readFile(file),contentType:types[path.extname(file)]||'application/octet-stream'});
   }catch{await route.fulfill({status:404,body:''});}
  });
  await page.goto('http://memory.local/map-surroundings-preview-3.html');
  await page.waitForFunction(()=>window.GoiVietHomeIntro&&window.GoiVietMemoryChapter&&window.GoiVietMemorySmoke);
  await page.evaluate(async()=>{window.GoiVietHomeIntro.skip();window.GoiVietMemoryChapter.begin();await document.fonts.ready;await Promise.all([...document.querySelectorAll('#memoryChapter img')].map(async i=>{i.loading='eager';try{await i.decode();}catch{}}));});
  for(const width of [320,390,795,1200,1440,1920]){
   await page.setViewportSize({width,height:Math.max(900,Math.ceil(width*394/795))});
   await page.locator('.n6-exit-world').scrollIntoViewIfNeeded();
   await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(()=>document.body.classList.remove('reduced-motion'));
   await page.waitForFunction(()=>document.querySelector('.n6-train').getAnimations().some(a=>a.animationName==='n6-arrival'));
   for(const time of [0,geometry.motion.duration*.25,geometry.motion.duration*.75,geometry.motion.duration]){
    await page.locator('.n6-train').evaluate((el,time)=>{const a=el.getAnimations()[0];a.pause();a.currentTime=time;},time);
    const contact=await page.evaluate(({B,m})=>{
     const rect=document.querySelector('.n6-exit-world').getBoundingClientRect(),scale=rect.width/795;
     const points=[...document.querySelectorAll('.n6-wheel-contact')].map(el=>{const r=el.getBoundingClientRect(),x=(r.left-rect.left)/scale,y=(r.top-rect.top)/scale;return {x,y,error:Math.abs(y-(B+m*x))};});
     return {width:innerWidth,overflow:document.getElementById('introScreen').scrollWidth>innerWidth,maximumError:Math.max(...points.map(p=>p.error)),points};
    },{B:geometry.rail.authoringIntercept,m:geometry.rail.screenSlope});
    assert(!contact.overflow);assert(contact.maximumError<.22,`${width}/${time}: wheel/rail mismatch ${contact.maximumError}`);
    report.contacts.push({width,time,maximumError:contact.maximumError});
   }
   await page.emulateMedia({reducedMotion:'reduce'});
  }
  await page.setViewportSize({width:1200,height:595});await page.locator('.n6-exit-world').scrollIntoViewIfNeeded();
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.waitForFunction(()=>document.querySelector('.n6-train').getAnimations().length>0);
  await page.locator('.n6-train').evaluate(el=>{const a=el.getAnimations()[0];a.currentTime=0;a.play();});
  const capture=async(name)=>{
   const state=await page.evaluate(()=>window.GoiVietMemorySmoke.getState());
   report.smoke.push({name,...state});await page.locator('.n6-exit-world').screenshot({path:path.join(out,name+'.png')});return state;
  };
  await page.waitForTimeout(2200);const moving=await capture('running');assert.equal(moving.mode,'moving');assert(moving.particles>20);
  await page.waitForTimeout(2400);await capture('midway');
  await page.waitForFunction(()=>{const a=document.querySelector('.n6-train').getAnimations()[0];return a.currentTime>=a.effect.getTiming().duration;});
  await page.waitForTimeout(400);const stopped=await capture('stopped');assert.equal(stopped.mode,'idle');assert(stopped.running);assert(stopped.particles>20);
  await page.waitForTimeout(1200);const continuing=await capture('idle-smoke');assert(continuing.emitted>stopped.emitted);assert(continuing.bounds.left<continuing.origin.x-25);assert(continuing.bounds.top<continuing.origin.y-15);
  await page.locator('#introScreen').evaluate(el=>el.scrollTo({top:0,behavior:'instant'}));await page.waitForFunction(()=>!window.GoiVietMemorySmoke.getState().running,{},{timeout:3000});
  assert.equal(await page.evaluate(()=>window.GoiVietMemorySmoke.getState().running),false);report.offscreenPauses=true;
  await page.locator('.n6-exit-world').scrollIntoViewIfNeeded();await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(100);
  const reduced=await page.evaluate(()=>window.GoiVietMemorySmoke.getState());assert(!reduced.running&&reduced.mode==='still');report.reducedMotionStaticSmoke=true;
  await page.locator('#memoryOpenMap').click();await page.waitForFunction(()=>document.getElementById('introScreen').classList.contains('intro-hidden'));report.mapEntry=true;
  assert(!await page.evaluate(()=>window.GoiVietMemorySmoke.getState().running));report.mapPausesSmoke=true;
  const manifest=JSON.parse(await fs.readFile(path.join(root,'assets/goi-viet/memory-rail-v6/assets.json'),'utf8'));
  for(const a of manifest.assets){const bytes=await fs.readFile(path.join(root,'assets/goi-viet/memory-rail-v6',a.source));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),a.sha256);report.assets.push({id:a.id,originalHashVerified:true});}
  const before=await fs.readFile(path.join(out,'before.html'),'utf8'),after=await fs.readFile(path.join(root,'map-surroundings-preview-3.html'),'utf8');
  const middle=html=>html.slice(html.indexOf('<section class="mc-destination'),html.indexOf('</section>',html.indexOf('<section class="mc-destination'))+10);
  const normalize=html=>html.replace(middle(html),'DESTINATION').replace(/<link rel="stylesheet" href="assets\/goi-viet\/map-surroundings-preview\/memory-rail-v6.css[^>]+>\s*/,'').replace(/<script src="assets\/goi-viet\/map-surroundings-preview\/memory-train-smoke-v6.js[^>]+><\/script>\s*/,'').replace(/<script src="assets\/goi-viet\/map-surroundings-preview\/memory-train-wheels-v7.js[^>]+><\/script>\s*/,'');
  assert.equal(normalize(after),normalize(before));report.otherMarkupPreserved=true;
  assert.deepEqual(report.errors,[]);await fs.writeFile(path.join(out,'checks.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
