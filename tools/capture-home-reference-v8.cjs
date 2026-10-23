const fs=require('node:fs/promises'),path=require('node:path');
const {chromium}=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),phase=process.argv[2]||'after',out=path.join(root,'verification/home-reference-v8',phase);
if(!['before','after'].includes(phase))throw Error('Expected before or after');
(async()=>{
 await fs.mkdir(out,{recursive:true});const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const page=await browser.newPage({viewport:{width:1518,height:1036}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('file:///'+root.replaceAll('\\','/')+'/map-surroundings-preview-3.html');await page.waitForFunction(()=>window.GoiVietHomeIntro);
  await page.evaluate(async()=>{await GoiVietHomeIntro.ready;await document.fonts.ready;});
  const data={errors,states:[],manifest:await page.evaluate(()=>document.getElementById('homeClipFilm').homeScene.native.layerRenderer.manifest)};
  for(const time of [0,.5,1,1.5,2.5,3.5,4.5,5.5,6.5,7.5,8.5,9.5,10,12,20]){
   await page.evaluate(t=>GoiVietHomeIntro.seek(t,true),time);
   data.states.push(await page.evaluate(t=>({time:t,phase:GoiVietHomeIntro.getState().phase,failed:GoiVietHomeIntro.getState().failed,entries:[...document.querySelectorAll('[data-home-enter]')].map(e=>({id:e.id||e.className,timing:e.dataset.homeEnter,alpha:e.style.getPropertyValue('--home-enter-a'),translate:e.style.getPropertyValue('--home-enter-y'),visibility:getComputedStyle(e).visibility,inert:e.inert,disabled:e.disabled??null})),canvas:[homeSceneCanvas.width,homeSceneCanvas.height]}),time));
   await page.screenshot({path:path.join(out,'time-'+time+'.png')});
  }
  await fs.writeFile(path.join(out,'intro-checkpoints.json'),JSON.stringify(data,null,2));
  const tiles=await Promise.all([0,1.5,3.5,5.5,7.5,10].map(async(t,i)=>({input:await sharp(path.join(out,'time-'+t+'.png')).resize(506,345).png().toBuffer(),left:i%3*506,top:Math.floor(i/3)*345})));
  await sharp({create:{width:1518,height:690,channels:3,background:'#fff1d8'}}).composite(tiles).png().toFile(path.join(out,'intro-storyboard.png'));
  console.log(JSON.stringify({phase,checkpoints:data.states.length,canvas:data.states[0].canvas,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
