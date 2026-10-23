const fs=require('node:fs/promises'),path=require('node:path');
const sharp=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
(async()=>{
 const root=path.resolve(__dirname,'..'),dir=path.join(root,'assets/goi-viet/memory-reference-v2'),out=path.join(root,'verification/memory-reference-v2'),m=JSON.parse(await fs.readFile(path.join(dir,'layers.json'),'utf8'));
 await sharp({create:{width:m.width,height:m.height,channels:4,background:'#fcf0d8'}}).composite(m.layers.filter(l=>l.family==='background').map(l=>({input:path.join(dir,l.file),left:l.rect[0],top:l.rect[1]}))).png().toFile(path.join(out,'separated-background.png'));
 const ref=await sharp(path.join(dir,'sources/official-reference.png')).resize(486,810).png().toBuffer(),actual=await sharp(path.join(out,'chapter-native.png')).resize(486,810).png().toBuffer();
 const label=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="988" height="40"><text x="14" y="26" font-family="sans-serif" font-size="16" fill="#194338">OFFICIAL REFERENCE</text><text x="516" y="26" font-family="sans-serif" font-size="16" fill="#194338">IMPLEMENTED PREVIEW 3</text></svg>');
 await sharp({create:{width:988,height:850,channels:4,background:'#f5ecd9'}}).composite([{input:label,left:0,top:0},{input:ref,left:0,top:40},{input:actual,left:502,top:40}]).png().toFile(path.join(out,'reference-comparison.png'));
 const review=JSON.parse(await fs.readFile(path.join(out,'source-review.json'),'utf8')),maxError=Math.max(...review.sourceObjectVerification.map(o=>o.meanAbsoluteRGBError)).toFixed(3).replace('.',',');
 let report=await fs.readFile(path.join(out,'REPORT.md'),'utf8');report=report.replaceAll('59 lớp','60 lớp').replace('32 lớp phong cảnh','33 lớp phong cảnh').replace(/\*\*5,\d+ trên thang 255\*\*/,`**${maxError} trên thang 255**`).replace(/Dung lượng 60 lớp: \*\*[\d.]+ byte\*\*/,`Dung lượng 60 lớp: **${m.layers.reduce((n,l)=>n+l.bytes,0).toLocaleString('de-DE')} byte**`);await fs.writeFile(path.join(out,'REPORT.md'),report);
})().catch(e=>{console.error(e);process.exitCode=1;});
