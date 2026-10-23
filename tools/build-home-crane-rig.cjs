// Pack the fixed painted parts of one crane. No pose generation or image morph.
const fs=require('node:fs/promises'),path=require('node:path');
const runtime=path.join(require('node:os').homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
const sharp=require(require.resolve('sharp',{paths:[process.cwd(),runtime]}));
const root=path.resolve(__dirname,'..'),dir=path.join(root,'assets/goi-viet/homepage-cranes'),review=path.join(root,'verification/crane-rig');
const source=process.argv[2]||path.join(dir,'articulated-source.png'),S=512;
(async()=>{
 await fs.mkdir(review,{recursive:true});await fs.mkdir(dir,{recursive:true});
 if(path.resolve(source)!==path.join(dir,'articulated-source.png'))await fs.copyFile(source,path.join(dir,'articulated-source.png'));
 const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true}),W=info.width,H=info.height,labels=new Int32Array(W*H),queue=new Int32Array(W*H),components=[];let id=0;
 for(let p=0;p<labels.length;p++){
  if(labels[p]||data[p*4+3]<16)continue;
  const c={id:++id,count:0,left:W,top:H,right:0,bottom:0};let start=0,end=1;queue[0]=p;labels[p]=id;
  while(start<end){const j=queue[start++],x=j%W,y=Math.floor(j/W);c.count++;c.left=Math.min(c.left,x);c.right=Math.max(c.right,x);c.top=Math.min(c.top,y);c.bottom=Math.max(c.bottom,y);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy,k=ny*W+nx;if(nx<0||nx>=W||ny<0||ny>=H||labels[k]||data[k*4+3]<16)continue;labels[k]=id;queue[end++]=k;}
  }if(c.count>10000)components.push(c);
 }
 console.log('Painted parts',JSON.stringify(components));if(components.length!==3)throw Error('Expected a body and two complete wings');
 const body=components.slice().sort((a,b)=>a.top-b.top)[0],wings=components.filter(c=>c!==body).sort((a,b)=>a.left-b.left),ordered=[body,...wings];
 for(let pass=0;pass<3;pass++)for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const j=y*W+x;if(labels[j]||!data[j*4+3])continue;for(const k of [j-1,j+1,j-W,j+W])if(labels[k]){labels[j]=labels[k];break;}}
 const frames=[],metadata=[];
 for(let i=0;i<3;i++){
  const c=ordered[i],left=Math.max(0,c.left-3),top=Math.max(0,c.top-3),width=Math.min(W,c.right+4)-left,height=Math.min(H,c.bottom+4)-top,raw=Buffer.alloc(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){const p=(y+top)*W+x+left;if(labels[p]===c.id)data.copy(raw,(y*width+x)*4,p*4,p*4+4);}
  const scale=i===0?460/(c.right-c.left):i===1?.55:.65;
  const w=Math.round(width*scale),h=Math.round(height*scale),offset=i===0?[32-(c.left-left)*scale,222-(c.top-top)*scale]:[440-((i===1?846:1487)-left)*scale,395-((i===1?878:887)-top)*scale];
  const x=Math.round(offset[0]),y=Math.round(offset[1]);if(x<0||y<0||x+w>S||y+h>S)throw Error('Part outside its texture cell '+i+': '+[x,y,w,h]);
  const input=await sharp(raw,{raw:{width,height,channels:4}}).resize(w,h).png().toBuffer();
  const tile=await sharp({create:{width:S,height:S,channels:4,background:'#00000000'}}).composite([{input,left:x,top:y}]).png().toBuffer();
  frames.push({input:tile,left:i*S,top:0});metadata.push({part:['body','near-wing','far-wing'][i],sourceBounds:c,scale,offset:[x,y],wingRoot:i?[440,395]:null});
  await fs.writeFile(path.join(review,['body.png','near-wing.png','far-wing.png'][i]),tile);
 }
 // Power-of-two dimensions support stable mip filtering on foreshortened wings.
 await sharp({create:{width:S*4,height:S,channels:4,background:'#00000000'}}).composite(frames).webp({lossless:true,effort:6}).toFile(path.join(dir,'articulated-parts.webp'));
 await fs.writeFile(path.join(review,'parts.json'),JSON.stringify({source,size:S,parts:metadata},null,2));
 await sharp(path.join(dir,'articulated-parts.webp')).flatten({background:'#f8ebd1'}).resize(1200).png().toFile(path.join(review,'parts-light.png'));
})().catch(e=>{console.error(e);process.exitCode=1;});
