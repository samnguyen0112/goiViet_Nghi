const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const deps='C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules',sharp=require(deps+'/sharp'),{createCanvas,Image}=require(deps+'/@napi-rs/canvas');
const root=path.resolve(__dirname,'..'),lab=path.join(root,'exports/landscape-layers-lab-20261012'),out=path.join(root,'verification/cloud-refinement-20261014'),checks=[];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function check(name,pass,detail){checks.push({name,pass,detail});if(!pass)throw Error(name+' '+JSON.stringify(detail));}
function objects(data,w,h){const seen=new Uint8Array(w*h),queue=new Int32Array(w*h),areas=[];let total=0;for(let seed=0;seed<w*h;seed++){if(seen[seed]||data[seed*4+3]<96)continue;seen[seed]=1;let head=0,tail=1;queue[0]=seed;while(head<tail){const p=queue[head++],x=p%w,y=Math.floor(p/w);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy,np=ny*w+nx;if(nx>=0&&nx<w&&ny>=0&&ny<h&&!seen[np]&&data[np*4+3]>=96){seen[np]=1;queue[tail++]=np;}}}areas.push(tail);total+=tail;}areas.sort((a,b)=>b-a);return{pieces:areas.filter(a=>a>=50).length,bodyFraction:areas[0]/total};}
(async()=>{
const m=JSON.parse(await fs.readFile(path.join(lab,'assets/manifest.json'),'utf8')),old=JSON.parse(await fs.readFile(path.join(out,'manifest.before.json'),'utf8')),ids=m.cloudRepairs.map(l=>l.id);let oldFragmentCount=0,newFragmentCount=0;
for(const id of ids){const l=m.layers.find(l=>l.id===id),{data,info}=await sharp(path.join(lab,l.png)).ensureAlpha().raw().toBuffer({resolveWithObject:true}),webp=await sharp(path.join(lab,l.file)).ensureAlpha().raw().toBuffer();const body=objects(data,info.width,info.height);let darkGreen=0,clear=0;
for(let p=0;p<data.length;p+=4){const [r,g,b,a]=data.subarray(p,p+4);if(!a)clear++;if(a>220&&(r<145||g-r>22&&g-b>15))darkGreen++;}
check('Repaired cloud has one coherent body and genuine transparent outline: '+id,body.bodyFraction>.995&&body.pieces===1&&clear>50,{...body,clear});
check('Repaired cloud contains no dark foliage or green mountain pixels: '+id,darkGreen===0,{darkGreen});
let alphaDelta=0,visibleColourDelta=0;for(let p=0;p<data.length;p+=4){if(data[p+3]!==webp[p+3])alphaDelta++;if(data[p+3])for(let c=0;c<3;c++)if(data[p+c]!==webp[p+c])visibleColourDelta++;}
check('PNG and lossless WebP retain identical visible cloud colour and alpha: '+id,alphaDelta===0&&visibleColourDelta===0,{alphaDelta,visibleColourDelta});
const before=await sharp(path.join(out,id+'.before.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});oldFragmentCount+=objects(before.data,before.info.width,before.info.height).pieces;newFragmentCount+=body.pieces;
}
check('Detached fragments are replaced by complete cloud bodies',oldFragmentCount>newFragmentCount,{before:oldFragmentCount,after:newFragmentCount});
const six=m.layers.find(l=>l.id==='cloud-06'),beforeSix=old.layers.find(l=>l.id==='cloud-06'),now=await sharp(path.join(lab,six.png)).ensureAlpha().raw().toBuffer({resolveWithObject:true}),before=await sharp(path.join(out,'cloud-06.before.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const alpha=(im,l,x,y)=>{const px=Math.round(x-l.rect[0]),py=Math.round(y-l.rect[1]);return px>=0&&px<im.info.width&&py>=0&&py<im.info.height?im.data[(py*im.info.width+px)*4+3]:0;};let restoredWedge=0;
for(let y=Math.floor(403*2378/987);y<Math.ceil(440*2378/987);y++)for(let x=Math.floor(225*3840/1594);x<Math.ceil(262*3840/1594);x++)if(alpha(before,beforeSix,x,y)<20&&alpha(now,six,x,y)>220)restoredWedge++;
check('The leaf-shaped wedge reported by the user is filled with continuous cloud paint',restoredWedge>500,{restoredPixels:restoredWedge});
const oldBox={window:{}};vm.runInNewContext(await fs.readFile(path.join(out,'scene.before.js'),'utf8'),oldBox);
check('Landscape motion code and opening rhythm are unchanged',hash(await fs.readFile(path.join(lab,'scene.js')))===hash(await fs.readFile(path.join(out,'scene.before.js'))));
check('Mountains and river entrance timings are unchanged',m.layers.filter(l=>['mountain','terrain'].includes(l.kind)).every(l=>JSON.stringify(l.entrance)===JSON.stringify(old.layers.find(o=>o.id===l.id).entrance)));
for(const l of m.layers.filter(l=>l.kind==='cloud'&&!ids.includes(l.id)))check('Intact original cloud artwork is retained: '+l.id,hash(await fs.readFile(path.join(lab,l.png)))===hash(await fs.readFile(path.join(out,l.id+'.before.png'))));
check('New bridge mist is occluded by a stationary riverbank contour',['cloud-09','cloud-14','cloud-15'].every(id=>m.layers.find(l=>l.id===id).occlusion.includes('bridge-foreground')));
await fs.writeFile(path.join(out,'cloud-checks.json'),JSON.stringify({checks,generatedAt:new Date().toISOString()},null,2));console.log(JSON.stringify({passed:checks.length,restoredWedge,oldFragmentCount,newFragmentCount}));
})().catch(async e=>{await fs.writeFile(path.join(out,'cloud-checks.failed.json'),JSON.stringify({error:e.message,checks},null,2));console.error(e);process.exitCode=1;});
