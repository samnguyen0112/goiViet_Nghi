const fs=require('node:fs/promises'),path=require('node:path');
const sharp=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'assets/goi-viet/memory-reference-v2');
async function isolate(input,name,stone){
 const {data,info}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true}),n=info.width*info.height;
 // Keep the connected illustration and discard floating matte specks.
 const seen=new Uint8Array(n),queue=new Int32Array(n);let largest=[];
 for(let start=0;start<n;start++){if(seen[start]||data[start*4+3]<80)continue;let head=0,tail=0;queue[tail++]=start;seen[start]=1;
  while(head<tail){const p=queue[head++],x=p%info.width,y=Math.floor(p/info.width);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx<0||xx>=info.width||yy<0||yy>=info.height)continue;const q=yy*info.width+xx;if(!seen[q]&&data[q*4+3]>=80){seen[q]=1;queue[tail++]=q;}}}
  if(tail>largest.length)largest=Array.from(queue.subarray(0,tail));
 }
 const keep=new Uint8Array(n);for(const p of largest){const x=p%info.width,y=Math.floor(p/info.width);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(x+dx>=0&&x+dx<info.width&&y+dy>=0&&y+dy<info.height)keep[p+dy*info.width+dx]=1;}}
 for(let p=0;p<n;p++){const i=p*4;if(!keep[p]||(stone&&data[i]>220&&data[i+1]<110&&data[i+2]<100&&data[i]>data[i+1]*1.7))data[i+3]=0;}
 const cleaned=await sharp(data,{raw:{width:info.width,height:info.height,channels:4}}).png().toBuffer();
 const trimmed=await sharp(cleaned).trim({threshold:20}).png().toBuffer(),meta=await sharp(trimmed).metadata();
 const file=name+'-restored-hd.webp';await sharp(trimmed).webp({lossless:true,effort:6}).toFile(path.join(dir,file));
 return {file,pixelWidth:meta.width,pixelHeight:meta.height,bytes:(await fs.stat(path.join(dir,file))).size};
}
(async()=>{
 let base;try{base=JSON.parse(await fs.readFile(path.join(dir,'layers-native-v2.json'),'utf8'));}catch{base=JSON.parse(await fs.readFile(path.join(dir,'layers.json'),'utf8'));await fs.writeFile(path.join(dir,'layers-native-v2.json'),JSON.stringify(base,null,2));}
 const m={...base,version:3,method:base.method+' Lossless 2x exports of original art; train and bridge are high-resolution reference restorations.',layers:[]};
 for(const l of base.layers){
  if(l.family==='train'||['exit-stone-bridge','exit-railway-route'].includes(l.id))continue;
  const file=l.id+'-hd.webp';await sharp(path.join(dir,l.file)).resize(l.rect[2]*2,l.rect[3]*2,{kernel:'lanczos3'}).sharpen({sigma:.55,m1:.2,m2:.5}).webp({lossless:true,effort:5}).toFile(path.join(dir,file));
  m.layers.push({...l,file,density:2,pixelWidth:l.rect[2]*2,pixelHeight:l.rect[3]*2,bytes:(await fs.stat(path.join(dir,file))).size});
 }
 const trainSource=path.join(dir,'sources/train-restored-v3.png');
 const bridgeSource=path.join(dir,'sources/bridge-restored-v3.png');
 m.layers.push({id:'exit-stone-bridge',family:'exit',kind:'object',origin:'reference-detail-restoration',contains:['bridge','railway'],rect:[151,1489,502,108],...await isolate(bridgeSource,'exit-bridge',true)});
 m.layers.push({id:'exit-train-restored',family:'train',kind:'train',origin:'reference-detail-restoration',rect:[165,1463,383,78],...await isolate(trainSource,'exit-train',false)});
 for(const [id,rect]of [['card-front',[32,52,960,1434]],['card-back',[54,45,916,1444]]]){
  const[x,y,w,h]=rect,rounded=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="55" fill="white"/></svg>`);
  const input=await sharp(path.join(dir,'sources',id+'-restored.png')).extract({left:x,top:y,width:w,height:h}).ensureAlpha().composite([{input:rounded,blend:'dest-in'}]).png().toBuffer();
  const file=id+'-hd.webp';await sharp(input).resize(960,1440,{fit:'fill'}).webp({lossless:true,effort:5}).toFile(path.join(dir,file));const mat=m.materials.find(l=>l.id===id);Object.assign(mat,{file,width:960,height:1440});
 }
 await fs.writeFile(path.join(dir,'layers.json'),JSON.stringify(m,null,2));await fs.writeFile(path.join(dir,'layers.js'),'window.GoiVietMemoryReferenceData='+JSON.stringify(m)+';\n');
 console.log(JSON.stringify({layers:m.layers.length,bytes:m.layers.reduce((n,l)=>n+l.bytes,0),restored:m.layers.slice(-2).map(l=>({id:l.id,pixels:[l.pixelWidth,l.pixelHeight]}))}));
})().catch(e=>{console.error(e);process.exitCode=1;});
