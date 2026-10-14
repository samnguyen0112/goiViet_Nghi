// Package the supplied 4K pixels and generated object-removal patches losslessly.
// Image editing is done by imagegen; this step registers/crops/encodes its assets.
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const sharp=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),out=path.join(root,'assets/goi-viet/homepage-scene-4k');
const W=3840,H=2378,DW=1594,DH=987,SX=W/DW,SY=H/DH;
const rect=([x,y,w,h])=>[Math.round(x*SX),Math.round(y*SY),Math.round(w*SX),Math.round(h*SY)];
const protectedRects=[[593,54,437,203],[633,260,334,26],[458,289,704,27],[326,341,288,52],[666,339,280,55],[992,341,278,53],[546,608,504,46],[488,659,626,43],[513,708,573,49],[472,766,651,43],[604,811,389,41],[574,860,449,63]].map(rect);
const hotspots={homeLogoEffect:rect([565,40,480,220]),btnHomeStationNorth:rect([326,341,288,52]),btnHomeStationCentral:rect([666,339,280,55]),btnHomeStationSouth:rect([992,341,278,53]),btnQuickStartWelcome:rect([578,864,280,54]),btnProceedToGuide:rect([872,864,145,54])};
// Generative reconstruction is used only where the static floating objects were.
// The original supplied 4K scenery remains untouched everywhere else.
const eraseRects=[
 [180,38,265,195],[1300,105,294,240],
 [400,51,71,60],[475,12,130,80],[1090,0,99,45],[1065,142,82,68],[1142,263,63,58],
 [219,363,75,91],[217,668,78,80],[361,717,76,66],[1155,787,94,82],
 [447,127,78,49],[1505,70,86,91],[1008,236,90,56],[1287,214,65,43],
 [1273,359,91,66],[1305,728,86,60],[1423,860,78,78],[1535,433,59,77],[146,637,67,66],[1533,518,61,65]
].map(rect);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
async function cropSprite(sheet,{left,top,width,height},name){
 const {data,info}=await sharp(sheet).extract({left,top,width,height}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let minX=width,minY=height,maxX=-1,maxY=-1;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]>8){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
 // Extraction may leave nominally solid paper feathers at alpha 250..254.
 // Make the interior opaque while retaining the real antialias/translucent edge.
 for(let i=3;i<data.length;i+=4)if(data[i]>=250)data[i]=255;
 if(maxX<0)throw Error('Empty sprite '+name);
 const pad=3,x=Math.max(0,minX-pad),y=Math.max(0,minY-pad),w=Math.min(width,maxX+pad+1)-x,h=Math.min(height,maxY+pad+1)-y;
 const encoded=await sharp(data,{raw:info}).extract({left:x,top:y,width:w,height:h}).webp({lossless:true,effort:6}).toBuffer();
 await fs.writeFile(path.join(out,name),encoded);return {name,width:w,height:h,bytes:encoded.length,sha256:sha(encoded)};
}
(async()=>{
 if(process.argv.includes('--sprites-only')){
  const sheet=path.join(out,'sprite-sheet.png'),m=await sharp(sheet).metadata(),split=Math.floor(m.height*.76),middle=Math.floor(m.width/2),sprites=[];
  sprites.push(await cropSprite(sheet,{left:0,top:0,width:m.width,height:split},'crane.webp'));
  sprites.push(await cropSprite(sheet,{left:0,top:split,width:middle,height:m.height-split},'leaf.webp'));
  sprites.push(await cropSprite(sheet,{left:middle,top:split,width:m.width-middle,height:m.height-split},'petal.webp'));
  const packed={};for(const n of ['source-with-text.webp','scenery-clean.webp','crane.webp','leaf.webp','petal.webp'])packed[n]='data:image/webp;base64,'+(await fs.readFile(path.join(out,n))).toString('base64');
  await fs.writeFile(path.join(root,'assets/goi-viet/homepage-scene-assets-4k.js'),'window.GoiVietHomeSceneAssets='+JSON.stringify(packed)+';\n');
  const report=JSON.parse(await fs.readFile(path.join(root,'verification/homepage-4k-20261012/asset-evidence.json'),'utf8'));report.sprites=sprites;report.normalizedOpaqueSpriteAlpha=true;report.bundleBytes=(await fs.stat(path.join(root,'assets/goi-viet/homepage-scene-assets-4k.js'))).size;
  await fs.writeFile(path.join(root,'verification/homepage-4k-20261012/asset-evidence.json'),JSON.stringify(report,null,2));console.log('Updated transparent sprite matting and bundle');return;
 }
 const masterPath=path.join(root,'image/Giao diện trang đầu-full-4K.png'),edgePath=path.join(root,'image/Giao diện trang đầu-4K.png');
 const masterBytes=await fs.readFile(masterPath),edgeBytes=await fs.readFile(edgePath);
 const {data:original}=await sharp(masterBytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const donor=await sharp(path.join(out,'clean-edit-reference.png')).resize(W,H,{fit:'fill'}).ensureAlpha().raw().toBuffer();
 const bareDonor=await sharp(path.join(out,'edge-edit-reference.png')).resize(W,H,{fit:'fill'}).ensureAlpha().raw().toBuffer();
 const cleaned=Buffer.from(original),mask=new Uint8Array(W*H);
 const smooth=t=>t*t*(3-2*t);
 for(const [x,y,w,h]of eraseRects){
  const feather=Math.min(20*SX,w/8,h/8);
  for(let py=Math.max(0,y);py<Math.min(H,y+h);py++)for(let px=Math.max(0,x);px<Math.min(W,x+w);px++){
   const distance=Math.min(px-x+.5,x+w-px-.5,py-y+.5,y+h-py-.5);
   const a=smooth(Math.max(0,Math.min(1,distance/feather))),p=py*W+px;
   mask[p]=Math.max(mask[p],Math.round(a*255));
  }
 }
 // Never allow generated text or button typography into the runtime source.
 for(const [x,y,w,h]of protectedRects.slice(1))for(let py=y;py<y+h;py++)for(let px=x;px<x+w;px++)mask[py*W+px]=0;
 let changed=0;
 const petalRect=rect([1008,236,90,56]);
 for(let p=0;p<W*H;p++)if(mask[p]){const a=mask[p]/255,px=p%W,py=Math.floor(p/W),fill=px>=petalRect[0]&&px<petalRect[0]+petalRect[2]&&py>=petalRect[1]&&py<petalRect[1]+petalRect[3]?bareDonor:donor;for(let k=0;k<3;k++)cleaned[p*4+k]=Math.round(original[p*4+k]*(1-a)+fill[p*4+k]*a);changed++;}
 const raw={width:W,height:H,channels:4};
 const source=await sharp(original,{raw}).webp({lossless:true,effort:6}).toBuffer();
 const plate=await sharp(cleaned,{raw}).webp({lossless:true,effort:6}).toBuffer();
 const edgeRaw=await sharp(edgeBytes).ensureAlpha().raw().toBuffer(),edgeDonor=await sharp(path.join(out,'edge-edit-reference.png')).resize(W,H,{fit:'fill'}).ensureAlpha().raw().toBuffer();
 const edgeRects=[[443,126,85,61],[588,157,89,56],[1505,78,89,79],[993,219,106,75],[1262,359,108,75],[1136,227,105,83],[224,366,100,105],[148,638,72,76],[207,679,109,90],[360,718,78,76],[1304,724,102,79],[1411,848,109,99]].map(rect);
 for(const [x,y,w,h]of edgeRects)for(let py=y;py<Math.min(H,y+h);py++)for(let px=x;px<Math.min(W,x+w);px++){
  const distance=Math.min(px-x+.5,x+w-px-.5,py-y+.5,y+h-py-.5),a=smooth(Math.max(0,Math.min(1,distance/Math.min(15*SX,w/8,h/8)))),p=(py*W+px)*4;
  for(let k=0;k<3;k++)edgeRaw[p+k]=Math.round(edgeRaw[p+k]*(1-a)+edgeDonor[p+k]*a);
 }
 const edge=await sharp(edgeRaw,{raw}).webp({lossless:true,effort:6}).toBuffer();
 await fs.writeFile(path.join(out,'source-with-text.webp'),source);await fs.writeFile(path.join(out,'scenery-clean.webp'),plate);await fs.writeFile(path.join(out,'edge-landscape.webp'),edge);
 const spriteSheet=path.join(out,'sprite-sheet.png'),meta=await sharp(spriteSheet).metadata();
 const split=Math.floor(meta.height*.76),middle=Math.floor(meta.width/2);
 const sprites=[];
 sprites.push(await cropSprite(spriteSheet,{left:0,top:0,width:meta.width,height:split},'crane.webp'));
 sprites.push(await cropSprite(spriteSheet,{left:0,top:split,width:middle,height:meta.height-split},'leaf.webp'));
 sprites.push(await cropSprite(spriteSheet,{left:middle,top:split,width:meta.width-middle,height:meta.height-split},'petal.webp'));
 const assets={};
 for(const name of ['source-with-text.webp','scenery-clean.webp','crane.webp','leaf.webp','petal.webp'])assets[name]='data:image/webp;base64,'+(await fs.readFile(path.join(out,name))).toString('base64');
 await fs.writeFile(path.join(root,'assets/goi-viet/homepage-scene-assets-4k.js'),'window.GoiVietHomeSceneAssets='+JSON.stringify(assets)+';\n');
 const config={width:W,height:H,designWidth:DW,designHeight:DH,protectedRects,hotspots,logoInkBounds:rect([593,54,437,203]),duration:24,fps:30};
 await fs.writeFile(path.join(root,'assets/goi-viet/homepage-scene-layout.js'),'// Shared source coordinates for the supplied 4K artwork.\nwindow.GoiVietHomeLayout=Object.freeze('+JSON.stringify(config,null,2)+');\n');
 const report={master:masterPath,masterSHA256:sha(masterBytes),edge:edgePath,edgeSHA256:sha(edgeBytes),width:W,height:H,lossless:true,originalPixelsPreserved:W*H-changed,reconstructedPixels:changed,eraseRects,protectedRects,sprites,sourceBytes:source.length,plateBytes:plate.length,edgeBytes:edge.length,bundleBytes:(await fs.stat(path.join(root,'assets/goi-viet/homepage-scene-assets-4k.js'))).size};
 await fs.writeFile(path.join(root,'verification/homepage-4k-20261012/asset-evidence.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1;});
