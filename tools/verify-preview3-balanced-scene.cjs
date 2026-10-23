const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'verification/preview3-balanced-home');
(async()=>{
  await fs.mkdir(out,{recursive:true});
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const reports=[],errors=[];
  try{
    for(const [name,viewport,reducedMotion] of [
      ['animation',{width:1440,height:900},'no-preference'],
      ['4k',{width:3840,height:2160},'no-preference'],
      ['reduced',{width:1440,height:900},'reduce']
    ]){
      const page=await browser.newPage({viewport,reducedMotion,deviceScaleFactor:1});
      page.on('pageerror',e=>errors.push(name+': '+e.message));
      await page.goto(pathToFileURL(path.join(root,'map-surroundings-preview-3.html')).href,{waitUntil:'load'});
      await page.waitForFunction(()=>window.GoiVietHomeIntro);
      await page.evaluate(async()=>{await window.GoiVietHomeIntro.ready;await document.fonts.ready;});
      if(name!=='reduced') assert.equal(await page.evaluate(()=>window.GoiVietHomeIntro.getState().failed),false,'Animated layers failed in direct-file preview');
      if(name==='animation'){
        for(const time of [3.5,6,8,10,18]){
          await page.evaluate(t=>window.GoiVietHomeIntro.seek(t,true),time);
          await page.screenshot({path:path.join(out,'opening-'+time+'.png')});
        }
        await page.locator('#btnHomeOpeningReplay').click();
        await page.waitForFunction(()=>window.GoiVietHomeIntro.getState().phase==='playing');
        await page.locator('#btnHomeOpeningSkip').click();
        assert.equal(await page.locator('#introScreen').getAttribute('data-home-opening'),'complete');
      } else if(name==='reduced') {
        await page.locator('#btnHomeOpeningStart').click();
        await page.waitForFunction(()=>document.getElementById('introScreen').dataset.homeOpening==='complete');
      } else await page.evaluate(()=>window.GoiVietHomeIntro.seek(12,true));
      await page.evaluate(()=>document.activeElement.blur());
      const info=await page.evaluate(()=>{
        const film=document.getElementById('homeClipFilm'),canvas=document.getElementById('homeSceneCanvas'),poster=document.querySelector('.gv-home-poster');
        const im=document.querySelector('.gv-home-lettering img');
        return {quality:canvas.dataset.assetQuality,poster:poster.currentSrc,posterReady:poster.complete&&poster.naturalWidth>0,letteringReady:im.complete&&im.naturalWidth>0,copyVisible:getComputedStyle(im).opacity,composition:film.homeScene?.native.layerRenderer.manifest.homeComposition,state:window.GoiVietHomeIntro.getState()};
      });
      assert(info.posterReady&&info.letteringReady&&info.copyVisible==='1');
      assert(info.poster.includes('homepage-balanced-3/poster-'));
      if(name==='4k')assert.equal(info.quality,'4k');
      if(name==='reduced')assert.equal(info.state.ready,false,'Reduced motion should use the matching poster without decoding animated layers');
      await page.screenshot({path:path.join(out,name+'.png')});
      await page.locator('#btnQuickStartWelcome').click();
      await page.waitForFunction(()=>document.getElementById('introScreen').classList.contains('intro-hidden'));
      assert.equal(await page.evaluate(()=>document.activeElement.id),'mapScene');
      reports.push({name,...info});await page.close();
    }
    assert.deepEqual(errors,[]);
    await fs.writeFile(path.join(out,'checks.json'),JSON.stringify({reports,errors},null,2));
    console.log(JSON.stringify({openingPhases:5,replayAndSkip:true,highResolution:true,reducedMotion:true,directMap:true,errors}));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
