const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const runtime='C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {chromium}=require(runtime+'/playwright'),sharp=require(runtime+'/sharp');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/invitation-memory-4');
(async()=>{
 await fs.mkdir(out,{recursive:true});process.env.TEMP=process.env.TMP=path.join(root,'scratch');
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const errors=[],missing=[],report={viewports:[],checks:[]};
 const check=(name,pass,detail)=>{report.checks.push({name,pass,detail});};
 try {
  const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  page.on('pageerror',e=>errors.push(e.message));
  page.on('requestfailed',r=>{if(r.url().includes('invitation-memory-4'))missing.push(r.url());});
  await page.goto(pathToFileURL(path.join(root,'map-surroundings-preview-3.html')).href,{waitUntil:'load'});
  await page.waitForFunction(()=>window.GoiVietHomeIntro&&window.GoiVietMemoryChapter);
  await page.evaluate(async()=>{window.GoiVietHomeIntro.skip();await document.fonts.ready;await Promise.all([...document.querySelectorAll('#homepageContent img')].map(im=>im.decode()));document.activeElement.blur();});
  const sizes=[['desktop',1440,900],['laptop',1366,768],['small-laptop',1280,720],['wide',1920,1080],['ultrawide',2560,1080],['tablet',820,1180],['mobile',390,844],['compact-mobile',375,667],['small-mobile',320,568],['landscape',844,390],['small-landscape',568,320],['4k',3840,2160]];
  for(const [name,width,height] of sizes.filter(s=>!process.argv.includes('--render-only')||['desktop','mobile','4k'].includes(s[0]))) {
   await page.setViewportSize({width,height});
   await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   const data=await page.evaluate(()=>{
    const box=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
    return {panel:box('#homepageContent'),title:box('.im4-lettering'),description:box('#homepageContent .gv-home-description'),primary:box('#btnQuickStartWelcome'),features:box('#homepageContent .gv-home-features'),nextCue:box('.im4-next-cue'),cards:[...document.querySelectorAll('.im4-card')].map(im=>{const r=im.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,nativeWidth:im.naturalWidth,nativeHeight:im.naturalHeight};}),header:box('.gv-home-header'),scrollWidth:document.getElementById('introScreen').scrollWidth};
   });
   await page.screenshot({path:path.join(out,name+'.png')});
   if(name==='desktop'||name==='wide'||name==='4k')await page.locator('#homepageContent').screenshot({path:path.join(out,name+'-panel.png')});
   check(name+': no horizontal overflow',data.scrollWidth<=width+1,data.scrollWidth);
   check(name+': primary action inside viewport and at least 44px',data.primary.x>=0&&data.primary.right<=width&&data.primary.y>=0&&data.primary.bottom<=height+1&&data.primary.height>=44,data.primary);
   check(name+': frame inside viewport',data.panel.x>=-1&&data.panel.right<=width+1&&data.panel.y>=0&&data.panel.bottom<=height+1,data.panel);
   check(name+': title clear of cards',data.cards.every(c=>c.x>=data.title.right-1),{title:data.title,cards:data.cards});
   check(name+': cards clear of feature strip',data.cards.every(c=>c.bottom<=data.features.y+4),{cards:data.cards,features:data.features});
   check(name+': next arrow stays inside frame with 44px target',data.nextCue.x>=data.panel.x&&data.nextCue.right<=data.panel.right&&data.nextCue.y>=data.panel.y&&data.nextCue.bottom<=data.panel.bottom&&data.nextCue.width>=44&&data.nextCue.height>=44,data.nextCue);
   const alignment=await page.evaluate(()=>{
    const center=s=>{const r=document.querySelector(s).getBoundingClientRect();return r.x+r.width/2;};
    const button=center('#btnQuickStartWelcome');
    return ['.gv-home-kicker','.im4-title-first','.im4-title-memory','.gv-home-description','.im4-footnote'].map(s=>({element:s,delta:Math.abs(center('#homepageContent '+s)-button)}));
   });
   check(name+': copy and both title lines share primary button center',alignment.every(a=>a.delta<1),alignment);
   report.viewports.push({name,width,height,...data});
   console.log(JSON.stringify({name,panel:data.panel,primary:data.primary,cardBottom:Math.max(...data.cards.map(c=>c.bottom)),featureTop:data.features.y}));
  }
  if(process.argv.includes('--render-only')) {
   await page.goto('http://127.0.0.1:8765/map-surroundings-preview-3.html',{waitUntil:'load'});
   check('existing local preview server serves upgraded invitation',await page.locator('.gv-memory-invitation').count()===1);
   await fs.writeFile(path.join(out,'final-visual-review.json'),JSON.stringify(report,null,2));
   assert(report.checks.every(c=>c.pass),'Visual review found a layout issue');
   console.log('Final visual captures refreshed; local preview server verified.');return;
  }
  await page.setViewportSize({width:1440,height:900});
  check('two portrait cards with no captions',await page.locator('.im4-card').count()===2&&await page.locator('.im4-cards').innerText()==='');
  check('layered DOM has no reference screenshot or old flattened frame',await page.locator('#homepageContent img[src*="approved"],#homepageContent .invite-painted-frame').count()===0);
  await page.mouse.move(600,450);await page.mouse.wheel(0,1000);await page.keyboard.press('PageDown');
  check('home remains locked until explicit primary action',await page.locator('#introScreen').evaluate(e=>e.scrollTop===0)&&await page.locator('#memoryChapter').evaluate(e=>e.inert));
  await page.locator('#btnQuickStartWelcome').focus();
  check('primary keyboard focus visible',await page.locator('#btnQuickStartWelcome').evaluate(e=>getComputedStyle(e).outlineStyle==='solid'));
  await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.getElementById('introScreen').dataset.memoryUnlocked==='true');
  check('primary still opens memory chapter and transfers focus',await page.evaluate(()=>document.activeElement.id==='memoryChapter')&&!await page.locator('#memoryChapter').evaluate(e=>e.inert));
  await page.screenshot({path:path.join(out,'chapter-after-start.png')});
  const animated=await browser.newPage({viewport:{width:1440,height:900}});
  animated.on('pageerror',e=>errors.push(e.message));
  await animated.goto(pathToFileURL(path.join(root,'map-surroundings-preview-3.html')).href,{waitUntil:'load'});
  await animated.waitForFunction(()=>window.GoiVietHomeIntro);
  await animated.evaluate(async()=>{await window.GoiVietHomeIntro.ready;window.GoiVietHomeIntro.seek(12,true);});
  check('opening animation reaches final new invitation',await animated.locator('#btnQuickStartWelcome').isEnabled());
  await animated.locator('#btnHomeOpeningReplay').click();await animated.locator('#btnHomeOpeningSkip').click();
  check('replay and skip still complete',await animated.evaluate(()=>window.GoiVietHomeIntro.getState().phase==='complete'));
  check('only one next arrow, inside the invitation',await animated.locator('.mc-scroll-cue').count()===1&&await animated.locator('#homepageContent .mc-scroll-cue').count()===1);
  await animated.locator('.im4-next-cue').click();
  await animated.waitForFunction(()=>document.getElementById('introScreen').dataset.memoryUnlocked==='true');
  check('in-frame arrow opens chapter and transfers focus',await animated.evaluate(()=>document.activeElement.id==='memoryChapter'));
  const hiDPI=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:2,reducedMotion:'reduce'});
  await hiDPI.goto(pathToFileURL(path.join(root,'map-surroundings-preview-3.html')).href,{waitUntil:'load'});
  await hiDPI.waitForFunction(()=>window.GoiVietHomeIntro);
  await hiDPI.evaluate(async()=>{window.GoiVietHomeIntro.skip();await document.fonts.ready;await Promise.all([...document.querySelectorAll('#homepageContent img')].map(im=>im.decode()));document.activeElement.blur();});
  const sampling=await hiDPI.locator('.im4-card').evaluateAll(ims=>ims.map(im=>({native:[im.naturalWidth,im.naturalHeight],css:[im.offsetWidth,im.offsetHeight],devicePixelRatio})));
  check('card art covers physical pixels on a 1920px Retina viewport',sampling.every(s=>s.native[0]>=s.css[0]*s.devicePixelRatio*.95),sampling);
  await hiDPI.locator('#homepageContent').screenshot({path:path.join(out,'retina-panel.png')});
  await hiDPI.evaluate(()=>document.documentElement.dataset.theme='dark');
  check('dark theme still loads new title vectors',await hiDPI.locator('.im4-title-first').evaluate(im=>im.complete&&im.naturalWidth>0));
  await hiDPI.close();
  check('no browser errors or missing invitation assets',!errors.length&&!missing.length,{errors,missing});
  await fs.writeFile(path.join(out,'checks.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({passed:report.checks.filter(c=>c.pass).length,failed:report.checks.filter(c=>!c.pass)}));
  if(!process.argv.includes('--capture'))assert(report.checks.every(c=>c.pass),'See checks.json for failed assertions');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
