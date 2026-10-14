const fs=require('node:fs/promises'),path=require('node:path'),vm=require('node:vm');
const deps='C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules',sharp=require(deps+'/sharp'),{createCanvas,Image,GlobalFonts}=require(deps+'/@napi-rs/canvas');
const root=path.resolve(__dirname,'..'),lab=path.join(root,'exports/landscape-layers-lab-20261012'),out=path.join(root,'verification/coherent-mountain-opening-20261013');
GlobalFonts.registerFromPath('C:/Windows/Fonts/arial.ttf','Proof');
(async()=>{
 const manifest=JSON.parse(await fs.readFile(path.join(lab,'assets/manifest.json'),'utf8')),beforeManifest=JSON.parse(await fs.readFile(path.join(out,'manifest.before.json'),'utf8')),bundle=await fs.readFile(path.join(lab,'assets/bundle.js'),'utf8');
 async function engine(code,m){const box={window:{},Image,document:{createElement:()=>createCanvas(1,1)}};vm.runInNewContext(bundle,box);vm.runInNewContext(code,box);const canvas=createCanvas(1280,793),scene=await box.window.LandscapeLab.create(canvas,m,box.window.LandscapeAssets);return{canvas,scene};}
 const current=await engine(await fs.readFile(path.join(lab,'scene.js'),'utf8'),manifest),old=await engine(await fs.readFile(path.join(out,'scene.before.js'),'utf8'),beforeManifest);
 const times=[0,.65,1.2,1.65,2.25,2.9,3.4,4.1,5,10],sheet=createCanvas(1280,5*436),g=sheet.getContext('2d');g.fillStyle='#173a30';g.fillRect(0,0,sheet.width,sheet.height);g.fillStyle='#fff1d5';g.font='18px Proof';
 for(let i=0;i<times.length;i++){const t=times[i];current.scene.render(t,{introDuration:10});const bytes=current.canvas.toBuffer('image/png');await fs.writeFile(path.join(out,'frame-'+String(t).replace('.','-')+'.png'),bytes);const snap=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=bytes;});const x=i%2*640,y=Math.floor(i/2)*436;g.fillText(t+' s',x+12,y+25);g.drawImage(snap,x,y+36,640,396);}
 await sharp(sheet.toBuffer('image/png')).jpeg({quality:92}).toFile(path.join(out,'sequence.jpg'));
 for(const e of [old,current]){e.scene.enabled.clear();e.scene.manifest.layers.filter(l=>!e.scene.isMoving(l)).forEach(l=>e.scene.enabled.add(l.id));e.scene.render(1.65,{introDuration:10});}
 const compare=createCanvas(1280,840),c=compare.getContext('2d');c.fillStyle='#f8ebd1';c.fillRect(0,0,1280,840);c.fillStyle='#354535';c.font='22px Proof';c.fillText('Trước: đường núi lặp, lệch nhau',20,30);c.fillText('Sau: các nét núi giữ khớp',660,30);c.drawImage(old.canvas,0,0,640,793,0,45,640,793);c.drawImage(current.canvas,0,0,640,793,640,45,640,793);await fs.writeFile(path.join(out,'mountains-before-after.png'),compare.toBuffer('image/png'));
 console.log(JSON.stringify({frames:times.length,comparison:'mountains-before-after.png'}));
})().catch(e=>{console.error(e);process.exitCode=1;});
