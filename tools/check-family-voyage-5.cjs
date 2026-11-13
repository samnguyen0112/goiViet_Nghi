/* Desktop family voyage integration and preview-5 regression checks. */
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');
const vm = require('node:vm');
const { spawn } = require('node:child_process');
const http = require('node:http');
const { chromium } = require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'verification/sea-postoffice-5');
const URL = process.env.VOYAGE_TEST_URL || pathToFileURL(path.join(ROOT,'map-surroundings-preview-5.html')).href;
const hash = x => crypto.createHash('sha256').update(x).digest('hex');
const PROTECTED = ['index.html', 'card-testing.html', 'map-surroundings-preview-3.html', 'map-surroundings-preview-4.html', 'assets/goi-viet/map-surroundings-preview/natural/island-chart.css', 'assets/goi-viet/map-surroundings-preview/natural/natural.css'];
async function boot(browser, width = 1440, height = 1000, lang = 'vi', dpr = 1) {
  const page = await browser.newPage({viewport:{width,height},deviceScaleFactor:dpr, reducedMotion:'reduce'});
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.route(/^https:\/\//, r => r.abort());
  await page.goto(URL + '?lang=' + lang, {waitUntil:'load'});
  await page.waitForFunction(() => window.GoiVietHomeIntro && window.GoiVietNaturalLandscape);
  await page.evaluate(async () => { GoiVietHomeIntro.skip(); closeIntroModal(); await GoiVietNaturalLandscape.ensure(); });
  return { page, errors };
}
async function open(page, id) {
  await page.evaluate(id => GoiVietNaturalLandscape.openDetail(id), id);
  await page.waitForFunction(id => GoiVietNaturalLandscape.inspect().detailOpen && GoiVietNaturalLandscape.inspect().detailGroup === id, id);
  await page.waitForFunction(id => window.GoiVietFamilyVoyage?.inspect().enabled || document.getElementById('naturalDetailInfo').textContent.startsWith({'hoang-sa':'Hoàng Sa','truong-sa':'Trường Sa','phu-quoc':'Phú Quốc','con-dao':'Côn Đảo'}[id]),id);
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForTimeout(350);
}
async function mobileGeometry(page) {
  return page.evaluate(() => {
    const r = s => { const b = document.querySelector(s).getBoundingClientRect(); return ['x','y','width','height'].map(k => Math.round(b[k])); };
    return { sheet:r('#naturalIslandModal .modal-sheet'), tabs:r('.natural-island-tabs'), controls:r('.natural-detail-controls'), map:r('.natural-detail-map'), sidebar:r('.island-chart-sidebar'), heading:document.getElementById('naturalIslandHeading').textContent, entries:GoiVietIslandChart.inspect().entries.length };
  });
}
async function wordCount(page) {
  return page.evaluate(()=>{
    const root=document.querySelector('#naturalIslandModal .modal-sheet'),out=[];
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    for(let n=walker.nextNode();n;n=walker.nextNode()){
      const p=n.parentElement;if(!n.textContent.trim()||!p||p.closest('style,script,[hidden],[inert]'))continue;
      let shown=true;for(let el=p;el&&el!==root;el=el.parentElement){const s=getComputedStyle(el);if(s.display==='none'||s.visibility==='hidden'||el.tagName==='DETAILS'&&!el.open&&!el.querySelector('summary')?.contains(p)){shown=false;break;}}
      const rect=p.getBoundingClientRect();if(shown&&rect.width>0&&rect.height>0)out.push(n.textContent);
    }
    return out.join(' ').trim().split(/\s+/).filter(Boolean).length;
  });
}
async function main() {
  await fs.mkdir(OUT,{recursive:true});let ownedServer;
  if(process.env.VOYAGE_TEST_SERVE==='1'){
    ownedServer=spawn(process.execPath,[path.join(ROOT,'tools/perf/server.cjs')],{cwd:ROOT,windowsHide:true,stdio:'ignore',env:{...process.env,PORT:String(new globalThis.URL(URL).port),NOGZIP:'1'}});
    let ready=false;for(let i=0;i<150&&!ready;i++){
      ready=await new Promise(resolve=>{const req=http.get(URL,res=>{res.resume();resolve(res.statusCode===200);});req.on('error',()=>resolve(false));req.setTimeout(1000,()=>{req.destroy();resolve(false);});});
      if(!ready)await new Promise(r=>setTimeout(r,100));
    }if(!ready){ownedServer.kill();throw new Error('Local server did not start');}
  }
  const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',args:['--disable-background-timer-throttling','--disable-renderer-backgrounding','--disable-backgrounding-occluded-windows','--use-angle=d3d11']});
  const checks=[],screens=[],errorsAll=[];let page;
  const ok=text=>{checks.push(text);console.log('PASS:',text);};
  try {
    const b=await boot(browser);page=b.page;errorsAll.push(b.errors);
    const inspect=()=>page.evaluate(()=>GoiVietFamilyVoyage.inspect());
    const act=action=>page.locator(`#naturalIslandModal [data-voyage-action="${action}"]:visible`).first().click();
    const more=async action=>{if(!await page.locator(`[data-voyage-action="${action}"]:visible`).count())await page.locator('.sea-more > summary').click();await act(action);};
    const shot=async name=>{await page.screenshot({path:path.join(OUT,name+'.png'),fullPage:true});screens.push(name+'.png');};
    const reset=()=>page.evaluate(()=>{performSessionReset();});
    const letter=async()=>{const s=await inspect();if(s.phase==='sent')await act('next-letter');if((await inspect()).phase==='map')await act('open-letter');};
    const send=async()=>{await act('complete');assert.equal((await inspect()).phase,'sent');};
    const defaultFlags=process.argv.slice(2).filter(x=>x.startsWith('--'));
    const focused=defaultFlags.some(x=>['--deck-only','--dpi-only','--stress-only','--layout-only','--offline-only'].includes(x));
    if(defaultFlags.includes('--layout-only')){
      await open(page,'hoang-sa');
      for(const [width,height]of [[1920,1080],[1440,1000],[1366,768],[1024,768],[961,768]]){
        await page.setViewportSize({width,height});await page.waitForTimeout(100);
        const fit=await page.evaluate(()=>{const t=document.querySelector('.sea-scene-heading').getBoundingClientRect(),b=document.querySelector('.sea-sailboat').getBoundingClientRect(),body=document.querySelector('.natural-detail-body');return {noOverlap:b.top>=t.bottom,top:b.top,textBottom:t.bottom,overflow:body.scrollWidth>body.clientWidth+1};});
        assert(fit.noOverlap&&!fit.overflow,`${width}: ${JSON.stringify(fit)}`);await shot('sealed-'+width);
      }
      await page.evaluate(()=>GoiVietI18n.setLang('en'));
      for(const [width,height]of [[1440,1000],[1366,768],[1024,768],[961,768]]){
        await page.setViewportSize({width,height});await page.waitForTimeout(100);
        const fit=await page.evaluate(()=>{const t=document.querySelector('.sea-scene-heading').getBoundingClientRect(),b=document.querySelector('.sea-sailboat').getBoundingClientRect(),e=document.querySelector('.sea-envelope').getBoundingClientRect();return b.top>=t.bottom&&(t.right<=e.left||t.bottom<=e.top);});
        assert(fit,`${width}: English title overlaps the boat/envelope`);await shot('sealed-en-'+width);
      }
      await page.evaluate(()=>GoiVietI18n.setLang('vi'));
      await letter();for(const [width,height]of [[1440,1000],[1366,768],[1024,768],[961,768]]){
        await page.setViewportSize({width,height});await page.waitForTimeout(100);
        assert(await page.locator('.sea-letter-bottom [data-voyage-action="complete"]').evaluate(e=>{const r=e.getBoundingClientRect(),b=e.closest('.natural-detail-body').getBoundingClientRect();return r.bottom<=b.bottom+1&&r.x>=b.x&&r.right<=b.right;}));await shot('letter-'+width);
      }
      ok('Final visual QA: boat clears all text in 5 desktop sizes; open-letter primary action fits 4 desktop sizes');
    }
    if(!focused){
      const baseline=JSON.parse(await fs.readFile(path.join(ROOT,'verification/family-voyage-5/baseline.json'),'utf8'));
      for(const [f,digest]of Object.entries(baseline.protectedHashes))assert.equal(hash(await fs.readFile(path.join(ROOT,f))),digest,f+' changed');
      const html=await fs.readFile(path.join(ROOT,'map-surroundings-preview-5.html'),'utf8');
      assert.equal(hash(html.split('\n').find(l=>l.startsWith('const ALL_DECKS_MAP = '))),baseline.dataHash);
      for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))if(m[1].trim())new vm.Script(m[1]);
      for(const f of ['family-voyage-5.js','family-voyage-data-5.js','sea-postoffice-data-5.js'])new vm.Script(await fs.readFile(path.join(ROOT,'assets/goi-viet/map-surroundings-preview',f),'utf8'));
      for(const width of [390,720,820]){await page.setViewportSize({width,height:844});for(const id of ['hoang-sa','truong-sa','phu-quoc']){await open(page,id);assert.deepEqual(await mobileGeometry(page),baseline.mobile[`${width}-${id}`]);assert.equal((await inspect()).enabled,false);}}
      ok('Protected pages/data unchanged; scripts parse; all 9 original mobile/tablet baselines match');
      await page.close();
      const old=await boot(browser);errorsAll.push(old.errors);
      await old.page.route('**/family-voyage-5.js?*',r=>r.fulfill({contentType:'text/javascript',path:path.join(OUT,'before-source/family-voyage-5.js')}));
      await old.page.reload({waitUntil:'load'});await old.page.evaluate(async()=>{GoiVietHomeIntro.skip();closeIntroModal();await GoiVietNaturalLandscape.ensure();});await open(old.page,'hoang-sa');
      const beforeWords=await wordCount(old.page);await old.page.close();
      const fresh=await boot(browser);page=fresh.page;errorsAll.push(fresh.errors);await page.bringToFront();
      await page.setViewportSize({width:1440,height:1000});await open(page,'hoang-sa');
      const sealedWords=await wordCount(page);assert(sealedWords<beforeWords*.6,`Text reduction: ${sealedWords}/${beforeWords}`);assert(sealedWords<110);
      await fs.writeFile(path.join(OUT,'density.json'),JSON.stringify({beforeWords,sealedWords},null,2));
      for(const [width,height]of [[1920,1080],[1440,1000],[1366,768],[1024,768],[961,768]]){
        await page.setViewportSize({width,height});await page.waitForTimeout(100);
        const fit=await page.evaluate(()=>{const body=document.querySelector('.natural-detail-body'),b=document.querySelector('.sea-envelope').getBoundingClientRect(),s=document.querySelector('#naturalIslandModal .modal-sheet').getBoundingClientRect(),boat=document.querySelector('.sea-sailboat').getBoundingClientRect(),text=document.querySelector('.sea-scene-heading').getBoundingClientRect();return body.scrollWidth<=body.clientWidth+1&&b.x>=s.x&&b.right<=s.right&&b.bottom<=s.bottom&&boat.top>=text.bottom;});
        assert(fit,`${width}: envelope clipped`);await shot('sealed-'+width);
      }
      ok(`Quiet default screen: ${sealedWords} visible words vs ${beforeWords} before; envelope fits 5 desktop sizes`);
      await page.setViewportSize({width:1440,height:1000});
      await page.locator('.sea-envelope').focus();await page.keyboard.press('Enter');assert.equal((await inspect()).phase,'letter');
      assert.equal(await page.locator('.voyage-options:visible').count(),0);assert(await page.locator('#voyageNote').isHidden());
      await act('word');assert.equal((await inspect()).sessions['hoang-sa'].stops[0].wordIndex,0);
      await page.locator('.sea-keepsake summary').click();const privateText='<img src=x onerror="window.__seaXSS=1"> Lời nhà mình.';
      await page.locator('#voyageNote').fill(privateText);await page.locator('#voyageMemoryPlace').fill('Đà Nẵng');
      await act('alternate');assert.equal(await page.locator('#voyageNote').inputValue(),privateText);
      await more('en');assert.equal(await page.locator('#voyageNote').inputValue(),privateText);await more('vi');
      await page.locator('#naturalClose').click();await open(page,'hoang-sa');assert.equal((await inspect()).phase,'letter');assert.equal(await page.locator('#voyageNote').inputValue(),privateText);
      assert.equal(await page.evaluate(()=>window.__seaXSS),undefined);await shot('hoang-sa-open');
      await page.locator('[data-voyage-action="complete"]:visible').evaluate(el=>{el.click();el.click();});assert.equal((await inspect()).sessions['hoang-sa'].index,1);assert.equal((await inspect()).phase,'sent');
      await shot('hoang-sa-sent');await page.locator('#naturalClose').click();await open(page,'hoang-sa');assert.equal((await inspect()).phase,'sent');await act('next-letter');await letter();
      assert(await page.locator('.sea-listening-shell').isVisible());await act('timer');assert((await inspect()).timerRunning);await act('album');assert.equal((await inspect()).timerRunning,false);await act('play');
      await more('story');assert(await page.locator('.sea-story-sheet').isVisible());await act('play');
      await act('atlas');await page.waitForFunction(()=>document.getElementById('naturalDetailCanvas').getBoundingClientRect().width>300);await page.waitForTimeout(200);
      assert(await page.locator('#islandChartSearch').isVisible());assert((await page.evaluate(()=>GoiVietIslandChart.inspect().entries.length))>=60);
      await page.locator('#islandChartSearch').fill('hoang sa');assert.equal(await page.locator('.island-chart-entry').count(),1);await page.locator('.island-chart-entry').click();
      const camera=await page.evaluate(()=>GoiVietNaturalLandscape.getDetailView());await act('play');assert.equal((await inspect()).phase,'letter');await act('atlas');await page.waitForTimeout(200);
      assert.deepEqual(await page.evaluate(()=>GoiVietNaturalLandscape.getDetailView()),camera);await act('play');
      ok('Keyboard opening; words, safe notes, close/reopen and sent state; timer, source shelf and optional full atlas preserve the letter');
      await reset();
      for(const id of ['hoang-sa','truong-sa']){
        await open(page,id);await shot(id+'-sealed');
        for(let i=0;i<3;i++){
          await letter();if(i===0)await act('word');
          if(id==='truong-sa'&&i===1){for(let n=0;n<4;n++)await page.locator(`[data-voyage-action="bag"][data-item="${n}"]:visible`).click();assert.equal((await inspect()).sessions[id].stops[1].bag.length,3);await shot('truong-sa-bag');await page.locator('[data-voyage-action="bag"][data-item="1"]:visible').click();await page.locator('[data-voyage-action="bag"][data-item="4"]:visible').click();assert.deepEqual((await inspect()).sessions[id].stops[1].bag,[0,2,4]);}
          if(i===2){await act('starter');assert(await page.locator('#voyageNote').isVisible());}
          else await page.locator('.sea-keepsake summary').click();
          await page.locator('#voyageNote').fill(`${id}: Chuyện nhà ở lá thư ${i+1}.`);if(i===0)await page.locator('#voyageMemoryPlace').fill('Đà Nẵng');
          await send();await page.waitForTimeout(320);await act('next-letter');
        }
        assert.equal((await inspect()).sessions[id].index,3);assert(await page.locator('.voyage-postcard').isVisible());
        await shot(id+'-album');const pngEvent=page.waitForEvent('download');await act('download');const png=await pngEvent;await png.saveAs(path.join(OUT,id+'-postcard.png'));
        const bytes=await fs.readFile(path.join(OUT,id+'-postcard.png'));assert.equal(bytes.readUInt32BE(16),1800);assert.equal(bytes.readUInt32BE(20),1200);
        await page.locator('.sea-album-options summary').click();await page.locator('#voyageTitle').fill('Thư của nhà mình');
        const textEvent=page.waitForEvent('download');await act('download-text');await(await textEvent).saveAs(path.join(OUT,id+'-journal.txt'));
        assert((await fs.readFile(path.join(OUT,id+'-journal.txt'),'utf8')).includes('Chuyện nhà ở lá thư 3'));
      }
      assert.equal(await page.evaluate(()=>state.completedStamps.length),6);assert.equal(await page.evaluate(()=>state.mentionedPlaces.length),2);
      assert(await page.evaluate(()=>state.completedStamps.every(s=>s.voyageFormat==='postoffice'&&s.cardId===null)));
      await page.evaluate(()=>{GoiVietNaturalLandscape.closeDetail();openPostcardModal();GoiVietI18n.setLang('en');});
      assert(await page.locator('#postcardModal').isVisible());assert.equal(await page.locator('#postcardExploredContainer .stamp-item').count(),6);
      assert(await page.evaluate(()=>state.completedStamps.every(s=>s.activity===GoiVietSeaPostOffice.routes[s.voyageId].letters[s.voyageStop].prompts[s.activityIdx].en)));
      assert.equal(await page.locator('#postcardMentionedContainer input:checked').count(),0);await page.locator('#postcardMemOptIn-0').check();
      await page.evaluate(()=>{GoiVietI18n.setLang('vi');closePostcardModal();});await open(page,'truong-sa');
      ok('Both distinct three-letter games, bag limit/replacement, starters, six shared stamps, two memories and real PNG/TXT downloads');
      await act('replay');assert.equal((await inspect()).archives['truong-sa'].length,1);await letter();await act('word');await act('album');
      await page.locator('.sea-album-options summary').click();await act('edit-album');await page.locator('#voyageAlbumNote0').fill('W'.repeat(180));await page.locator('#voyageTitle').fill('W'.repeat(60));
      await page.locator('#voyageArchiveSelect').selectOption('0');assert((await page.locator('.voyage-postcard').innerText()).includes('Thư của nhà mình'));await page.locator('#voyageArchiveSelect').selectOption('-1');
      await act('play');assert.equal((await inspect()).sessions['truong-sa'].stops[0].note,'W'.repeat(180));
      await page.setViewportSize({width:720,height:844});assert.equal((await inspect()).enabled,false);await page.setViewportSize({width:1440,height:1000});await page.waitForTimeout(100);assert.equal((await inspect()).phase,'letter');
      await page.evaluate(()=>{state.theme='dark';document.documentElement.dataset.theme='dark';});await more('en');await shot('dark-english');
      await page.locator('#naturalClose').focus();for(let i=0;i<35;i++){await page.keyboard.press('Tab');assert(await page.evaluate(()=>document.getElementById('naturalIslandModal').contains(document.activeElement)&&!document.activeElement.closest('[inert]')));}
      await more('vi');await page.evaluate(()=>{state.theme='light';document.documentElement.dataset.theme='light';});
      ok('Replay archives, maximum text, desktop/mobile retention, dark/English and 35 Tab focus moves');
      await reset();await open(page,'hoang-sa');await letter();await act('skip');assert.equal((await inspect()).sessions['hoang-sa'].stops[0].status,'skipped');assert.equal(await page.evaluate(()=>state.activityCompletedPlaceIds.includes('hoang-sa')),false);await reset();
      ok('Skipped letters remain distinct; whole-session reset clears letters and timers');
    }
    if(!focused||defaultFlags.includes('--deck-only')){
      await reset();await open(page,'hoang-sa');await more('deck');assert.equal((await inspect()).phase,'deck');
      const first=page.locator('.voyage-fanned-card').first();await page.locator('#naturalClose').focus();await page.mouse.move(0,0);const x=await first.evaluate(e=>e.getBoundingClientRect().x);await page.locator('.voyage-fan').hover();await page.waitForTimeout(100);assert((await first.evaluate(e=>e.getBoundingClientRect().x))<x-15);
      const chosen=await page.locator('.voyage-fanned-card').last().getAttribute('data-card');await page.locator('.voyage-fanned-card').last().focus();await page.keyboard.press('Enter');
      assert.equal((await inspect()).sessions['hoang-sa'].stops[0].cardId,chosen);assert(await page.locator('#voyageSeal').isVisible());assert.equal(await page.locator('#voyageConnection').evaluate(e=>e.inert),true);
      await act('unseal');assert.equal(await page.locator('#voyageConnection').evaluate(e=>e.inert),false);await act('map');assert(await page.locator('.sea-envelope').isVisible());
      await more('deck');await page.locator('.voyage-dock-action [data-voyage-action="draw"]').click();await act('explain');assert(await page.locator('.voyage-answer').isVisible());
      await more('originals');assert(await page.locator('#deckModal').isVisible());await page.evaluate(()=>closeDeckModal());
      ok('Optional reference deck: elastic fan, exact keyboard draw, dual faces, lotus/inert seal, explanation and original-deck handoff');
      await reset();await open(page,'hoang-sa');await more('deck');await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(()=>state.reducedMotion=false);
      await page.locator('.voyage-dock-action [data-voyage-action="draw"]').click();assert(await page.locator('.phase-gather').count());await page.waitForTimeout(400);assert(await page.locator('.phase-shuffle').count());
      await page.locator('#naturalClose').click();await page.waitForTimeout(2200);await open(page,'hoang-sa');assert.equal((await inspect()).sessions['hoang-sa'].stops[0].drawn.length,0);
      await page.locator('.voyage-dock-action [data-voyage-action="draw"]').click();await page.waitForTimeout(1150);assert.equal(await page.locator('.is-picked').count(),1);await page.waitForTimeout(450);assert(await page.locator('.phase-draw').count());
      await page.evaluate(()=>GoiVietNaturalLandscape.switchDetailGroup('truong-sa'));await page.waitForTimeout(800);assert.equal((await inspect()).sessions['hoang-sa'].stops[0].drawn.length,0);
      await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>state.reducedMotion=true);
      ok('Real gather/shuffle/pick/draw animations; closing or switching destinations cancels without consuming cards');
    }
    if(!focused||defaultFlags.includes('--stress-only')){
      await reset();await open(page,'hoang-sa');await page.evaluate(()=>{for(let i=0;i<20;i++)GoiVietNaturalLandscape.openDetail('hoang-sa');});await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>modalFocusReturnStack.filter(x=>x.modalId==='naturalIslandModal').length),1);
      for(let i=0;i<20;i++){await page.evaluate(()=>GoiVietNaturalLandscape.closeDetail());await open(page,i%2?'hoang-sa':'truong-sa');}
      await page.evaluate(()=>GoiVietNaturalLandscape.closeDetail());assert.equal(await page.locator('.sea-scene').count(),1);assert.equal(await page.locator('#naturalDetailCanvas').count(),1);assert.equal(await page.evaluate(()=>modalFocusReturnStack.filter(x=>x.modalId==='naturalIslandModal').length),0);assert.equal((await inspect()).timerRunning,false);
      ok('20 repeated opens and 20 close/reopen cycles: one desk/canvas, balanced focus and stopped timers');
    }
    if(!focused||defaultFlags.includes('--dpi-only')){
      await page.close();
      const hi=await boot(browser,1280,900,'en',2);page=hi.page;errorsAll.push(hi.errors);await open(hi.page,'truong-sa');await hi.page.locator('.sea-envelope').click();await hi.page.locator('[data-voyage-action="word"]').first().click();
      await hi.page.locator('[data-voyage-action="atlas"]').click();await hi.page.waitForTimeout(200);assert(await hi.page.locator('#naturalDetailCanvas').evaluate(e=>e.width===Math.round(e.getBoundingClientRect().width*2)));
      await hi.page.locator('[data-voyage-action="play"]:visible').first().click();assert(await hi.page.locator('#seaInvitation').isVisible());await hi.page.screenshot({path:path.join(OUT,'dpi-2x.png'),fullPage:true});await hi.page.close();
      ok('2× DPI letter desk, real pointer selection and correctly sized optional chart canvas');
    }
    let offline=null;
    if(/^http/.test(URL)&&process.env.VOYAGE_TEST_OFFLINE==='1'&&(!focused||defaultFlags.includes('--offline-only'))){
      if(page&&!page.isClosed())await page.close();
      const fresh=await boot(browser);page=fresh.page;errorsAll.push(fresh.errors);
      await reset();await page.evaluate(()=>GoiVietOffline.prepare());await page.waitForFunction(()=>GoiVietOffline.inspect().ready,null,{timeout:180000});offline=await page.evaluate(()=>GoiVietOffline.inspect());
      await page.context().setOffline(true);await page.reload({waitUntil:'load'});await page.waitForFunction(()=>window.GoiVietHomeIntro&&window.GoiVietNaturalLandscape&&window.GoiVietSeaPostOffice);
      await page.evaluate(async()=>{GoiVietHomeIntro.skip();closeIntroModal();await GoiVietNaturalLandscape.ensure();});
      await page.locator('#btnIslandHoangSa').click();
      await page.locator('#arrivalExplore').click();
      await page.locator('#arrivalSheet[data-place="hoang-sa"]:visible').waitFor();
      await page.locator('.arrival-island-entry').click();
      await page.waitForFunction(()=>GoiVietFamilyVoyage.isOpenFor('hoang-sa'));
      await letter();assert(await page.locator('.sea-sailboat').evaluate(e=>e.complete&&e.naturalWidth>0));await act('word');await send();
      await page.locator('#naturalClose').click();
      assert(await page.locator('#arrivalSheet').isVisible());
      assert.match(await page.locator('#arrivalSheet .arrival-seal-status').innerText(), /Đã đóng ấn/);
      await shot('offline-arrival-hoang-sa');
      await page.context().setOffline(false);
      ok('Cold offline reload: sail to Hoàng Sa, open the sea post office from arrival, stamp a letter, and return to the updated station sheet');
    }
    assert.deepEqual(errorsAll.flat(),[]);
    const report={checks,screens,offline,errors:errorsAll.flat(),mode:defaultFlags.join(' ')||'full'};
    await fs.writeFile(path.join(OUT,'checks'+(focused?'-'+defaultFlags[0].slice(2):/^http/.test(URL)?'-http':'')+'.json'),JSON.stringify(report,null,2));
    console.log(`PASS: ${checks.length} groups. Evidence: ${OUT}`);
  }catch(error){
    if(page&&!page.isClosed()){
      await page.screenshot({path:path.join(OUT,'failure.png'),fullPage:true}).catch(()=>{});
      const info=await page.evaluate(()=>{
        const summary=document.querySelector('.sea-more > summary'),ancestors=[];
        for(let el=summary;el;el=el.parentElement)ancestors.push({tag:el.tagName,id:el.id,inert:el.inert,hidden:el.hidden,display:getComputedStyle(el).display,visibility:getComputedStyle(el).visibility});
        return {state:window.GoiVietFamilyVoyage?.inspect(),modal:document.getElementById('naturalIslandModal')?.outerHTML.slice(0,600),active:document.activeElement?.outerHTML,top:typeof getTopOpenModalElement==='function'?getTopOpenModalElement()?.id:null,rect:summary?.getBoundingClientRect().toJSON(),ancestors};
      }).catch(()=>({}));
      await fs.writeFile(path.join(OUT,'failure.json'),JSON.stringify(info,null,2)).catch(()=>{});
    }
    throw error;
  }
  finally{await browser.close();if(ownedServer)ownedServer.kill();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
