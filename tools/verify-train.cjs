// Regression checks for the missing vertical slices reported in the train.
const fs=require('node:fs/promises'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const deps='C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp=require(deps+'/sharp'),{createCanvas,Image}=require(deps+'/@napi-rs/canvas');
const root=path.resolve(__dirname,'..'),lab=path.join(root,'exports/landscape-layers-lab-20261012'),proof=path.join(root,'verification/train-fix-20261013');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),checks=[];
const check=(name,pass,detail)=>{checks.push({name,pass,detail});if(!pass)throw Error(name+' '+JSON.stringify(detail));};
(async()=>{
  const manifest=JSON.parse(await fs.readFile(path.join(lab,'assets/manifest.json'),'utf8')),train=manifest.layers.find(l=>l.id==='train');
  const png=await sharp(path.join(lab,train.png)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const webp=await sharp(path.join(lab,train.file)).ensureAlpha().raw().toBuffer();
  let visibleDifferences=0;for(let q=0;q<png.data.length;q+=4){
    if(png.data[q+3]!==webp[q+3]||png.data[q+3]&&[0,1,2].some(k=>png.data[q+k]!==webp[q+k]))visibleDifferences++;
  }
  check('PNG and WebP preserve identical alpha and every visible train pixel',visibleDifferences===0,{visibleDifferences});
  const a=(x,y)=>png.data[((y-train.rect[1])*png.info.width+x-train.rect[0])*4+3];
  const spans=[[1275,1535],[1575,1898],[1932,2257],[2290,2615]],bodies=[];
  for(const [left,right]of spans){let holes=0;for(let y=1218;y<=1250;y++)for(let x=left;x<=right;x++)if(a(x,y)<245)holes++;bodies.push({left,right,holes});}
  check('All four bodies are opaque across their complete width, including the formerly cut red and green fronts',bodies.every(b=>b.holes===0),bodies);
  const gaps=[1555,1914,2273].map(x=>({x,bodyGap:a(x,1220),coupler:a(x,1255)}));
  check('Only the real gaps between vehicles are transparent; the couplers connect them',gaps.every(g=>g.bodyGap===0&&g.coupler>240),gaps);
  const wheelCenters=[1315,1387,1481,1635,1837,1992,2197,2350,2552],ends=[];
  for(const x of wheelCenters){let bottom=0;for(let y=1270;y<1298;y++)if(a(x,y)>180)bottom=y;ends.push(bottom);}
  check('All nine wheels meet a single rail baseline',Math.max(...ends)-Math.min(...ends)<=2&&ends.every(y=>y>=1291&&y<=1294),ends);
  check('No mountain or building strip survives above the passenger roofs',[1600,1800,1950,2200,2350,2550].every(x=>a(x,1170)===0));
  check('Train is a fixed layer above the bridge and below separate smoke',train.kind==='fixed'&&manifest.layers.find(l=>l.id==='bridge').z<train.z&&train.z<manifest.layers.find(l=>l.id==='smoke').z);
  const old=JSON.parse(await fs.readFile(path.join(proof,'before-hashes.json'),'utf8')),preserved=[];
  for(const l of manifest.layers.filter(l=>['sky','cloud','tree','bird','leaf','smoke'].includes(l.kind)||['hanoi','saigon'].includes(l.id)))preserved.push({id:l.id,same:sha(await fs.readFile(path.join(lab,l.png)))===old.layers[l.id]});
  check('Hanoi, Saigon and all moving asset paint are unchanged; Hue and bridge have dedicated repair checks',preserved.every(x=>x.same),{preserved:preserved.length});
  check('The original reference artwork is unchanged',sha(await fs.readFile(path.join(lab,'reference/original-4k.png')))===old.original);
  const sandbox={window:{},Image,document:{createElement:()=>createCanvas(1,1)}};
  vm.runInNewContext(await fs.readFile(path.join(lab,'assets/bundle.js'),'utf8'),sandbox);vm.runInNewContext(await fs.readFile(path.join(lab,'scene.js'),'utf8'),sandbox);
  const canvas=createCanvas(3840,2378),scene=await sandbox.window.LandscapeLab.create(canvas,manifest,sandbox.window.LandscapeAssets);
  const crop={left:1215,top:1120,width:1450,height:260};
  scene.render(12);await sharp(canvas.toBuffer('image/png')).extract(crop).png().toFile(path.join(proof,'train-after.png'));
  scene.enabled.clear();scene.enabled.add('train');scene.setChecker(true);scene.render(12);await sharp(canvas.toBuffer('image/png')).extract(crop).png().toFile(path.join(proof,'train-alpha.png'));
  const first=sha(canvas.toBuffer('image/png'));scene.setWind(1.5);scene.render(87);
  check('Train geometry and paint remain identical during time and wind changes',first===sha(canvas.toBuffer('image/png')));
  const sheet=createCanvas(1450,580),g=sheet.getContext('2d');g.fillStyle='#f7ebd0';g.fillRect(0,0,sheet.width,sheet.height);g.fillStyle='#493d29';g.font='20px sans-serif';
  for(const [i,file]of ['train-before.png','train-after.png'].entries()){
    const im=new Image();im.src=await fs.readFile(path.join(proof,file));g.fillText(i?'SAU: thân toa liền mạch, viền và bánh xe rõ hơn':'TRƯỚC: vệt cắt xuyên thân toa',20,i*280+28);g.drawImage(im,20,i*280+45);
  }
  await fs.writeFile(path.join(proof,'train-before-after.png'),sheet.toBuffer('image/png'));
  await fs.writeFile(path.join(proof,'train-checks.json'),JSON.stringify({checks,registration:manifest.trainRegistration,generatedAt:new Date().toISOString()},null,2));
  console.log(JSON.stringify({passed:checks.length,registration:manifest.trainRegistration}));
})().catch(async e=>{await fs.writeFile(path.join(proof,'train-checks-failed.json'),JSON.stringify({error:e.message,checks},null,2));console.error(e);process.exitCode=1;});
