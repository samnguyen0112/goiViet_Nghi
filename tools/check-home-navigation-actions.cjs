const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve(__dirname,'../verification/home-navigation-actions');
(async()=>{
 await fs.mkdir(path.join(out,'browser-temp'),{recursive:true});process.env.TEMP=process.env.TMP=path.join(out,'browser-temp');
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),report={cases:[],errors:[]};
 try{
  for(const [name,viewport,reducedMotion]of [['desktop',{width:1440,height:900},'no-preference'],['reduced',{width:1440,height:900},'reduce'],['mobile',{width:390,height:844},'reduce']]){
   const page=await browser.newPage({viewport,reducedMotion});page.on('pageerror',e=>report.errors.push(e.message));
   const init=async()=>{await page.goto('http://127.0.0.1:8765/map-surroundings-preview-3.html');await page.waitForFunction(()=>window.GoiVietHomeIntro&&window.GoiVietMemoryChapter);await page.evaluate(async()=>{await window.GoiVietHomeIntro.ready;window.GoiVietHomeIntro.skip();await document.fonts.ready;});};
   await init();
   assert.match(await page.locator('#btnQuickStartWelcome').innerText(),/Mở bản đồ ký ức/);
   assert.equal(await page.locator('#introScreen').getAttribute('data-memory-unlocked'),'false');
   await page.locator('#btnQuickStartWelcome').click();
   await page.waitForFunction(()=>document.getElementById('introScreen').classList.contains('intro-hidden'));
   assert.equal(await page.evaluate(()=>document.activeElement.id),'mapScene','Primary action does not focus the map');
   await init();await page.screenshot({path:path.join(out,name+'-home.png')});
   const arrow=page.locator('#btnHomeExploreMemory');
   for(const input of ['pointer','Enter','Space']){
    await arrow.scrollIntoViewIfNeeded();assert(await arrow.isVisible(),'Arrow hidden after returning to the homepage');
    assert(await arrow.evaluate(e=>getComputedStyle(e).pointerEvents!=='none'&&!e.closest('[inert]')),'Arrow disabled after chapter unlock');
    if(input==='pointer')await arrow.click();else{await arrow.focus();await page.keyboard.press(input);}
    await page.waitForFunction(()=>{const i=document.getElementById('introScreen'),c=document.getElementById('memoryChapter');return i.dataset.memoryUnlocked==='true'&&Math.abs(i.scrollTop-c.offsetTop)<3;});
    assert.equal(await page.locator('#memoryChapter').evaluate(e=>e.inert),false);
    assert.equal(await page.locator('#introScreen').evaluate(e=>e.classList.contains('intro-hidden')),false,'Arrow unexpectedly opens the map');
    await page.locator('#introScreen').evaluate(e=>e.scrollTo({top:0,behavior:'instant'}));
    await page.waitForFunction(()=>document.getElementById('introScreen').scrollTop===0);
   }
   await arrow.scrollIntoViewIfNeeded();assert(await arrow.isVisible());await page.screenshot({path:path.join(out,name+'-returned.png')});
   await page.locator('#btnQuickStartWelcome').click();await page.waitForFunction(()=>document.getElementById('introScreen').classList.contains('intro-hidden'));
   report.cases.push({name,directMap:true,repeatedChapterEntry:['pointer','Enter','Space'],mapAfterReturning:true});await page.close();
  }
  assert.deepEqual(report.errors,[]);await fs.writeFile(path.join(out,'checks.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
