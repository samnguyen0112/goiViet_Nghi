"""One-time migration; reads the saved originals, never the cultural app script."""
from pathlib import Path
import json

root = Path(__file__).resolve().parent.parent
backup = root / 'verification/homepage-editable-20261012'
page = (backup / 'index.html.before').read_text(encoding='utf-8')
start = page.index('    <!-- STAGE 1: Continuous native scene;')
end = page.index('    <!-- STAGE 2: WALKTHROUGH GUIDE', start)
welcome = '''    <!-- TRANG CHỦ: chỉnh nội dung chữ/nút tại đây; phong cảnh và chuyển động ở lớp riêng. -->
    <div id="introWelcomeStage">
      <div id="homeClipFilm" class="gv-home-film" data-clip-ready="false" data-clip-status="idle" aria-hidden="true">
        <div class="gv-home-scene-plane">
          <picture>
            <source media="(min-resolution: 1.5dppx) and (min-width: 1000px), (min-width: 2200px)" srcset="assets/goi-viet/homepage-landscape-4k.webp">
            <img class="gv-home-poster" src="assets/goi-viet/homepage-landscape.webp" width="1920" height="1189" alt="" fetchpriority="high">
          </picture>
          <canvas id="homeSceneCanvas" width="1920" height="1189"></canvas>
        </div>
      </div>

      <div class="gv-home-content">
        <header class="gv-home-header">
          <div id="homeLogoEffect" class="gv-home-logo">
            <img src="assets/goi-viet/homepage-logo.png" width="1156" height="530" alt="Gói Việt">
          </div>
          <p class="gv-home-verse">
            <span>“Một đoàn tàu đi dọc ba miền đất nước</span>
            <span>Mỗi tỉnh thành là một ga dừng nghỉ để cả nhà cùng nghe chuyện xưa và sẻ chia ký ức.”</span>
          </p>
          <p id="homeStationHint" class="gv-home-station-hint">Chọn một ga để bắt đầu hành trình</p>
          <nav class="gv-home-stations" aria-label="Khám phá ba miền" aria-describedby="homeStationHint">
            <button type="button" id="btnHomeStationNorth" class="gv-home-station gv-home-interactive" onclick="selectDemoPlace('hn',true);closeIntroModal()">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 12 7 12s7-7 7-12a7 7 0 0 0-7-7Zm0 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" fill="currentColor"/></svg>
              <span>Ga miền Bắc <span aria-hidden="true">·</span> <strong>Hà Nội</strong></span>
              <span class="gv-home-station-arrow" aria-hidden="true">↗</span>
            </button>
            <button type="button" id="btnHomeStationCentral" class="gv-home-station gv-home-interactive" onclick="selectDemoPlace('hue',true);closeIntroModal()">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 12 7 12s7-7 7-12a7 7 0 0 0-7-7Zm0 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" fill="currentColor"/></svg>
              <span>Ga miền Trung <span aria-hidden="true">·</span> <strong>Cố đô Huế</strong></span>
              <span class="gv-home-station-arrow" aria-hidden="true">↗</span>
            </button>
            <button type="button" id="btnHomeStationSouth" class="gv-home-station gv-home-interactive" onclick="selectDemoPlace('hcm',true);closeIntroModal()">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 12 7 12s7-7 7-12a7 7 0 0 0-7-7Zm0 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" fill="currentColor"/></svg>
              <span>Ga miền Nam <span aria-hidden="true">·</span> <strong>TP.HCM</strong></span>
              <span class="gv-home-station-arrow" aria-hidden="true">↗</span>
            </button>
          </nav>
        </header>

        <div class="gv-home-landscape-space" aria-hidden="true"></div>

        <article id="homepageContent" class="gv-home-invitation" aria-labelledby="homepageHeading">
          <p class="gv-home-kicker"><span aria-hidden="true">🚂</span> Sân ga đoàn viên · Lời mời khởi hành xuyên Việt</p>
          <h2 id="homepageHeading">Cùng gia đình khám phá văn hóa Việt Nam</h2>
          <div class="gv-home-description">
            <p>Chọn một địa điểm, đọc câu chuyện và rút lá bài để cùng chia sẻ kỷ niệm.</p>
            <p>Cả nhà dùng chung một thiết bị, không cần đăng nhập.</p>
          </div>
          <ul class="gv-home-features" aria-label="Trải nghiệm Gói Việt">
            <li><span aria-hidden="true">🏛️</span> 36 ga dừng di sản &amp; hải đảo</li>
            <li><span aria-hidden="true">📕</span> Thẻ bài văn hóa &amp; lắng nghe 60 giây</li>
            <li><span aria-hidden="true">❤️</span> Chơi chung 1 thiết bị · Không chấm điểm</li>
          </ul>
          <div class="gv-home-actions">
            <button type="button" id="btnQuickStartWelcome" class="gv-home-start gv-home-interactive" onclick="closeIntroModal()">Bắt đầu khám phá <span aria-hidden="true">→</span></button>
            <button type="button" id="btnProceedToGuide" class="gv-home-guide gv-home-interactive" onclick="advanceToIntroGuideStage()">Xem cách chơi</button>
          </div>
        </article>
        <div class="gv-home-load-notice">
          <button type="button" id="btnHomeClipRetry" aria-describedby="homeClipStatus" hidden>Thử tải lại chuyển động</button>
          <p id="homeClipStatus" class="sr-only" role="status" aria-live="polite"></p>
        </div>
      </div>
    </div>

'''
page = page[:start] + welcome + page[end:]
page = page.replace('href="assets/goi-viet/homepage-native.css"', 'href="assets/goi-viet/homepage-content.css"').replace('src="assets/goi-viet/homepage-native.js"', 'src="assets/goi-viet/homepage-content.js"')
(root / 'index.html').write_text(page, encoding='utf-8')

