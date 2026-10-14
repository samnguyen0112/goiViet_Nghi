const fs=require('node:fs/promises'),path=require('node:path');
const root=path.resolve(__dirname,'..'),lab=path.join(root,'exports/landscape-layers-lab-20261012'),out=path.join(root,'verification/cranes-leaves-size-20261014');
(async()=>{
 const file=path.join(lab,'assets/manifest.json'),m=JSON.parse(await fs.readFile(file,'utf8'));
 m.spriteFraming=require(path.join(lab,'tools/sprite-framing.cjs')).applySpriteFraming({layers:m.layers,H:m.height});
 await fs.writeFile(file,JSON.stringify(m,null,2));await fs.writeFile(path.join(lab,'assets/manifest.js'),'window.LandscapeManifest='+JSON.stringify(m)+';\n');
 for(const name of ['index.html','map-surroundings-preview.html','assets/goi-viet/homepage-layered-scene.js','exports/landscape-layers-lab-20261012/index.html']){
  const p=path.join(root,name),s=await fs.readFile(p,'utf8');await fs.writeFile(p,s.replaceAll('cloud-restored-v11','cranes-leaves-v12').replaceAll('staggered-depth-v9','cranes-leaves-v12'));
 }
 const p=path.join(lab,'README.md');let s=await fs.readFile(p,'utf8');s=s.split('\n## Kích thước cò và lá')[0];
 s+='\n## Kích thước cò và lá\n\nHai cò được tăng chiều rộng và chiều cao 15% và hạ toàn bộ đường bay khoảng 50 pixel trong hệ tọa độ thiết kế 1594 × 987. Cò được tăng quanh tâm dọc, giữ tỷ lệ sprite và nhịp vỗ cánh. Tám lá xanh tăng kích thước 15% quanh tâm đang rơi, giữ đường rơi và tốc độ. Mười cánh hoa giữ kích thước hiện có. Trang chủ, map-surroundings-preview.html và bản Canvas độc lập dùng cùng metadata; bộ PNG/WebP gốc không đổi.\n';await fs.writeFile(p,s);
 await fs.writeFile(path.join(out,'framing.json'),JSON.stringify(m.layers.filter(l=>l.spriteFraming).map(l=>({id:l.id,rect:l.rect,...l.spriteFraming})),null,2));console.log(JSON.stringify(m.spriteFraming));
})().catch(e=>{console.error(e);process.exitCode=1;});
