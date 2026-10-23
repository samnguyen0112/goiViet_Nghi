const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/home-memory-seam-3');
(async()=>{
 await fs.mkdir(out,{recursive:true});process.env.TEMP=process.env.TMP=path.join(root,'scratch');
 const b=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),errors=[],report=[];
 try{
  const p=await b.newPage({reducedMotion:'reduce'});p.on('pageerror',e=>errors.push(e.message));
  for(const [name,width,height]of [['desktop',1440,900],['laptop',1366,768],['wide',1920,1080],['mobile',390,844],['small-mobile',320,568],['landscape',844,390]]){
   await p.setViewportSize({width,height});await p.goto('file:///'+root.replaceAll('\\','/')+'/map-surroundings-preview-3.html',{waitUntil:'load'});
   await p.waitForFunction(()=>window.GoiVietHomeIntro&&window.GoiVietMemoryChapter);
   await p.evaluate(async()=>{window.GoiVietHomeIntro.skip();await document.fonts.ready;});
   if(name==='desktop'){
    await p.evaluate(()=>{document.querySelector('link[href*="home-memory-seam-3.css"]').disabled=true;window.GoiVietMemoryChapter.begin();const h=document.getElementById('introWelcomeStage');document.getElementById('introScreen').scrollTop=h.offsetHeight-innerHeight*.48;});
    await p.screenshot({path:path.join(out,'before-desktop.png')});
    await p.evaluate(()=>{document.querySelector('link[href*="home-memory-seam-3.css"]').disabled=false;});
    await p.reload();await p.waitForFunction(()=>window.GoiVietHomeIntro&&window.GoiVietMemoryChapter);await p.evaluate(()=>window.GoiVietHomeIntro.skip());
   }
   await p.locator('#btnQuickStartWelcome').click();
   assert(await p.evaluate(()=>document.activeElement.id==='memoryChapter'),'Primary action lost chapter focus');
   const info=await p.evaluate(()=>{
    const home=document.getElementById('introWelcomeStage'),seam=document.getElementById('memorySeam'),chapter=document.getElementById('memoryChapter');
    document.getElementById('introScreen').scrollTop=home.offsetHeight-innerHeight*.48;
    return {gap:chapter.offsetTop-home.offsetTop-home.offsetHeight,seamHeight:seam.offsetHeight,overflow:document.getElementById('introScreen').scrollWidth,copyMask:getComputedStyle(document.querySelector('.gv-home-content')).maskImage,invitationOpacity:getComputedStyle(document.getElementById('homepageContent')).opacity};
   });
   assert(info.gap>=29&&info.gap<=65,name+': transition band too large or overlapping');
   assert(info.overflow<=width+1,name+': horizontal overflow');
   assert.equal(info.copyMask,'none');assert.equal(info.invitationOpacity,'1');
   await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   await p.screenshot({path:path.join(out,name+'.png')});
   if(name==='desktop')await p.screenshot({path:path.join(out,'desktop-detail.png'),clip:{x:0,y:Math.round(height*.3),width,height:Math.round(height*.4)}});
   report.push({name,width,height,...info});console.log(JSON.stringify(report.at(-1)));
  }
  const moving=await b.newPage({viewport:{width:1440,height:900}});moving.on('pageerror',e=>errors.push(e.message));
  await moving.goto('file:///'+root.replaceAll('\\','/')+'/map-surroundings-preview-3.html',{waitUntil:'load'});await moving.waitForFunction(()=>window.GoiVietHomeIntro&&window.GoiVietMemoryChapter);await moving.evaluate(()=>window.GoiVietHomeIntro.skip());await moving.locator('.classic-next-cue').click();
  await moving.waitForFunction(()=>{const i=document.getElementById('introScreen'),c=document.getElementById('memoryChapter');return Math.abs(i.scrollTop-c.offsetTop)<5;});
  assert.equal(await moving.evaluate(()=>document.activeElement.id),'memoryChapter');assert.deepEqual(errors,[]);
  await fs.writeFile(path.join(out,'checks.json'),JSON.stringify({report,smoothScroll:true,reducedMotion:true,errors},null,2));
  console.log('PASS: short seamless band, 6 sizes, full-opacity copy, normal/reduced-motion chapter entry.');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
