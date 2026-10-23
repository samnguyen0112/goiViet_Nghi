const fs=require('node:fs/promises'),path=require('node:path'),{spawnSync}=require('node:child_process');
const {chromium}=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/home-reference-v8/after');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const page=await browser.newPage({viewport:{width:1518,height:1036}});await page.goto('file:///'+root.replaceAll('\\','/')+'/map-surroundings-preview-3.html');await page.waitForFunction(()=>window.GoiVietHomeIntro);await page.evaluate(async()=>{await GoiVietHomeIntro.ready;await document.fonts.ready;});
  const cdp=await page.context().newCDPSession(page),frames=[];
  cdp.on('Page.screencastFrame',e=>{frames.push({t:e.metadata.timestamp,jpg:Buffer.from(e.data,'base64')});cdp.send('Page.screencastFrameAck',{sessionId:e.sessionId}).catch(()=>{});});
  await cdp.send('Page.startScreencast',{format:'jpeg',quality:88,maxWidth:1518,maxHeight:1036,everyNthFrame:1});
  await page.waitForTimeout(300);await page.locator('#btnHomeOpeningStart').click();await page.waitForTimeout(13000);await cdp.send('Page.stopScreencast');
  const first=frames[0].t,last=frames.at(-1).t,images=[];let i=0;for(let t=first;t<=last;t+=1/30){while(i+1<frames.length&&frames[i+1].t<=t)i++;images.push(frames[i].jpg);}
  const file=path.join(out,'homepage-intro.webm'),result=spawnSync('C:/Users/Uy/AppData/Local/ms-playwright/ffmpeg-1011/ffmpeg-win64.exe',['-y','-hide_banner','-loglevel','error','-f','image2pipe','-r','30','-c:v','mjpeg','-i','pipe:0','-c:v','libvpx','-b:v','2500k','-pix_fmt','yuv420p',file],{input:Buffer.concat(images),maxBuffer:8e6,windowsHide:true});if(result.status!==0)throw Error(result.stderr.toString());
  const data={capturedFrames:frames.length,duration:last-first,outputFrames:images.length,state:await page.evaluate(()=>GoiVietHomeIntro.getState())};await fs.writeFile(path.join(out,'recording.json'),JSON.stringify(data,null,2));console.log(JSON.stringify({file,...data}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
