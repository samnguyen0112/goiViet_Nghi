const fs=require('node:fs/promises'),path=require('node:path');
const {chromium}=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/memory-rail-v6');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const report={errors:[],layouts:[]};
 try{
  for(const width of [795,1440,390,320]){
   const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});
   page.on('pageerror',e=>report.errors.push(e.message));
   await page.goto('file:///'+root.replaceAll('\\','/')+'/map-surroundings-preview-3.html');
   await page.waitForFunction(()=>window.GoiVietMemoryChapter&&window.GoiVietHomeIntro&&window.GoiVietMemorySmoke);
   await page.evaluate(async()=>{window.GoiVietHomeIntro.skip();window.GoiVietMemoryChapter.begin();await document.fonts.ready;await Promise.all([...document.querySelectorAll('#memoryChapter img')].map(async i=>{i.loading='eager';try{await i.decode();}catch{}}));});
   await page.locator('.n6-exit-world').scrollIntoViewIfNeeded();
   await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   await page.locator('.n6-exit-world').screenshot({path:path.join(out,`exit-${width}.png`)});
   report.layouts.push(await page.evaluate(()=>({width:innerWidth,overflow:document.getElementById('introScreen').scrollWidth>innerWidth,missing:[...document.querySelectorAll('#memoryChapter img')].filter(i=>!i.naturalWidth).map(i=>i.src),smoke:window.GoiVietMemorySmoke.getState()})));
   await page.close();
  }
  await fs.writeFile(path.join(out,'visual-checks.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
