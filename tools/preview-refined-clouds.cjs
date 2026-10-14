const fs=require('node:fs/promises'),path=require('node:path'),vm=require('node:vm');
const deps='C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules',sharp=require(deps+'/sharp'),{createCanvas,Image,GlobalFonts}=require(deps+'/@napi-rs/canvas');
const root=path.resolve(__dirname,'..'),lab=path.join(root,'exports/landscape-layers-lab-20261012'),out=path.join(root,'verification/cloud-refinement-20261014');GlobalFonts.registerFromPath('C:/Windows/Fonts/arial.ttf','Proof');
async function load(bytes){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=bytes;});}
(async()=>{
 const m=JSON.parse(await fs.readFile(path.join(lab,'assets/manifest.json'),'utf8')),old=JSON.parse(await fs.readFile(path.join(out,'manifest.before.json'),'utf8')),bundle=await fs.readFile(path.join(lab,'assets/bundle.js'),'utf8'),scene=await fs.readFile(path.join(lab,'scene.js'),'utf8');
 async function engine(manifest,before=false){const box={window:{},Image,document:{createElement:()=>createCanvas(1,1)}};vm.runInNewContext(bundle,box);if(before)for(const l of manifest.layers.filter(l=>l.kind==='cloud'))box.window.LandscapeAssets[l.file]='data:image/png;base64,'+(await fs.readFile(path.join(out,l.id+'.before.png'))).toString('base64');vm.runInNewContext(scene,box);const canvas=createCanvas(1594,987),engine=await box.window.LandscapeLab.create(canvas,manifest,box.window.LandscapeAssets);return{canvas,engine};}
 const a=await engine(old,true),b=await engine(m);
 for(const t of [1.2,2.25,5,12,36,60]){b.engine.render(t,{introDuration:10});await fs.writeFile(path.join(out,'scene-'+t+'.png'),b.canvas.toBuffer('image/png'));}
 const sheet=createCanvas(1440,6*240),g=sheet.getContext('2d');g.font='18px Proof';
 for(const [i,l]of m.layers.filter(l=>l.kind==='cloud').entries()){const x=i%3*480,y=Math.floor(i/3)*240;g.fillStyle='#193f34';g.fillRect(x,y,480,240);g.fillStyle='#f8ecd3';g.fillText(l.id+' · '+l.cloudType,x+12,y+25);for(let sy=0;sy<180;sy+=12)for(let sx=0;sx<456;sx+=12){g.fillStyle=(sx/12+sy/12)%2?'#b7c4ba':'#e0e5da';g.fillRect(x+12+sx,y+42+sy,12,12);}const im=await load(await fs.readFile(path.join(lab,l.png))),s=Math.min(438/im.width,170/im.height);g.drawImage(im,x+24+(438-im.width*s)/2,y+48+(170-im.height*s)/2,im.width*s,im.height*s);}
 await fs.writeFile(path.join(out,'all-clouds-after.png'),sheet.toBuffer('image/png'));
 const comparison=createCanvas(1600,700),c=comparison.getContext('2d');c.fillStyle='#173a30';c.fillRect(0,0,1600,700);c.fillStyle='#fff1d5';c.font='22px Proof';c.fillText('Trước: mây mang các vết khuyết của vật che',20,30);c.fillText('Sau: đường mây liền nét khi trôi',820,30);
 a.engine.render(12);b.engine.render(12);c.drawImage(a.canvas,0,270,600,480,0,50,800,640);c.drawImage(b.canvas,0,270,600,480,800,50,800,640);await fs.writeFile(path.join(out,'clouds-before-after.png'),comparison.toBuffer('image/png'));
 console.log('Saved whole-scene frames and individual cloud inspection.');
})().catch(e=>{console.error(e);process.exitCode=1;});
