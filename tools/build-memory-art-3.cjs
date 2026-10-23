// Decode generated, transparent artwork and export display-size variants.
// Composition and silhouettes come from ImageGen; this only encodes/resizes.
const fs=require('node:fs/promises'),path=require('node:path');
const sharp=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'../assets/goi-viet/memory-chapter-3');
(async()=>{
 const manifest={generatedWith:'built-in image_gen',reference:'references/approved-concept.png',assets:[],reused:'See README.md for original homepage layers'};
 for(const name of ['taste','story','tradition','tea']){
  const source=path.join(root,'sources',name+'.png');
  try{const b64=await fs.readFile(path.join(root,'sources',name+'.b64'),'utf8');await fs.writeFile(source,Buffer.from(b64.trim(),'base64'));await fs.unlink(path.join(root,'sources',name+'.b64'));}catch(e){if(e.code!=='ENOENT')throw e;}
  const meta=await sharp(source).metadata(),stats=await sharp(source).stats();
  if(!meta.hasAlpha||stats.channels[3].min!==0)throw new Error(name+' needs transparent background');
  for(const [suffix,width] of [['',1100],['-small',600]]){
   const file=name+suffix+'.webp';await sharp(source).resize({width,withoutEnlargement:true}).webp({quality:86,alphaQuality:95,effort:6}).toFile(path.join(root,file));
   const stat=await fs.stat(path.join(root,file));const output=await sharp(path.join(root,file)).metadata();
   manifest.assets.push({file,source:'sources/'+name+'.png',width:output.width,height:output.height,bytes:stat.size,hasAlpha:output.hasAlpha});
  }
 }
 const water=path.join(root,'sources/water.png');
 try{await fs.access(water);await sharp(water).resize(600).webp({quality:85}).toFile(path.join(root,'water.webp'));manifest.assets.push({file:'water.webp',source:'sources/water.png',width:600,height:600,bytes:(await fs.stat(path.join(root,'water.webp'))).size,hasAlpha:false});}catch(e){if(e.code!=='ENOENT')throw e;}
 await fs.mkdir(path.join(root,'references'),{recursive:true});
 await fs.access(path.join(root,'references/approved-concept.png'));
 await fs.writeFile(path.join(root,'manifest.json'),JSON.stringify(manifest,null,2));
 console.log(JSON.stringify(manifest.assets));
})().catch(e=>{console.error(e);process.exitCode=1;});
