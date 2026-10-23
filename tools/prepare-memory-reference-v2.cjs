const fs=require('node:fs/promises'),path=require('node:path');
const sharp=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'assets/goi-viet/memory-reference-v2'),out=path.join(root,'verification/memory-reference-v2');
(async()=>{
 await fs.mkdir(path.join(dir,'sources'),{recursive:true});await fs.mkdir(out,{recursive:true});
 await fs.copyFile('C:/Users/Uy/AppData/Local/Temp/codex-clipboard-7bd0ed66-6308-4ca1-b4a0-3919f1e8fe0a.png',path.join(dir,'sources/official-reference.png'));
 await fs.copyFile('C:/Users/Uy/.codex/generated_images/01a14fd7-ebf8-7d13-aaf9-532e7b6605fb/exec-74e339ff-4f93-492e-9fdc-c1fd0b60e8c3.png',path.join(dir,'sources/clean-plate-original.png'));
 await sharp(path.join(dir,'sources/clean-plate-original.png')).resize(971,1619,{fit:'fill'}).png().toFile(path.join(dir,'sources/clean-plate.png'));
 for(const [name,rect]of [['taste',[0,270,450,410]],['gate',[520,110,451,340]],['weaving',[390,480,460,260]],['tea',[0,710,420,455]],['cards',[495,730,420,405]],['exit',[0,1200,971,419]]]){
  const [x,y,w,h]=rect;
  const grid=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${Array.from({length:Math.ceil(w/50)},(_,i)=>`<path d="M${i*50} 0V${h}" stroke="#e02d54" opacity=".55"/><text x="${i*50+2}" y="14" fill="#e02d54" font-size="12">${x+i*50}</text>`).join('')}${Array.from({length:Math.ceil(h/50)},(_,i)=>`<path d="M0 ${i*50}H${w}" stroke="#e02d54" opacity=".55"/><text x="2" y="${i*50+12}" fill="#e02d54" font-size="12">${y+i*50}</text>`).join('')}</svg>`);
  await sharp(path.join(dir,'sources/official-reference.png')).extract({left:x,top:y,width:w,height:h}).composite([{input:grid}]).png().toFile(path.join(out,name+'-grid.png'));
 }
 console.log(dir);
})().catch(e=>{console.error(e);process.exitCode=1;});
