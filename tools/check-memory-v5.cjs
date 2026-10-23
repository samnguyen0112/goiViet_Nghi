const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {chromium}=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/memory-reference-v5');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const report={errors:[],layouts:[],questions:[],assets:[]};
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  page.on('pageerror',e=>report.errors.push(e.message));
  await page.route('http://memory.local/**',async route=>{
   try{const file=path.resolve(root,'.'+decodeURIComponent(new URL(route.request().url()).pathname));
    if(!file.startsWith(root+path.sep))return route.abort();
    const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.mp3':'audio/mpeg'};
    await route.fulfill({body:await fs.readFile(file),contentType:types[path.extname(file)]||'application/octet-stream'});
   }catch{await route.fulfill({status:404,body:''});}
  });
  const load=async()=>{await page.goto('http://memory.local/map-surroundings-preview-3.html');await page.waitForFunction(()=>window.GoiVietMemoryChapter&&window.GoiVietHomeIntro);await page.evaluate(async()=>{await window.GoiVietHomeIntro.ready;window.GoiVietHomeIntro.skip();await document.fonts.ready;});};
  await load();
  assert.equal(await page.locator('#memoryChapter').evaluate(e=>e.inert),true);
  await page.locator('#btnHomeExploreMemory').click();
  assert.equal(await page.locator('#memoryChapter').evaluate(e=>e.inert),false);
  report.homeButtonUnlocks=true;
  for(const width of [320,390,700,720,795,820,1440,1920]){
   await page.setViewportSize({width,height:900});
   const info=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.getElementById('introScreen').scrollWidth,
    copy:[...document.querySelectorAll('.mc-memory-copy')].map(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right};})}));
   assert(info.scrollWidth<=width+1,`${width}: horizontal overflow`);
   assert(info.copy.every(r=>r.left>=0&&r.right<=width+1),`${width}: clipped memory copy`);
   report.layouts.push(info);
   const heights=[];
   for(let n=0;n<9;n++){
    await page.locator('#memoryNextCard').click();
    const fit=await page.locator('.mc-card-question-frame').evaluate(e=>({box:e.clientHeight,content:e.firstElementChild.offsetHeight,front:e.closest('.mc-card-front').offsetHeight}));
    assert(fit.content<=fit.box+1,`${width}: question overflows ${JSON.stringify(fit)}`);heights.push(fit.front);
   }
   assert(Math.max(...heights)-Math.min(...heights)<2,`${width}: changing card changes layout height`);
   report.questions.push({width,count:9,fit:true});
  }
  await page.setViewportSize({width:1440,height:900});
  await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(()=>document.body.classList.remove('reduced-motion'));
  await page.locator('#memoryNextCard').click();
  await page.waitForFunction(()=>!window.GoiVietMemoryChapter.getState().flipping);
  assert.equal(await page.locator('.mc-card-under').evaluate(e=>getComputedStyle(e).visibility),'visible');
  report.animatedFlipKeepsRearCard=true;
  await page.locator('.n5-train').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('.n5-train').classList.contains('is-visible'));
  report.trainAnimation=await page.locator('.n5-train').evaluate(e=>({name:getComputedStyle(e).animationName,repeat:getComputedStyle(e).animationIterationCount}));
  assert.equal(report.trainAnimation.name,await page.locator('.n5-train').evaluate(e=>e.classList.contains('n6-train')?'n6-arrival':'n5-arrival'));assert.equal(report.trainAnimation.repeat,'1');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.locator('#memoryOpenMap').click();await page.waitForFunction(()=>document.getElementById('introScreen').classList.contains('intro-hidden'));
  report.mapEntry=true;
  await page.evaluate(()=>openIntroModal('welcome'));await page.waitForFunction(()=>!document.getElementById('introScreen').classList.contains('intro-hidden'));
  assert.equal(await page.locator('#introScreen').getAttribute('data-memory-unlocked'),'false');report.returnLocksChapter=true;
  const manifest=JSON.parse(await fs.readFile(path.join(root,'assets/goi-viet/memory-reference-v5/assets.json'),'utf8'));
  for(const a of manifest.assets){
   const source=await fs.readFile(path.join(root,'assets/goi-viet/memory-reference-v5',a.source));
   assert.equal(crypto.createHash('sha256').update(source).digest('hex'),a.sha256);
   const m=await sharp(path.join(root,'assets/goi-viet/memory-reference-v5',a.file)).metadata();
   assert(m.width<=a.generatedWidth&&m.height<=a.generatedHeight);assert(a.variants.every(v=>v.width<a.width));
   report.assets.push({id:a.id,native:[m.width,m.height],sourceHashVerified:true,noUpscaledExports:true});
  }
  assert.deepEqual(report.errors,[]);await fs.writeFile(path.join(out,'checks.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
