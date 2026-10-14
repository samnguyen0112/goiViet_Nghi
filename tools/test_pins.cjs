const { chromium } = require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const context = await browser.newContext({ viewport: { width: 1597, height: 985 } });
  const page = await context.newPage();
  await page.route('**/*', async r => {
    const u = new URL(r.request().url());
    if (u.origin === 'http://map-upgrade.local') {
      const f = path.resolve('.', '.' + decodeURIComponent(u.pathname));
      const b = fs.readFileSync(f);
      r.fulfill({ body: b });
    } else r.abort();
  });
  await page.goto('http://map-upgrade.local/index.html');
  await page.waitForFunction(() => window.GoiVietSourceScene && window.GoiVietSourceScene.ready);
  await page.locator('#btnHomeOpeningSkip').click();
  await page.locator('#btnQuickStartWelcome').click();
  await page.locator('#btnRecenterMap').click();
  await page.waitForTimeout(1000);

  for (const id of ['hn', 'hue', 'hcm']) {
    await page.locator('#btnRecenterMap').click();
    await page.waitForTimeout(800);
    const pin = await page.evaluate(id => {
      const p = renderedHitDemoPins.find(p => p.place.id === id);
      return p && { x: p.sx, y: p.sy, exposed: document.elementFromPoint(p.sx, p.sy) === mainCanvas };
    }, id);
    console.log(`Pin for ${id}:`, pin);
    await page.mouse.move(pin.x, pin.y);
    const hover = await page.evaluate(() => state.hoveredItem);
    console.log(`Hover for ${id}:`, hover);
    await page.mouse.click(pin.x, pin.y);
    await page.waitForTimeout(300);
    const res = await page.evaluate(id => ({
      selected: state.selectedPlaceId,
      cardSelected: document.getElementById(`placeCard-${id}`)?.classList.contains('selected')
    }), id);
    console.log(`Result for ${id}:`, res);
  }

  await browser.close();
})();
