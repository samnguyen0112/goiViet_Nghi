// Capture the real browser animation, including continued idle smoke.
const fs=require('node:fs/promises'),path=require('node:path'),{spawnSync}=require('node:child_process');
const {chromium}=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),out=path.resolve(root,process.argv[2]||'verification/memory-rail-v6');
if(!out.startsWith(path.join(root,'verification')+path.sep))throw Error('Preview output must stay in verification');
(async()=>{
 await fs.mkdir(out,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const page=await browser.newPage({viewport:{width:1200,height:595},reducedMotion:'reduce'});
  await page.goto('file:///'+root.replaceAll('\\','/')+'/map-surroundings-preview-3.html');
  await page.waitForFunction(()=>window.GoiVietHomeIntro&&window.GoiVietMemoryChapter&&window.GoiVietMemorySmoke);
  await page.evaluate(async()=>{GoiVietHomeIntro.skip();GoiVietMemoryChapter.begin();await document.fonts.ready;await Promise.all([...document.querySelectorAll('#memoryChapter img')].map(async i=>{i.loading='eager';try{await i.decode();}catch{}}));});
  await page.locator('.n6-exit-world').scrollIntoViewIfNeeded();
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.locator('.n6-train').evaluate(el=>{el.classList.remove('is-visible');void el.offsetWidth;el.classList.add('is-visible');});
  await page.waitForFunction(()=>document.querySelector('.n6-train').getAnimations().length>0);
  const duration=await page.locator('.n6-train').evaluate(el=>el.getAnimations()[0].effect.getTiming().duration);
  const captureDuration=Math.max(12000,duration+4000);
  await page.locator('.n6-train').evaluate(el=>{const a=el.getAnimations()[0];a.pause();a.currentTime=0;});
  // Browser screencast delivers compositor frames without expensive screenshot polling.
  const session=await page.context().newCDPSession(page),samples=[],captured=[];let start=null;
  session.on('Page.screencastFrame',event=>{
   const time=(event.metadata.timestamp?event.metadata.timestamp*1000:Date.now())-start;
   if(start!==null&&time>=0)captured.push({time,bytes:Buffer.from(event.data,'base64')});
   session.send('Page.screencastFrameAck',{sessionId:event.sessionId}).catch(()=>{});
  });
  await session.send('Page.startScreencast',{format:'jpeg',quality:90,maxWidth:1200,maxHeight:595,everyNthFrame:1});
  start=Date.now();
  await page.locator('.n6-train').evaluate(el=>{const a=el.getAnimations()[0];a.currentTime=0;a.play();});
  for(let elapsed=1000;elapsed<=captureDuration;elapsed+=1000){
   const wait=start+elapsed-Date.now();if(wait>0)await page.waitForTimeout(wait);
   samples.push({elapsed:Date.now()-start,smoke:await page.evaluate(()=>GoiVietMemorySmoke.getState())});
  }
  await session.send('Page.stopScreencast');
  if(!captured.length)throw Error('No browser video frames captured');
  captured.sort((a,b)=>a.time-b.time);
  const state=await page.evaluate(()=>GoiVietMemorySmoke.getState());
  samples.push({elapsed:Date.now()-start,smoke:state});
  await sharp(captured.at(-1).bytes).png().toFile(path.join(out,'final-smoke.png'));
  await fs.writeFile(path.join(out,'motion-samples.json'),JSON.stringify(samples,null,2));
  // Resample by wall time so slow screenshot capture cannot accelerate the animation.
  const uniform=[];let cursor=0;const fps=30;
  for(let time=0;time<captureDuration;time+=1000/fps){
   while(cursor+1<captured.length&&captured[cursor+1].time<=time)cursor++;
   uniform.push(captured[cursor].bytes);
  }
  // Small animated WebP can be viewed inline; VP8 video retains the full image.
  const selected=[];for(let i=0;i<uniform.length;i+=6)selected.push(await sharp(uniform[i]).resize(795,394).ensureAlpha().raw().toBuffer());
  await sharp(Buffer.concat(selected),{raw:{width:795,height:394*selected.length,channels:4,pageHeight:394}}).webp({quality:85,loop:0,delay:Array(selected.length).fill(200)}).toFile(path.join(out,'train-and-smoke.webp'));
  const ffmpeg='C:/Users/Uy/AppData/Local/ms-playwright/ffmpeg-1011/ffmpeg-win64.exe';
  const result=spawnSync(ffmpeg,['-y','-hide_banner','-loglevel','error','-f','image2pipe','-r',String(fps),'-c:v','mjpeg','-i','pipe:0','-c:v','libvpx','-b:v','2500k','-pix_fmt','yuv420p',path.join(out,'train-and-smoke.webm')],{input:Buffer.concat(uniform),encoding:'utf8',windowsHide:true,maxBuffer:4*1024*1024});
  if(result.status!==0)throw Error(result.stderr);
  console.log(JSON.stringify({frames:uniform.length,captured:captured.length,fps,seconds:captureDuration/1000,samples,video:'train-and-smoke.webm',inline:'train-and-smoke.webp'}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
