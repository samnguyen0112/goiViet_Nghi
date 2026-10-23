// Retain native generations; register RGB against the original object alpha.
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const sharp=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),base=path.join(root,'assets/goi-viet/homepage-reference-v8'),proof=path.join(root,'verification/home-reference-v8');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const {id,from,prompt}=JSON.parse(Buffer.from(process.argv[2],'base64').toString('utf8'));
 const plan=JSON.parse(await fs.readFile(path.join(base,'generation-plan.json'),'utf8')),item=plan.layers.find(l=>l.id===id);
 if(!item)throw Error('Unknown layer '+id);
 const source=await fs.readFile(from),metadata=await sharp(source).metadata(),original=await sharp(path.join(root,item.file)).ensureAlpha().raw().toBuffer();
 const crop=id==='bridge'?{left:0,top:278,width:metadata.width,height:166}:null;
 let input=sharp(source);if(crop)input=input.extract(crop);
 const generated=await input.resize(item.width,item.height,{fit:'fill'}).ensureAlpha().raw().toBuffer();
 // Old cutouts include opaque paper around misty slopes. Register that paper
 // to the SAME generated sky so separate generations cannot expose rectangles.
 const terrain=id.startsWith('mountains-')||id==='river-valley';
 const sky=terrain?await sharp(path.join(base,'sky.webp')).ensureAlpha().raw().toBuffer():null;
 const registered=Buffer.alloc(original.length),alpha=Buffer.alloc(original.length/4);
 for(let i=0;i<original.length;i+=4){
  const weight=generated[i+3]/255;
  for(let c=0;c<3;c++)registered[i+c]=Math.round(generated[i+c]*weight+original[i+c]*(1-weight));
  if(sky){
   const r=original[i],g=original[i+1],b=original[i+2];
   let paper=Math.max(0,Math.min(1,(r-210)/25,(g-200)/25,(b-160)/25,(r-g+6)/14));paper=paper*paper*(3-2*paper);
   const pixel=i/4,x=pixel%item.width,y=Math.floor(pixel/item.width),k=((y+item.rect[1])*3840+x+item.rect[0])*4;
   for(let c=0;c<3;c++)registered[i+c]=Math.round(registered[i+c]*(1-paper)+sky[k+c]*paper);
  }
  registered[i+3]=alpha[i/4]=original[i+3];
 }
 const retained='sources/'+id+'.png',file=id+'.webp';
 await fs.writeFile(path.join(base,retained),source);
 await sharp(registered,{raw:{width:item.width,height:item.height,channels:4}}).webp({lossless:true,effort:5}).toFile(path.join(base,file));
 const result={id,file,source:retained,generatedFrom:from,nativeWidth:metadata.width,nativeHeight:metadata.height,width:item.width,height:item.height,originalRect:item.rect,alphaSHA256:sha(alpha),sourceSHA256:sha(source),prompt,tool:'built-in image_gen',registration:'Generated colors registered to original canvas. Original alpha retained byte-for-byte; uncovered generated pixels fall back to original paint.'};
 result.registration='Generated colors registered to original canvas; original alpha retained byte-for-byte. Opaque paper around terrain mist is aligned to the generated sky to avoid seams.';
 if(crop)result.generatedCrop=crop;
 await fs.writeFile(path.join(base,id+'.json'),JSON.stringify(result,null,2));
 console.log(JSON.stringify({id,native:[metadata.width,metadata.height],registered:[item.width,item.height],alphaSHA256:result.alphaSHA256}));
})().catch(e=>{console.error(e);process.exitCode=1;});
