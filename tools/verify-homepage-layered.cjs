// Exercise the production loader/opening adapter with native Canvas, not browser automation.
const fs=require('node:fs/promises'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const deps='C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {createCanvas,Image}=require(deps+'/@napi-rs/canvas'),sharp=require(deps+'/sharp');
const root=path.resolve(__dirname,'..'),out=path.join(root,'assets/goi-viet'),proof=path.join(root,'verification/homepage-layered-integration-20261012'),checks=[];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const check=(name,pass,detail)=>{checks.push({name,pass,detail});if(!pass)throw Error(name+' '+JSON.stringify(detail));};
async function production(high){
  const sandbox={window:{},Image,URL,setTimeout,clearTimeout,matchMedia:()=>({matches:high}),console};
  sandbox.document={currentScript:{src:'http://localhost/assets/goi-viet/homepage-layered-scene.js'},createElement:name=>name==='canvas'?createCanvas(1,1):{remove(){}},head:{append(script){
    fs.readFile(path.join(out,new URL(script.src).pathname.split('/').pop()),'utf8').then(code=>{vm.runInContext(code,sandbox);script.onload?.();}).catch(()=>script.onerror?.());
  }}};
  vm.createContext(sandbox);
  for(const file of ['homepage-opening-config.js','homepage-layered-renderer.js','homepage-layered-scene.js','homepage-layered-opening.js'])vm.runInContext(await fs.readFile(path.join(out,file),'utf8'),sandbox);
  const canvas=createCanvas(1280,793);canvas.dataset={};const opening=await sandbox.window.GoiVietHomeOpening.create(canvas);
  return {canvas,opening,engine:opening.native.layerRenderer,progress:sandbox.window.GoiVietHomeOpening.progress,config:sandbox.window.GoiVietHomeOpeningConfig};
}
(async()=>{
  const low=await production(false),high=await production(true);
  check('Opening duration is 20 percent faster: twelve seconds divided by 1.2',low.config.duration===10&&high.config.duration===10);
  check('DOM text and action phases use the same accelerated timeline as the landscape',low.progress(7.5,7.8,9)===1&&low.progress(9.7,10.5,11.6)===1&&low.progress(4,5.3,7.2)===0);
  check('Standard and high-density production packs load all 64 layers',low.engine.images.size===64&&high.engine.images.size===64&&low.canvas.dataset.assetQuality==='2k'&&high.canvas.dataset.assetQuality==='4k');
  check('Production renderer is the exact reviewed lab renderer',sha(await fs.readFile(path.join(out,'homepage-layered-renderer.js')))===sha(await fs.readFile(path.join(root,'exports/landscape-layers-lab-20261012/scene.js'))));
  check('Production packs omit inspection reference/outline images',!low.engine.manifest.reference&&!high.engine.manifest.outline);
  const tree=low.engine.manifest.layers.find(l=>l.kind==='tree'&&!l.clippedEdges?.length),lowIm=low.engine.images.get(tree.id),highIm=high.engine.images.get(tree.id);
  const l=low.engine.treePoint(tree,lowIm.width*.5,0,1),h=high.engine.treePoint(tree,highIm.width*.5,0,1);
  check('Tree sway has the same world amplitude at 2K and 4K',Math.abs((l.x-lowIm.width*.5)/lowIm.width-(h.x-highIm.width*.5)/highIm.width)<.0001);
  const {canvas,opening,engine}=low,ctx=canvas.getContext('2d'),pixels=()=>Buffer.from(ctx.getImageData(0,0,canvas.width,canvas.height).data);
  const ids=new Map([...engine.images].map(([id,im])=>[im,id])),nativeDraw=ctx.drawImage.bind(ctx);let draws=[];
  ctx.drawImage=(im,...args)=>{const m=ctx.getTransform();draws.push({id:ids.get(im)||'animated-sprite',alpha:ctx.globalAlpha,args,transform:m.toString(),matrix:{a:m.a,b:m.b,c:m.c,d:m.d,e:m.e,f:m.f}});return nativeDraw(im,...args);};
  opening.renderFrame(0);check('Opening starts with empty paper and no painted scene objects',draws.length===0);
  const skyCanvas=createCanvas(canvas.width,canvas.height),skyContext=skyCanvas.getContext('2d');skyContext.imageSmoothingQuality='high';skyContext.drawImage(engine.images.get('sky'),0,0,canvas.width,canvas.height);
  const skyPixels=skyContext.getImageData(0,0,canvas.width,canvas.height).data;
  const frames=[];
  for(const t of [0,.9,1.45,2.3,3.1,4.2,4.8,6.7,8.6,9.9667,10,11.9667,12,36,60]){
    draws=[];opening.renderFrame(t);const snap=pixels();let revealed=0;for(let p=0;p<snap.length;p+=4)for(let k=0;k<3;k++)revealed+=Math.abs(snap[p+k]-skyPixels[p+k]);revealed/=snap.length/4*3;
    const bytes=canvas.toBuffer('image/png');await fs.writeFile(path.join(proof,'frame-'+String(t).replace('.','-')+'.png'),bytes);frames.push({t,draws:[...draws],hash:sha(snap),bytes,revealed});
  }
  check('Atmosphere progressively reveals the continuous landscape before text appears',frames[1].revealed>0&&frames[1].revealed<frames[2].revealed&&frames[2].revealed<frames[3].revealed,{meanTerrainContrast:frames.map(f=>[f.t,f.revealed])});
  const staticIds=new Set(engine.manifest.layers.filter(l=>['mountain','fixed'].includes(l.kind)).map(l=>l.id));
  const staticDraws=f=>f.draws.filter(d=>staticIds.has(d.id)),finalDraws=new Map(staticDraws(frames.find(f=>f.t===12)).map(d=>[d.id,d]));
  check('Mountains and architecture keep their object geometry under rigid entry translation and uniform depth scaling',frames.every(f=>staticDraws(f).every(d=>{const end=finalDraws.get(d.id);return JSON.stringify(d.args)===JSON.stringify(end.args)&&Math.abs(d.matrix.b)<.00001&&Math.abs(d.matrix.c)<.00001&&Math.abs(d.matrix.a/end.matrix.a-d.matrix.d/end.matrix.d)<.00001;})));
  const mountainEntries=id=>frames.flatMap(f=>staticDraws(f).filter(d=>d.id===id));
  const approach=id=>mountainEntries(id).map(d=>{const l=engine.manifest.layers.find(l=>l.id===id),x=l.rect[0]+l.rect[2]/2,end=finalDraws.get(id);return d.matrix.a*x+d.matrix.e-end.matrix.a*x-end.matrix.e;});
  check('Both mountainsides have a gentle visible inward approach within one continuous projection',Math.min(...approach('mountains-far-left'))< -1&&Math.max(...approach('mountains-far-right'))>1);
  check('Train and bridge share the same rigid entrance pose throughout',frames.every(f=>{const a=f.draws.find(d=>d.id==='train'),b=f.draws.find(d=>d.id==='bridge');return !a||!b||a.transform===b.transform;}));
  let mismatchedRidges=0,movingBridgeFrames=0,translucentBridgeFrames=0;
  for(let t=.25;t<=5.2;t+=.05){draws=[];opening.renderFrame(t);
    const terrain=draws.filter(d=>d.id?.startsWith('mountains-')||d.id==='river-valley');if(terrain.some(d=>d.transform!==terrain[0]?.transform||d.alpha!==1))mismatchedRidges++;
    const bridge=draws.find(d=>d.id==='bridge');if(bridge){if(bridge.transform!==finalDraws.get('bridge').transform)movingBridgeFrames++;if(bridge.alpha>.05&&bridge.alpha<.95)translucentBridgeFrames++;}
  }
  check('Mountains, river and foreground are fully painted in the same registered pose under one reveal effect',mismatchedRidges===0,{mismatchedRidges});
  check('Bridge stays at its final coordinates and fades smoothly from translucent to opaque',movingBridgeFrames===0&&translucentBridgeFrames>15,{movingBridgeFrames,translucentBridgeFrames});
  check('Terrain approach remains uniform and below two percent, with no landscape deformation',mountainEntries('mountains-far-left').some(d=>d.matrix.a/finalDraws.get(d.id).matrix.a>1.002)&&frames.every(f=>staticDraws(f).filter(d=>d.id.startsWith('mountains-')).every(d=>d.matrix.a/finalDraws.get(d.id).matrix.a>=1&&d.matrix.a/finalDraws.get(d.id).matrix.a<=1.019)));
  check('Six real mountain assets remain individually inspectable while terrain is revealed coherently',engine.manifest.layers.filter(l=>l.kind==='mountain').length===6&&engine.manifest.layers.filter(l=>l.kind==='mountain').every(l=>l.alpha)&&!String(engine.render).includes('drawOpeningCurtain'));
  let shorelineGap=0;
  for(let t=.25;t<=5.7;t+=.05){draws=[];opening.renderFrame(t);const river=draws.find(d=>d.id==='river-valley');if(!river)continue;
    for(const id of ['mountains-mid-left','mountains-mid-right','mountains-near-left','mountains-near-right']){const d=draws.find(d=>d.id===id);if(d)shorelineGap=Math.max(shorelineGap,Math.abs(d.matrix.e-river.matrix.e),Math.abs(d.matrix.f-river.matrix.f));}}
  check('All riverbanks stay registered with the river from the very first revealed frame',shorelineGap<.001,{maxScreenPixels:shorelineGap});
  // Guard the visible failure: a blank paper river hole or a rectangular
  // veil boundary can exist even when all recorded transforms look correct.
  const enabledBefore=[...engine.enabled],recordDraw=ctx.drawImage;
  engine.enabled.clear();engine.manifest.layers.filter(l=>!engine.isMoving(l)).forEach(l=>engine.enabled.add(l.id));
  opening.renderFrame(2.9);const revealedPixels=pixels();let veil=null;
  ctx.drawImage=(im,...args)=>{if(!ids.has(im)){veil=im;return;}return nativeDraw(im,...args);};
  opening.renderFrame(2.9);const paintedPixels=pixels();ctx.drawImage=recordDraw;
  const samples=[[790,560],[790,680],[800,900],[700,520],[900,700],[400,600],[1200,700]].map(([x,y])=>{
    const at=(Math.round(y/987*canvas.height)*canvas.width+Math.round(x/1594*canvas.width))*4;
    let strength=0,projection=0;for(let c=0;c<3;c++){const d=paintedPixels[at+c]-skyPixels[at+c];strength+=d*d;projection+=(revealedPixels[at+c]-skyPixels[at+c])*d;}
    const visible=strength?projection/strength:0;return {x,y,strength,visible};
  }).filter(s=>s.strength>200);
  check('The river and both banks join while foreground reveals, with no blank paper islands',samples.length>=5&&samples.every(s=>s.visible>.15),{samples});
  const mistPixels=veil.getContext('2d').getImageData(0,0,veil.width,veil.height).data;let maxMistStep=0;
  for(let y=0;y<veil.height;y++)for(let x=0;x<veil.width;x++){const at=(y*veil.width+x)*4+3;if(x)maxMistStep=Math.max(maxMistStep,Math.abs(mistPixels[at]-mistPixels[at-4]));if(y)maxMistStep=Math.max(maxMistStep,Math.abs(mistPixels[at]-mistPixels[at-veil.width*4]));}
  check('The entrance mist has a continuous feathered edge with no rectangular alpha seam',maxMistStep<=3,{maxAdjacentAlphaStep:maxMistStep});
  const depthFrames=[];
  ctx.drawImage=(im,...args)=>{if(!ids.has(im))veil=im;return nativeDraw(im,...args);};
  for(const t of [1.2,2.25,3.4]){opening.renderFrame(t);const fog=veil.getContext('2d').getImageData(0,0,veil.width,veil.height).data;
    const visibility=(x,y)=>1-fog[(y*veil.width+x)*4+3]/255;
    depthFrames.push({t,far:visibility(100,100),middle:visibility(200,350),near:visibility(60,740)});
  }
  ctx.drawImage=recordDraw;
  check('Actual pixels reveal far mountains first, middle mountains next, and near mountains last',depthFrames[0].far>.55&&depthFrames[0].middle<.12&&depthFrames[0].near<.05&&depthFrames[1].middle>.45&&depthFrames[1].near<.12&&depthFrames[2].near>.2,{depthFrames});
  engine.enabled.clear();enabledBefore.forEach(id=>engine.enabled.add(id));
  opening.renderFrame(9.9667);const a=pixels();opening.renderFrame(10);const b=pixels();let delta=0;for(let i=0;i<a.length;i+=4)delta+=Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]);delta/=a.length/4*3;
  check('Entrance continues into ambient motion without a renderer or time reset',delta<2,{meanColorDelta:delta});
  check('Ambient motion continues naturally after 12 seconds',frames.find(f=>f.t===12).hash!==frames.find(f=>f.t===36).hash&&frames.find(f=>f.t===12).hash!==frames.find(f=>f.t===60).hash);
  const order=frames.find(f=>f.t===12).draws.map(d=>d.id);
  check('Valley fog is drawn over the river and behind both near mountains',order.indexOf('river-valley')<order.indexOf('cloud-14')&&order.indexOf('cloud-14')<order.indexOf('mountains-near-left')&&order.indexOf('cloud-15')<order.indexOf('mountains-near-right'));
  ctx.drawImage=nativeDraw;
  const all=[...engine.enabled];engine.enabled.clear();engine.manifest.layers.filter(l=>!engine.isMoving(l)).forEach(l=>engine.enabled.add(l.id));opening.renderFrame(12);const terrain=sha(pixels());engine.setWind(1.5);opening.renderFrame(120);
  check('All mountain and architecture pixels remain identical through ambient motion',terrain===sha(pixels()));
  engine.enabled.clear();all.forEach(id=>engine.enabled.add(id));engine.setWind(.85);
  const protectedClouds=engine.manifest.layers.filter(l=>l.kind==='cloud'&&l.occlusion?.length);check('Front clouds and bridge mist use stationary ridge occlusion with restrained motion',protectedClouds.length===9&&protectedClouds.every(l=>l.amplitude<=13*engine.manifest.width/1594));
  check('Nine leaves and ten petals are independent sprites with varied motion',engine.manifest.layers.filter(l=>l.particleType==='leaf').length===9&&engine.manifest.layers.filter(l=>l.particleType==='petal').length===10);
  engine.setOcclusion(false);opening.renderFrame(51);const unclipped=pixels();engine.setOcclusion(true);opening.renderFrame(51);const clipped=pixels();let changed=0;for(let i=0;i<clipped.length;i+=4)if(clipped[i]!==unclipped[i]||clipped[i+1]!==unclipped[i+1]||clipped[i+2]!==unclipped[i+2])changed++;
  check('Foreground ridges actually hide cloud pixels',changed>30,{changedPixels:changed});
  const source=await fs.readFile(path.join(root,'index.html'),'utf8'),before=await fs.readFile(path.join(proof,'index.html.before'),'utf8');
  const inline=s=>[...s.matchAll(/<script(?:\s[^>]*)?>[\s\S]*?<\/script>/gi)].filter(m=>!/^<script[^>]*\bsrc=/.test(m[0])).map(m=>m[0]);
  // Other work in the shared workspace can update map implementation while
  // this task runs. Compare the actual homepage handlers without overwriting
  // or rejecting unrelated changes to the map.
  const actionIds=['btnHomeStationNorth','btnHomeStationCentral','btnHomeStationSouth','btnQuickStartWelcome','btnProceedToGuide'];
  const actions=s=>actionIds.map(id=>s.match(new RegExp('<button[^>]*id="'+id+'"[^>]*>'))?.[0]);
  check('Existing homepage action handlers remain unchanged',JSON.stringify(actions(source))===JSON.stringify(actions(before))&&actions(source).every(Boolean));
  for(const script of inline(source))new vm.Script(script.replace(/^<script[^>]*>/,'').replace(/<\/script>$/,''));
  check('The current shared homepage inline script compiles',true);
  const timings=s=>[...s.matchAll(/data-home-enter="[^"]+"/g)].map(m=>m[0]);
  check('Logo, text, station and button entrance timings are unchanged',JSON.stringify(timings(source))===JSON.stringify(timings(before))&&timings(source).length>10);
  for(const file of ['homepage-opening-controller.js','homepage-music.js','homepage-content.css','homepage-opening.css'])check('Existing behavior preserved: '+file,sha(await fs.readFile(path.join(out,file)))===sha(await fs.readFile(path.join(proof,'assets__goi-viet__'+file+'.before'))));
  const originalConfig={window:{}};vm.runInNewContext(await fs.readFile(path.join(proof,'assets__goi-viet__homepage-opening-config.js.before'),'utf8'),originalConfig);
  const oldSettings={...originalConfig.window.GoiVietHomeOpeningConfig},newSettings={...low.config};delete oldSettings.duration;delete newSettings.duration;
  check('Music preferences and configuration remain unchanged except opening duration',JSON.stringify(oldSettings)===JSON.stringify(newSettings));
  check('Main homepage loads the new layered renderer and no old landscape wind shader',source.includes('homepage-layered-renderer.js')&&source.includes('homepage-layered-opening.js')&&!source.includes('src="assets/goi-viet/homepage-scene.js"')&&!source.includes('src="assets/goi-viet/homepage-opening-scene.js"'));
  const refs=[...source.matchAll(/(?:src|href|srcset)="(assets\/goi-viet\/homepage-layered[^" ]+)"/g)].map(m=>m[1].split('?')[0]);for(const file of refs)await fs.access(path.join(root,file));check('All main page layered asset references exist',refs.length>=5);
  const sheet=createCanvas(1280,3*436),g=sheet.getContext('2d');g.fillStyle='#123e32';g.fillRect(0,0,sheet.width,sheet.height);g.font='18px sans-serif';g.fillStyle='#ffefd1';
  const selected=frames.filter(f=>[0,1.45,2.3,4.2,6.7,12].includes(f.t));for(let i=0;i<selected.length;i++){const f=selected[i],x=(i%2)*640,y=Math.floor(i/2)*436;const img=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=f.bytes;});g.fillText(f.t+' s',x+12,y+25);g.drawImage(img,x,y+36,640,396);}
  await sharp(sheet.toBuffer('image/png')).jpeg({quality:90}).toFile(path.join(proof,'opening-sequence.jpg'));
  await fs.writeFile(path.join(proof,'integration-checks.json'),JSON.stringify({checks,renderer:'Production JS executed with native Canvas 2D; UI checked separately',generatedAt:new Date().toISOString()},null,2));console.log(JSON.stringify({passed:checks.length,meanHandoffDelta:delta,occlusionChangedPixels:changed}));
})().catch(async e=>{await fs.writeFile(path.join(proof,'failed-integration-checks.json'),JSON.stringify({error:e.message,checks},null,2));console.error(e);process.exitCode=1;});
