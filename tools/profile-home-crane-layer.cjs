// Real Chrome A/B: the saved pre-change renderer versus the displayed WebGL layer.
// node tools/profile-home-crane-layer.cjs smoke|measure|visual|verify
// A local ephemeral HTTP server and a fresh browser per run; never uses the user's profile.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os'),zlib=require('node:zlib'),crypto=require('node:crypto');
const assert=require('node:assert/strict');
const runtime=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const {chromium}=require(require.resolve('playwright',{paths:[process.cwd(),runtime]}));
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/crane-webgl-layer-20261023');
const mode=process.argv[2]||'measure',sleep=ms=>new Promise(r=>setTimeout(r,ms)),round=n=>Math.round(n*10)/10;
const files=['assets/goi-viet/homepage-crane-flight.js','assets/goi-viet/homepage-layered-renderer.js','assets/goi-viet/homepage-layered-renderer-3.js','assets/goi-viet/homepage-content.css','index.html','map-surroundings-preview-3.html'];
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.ttf':'font/ttf','.ico':'image/x-icon'};
let variant='after';
const server=http.createServer((req,res)=>{
 let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'');}catch{res.writeHead(400).end();return;}
 if(!name)name='map-surroundings-preview-3.html';
 const base=variant==='before'&&files.includes(name)?path.join(out,'before'):root,file=path.resolve(base,name);
 if(!file.startsWith(base+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(file,(err,bytes)=>{if(err){res.writeHead(404).end();return;}res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(bytes);});
});
const save=(name,data)=>fs.writeFileSync(path.join(out,name),JSON.stringify(data,null,2));
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function stats(intervals){
 const a=intervals.slice().sort((x,y)=>x-y),sum=a.reduce((s,x)=>s+x,0);
 return {frames:a.length,fps:sum?round(a.length*1000/sum):null,over25:a.filter(x=>x>25).length,over50:a.filter(x=>x>50).length,over100:a.filter(x=>x>100).length,p95Ms:a.length?round(a[Math.floor((a.length-1)*.95)]):null,maxMs:a.length?round(a.at(-1)):null};
}
async function launch(){return chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--disable-features=CalculateNativeWinOcclusion','--disable-backgrounding-occluded-windows','--disable-renderer-backgrounding','--window-size=1500,1000']});}
async function open(browser,url,viewport={width:1440,height:900},dpr=1){
 const context=await browser.newContext({viewport,deviceScaleFactor:dpr,locale:'vi-VN',reducedMotion:'no-preference'}),page=await context.newPage(),errors=[];
 page.setDefaultTimeout(90000);page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  const D=window.__craneMeasure={copies:0,draws:[],frames:[],prepAt:null,start:null,done:false};
  const kinds=new WeakMap(),get=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type,...args){const ctx=get.call(this,type,...args);if(ctx){kinds.set(this,type);if(type==='2d'&&this.id==='homeSceneCanvas'&&!ctx.__craneMeasured){ctx.__craneMeasured=true;const draw=ctx.drawImage;ctx.drawImage=function(source){if(kinds.get(source)==='webgl')D.copies++;return draw.apply(this,arguments);};}}return ctx;};
  D.arm=()=>{
   const scene=document.getElementById('homeClipFilm').homeScene,render=scene.renderFrame;
   scene.renderFrame=function(){const start=performance.now();const result=render.apply(this,arguments);if(D.start!=null&&!D.done)D.draws.push([start-D.start,performance.now()-start]);return result;};
   let last=null;
   const step=t=>{
    if(D.start==null&&window.GoiVietHomeIntro.getState().phase==='complete'){D.start=t;D.copies=0;}
    if(D.start!=null){if(last!=null)D.frames.push([t-D.start,t-last]);last=t;if(D.prepAt==null&&window.GoiVietMapPrewarm3?.inspect().preparedMs!=null)D.prepAt=t-D.start;if(t-D.start>=20000){D.done=true;return;}}
    requestAnimationFrame(step);
   };requestAnimationFrame(step);
  };
 });
 const cdp=await context.newCDPSession(page);await cdp.send('Network.enable');await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
 await page.goto(url,{waitUntil:'load',timeout:180000});await page.waitForFunction(()=>window.GoiVietHomeIntro);await page.evaluate(()=>GoiVietHomeIntro.ready);
 if(!await page.evaluate(()=>GoiVietHomeIntro.getState().ready))throw Error('Scene did not become ready');
 return {context,page,cdp,errors};
}
function analyzeTrace(events){
 const start=events.find(e=>e.name==='crane-layer-measure-start'),end=events.find(e=>e.name==='crane-layer-measure-end');
 if(!start||!end)throw Error('Missing exact trace window markers');
 const seconds=(end.ts-start.ts)/1e6,threads={};for(const e of events)if(e.ph==='M'&&e.name==='thread_name')threads[e.pid+':'+e.tid]=e.args?.name;
 const busy=key=>{
  const intervals=events.filter(e=>e.ph==='X'&&e.dur!=null&&e.pid+':'+e.tid===key).map(e=>[Math.max(start.ts,e.ts),Math.min(end.ts,e.ts+e.dur)]).filter(([a,b])=>b>a).sort((a,b)=>a[0]-b[0]);
  let total=0,last=-Infinity;for(const [a,b]of intervals){if(b<=last)continue;total+=b-Math.max(a,last);last=b;}return round(total/1000/seconds);
 };
 const group=name=>Object.keys(threads).filter(k=>threads[k]===name).reduce((n,k)=>n+busy(k),0);
 return {seconds:round(seconds),gpuMainTaskMsPerSec:round(group('CrGpuMain')),rendererMainTaskMsPerSec:round(group('CrRendererMain')),note:'Union of trace task wall-time on Chrome threads; not hardware GPU utilization or CPU running time.'};
}
async function idleTrace(ctx,file){
 const {page,cdp}=ctx,events=[],handler=e=>events.push(...e.value);cdp.on('Tracing.dataCollected',handler);
 await cdp.send('Tracing.start',{transferMode:'ReportEvents',categories:'gpu,viz,toplevel,blink.user_timing,__metadata'});
 await page.evaluate(()=>{performance.mark('crane-layer-measure-start');window.__idleCraneStart={time:performance.now(),copies:__craneMeasure.copies};});
 await sleep(5000);
 const counters=await page.evaluate(()=>{performance.mark('crane-layer-measure-end');return {seconds:(performance.now()-__idleCraneStart.time)/1000,copies:__craneMeasure.copies-__idleCraneStart.copies,mode:homeSceneCanvas.dataset.craneCompositing||'canvas-copy',cranes:homeClipFilm.homeScene.native.layerRenderer.inspect?.().cranes||null};});
 const done=new Promise(r=>cdp.once('Tracing.tracingComplete',r));await cdp.send('Tracing.end');await done;cdp.off('Tracing.dataCollected',handler);
 fs.writeFileSync(path.join(out,file),zlib.gzipSync(JSON.stringify({traceEvents:events})));
 return {...analyzeTrace(events),...counters};
}
async function measure(url){
 const report={created:new Date().toISOString(),viewport:{width:1440,height:900},dpr:1,homeSeconds:20,order:['before','after','after','before','before','after'],hashes:{},runs:[]};
 for(const v of ['before','after'])report.hashes[v]=Object.fromEntries(files.map(f=>[f,hash(v==='before'?path.join(out,'before',f):path.join(root,f))]));
 for(const [i,v]of report.order.entries()){
  variant=v;const row={run:i+1,variant:v},browser=await launch();let memTimer;
  try{
   const bcdp=await browser.newBrowserCDPSession(),info=await bcdp.send('SystemInfo.getInfo');report.chrome=browser.version();report.gpu=info.gpu.devices;report.gpuFeatureStatus=info.gpu.featureStatus;
   const ctx=await open(browser,url),{page}=ctx,memory=[];memTimer=setInterval(()=>memory.push({time:new Date().toISOString(),availableMB:Math.round(os.freemem()/1048576)}),1000);
   await page.evaluate(()=>__craneMeasure.arm());await page.locator('#btnHomeOpeningStart').click();
   await page.waitForFunction(()=>__craneMeasure.done,{}, {timeout:120000,polling:200});
   const raw=await page.evaluate(()=>({frames:__craneMeasure.frames,draws:__craneMeasure.draws,prepAt:__craneMeasure.prepAt,prewarm:GoiVietMapPrewarm3.inspect(),state:GoiVietHomeIntro.getState(),mode:homeSceneCanvas.dataset.craneCompositing||'canvas-copy'}));
   row.all=stats(raw.frames.map(([,dt])=>dt));row.preparing=stats(raw.frames.filter(([t])=>raw.prepAt==null||t<=raw.prepAt).map(([,dt])=>dt));row.idle=stats(raw.frames.filter(([t])=>raw.prepAt!=null&&t>raw.prepAt).map(([,dt])=>dt));
   row.prepAtMs=raw.prepAt==null?null:Math.round(raw.prepAt);row.prewarm=raw.prewarm;row.render=stats(raw.draws.slice(1).map(([t],k)=>t-raw.draws[k][0]));row.drawCpuMs=stats(raw.draws.map(([,dt])=>dt));row.mode=raw.mode;
   row.longFrames=raw.frames.filter(([,dt])=>dt>50).map(([t,dt])=>[Math.round(t),round(dt)]);
   clearInterval(memTimer);row.memory=memory;row.state=raw.state;
   await page.waitForFunction(()=>GoiVietMapPrewarm3.inspect().preparedMs!=null,{}, {timeout:120000,polling:250});await sleep(1500);
   row.trace=await idleTrace(ctx,`trace-${i+1}-${v}.json.gz`);row.errors=ctx.errors;row.rawFrames=raw.frames;
  }catch(e){row.error=e.stack;console.error(e.message);}finally{clearInterval(memTimer);await browser.close();}
  report.runs.push(row);save('measurements.json',report);
  console.log(JSON.stringify({run:row.run,variant:v,fps:row.all?.fps,over50:row.all?.over50,prepAtMs:row.prepAtMs,idleFps:row.idle?.fps,trace:row.trace,error:row.error}));
  if(row.error)throw Error('Run failed; stopped instead of reporting partial results as a comparison');
 }
}
async function smoke(url){
 const browser=await launch();try{const ctx=await open(browser,url),{page}=ctx,bcdp=await browser.newBrowserCDPSession();const info=await bcdp.send('SystemInfo.getInfo');
  await page.evaluate(()=>GoiVietHomeIntro.seek(3,true));await page.screenshot({path:path.join(out,'smoke-intro.png')});
  await page.evaluate(()=>GoiVietHomeIntro.seek(12,true));await page.screenshot({path:path.join(out,'smoke-home.png')});
  const result=await page.evaluate(()=>({state:GoiVietHomeIntro.getState(),layers:[...document.querySelectorAll('.gv-home-scene-overlay')].map(c=>({type:c.dataset.homeSceneLayer,width:c.width,height:c.height,hidden:c.hidden})),copies:__craneMeasure.copies,engine:homeClipFilm.homeScene.native.layerRenderer.inspect?.()}));
  save('smoke.json',{...result,errors:ctx.errors,gpu:info.gpu.devices,featureStatus:info.gpu.featureStatus});console.log(JSON.stringify({...result,errors:ctx.errors,gpu:info.gpu.devices}));
 }finally{await browser.close();}
}
async function visual(url){
 const report={pages:[],errors:[]};
 for(const v of ['before','after'])for(const [file,width,height,dpr]of [['map-surroundings-preview-3.html',1440,900,1],['map-surroundings-preview-3.html',390,844,2],['index.html',1440,900,1]]){
  variant=v;const browser=await launch();try{const ctx=await open(browser,url.replace(/[^/]+$/,file),{width,height},dpr),{page}=ctx;
   const key=`${v}-${file.startsWith('index')?'index':'preview3'}-${width}`,row={variant:v,file,width,height,dpr,key};
   for(const time of [0,2.5,4.3,8,12,14.7]){await page.evaluate(t=>GoiVietHomeIntro.seek(t,true),time);await page.screenshot({path:path.join(out,`${key}-${time}.png`)});}
   row.state=await page.evaluate(()=>({failed:GoiVietHomeIntro.getState().failed,overflow:document.documentElement.scrollWidth>innerWidth,canvas:[homeSceneCanvas.width,homeSceneCanvas.height],mode:homeSceneCanvas.dataset.craneCompositing||'canvas-copy',layers:[...document.querySelectorAll('.gv-home-scene-overlay')].map(c=>({type:c.dataset.homeSceneLayer,width:c.width,height:c.height,hidden:c.hidden}))}));row.errors=ctx.errors;report.pages.push(row);report.errors.push(...ctx.errors);save('visual.json',report);console.log(JSON.stringify(row));
  }finally{await browser.close();}
 }
}
async function verify(url){
 const report={invariants:{},pages:[],errors:[]};
 const digest=s=>crypto.createHash('sha256').update(s).digest('hex');
 const motion=file=>{const s=fs.readFileSync(file,'utf8');return s.slice(s.indexOf('  function phase('),s.indexOf('  function webglRenderer('));};
 const trajectories=file=>{const s=fs.readFileSync(file,'utf8');return s.slice(s.indexOf('    function birdTravelTime('),s.indexOf('    function draw(l,t,'));};
 assert.equal(motion(path.join(out,'before',files[0])),motion(path.join(root,files[0])));report.invariants.articulation=digest(motion(path.join(root,files[0])));
 for(const file of files.slice(1,3)){assert.equal(trajectories(path.join(out,'before',file)),trajectories(path.join(root,file)));report.invariants[file]=digest(trajectories(path.join(root,file)));}
 const texture=hash(path.join(root,'assets/goi-viet/homepage-cranes/articulated-parts.webp'));assert.equal(texture,'507b911a0fe9bfeb49e7c92a37f52af6c4a4085f142923ef0cf1bfa54158f9c6');report.invariants.texture=texture;
 const browser=await launch();try{
  for(const file of ['map-surroundings-preview-3.html','index.html']){
   const ctx=await open(browser,url.replace(/[^/]+$/,file)),{page}=ctx,row={file};
   await page.locator('#btnHomeOpeningStart').click();assert.equal(await page.evaluate(()=>GoiVietHomeIntro.getState().phase),'playing');
   await page.locator('#btnHomeOpeningSkip').click();assert.equal(await page.evaluate(()=>GoiVietHomeIntro.getState().phase),'complete');
   await page.locator('#btnHomeOpeningReplay').click();assert.equal(await page.evaluate(()=>GoiVietHomeIntro.getState().phase),'playing');row.controls=true;
   await page.evaluate(()=>GoiVietHomeIntro.seek(4.3,true));
   row.layer=await page.evaluate(()=>{const c=document.querySelector('[data-home-scene-layer="cranes"]'),gl=c.getContext('webgl'),ext=gl.getExtension('WEBGL_debug_renderer_info');return {count:document.querySelectorAll('[data-home-scene-layer="cranes"]').length,attrs:gl.getContextAttributes(),renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),pointerEvents:getComputedStyle(c).pointerEvents,order:[...c.parentElement.querySelectorAll('canvas')].map(c=>c.id||c.dataset.homeSceneLayer),copies:__craneMeasure.copies};});
   assert.equal(row.layer.count,1);assert.equal(row.layer.attrs.preserveDrawingBuffer,false);assert.equal(row.layer.pointerEvents,'none');assert.deepEqual(row.layer.order,['homeSceneCanvas','cranes','mist']);assert.equal(row.layer.copies,0);
   row.resizes=[];
   for(const [width,height]of [[390,844],[844,390],[2560,1440],[1440,900]]){
    await page.setViewportSize({width,height});await sleep(100);await page.evaluate(()=>GoiVietHomeIntro.seek(3,true));await page.evaluate(()=>GoiVietHomeIntro.seek(12,true));
    const size=await page.evaluate(()=>({base:[homeSceneCanvas.width,homeSceneCanvas.height],birds:[...document.querySelectorAll('[data-home-scene-layer="cranes"]')].map(c=>[c.width,c.height]),mist:document.querySelectorAll('[data-home-scene-layer="mist"]').length,failed:GoiVietHomeIntro.getState().failed,overflow:document.documentElement.scrollWidth>innerWidth}));
    assert.equal(size.failed,false);assert.equal(size.overflow,false);assert.equal(size.birds.length,1);assert.deepEqual(size.birds[0],size.base);assert.ok(size.mist<=1);row.resizes.push({width,height,...size});
   }
   if(file.startsWith('map-')){
    await page.evaluate(()=>GoiVietHomeIntro.setArtworkVisible(false));
    row.suspended=await page.evaluate(()=>({cranes:homeClipFilm.homeScene.native.layerRenderer.inspect().cranes,hidden:document.querySelector('[data-home-scene-layer="cranes"]').hidden,mist:document.querySelectorAll('[data-home-scene-layer="mist"]').length}));
    assert.equal(row.suspended.cranes.bufferPixels,0);assert.equal(row.suspended.hidden,true);assert.equal(row.suspended.mist,0);
    await page.evaluate(()=>{GoiVietHomeIntro.setArtworkVisible(true);GoiVietHomeIntro.seek(12,true);});
    row.resumed=await page.evaluate(()=>({cranes:homeClipFilm.homeScene.native.layerRenderer.inspect().cranes,hidden:document.querySelector('[data-home-scene-layer="cranes"]').hidden}));assert.equal(row.resumed.hidden,false);assert.ok(row.resumed.cranes.bufferPixels>1);
   }
   await page.evaluate(()=>{const c=document.querySelector('[data-home-scene-layer="cranes"]');c.getContext('webgl').getExtension('WEBGL_lose_context').loseContext();});await sleep(50);
   await page.evaluate(()=>GoiVietHomeIntro.seek(4.3,true));
   row.contextLoss=await page.evaluate(()=>({mode:homeSceneCanvas.dataset.craneCompositing,overlays:document.querySelectorAll('.gv-home-scene-overlay').length,failed:GoiVietHomeIntro.getState().failed}));
   assert.equal(row.contextLoss.mode,'canvas-copy');assert.equal(row.contextLoss.overlays,0);assert.equal(row.contextLoss.failed,false);
   await page.screenshot({path:path.join(out,`context-loss-${file.startsWith('index')?'index':'preview3'}.png`)});row.errors=ctx.errors;assert.deepEqual(row.errors,[]);report.pages.push(row);await ctx.context.close();
  }
  const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(url,{waitUntil:'load'});await page.waitForFunction(()=>window.GoiVietHomeIntro);await page.evaluate(()=>GoiVietHomeIntro.ready);await page.locator('#btnHomeOpeningStart').click();
  report.reducedMotion=await page.evaluate(()=>({phase:GoiVietHomeIntro.getState().phase,layers:document.querySelectorAll('.gv-home-scene-overlay').length,failed:GoiVietHomeIntro.getState().failed}));assert.equal(report.reducedMotion.phase,'complete');assert.equal(report.reducedMotion.layers,0);assert.equal(report.reducedMotion.failed,false);assert.deepEqual(report.errors,[]);
 }finally{await browser.close();save('verification.json',report);}
 console.log(JSON.stringify(report));
}
(async()=>{fs.mkdirSync(out,{recursive:true});await new Promise((r,j)=>{server.once('error',j);server.listen(0,'127.0.0.1',r);});const url=`http://127.0.0.1:${server.address().port}/map-surroundings-preview-3.html`;
 try{if(mode==='smoke')await smoke(url);else if(mode==='visual')await visual(url);else if(mode==='verify')await verify(url);else await measure(url);}finally{await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
