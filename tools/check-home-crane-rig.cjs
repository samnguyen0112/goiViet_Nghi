// Visual/material/lifecycle regression for the single-source crane rig.
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const runtime=path.join(require('node:os').homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const sharp=require(require.resolve('sharp',{paths:[process.cwd(),runtime]})),{chromium}=require(require.resolve('playwright',{paths:[process.cwd(),runtime]}));
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/crane-rig'),base=path.join(root,'assets/goi-viet');
(async()=>{
 await fs.mkdir(out,{recursive:true});const report={errors:[],pages:[]};
 const source=await fs.readFile(path.join(base,'homepage-cranes/approved-poses.png'));
 assert.equal(crypto.createHash('sha256').update(source).digest('hex'),'9cc8e0daa59a5277b3e228ddef7ab911c70a7e3fd643704054814752b438945c');
 const atlas=await sharp(path.join(base,'homepage-cranes/articulated-parts.webp')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 assert.equal(atlas.info.width,2048);assert.equal(atlas.info.height,512);
 const headMask=[];for(let y=220;y<250;y++)for(let x=435;x<490;x++)if(atlas.data[(y*2048+x)*4+3]>250)headMask.push([(y+64)*640+x+64]);assert.ok(headMask.length>50);
 report.asset={fixedParts:3,approvedReferenceUnchanged:true,texturePixels:2048*512};
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--allow-file-access-from-files']});
 try{
  for(const file of ['map-surroundings-preview-3.html','index.html']){
   const page=await browser.newPage({viewport:{width:1518,height:1036}}),requests=[];
   page.on('pageerror',e=>report.errors.push(e.message));page.on('request',r=>{if(/homepage-cranes\/.+\.(webp|png)/.test(r.url()))requests.push(r.url());});
   await page.goto('file:///'+root.replaceAll('\\','/')+'/'+file);await page.waitForFunction(()=>window.GoiVietHomeIntro);
   await page.evaluate(async()=>{await GoiVietHomeIntro.ready;await document.fonts.ready;});
   assert.equal(await page.locator('#homeSceneCanvas').getAttribute('data-crane-animation'),'approved-ivory-gold');
   await page.locator('#btnHomeOpeningStart').click();assert.equal(await page.evaluate(()=>GoiVietHomeIntro.getState().phase),'playing');
   await page.locator('#btnHomeOpeningSkip').click();assert.equal(await page.evaluate(()=>GoiVietHomeIntro.getState().phase),'complete');
   await page.locator('#btnHomeOpeningReplay').click();assert.equal(await page.evaluate(()=>GoiVietHomeIntro.getState().phase),'playing');
   await page.evaluate(()=>GoiVietHomeIntro.seek(12,true));const item={file,controls:true};
   if(file.startsWith('map-')){
    const result=await page.evaluate(async mask=>{
     const flight=await GoiVietCraneFlight.create(),c=document.createElement('canvas');c.width=c.height=640;const g=c.getContext('2d',{willReadFrequently:true});let renderedSurface;
     const draw=g.drawImage.bind(g);g.drawImage=(image,...args)=>{renderedSurface=image;draw(image,...args);};
     const capture=t=>{g.clearRect(0,0,640,640);g.save();g.translate(344,354);flight.draw(g,{id:'test',direction:1},t,460);g.restore();return g.getImageData(0,0,640,640).data;};
     const score=(a,b)=>{let n=0;for(let p=0;p<a.length;p+=4){const aa=a[p+3]/255,ab=b[p+3]/255;for(let k=0;k<3;k++)n+=Math.abs(a[p+k]*aa-b[p+k]*ab);n+=Math.abs(a[p+3]-b[p+3]);}return n/a.length;};
     let maxStep=0,maxHeadChange=0,borderAlpha=0;const first=capture(0),frames=[];
     for(let i=0;i<24;i++){
      const t=i*1.72/24,a=capture(t),b=capture(t+.0002);maxStep=Math.max(maxStep,score(a,b));
      for(const [p]of mask)for(let k=0;k<4;k++)maxHeadChange=Math.max(maxHeadChange,Math.abs(a[p*4+k]-first[p*4+k]));
      for(let k=0;k<640;k++)for(const p of [k,639*640+k,k*640,k*640+639])borderAlpha=Math.max(borderAlpha,a[p*4+3]);
      if(i%2===0){capture(t);frames.push(c.toDataURL());}
     }
     const beforeClear=capture(.62),memory=flight.inspect();flight.clear();const released=flight.inspect(),afterClear=capture(.62),resumeDifference=score(beforeClear,afterClear);
     let fallback;const gl=renderedSurface.getContext('webgl'),lose=gl?.getExtension('WEBGL_lose_context');
     if(lose){lose.loseContext();await new Promise(resolve=>setTimeout(resolve,40));capture(.62);fallback={...flight.inspect(),visible:g.getImageData(0,0,640,640).data.some((v,i)=>i%4===3&&v>200)};}
     flight.dispose();const cpu=await GoiVietCraneFlight.create({forceCanvas:true});g.clearRect(0,0,640,640);g.save();g.translate(344,354);cpu.draw(g,{id:'fallback',direction:1},.62,460);g.restore();const cpuImage=c.toDataURL(),cpuInfo=cpu.inspect();cpu.dispose();
     return {maxStep,maxHeadChange,borderAlpha,memory,released,resumeDifference,fallback,cpuInfo,cpuImage,frames};
    },headMask);
    assert.equal(result.memory.sourcePoses,1);assert.equal(result.memory.morphing,false);assert.equal(result.memory.parts,3);assert.equal(result.maxHeadChange,0,'Head material changes between wing poses');assert.ok(result.maxStep<.3,'Skeletal animation has a hard transition');assert.equal(result.borderAlpha,0,'Wing tips are clipped');assert.equal(result.released.bufferPixels,0);assert.equal(result.resumeDifference,0);
    if(result.fallback){assert.equal(result.fallback.renderer,'canvas2d');assert.equal(result.fallback.visible,true);}assert.equal(result.cpuInfo.renderer,'canvas2d');
    const tiles=[];for(let i=0;i<result.frames.length;i++)tiles.push({input:await sharp(Buffer.from(result.frames[i].split(',')[1],'base64')).resize(300).flatten({background:'#f8ebd1'}).png().toBuffer(),left:i%4*300,top:Math.floor(i/4)*300});
    await sharp({create:{width:1200,height:900,channels:4,background:'#f8ebd1'}}).composite(tiles).png().toFile(path.join(out,'rig-cycle.png'));
    await fs.writeFile(path.join(out,'rig-fallback.png'),Buffer.from(result.cpuImage.split(',')[1],'base64'));delete result.frames;delete result.cpuImage;item.rig=result;
    item.livePlayback=await page.evaluate(async()=>{
     const scene=homeClipFilm.homeScene,original=scene.renderFrame,costs=[],stamps=[];scene.renderFrame=function(...args){const before=performance.now();original.apply(this,args);costs.push(performance.now()-before);stamps.push(before);};
     GoiVietHomeIntro.seek(12,false);for(let i=0;i<100;i++)await new Promise(requestAnimationFrame);GoiVietHomeIntro.seek(12,true);scene.renderFrame=original;
     const sorted=costs.slice().sort((a,b)=>a-b);return {draws:costs.length,p95DrawMs:sorted[Math.floor(sorted.length*.95)],elapsedMs:stamps.at(-1)-stamps[0],failed:GoiVietHomeIntro.getState().failed};
    });assert.equal(item.livePlayback.failed,false);assert.ok(item.livePlayback.draws>25);
   }
   await page.evaluate(()=>GoiVietHomeIntro.seek(8,true));await page.screenshot({path:path.join(out,file.startsWith('index')?'index-desktop.png':'preview3-desktop.png')});
   item.responsive=[];
   for(const [width,height]of [[390,844],[844,390],[2560,1440]]){
    await page.setViewportSize({width,height});await page.waitForTimeout(180);await page.evaluate(()=>GoiVietHomeIntro.seek(14,true));const state=await page.evaluate(()=>({failed:GoiVietHomeIntro.getState().failed,overflow:document.documentElement.scrollWidth>innerWidth}));assert.equal(state.failed,false);assert.equal(state.overflow,false);item.responsive.push({width,height,...state});
    if(width===390)await page.screenshot({path:path.join(out,file.startsWith('index')?'index-mobile.png':'preview3-mobile.png')});
   }
   assert.equal(requests.filter(p=>p.includes('articulated-parts.webp')).length,1);assert.equal(requests.some(p=>p.includes('approved-flight.webp')),false);item.imageRequests=requests;report.pages.push(item);await page.close();
  }
  const page=await browser.newPage({reducedMotion:'reduce'});await page.goto('file:///'+root.replaceAll('\\','/')+'/map-surroundings-preview-3.html');await page.waitForFunction(()=>window.GoiVietHomeIntro);await page.evaluate(()=>GoiVietHomeIntro.ready);await page.locator('#btnHomeOpeningStart').click();assert.equal(await page.evaluate(()=>GoiVietHomeIntro.getState().phase),'complete');report.reducedMotion=true;assert.equal(report.errors.length,0);
 }finally{await browser.close();await fs.writeFile(path.join(out,'report.json'),JSON.stringify(report,null,2));}
 console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1;});
