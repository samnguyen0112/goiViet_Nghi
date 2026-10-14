const {chromium}=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const {spawn}=require('node:child_process'),{once}=require('node:events');
const root=path.resolve(__dirname,'..'),out=path.join(root,'exports/homepage-clip'),evidence=path.join(root,'verification/homepage-clip');
(async()=>{
 const before={};for(const f of ['index.html','image/Giao diện trang đầu.jpg'])before[f]=crypto.createHash('sha256').update(await fs.readFile(path.join(root,f))).digest('hex');
 let browser,encoder;try{
  browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--disable-background-timer-throttling']});
  const page=await browser.newPage({viewport:{width:1594,height:1100},deviceScaleFactor:1});
  // Fulfill project requests from disk: no local server or external network is needed.
  await page.route('http://clip.local/**',async route=>{try{
   const url=new URL(route.request().url()),f=path.resolve(root,'.'+decodeURIComponent(url.pathname));
   if(!f.startsWith(root+path.sep)){await route.fulfill({status:403,body:''});return;}
   const contentType={'.html':'text/html; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4'}[path.extname(f)]||'application/octet-stream';
   await route.fulfill({contentType,body:await fs.readFile(f)});
  }catch{await route.fulfill({status:404,body:''});}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://clip.local/exports/homepage-clip/renderer.html');
  const metadata=await page.evaluate(async()=>await window.ready);await page.evaluate(()=>window.stopPreview());
  const protectedChecks=[];
  for(const t of [0,1.2,3,6,9,12,18,23.9666667,24]){
   await page.evaluate(t=>window.renderFrame(t),t);
   const checks=await page.evaluate(()=>window.checkProtected());protectedChecks.push({time:t,checks});
   await page.locator('canvas#scene').screenshot({path:path.join(evidence,`frame-${String(t).replace('.','_')}.png`)});
  }
  await fs.writeFile(path.join(evidence,'protected-checks.json'),JSON.stringify(protectedChecks,null,2));
  if(protectedChecks.some(s=>s.checks.some(c=>!c.pass)))throw new Error('Chữ thay đổi trong khung hình chưa nén; xem protected-checks.json');
  const video=path.join(out,'goi-viet-homepage-loop.mp4');
  const ffmpeg=process.env.HOMEPAGE_CLIP_FFMPEG||path.join(evidence,'deps/ffmpeg.exe');
  encoder=spawn(ffmpeg,['-hide_banner','-loglevel','error','-y','-f','image2pipe','-vcodec','png','-framerate','30','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','16','-pix_fmt','yuv420p','-movflags','+faststart',video],{stdio:['pipe','ignore','pipe'],windowsHide:true});
  let encodingErrors='';encoder.stderr.on('data',data=>{encodingErrors=(encodingErrors+data.toString()).slice(-8000);});
  const encoded=new Promise((resolve,reject)=>{encoder.once('error',reject);encoder.once('exit',code=>code===0?resolve():reject(new Error('Mã hóa MP4 thất bại: '+encodingErrors)));});
  const frameCount=metadata.duration*metadata.fps,start=Date.now();
  for(let i=0;i<frameCount;i++){
   const png=await page.evaluate(t=>{window.renderFrame(t);return document.querySelector('#scene').toDataURL('image/png').split(',')[1];},i/metadata.fps);
   if(!encoder.stdin.write(Buffer.from(png,'base64')))await once(encoder.stdin,'drain');
   if((i+1)%60===0)console.log(`Đã dựng ${i+1}/${frameCount} khung hình`);
  }
  encoder.stdin.end();await encoded;encoder=null;
  const result={framesEncoded:frameCount,renderElapsedMs:Date.now()-start,mime:'video/mp4',codec:'H.264',frameRate:30,duration:metadata.duration};
  for(const f of Object.keys(before)){const hash=crypto.createHash('sha256').update(await fs.readFile(path.join(root,f))).digest('hex');if(hash!==before[f])throw new Error('File nguồn đã đổi: '+f);}
  const report={metadata,recording:result,protectedChecks,sourceHashes:before,browserErrors:errors};
  await fs.writeFile(path.join(evidence,'render-evidence.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({metadata,recording:result,protectedChecks:protectedChecks.flatMap(x=>x.checks).length,browserErrors:errors,video:path.join(out,'goi-viet-homepage-loop.mp4')},null,2));
 }finally{if(encoder)encoder.kill();if(browser)await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
