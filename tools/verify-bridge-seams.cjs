// Regression checks for the visible vertical slits and stepped rail junctions.
const fs=require('node:fs/promises'),path=require('node:path'),vm=require('node:vm');
const deps='C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp=require(deps+'/sharp'),{createCanvas,Image,GlobalFonts}=require(deps+'/@napi-rs/canvas');
GlobalFonts.registerFromPath('C:/Windows/Fonts/arial.ttf','BridgeProof');
const root=path.resolve(__dirname,'..'),lab=path.join(root,'exports/landscape-layers-lab-20261012'),proof=path.join(root,'verification/bridge-seam-fix-20261013'),checks=[];
const check=(name,pass,details)=>{checks.push({name,pass,details});if(!pass)throw Error(name+' '+JSON.stringify(details));};
(async()=>{
  const manifest=JSON.parse(await fs.readFile(path.join(lab,'assets/manifest.json'),'utf8')),oldManifest=JSON.parse(await fs.readFile(path.join(proof,'manifest-before.json'),'utf8'));
  const layer=manifest.layers.find(l=>l.id==='bridge'),oldLayer=oldManifest.layers.find(l=>l.id==='bridge');
  const current=await sharp(path.join(lab,layer.png)).ensureAlpha().raw().toBuffer({resolveWithObject:true}),old=await sharp(path.join(proof,'bridge-before.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const pixel=(asset,l,x,y)=>{const ix=Math.round(x*3840/1594)-l.rect[0],iy=Math.round(y*2378/987)-l.rect[1],p=(iy*asset.info.width+ix)*4;return ix<0||iy<0||ix>=asset.info.width||iy>=asset.info.height?[0,0,0,0]:Array.from(asset.data.subarray(p,p+4));};
  const slit={before:0,after:0};for(let x=213;x<=219;x+=.5)for(let y=548;y<=602;y+=.5){if(pixel(old,oldLayer,x,y)[3]<180)slit.before++;if(pixel(current,layer,x,y)[3]<180)slit.after++;}
  check('The original vertical slit is closed through the complete masonry body',slit.before>0&&slit.after===0,slit);
  for(const [side,xs]of [['left',[207,211,215,219,223,227,231]],['right',[1425,1430,1435,1440,1445,1450,1455]]]){
    const levels=xs.map(x=>{let level=null,min=Infinity;for(let py=1277;py<=1286;py++){const y=py*987/2378,[r,g,b,a]=pixel(current,layer,x,y);if(a<220)continue;const value=(r+g+b)/3;if(value<min){min=value;level=py;}}return {x,level};});
    check('Rail height stays continuous through the '+side+' junction',levels.every(l=>l.level!==null)&&Math.max(...levels.map(l=>l.level))-Math.min(...levels.map(l=>l.level))<=4,levels);
  }
  check('Both repairs are recorded as fixed bridge sprite changes',manifest.bridgeSeamRepairs?.length===2&&layer.kind==='fixed');
  let changed=0,preserved=0;for(let y=0;y<old.info.height;y++)for(let x=0;x<old.info.width;x++){
    const wx=x+oldLayer.rect[0],wy=y+oldLayer.rect[1],q=(y*old.info.width+x)*4;if(wy<552*2378/987||wx<260*3840/1594||wx>1408*3840/1594||!old.data[q+3])continue;
    const nx=wx-layer.rect[0],ny=wy-layer.rect[1],p=(ny*current.info.width+nx)*4;
    if([0,1,2,3].some(k=>old.data[q+k]!==current.data[p+k]))changed++;else preserved++;
  }
  check('The central arch bodies and principal piers remain pixel-identical below the unified rail course',changed===0&&preserved>100000,{changed,preserved});
  check('The bridge repairs preserve the reviewed ambient cloud assets and motion settings',JSON.stringify(manifest.layers.filter(l=>l.kind==='cloud'))===JSON.stringify(oldManifest.layers.filter(l=>l.kind==='cloud')));
  const sandbox={window:{},Image,document:{createElement:()=>createCanvas(1,1)}};vm.runInNewContext(await fs.readFile(path.join(lab,'assets/bundle.js'),'utf8'),sandbox);vm.runInNewContext(await fs.readFile(path.join(lab,'scene.js'),'utf8'),sandbox);
  const canvas=createCanvas(3840,2378),scene=await sandbox.window.LandscapeLab.create(canvas,manifest,sandbox.window.LandscapeAssets);scene.render(20);
  const frame=canvas.toBuffer('image/png');
  const crops=[['left',140,510,150,140],['right',1380,510,150,140]];
  for(const [side,x,y,w,h]of crops)await sharp(frame).extract({left:Math.round(x*3840/1594),top:Math.round(y*2378/987),width:Math.round(w*3840/1594),height:Math.round(h*2378/987)}).png().toFile(path.join(proof,'after-'+side+'.png'));
  await sharp(frame).resize(1594).png().toFile(path.join(proof,'after-full.png'));
  const sheet=createCanvas(746,380),g=sheet.getContext('2d');g.fillStyle='#f4ebd2';g.fillRect(0,0,sheet.width,sheet.height);g.fillStyle='#354535';g.font='18px BridgeProof';
  for(const [i,side]of ['left','right'].entries()){const bytes=await fs.readFile(path.join(proof,'after-'+side+'.png'));const im=await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=bytes;});g.fillText(i?'ĐẦU CẦU PHẢI':'ĐẦU CẦU TRÁI',i*373+12,26);g.drawImage(im,i*373+6,38,361,337);}
  await fs.writeFile(path.join(proof,'bridge-junctions-after.png'),sheet.toBuffer('image/png'));
  await fs.writeFile(path.join(proof,'seam-checks.json'),JSON.stringify({checks,generatedAt:new Date().toISOString()},null,2));console.log(JSON.stringify({passed:checks.length,slit}));
})().catch(async e=>{await fs.writeFile(path.join(proof,'failed-seam-checks.json'),JSON.stringify({error:e.message,checks},null,2));console.error(e);process.exitCode=1;});
