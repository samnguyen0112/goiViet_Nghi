const fs=require('node:fs/promises'),path=require('node:path');
const root=path.resolve(__dirname,'..'),lab=path.join(root,'exports/landscape-layers-lab-20261012');
const method='Staggered depth entrance: far, middle and near mountains reveal separately, with overlapping timing and a slight left-right delay. Normalized mist follows visible ownership from real object alpha, conceals foothill contacts and prevents pale seams. All terrain stays registered with a uniform approach limited to 1.8 percent. Bridge, train and architecture dissolve at final coordinates; independent sprites continue ambient motion.';
(async()=>{
  const json=path.join(lab,'assets/manifest.json'),manifest=JSON.parse(await fs.readFile(json,'utf8'));manifest.openingMethod=method;
  await fs.writeFile(json,JSON.stringify(manifest,null,2));await fs.writeFile(path.join(lab,'assets/manifest.js'),'window.LandscapeManifest='+JSON.stringify(manifest)+';\n');
  for(const file of ['index.html','assets/goi-viet/homepage-layered-scene.js','exports/landscape-layers-lab-20261012/index.html','verification/cinematic-opening-20261013/record-preview.html']){
    const p=path.join(root,file),s=await fs.readFile(p,'utf8');await fs.writeFile(p,s.replaceAll('20261013-entry-v7','staggered-depth-v9').replaceAll('seamless-entry-v8','staggered-depth-v9'));
  }
  for(const p of [path.join(root,'tools/update-cinematic-timing.cjs'),path.join(lab,'tools/build-assets.cjs')]){
    const s=await fs.readFile(p,'utf8');await fs.writeFile(p,s.replace(/manifest\.openingMethod='[^']*';/,"manifest.openingMethod='"+method+"';"));
  }
  const opening=path.join(root,'assets/goi-viet/homepage-layered-opening.js');await fs.writeFile(opening,(await fs.readFile(opening,'utf8')).replace('blank paper, registered mountainside entry, fixed bridge dissolve','blank paper, continuous terrain through mist, fixed bridge dissolve'));
  const app=path.join(lab,'app.js');await fs.writeFile(app,(await fs.readFile(app,'utf8')).replace(/\$\('opening'\)\.checked\?'[^']*'/,"$('opening').checked?'Núi xa, núi giữa rồi núi gần hiện nối tiếp, hai bên lệch nhịp nhẹ. Sương che phần tiếp giáp; núi và bờ sông giữ khớp nhau. Cầu hiện tại chỗ. Có thể tạm dừng và tua 0–10 giây để kiểm tra.'"));
  const readme=path.join(lab,'README.md');let s=await fs.readFile(readme,'utf8');
  s=s.replace(/- Mở cảnh bắt đầu bằng nền giấy trống\.[^\r\n]+/,'- Mở cảnh bắt đầu bằng nền giấy trống. Núi xa hiện trước, núi giữa nối vào khi núi xa đã hiện khoảng hai phần ba, rồi núi gần tiếp nối. Hai phía lệch nhau khoảng 0,3 giây. Sương được điều khiển riêng theo phần nhìn thấy của từng asset, lấy từ alpha thật và thứ tự che khuất; phần chân núi và bờ sông luôn khớp tọa độ. Trọng số sương được làm mềm và chuẩn hóa, tránh đường cắt hoặc viền nhạt giữa các tầng. Địa hình tiến vào rất nhẹ bằng tỷ lệ đồng đều tối đa 1,8%, giữ nguyên tỷ lệ hình dáng ngọn núi. Toàn bộ sương mở cảnh tan sau khoảng 5,1 giây. Mây đi ngang theo từng asset, cò bay và vỗ cánh; cây, công trình, lá và hoa vào cảnh theo nhịp. Cầu, tàu và các công trình đứng ở vị trí cuối và hiện mờ rồi rõ. Logo, chữ, ba ga, lời mời và nút giữ nhịp tương đối với phong cảnh; toàn bộ mở cảnh vẫn là 10 giây, nhanh hơn 20% so với bản 12 giây.');
  s=s.replace(/- Núi tiền cảnh và sông mở tại vị trí cuối[^\r\n]+/,'- Trong toàn bộ phần mở cảnh, núi xa, núi giữa, núi gần và sông dùng cùng phép chiếu để giữ liên tục các nét vẽ và đường bờ. Khi phần mở cảnh kết thúc, địa hình đứng yên hoàn toàn. Các PNG/WebP alpha theo đường viền vật thể vẫn được giữ riêng để kiểm tra và điều khiển; sương mở cảnh chỉ là hiệu ứng xem trên Canvas. Khung nội dung được thu gọn trên màn hình thấp để đoàn tàu còn nhìn thấy.');
  await fs.writeFile(readme,s);
  let record=await fs.readFile(path.join(root,'verification/cinematic-opening-20261013/record-preview.html'),'utf8');record=record.replace('Mở cảnh nhanh hơn 20% và chuyển động tiếp nối · 18 giây','Núi xa → núi giữa → núi gần · Nhịp chồng tự nhiên').replace('homepage-opening-refined-fast.webm','homepage-opening-staggered-depth.webm');
  await fs.writeFile(path.join(root,'verification/seamless-landscape-opening/record-preview.html'),record);
  console.log('Updated opening metadata, documentation, preview and cache versions.');
})().catch(e=>{console.error(e);process.exitCode=1;});
