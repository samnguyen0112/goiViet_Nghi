const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const sharp = require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const { chromium } = require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'verification/preview3-home-copy');
const baseline = process.argv.includes('--before');
(async () => {
  await fs.mkdir(out, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--allow-file-access-from-files'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(pathToFileURL(path.join(root, 'map-surroundings-preview-3.html')).href, { waitUntil: 'load' });
    await page.waitForFunction(() => window.GoiVietHomeIntro);
    await page.evaluate(async () => { await window.GoiVietHomeIntro.ready; window.GoiVietHomeIntro.seek(12, true); await document.fonts.ready; });
    await page.screenshot({ path: path.join(out, baseline ? 'before.png' : 'desktop.png') });
    const canvas = await page.evaluate(() => document.getElementById('homeSceneCanvas').toDataURL());
    const pixels = Buffer.from(canvas.split(',')[1], 'base64');
    if (baseline) {
      await fs.writeFile(path.join(out, 'scene-before.png'), pixels);
      console.log('Saved baseline screenshot and deterministic landscape at 12 seconds.');
      return;
    }
    const composition = await page.evaluate(() => document.getElementById('homeClipFilm').homeScene.native.layerRenderer.manifest.homeComposition);
    assert.equal(composition.architectureRigid, true);
    assert.equal(composition.railwayOffset, 2378*.15);
    const reports = [];
    for (const [name, width, height] of [['desktop',1440,900], ['laptop',1366,768], ['wide',1920,1080], ['ultrawide',2560,1080], ['mobile',390,844], ['small-mobile',320,568], ['landscape',844,390]]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => { window.GoiVietHomeIntro.seek(12, true); });
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const info = await page.evaluate(() => {
        const rect = s => { const r = document.querySelector(s).getBoundingClientRect(); return { x:r.x, y:r.y, right:r.right, bottom:r.bottom, width:r.width, height:r.height }; };
        const button = document.getElementById('btnQuickStartWelcome');
        const style = getComputedStyle(button);
        const headingImage = document.querySelector('.gv-home-lettering img');
        const engine=document.getElementById('homeClipFilm').homeScene.native.layerRenderer;
        const plane=document.querySelector('.gv-home-scene-plane').getBoundingClientRect();
        const roof=plane.y+engine.manifest.layers.find(l=>l.id==='hue').rect[1]*plane.height/engine.manifest.height;
        return { roof, width:innerWidth, height:innerHeight, logo:rect('.gv-home-logo'), tagline:rect('.gv-home-tagline'), heading:rect('.gv-home-lettering'), subtitle:rect('.gv-home-memory-line'), button:rect('#btnQuickStartWelcome'), header:rect('.gv-home-header'), scrollHeight:document.getElementById('introScreen').scrollHeight, panel:!!document.getElementById('homepageContent'), letteringLoaded:headingImage.complete && headingImage.naturalWidth > 0, buttonBackground:style.backgroundColor, buttonBorder:style.borderWidth, film:rect('#homeClipFilm'), state:window.GoiVietHomeIntro.getState() };
      });
      assert.equal(info.panel, false, 'Old panel is still present');
      assert(info.button.bottom < info.roof-2, `${name}: CTA overlaps the central rooftop`);
      assert.equal(info.letteringLoaded, true, 'Lettering asset failed');
      assert.equal(info.buttonBackground, 'rgba(0, 0, 0, 0)');
      assert.equal(info.buttonBorder, '0px');
      for (const key of ['logo','tagline','heading','subtitle','button']) {
        assert(info[key].x >= 0 && info[key].right <= width + 1, `${name}: ${key} horizontally clipped`);
        assert(info[key].y >= 0 && info[key].bottom <= height, `${name}: ${key} vertically clipped`);
      }
      assert(info.logo.bottom <= info.tagline.y + 1, `${name}: logo overlaps tagline`);
      assert(info.tagline.bottom <= info.heading.y + 1, `${name}: tagline overlaps heading`);
      assert(info.heading.bottom <= info.subtitle.y + 1, `${name}: heading overlaps subtitle`);
      assert(info.subtitle.bottom <= info.button.y + 1, `${name}: subtitle overlaps CTA`);
      assert(info.scrollHeight <= height + 1, `${name}: old layout leaves a scroll tail`);
      await page.screenshot({ path: path.join(out, name + '.png') });
      reports.push({ name, ...info });
    }
    await page.setViewportSize({ width:1440, height:900 });
    await page.evaluate(() => window.GoiVietHomeIntro.seek(12, true));
    assert.equal(await page.locator('#introGuideStage').count(), 0, 'Removed guide screen still exists');
    const ink = await page.locator('.gv-home-lettering img').evaluate(el => ({ opacity:getComputedStyle(el).opacity, source:el.getAttribute('src') }));
    assert.equal(ink.opacity, '1', 'Lettering image is hidden');
    assert(ink.source.endsWith('-red.svg'), 'Lettering does not use the embedded red ink asset');
    await page.locator('#btnQuickStartWelcome').click();
    await page.waitForFunction(() => document.getElementById('introScreen').classList.contains('intro-hidden'));
    assert.equal(await page.evaluate(() => document.activeElement.id), 'mapScene', 'Map did not receive focus');
    assert.equal(await page.locator('#mapScene').getAttribute('inert'), null, 'Map remains inert');
    await page.screenshot({ path: path.join(out, 'map-after-start.png') });
    await page.locator('.brand-group').click();
    await page.waitForFunction(() => !document.getElementById('introScreen').classList.contains('intro-hidden'));
    assert.equal(await page.locator('#introScreen').getAttribute('data-intro-stage'), 'welcome');
    await page.evaluate(() => window.GoiVietHomeIntro.seek(12, true));
    await page.keyboard.press('Tab');
    const keyboardFocus = await page.evaluate(() => document.activeElement.id || document.activeElement.tagName);
    assert(keyboardFocus, 'Keyboard focus lost');
    assert.deepEqual(errors, [], 'Browser errors');
    // Reproduce the user's direct-file preview without relaxed local-file access.
    // Inspect rendered pixels: a decoded image alone did not catch the old CSS-mask failure.
    const ordinaryBrowser = await chromium.launch({ headless:true, executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe' });
    let visibleInkPixels = 0;
    try {
      const ordinary = await ordinaryBrowser.newPage({ viewport:{width:1440,height:900}, reducedMotion:'reduce' });
      await ordinary.goto(pathToFileURL(path.join(root, 'map-surroundings-preview-3.html')).href, {waitUntil:'load'});
      await ordinary.waitForFunction(() => window.GoiVietHomeIntro);
      await ordinary.evaluate(async () => { window.GoiVietHomeIntro.skip(); await document.fonts.ready; await document.querySelector('.gv-home-lettering img').decode(); });
      const crop = await ordinary.locator('.gv-home-lettering').screenshot();
      const raw = await sharp(crop).ensureAlpha().raw().toBuffer();
      for(let i=0;i<raw.length;i+=4) if(raw[i]>130&&raw[i+1]<60&&raw[i+2]<85) visibleInkPixels++;
      assert(visibleInkPixels>1500, 'Headline is not visibly rendered in ordinary file preview');
      await ordinary.screenshot({path:path.join(out,'direct-file.png')});
    } finally { await ordinaryBrowser.close(); }
    await fs.writeFile(path.join(out, 'checks.json'), JSON.stringify({ balancedComposition:composition, directMapNavigation:true, guideRemoved:true, ink, visibleInkPixels, errors, keyboardFocus, reports }, null, 2));
    console.log(JSON.stringify({ balancedComposition:composition, directMapNavigation:true, guideRemoved:true, visibleInkPixels, viewports:reports.map(r => r.name), errors }));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
