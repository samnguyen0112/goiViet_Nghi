// Verify continuous bridge approaches and perceptible cloud drift after entry.
const fs=require('node:fs/promises'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const deps='C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp=require(deps+'/sharp'),{createCanvas,Image}=require(deps+'/@napi-rs/canvas');
const root=path.resolve(__dirname,'..'),lab=path.join(root,'exports/landscape-layers-lab-20261012'),proof=path.join(root,'verification/homepage-polish-20261013');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),checks=[];
const check=(name,pass,detail)=>{checks.push({name,pass,detail});if(!pass)throw Error(name+' '+JSON.stringify(detail));};
(async()=>{
  const manifest=JSON.parse(await fs.readFile(path.join(lab,'assets/manifest.json'),'utf8')),oldManifest=JSON.parse(await fs.readFile(path.join(proof,'manifest.before.json'),'utf8'));
  const bridge=manifest.layers.find(l=>l.id==='bridge'),oldBridge=oldManifest.layers.find(l=>l.id==='bridge');
  const now=await sharp(path.join(lab,bridge.png)).ensureAlpha().raw().toBuffer({resolveWithObject:true}),old=await sharp(path.join(proof,'bridge.before.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const alpha=(x,y)=>{x=Math.round(x*manifest.width/1594)-bridge.rect[0];y=Math.round(y*manifest.height/987)-bridge.rect[1];return x>=0&&y>=0&&x<now.info.width&&y<now.info.height?now.data[(y*now.info.width+x)*4+3]:0;};
  let changed=0,preserved=0;
  for(let y=0;y<old.info.height;y++)for(let x=0;x<old.info.width;x++){
    const q=(y*old.info.width+x)*4,worldX=x+oldBridge.rect[0],worldY=y+oldBridge.rect[1];if(!old.data[q+3]||worldY<552*manifest.height/987||worldX<260*manifest.width/1594||worldX>1408*manifest.width/1594)continue;
    const nx=oldBridge.rect[0]+x-bridge.rect[0],ny=oldBridge.rect[1]+y-bridge.rect[1],p=(ny*now.info.width+nx)*4;
    if(nx<0||ny<0||nx>=now.info.width||ny>=now.info.height||[0,1,2,3].some(k=>old.data[q+k]!==now.data[p+k]))changed++;else preserved++;
  }
  check('Previously repaired central masonry, arches and piers remain pixel-identical below the unified rail course and outside the junctions',changed===0&&preserved>100000,{changed,preserved});
  const tracks=[];for(let x=0;x<1594;x++){let found=false;for(let y=532;y<=543;y++)if(alpha(x,y)>200){found=true;break;}if(!found)tracks.push(x);}
  check('Railway approaches join both abutments with no open column across the deck',tracks.length===0,{missingColumns:tracks});
  check('New approaches are genuine earth/masonry alpha silhouettes with clear exterior',alpha(50,610)===0&&alpha(1500,650)===0&&alpha(80,544)>180&&alpha(1530,544)>180);
  const sandbox={window:{},Image,document:{createElement:()=>createCanvas(1,1)}};
  vm.runInNewContext(await fs.readFile(path.join(lab,'assets/bundle.js'),'utf8'),sandbox);vm.runInNewContext(await fs.readFile(path.join(lab,'scene.js'),'utf8'),sandbox);
  const canvas=createCanvas(1280,793),scene=await sandbox.window.LandscapeLab.create(canvas,manifest,sandbox.window.LandscapeAssets),ctx=canvas.getContext('2d');
  const idByImage=new Map([...scene.images].map(([id,im])=>[im,id])),nativeDraw=ctx.drawImage.bind(ctx);let draws=[];
  ctx.drawImage=(im,...args)=>{const m=ctx.getTransform();draws.push({id:idByImage.get(im),dx:m.e,dy:m.f,a:m.a,b:m.b,c:m.c,d:m.d,args});return nativeDraw(im,...args);};
  const sky=manifest.layers.filter(l=>l.cloudType==='sky'),windows=[];
  for(let t=12;t<=120;t+=8){const points=new Map(sky.map(l=>[l.id,[]]));for(let dt=0;dt<=8;dt+=2){draws=[];scene.render(t+dt);for(const l of sky){const draw=draws.find(d=>d.id===l.id);points.get(l.id).push(draw.dx);}}
    const shifts=[...points].map(([id,x])=>({id,pixels:Math.max(...x)-Math.min(...x)}));windows.push({start:t,bestShift:Math.max(...shifts.map(s=>s.pixels))});
  }
  check('At least one sky cloud visibly travels over ten screen pixels in every eight-second ambient window',windows.every(w=>w.bestShift>10),windows);
  draws=[];scene.render(12);const first=draws.filter(d=>d.id?.startsWith('cloud-'));draws=[];scene.render(20);const second=draws.filter(d=>d.id?.startsWith('cloud-'));
  check('Clouds translate without rotation, vertical movement or scaling',first.every(d=>{const n=second.find(x=>x.id===d.id);return ['a','b','c','d','dy'].every(k=>d[k]===n[k])&&JSON.stringify(d.args)===JSON.stringify(n.args);}));
  ctx.drawImage=nativeDraw;const all=[...scene.enabled];scene.enabled.clear();manifest.layers.filter(l=>!scene.isMoving(l)).forEach(l=>scene.enabled.add(l.id));
  scene.render(12);const staticFrame=sha(canvas.toBuffer('image/png'));scene.setWind(1.5);scene.render(99);
  check('Mountain outlines, bridge approaches, train and buildings remain fixed',staticFrame===sha(canvas.toBuffer('image/png')));
  scene.enabled.clear();all.forEach(id=>scene.enabled.add(id));scene.setWind(.85);
  for(const t of [12,20,36,51]){scene.render(t,{introDuration:12});await fs.writeFile(path.join(proof,'scene-'+t+'.png'),canvas.toBuffer('image/png'));}
  scene.render(20);const frame=canvas.toBuffer('image/png');
  for(const [side,crop]of [['left',{left:0,top:390,width:270,height:175}],['right',{left:1030,top:390,width:250,height:175}]])await sharp(frame).extract(crop).png().toFile(path.join(proof,'bridge-'+side+'.png'));
  check('Polish stylesheet is scoped to the homepage and preserves reduced motion',String(await fs.readFile(path.join(root,'assets/goi-viet/homepage-polish.css'),'utf8')).includes('prefers-reduced-motion')&&String(await fs.readFile(path.join(root,'index.html'),'utf8')).includes('homepage-polish.css'));
  await fs.writeFile(path.join(proof,'upgrade-checks.json'),JSON.stringify({checks,windows,generatedAt:new Date().toISOString()},null,2));
  console.log(JSON.stringify({passed:checks.length,minimumEightSecondSkyTravel:Math.min(...windows.map(w=>w.bestShift)),preservedBridgePixels:preserved}));
})().catch(async e=>{await fs.writeFile(path.join(proof,'failed-upgrade-checks.json'),JSON.stringify({error:e.message,checks},null,2));console.error(e);process.exitCode=1;});
