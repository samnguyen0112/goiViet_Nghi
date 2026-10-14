const fs=require('node:fs/promises'),path=require('node:path');
const root=path.resolve(__dirname,'..'),lab=path.join(root,'exports/landscape-layers-lab-20261012');
(async()=>{
 const file=path.join(lab,'assets/manifest.json'),m=JSON.parse(await fs.readFile(file,'utf8'));
 m.ambientEntry=require(path.join(lab,'tools/ambient-entry.cjs')).applyAmbientEntry({layers:m.layers,H:m.height});
 m.spriteFraming=require(path.join(lab,'tools/sprite-framing.cjs')).applySpriteFraming({layers:m.layers,H:m.height});m.motionDefaults.leaves=m.ambientEntry.leaves;
 for(const ext of ['png','webp'])await fs.copyFile(path.join(lab,'assets/leaf-three.'+ext),path.join(lab,'assets/leaf-nine.'+ext));
 const bundle={};for(const f of new Set([...m.layers.map(l=>l.file),m.reference,m.outline])){const b=await fs.readFile(path.join(lab,f));bundle[f]='data:image/'+(f.endsWith('.png')?'png':'webp')+';base64,'+b.toString('base64');}
 await fs.writeFile(file,JSON.stringify(m,null,2));await fs.writeFile(path.join(lab,'assets/manifest.js'),'window.LandscapeManifest='+JSON.stringify(m)+';\n');await fs.writeFile(path.join(lab,'assets/bundle.js'),'window.LandscapeAssets='+JSON.stringify(bundle)+';\n');
 for(const name of ['index.html','map-surroundings-preview.html','assets/goi-viet/homepage-layered-scene.js','exports/landscape-layers-lab-20261012/index.html']){
  const p=path.join(root,name),s=await fs.readFile(p,'utf8');await fs.writeFile(p,s.replaceAll('cranes-leaves-v12','gentle-cranes-v13').replaceAll('staggered-depth-v9','gentle-cranes-v13'));
 }
 const readme=path.join(lab,'README.md');let s=await fs.readFile(readme,'utf8');s=s.split('\n## Cò vào cảnh chậm hơn')[0];
 s+='\n## Cò vào cảnh chậm hơn\n\nCò bắt đầu từ hai mép bằng cùng đường bay liên tục, bỏ dịch chuyển vào cảnh thứ hai từng cộng dồn tốc độ. Tốc độ ban đầu bằng 65% tốc độ thường và tăng mềm trong 4,5 giây; khoảng thời gian tích lũy được giữ khi hết intro, không giật vị trí hay tốc độ. Kích thước cò và lá vẫn lớn hơn 15%, đường bay vẫn hạ 50 pixel thiết kế. Đã thêm một lá có pha và đường rơi riêng: 8 → 9 lá xanh, tăng 12,5%, là mức nguyên lá gần nhất với yêu cầu khoảng 15%. Bộ có 64 layer.\n';await fs.writeFile(readme,s);
 console.log(JSON.stringify({layers:m.layers.length,...m.ambientEntry}));
})().catch(e=>{console.error(e);process.exitCode=1;});
