const fs=require('node:fs/promises'),path=require('node:path');
(async()=>{
 const root=path.resolve(__dirname,'..'),file=path.join(root,'map-surroundings-preview-3.html');
 let html=await fs.readFile(file,'utf8');
 if(html.includes('id="homepageContent"'))throw Error('Invitation already restored');
 const original=await fs.readFile(path.join(root,'map-surroundings-preview.html'),'utf8');
 let article=original.match(/        <article id="homepageContent"[\s\S]*?<\/article>/)[0];
 article=article.replace('onclick="closeIntroModal()"','onclick="window.GoiVietMemoryChapter.begin()"').replace('onclick="advanceToIntroGuideStage()"','onclick="document.getElementById(\'homeGuideDialog\').showModal()"');
 html=html.replace(/          <button type="button" id="btnQuickStartWelcome"[\s\S]*?<\/button>\r?\n/,'');
 const cue=html.match(/        <(?:a|button)\b[^>]*class="mc-scroll-cue"[\s\S]*?<\/(?:a|button)>/)[0];
 html=html.replace(cue,article);
 const dialog=`    <dialog id="homeGuideDialog" class="home-guide-dialog" aria-labelledby="homeGuideTitle">
      <form method="dialog"><button class="home-guide-close" aria-label="Đóng hướng dẫn">×</button></form>
      <p class="home-guide-kicker">Cả nhà cùng chơi · Không chấm điểm</p>
      <h2 id="homeGuideTitle">Cách chơi trong 3 bước</h2>
      <ol><li><strong>Chọn điểm đến</strong><p>Chọn một địa điểm trên bản đồ để mở câu chuyện văn hóa.</p></li><li><strong>Đọc chuyện, lật thẻ</strong><p>Cùng khám phá câu hỏi và chọn một lá bài gợi chuyện.</p></li><li><strong>Sẻ chia một kỷ niệm</strong><p>Mỗi người kể một điều mình nhớ. Cả nhà lắng nghe và tiếp tục hành trình.</p></li></ol>
      <button type="button" class="home-guide-begin" onclick="document.getElementById('homeGuideDialog').close();window.GoiVietMemoryChapter.begin()">Bắt đầu khám phá →</button>
    </dialog>
`;
 html=html.replace('<div class="mc-seam"',cue+'\n'+dialog+'\n<div class="mc-seam"');
 html=html.replace('</head>','<link rel="stylesheet" href="assets/goi-viet/map-surroundings-preview/home-invitation-3.css?v=20261019-11">\n</head>');
 html=html.replaceAll('20261019-birds-10','20261019-invitation-11').replaceAll('birds-20261019-10','invitation-20261019-11').replace('60fps-20261018','invitation-focus-20261019-11');
 await fs.writeFile(file,html);
})().catch(e=>{console.error(e);process.exitCode=1;});
