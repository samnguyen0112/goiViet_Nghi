// Magnified frames from the real native-wheel renderer, with the real arrival clock.
const fs=require('node:fs/promises'),path=require('node:path'),{spawnSync}=require('node:child_process');
const {chromium}=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),coachView=process.argv.includes('--coaches'),out=path.join(root,coachView?'verification/memory-all-wheels':'verification/memory-native-wheels');
const filename=coachView?'coach-wheels-closeup':'native-wheels-closeup',previewHeight=coachView?219:322;
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const page=await browser.newPage({viewport:{width:1200,height:700},reducedMotion:'reduce'});
  await page.route('http://memory.local/**',async route=>{
   try{const file=path.resolve(root,'.'+decodeURIComponent(new URL(route.request().url()).pathname));if(!file.startsWith(root+path.sep))return route.abort();
    const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.woff':'font/woff','.woff2':'font/woff2','.ttf':'font/ttf','.mp3':'audio/mpeg'};
    await route.fulfill({body:await fs.readFile(file),contentType:types[path.extname(file)]||'application/octet-stream'});
   }catch{await route.fulfill({status:404,body:''});}
  });
  await page.goto('http://memory.local/map-surroundings-preview-3.html');
  await page.waitForFunction(()=>window.GoiVietMemoryWheels?.getState().ready&&window.GoiVietMemoryChapter&&window.GoiVietHomeIntro);
  await page.evaluate(async()=>{GoiVietHomeIntro.skip();GoiVietMemoryChapter.begin();await Promise.all([...document.querySelectorAll('#memoryChapter img')].map(async i=>{i.loading='eager';try{await i.decode();}catch{}}));});
  if(coachView)await page.evaluate(async()=>{const i=new Image();i.src=document.querySelector('.n7-native-wheels').dataset.nativeSrc;await i.decode();window.NativeCoachReviewSource=i;});
  await page.locator('.n6-exit-world').scrollIntoViewIfNeeded();await page.emulateMedia({reducedMotion:'no-preference'});
  await page.waitForFunction(()=>document.querySelector('.n6-train').getAnimations().length>0);
  const frames=[],fps=30;
  for(let n=0;n<210;n++){
   const time=Math.min(12000,6500+n/fps*1000);
   const data=await page.evaluate(async({time,coachView})=>{
    const a=document.querySelector('.n6-train').getAnimations()[0];a.pause();a.currentTime=time;document.getElementById('introScreen').dispatchEvent(new Event('scroll'));
    await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
    const output=document.createElement('canvas');output.width=coachView?1200:1204;output.height=coachView?330:488;
    const c=output.getContext('2d');c.fillStyle='#fff4db';c.fillRect(0,0,output.width,output.height);
    if(coachView){
     c.scale(1200/1530,330/420);c.drawImage(window.NativeCoachReviewSource,0,0);
     for(const el of document.querySelectorAll('.n7-coach-wheels'))c.drawImage(el,Number(el.dataset.nativeLeft),0);
    }else c.drawImage(document.querySelector('.n7-native-wheels'),1500,260,602,244,0,0,1204,488);
    return output.toDataURL('image/jpeg',.94).split(',')[1];
   },{time,coachView});
   frames.push(Buffer.from(data,'base64'));
  }
  const ffmpeg='C:/Users/Uy/AppData/Local/ms-playwright/ffmpeg-1011/ffmpeg-win64.exe';
  const result=spawnSync(ffmpeg,['-y','-hide_banner','-loglevel','error','-f','image2pipe','-r',String(fps),'-c:v','mjpeg','-i','pipe:0','-c:v','libvpx','-b:v','2500k','-pix_fmt','yuv420p',path.join(out,filename+'.webm')],{input:Buffer.concat(frames),encoding:'utf8',windowsHide:true,maxBuffer:4*1024*1024});
  if(result.status!==0)throw Error(result.stderr);
  const raw=await Promise.all(frames.map(b=>sharp(b).resize(795,previewHeight).ensureAlpha().raw().toBuffer()));
  await sharp(Buffer.concat(raw),{raw:{width:795,height:previewHeight*raw.length,channels:4,pageHeight:previewHeight}}).webp({quality:87,loop:0,delay:raw.map((_,i)=>i%3===2?34:33)}).toFile(path.join(out,filename+'.webp'));
  console.log(JSON.stringify({frames:frames.length,fps,seconds:frames.length/fps,fromActualCanvas:true}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
