// Preserve generated originals; web exports only trim alpha and downsample.
const fs = require('node:fs/promises'), path = require('node:path'), crypto = require('node:crypto');
const sharp = require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const base = path.resolve(__dirname, '../assets/goi-viet/memory-rail-v6');
(async () => {
 const {id,from,prompt} = JSON.parse(Buffer.from(process.argv[2], 'base64').toString('utf8'));
 if (!/^[a-z0-9-]+$/.test(id)) throw Error('Invalid id');
 const bytes = await fs.readFile(from), source = await sharp(bytes).metadata();
 await fs.mkdir(path.join(base,'sources'),{recursive:true});
 await fs.writeFile(path.join(base,'sources',id+'.png'),bytes);
 const {data:image,info:trimInfo} = id==='viaduct-station-final'?{data:bytes,info:{}}:await sharp(bytes).trim({threshold:6}).png().toBuffer({resolveWithObject:true}), meta = await sharp(image).metadata();
 await sharp(image).webp({lossless:true,effort:5}).toFile(path.join(base,id+'.webp'));
 const variants=[];
 for(const width of [640,1280]) if(width<meta.width){
  const file=id+'-'+width+'.webp';
  await sharp(image).resize({width,withoutEnlargement:true}).webp({quality:96,alphaQuality:100}).toFile(path.join(base,file));
  variants.push({file,width});
 }
 const asset={id,file:id+'.webp',source:'sources/'+id+'.png',width:meta.width,height:meta.height,generatedWidth:source.width,generatedHeight:source.height,trimOffset:[trimInfo.trimOffsetLeft||0,trimInfo.trimOffsetTop||0],variants,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),generator:'built-in image_gen',prompt};
 await fs.writeFile(path.join(base,id+'.json'),JSON.stringify(asset,null,2));
 console.log(JSON.stringify({id,width:meta.width,height:meta.height,alpha:meta.hasAlpha}));
})().catch(e=>{console.error(e);process.exitCode=1;});
