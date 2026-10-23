const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),vm=require('node:vm');
const sharp=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'assets/goi-viet/memory-reference-v2'),out=path.join(root,'verification/memory-reference-v2');
(async()=>{
 const data=JSON.parse(await fs.readFile(path.join(dir,'layers.json'),'utf8')),html=await fs.readFile(path.join(root,'map-surroundings-preview-3.html'),'utf8');
 const chapter=html.slice(html.indexOf('<section id="memoryChapter"'),html.indexOf('<div id="memoryMapTransition"'));
 const ids=[...chapter.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);
 assert.equal([...chapter.matchAll(/data-ref-layer=/g)].length,data.layers.length,'HTML and asset manifest differ');
 assert(!chapter.includes('memory-chapter-3/'),'Old independently generated assets remain');assert(!chapter.includes('official-reference.png'),'Full reference is rendered as a poster');
 for(const id of ['river-upper','river-middle','river-lower','exit-vietnam-in-mist','exit-stone-bridge',...(data.version>=3?['exit-train-restored']:['exit-railway-route','exit-train-engine']),'exit-boat-far','exit-boat-middle','exit-boat-near'])assert(data.layers.some(l=>l.id===id),id+' missing');
 const original=await sharp(path.join(dir,'sources/official-reference.png')).removeAlpha().raw().toBuffer(),objects=[];
 for(const l of data.layers){
  const metadata=await sharp(path.join(dir,l.file)).metadata();assert.equal(metadata.width,l.pixelWidth||l.rect[2]);assert.equal(metadata.height,l.pixelHeight||l.rect[3]);
  const {data:rgba,info}=await sharp(path.join(dir,l.file)).resize(l.rect[2],l.rect[3],{fit:'fill'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  if(l.origin!=='official-reference')continue;
  let count=0,error=0;for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){const i=(y*info.width+x)*4;if(rgba[i+3]<248)continue;const j=((y+l.rect[1])*data.width+x+l.rect[0])*3;for(let c=0;c<3;c++)error+=Math.abs(rgba[i+c]-original[j+c]);count++;}
  assert(count>0,l.id+' has no opaque source pixels');const averageError=error/count/3;assert(averageError<12,l.id+' is not a registered source extraction: '+averageError);objects.push({id:l.id,rect:l.rect,opaquePixels:count,meanAbsoluteRGBError:+averageError.toFixed(3)});
 }
 for(const file of [...chapter.matchAll(/\bsrc="(assets\/[^"?#]+)/g)].map(m=>m[1]))await fs.access(path.join(root,file));
 const sourceFiles=['map-surroundings-preview-3.html','assets/goi-viet/map-surroundings-preview/memory-reference-v2.css','assets/goi-viet/map-surroundings-preview/memory-reference-v2.js','assets/goi-viet/map-surroundings-preview/home-invitation-3.css','assets/goi-viet/map-surroundings-preview/home-invitation-3.js'];const sources=[];
 for(const file of sourceFiles){const content=await fs.readFile(path.join(root,file));if(file.endsWith('.js'))new vm.Script(content.toString());sources.push({file,sha256:crypto.createHash('sha256').update(content).digest('hex')});}
 const report={nativeReference:[data.width,data.height],referenceSHA256:data.referenceSHA256,separateLayers:data.layers.length,originalObjects:objects.length,sourceObjectVerification:objects,bytes:data.layers.reduce((n,l)=>n+l.bytes,0),sources};
 await fs.writeFile(path.join(out,data.version>=3?'source-review-v3.json':'source-review.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({layers:report.separateLayers,objects:objects.length,maximumMeanRGBError:Math.max(...objects.map(o=>o.meanAbsoluteRGBError)),bytes:report.bytes}));
})().catch(e=>{console.error(e);process.exitCode=1;});
