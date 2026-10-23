const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const sharp=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const spec=require('./memory-reference-v2-spec.cjs');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'assets/goi-viet/memory-reference-v2'),out=path.join(root,'verification/memory-reference-v2');
const {width:W,height:H}=spec,N=W*H;
const clampRect=([x,y,w,h])=>[Math.max(0,x),Math.max(0,y),Math.min(w,W-Math.max(0,x)),Math.min(h,H-Math.max(0,y))].map(Math.round);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
async function mask(d,blur=.6,expand=0,union=false){const paths=(union?d.split(/(?=M)/).filter(Boolean):[d]).map(p=>`<path d="${p}" fill="white" stroke="white" stroke-width="${expand*2}"/>`).join('');const svg=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${paths}</svg>`);let image=sharp(svg).flatten({background:'#000'}).greyscale();if(blur)image=image.blur(blur);return image.raw().toBuffer();}
async function exportLayer(rgb,alpha,rect,id){
 const [x,y,w,h]=clampRect(rect),rgba=Buffer.alloc(w*h*4);
 for(let j=0;j<h;j++)for(let i=0;i<w;i++){const from=(y+j)*W+x+i,to=(j*w+i)*4;rgba[to]=rgb[from*3];rgba[to+1]=rgb[from*3+1];rgba[to+2]=rgb[from*3+2];rgba[to+3]=alpha[from];}
 const file=id+'.webp';await sharp(rgba,{raw:{width:w,height:h,channels:4}}).webp({quality:95,alphaQuality:100,effort:6}).toFile(path.join(dir,file));
 return {file,rect:[x,y,w,h],bytes:(await fs.stat(path.join(dir,file))).size};
}
(async()=>{
 await fs.mkdir(dir,{recursive:true});await fs.mkdir(out,{recursive:true});
 const referencePath=path.join(dir,'sources/official-reference.png'),cleanPath=path.join(dir,'sources/clean-plate.png');
 const reference=await sharp(referencePath).removeAlpha().raw().toBuffer(),clean=await sharp(cleanPath).removeAlpha().raw().toBuffer();
 // Keep ORIGINAL scenery wherever it is visible. Inpaint is confined to the
 // occlusions behind separately extracted objects, cards and original lettering.
 const occlusion=await mask([spec.sourceUI,...spec.fg.map(l=>l[2]),'M571 737L813 779 749 1129 501 1088Z','M670 764L919 815 814 1135 575 1067Z',spec.rect(155,1458,402,85),spec.rect(150,1488,510,109)].join(' '),1.1,5,true);
 for(let p=0;p<N;p++)for(let c=0;c<3;c++)clean[p*3+c]=Math.round(clean[p*3+c]*occlusion[p]/255+reference[p*3+c]*(1-occlusion[p]/255));
 // Restore the deliberately empty caption margin that the background inpaint
 // had filled with foliage. Sample nearby paper; feather the edge, no UI image.
 for(let y=540;y<755;y++)for(let x=810;x<W;x++){
  const radius=Math.sqrt(((x-945)/145)**2+((y-648)/112)**2);
  const weight=Math.min(1,Math.max(0,(1-radius)/.24));
  const source=((250+(y%80))*W+280+(x%100))*3,target=(y*W+x)*3;
  for(let c=0;c<3;c++)clean[target+c]=Math.round(clean[target+c]*(1-weight)+clean[source+c]*weight);
 }
 const manifest={version:2,width:W,height:H,referenceSHA256:hash(await fs.readFile(referencePath)),restoredPlateSHA256:hash(await fs.readFile(cleanPath)),method:'Original reference pixels for visible scenery and objects, registered semantic alpha masks; built-in image_gen only restores occluded paint, blank card detail and homepage connection.',groups:spec.groups,layers:[],materials:[]};
 const residual=Buffer.alloc(N,255),covered=Buffer.alloc(N),backgroundLayers=[];
 // Carve later semantic objects out of earlier paint. This avoids duplicate
 // boats/maps/clouds hiding underneath the layer that is meant to own them.
 for(let k=spec.bg.length-1;k>=0;k--){
  const [id,kind,d,bounds]=spec.bg[k],rect=clampRect(bounds),[x,y,w,h]=rect,a=await mask(d,1.1);
  for(let j=0;j<H;j++)for(let i=0;i<W;i++){const p=j*W+i;if(i<x||i>=x+w||j<y||j>=y+h){a[p]=0;continue;}const original=a[p];a[p]=Math.round(original*(1-covered[p]/255));covered[p]=255-Math.round((255-covered[p])*(1-original/255));if(covered[p]===255)residual[p]=0;}
  const asset=await exportLayer(clean,a,rect,id);backgroundLayers[k]={id,kind,family:'background',origin:'official-scenery-with-restored-occlusions',mask:d,...asset};
 }
 manifest.layers.push(...backgroundLayers);
 // Residual paint is split into local paper/sky bands, never a long baked mockup.
 for(const [id,rect]of [['paper-sky-upper',[0,0,W,620]],['paper-middle',[0,620,W,580]],['paper-exit',[0,1200,W,419]]]){
  manifest.layers.unshift({id,kind:'paper',family:'background',origin:'official-scenery-with-restored-occlusions',...await exportLayer(clean,residual,rect,id)});
 }
 const ui=await mask(spec.sourceUI,0);
 for(const [id,family,d,bounds,options={}]of spec.fg){
  const a=await mask(d,.5,options.expand||0);
  for(const remove of options.subtract||[]){const b=await mask(remove,.5);for(let i=0;i<N;i++)a[i]=Math.round(a[i]*(1-b[i]/255));}
  for(let i=0;i<N;i++){
   a[i]=Math.round(a[i]*(1-ui[i]/255));
   if(options.brick&&a[i]){const r=reference[i*3],g=reference[i*3+1];a[i]=Math.round(a[i]*Math.max(0,Math.min(1,(r-g+20)/20)));}
  }
  manifest.layers.push({id,kind:family==='train'?'train':'object',family,origin:'official-reference',mask:d,subtract:options.subtract||[],...await exportLayer(reference,a,bounds,id)});
 }
 await sharp(cleanPath).extract({left:180,top:230,width:170,height:170}).webp({quality:94}).toFile(path.join(dir,'paper-texture.webp'));
 const restores=[
  ['card-front','C:/Users/Uy/.codex/generated_images/01a14fd7-ebf8-7d13-aaf9-532e7b6605fb/exec-59686a7b-73fa-4b42-b700-93ceed433ce9.png',[32,52,960,1434]],
  ['card-back','C:/Users/Uy/.codex/generated_images/01a14fd7-ebf8-7d13-aaf9-532e7b6605fb/exec-4c8e380f-29e4-4975-bf7b-09635a1f3416.png',[54,45,916,1444]]
 ];
 for(const[id,from,rect]of restores){
  await fs.copyFile(from,path.join(dir,'sources',id+'-restored.png'));
  const[x,y,w,h]=rect;const rounded=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" rx="55" fill="white"/></svg>`);
  const isolated=await sharp(from).extract({left:x,top:y,width:w,height:h}).ensureAlpha().composite([{input:rounded,blend:'dest-in'}]).png().toBuffer();
  await sharp(isolated).resize(600,900,{fit:'fill'}).webp({quality:94,alphaQuality:100}).toFile(path.join(dir,id+'.webp'));
  manifest.materials.push({id,file:id+'.webp',origin:'restored reference detail',width:600,height:900});
 }
 const seamFrom='C:/Users/Uy/.codex/generated_images/01a14fd7-ebf8-7d13-aaf9-532e7b6605fb/exec-bb10e21c-2f89-4742-90d6-18960eddcfdc.png';
 await fs.copyFile(seamFrom,path.join(dir,'sources/seam-restored.png'));
 // Register the lower 200px against the chapter's exact scenery, so overlap
 // cannot produce ghosted duplicate mountains, houses or clouds.
 const head=await sharp(clean,{raw:{width:W,height:H,channels:3}}).extract({left:0,top:0,width:W,height:200}).ensureAlpha().raw().toBuffer();
 for(let y=0;y<200;y++)for(let x=0;x<W;x++)head[(y*W+x)*4+3]=Math.round(255*Math.min(1,y/55));
 const headPng=await sharp(head,{raw:{width:W,height:200,channels:4}}).png().toBuffer();
 const seamBase=await sharp(seamFrom).resize(W,324,{fit:'fill'}).png().toBuffer();
 const seamRegistered=await sharp(seamBase).composite([{input:headPng,left:0,top:124}]).png().toBuffer();
 await sharp(seamRegistered).resize(1920).webp({quality:94}).toFile(path.join(dir,'seam-landscape.webp'));
 manifest.materials.push({id:'seam-landscape',file:'seam-landscape.webp',origin:'restored connection between actual homepage tail and official chapter head'});
 // Mobile may extend water between the reflowed memories; scenery and foliage
 // keep their own aspect ratios and must never be stretched with that water.
 const riverLayers=manifest.layers.filter(l=>l.kind==='river');
 await sharp({create:{width:W,height:1246,channels:4,background:'#00000000'}}).composite(riverLayers.map(l=>({input:path.join(dir,l.file),left:l.rect[0],top:l.rect[1]}))).webp({quality:94,alphaQuality:100}).toFile(path.join(dir,'mobile-river.webp'));
 await fs.writeFile(path.join(dir,'layers.json'),JSON.stringify(manifest,null,2));
 await fs.writeFile(path.join(dir,'layers.js'),'window.GoiVietMemoryReferenceData='+JSON.stringify(manifest)+';\n');
 // Review sheet: every individual object on neutral transparency, not just a final poster.
 const fg=manifest.layers.filter(l=>l.origin==='official-reference');const cells=[];let j=0;
 for(const l of fg){const img=await sharp(path.join(dir,l.file)).resize(240,175,{fit:'contain',background:'#e7e4de'}).png().toBuffer();const label=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="250" height="25"><rect width="250" height="25" fill="#f6efe0"/><text x="8" y="17" font-size="11" fill="#243c34">${l.id}</text></svg>`);cells.push({input:img,left:(j%4)*250,top:Math.floor(j/4)*210},{input:label,left:(j%4)*250,top:Math.floor(j/4)*210+178});j++;}
 await sharp({create:{width:1000,height:Math.ceil(j/4)*210,channels:4,background:'#e7e4de'}}).composite(cells).png().toFile(path.join(out,'extracted-object-sheet.png'));
 const landscape=manifest.layers.filter(l=>l.family==='background'),landscapeCells=[];j=0;
 for(const l of landscape){const img=await sharp(path.join(dir,l.file)).resize(240,175,{fit:'contain',background:'#e7e4de'}).png().toBuffer();const label=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="250" height="25"><rect width="250" height="25" fill="#f6efe0"/><text x="8" y="17" font-size="11" fill="#243c34">${l.id}</text></svg>`);landscapeCells.push({input:img,left:(j%4)*250,top:Math.floor(j/4)*210},{input:label,left:(j%4)*250,top:Math.floor(j/4)*210+178});j++;}
 await sharp({create:{width:1000,height:Math.ceil(j/4)*210,channels:4,background:'#e7e4de'}}).composite(landscapeCells).png().toFile(path.join(out,'extracted-scenery-sheet.png'));
 console.log(JSON.stringify({layers:manifest.layers.length,originalObjects:fg.length,bytes:manifest.layers.reduce((n,l)=>n+l.bytes,0),referenceSHA256:manifest.referenceSHA256}));
})().catch(e=>{console.error(e);process.exitCode=1;});
