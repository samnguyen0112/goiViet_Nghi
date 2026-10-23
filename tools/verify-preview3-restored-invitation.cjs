const fs=require('node:fs/promises'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/invitation-restored-20261019');
(async()=>{
 await fs.mkdir(out,{recursive:true});process.env.TEMP=process.env.TMP=path.join(root,'scratch');
 const box={window:{}};vm.runInNewContext(await fs.readFile(path.join(root,'assets/goi-viet/homepage-balanced-3/assets-2k.js'),'utf8'),box);
 const manifest=box.window.GoiVietHomeLayeredData.manifest;
 assert.equal(manifest.layers.find(l=>l.id==='bridge').rect[1],1274,'Railway must return to its original height');
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),errors=[],reports=[];
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.join(root,'map-surroundings-preview-3.html')).href,{waitUntil:'load'});
  await page.waitForFunction(()=>window.GoiVietHomeIntro&&window.GoiVietMemoryChapter);
  await page.evaluate(async()=>{window.GoiVietHomeIntro.skip();await document.fonts.ready;await Promise.all([...document.querySelectorAll('#homepageContent img')].map(im=>im.decode()));document.activeElement.blur();});
  for(const [name,width,height] of [['desktop',1440,900],['laptop',1366,768],['compact-laptop',1280,720],['wide',1920,1080],['ultrawide',2560,1080],['tablet',820,1180],['mobile',390,844],['compact-mobile',375,667],['small-mobile',320,568],['landscape',844,390],['small-landscape',568,320],['4k',3840,2160]]){
   await page.setViewportSize({width,height});
   await page.evaluate(async()=>{document.getElementById('introScreen').scrollTo({top:0,behavior:'instant'});await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
   const info=await page.evaluate(m=>{
    const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
    const plane=rect('.gv-home-scene-plane'),layer=m.layers.find(l=>l.id==='bridge');
    const roof=m.layers.find(l=>l.id==='hue').rect[1]*plane.height/m.height+plane.y;
    return {hero:rect('#introWelcomeStage'),header:rect('.gv-home-header'),logo:rect('.gv-home-logo'),tagline:rect('.gv-home-tagline'),heading:rect('.gv-home-lettering'),subtitle:rect('.gv-home-memory-line'),panel:rect('#homepageContent'),title:rect('#homepageHeading'),primary:rect('#btnQuickStartWelcome'),guide:rect('#btnProceedToGuide'),roof,bridge:plane.y+layer.rect[1]*plane.height/m.height,bridgeFoot:plane.y+(layer.rect[1]+layer.rect[3])*plane.height/m.height,scrollWidth:document.getElementById('introScreen').scrollWidth,features:document.querySelectorAll('#homepageContent .gv-home-features li').length,duplicatePrimary:document.querySelectorAll('#btnQuickStartWelcome').length};
   },manifest);
   await page.screenshot({path:path.join(out,name+'.jpg'),quality:90});
   if(info.hero.height>height+2){
    await page.mouse.move(width/2,height*.8);await page.mouse.wheel(0,500);await page.waitForTimeout(100);
    assert(await page.locator('#introScreen').evaluate(el=>el.scrollTop>0),name+': homepage mouse scroll is blocked');
    await page.locator('#btnProceedToGuide').scrollIntoViewIfNeeded();
    assert.equal(await page.locator('#introScreen').getAttribute('data-memory-unlocked'),'false',name+': scrolling opened next chapter');
    assert(await page.locator('#introScreen').evaluate(el=>el.scrollTop>0),name+': frame footer did not scroll into view');
    await page.screenshot({path:path.join(out,name+'-panel.jpg'),quality:90});
   }
   reports.push({name,width,height,...info});console.log(JSON.stringify({name,hero:info.hero.height,headerBottom:info.header.bottom,roof:info.roof,bridgeFoot:info.bridgeFoot,panelTop:info.panel.y,panelHeight:info.panel.height,panelBottom:info.panel.bottom}));
  }
  await fs.writeFile(path.join(out,'checks.json'),JSON.stringify({reports,errors},null,2));
  if(!process.argv.includes('--capture'))for(const r of reports){
   assert(r.scrollWidth<=r.width+1,r.name+': horizontal overflow');
   assert.equal(r.features,3);assert.equal(r.duplicatePrimary,1);
   for(const key of ['logo','tagline','heading','subtitle','panel']){const a=r[key];assert(a.x>=-1&&a.right<=r.width+1,r.name+': clipped '+key);}
   assert(r.subtitle.bottom<=r.roof-4,r.name+': upper copy overlaps palace');
   assert(r.panel.y>=r.bridgeFoot-2,r.name+': invitation covers bridge');
   assert(r.primary.height>=44&&r.guide.height>=44,r.name+': small action target');
   assert(r.panel.bottom<=r.hero.height+1,r.name+': panel outside hero');
  }
  await page.setViewportSize({width:1440,height:900});await page.evaluate(()=>document.getElementById('introScreen').scrollTo(0,0));
  await page.locator('#btnProceedToGuide').click();
  await page.waitForFunction(()=>document.getElementById('introScreen').dataset.memoryUnlocked==='true');
  assert.notEqual(await page.locator('#memoryChapter').getAttribute('aria-hidden'),'true');
  assert(await page.evaluate(()=>document.activeElement.id==='memoryChapter'));
  assert(await page.locator('#introScreen').evaluate(el=>el.scrollTop>100));
  assert.equal(await page.locator('#homeGuideDialog').count(),0);
  await page.screenshot({path:path.join(out,'guide-scroll.jpg'),quality:90});
  assert.deepEqual(errors,[]);await page.close();
  const animated=await browser.newPage({viewport:{width:1440,height:900}});animated.on('pageerror',e=>errors.push(e.message));
  await animated.goto(pathToFileURL(path.join(root,'map-surroundings-preview-3.html')).href,{waitUntil:'load'});
  await animated.waitForFunction(()=>window.GoiVietHomeIntro);await animated.evaluate(async()=>{await window.GoiVietHomeIntro.ready;await document.fonts.ready;});
  assert.equal(await animated.evaluate(()=>window.GoiVietHomeIntro.getState().failed),false);
  for(const time of [8,12]){await animated.evaluate(t=>{window.GoiVietHomeIntro.seek(t,true);document.activeElement.blur();},time);await animated.screenshot({path:path.join(out,'animation-'+time+'.jpg'),quality:90});}
  await animated.locator('#btnHomeOpeningReplay').click();await animated.locator('#btnHomeOpeningSkip').click();
  assert.equal(await animated.evaluate(()=>window.GoiVietHomeIntro.getState().phase),'complete');assert.deepEqual(errors,[]);
  console.log('PASS: restored frame, twelve responsive sizes, guide scroll, start and animation.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
