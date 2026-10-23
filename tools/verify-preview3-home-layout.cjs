const fs=require('node:fs/promises'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/home-layout-20261019');
(async()=>{
  await fs.mkdir(out,{recursive:true});
  process.env.TEMP=process.env.TMP=path.join(root,'scratch');
  const box={window:{}};
  vm.runInNewContext(await fs.readFile(path.join(root,'assets/goi-viet/homepage-balanced-3/assets-2k.js'),'utf8'),box);
  const manifest=box.window.GoiVietHomeLayeredData.manifest;
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const reports=[],errors=[];
  try{
    const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
    page.on('pageerror',e=>errors.push(e.message));
    await page.goto(pathToFileURL(path.join(root,'map-surroundings-preview-3.html')).href,{waitUntil:'load'});
    await page.waitForFunction(()=>window.GoiVietHomeIntro&&window.GoiVietMemoryChapter);
    await page.evaluate(async()=>{window.GoiVietHomeIntro.skip();await document.fonts.ready;document.activeElement.blur();});
    for(const [name,width,height] of [['desktop',1440,900],['laptop',1366,768],['wide',1920,1080],['ultrawide',2560,1080],['tablet',820,1180],['mobile',390,844],['compact-mobile',375,667],['small-mobile',320,568],['landscape',844,390],['small-landscape',568,320],['4k',3840,2160]]){
      await page.setViewportSize({width,height});
      await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
      const info=await page.evaluate(m=>{
        const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};};
        const plane=rect('.gv-home-scene-plane');
        const at=id=>plane.y+m.layers.find(l=>l.id===id).rect[1]*plane.height/m.height;
        const poster=document.querySelector('.gv-home-poster');
        return {logo:rect('.gv-home-logo'),tagline:rect('.gv-home-tagline'),heading:rect('.gv-home-lettering'),subtitle:rect('.gv-home-memory-line'),button:rect('#btnQuickStartWelcome'),hero:rect('#introWelcomeStage'),shortcut:rect('.mc-shortcut'),foregroundSun:!!document.querySelector('.gv-home-sun'),posterLoaded:poster.complete&&poster.naturalWidth>0,scrollCue:rect('.mc-scroll-cue'),roof:at('hue'),bridge:at('bridge'),scrollWidth:document.getElementById('introScreen').scrollWidth};
      },manifest);
      await page.screenshot({path:path.join(out,name+'.jpg'),quality:88});
      reports.push({name,width,height,...info});
      console.log(JSON.stringify({name,buttonBottom:info.button.bottom,roof:info.roof,bridge:info.bridge,heroHeight:info.hero.height}));
    }
    await fs.writeFile(path.join(out,'layout.json'),JSON.stringify({reports,errors},null,2));
    for(const r of reports){
      assert(r.scrollWidth<=r.width+1,r.name+': horizontal overflow');
      assert(Math.abs(r.hero.height-r.height)<2,r.name+': hero exceeds viewport');
      const keys=['logo','tagline','heading','subtitle','button'];
      for(let i=0;i<keys.length;i++){
        const a=r[keys[i]];
        assert(a.x>=-1&&a.right<=r.width+1&&a.y>=0&&a.bottom<=r.height,r.name+': clipped '+keys[i]);
        if(i)assert(r[keys[i-1]].bottom<=a.y,r.name+': overlapping copy');
      }
      assert(r.button.bottom<=r.roof-10,r.name+': copy overlaps scenery');
      assert(r.posterLoaded&&!r.foregroundSun,r.name+': landscape poster or obsolete sun overlay');
      for(const key of ['scrollCue']){
        const a=r[key];assert(a.x>=0&&a.right<=r.width&&a.y>=0&&a.bottom<=r.height,r.name+': clipped '+key);
      }
    }
    assert.deepEqual(errors,[]);
    const sun=manifest.layers.find(l=>l.id==='sun');
    assert(sun&&sun.kind==='sky'&&sun.entrance[0]>=2.65,'Sun must arrive after the distant ridges');
    assert(manifest.layers.filter(l=>['mountain','cloud'].includes(l.kind)).every(l=>l.z>sun.z),'Sun must sit behind all mountains and clouds');
    await page.setViewportSize({width:1440,height:900});
    await page.locator('.mc-scroll-cue').focus();
    assert.equal(await page.locator('.mc-scroll-cue').evaluate(el=>getComputedStyle(el).outlineStyle),'solid');
    await page.locator('.mc-scroll-cue').hover();
    await page.screenshot({path:path.join(out,'scroll-hover.jpg'),quality:88});
    await page.locator('.mc-scroll-cue').click();
    await page.waitForFunction(()=>document.activeElement.id==='memoryChapter');
    await page.evaluate(()=>document.getElementById('introScreen').scrollTo({top:0,behavior:'instant'}));
    await page.locator('#btnQuickStartWelcome').click();
    await page.waitForFunction(()=>document.activeElement.id==='memoryChapter');
    console.log('PASS: eleven viewports, sun and copy, scroll cue hover/keyboard/click, start opens memory chapter.');
    await page.close();
    const animated=await browser.newPage({viewport:{width:1440,height:900}});
    animated.on('pageerror',e=>errors.push(e.message));
    await animated.goto(pathToFileURL(path.join(root,'map-surroundings-preview-3.html')).href,{waitUntil:'load'});
    await animated.waitForFunction(()=>window.GoiVietHomeIntro);
    await animated.evaluate(async()=>{await window.GoiVietHomeIntro.ready;await document.fonts.ready;});
    assert.equal(await animated.evaluate(()=>window.GoiVietHomeIntro.getState().failed),false);
    for(const t of [3.5,8,12]){
      await animated.evaluate(t=>{window.GoiVietHomeIntro.seek(t,true);document.activeElement.blur();},t);
      await animated.screenshot({path:path.join(out,'animation-'+t+'.jpg'),quality:88});
    }
    assert.equal(await animated.evaluate(()=>document.getElementById('homeClipFilm').homeScene.native.layerRenderer.manifest.homeComposition.version),3);
    await animated.locator('#btnHomeOpeningReplay').click();
    await animated.waitForFunction(()=>window.GoiVietHomeIntro.getState().phase==='playing');
    await animated.locator('#btnHomeOpeningSkip').click();
    assert.equal(await animated.evaluate(()=>window.GoiVietHomeIntro.getState().phase),'complete');
    assert.deepEqual(errors,[]);
    console.log('PASS: animated layers, replay, skip and direct-file poster.');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
