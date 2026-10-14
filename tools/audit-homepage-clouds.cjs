const fs=require('node:fs/promises'),path=require('node:path');
const deps='C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const {createCanvas,Image,GlobalFonts}=require(deps+'/@napi-rs/canvas');
const root=path.resolve(__dirname,'..'),lab=path.join(root,'exports/landscape-layers-lab-20261012'),out=path.join(root,'verification/cloud-refinement-20261014');
GlobalFonts.registerFromPath('C:/Windows/Fonts/arial.ttf','Proof');
(async()=>{await fs.mkdir(out,{recursive:true});const m=JSON.parse(await fs.readFile(path.join(lab,'assets/manifest.json'),'utf8'));
const sheet=createCanvas(1440,6*240),g=sheet.getContext('2d');g.font='18px Proof';
for(const [i,l]of m.layers.filter(l=>l.kind==='cloud').entries()){
 const x=i%3*480,y=Math.floor(i/3)*240;g.fillStyle='#193f34';g.fillRect(x,y,480,240);g.fillStyle='#f8ecd3';g.fillText(l.id+' · '+l.cloudType,x+12,y+25);
 for(let sy=0;sy<180;sy+=12)for(let sx=0;sx<456;sx+=12){g.fillStyle=(sx/12+sy/12)%2?'#b7c4ba':'#e0e5da';g.fillRect(x+12+sx,y+42+sy,12,12);}
 const im=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=path.join(lab,l.png);});
 const s=Math.min(438/im.width,170/im.height);g.drawImage(im,x+24+(438-im.width*s)/2,y+48+(170-im.height*s)/2,im.width*s,im.height*s);
 await fs.copyFile(path.join(lab,l.png),path.join(out,l.id+'.before.png'));
}
await fs.writeFile(path.join(out,'all-clouds-before.png'),sheet.toBuffer('image/png'));await fs.copyFile(path.join(lab,'assets/manifest.json'),path.join(out,'manifest.before.json'));await fs.copyFile(path.join(lab,'scene.js'),path.join(out,'scene.before.js'));console.log('Saved 18 cloud assets and audit sheet.');
})().catch(e=>{console.error(e);process.exitCode=1;});