# Keep the wind shader, bird mesh/flight, floating particles and smoke algorithm.
# Only the backing image and its composition change; it carries no typography.
old = (backup / 'homepage-scene.js.before').read_text(encoding='utf-8')
motion = old[old.index(' // Keep birds, leaves and smoke animated'):old.index(' let frames=0,logoRaised=false,lastTime=0;')]
motion = motion.replace("const chimneyX=404,chimneyY=466;", "const [chimneyX,chimneyY]=layout.chimney;")
scene = '''// Landscape renderer only. Visible content and the brand are independent HTML layers.
(() => {
 const layout=window.GoiVietHomeLayout;
 const SX=layout.width/layout.designWidth;
 const scriptBase=new URL('.',document.currentScript.src);
 let sources=null,sourceLoad=null;
 function loadSources(){
  if(sources)return Promise.resolve(sources);
  if(sourceLoad)return sourceLoad;
  sourceLoad=new Promise((resolve,reject)=>{
   const script=document.createElement('script');let settled=false;
   const finish=error=>{
    if(settled)return;settled=true;
    script.onload=script.onerror=null;clearTimeout(timeout);script.remove();sourceLoad=null;
    if(error){reject(error);return;}
    const loaded=window.GoiVietHomeSceneAssets;delete window.GoiVietHomeSceneAssets;
    if(!loaded||!['landscape.webp','crane.webp','leaf.webp','petal.webp'].every(name=>typeof loaded[name]==='string'&&loaded[name].startsWith('data:image/'))){reject(new Error('Thiếu lớp phong cảnh'));return;}
    sources=loaded;resolve(sources);
   };
   const timeout=setTimeout(()=>finish(new Error('Tải phong cảnh quá lâu')),45000);
   script.onload=()=>finish();script.onerror=()=>finish(new Error('Không tải được lớp phong cảnh'));
   const high=matchMedia('(min-resolution: 1.5dppx) and (min-width: 1000px), (min-width: 2200px)').matches;
   script.src=new URL(high?layout.highResolutionBundle:layout.bundle,scriptBase).href;
   document.head.append(script);
  });return sourceLoad;
 }
 const loadImage=(src,label)=>new Promise((resolve,reject)=>{
  const image=new Image();
  const timeout=setTimeout(()=>{image.onload=image.onerror=null;reject(new Error('Tải quá lâu: '+label));},45000);
  image.onload=()=>{clearTimeout(timeout);resolve(image);};
  image.onerror=()=>{clearTimeout(timeout);reject(new Error('Không tải được '+label));};image.src=src;
 });
 function surface(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
 window.GoiVietHomeScene={async create(canvas){
 const W=layout.designWidth,H=layout.designHeight,DURATION=layout.duration,FPS=layout.fps;
 const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw new Error('Không dựng được tranh động');
 const assetSources=await loadSources();
 const [plate,crane,leaf,petal]=await Promise.all(['landscape.webp','crane.webp','leaf.webp','petal.webp'].map(name=>loadImage(assetSources[name],name))).catch(error=>{sources=null;throw error;});
 let mode='canvas2d',resizeBackdrop=()=>{};
 let drawBackdrop=()=>ctx.drawImage(plate,0,0,W,H);
'''+motion+'''
 let frames=0,lastTime=0,prepared=false;
 const metadata={width:canvas.width,height:canvas.height,sourceWidth:plate.naturalWidth,sourceHeight:plate.naturalHeight,designWidth:W,designHeight:H,duration:DURATION,fps:FPS};
 const renderFrame=t=>{
  t=((t%DURATION)+DURATION)%DURATION;lastTime=t;
  ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);ctx.imageSmoothingQuality='high';
  drawBackdrop(t);drawTrainSmoke(t);floating(t);drawBird(t,0);drawBird(t,1);
  ctx.setTransform(1,0,0,1,0,0);frames++;
 };
 const setResolution=(width,height)=>{
  const scale=Math.min(1,width/plate.naturalWidth,height/plate.naturalHeight);
  width=Math.max(1,Math.round(plate.naturalWidth*scale));height=Math.max(1,Math.round(plate.naturalHeight*scale));
  if(prepared&&canvas.width===width&&canvas.height===height)return;
  canvas.width=width;canvas.height=height;resizeBackdrop(width,height);prepareBirds(width/W);prepared=true;
  metadata.width=width;metadata.height=height;renderFrame(lastTime);
 };
 setResolution(canvas.width,canvas.height);
 return {renderFrame,setResolution,metadata,get frames(){return frames;},get mode(){return mode;},get cachedBirdFrames(){return birds.reduce((n,b)=>n+b.cachedFrames,0);}};
 }};
})();
'''
(root / 'assets/goi-viet/homepage-scene.js').write_text(scene, encoding='utf-8')
layout = dict(width=3840,height=2378,designWidth=1594,designHeight=987,duration=24,fps=30,
              chimney=[545,485],bundle='homepage-landscape-assets.js',highResolutionBundle='homepage-landscape-assets-4k.js')
(root / 'assets/goi-viet/homepage-scene-layout.js').write_text('// Landscape coordinates; content layout belongs to CSS.\nwindow.GoiVietHomeLayout=Object.freeze('+json.dumps(layout,indent=2)+');\n', encoding='utf-8')
print('Separated homepage markup and landscape composition. Cultural application script untouched.')
