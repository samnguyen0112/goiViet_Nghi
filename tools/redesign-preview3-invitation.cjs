const fs=require('node:fs/promises'),path=require('node:path');
(async()=>{
 const root=path.resolve(__dirname,'..'),file=path.join(root,'map-surroundings-preview-3.html');
 let html=await fs.readFile(file,'utf8');
 const old=html.match(/        <article id="homepageContent"[\s\S]*?<\/article>/)?.[0];
 if(!old)throw Error('Invitation missing');
 const primary=old.match(/<button\b[^>]*id="btnQuickStartWelcome"[\s\S]*?<\/button>/)[0].replace('<span aria-hidden="true">→</span>','<svg viewBox="0 0 24 16" fill="none" aria-hidden="true"><path d="M1 8h21m-6-6 6 6-6 6"/></svg>');
 const guide=old.match(/<button\b[^>]*id="btnProceedToGuide"[\s\S]*?<\/button>/)[0];
 const icon=paths=>`<span class="invite-feature-mark" aria-hidden="true"><svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">${paths}</svg></span>`;
 const pagoda=icon('<path d="M6 32h28M9 29h22M12 26V15m16 11V15M9 15h22L20 9 9 15ZM6 12c6 0 10-3 14-7 4 4 8 7 14 7M15 20h10M17 26v-6m6 6v-6M20 5V2"/>');
 const cards=icon('<rect x="9" y="8" width="21" height="27" rx="3"/><path d="m9 29-4-1 3-23a3 3 0 0 1 3-2l18 2M19.5 14c-2 4-5 5-5 8a5 5 0 0 0 10 0c0-3-3-4-5-8ZM16 30h7"/>');
 const family=icon('<circle cx="20" cy="12" r="4"/><circle cx="9" cy="17" r="3"/><circle cx="31" cy="17" r="3"/><path d="M13 29v-4a7 7 0 0 1 14 0v4M4 29v-3a5 5 0 0 1 7-5m18 0a5 5 0 0 1 7 5v3M9 32c4 4 7 6 11 7 4-1 7-3 11-7"/>');
 const train='<svg class="invite-train" viewBox="0 0 32 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 15h24v-9H13v9M4 15V9h9M8 9V4h4v5M16 9h3m3 0h3M3 20h26M4 18h24"/><circle cx="9" cy="16" r="3"/><circle cx="23" cy="16" r="3"/><path d="M6 4c-2-1 0-3 2-2"/></svg>';
 const article=`        <article id="homepageContent" class="gv-home-invitation gv-invitation-redesign" data-home-enter="7.8,9,16" aria-labelledby="homepageHeading">
          <svg class="invite-landscape" viewBox="0 0 1000 260" fill="none" aria-hidden="true" preserveAspectRatio="none"><path d="M0 245Q35 195 57 219T107 214Q139 166 171 223T255 248M755 252Q798 202 817 226T866 218Q907 151 940 212T1000 193M0 257Q67 224 110 247T240 260M790 260Q850 237 883 248T1000 226"/></svg>
          <div class="invite-card-main">
            <div class="invite-card-message">
              <p class="gv-home-kicker" data-home-enter="8.25,9.2,7">${train}<span>Sân ga đoàn viên <span class="invite-kicker-dot" aria-hidden="true">·</span> Lời mời khởi hành xuyên Việt</span></p>
              <h2 id="homepageHeading" data-home-enter="8.57,9.52,7">Cùng gia đình khám phá văn hóa Việt Nam</h2>
              <div class="gv-home-description" data-home-enter="8.89,10.16,7"><p>Chọn một địa điểm, đọc câu chuyện và rút lá bài để cùng chia sẻ kỷ niệm.</p><p>Cả nhà dùng chung một thiết bị, không cần đăng nhập.</p></div>
            </div>
            <ul class="gv-home-features" data-home-enter="9.3,10.5,7" aria-label="Trải nghiệm Gói Việt">
              <li>${pagoda}<span class="invite-feature-text"><strong>36 điểm hẹn di sản</strong><small>34 tỉnh thành &amp; 2 quần đảo</small></span></li>
              <li>${cards}<span class="invite-feature-text"><strong>Lật thẻ, mở chuyện Việt</strong><small>Một phút sẻ chia và lắng nghe</small></span></li>
              <li>${family}<span class="invite-feature-text"><strong>Cả nhà chung hành trình</strong><small>Chung một thiết bị · Không chấm điểm</small></span></li>
            </ul>
          </div>
          <div class="gv-home-actions">${primary}${guide}</div>
        </article>`;
 html=html.replace(old,article);
 if(!html.includes('invitation-card-3.css'))html=html.replace('</head>','<link rel="stylesheet" href="assets/goi-viet/map-surroundings-preview/invitation-card-3.css?v=20261019-13">\n</head>');
 await fs.writeFile(file,html);
})().catch(e=>{console.error(e);process.exitCode=1;});
