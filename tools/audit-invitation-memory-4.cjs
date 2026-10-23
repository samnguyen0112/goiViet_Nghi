const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const sharp=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'assets/goi-viet/invitation-memory-4');
(async()=>{
 const manifest=JSON.parse(await fs.readFile(path.join(dir,'layers.json'),'utf8'));
 const report={source:[manifest.width,manifest.height],runtimeLayers:manifest.layers.length,assets:[],lettering:[]};
 for(const layer of manifest.layers){
  const file=path.join(dir,layer.file),bytes=(await fs.stat(file)).size;
  if(layer.file.endsWith('.svg'))assert(!/<image|base64|https?:/.test((await fs.readFile(file,'utf8')).replace('http://www.w3.org/2000/svg','')),'Vector ornament contains raster/remote content');
  report.assets.push({file:layer.file,bytes});
 }
 for(const [name,box,color]of [['title-first',[96,155,812,149],'green'],['title-memory',[125,284,718,171],'red']]){
  const [left,top,width,height]=box;
  const source=await sharp(path.join(dir,'sources/approved.png')).extract({left,top,width,height}).removeAlpha().raw().toBuffer();
  const svg=await sharp(path.join(dir,name+'.svg')).resize(width,height).ensureAlpha().raw().toBuffer();
  let intersection=0,union=0,expectedPixels=0;
  for(let p=0;p<width*height;p++){
   const r=source[p*3],g=source[p*3+1],b=source[p*3+2];
   const expected=color==='green'?g>r*1.22&&g<155&&r<120&&b<155:r>g*1.42&&r>b*1.35&&g<135;
   const actual=svg[p*4+3]>=128;
   if(expected)expectedPixels++;if(expected&&actual)intersection++;if(expected||actual)union++;
  }
  const inkIntersectionOverUnion=intersection/union;
  assert(inkIntersectionOverUnion>.94,name+': vector trace drifts from approved ink');
  report.lettering.push({name,inkIntersectionOverUnion,expectedPixels});
 }
 report.totalRuntimeBytes=report.assets.reduce((n,a)=>n+a.bytes,0);
 await fs.writeFile(path.join(root,'verification/invitation-memory-4/asset-audit.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1;});
