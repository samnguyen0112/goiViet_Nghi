const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/classic-home-theme-3');
(async()=>{
 await fs.mkdir(out,{recursive:true});process.env.TEMP=process.env.TMP=path.join(root,'scratch');
 const b=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),checks=[],errors=[],layouts=[];
 const check=(name,pass,detail)=>checks.push({name,pass,detail});
 try{
  const p=await b.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});p.on('pageerror',e=>errors.push(e.message));
  await p.goto('file:///'+root.replaceAll('\\','/')+'/map-surroundings-preview-3.html',{waitUntil:'load'});
  await p.waitForFunction(()=>window.GoiVietHomeIntro&&window.GoiVietMemoryChapter);
  await p.evaluate(async()=>{window.GoiVietHomeIntro.skip();await document.fonts.ready;await Promise.all([...document.querySelectorAll('#homepageContent img')].map(im=>im.decode()));document.activeElement.blur();});
  for(const [name,width,height]of [['desktop',1440,900],['laptop',1366,768],['small-laptop',1280,720],['wide',1920,1080],['ultrawide',2560,1080],['tablet',820,1180],['mobile',390,844],['compact-mobile',375,667],['small-mobile',320,568],['landscape',844,390],['small-landscape',568,320],['4k',3840,2160]]){
   await p.setViewportSize({width,height});await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   const d=await p.evaluate(()=>{const r=s=>{const a=document.querySelector(s).getBoundingClientRect();return {x:a.x,y:a.y,right:a.right,bottom:a.bottom,width:a.width,height:a.height}};return {header:r('.gv-home-header'),panel:r('#homepageContent'),primary:r('#btnQuickStartWelcome'),next:r('.classic-next-cue'),title:r('#homepageHeading'),overflow:document.getElementById('introScreen').scrollWidth,fonts:{verse:getComputedStyle(document.querySelector('.gv-home-verse')).fontFamily,title:getComputedStyle(document.getElementById('homepageHeading')).fontFamily},poster:document.querySelector('.gv-home-poster').getAttribute('src')};});
   check(name+': no horizontal overflow',d.overflow<=width+1,d.overflow);
   check(name+': primary reachable and 44px',d.primary.y>=0&&d.primary.bottom<=height+1&&d.primary.height>=44,d.primary);
   check(name+': next arrow reachable and 44px',d.next.y>=0&&d.next.bottom<=height+1&&d.next.height>=44,d.next);
   check(name+': title and panel not clipped horizontally',d.panel.x>=0&&d.panel.right<=width+1&&d.title.x>=0&&d.title.right<=width+1,d.panel);
   layouts.push({name,width,height,...d});await p.screenshot({path:path.join(out,name+'.png')});console.log(JSON.stringify({name,panel:d.panel,primary:d.primary}));
  }
  check('no illustrated-card or vector-lettering assets remain in homepage',await p.locator('#introWelcomeStage .im4-card,#introWelcomeStage img[src*="invitation-memory-4"],#introWelcomeStage .gv-home-lettering').count()===0);
  check('new title and feature copy applied',await p.locator('#homepageHeading').innerText()==='Có những điều, gợi là nhớ.'&&await p.locator('.gv-invitation-feature-copy strong').allTextContents().then(a=>a.join('|'))==='Chọn miền thân quen|Lật một lá bài nhỏ|Kể chuyện nhà mình');
  check('classic poster selected',layouts.every(d=>d.poster.includes('homepage-layered-poster.webp')));
  const reference=await b.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  await reference.goto('file:///'+root.replaceAll('\\','/')+'/map-surroundings-preview-2.html');await reference.waitForFunction(()=>window.GoiVietHomeIntro);await reference.evaluate(async()=>{window.GoiVietHomeIntro.skip();await document.fonts.ready;});
  const oldFonts=await reference.evaluate(()=>({verse:getComputedStyle(document.querySelector('.gv-home-verse')).fontFamily,title:getComputedStyle(document.getElementById('homepageHeading')).fontFamily}));
  check('font families match preview-2',JSON.stringify(layouts[0].fonts)===JSON.stringify(oldFonts),{current:layouts[0].fonts,reference:oldFonts});await reference.close();
  await p.setViewportSize({width:1440,height:900});await p.locator('#btnQuickStartWelcome').click();
  check('primary enters memory chapter',await p.evaluate(()=>document.activeElement.id==='memoryChapter'&&document.getElementById('introScreen').dataset.memoryUnlocked==='true'));
  await p.goto('file:///'+root.replaceAll('\\','/')+'/map-surroundings-preview-3.html',{waitUntil:'load'});await p.waitForFunction(()=>window.GoiVietHomeIntro&&window.GoiVietMemoryChapter);await p.evaluate(()=>window.GoiVietHomeIntro.skip());await p.locator('.classic-next-cue').click();
  check('arrow enters memory chapter',await p.evaluate(()=>document.activeElement.id==='memoryChapter'));
  check('no JavaScript errors',!errors.length,errors);
  await fs.writeFile(path.join(out,'checks.json'),JSON.stringify({checks,layouts,errors},null,2));
  console.log(JSON.stringify({passed:checks.filter(c=>c.pass).length,failed:checks.filter(c=>!c.pass)}));
  if(!process.argv.includes('--capture'))assert(checks.every(c=>c.pass),'See classic homepage checks.json');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
