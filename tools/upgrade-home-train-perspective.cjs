// Reuse the generated native train in both animated packs and their static posters.
const fs=require('node:fs/promises'),path=require('node:path'),vm=require('node:vm');
const deps='C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp=require(deps+'/sharp'),{createCanvas,Image}=require(deps+'/@napi-rs/canvas');
const root=path.resolve(__dirname,'..'),base=path.join(root,'assets/goi-viet'),folder=path.join(base,'homepage-balanced-3');
async function image(src){const i=new Image();i.src=src;await i.decode();return i;}
(async()=>{
 const native=JSON.parse(await fs.readFile(path.join(base,'memory-native-v4/assets.json'),'utf8')).assets['home-train-perspective'];
 const report=[];
 for(const theme of ['classic','balanced'])for(const quality of ['2k','4k']){
  const activeFolder=path.join(base,'homepage-'+theme+'-3');await fs.mkdir(activeFolder,{recursive:true});
  const file=path.join(activeFolder,'assets-'+quality+'.js'),input=theme==='classic'?path.join(base,quality==='4k'?'homepage-layered-assets-4k.js':'homepage-layered-assets.js'):file,box={window:{}};
  vm.runInNewContext(await fs.readFile(input,'utf8'),box);const pack=box.window.GoiVietHomeLayeredData,m=pack.manifest;
  const train=m.layers.find(l=>l.id==='train'),palace=m.layers.find(l=>l.id==='hue'),smoke=m.layers.find(l=>l.id==='smoke');
  if(!m.palaceTrainOverlapCleaned){
   const im=await image(pack.sources[palace.file]),mask=await image(pack.sources[train.file]);
   const c=createCanvas(im.width,im.height),g=c.getContext('2d'),sx=im.width/palace.rect[2],sy=im.height/palace.rect[3];
   g.drawImage(im,0,0);g.globalCompositeOperation='destination-out';
   g.drawImage(mask,(train.rect[0]-palace.rect[0])*sx,(train.rect[1]-palace.rect[1])*sy,train.rect[2]*sx,train.rect[3]*sy);
   const clean=await sharp(c.toBuffer('image/png')).webp({lossless:true}).toBuffer();
   pack.sources[palace.file]='data:image/webp;base64,'+clean.toString('base64');m.palaceTrainOverlapCleaned=true;
  }
  const source=quality==='2k'?native.variants.find(v=>v.width===1280).file:native.file;
  const bytes=await fs.readFile(path.join(base,'memory-native-v4',source));
  train.file='memory-native-v4/'+source;pack.sources[train.file]='data:image/webp;base64,'+bytes.toString('base64');
  const width=1387,height=width*native.height/native.width,rail=1294;
  train.rect=[1245,rail-287/native.height*height,width,height];
  const edges=[0,570,1055,1580,2118];
  train.spriteParts=edges.slice(0,-1).map((x,i)=>[x/2118,edges[i+1]/2118,i?15/289:0]);
  train.label='Đoàn tàu vẽ mới · đầu máy có khối, mái vàng và bánh bám ray';
  if(smoke)smoke.rect=[1245+170/2118*width,train.rect[1]-8,70,45];
  m.homeComposition={...m.homeComposition,trainArtwork:'native-painted-perspective-20261019',trainRail:rail};
  await fs.writeFile(file,'window.GoiVietHomeLayeredData='+JSON.stringify(pack)+';\n');
  const sandbox={window:{},Image,document:{createElement:()=>createCanvas(1,1)}};
  vm.runInNewContext(await fs.readFile(path.join(base,'homepage-layered-renderer.js'),'utf8'),sandbox);
  const sources=Object.fromEntries(Object.entries(pack.sources).map(([k,v])=>[k,v.startsWith('data:')?v:path.join(root,v)]));
  const bridge=m.layers.find(l=>l.id==='bridge');if(theme==='balanced')sources[bridge.file]=path.join(base,'homepage-layered/bridge-unified-3'+(quality==='2k'?'-2k':'')+'.webp');
  const posterWidth=quality==='4k'?3840:1920,c=createCanvas(posterWidth,Math.round(posterWidth*m.height/m.width));
  const scene=await sandbox.window.LandscapeLab.create(c,m,sources,{copySafeArea:theme==='balanced'});scene.render(12);
  await sharp(c.toBuffer('image/png')).webp({quality:94,effort:5}).toFile(path.join(activeFolder,'poster-'+quality+'.webp'));
  report.push({theme,quality,source,train:train.rect,spriteParts:train.spriteParts,rail,posterWidth});
 }
 await fs.writeFile(path.join(folder,'train-perspective-composition.json'),JSON.stringify({generatedAsset:'../memory-native-v4/home-train-perspective.webp',noUpscaling:true,carriagePlacementOnly:true,report},null,2));
 console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1;});
