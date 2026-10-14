const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const {spawn}=require('node:child_process'),{once}=require('node:events');
const root=path.resolve(__dirname,'..'),out=path.join(root,'exports/homepage-intro'),evidence=path.join(root,'verification/homepage-intro-20261012');
const runtime='C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {chromium}=require(runtime+'/playwright'),sharp=require(runtime+'/sharp');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff':'font/woff','.mp4':'video/mp4','.md':'text/markdown; charset=utf-8'};
const checks=[],check=(name,pass,details)=>{checks.push({name,pass,details});if(!pass)throw new Error(name+': '+JSON.stringify(details));};
async function route(page){await page.route('http://opening.local/**',async r=>{
  const url=new URL(r.request().url()),file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
  if(!file.startsWith(root+path.sep))return r.fulfill({status:403,body:''});
  try{await r.fulfill({contentType:mime[path.extname(file)]||'application/octet-stream',body:await fs.readFile(file)});}
  catch(_){await r.fulfill({status:404,body:''});}
});}
async function makePage(browser,options={}){
  const page=await browser.newPage({viewport:{width:1440,height:1100},...options});await route(page);
  await page.goto('http://opening.local/exports/homepage-intro/preview.html',{waitUntil:'domcontentloaded'});
  await page.evaluate(async()=>{await window.ready;window.stopPreview();});return page;
}
async function pixels(page,t){return Buffer.from(await page.evaluate(t=>{window.renderFrame(t);return document.getElementById('scene').toDataURL('image/png').split(',')[1];},t),'base64');}
(async()=>{
  await fs.mkdir(evidence,{recursive:true});
  const temp=path.join(evidence,'browser-temp');await fs.mkdir(temp,{recursive:true});process.env.TEMP=process.env.TMP=temp;
  const preserved=['index.html','assets/goi-viet/homepage-scene.js','assets/goi-viet/homepage-native.js','assets/goi-viet/homepage-native.css','assets/goi-viet/homepage-loop.mp4'];
  const before={};for(const name of preserved)before[name]=sha(await fs.readFile(path.join(root,name)));
  let browser,encoder;
  try{
    browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--disable-background-timer-throttling']});
    const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[],missing=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)missing.push({url:r.url(),status:r.status()});});
    await route(page);await page.goto('http://opening.local/exports/homepage-intro/preview.html',{waitUntil:'domcontentloaded'});
    const meta=await page.evaluate(async()=>{const m=await window.ready;window.stopPreview();window.openingScene.setResolution(1594,987);return m;});
    const snapshots=[];
    if(!process.argv.includes('--render-only')){
    check('Opening loads with 12s entrance and existing 24s loop',meta.introDuration===12&&meta.loopDuration===24&&meta.fps===30,meta);
    const times=[0,.6,2.3,4.8,6.7,8.6,10.6,11.9666667,12,20,35.9666667,36,48];
    for(const t of times){const png=await pixels(page,t),name='frame-'+String(t).replace('.','_')+'.png';await fs.writeFile(path.join(evidence,name),png);snapshots.push({time:t,file:name,sha256:sha(png)});}
    check('Opening starts with a quiet blank hold',snapshots[0].sha256===snapshots[1].sha256);
    check('The mountains, logo and content have distinct progressive frames',new Set(snapshots.slice(2,7).map(x=>x.sha256)).size===5);
    check('Completed animation closes its 24s cycle; the opening does not restart',snapshots.find(x=>x.time===12).sha256===snapshots.find(x=>x.time===36).sha256);
    check('Completed scene at 48s is not the empty opening',snapshots.find(x=>x.time===48).sha256!==snapshots[0].sha256);
    await page.evaluate(()=>window.renderFrame(12));const protectedChecks=await page.evaluate(()=>window.openingScene.native.checkProtected());
    check('At completion, every original logo/text/button region retains exact pixels',protectedChecks.every(x=>x.pass),protectedChecks);
    const joinA=await sharp(path.join(evidence,'frame-11_9666667.png')).ensureAlpha().raw().toBuffer(),joinB=await sharp(path.join(evidence,'frame-12.png')).ensureAlpha().raw().toBuffer();
    let joinDelta=0;for(let i=0;i<joinA.length;i+=4)joinDelta+=Math.abs(joinA[i]-joinB[i])+Math.abs(joinA[i+1]-joinB[i+1])+Math.abs(joinA[i+2]-joinB[i+2]);
    const meanJoinDelta=joinDelta/(joinA.length/4*3);check('Entrance joins the ambient animation without a hard cut',meanJoinDelta<3,{meanRGBDelta:meanJoinDelta});
    await page.locator('#replay').click();await page.waitForTimeout(450);let state=await page.evaluate(()=>window.getOpeningState());
    check('Replay restarts the opening and advances',state.playing&&state.time>.1&&state.time<2,state);
    await page.locator('#play').click();const held=await page.evaluate(()=>window.getOpeningState().time);await page.waitForTimeout(200);
    check('Pause holds time',await page.evaluate(t=>window.getOpeningState().time===t,held));
    await page.locator('#skip').click();state=await page.evaluate(()=>window.getOpeningState());check('Skip reaches the complete scene',state.playing&&state.time>=12&&state.time<13,state);
    await page.evaluate(()=>window.stopPreview());await page.locator('#seek').fill('5.5');check('Scrubber reaches a deterministic entrance frame',await page.evaluate(()=>Math.abs(window.getOpeningState().time-5.5)<.02));
    await page.locator('#speed').selectOption('1.25');check('Playback speed control is applied',await page.evaluate(()=>window.getOpeningState().speed===1.25));
    // A silent, local WAV fixture verifies the user's own music can be attached
    // and synchronized without uploading or using a third-party song.
    const sampleRate=8000,bytes=sampleRate*50*2,wav=Buffer.alloc(44+bytes);wav.write('RIFF');wav.writeUInt32LE(36+bytes,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(sampleRate,24);wav.writeUInt32LE(sampleRate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(bytes,40);
    await page.locator('#music').setInputFiles({name:'music-sync-test.wav',mimeType:'audio/wav',buffer:wav});
    await page.waitForFunction(()=>window.getOpeningState().audioTime!==null);await page.locator('#music-offset').fill('3');await page.locator('#seek').fill('4');await page.waitForTimeout(150);
    state=await page.evaluate(()=>window.getOpeningState());check('Local music follows seeking and the chosen music offset',Math.abs(state.audioTime-7)<.3&&state.musicOffset===3,state);
    await page.locator('#volume').fill('0.3');check('Music volume is adjustable',await page.evaluate(()=>window.getOpeningState().volume===.3));
    await page.locator('#remove-music').click();check('Music can be removed without changing the scene',await page.evaluate(()=>window.getOpeningState().music===''&&window.getOpeningState().audioTime===null));
    await page.locator('#speed').selectOption('1');await page.evaluate(()=>window.renderFrame(8.6));await page.screenshot({path:path.join(evidence,'preview-desktop.png')});
    await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);await page.screenshot({path:path.join(evidence,'preview-phone.png'),fullPage:true});
    const mobile=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,canvas:[scene.width,scene.height],buttons:[...document.querySelectorAll('.playback button')].map(b=>b.getBoundingClientRect().height)}));
    check('Phone preview has no horizontal overflow and keeps usable playback controls',!mobile.overflow&&mobile.buttons.every(h=>h>=44),mobile);
    const reduced=await makePage(browser,{reducedMotion:'reduce'});state=await reduced.evaluate(()=>window.getOpeningState());check('Reduced motion starts at a paused complete scene',!state.playing&&state.time===12,state);await reduced.close();
    const fallback=await browser.newPage({viewport:{width:900,height:800},reducedMotion:'reduce'});await fallback.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return kind==='webgl'||kind==='webgl2'?null:get.call(this,kind,...args);};});await route(fallback);await fallback.goto('http://opening.local/exports/homepage-intro/preview.html');await fallback.evaluate(()=>window.ready);
    check('Canvas 2D fallback completes even without WebGL',await fallback.evaluate(()=>window.openingScene.mode==='canvas2d'));await fallback.close();
    const filePage=await browser.newPage({reducedMotion:'reduce'});await filePage.goto('file:///'+path.join(out,'preview.html').replaceAll('\\','/'));await filePage.evaluate(()=>window.ready);check('Preview also opens directly from disk',await filePage.evaluate(()=>window.getOpeningState().time===12));await filePage.close();
    check('No browser errors or missing project resources',errors.length===0&&missing.length===0,{errors,missing});
    const grid=await Promise.all([0,2.3,4.8,6.7,8.6,12].map(async(t,i)=>({input:await sharp(path.join(evidence,'frame-'+String(t).replace('.','_')+'.png')).resize(640,396).png().toBuffer(),left:i%3*640,top:Math.floor(i/3)*396})));
    await sharp({create:{width:1920,height:792,channels:3,background:'#fae9ce'}}).composite(grid).jpeg({quality:92}).toFile(path.join(out,'opening-storyboard.jpg'));
    }
    if(!process.argv.includes('--verify-only')){
      await page.evaluate(()=>{window.stopPreview();window.recording=true;});
      await page.setViewportSize({width:1920,height:1300});await page.evaluate(()=>window.openingScene.setResolution(1920,1190));
      const video=path.join(out,'goi-viet-opening.mp4'),ffmpeg=path.join(root,'verification/homepage-clip/deps/ffmpeg.exe');
      encoder=spawn(ffmpeg,['-hide_banner','-loglevel','error','-y','-f','image2pipe','-vcodec','png','-framerate','30','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','17','-pix_fmt','yuv420p','-movflags','+faststart',video],{stdio:['pipe','ignore','pipe'],windowsHide:true});
      let encodingError='';encoder.stderr.on('data',b=>encodingError=(encodingError+b).slice(-6000));
      const encoded=new Promise((resolve,reject)=>{encoder.once('error',reject);encoder.once('exit',code=>code===0?resolve():reject(new Error(encodingError)));});
      encoded.catch(()=>{});
      const started=Date.now(),frameCount=36*30;
      for(let i=0;i<frameCount;i++){
        const frame=await pixels(page,i/30);if(encoder.exitCode!==null)throw new Error(encodingError);if(!encoder.stdin.write(frame))await once(encoder.stdin,'drain');
        if((i+1)%90===0)console.log(JSON.stringify({frames:i+1,total:frameCount,elapsedSeconds:Math.round((Date.now()-started)/1000)}));
      }
      encoder.stdin.end();await encoded;encoder=null;
      const info=await fs.stat(video);check('36s MP4 is encoded successfully',info.size>100000,{path:video,bytes:info.size,width:1920,height:1190,fps:30,frames:frameCount});
    }
    for(const name of preserved)check('Existing homepage preserved: '+name,before[name]===sha(await fs.readFile(path.join(root,name))));
    await fs.writeFile(path.join(evidence,process.argv.includes('--render-only')?'render-evidence.json':'verification.json'),JSON.stringify({metadata:meta,checks,snapshots,sourceHashes:before,generatedAt:new Date().toISOString()},null,2));
    console.log(JSON.stringify({passed:checks.length,video:process.argv.includes('--verify-only')?null:path.join(out,'goi-viet-opening.mp4'),evidence},null,2));
  }finally{if(encoder)encoder.kill();if(browser)await browser.close();}
})().catch(async error=>{await fs.writeFile(path.join(evidence,'failed-checks.json'),JSON.stringify({error:error.message,checks},null,2)).catch(()=>{});console.error(error);process.exitCode=1;});
