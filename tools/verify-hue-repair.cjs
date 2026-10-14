const fs=require('node:fs/promises'),path=require('node:path'),vm=require('node:vm');
const deps='C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp=require(deps+'/sharp'),{createCanvas,Image}=require(deps+'/@napi-rs/canvas');
const root=path.resolve(__dirname,'..'),lab=path.join(root,'exports/landscape-layers-lab-20261012'),proof=path.join(root,'verification/opening-reference-v2-20261013');
(async()=>{
 const m=JSON.parse(await fs.readFile(path.join(lab,'assets/manifest.json'),'utf8')),l=m.layers.find(l=>l.id==='hue'),checks=[];
 const im=await sharp(path.join(lab,l.png)).ensureAlpha().raw().toBuffer({resolveWithObject:true}),source=await sharp(path.join(lab,'reference/original-4k.png')).ensureAlpha().raw().toBuffer();
 const at=(x,y)=>{const px=Math.round(x*m.width/1594),py=Math.round(y*m.height/987),ix=px-l.rect[0],iy=py-l.rect[1];return ix<0||iy<0||ix>=im.info.width||iy>=im.info.height?{rgba:[0,0,0,0]}:{rgba:Array.from(im.data.subarray((iy*im.info.width+ix)*4,(iy*im.info.width+ix)*4+4)),source:Array.from(source.subarray((py*m.width+px)*4,(py*m.width+px)*4+4))};};
 const check=(name,pass,detail)=>{checks.push({name,pass,detail});if(!pass)throw Error(name+' '+JSON.stringify(detail));};
 for(const [x,y]of [[729,475],[737,482],[799,436],[867,475]]){const p=at(x,y);check('Full original facade remains at '+x+','+y,p.rgba[3]===255&&p.rgba.slice(0,3).every((v,i)=>v===p.source[i]),p);}
 check('Former false right spire and attached sky wedge are transparent',[[866,411],[875,428],[740,430]].every(([x,y])=>at(x,y).rgba[3]===0));
 check('The source-reference shape is wider and includes the complete foundation',l.rect[0]<720*m.width/1594&&l.rect[0]+l.rect[2]>882*m.width/1594&&l.rect[1]>394*m.height/987);
 const box={window:{},Image,document:{createElement:()=>createCanvas(1,1)}};vm.runInNewContext(await fs.readFile(path.join(lab,'assets/bundle.js'),'utf8'),box);vm.runInNewContext(await fs.readFile(path.join(lab,'scene.js'),'utf8'),box);
 const canvas=createCanvas(3840,2378),scene=await box.window.LandscapeLab.create(canvas,m,box.window.LandscapeAssets);
 scene.enabled.delete('hue');scene.render(20);const without=canvas.toBuffer('image/png');await sharp(without).extract({left:Math.round(700*3840/1594),top:Math.round(380*2378/987),width:Math.round(225*3840/1594),height:Math.round(160*2378/987)}).png().toFile(path.join(proof,'hue-background-after.png'));
 const g=canvas.getContext('2d');const p=g.getImageData(Math.round(730*3840/1594),Math.round(449*2378/987),1,1).data;
 check('The removed gate reveals green terrain instead of the old cream cutout',p[1]>p[0]&&p[1]>p[2],Array.from(p));
 scene.enabled.add('hue');scene.render(20);await sharp(canvas.toBuffer('image/png')).extract({left:Math.round(700*3840/1594),top:Math.round(380*2378/987),width:Math.round(225*3840/1594),height:Math.round(160*2378/987)}).png().toFile(path.join(proof,'hue-after.png'));
 await fs.writeFile(path.join(proof,'hue-checks.json'),JSON.stringify({checks,registration:l.rect},null,2));console.log(JSON.stringify({passed:checks.length,registration:l.rect}));
})().catch(e=>{console.error(e);process.exitCode=1;});
