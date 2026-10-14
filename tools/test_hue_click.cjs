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

  await page.evaluate(() => {
    window.eventsLog = [];
    ['mousedown', 'mousemove', 'mouseup', 'click'].forEach(type => {
      window.addEventListener(type, e => {
        window.eventsLog.push({
          type,
          x: e.clientX,
          y: e.clientY,
          hovered: state.hoveredItem?.id,
          selected: state.selectedPlaceId
        });
      }, true);
    });
  });

  await page.locator('#btnRecenterMap').click();
  await page.waitForTimeout(800);
  const pin = await page.evaluate(() => {
    const p = renderedHitDemoPins.find(p => p.place.id === 'hue');
    return p && { x: p.sx, y: p.sy, exposed: document.elementFromPoint(p.sx, p.sy) === mainCanvas };
  });
  console.log('Hue pin:', pin);

  await page.mouse.move(pin.x, pin.y);
  console.log('After move, hover:', await page.evaluate(() => state.hoveredItem?.id));
  await page.mouse.down();
  console.log('After down, hover:', await page.evaluate(() => state.hoveredItem?.id));
  await page.mouse.up();
  console.log('After up, selected:', await page.evaluate(() => state.selectedPlaceId));
  
  const logs = await page.evaluate(() => window.eventsLog);
  console.log('Events log:', JSON.stringify(logs.slice(-10), null, 2));

  await browser.close();
})();
