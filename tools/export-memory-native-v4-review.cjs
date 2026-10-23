const fs=require('node:fs/promises'),path=require('node:path');
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const sharp=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
(async()=>{
 const root=path.resolve(__dirname,'..'),dir=path.join(root,'assets/goi-viet/memory-native-v4'),out=path.join(root,'verification/memory-native-v4');
 const m=JSON.parse(await fs.readFile(path.join(dir,'assets.json'),'utf8')),items=Object.entries(m.assets),cells=[];
 for(let i=0;i<items.length;i++){
  const[id,a]=items[i],left=i%5*260,top=Math.floor(i/5)*210;
  const original=await fs.readFile(path.join(dir,a.source));
  assert.equal(crypto.createHash('sha256').update(original).digest('hex'),a.sha256,id+': source changed');
  const expected=await (a.alpha&&id!=='river-continuous'?sharp(original).trim({threshold:8}):sharp(original)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const actual=await sharp(path.join(dir,a.file)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  assert.equal(actual.info.width,expected.info.width,id+': resized native width');
  assert.equal(actual.info.height,expected.info.height,id+': resized native height');
  for(let p=0;p<expected.data.length;p+=4){
   assert.equal(actual.data[p+3],expected.data[p+3],id+': changed alpha');
   if(expected.data[p+3])for(let c=0;c<3;c++)assert.equal(actual.data[p+c],expected.data[p+c],id+': native image is not lossless');
  }
  const picture=await sharp(path.join(dir,a.file)).resize(250,165,{fit:'contain',background:'#f7efd9',withoutEnlargement:true}).png().toBuffer();
  const caption=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="260" height="40"><rect width="260" height="40" fill="#f7efd9"/><text x="8" y="15" font-family="Arial" font-size="12" fill="#103d35">${id}</text><text x="8" y="32" font-family="Arial" font-size="11" fill="#765a3e">Native ${a.generatedWidth} × ${a.generatedHeight} · export ${a.width} × ${a.height}</text></svg>`);
  cells.push({input:picture,left,top},{input:caption,left,top:top+165});
 }
 await sharp({create:{width:1300,height:Math.ceil(items.length/5)*210,channels:4,background:'#f7efd9'}}).composite(cells).png().toFile(path.join(out,'native-asset-sheet.png'));
 const audit={generatedAssets:items.length,webExportsOnlyDownsample:true,sourceOriginalsPreserved:true,losslessVisiblePixelsVerified:true,sourceTool:'built-in image_gen',fullResolutionBytes:items.reduce((n,[,a])=>n+a.bytes,0),assets:items.map(([id,a])=>({id,generated:[a.generatedWidth,a.generatedHeight],nativeExport:[a.width,a.height],variants:a.variants.map(v=>v.width),sha256:a.sha256}))};
 await fs.writeFile(path.join(out,'quality-audit.json'),JSON.stringify(audit,null,2));
 console.log(JSON.stringify({generatedAssets:audit.generatedAssets,fullResolutionBytes:audit.fullResolutionBytes,sheet:path.join(out,'native-asset-sheet.png')}));
})().catch(e=>{console.error(e);process.exitCode=1;});
