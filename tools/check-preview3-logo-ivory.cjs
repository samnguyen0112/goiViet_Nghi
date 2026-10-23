// Verify Preview 3's homepage logo and its existing entrance/ambient lifecycle together.
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const runtime = 'C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const { chromium } = require(runtime + '/playwright');
const sharp = require(runtime + '/sharp');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'verification/preview3-logo-ivory');
const sha = data => crypto.createHash('sha256').update(data).digest('hex');
const report = { checks: [], responsive: [], errors: [] };
const check = (name, condition, detail) => {
  report.checks.push({ name, passed: Boolean(condition), detail });
  assert.ok(condition, name + (detail ? ': ' + JSON.stringify(detail) : ''));
};

(async () => {
  await fs.mkdir(out, { recursive: true });
  const beforePath = path.join(out, 'preview3.before.html');
  // This optional snapshot is captured before integration; fresh clones can still run the other checks.
  let before = await fs.readFile(beforePath, 'utf8').catch(() => null);
  // A snapshot from before the T3 gate cannot run against the current shared opening controller.
  if (before && !before.includes('id="homeOpeningGate"')) {
    report.baselineSkipped = 'preview3.before.html predates the T3 opening gate';
    before = null;
  }
  const url = pathToFileURL(path.join(root, 'map-surroundings-preview-3.html')).href;
  const baselineUrl = pathToFileURL(path.join(out, 'baseline.html')).href;
  if (before) await fs.writeFile(path.join(out, 'baseline.html'), before.replace('<head>', '<head><base href="' + pathToFileURL(root + path.sep).href + '">'));
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', args: ['--allow-file-access-from-files'] });
  const open = async (options = {}, target = url) => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, ...options });
    page.on('pageerror', error => report.errors.push(error.message));
    await page.goto(target);
    await page.waitForFunction(() => window.GoiVietHomeIntro);
    await page.evaluate(async () => {
      await GoiVietHomeIntro.ready;
      await document.fonts.ready;
      await document.querySelector('#homeLogoEffect img').decode();
    });
    return page;
  };
  const seek = async (page, time) => {
    // Managed Preview 3 caches intentionally stop warming in a hidden tab.
    await page.bringToFront();
    await page.evaluate(t => GoiVietHomeIntro.seek(t, true), time);
    // Preview 3 builds sprite poses in idle slices. Compare the same warmed pose,
    // rather than a cold source sprite on one page and a finished mesh on the other.
    await page.waitForFunction(() => (homeClipFilm.homeScene?.native?.layerRenderer?.inspect?.().pending ?? 0) === 0);
    await page.evaluate(t => GoiVietHomeIntro.seek(t, true), time);
  };
  const sample = page => page.evaluate(() => {
    const logo = document.querySelector('#homeLogoEffect');
    return {
      alpha: getComputedStyle(logo).opacity,
      transform: getComputedStyle(logo).transform,
      visibility: getComputedStyle(logo).visibility,
      inert: logo.inert,
      phase: GoiVietHomeIntro.getState().phase,
      frame: homeSceneCanvas.toDataURL(),
      failed: GoiVietHomeIntro.getState().failed
    };
  });

  try {
    const assets = [];
    for (const width of [512, 1024, 1902]) {
      const name = 'goi-viet-logo-ivory-ribbon-v2' + (width === 1902 ? '' : '-' + width) + '.webp';
      const file = path.join(root, 'assets/goi-viet/brand', name);
      const meta = await sharp(file).metadata(), stats = await sharp(file).stats();
      assets.push({ name, width: meta.width, height: meta.height, bytes: (await fs.stat(file)).size });
      check('Transparent logo asset ' + width, meta.width === width && meta.hasAlpha && stats.channels[3].min === 0);
    }
    report.assets = assets;

    const page = await open();
    check('Normal opening starts behind the user gesture', await page.locator('#introScreen').getAttribute('data-home-opening') === 'waiting');
    await page.locator('#btnHomeOpeningStart').click();
    // The gate copy fades for 350 ms before the scene clock starts.
    await page.waitForFunction(() => GoiVietHomeIntro.getState().phase !== 'fading', null, { timeout: 2000 });
    check('Start opens the existing animation', await page.evaluate(() => GoiVietHomeIntro.getState().phase === 'playing'));

    if (before) {
      const baseline = await open({}, baselineUrl);
      const checkpoints = [];
      for (const time of [0, 3, 4.5, 5.2, 6.2, 8, 10, 12, 20, 36]) {
        await seek(baseline, time); await seek(page, time);
        const old = await sample(baseline), current = await sample(page);
        check('Logo timing and landscape pixels preserved at ' + time + 's',
          ['alpha', 'transform', 'visibility', 'inert', 'phase', 'failed'].every(key => current[key] === old[key]) && sha(current.frame) === sha(old.frame));
        checkpoints.push({ time, alpha: current.alpha, visibility: current.visibility, canvasHash: sha(current.frame) });
      }
      report.checkpoints = checkpoints;
      await baseline.close();
    }

    await seek(page, 12);
    await page.screenshot({ path: path.join(out, 'desktop.png') });
    const logo = page.locator('#homeLogoEffect img');
    await logo.hover(); await page.waitForTimeout(220);
    const hover = await logo.evaluate(el => ({ transform: getComputedStyle(el).transform, filter: getComputedStyle(el).filter }));
    check('Logo hover retains its gentle lift and shadow', hover.transform !== 'none' && hover.filter.includes('drop-shadow'), hover);
    await page.mouse.move(0, 0); await page.waitForTimeout(220);

    await page.locator('#btnHomeOpeningReplay').click();
    check('Replay restarts entrance', await page.evaluate(() => GoiVietHomeIntro.getState().phase === 'playing'));
    await page.locator('#btnHomeOpeningSkip').click();
    check('Skip makes the full logo and actions available', await page.evaluate(() => GoiVietHomeIntro.getState().phase === 'complete' && !document.querySelector('#homeLogoEffect').inert && !btnQuickStartWelcome.disabled));
    // Observe live playback after the entrance rather than only seeking fixed frames.
    const live = await page.evaluate(async () => {
      GoiVietHomeIntro.seek(12, false);
      const initial = homeSceneCanvas.toDataURL(), start = GoiVietHomeIntro.getState().time;
      await new Promise(resolve => setTimeout(resolve, 1500));
      const state = GoiVietHomeIntro.getState();
      return { advanced: state.time > start + .5, changed: homeSceneCanvas.toDataURL() !== initial, failed: state.failed, paused: state.paused };
    });
    check('Clouds and cranes continue in live ambient playback', live.advanced && live.changed && !live.failed && !live.paused, live);
    await seek(page, 12);

    for (const [width, height, dpr] of [[1920,1080,1],[1366,768,1],[1280,720,1],[2560,1440,1],[820,1180,2],[390,844,3],[360,740,2],[320,568,2],[844,390,2]]) {
      const responsive = await open({ viewport: { width, height }, deviceScaleFactor: dpr });
      await seek(responsive, 12);
      const info = await responsive.evaluate(() => {
        const image = document.querySelector('#homeLogoEffect img'), r = image.getBoundingClientRect(), verse = document.querySelector('.gv-home-verse').getBoundingClientRect();
        const intro = document.querySelector('#introScreen'), cta = document.querySelector('#btnQuickStartWelcome');
        return { src: image.currentSrc.split('/').pop(), loaded: image.complete && image.naturalWidth > 0, ratio: r.width/r.height,
          left: r.left, right: r.right, top: r.top, bottom: r.bottom, verseTop: verse.top,
          horizontalOverflow: intro.scrollWidth > intro.clientWidth || document.documentElement.scrollWidth > innerWidth,
          ctaEnabled: !cta.disabled && !cta.closest('[inert]'), failed: GoiVietHomeIntro.getState().failed };
      });
      check('Logo fits, keeps its aspect ratio and clears the verse at ' + width + 'x' + height,
        info.loaded && info.src.startsWith('goi-viet-logo-ivory-ribbon-v2') && Math.abs(info.ratio - 1902/827) < .005 && info.left >= 0 && info.right <= width + 1 && info.top >= 0 && info.bottom <= info.verseTop + 1 && !info.horizontalOverflow && info.ctaEnabled && !info.failed, info);
      // A trial click checks scrolling, visibility, stability and hit testing. Requiring every
      // border pixel inside the viewport incorrectly rejects a reachable rounded button.
      await responsive.locator('#btnQuickStartWelcome').click({ trial: true });
      check('Primary action remains reachable at ' + width + 'x' + height, true);
      if (width === 390 || width === 844 || width === 2560) {
        await responsive.locator('#introScreen').evaluate(el => el.scrollTo({ top: 0, behavior: 'instant' }));
        await responsive.screenshot({ path: path.join(out, 'responsive-' + width + '.png') });
      }
      report.responsive.push({ width, height, dpr, ...info });
      await responsive.close();
    }

    await page.locator('#btnHomeExploreMemory').click();
    await page.waitForFunction(() => introScreen.dataset.memoryUnlocked === 'true' && !memoryChapter.inert);
    check('New logo retains navigation into the memory chapter', await page.locator('#memoryChapter').getAttribute('aria-hidden') !== 'true');
    await page.screenshot({ path: path.join(out, 'memory.png') });
    await page.locator('#memoryOpenMap').click();
    await page.waitForFunction(() => introScreen.classList.contains('intro-hidden'));
    check('Memory chapter still opens the map', await page.evaluate(() => document.activeElement.id === 'mapScene'));
    await page.close();

    for (const viewport of [{ width:1440,height:900 }, { width:390,height:844 }]) {
      const reduced = await open({ viewport, reducedMotion: 'reduce' });
      await reduced.locator('#btnHomeOpeningStart').click();
      check('Reduced motion shows the logo immediately at ' + viewport.width, await reduced.evaluate(() => GoiVietHomeIntro.getState().phase === 'complete' && GoiVietHomeIntro.getState().paused));
      await reduced.locator('#homeLogoEffect img').hover();
      check('Reduced motion suppresses logo hover movement at ' + viewport.width, await reduced.locator('#homeLogoEffect img').evaluate(el => getComputedStyle(el).transform === 'none'));
      await reduced.locator('#btnHomeOpeningReplay').click();
      check('Reduced-motion replay remains static at ' + viewport.width, await reduced.evaluate(() => GoiVietHomeIntro.getState().phase === 'complete' && GoiVietHomeIntro.getState().paused));
      await reduced.locator('#btnQuickStartWelcome').click();
      await reduced.waitForFunction(() => introScreen.classList.contains('intro-hidden'));
      check('New logo does not block entering the map at ' + viewport.width, await reduced.evaluate(() => document.activeElement.id === 'mapScene'));
      await reduced.close();
    }

    const fallback = await browser.newPage();
    fallback.on('pageerror', error => report.errors.push(error.message));
    await fallback.route('**/homepage-reference-v8/assets-*.js*', route => route.abort());
    await fallback.goto(url); await fallback.waitForFunction(() => window.GoiVietHomeIntro);
    await fallback.evaluate(() => GoiVietHomeIntro.ready);
    await fallback.locator('#btnHomeOpeningStart').click();
    check('Landscape load failure still reveals logo and controls', await fallback.evaluate(() => GoiVietHomeIntro.getState().failed && GoiVietHomeIntro.getState().phase === 'complete' && !btnQuickStartWelcome.disabled && document.querySelector('#homeLogoEffect img').naturalWidth > 0));
    await fallback.close();
    check('No browser JavaScript errors', report.errors.length === 0, report.errors);
  } finally {
    await browser.close();
    await fs.writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
  }
  console.log(JSON.stringify({ passed: report.checks.filter(c => c.passed).length, responsive: report.responsive.length, errors: report.errors, evidence: out }));
})().catch(error => { console.error(error); process.exitCode = 1; });
