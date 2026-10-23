const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp = require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'), out=path.join(root,'verification/memory-chapter-3');
const url=process.env.MEMORY_PREVIEW_URL||'http://127.0.0.1:8765/map-surroundings-preview-3.html';
async function boot(page) {
  await page.goto(url,{waitUntil:'load'});
  await page.waitForFunction(()=>window.GoiVietHomeIntro&&window.GoiVietMemoryChapter);
  await page.evaluate(async()=>{window.GoiVietHomeIntro.skip();await document.fonts.ready;});
}
async function main(){
 await fs.mkdir(out,{recursive:true});
 const temp=path.join(out,'browser-temp'); await fs.mkdir(temp,{recursive:true}); process.env.TEMP=temp; process.env.TMP=temp;
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const errors=[], report={url, mode:process.argv.includes('--structure')?'structure':'full',viewports:[]};
 try {
  const page=await browser.newPage({viewport:{width:1440,height:900}, reducedMotion:'reduce'});
  page.on('pageerror',e=>errors.push(e.message));
  await boot(page);
  await page.screenshot({path:path.join(out,'home.png')});
  await page.locator('#btnQuickStartWelcome').click();
  await page.waitForFunction(()=>document.getElementById('introScreen').scrollTop>500);
  assert(await page.locator('#introScreen').evaluate(el=>!el.classList.contains('intro-hidden')),'Start bypassed chapter');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'memoryChapter');
  for(const [name,width,height] of [['desktop',1440,900],['laptop',1280,720],['wide',1920,1080],['ultrawide',2560,1080],['tablet',820,1180],['mobile',390,844],['small-mobile',360,740],['narrow-mobile',320,568],['landscape',844,390]]){
   await page.setViewportSize({width,height});
   await page.evaluate(()=>window.GoiVietMemoryChapter.begin());
   await page.waitForTimeout(100);
   const layout=await page.evaluate(()=>{
    const intro=document.getElementById('introScreen');
    const boxes=[...document.querySelectorAll('.mc-introduction,.mc-memory-copy,.mc-conversation-copy,.mc-card-stack,.mc-destination-copy,.mc-steps')].map(el=>{const r=el.getBoundingClientRect();return {name:el.className,x:r.x,right:r.right,width:r.width,height:r.height};});
    return {client:intro.clientWidth,scroll:intro.scrollWidth,height:intro.scrollHeight,boxes};
   });
   assert(layout.scroll<=width+1,`${name}: horizontal overflow`);
   for(const b of layout.boxes) assert(b.x>=-1&&b.right<=width+1,`${name}: ${b.name} clipped ${JSON.stringify(b)}`);
   await page.screenshot({path:path.join(out,`${name}-opening.png`)});
   await page.locator('.mc-conversation').evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
   const inkShot=await page.locator('#memoryCardQuestion').screenshot();
   const ink=await sharp(inkShot).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   let inkRows=0;
   for(let y=0;y<ink.info.height;y++){let count=0;for(let x=0;x<ink.info.width;x++){const i=(y*ink.info.width+x)*4;if(ink.data[i]>=115&&ink.data[i]<=185&&ink.data[i+1]<95&&ink.data[i+2]<95&&ink.data[i]>ink.data[i+1]*1.5)count++;}if(count>=4)inkRows++;}
   assert(inkRows>ink.info.height*.3,`${name}: question text is not visibly painted (${inkRows}/${ink.info.height} rows)`);
   layout.visibleQuestionInkRows=inkRows;
   await page.screenshot({path:path.join(out,`${name}-card.png`)});
   await page.locator('.mc-destination').evaluate(el=>el.scrollIntoView({block:'center',behavior:'instant'}));
   await page.screenshot({path:path.join(out,`${name}-destination.png`)});
   report.viewports.push({name,width,height,...layout});
  }
  await page.setViewportSize({width:1440,height:900});
  await page.locator('#memoryNextCard').scrollIntoViewIfNeeded();
  const questions=new Set();
  for(let i=0;i<9;i++){
    const before=await page.locator('#memoryCardQuestion').innerText(); questions.add(before);
    await page.locator('#memoryNextCard').click();
    assert.notEqual(await page.locator('#memoryCardQuestion').innerText(),before);
  }
  assert.equal(questions.size,9); report.questions=questions.size;
  await page.locator('#memoryNextCard').focus(); await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'memoryNextCard');
  await page.keyboard.press('Space');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.locator('#memoryNextCard').click();
  const index=await page.evaluate(()=>window.GoiVietMemoryChapter.getState().questionIndex);
  await page.evaluate(()=>{for(let i=0;i<12;i++)document.getElementById('memoryNextCard').click();});
  await page.waitForTimeout(850);
  assert.equal(await page.evaluate(()=>window.GoiVietMemoryChapter.getState().questionIndex),(index+1)%9,'Rapid clicks caused multiple flips');
  assert.equal(await page.evaluate(()=>window.GoiVietMemoryChapter.getState().flipping),false);
  report.rapidClick=true;
  await page.locator('#memoryOpenMap').scrollIntoViewIfNeeded();
  await page.locator('#memoryOpenMap').click();
  await page.waitForFunction(()=>document.getElementById('introScreen').classList.contains('intro-hidden'));
  await page.waitForTimeout(600);
  assert.equal(await page.evaluate(()=>document.activeElement.id),'mapScene');
  assert.equal(await page.locator('#mapScene').getAttribute('inert'),null);
  assert.equal(await page.locator('#memoryMapTransition').evaluate(el=>getComputedStyle(el).visibility),'hidden');
  await page.screenshot({path:path.join(out,'map.png')}); report.mapEntry=true;
  await page.locator('.brand-group').click();
  await page.waitForFunction(()=>!document.getElementById('introScreen').classList.contains('intro-hidden'));
  await page.waitForTimeout(100);
  assert.equal(await page.locator('#introScreen').evaluate(el=>el.scrollTop),0,'Returning home did not reset scroll');
  await page.evaluate(()=>window.GoiVietHomeIntro.skip());
  await page.locator('#memoryMapShortcut').click();
  await page.waitForFunction(()=>document.getElementById('introScreen').classList.contains('intro-hidden'));
  report.returnAndShortcut=true;
  if(!process.argv.includes('--structure')) {
   await boot(page); await page.evaluate(()=>window.GoiVietMemoryChapter.begin());
   await page.locator('.mc img').evaluateAll(imgs=>Promise.all(imgs.map(async i=>{i.loading='eager';await i.decode().catch(()=>{});})));
   const broken=await page.locator('.mc img').evaluateAll(imgs=>imgs.filter(i=>!i.complete||!i.naturalWidth).map(i=>i.getAttribute('src')));
   assert.deepEqual(broken,[],'Chapter assets did not load'); report.broken=broken;
  }
  assert.deepEqual(errors,[],'Browser errors');report.errors=errors;
  await fs.writeFile(path.join(out,'checks.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({viewports:report.viewports.map(v=>v.name),questions:report.questions,mapEntry:report.mapEntry,errors}));
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
