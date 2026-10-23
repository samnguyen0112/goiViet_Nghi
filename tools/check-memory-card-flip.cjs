const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const out = path.resolve(__dirname, '../verification/memory-card-flip');
(async () => {
  await fs.mkdir(out, { recursive: true });
  const temp = path.join(out, 'browser-temp');
  await fs.mkdir(temp, { recursive: true });
  process.env.TEMP = process.env.TMP = temp;
  console.log('Launching local browser');
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', timeout: 20000 });
  const errors = [], results = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    page.on('pageerror', error => errors.push(error.message));
    console.log('Loading preview');
    await page.goto('http://127.0.0.1:8765/map-surroundings-preview-3.html', { waitUntil: 'load' });
    console.log('Preview loaded');
    await page.waitForFunction(() => window.GoiVietMemoryChapter && window.GoiVietHomeIntro);
    await page.evaluate(async () => {
      window.GoiVietHomeIntro.skip();
      window.GoiVietMemoryChapter.begin();
      await document.fonts.ready;
      await Promise.all([...document.querySelectorAll('.mc img')].map(img => { img.loading = 'eager'; return img.decode().catch(() => {}); }));
    });
    console.log('Chapter ready');
    for (const width of [1440, 820, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.locator('.mc-card-stack').evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.evaluate(() => document.body.classList.remove('reduced-motion'));
      const before = await page.evaluate(() => window.GoiVietMemoryChapter.getState().questionIndex);
      // Freeze the real animation and timers to inspect the entire turn deterministically.
      await page.clock.install();
      await page.locator('#memoryNextCard').evaluate(el => { for (let i = 0; i < 10; i++) el.click(); });
      assert.equal(await page.evaluate(() => window.GoiVietMemoryChapter.getState().flipping), true, 'Animated turn did not start');
      assert.equal(await page.locator('#memoryCard').evaluate(el => el.getAnimations().length), 1, 'Flip animation is missing');
      for (const time of [0, 185, 370, 555, 739]) {
        await page.locator('#memoryCard').evaluate((el, time) => {
          for (const animation of el.getAnimations()) { animation.pause(); animation.currentTime = time; }
        }, time);
        const state = await page.locator('.mc-card-stack').evaluate(el => {
          const under = el.querySelector('.mc-card-under');
          const style = getComputedStyle(under);
          return { visibility: style.visibility, opacity: style.opacity, loaded: under.querySelector('img').naturalWidth > 0 };
        });
        if (!process.argv.includes('--before')) {
          assert.equal(state.visibility, 'visible', `${width}/${time}: rear card disappears`);
          assert.equal(state.opacity, '1');
          assert(state.loaded);
          assert.equal(await page.locator('.mc-card-source-fragment').count(), 0, 'Occluded source fragment remains');
        }
        if (time === 0 || time === 370 || time === 555) {
          await page.screenshot({ path: path.join(out, `${process.argv.includes('--before') ? 'before' : 'after'}-${width}-${time}.png`) });
        }
      }
      await page.clock.runFor(800);
      assert.equal(await page.evaluate(() => window.GoiVietMemoryChapter.getState().flipping), false);
      assert.equal(await page.evaluate(() => window.GoiVietMemoryChapter.getState().questionIndex), (before + 1) % 9);
      await page.clock.resume();
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.locator('#memoryNextCard').evaluate(el => el.click());
      assert.equal(await page.evaluate(() => window.GoiVietMemoryChapter.getState().flipping), false);
      assert.equal(await page.evaluate(() => window.GoiVietMemoryChapter.getState().questionIndex), (before + 2) % 9);
      results.push({ width, rapidClicks: 'passed', reducedMotion: 'passed' });
    }
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ results, errors, screenshots: out }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
