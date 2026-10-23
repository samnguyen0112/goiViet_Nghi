// Preview 3: the visible welcome action must retain the original opening lifecycle.
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const runtime = 'C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const { chromium } = require(runtime + '/playwright');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'verification/home-gate-3');
const url = pathToFileURL(path.join(root, 'map-surroundings-preview-3.html')).href;
const report = { checks: [], responsive: [], errors: [] };
const check = (name, passed, detail) => {
  report.checks.push({ name, passed: !!passed, detail });
  assert.ok(passed, name + (detail ? ': ' + JSON.stringify(detail) : ''));
};

(async () => {
  await fs.mkdir(out, { recursive: true });
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--allow-file-access-from-files'] });
  const open = async (options = {}, routeSetup) => {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, ...options });
    page.on('pageerror', error => report.errors.push(error.message));
    if (routeSetup) await routeSetup(page);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.GoiVietHomeIntro);
    await page.evaluate(() => document.fonts.ready);
    return page;
  };
  const phase = (page, expected) => page.waitForFunction(value => GoiVietHomeIntro.getState().phase === value, expected);
  try {
    const page = await open();
    await page.evaluate(() => GoiVietHomeIntro.ready);
    await page.locator('.gv-gate-logo').evaluate(image => image.decode());
    check('Gate has one native button and a descriptive accessible name', await page.locator('#btnHomeOpeningStart').evaluate(gate =>
      gate.tagName === 'BUTTON' && gate.type === 'button' && !gate.querySelector('button, a, [tabindex]') && gate.getAttribute('aria-label').startsWith('Chạm để bắt đầu') && gate.getAttribute('aria-describedby') === 'homeOpeningHint' && homeOpeningGate.querySelector('img').alt === ''));
    check('Waiting keeps scenery stopped and the homepage actions locked', await page.evaluate(() => {
      const state = GoiVietHomeIntro.getState();
      return state.phase === 'waiting' && state.paused && document.querySelector('.gv-home-content').inert && !btnHomeOpeningStart.disabled;
    }));
    check('Initial start action has no automatic focus ring', await page.locator('.gv-gate-action').evaluate(el => getComputedStyle(el).outlineStyle === 'none'));

    for (const [width, height, dpr] of [[1920,1080,1],[1366,768,1],[2560,1440,1],[820,1180,2],[390,844,3],[360,740,2],[320,568,2],[844,390,2],[568,320,2]]) {
      // One fresh context per size also checks the responsive image choice at that DPR.
      const responsive = await open({ viewport: { width, height }, deviceScaleFactor: dpr });
      await responsive.locator('.gv-gate-logo').evaluate(image => image.decode());
      const info = await responsive.evaluate(() => {
        const gate = homeOpeningGate, logo = gate.querySelector('img'), action = btnHomeOpeningStart;
        const bounds = el => { const r = el.getBoundingClientRect(); return { x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom }; };
        return { logo:bounds(logo), action:bounds(action), content:bounds(gate.firstElementChild), hint:bounds(homeOpeningHint),
          tools:bounds(document.querySelector('.gv-home-opening-tools')), gate:bounds(gate), src:logo.currentSrc.split('/').pop(),
          loaded:logo.complete && logo.naturalWidth > 0, overflow:document.documentElement.scrollWidth > innerWidth,
          actionText:gate.querySelector('.gv-gate-action-label').textContent, phase:GoiVietHomeIntro.getState().phase };
      });
      check('Logo and start action fit without tool overlap at ' + width + 'x' + height,
        info.loaded && info.src.startsWith('goi-viet-logo-ivory-ribbon-v2') && info.phase === 'waiting' && !info.overflow &&
        Math.abs(info.logo.x + info.logo.width / 2 - width / 2) < 1 && Math.abs(info.logo.width/info.logo.height-1902/827)<.005 &&
        info.content.y >= info.tools.bottom && info.hint.bottom <= height && info.logo.x >= 0 && info.logo.right <= width &&
        info.action.height >= 44 && info.action.y > info.logo.bottom && info.actionText === 'Chạm để bắt đầu', info);
      await responsive.locator('.gv-gate-action').click({ trial: true });
      if ([1920,1366,2560,390,844,568].includes(width)) await responsive.screenshot({ path:path.join(out, 'waiting-' + width + '.png') });
      report.responsive.push({ width, height, dpr, ...info });
      await responsive.close();
    }

    await page.bringToFront();
    await page.mouse.click(30, 100);
    await page.locator('.gv-gate-logo').click();
    check('Paper and logo clicks do not start the opening', await page.evaluate(() => GoiVietHomeIntro.getState().phase === 'waiting'));
    check('No decorative frame remains', await page.evaluate(() => getComputedStyle(homeOpeningGate, '::before').content === 'none'));
    await page.locator('#btnHomeOpeningStart').focus();
    // Tab order includes the top-corner controls without reaching inert content.
    await page.keyboard.press('Tab');
    check('Tab reaches Skip from the gate', await page.evaluate(() => document.activeElement.id === 'btnHomeOpeningSkip'));
    await page.keyboard.press('Tab');
    check('Tab reaches the audio settings', await page.evaluate(() => document.activeElement.matches('#homeMusicSettings summary')));
    await page.keyboard.press('Enter');
    check('Audio settings can be opened before starting', await page.locator('#homeMusicSettings').evaluate(el => el.open));
    await page.locator('#homeMusicSettings summary').click();
    await page.locator('.gv-gate-action').click();
    await phase(page, 'playing');
    check('Mouse start hides the gate and plays from the beginning', await page.evaluate(() => btnHomeOpeningStart.hidden && GoiVietHomeIntro.getState().time < 2 && !GoiVietHomeIntro.getState().paused));
    await page.locator('#btnHomeOpeningSkip').click();
    await phase(page, 'complete');
    check('Skipping unlocks homepage actions', await page.evaluate(() => !document.querySelector('.gv-home-content').inert && !btnQuickStartWelcome.disabled));
    await page.locator('#btnHomeOpeningReplay').click();
    await phase(page, 'playing');
    check('Replay starts the opening without leaving the gate over it', await page.evaluate(() => btnHomeOpeningStart.hidden && GoiVietHomeIntro.getState().time < 2));
    await page.close();

    for (const key of ['Enter', 'Space']) {
      const keyboard = await open();
      await keyboard.evaluate(() => GoiVietHomeIntro.ready);
      await keyboard.keyboard.press('Tab');
      await keyboard.keyboard.press(key);
      await phase(keyboard, 'playing');
      check(key + ' starts and moves keyboard focus to Skip', await keyboard.evaluate(() => btnHomeOpeningStart.hidden && document.activeElement.id === 'btnHomeOpeningSkip'));
      await keyboard.close();
    }
    const skip = await open();
    await skip.locator('#btnHomeOpeningSkip').click();
    await phase(skip, 'complete');
    check('Skip is usable directly from the waiting screen', await skip.evaluate(() => btnHomeOpeningStart.hidden && !btnQuickStartWelcome.disabled));
    await skip.close();

    let releaseScene;
    const heldScene = new Promise(resolve => { releaseScene = resolve; });
    const slow = await open({}, async page => {
      await page.route('**/homepage-reference-v8/assets-*.js*', async route => { await heldScene; await route.continue(); });
    });
    await slow.locator('.gv-gate-action').click();
    await phase(slow, 'preparing');
    check('Slow loading shows a disabled busy action and a useful status', await slow.evaluate(() => {
      const spinner = document.querySelector('.gv-gate-spinner');
      return btnHomeOpeningStart.disabled && !btnHomeOpeningStart.hidden && btnHomeOpeningStart.getAttribute('aria-busy') === 'true' &&
        homeOpeningHint.textContent === 'Đang chuẩn bị phong cảnh…' && getComputedStyle(spinner).display !== 'none' && getComputedStyle(spinner).animationName !== 'none';
    }));
    await slow.screenshot({ path:path.join(out, 'preparing.png') });
    await slow.evaluate(() => { btnHomeOpeningStart.click(); GoiVietHomeIntro.start(); });
    check('Repeated start while loading remains in preparing', await slow.evaluate(() => GoiVietHomeIntro.getState().phase === 'preparing'));
    releaseScene();
    await phase(slow, 'playing');
    check('Scene becoming ready automatically starts and clears busy state', await slow.evaluate(() => btnHomeOpeningStart.hidden && !btnHomeOpeningStart.disabled && btnHomeOpeningStart.getAttribute('aria-busy') === 'false'));
    await slow.close();

    let releaseSkippedScene;
    const skippedScene = new Promise(resolve => { releaseSkippedScene = resolve; });
    const skipSlow = await open({}, async page => {
      await page.route('**/homepage-reference-v8/assets-*.js*', async route => { await skippedScene; await route.continue(); });
    });
    await skipSlow.locator('.gv-gate-action').click();
    await phase(skipSlow, 'preparing');
    await skipSlow.locator('#btnHomeOpeningSkip').click();
    await phase(skipSlow, 'complete');
    releaseSkippedScene();
    await skipSlow.evaluate(() => GoiVietHomeIntro.ready);
    check('Skip during loading does not unexpectedly replay when assets arrive', await skipSlow.evaluate(() => GoiVietHomeIntro.getState().phase === 'complete' && btnHomeOpeningStart.hidden && !btnQuickStartWelcome.disabled));
    await skipSlow.close();

    for (const viewport of [{width:1920,height:1080},{width:390,height:844}]) {
      const reduced = await open({viewport, reducedMotion:'reduce'});
      await reduced.locator('.gv-gate-action').hover();
      const motion = await reduced.locator('.gv-gate-action').evaluate(el => {
        const style = getComputedStyle(el);
        return { transform:style.transform, durations:style.transitionDuration.split(',').map(parseFloat) };
      });
      // The site's global reduced-motion rule uses a tiny nonzero duration so
      // legacy transitionend listeners still run. Test perceptible motion.
      check('Reduced motion suppresses action movement at ' + viewport.width, motion.transform === 'none' && motion.durations.every(seconds => seconds <= .001), motion);
      await reduced.locator('.gv-gate-action').click();
      await phase(reduced, 'complete');
      check('Reduced motion reveals the static homepage at ' + viewport.width, await reduced.evaluate(() => btnHomeOpeningStart.hidden && GoiVietHomeIntro.getState().paused && !btnQuickStartWelcome.disabled));
      await reduced.locator('#btnHomeOpeningReplay').click();
      await phase(reduced, 'complete');
      await reduced.close();
    }

    const failed = await open({}, page => page.route('**/homepage-reference-v8/assets-*.js*', route => route.abort()));
    await failed.evaluate(() => GoiVietHomeIntro.ready);
    await failed.locator('.gv-gate-action').click();
    await phase(failed, 'complete');
    check('Scene failure leaves a usable homepage and retry action', await failed.evaluate(() => GoiVietHomeIntro.getState().failed && btnHomeOpeningStart.hidden && !btnQuickStartWelcome.disabled && !btnHomeClipRetry.hidden));
    await failed.close();

    const noController = await browser.newPage({ viewport:{width:1366,height:768} });
    await noController.route('**/homepage-opening-controller-3.js*', route => route.abort());
    await noController.goto(url);
    check('Controller script failure hides the gate and exposes content', await noController.evaluate(() => introScreen.dataset.homeOpening === 'complete' && btnHomeOpeningStart.hidden && !document.querySelector('.gv-home-content').inert && getComputedStyle(btnHomeOpeningStart).display === 'none'));
    await noController.close();

    const protectedFiles = await fs.readFile(path.join(out,'protected-files.json'),'utf8').then(JSON.parse).catch(() => []);
    for (const file of protectedFiles) {
      const hash = crypto.createHash('sha256').update(await fs.readFile(file.Path)).digest('hex').toUpperCase();
      check('Other pages and shared opening stylesheet unchanged: ' + path.basename(file.Path), hash === file.Hash);
    }
    check('No browser JavaScript errors', report.errors.length === 0, report.errors);
  } finally {
    await browser.close();
    await fs.writeFile(path.join(out,'report.json'), JSON.stringify(report,null,2));
  }
  console.log(JSON.stringify({passed:report.checks.filter(c=>c.passed).length,responsive:report.responsive.length,errors:report.errors,evidence:out}));
})().catch(error => { console.error(error); process.exitCode=1; });
