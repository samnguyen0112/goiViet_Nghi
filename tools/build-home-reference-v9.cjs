// Reproducible P1: original v8 layers -> supplied per-depth grading -> versioned v9 bundles.
const fs=require('node:fs/promises'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const runtime=path.join(require('node:os').homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const sharp=require(runtime+'/sharp'),{createCanvas,Image}=require(runtime+'/@napi-rs/canvas');
const root=path.resolve(__dirname,'..'),base=path.join(root,'assets/goi-viet'),folder=path.join(base,'homepage-reference-v9'),work=path.join(root,'verification/t2-p1-upgrade');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const affected=id=>/^(mountains-|tree-|leaf-|cloud-)/.test(id)||['river-valley','hanoi','hue','saigon'].includes(id);
const load=async q=>{const box={window:{}};vm.runInNewContext(await fs.readFile(path.join(base,'homepage-reference-v8/assets-'+q+'.js'),'utf8'),box);return box.window.GoiVietHomeLayeredData;};
async function render(pack,q){
 const sandbox={window:{},Image,performance,matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}}),document:{createElement:()=>createCanvas(1,1),addEventListener(){},hidden:false,body:{dataset:{}}}};
 vm.runInNewContext(await fs.readFile(path.join(base,'homepage-layered-renderer.js'),'utf8'),sandbox);
 const w=q==='2k'?1920:3840,c=createCanvas(w,Math.round(w*pack.manifest.height/pack.manifest.width));c.dataset={};
 const engine=await sandbox.window.LandscapeLab.create(c,pack.manifest,pack.sources);engine.render(12);
 const png=c.toBuffer('image/png');await fs.writeFile(path.join(work,'v9-'+q+'-t12.png'),png);
 await sharp(png).webp({quality:96,effort:5}).toFile(path.join(folder,'poster-'+q+'.webp'));
}
(async()=>{
 await fs.mkdir(folder,{recursive:true});await fs.mkdir(work,{recursive:true});const report=process.argv.includes('--2k-only')?JSON.parse(await fs.readFile(path.join(folder,'build-report.json'),'utf8')).filter(r=>r.quality==='4k'):[];
 for(const q of (process.argv.includes('--2k-only')?['2k']:['2k','4k'])){
  const pack=await load(q),beforeBytes=(await fs.stat(path.join(base,'homepage-reference-v8/assets-'+q+'.js'))).size;
  const geometry=JSON.stringify(pack.manifest.layers.map(({file,...layer})=>layer));
  const dir=path.join(work,q);await fs.mkdir(dir,{recursive:true});const jobs=[];
  for(const l of pack.manifest.layers)if(affected(l.id)){
   const input=path.join(dir,l.id+'.png'),output=path.join(dir,l.id+'.rgba');
   await sharp(Buffer.from(pack.sources[l.file].split(',')[1],'base64')).ensureAlpha().png().toFile(input);jobs.push({id:l.id,input,output});
  }
  const jobsPath=path.join(dir,'jobs.json');await fs.writeFile(jobsPath,JSON.stringify(jobs));
  execFileSync(process.env.PYTHON||'python',['-I',path.join(__dirname,'grade-home-reference-p1.py'),jobsPath,...(process.argv.includes('--reuse-grade')?['--encode-only']:[])],{maxBuffer:1024*1024});
  const sources={},checks=[];
  for(const l of pack.manifest.layers){
   const oldFile=l.file,original=Buffer.from(pack.sources[oldFile].split(',')[1],'base64');let bytes=original;
   const decoded=await sharp(original).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   if(affected(l.id)){
    const raw=await fs.readFile(path.join(dir,l.id+'.rgba'));
    for(let i=0;i<raw.length;i+=4)if(raw[i+3]!==decoded.data[i+3])throw Error('Raw alpha changed: '+l.id);
    const quantized=await fs.readFile(path.join(dir,l.id+'-encoded.rgba'));
    bytes=await sharp(quantized,{raw:{width:decoded.info.width,height:decoded.info.height,channels:4}}).webp({lossless:true,effort:6}).toBuffer();
   }
   const after=await sharp(bytes).ensureAlpha().raw().toBuffer();let alphaUnchanged=true;
   for(let i=3;i<after.length;i+=4)if(after[i]!==decoded.data[i]){alphaUnchanged=false;break;}
   if(!alphaUnchanged)throw Error('Encoded alpha changed: '+l.id);
   const protectedLayer=!affected(l.id),unchanged=hash(bytes)===hash(original);
   if(protectedLayer&&!unchanged)throw Error('Protected layer changed: '+l.id);
   const name=l.id+'-'+q+'.webp';await fs.writeFile(path.join(folder,name),bytes);l.file='homepage-reference-v9/'+name;
   sources[l.file]='data:image/webp;base64,'+bytes.toString('base64');checks.push({id:l.id,graded:!protectedLayer,alphaUnchanged,protectedBytesUnchanged:protectedLayer?unchanged:null,bytes:bytes.length});
  }
  if(JSON.stringify(pack.manifest.layers.map(({file,...layer})=>layer))!==geometry)throw Error('Layer geometry or timing changed');
  pack.sources=sources;pack.manifest.referenceArtwork={...pack.manifest.referenceArtwork,version:9,palette:'P1',source:'homepage-reference-v8',method:'grade-home-reference-p1.py: supplied per-depth HSV formula; no runtime color filter',encoding:'Hue-safe RGB12 prepass + lossless WebP; alpha exact',motion:'Unchanged original transforms, timings, geometry and layer order'};
  const bundle='window.GoiVietHomeLayeredData='+JSON.stringify(pack)+';\n';
  await fs.writeFile(path.join(folder,'assets-'+q+'.js'),bundle);await fs.writeFile(path.join(folder,'manifest-'+q+'.json'),JSON.stringify(pack.manifest,null,2));await render(pack,q);
  const change=(Buffer.byteLength(bundle)/beforeBytes-1)*100;
  report.push({quality:q,encoding:'Hue-safe RGB12 prepass + lossless WebP; alpha exact',geometryAndOrderUnchanged:true,layers:checks.length,graded:checks.filter(c=>c.graded).length,originalBundleBytes:beforeBytes,bundleBytes:Buffer.byteLength(bundle),bundleChangePercent:change,checks});
  console.log(JSON.stringify({quality:q,bundleChangePercent:change,layers:checks.length}));
 }
 await fs.writeFile(path.join(folder,'build-report.json'),JSON.stringify(report,null,2));
 if(report.some(r=>Math.abs(r.bundleChangePercent)>10))throw Error('Bundle size exceeds P1 tolerance');
})().catch(e=>{console.error(e);process.exitCode=1;});
