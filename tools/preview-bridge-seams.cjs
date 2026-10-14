// Preview the junction repair before rebuilding the full asset set.
const fs=require('node:fs/promises'),path=require('node:path'),vm=require('node:vm');
const deps='C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp=require(deps+'/sharp'),{createCanvas,Image}=require(deps+'/@napi-rs/canvas');
const root=path.resolve(__dirname,'..'),lab=path.join(root,'exports/landscape-layers-lab-20261012'),proof=path.join(root,'verification/bridge-seam-fix-20261013');
(async()=>{
  const manifest=JSON.parse(await fs.readFile(path.join(proof,'manifest-before.json'),'utf8')),l=manifest.layers.find(l=>l.id==='bridge'),W=manifest.width,H=manifest.height;
  const {data,info}=await sharp(path.join(proof,'bridge-before.png')).ensureAlpha().raw().toBuffer({resolveWithObject:true}),pixels=Buffer.alloc(W*H*4),mask=new Uint8Array(W*H);
  for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){const p=(y*info.width+x)*4,q=((l.rect[1]+y)*W+l.rect[0]+x);data.copy(pixels,q*4,p,p+4);mask[q]=data[p+3];}
  const repaired=await require(path.join(lab,'tools/bridge-seams.cjs')).repairSeams({bridge:{pixels,mask},W,H,DW:1594,DH:987,reference:path.join(lab,'reference')});
  const crop=Buffer.alloc(info.width*info.height*4);for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){const p=(y*info.width+x)*4,q=((l.rect[1]+y)*W+l.rect[0]+x);repaired.pixels.copy(crop,p,q*4,q*4+3);crop[p+3]=repaired.mask[q];}
  const png=await sharp(crop,{raw:{width:info.width,height:info.height,channels:4}}).png().toBuffer();await fs.writeFile(path.join(proof,'bridge-candidate.png'),png);
  const sandbox={window:{},Image,document:{createElement:()=>createCanvas(1,1)}};
  vm.runInNewContext(await fs.readFile(path.join(lab,'assets/bundle.js'),'utf8'),sandbox);sandbox.window.LandscapeAssets[l.file]='data:image/png;base64,'+png.toString('base64');
  vm.runInNewContext(await fs.readFile(path.join(lab,'scene.js'),'utf8'),sandbox);
  const canvas=createCanvas(1920,1189),scene=await sandbox.window.LandscapeLab.create(canvas,manifest,sandbox.window.LandscapeAssets);scene.render(20);
  const frame=canvas.toBuffer('image/png');await fs.writeFile(path.join(proof,'candidate-full.png'),frame);
  for(const [side,x,w]of [['left',110,215],['right',1360,220]])await sharp(frame).extract({left:Math.round(x*3840/1594/2),top:Math.round(510*2378/987/2),width:Math.round(w*3840/1594/2),height:Math.round(145*2378/987/2)}).png().toFile(path.join(proof,'candidate-'+side+'.png'));
  console.log(JSON.stringify(repaired.seamRepairs));
})().catch(e=>{console.error(e);process.exitCode=1;});
