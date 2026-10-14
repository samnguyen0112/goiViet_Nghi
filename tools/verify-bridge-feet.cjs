// Inspect actual alpha assets and exercise the scene renderer, without UI automation.
const fs=require('node:fs/promises'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const deps='C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp=require(deps+'/sharp'),{createCanvas,Image}=require(deps+'/@napi-rs/canvas');
const root=path.resolve(__dirname,'..'),lab=path.join(root,'exports/landscape-layers-lab-20261012'),proof=path.join(root,'verification/bridge-feet-fix-20261013'),before=process.argv.includes('--before');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),checks=[];
const check=(name,pass,details)=>{checks.push({name,pass,details});if(!pass)throw Error(name+' '+JSON.stringify(details));};
(async()=>{
  await fs.mkdir(proof,{recursive:true});const manifest=JSON.parse(await fs.readFile(path.join(lab,'assets/manifest.json'),'utf8')),bridge=manifest.layers.find(l=>l.id==='bridge');
  if(before){for(const file of ['assets/bridge.png','assets/bridge.webp','assets/manifest.json','scene.js','tools/build-assets.cjs','tools/cloud-depth.cjs'])await fs.copyFile(path.join(lab,file),path.join(proof,file.replaceAll('/','__')+'.before'));}
  const sandbox={window:{},Image,document:{createElement:()=>createCanvas(1,1)}};
  vm.runInNewContext(await fs.readFile(path.join(lab,'assets/bundle.js'),'utf8'),sandbox);vm.runInNewContext(await fs.readFile(path.join(lab,'scene.js'),'utf8'),sandbox);
  const canvas=createCanvas(1920,1189),scene=await sandbox.window.LandscapeLab.create(canvas,manifest,sandbox.window.LandscapeAssets);
  const crop={left:Math.round(200*3840/1594/2),top:Math.round(515*2378/987/2),width:Math.round(1260*3840/1594/2),height:Math.round(190*2378/987/2)};
  async function save(name,t){scene.render(t);await sharp(canvas.toBuffer('image/png')).extract(crop).png().toFile(path.join(proof,name+'.png'));}
  await save(before?'bridge-before':'bridge-after',12);
  if(before){console.log(JSON.stringify({saved:'bridge-before.png',bridgeRect:bridge.rect}));return;}
  const decoded=await sharp(path.join(lab,bridge.png)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const sample=(x,y)=>{const px=Math.round(x*3840/1594)-bridge.rect[0],py=Math.round(y*2378/987)-bridge.rect[1];return px>=0&&py>=0&&px<decoded.info.width&&py<decoded.info.height?decoded.data[(py*decoded.info.width+px)*4+3]:0;};
  const centralPiers=[348,466,586,704,801,894,1011,1127,1246,1362],feet=centralPiers.map(x=>({x,alphas:[605,615,625,635].map(y=>sample(x,y))}));
  check('Every principal pier continues below the previous source-cloud cut',feet.every(f=>f.alphas.every(a=>a>=220)),feet);
  const holes=[290,408,526,646,753,846,951,1071,1186,1307,1404].map(x=>({x,alpha:sample(x,605)}));
  check('Arch interiors retain true transparency below the masonry crowns',holes.every(h=>h.alpha===0),holes);
  const oldManifest=JSON.parse(await fs.readFile(path.join(proof,'assets__manifest.json.before'),'utf8')),oldBridge=oldManifest.layers.find(l=>l.id==='bridge'),old=await sharp(path.join(proof,'assets__bridge.png.before')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let preserved=0,changed=0;
  for(let y=0;y<old.info.height;y++)for(let x=0;x<old.info.width;x++){
    const worldX=x+oldBridge.rect[0],worldY=y+oldBridge.rect[1],i=(y*old.info.width+x)*4;if(worldY<552*2378/987||worldY>575*2378/987||worldX<260*3840/1594||worldX>1408*3840/1594||!old.data[i+3])continue;
    const nx=worldX-bridge.rect[0],ny=worldY-bridge.rect[1],j=(ny*decoded.info.width+nx)*4;
    if(nx<0||ny<0||nx>=decoded.info.width||ny>=decoded.info.height||[0,1,2,3].some(k=>old.data[i+k]!==decoded.data[j+k]))changed++;else preserved++;
  }
  check('The central masonry stays pixel-identical below the unified rail course and outside the two junction repairs',preserved>10000&&changed===0,{preservedPixels:preserved,changedPixels:changed});
  check('River mist is behind the bridge while foreground hills occlude pier feet',manifest.layers.filter(l=>['cloud-08','cloud-09','cloud-14','cloud-15'].includes(l.id)).every(l=>l.z<bridge.z)&&bridge.occlusion?.includes('bridge-foreground'));
  const all=[...scene.enabled];scene.enabled.clear();manifest.layers.filter(l=>!scene.isMoving(l)).forEach(l=>scene.enabled.add(l.id));scene.render(12);const first=sha(canvas.toBuffer('image/png'));scene.setWind(1.5);scene.render(71);
  check('Repaired bridge and all fixed terrain remain stationary with time and wind',first===sha(canvas.toBuffer('image/png')));
  const g=canvas.getContext('2d'),pixel=(x,y)=>Array.from(g.getImageData(Math.round(x*3840/1594/2),Math.round(y*2378/987/2),1,1).data);
  const anchors=[586,704,801,894].map(x=>({x,color:pixel(x,622)}));scene.enabled.clear();all.forEach(id=>scene.enabled.add(id));
  for(const t of [12,27,51,83]){scene.render(t);check('Moving clouds preserve exposed pier stone at t='+t,anchors.every(a=>pixel(a.x,622).every((v,i)=>Math.abs(v-a.color[i])<=2)),anchors);}
  await save('bridge-after-time-51',51);
  scene.enabled.clear();scene.enabled.add('bridge');scene.setChecker(true);await save('bridge-alpha-complete',12);
  await fs.writeFile(path.join(proof,'bridge-checks.json'),JSON.stringify({checks,generatedAt:new Date().toISOString(),renderer:'Actual scene.js executed with native Canvas 2D'},null,2));console.log(JSON.stringify({passed:checks.length,feet}));
})().catch(async e=>{await fs.writeFile(path.join(proof,'bridge-checks-failed.json'),JSON.stringify({error:e.message,checks},null,2));console.error(e);process.exitCode=1;});
