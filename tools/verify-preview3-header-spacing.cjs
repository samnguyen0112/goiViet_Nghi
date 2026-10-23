const fs=require('node:fs/promises'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/header-spacing-20261019');
(async()=>{
 process.env.TEMP=process.env.TMP=path.join(root,'scratch');await fs.mkdir(out,{recursive:true});
 const box={window:{}};vm.runInNewContext(await fs.readFile(path.join(root,'assets/goi-viet/homepage-balanced-3/assets-2k.js'),'utf8'),box);
 const manifest=box.window.GoiVietHomeLayeredData.manifest;
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),errors=[],reports=[];
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.join(root,'map-surroundings-preview-3.html')).href,{waitUntil:'load'});
  await page.waitForFunction(()=>window.GoiVietHomeIntro&&window.GoiVietMemoryChapter);
  await page.evaluate(async()=>{window.GoiVietHomeIntro.skip();await document.fonts.ready;await Promise.all([...document.querySelectorAll('#homepageContent img')].map(im=>im.decode()));document.activeElement.blur();});
  assert.equal(await page.locator('#memoryMapShortcut').count(),0);
  for(const [name,width,height] of [['desktop',1440,900],['laptop',1366,768],['compact-laptop',1280,720],['wide',1920,1080],['ultrawide',2560,1080],['tablet',820,1180],['mobile',390,844],['compact-mobile',375,667],['small-mobile',320,568],['landscape',844,390],['small-landscape',568,320],['4k',3840,2160]]){
   await page.setViewportSize({width,height});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   const info=await page.evaluate(m=>{
    const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,right:r.right,y:r.y,bottom:r.bottom,width:r.width,height:r.height};};
    const plane=rect('.gv-home-scene-plane'),bridge=m.layers.find(l=>l.id==='bridge').rect;
    return {logo:rect('.gv-home-logo'),tagline:rect('.gv-home-tagline'),title:rect('.gv-home-lettering'),subtitle:rect('.gv-home-memory-line'),panel:rect('#homepageContent'),roof:m.layers.find(l=>l.id==='hue').rect[1]*plane.height/m.height+plane.y,bridgeFoot:plane.y+(bridge[1]+bridge[3])*plane.height/m.height,overflow:document.getElementById('introScreen').scrollWidth};
   },manifest);
   for(const key of ['logo','tagline','title','subtitle','panel'])assert(info[key].x>=-1&&info[key].right<=width+1,name+': clipped '+key);
   assert(info.tagline.y>info.logo.bottom,name+': logo/tagline overlap');assert(info.title.y>info.tagline.bottom,name+': title/tagline overlap');assert(info.subtitle.y>info.title.bottom,name+': subtitle/title overlap');
   if(info.subtitle.x<width/2&&info.subtitle.right>width/2)assert(info.subtitle.bottom<=info.roof-4,name+': text overlaps palace');
   if(width>1000&&height>700)assert(info.panel.y>=info.bridgeFoot-2,name+': panel overlaps railway');assert(info.overflow<=width+1,name+': horizontal overflow');
   await page.screenshot({path:path.join(out,name+'.jpg'),quality:90});reports.push({name,width,height,...info});console.log(JSON.stringify({name,copyBottom:info.subtitle.bottom,roof:info.roof,roofGap:info.roof-info.subtitle.bottom}));
  }
  await page.setViewportSize({width:1440,height:900});await page.locator('#btnProceedToGuide').click();
  await page.waitForFunction(()=>document.getElementById('introScreen').dataset.memoryUnlocked==='true');
  assert.notEqual(await page.locator('#memoryChapter').getAttribute('aria-hidden'),'true');
  assert(await page.evaluate(()=>document.activeElement.id==='memoryChapter'));assert.deepEqual(errors,[]);
  await fs.writeFile(path.join(out,'checks.json'),JSON.stringify({reports,errors},null,2));
  console.log('PASS: shortcut removed, twelve viewport layouts, chapter navigation, no runtime errors.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
