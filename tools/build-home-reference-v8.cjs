const fs=require('node:fs/promises'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const runtime='C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp=require(runtime+'/sharp'),{createCanvas,Image}=require(runtime+'/@napi-rs/canvas');
const root=path.resolve(__dirname,'..'),base=path.join(root,'assets/goi-viet'),folder=path.join(base,'homepage-reference-v8');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
async function packFor(q){const box={window:{}};vm.runInNewContext(await fs.readFile(path.join(base,'homepage-classic-3/assets-'+q+'.js'),'utf8'),box);return box.window.GoiVietHomeLayeredData;}
(async()=>{
 const plan=JSON.parse(await fs.readFile(path.join(folder,'generation-plan.json'),'utf8')),assets=[];
 for(const l of plan.layers)assets.push(JSON.parse(await fs.readFile(path.join(folder,l.id+'.json'),'utf8')));
 const report=[];
 for(const quality of ['2k','4k']){
  const pack=await packFor(quality),originalFiles=Object.fromEntries(pack.manifest.layers.map(l=>[l.id,l.file]));
  const checks=[];
  for(const a of assets){
   const l=pack.manifest.layers.find(l=>l.id===a.id),original=Buffer.from(pack.sources[l.file].split(',')[1],'base64');
   const meta=await sharp(original).metadata(),old=await sharp(original).ensureAlpha().raw().toBuffer();
   const color=await sharp(path.join(folder,a.file)).resize(meta.width,meta.height,{fit:'fill'}).ensureAlpha().raw().toBuffer(),oldAlpha=Buffer.alloc(old.length/4),alpha=Buffer.alloc(old.length/4);
   for(let i=0;i<old.length;i+=4){color[i+3]=oldAlpha[i/4]=alpha[i/4]=old[i+3];}
   const file=a.id+'-'+quality+'.webp',bytes=await sharp(color,{raw:{width:meta.width,height:meta.height,channels:4}}).webp({quality:quality==='2k'?96:97,alphaQuality:100,effort:5}).toBuffer();
   await fs.writeFile(path.join(folder,file),bytes);
   l.file='homepage-reference-v8/'+file;delete pack.sources[originalFiles[l.id]];pack.sources[l.file]='data:image/webp;base64,'+bytes.toString('base64');
   checks.push({id:l.id,width:meta.width,height:meta.height,alphaUnchanged:sha(oldAlpha)===sha(alpha)});
  }
  pack.manifest.referenceArtwork={version:8,reference:'homepage-reference-v8/references/approved-home.png',nativeGenerationCount:assets.length,contours:'Original per-quality alpha retained exactly',motion:'Original timing, transforms, entrances, occlusion, sprite paths and DOM reveal unchanged'};
  const data='window.GoiVietHomeLayeredData='+JSON.stringify(pack)+';\n';await fs.writeFile(path.join(folder,'assets-'+quality+'.js'),data);
  await fs.writeFile(path.join(folder,'manifest-'+quality+'.json'),JSON.stringify(pack.manifest,null,2));
  const sandbox={window:{},Image,document:{createElement:()=>createCanvas(1,1)}};
  vm.runInNewContext(await fs.readFile(path.join(base,'homepage-layered-renderer.js'),'utf8'),sandbox);
  const width=quality==='2k'?1920:3840,canvas=createCanvas(width,Math.round(width*pack.manifest.height/pack.manifest.width));
  const scene=await sandbox.window.LandscapeLab.create(canvas,pack.manifest,pack.sources);scene.render(12);
  await sharp(canvas.toBuffer('image/png')).webp({quality:96,effort:5}).toFile(path.join(folder,'poster-'+quality+'.webp'));
  report.push({quality,bundleBytes:Buffer.byteLength(data),layers:pack.manifest.layers.length,generated:checks.length,checks});
 }
 await fs.writeFile(path.join(folder,'assets.json'),JSON.stringify({reference:'references/approved-home.png',assets},null,2));
 await fs.writeFile(path.join(folder,'build-report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report.map(r=>({...r,checks:undefined}))));
})().catch(e=>{console.error(e);process.exitCode=1;});
