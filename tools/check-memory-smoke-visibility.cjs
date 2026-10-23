// Verify composited smoke pixels, not only live particle counters.
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/memory-white-smooth');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),report={errors:[],screens:[]};
 try{
  for(const [width,reduced] of [[1440,false],[795,false],[390,false],[795,true]]){
   const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
   page.on('pageerror',e=>report.errors.push(e.message));
   await page.goto('file:///'+root.replaceAll('\\','/')+'/map-surroundings-preview-3.html');
   await page.waitForFunction(()=>window.GoiVietMemorySmoke&&window.GoiVietMemoryChapter&&window.GoiVietHomeIntro);
   await page.evaluate(async()=>{GoiVietHomeIntro.skip();GoiVietMemoryChapter.begin();await document.fonts.ready;await Promise.all([...document.querySelectorAll('#memoryChapter img')].map(async i=>{i.loading='eager';try{await i.decode();}catch{}}));});
   await page.locator('.n6-exit-world').scrollIntoViewIfNeeded();
   if(!reduced){
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.waitForFunction(()=>document.querySelector('.n6-train').getAnimations().length);
    await page.locator('.n6-train').evaluate(el=>{const a=el.getAnimations()[0];a.currentTime=a.effect.getTiming().duration+100;a.pause();});
    await page.waitForTimeout(4800);
    const before=await page.evaluate(()=>GoiVietMemorySmoke.getState().emitted);
    await page.evaluate(()=>document.body.classList.add('smoke-visibility-check'));
    await page.waitForTimeout(250);
    assert((await page.evaluate(()=>GoiVietMemorySmoke.getState().emitted))>before,'Unrelated body class stopped smoke');
    await page.evaluate(()=>document.body.classList.remove('smoke-visibility-check'));
   }else await page.waitForTimeout(100);
   // Freeze only the canvas pixels; preserve the live layout and all compositing layers.
   const state=await page.evaluate(()=>{
    const c=document.querySelector('.n6-smoke'),copy=c.cloneNode();copy.getContext('2d').drawImage(c,0,0);c.replaceWith(copy);
    const raw=copy.getContext('2d').getImageData(0,0,copy.width,copy.height).data;
    let solid=0,white=0;for(let i=0;i<raw.length;i+=4)if(raw[i+3]>64){solid++;if(raw[i]>=246&&raw[i+1]>=246&&raw[i+2]>=246)white++;}
    return {...GoiVietMemorySmoke.getState(),whitePixelRatio:solid?white/solid:0};
   });
   const id=`${width}-${reduced?'reduced':'idle'}`;
   const visible=await page.locator('.n6-exit-world').screenshot({path:path.join(out,id+'.png')});
   await page.locator('.n6-smoke').evaluate(el=>el.style.opacity='0');
   const hidden=await page.locator('.n6-exit-world').screenshot();
   const a=await sharp(visible).ensureAlpha().raw().toBuffer({resolveWithObject:true}),b=await sharp(hidden).ensureAlpha().raw().toBuffer();
   const scale=width/795,origin=state.origin;
   let darkened=0,lightened=0,changed=0,total=0;
   for(let y=Math.max(0,Math.floor((origin.y-110)*scale));y<Math.min(a.info.height,Math.ceil(origin.y*scale));y++){
    for(let x=Math.max(0,Math.floor((origin.x-140)*scale));x<Math.min(a.info.width,Math.ceil((origin.x+10)*scale));x++){
     const i=(y*a.info.width+x)*4,la=.2126*a.data[i]+.7152*a.data[i+1]+.0722*a.data[i+2],lb=.2126*b[i]+.7152*b[i+1]+.0722*b[i+2];
     if(Math.abs(la-lb)>5)changed++;if(lb-la>18&&lb>130)darkened++;if(la-lb>18&&lb>120&&lb<235)lightened++;total++;
    }
   }
   const normalizedDarkened=darkened/(scale*scale),normalizedLightened=lightened/(scale*scale);
   assert(normalizedLightened>450,`${id}: white smoke blends into scene (${normalizedLightened})`);
   assert(state.whitePixelRatio>.98,`${id}: smoke is not white`);
   assert(normalizedDarkened<30,`${id}: smoke has a dark core`);
   assert(reduced?!state.running:state.running,`${id}: wrong motion state`);
   report.screens.push({width,reduced,state,changed,darkened,lightened,normalizedDarkened,normalizedLightened,regionPixels:total});
   await page.close();
  }
  assert.deepEqual(report.errors,[]);await fs.writeFile(path.join(out,'checks.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
