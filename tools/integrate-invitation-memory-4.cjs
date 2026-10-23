const fs=require('node:fs/promises'),path=require('node:path');
const root=path.resolve(__dirname,'..');
(async()=>{
 const file=path.join(root,'map-surroundings-preview-3.html');
 let html=await fs.readFile(file,'utf8');
 const old=html.match(/        <article id="homepageContent"[\s\S]*?<\/article>/)?.[0];
 if(!old)throw Error('Missing existing invitation');
 if(!old.includes('gv-memory-invitation'))await fs.writeFile(path.join(root,'verification/invitation-memory-4/before.html'),old);
 const icons=[...old.matchAll(/<span class="invite-feature-mark"[\s\S]*?<\/svg><\/span>/g)].map(m=>m[0]);
 if(icons.length!==3)throw Error('Expected the three original feature icons');
 const primary=old.match(/<button\b[^>]*id="btnQuickStartWelcome"[\s\S]*?<\/button>/)?.[0];
 if(!primary)throw Error('Missing primary action');
 const button=primary.replace(/>[^<]*<svg/,'>Mở câu chuyện đầu tiên <svg');
 const cue=html.match(/<button\b[^>]*class="mc-scroll-cue[^\"]*"[\s\S]*?<\/button>/)?.[0];
 if(!cue)throw Error('Missing chapter scroll cue');
 let next=cue.replace(/class="[^"]*"/,'class="mc-scroll-cue im4-next-cue"');
 if(!next.includes('aria-label='))next=next.replace('<button ','<button aria-label="Mở miền ký ức" ');
 next=next.replace('<span aria-hidden="true">↓</span>','<svg viewBox="0 0 24 32" fill="none" aria-hidden="true"><path d="M12 3v25m-7-7 7 7 7-7"/></svg>');
 const a='assets/goi-viet/invitation-memory-4/';
 const layers=['mountains-right','river-bottom','jasmine-left'].map(id=>`<img class="im4-art im4-${id}" src="${a+id}.webp" alt="" decoding="async">`).join('\n            ');
 const frame=['tl','top','tr','left','right','bl','bottom','br'].map(id=>`<img class="im4-frame-${id}" src="${a}frame-${id}.webp" alt="" decoding="async">`).join('');
 const cards=[['meal','Bữa cơm nhà bên cửa sổ, với canh rau và cá kho.'],['grandmother','Bà kể chuyện cho cháu bên hiên nhà.']].map(([id,alt])=>`<img class="im4-card im4-card-${id}" src="${a}card-${id}.webp" width="${id==='meal'?400:368}" height="${id==='meal'?544:504}" alt="${alt}" decoding="async">`).join('\n              ');
 const feature=[['Chọn miền thân quen','Bắt đầu từ một nơi bạn nhớ'],['Lật một lá bài nhỏ','Gợi một món ăn, một chuyện cũ'],['Kể chuyện nhà mình','Cùng sẻ chia, cùng lắng nghe']].map(([title,sub],i)=>`<li>${icons[i]}<span class="invite-feature-text"><strong>${title}</strong><small>${sub}</small></span></li>`).join('\n            ');
 const article=`        <article id="homepageContent" class="gv-home-invitation gv-invitation-redesign gv-memory-invitation" data-home-enter="7.8,9,16" aria-labelledby="homepageHeading">
          <div class="im4-world" aria-hidden="true">${layers}</div>
          <div class="im4-frame" aria-hidden="true">${frame}</div>
          <div class="im4-main">
            <div class="im4-message">
              <p class="gv-home-kicker" data-home-enter="8.25,9.2,7">Gói tinh hoa <span aria-hidden="true">·</span> Mở kết nối</p>
              <h2 id="homepageHeading" class="im4-heading" data-home-enter="8.57,9.52,7"><span class="sr-only">Có những điều, gợi là nhớ.</span><span class="im4-lettering" aria-hidden="true"><img class="im4-title-first" src="${a}title-first.svg" width="812" height="149" alt=""><img class="im4-title-memory" src="${a}title-memory.svg" width="718" height="171" alt=""><img class="im4-ribbon" src="${a}memory-ribbon.svg" width="650" height="48" alt=""></span></h2>
              <p class="gv-home-description" data-home-enter="8.89,10.16,7">Lật một lá bài, cùng nhau kể chuyện quê hương.</p>
              <div class="gv-home-actions">${button}</div>
              <p class="im4-footnote">Cùng gia đình <span aria-hidden="true">·</span> Không cần đăng nhập</p>
            </div>
            <div class="im4-cards" role="group" aria-label="Hai lá bài gợi ký ức gia đình" data-home-enter="8.89,10.16,7">
              ${cards}
            </div>
          </div>
          <div class="im4-footer" data-home-enter="9.3,10.5,7">
          <ul class="gv-home-features" aria-label="Ba bước mở chuyện quê hương">
            ${feature}
          </ul>
          ${next}
          </div>
        </article>`;
 html=html.replace(old,article);
 if(!old.includes(cue))html=html.replace(cue,'');
 const css='<link rel="stylesheet" href="assets/goi-viet/map-surroundings-preview/invitation-memory-4.css?v=20261019-1">';
 if(!html.includes('invitation-memory-4.css'))html=html.replace('</head>',css+'\n</head>');
 html=html.replace(/invitation-memory-4\.css\?v=[^\"]+/,'invitation-memory-4.css?v=20261019-4');
 await fs.writeFile(file,html);
 console.log('Updated preview-3 invitation; existing primary handler and animation timings preserved.');
})().catch(e=>{console.error(e);process.exitCode=1;});
