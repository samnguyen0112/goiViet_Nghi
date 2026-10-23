const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/memory-all-wheels');
(async()=>{
 await fs.mkdir(out,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const report={errors:[],poses:[],wheelPixels:[],layouts:[]},captures=[];
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  page.on('pageerror',e=>report.errors.push(e.message));
  await page.route('http://memory.local/**',async route=>{
   try{const file=path.resolve(root,'.'+decodeURIComponent(new URL(route.request().url()).pathname));if(!file.startsWith(root+path.sep))return route.abort();
    const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.mp3':'audio/mpeg'};
    await route.fulfill({body:await fs.readFile(file),contentType:types[path.extname(file)]||'application/octet-stream'});
   }catch{await route.fulfill({status:404,body:''});}
  });
  await page.goto('http://memory.local/map-surroundings-preview-3.html');
  await page.waitForFunction(()=>window.GoiVietMemoryWheels?.getState().ready&&window.GoiVietMemoryChapter&&window.GoiVietHomeIntro);
  await page.evaluate(async()=>{GoiVietHomeIntro.skip();GoiVietMemoryChapter.begin();await document.fonts.ready;await Promise.all([...document.querySelectorAll('#memoryChapter img')].map(async i=>{i.loading='eager';try{await i.decode();}catch{}}));
   const image=new Image();image.src=document.querySelector('.n7-native-wheels').dataset.nativeSrc;await image.decode();window.NativeCoachReviewSource=image;
  });
  await page.locator('.n6-exit-world').scrollIntoViewIfNeeded();await page.emulateMedia({reducedMotion:'no-preference'});
  await page.waitForFunction(()=>document.querySelector('.n6-train').getAnimations().length>0);
  for(const time of [9000,9250,10000,11900,12000]){
   await page.locator('.n6-train').evaluate((el,time)=>{const a=el.getAnimations()[0];a.pause();a.currentTime=time;document.getElementById('introScreen').dispatchEvent(new Event('scroll'));},time);
   await page.waitForFunction(t=>{const s=GoiVietMemoryWheels.getState();return s.mode===(t>=12000?'stopped':'paused')&&Math.abs(s.distance-(parseFloat(getComputedStyle(document.querySelector('.n6-train')).translate)/(document.querySelector('.n6-exit-world').getBoundingClientRect().width/795)+397.5))<.015;},time);
   const state=await page.evaluate(()=>GoiVietMemoryWheels.getState());assert.equal(state.coachWheels.length,8);
   assert(state.coachWheels.every(w=>w.phase>state.phase));report.poses.push({time,...state});
   if(time<9500){
    captures.push(await page.evaluate(()=>[...document.querySelectorAll('.n7-coach-wheels')].map(el=>{
     const composite=document.createElement('canvas');composite.width=el.width;composite.height=el.height;const c=composite.getContext('2d');
     c.drawImage(window.NativeCoachReviewSource,-Number(el.dataset.nativeLeft),0);c.drawImage(el,0,0);
     return {left:Number(el.dataset.nativeLeft),width:el.width,data:composite.toDataURL('image/png').split(',')[1]};
    })));
   }
  }
  const source=await sharp(path.join(root,'assets/goi-viet/memory-rail-v6/train-front-stack.webp')).ensureAlpha().raw().toBuffer();
  for(let coach=0;coach<4;coach++){
   const first=captures[0][coach],second=captures[1][coach],wheels=report.poses[0].coachWheels.filter(w=>w.coach===coach);
   const before=await sharp(Buffer.from(first.data,'base64')).ensureAlpha().raw().toBuffer(),after=await sharp(Buffer.from(second.data,'base64')).ensureAlpha().raw().toBuffer();
   let outsideChanged=0,compared=0;const changed=wheels.map(()=>0);
   for(let y=0;y<504;y++)for(let lx=0;lx<first.width;lx++){
    const x=lx+first.left,i=(y*first.width+lx)*4,original=(y*2102+x)*4;
    // Include the browser's roughly one-pixel antialias fringe in the wheel region.
    const wi=wheels.findIndex(w=>Math.hypot((x-w.x)/(w.radius*.76),(y-w.y)/(w.radius*.89))<=.82);
    if(wi>=0){if(Math.max(...[0,1,2].map(c=>Math.abs(before[i+c]-after[i+c])))>10)changed[wi]++;}
    else if(source[original+3]>245){compared++;if(Math.max(...[0,1,2,3].map(c=>Math.abs(before[i+c]-source[original+c])))>2)outsideChanged++;}
   }
   assert.equal(outsideChanged,0,`Coach ${coach}: changed body pixels`);changed.forEach(n=>assert(n>35,`Coach ${coach}: spokes did not rotate`));
   report.wheelPixels.push({coach,changed,compared,outsideChanged});
   await sharp(Buffer.from(first.data,'base64')).png().toFile(path.join(out,`coach-${coach}-9000.png`));
   await sharp(Buffer.from(second.data,'base64')).png().toFile(path.join(out,`coach-${coach}-9250.png`));
  }
  const final=await page.evaluate(()=>GoiVietMemoryWheels.getState());await page.waitForTimeout(300);const idle=await page.evaluate(()=>GoiVietMemoryWheels.getState());
  assert.equal(final.draws,idle.draws);assert.deepEqual(final.coachWheels,idle.coachWheels);assert(!idle.running);report.allWheelsStop=true;
  for(const width of [320,390,795,1440]){
   await page.setViewportSize({width,height:Math.max(700,Math.ceil(width*394/795))});await page.locator('.n6-exit-world').scrollIntoViewIfNeeded();
   const layout=await page.evaluate(()=>({width:innerWidth,overflow:document.getElementById('introScreen').scrollWidth>innerWidth,coaches:[...document.querySelectorAll('.n7-coach-wheels')].map(el=>({canvas:getComputedStyle(el).visibility,original:getComputedStyle(el.previousElementSibling).visibility}))}));
   assert(!layout.overflow);assert(layout.coaches.every(c=>c.canvas==='visible'&&c.original==='visible'));report.layouts.push(layout);
   await page.locator('.n6-exit-world').screenshot({path:path.join(out,`scene-${width}.png`)});
  }
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(80);
  assert(await page.locator('.n7-coach-wheels').evaluateAll(els=>els.every(el=>getComputedStyle(el).visibility==='hidden'&&getComputedStyle(el.previousElementSibling).visibility==='visible')));report.reducedMotionOriginal=true;
  const normalize=s=>s.replace(/<canvas class="n7-coach-wheels"[^>]*><\/canvas>/g,'').replace(/(memory-(?:rail-v6\.css|train-wheels-v7\.js))\?[^"\s]+/g,'$1');
  assert.equal(normalize(await fs.readFile(path.join(root,'map-surroundings-preview-3.html'),'utf8')),normalize(await fs.readFile(path.join(out,'before.html'),'utf8')));report.otherMarkupUnchanged=true;
  assert.deepEqual(report.errors,[]);await fs.writeFile(path.join(out,'checks.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({poses:report.poses.length,wheels:8,wheelPixels:report.wheelPixels,layouts:report.layouts.length,errors:report.errors,allWheelsStop:true,reducedMotionOriginal:true,otherMarkupUnchanged:true}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
