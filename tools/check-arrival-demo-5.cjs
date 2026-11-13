// E2E for the isolated arrival demo. Run with tools/perf/server.cjs on 8770:
// timeout 900 node tools/check-arrival-demo-5.cjs
// --all-stations checks all 36 VI/EN layouts separately, keeping the required suite within 900 s.
// --dark-only repeats case 15 after a colour-only change, preserving results.json.
// --preview-5 verifies the integrated page and writes to verification/arrival-preview-5.
// Windows: & 'C:\Program Files\Git\usr\bin\timeout.exe' 900 node tools/check-arrival-demo-5.cjs
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { launch, BASE, fs, path, ROOT, summarize, quantile, systemBusyPct } = require('./perf/lib.cjs');
const integrated = process.argv.includes('--preview-5');
const OUT = path.join(ROOT, integrated ? 'verification/arrival-preview-5' : 'verification/arrival-demo-5');
const DEMO = 'map-surroundings-preview-5-arrival-demo.html';
const BASELINE = 'map-surroundings-preview-5.html';
const TARGET = integrated ? BASELINE : DEMO;
const rows = [], failures = [], network = [], errors = [], performanceRuns = [];
let browser;
fs.mkdirSync(OUT, { recursive: true });
const bounded = (promise, ms, label) => {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(label + ': timeout ' + ms + ' ms')), ms); })]).finally(() => clearTimeout(timer));
};
const evaluate = (page, ...args) => bounded(page.evaluate(...args), 12000, 'page.evaluate');
const visible = el => el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
const wait = (page, fn, arg, timeout = 20000) => page.waitForFunction(fn, arg, { timeout });
const modal = id => '#' + id + '.open';
const shot = (page, name, options = {}) => page.screenshot({ path: path.join(OUT, name + '.png'), timeout: 12000, ...options });

async function test(page, size, number, label, fn) {
  const start = Date.now();
  const row = { size, case: number, label, ok: false };
  try {
    row.detail = await bounded(fn(), number === 7 || number === '36-stations' ? 180000 : 70000, label);
    row.ok = true;
  } catch (error) {
    row.error = String(error.stack || error);
    failures.push(row);
    await bounded(shot(page, size + '-FAIL-' + number), 13000, 'failure screenshot').catch(() => {});
    // Close the failed case's UI layers so later cases can still provide useful evidence.
    for (let n = 0; n < 5; n++) {
      const open = await bounded(evaluate(page, () => Boolean(getTopOpenModalElement() || document.querySelector('.control-disclosure[open]') ||
        window.GoiVietArrivalDemo?.inspect().open || window.GoiVietArrivalDemo?.inspect().listOpen)), 1500, 'recovery inspection').catch(() => false);
      if (!open) break;
      await page.keyboard.press('Escape').catch(() => {});
    }
  }
  row.ms = Date.now() - start;
  rows.push(row);
  console.log(`${row.ok ? 'PASS' : 'FAIL'} [${size}] ${number}. ${label}${row.ok ? '' : '\n' + row.error}`);
  return row.ok;
}

async function openPage(viewport, { file = TARGET, lang = 'vi', reduced = false, draft = false, touch = false } = {}) {
  const context = await browser.newContext({ viewport, hasTouch: touch, serviceWorkers: 'block', reducedMotion: reduced ? 'reduce' : 'no-preference' });
  try {
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  page.setDefaultNavigationTimeout(120000);
  const tag = viewport.width + 'x' + viewport.height + ':' + file;
  page.on('pageerror', error => errors.push({ tag, type: 'pageerror', message: error.message }));
  page.on('console', msg => { if (msg.type() === 'error') errors.push({ tag, type: 'console', message: msg.text() }); });
  page.on('requestfailed', request => network.push({ tag, url: request.url(), error: request.failure()?.errorText }));
  page.on('response', response => { if (response.status() >= 400) network.push({ tag, url: response.url(), status: response.status() }); });
  // This task is local-only. An attempted external resource is a test failure.
  await page.route(/^https?:/, route => route.request().url().startsWith(BASE) ? route.continue() : route.abort('blockedbyclient'));
  await page.goto(BASE + file + '?lang=' + lang + (draft ? '&sach=nhap' : ''), { waitUntil: 'domcontentloaded' });
  await wait(page, () => window.GoiVietHomeIntro && window.GoiVietJourneyPreview && window.GoiVietBooks, null, 120000);
  // Skip only the homepage cinematic; all map entry/selection actions below use real UI.
  await evaluate(page, () => GoiVietHomeIntro.skip());
  await page.locator('#btnHomeExploreMemory').click();
  await page.locator('#memoryOpenMap').click({ timeout: 120000 });
  await wait(page, () => document.querySelector('#introScreen.intro-hidden') && !document.querySelector('#memoryMapTransition.is-covering'), null, 120000);
  await evaluate(page, () => document.fonts.ready);
  await page.waitForTimeout(650);
  return page;
  } catch(error) { await bounded(context.close(),12000,'failed initialization context.close').catch(()=>{}); throw error; }
}

async function pinPoint(page, id) {
  // Closing a floating panel changes the map origin before the next paint updates its hit regions.
  await wait(page, id => {
    if (isSceneAnimating()) return false;
    const node = GoiVietJourneyNetwork.node(id), [x, y] = project3D(...node.point, 38, state.cam, cw, ch);
    const rect = mainCanvas.getBoundingClientRect();
    return hitTestCanvasAt(x, y)?.id === id && document.elementFromPoint(x + rect.left, y + rect.top)?.id === 'mainCanvas';
  }, id);
  return evaluate(page, id => {
    const node = GoiVietJourneyNetwork.node(id);
    const [x, y] = project3D(...node.point, 38, state.cam, cw, ch);
    const rect = mainCanvas.getBoundingClientRect();
    const hit = hitTestCanvasAt(x, y);
    const top = document.elementFromPoint(x + rect.left, y + rect.top);
    return { x: x + rect.left, y: y + rect.top, hit: hit?.id, target: top?.id };
  }, id);
}
async function clickPin(page, id) {
  const point = await pinPoint(page, id);
  assert.equal(point.hit, id, 'Projected pin must pass hitTestCanvasAt: ' + JSON.stringify(point));
  assert.equal(point.target, 'mainCanvas', 'Pin covered by UI: ' + JSON.stringify(point));
  await page.mouse.click(point.x, point.y);
  await wait(page, id => GoiVietJourneyPreview.inspect().selected === id, id);
  return point;
}

async function pickFromList(page, query, id) {
  if (await page.locator('#arrivalSheet').isVisible()) await page.locator('#arrivalSheet [data-arrival-action="other"]').click();
  else if (!await page.locator('#stationPanel').isVisible()) await page.locator('#previewPanelOpen').click();
  await page.locator('#provSearchInput').fill(query);
  await page.locator('#station-pick-' + id).click();
  await wait(page, id => GoiVietJourneyPreview.inspect().selected === id && document.getElementById('stationPanel').hidden, id);
}
async function arrived(page, id) {
  await wait(page, id => GoiVietJourneyPreview.inspect().currentId === id && !GoiVietJourneyPreview.inspect().running &&
    GoiVietArrivalDemo.isSheetOpen() && document.querySelector('#arrivalSheet').dataset.place === id, id);
  await page.waitForTimeout(400);
}
async function travel(page, query, id, instant = false) {
  if (await page.locator('#arrivalSheet').isVisible()) await page.locator('#arrivalSheet .arrival-close').click();
  await pickFromList(page, query, id);
  await page.locator(instant && await page.locator('.journey-instant').isVisible() ? '.journey-instant' : '.journey-depart').click();
  await arrived(page, id);
}
async function assertNoModes(page) {
  assert.equal(await evaluate(page, () => [...document.querySelectorAll('.gv-station-mode,.journey-arrival-mode')]
    .filter(el => el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })).length), 0);
  assert.equal(await page.locator(modal('deckModal') + ',' + modal('bookModal')).count(), 0);
}
async function layout(page, id, { compact = false } = {}) {
  const result = await evaluate(page, ({ id, compact }) => {
    const sheet = document.getElementById('arrivalSheet'), outer = sheet.getBoundingClientRect();
    const visible = el => el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
    const overlap = (a, b) => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
    const selectors = ['.gv-station-art', '#arrivalStationTitle', '.arrival-summary', '.gv-station-highlights > div', '.gv-station-mode', '.arrival-sheet-foot'];
    const clipped = selectors.flatMap(sel => [...sheet.querySelectorAll(sel)].filter(visible).map(el => {
      const r = el.getBoundingClientRect();
      return { sel, text: el.innerText, r: r.toJSON(), ok: r.left >= outer.left && r.right <= outer.right && r.top >= outer.top && r.bottom <= outer.bottom && r.top >= 0 && r.bottom <= innerHeight };
    })).filter(r => !r.ok);
    const obstacles = ['#journeyRouteBar', '.bottom-dock', '.left-helper', '.top-header'].map(sel => ({ sel, el: document.querySelector(sel) })).filter(r => r.el && visible(r.el));
    const overlaps = obstacles.filter(r => overlap(outer, r.el.getBoundingClientRect())).map(r => r.sel);
    if (mapCompass && overlap(outer, { left: mapCompass.x - 45, right: mapCompass.x + 45, top: mapCompass.y - 38, bottom: mapCompass.y + 64 })) overlaps.push('compass');
    const point = GoiVietJourneyNetwork.node(id).point, [x, y] = project3D(...point, 38, state.cam, cw, ch);
    const stationClear = x < outer.left - 10 || x > outer.right + 10 || y < outer.top - 10 || y > outer.bottom + 10;
    const art = sheet.querySelector('.gv-station-art').getBoundingClientRect();
    return { clipped, overlaps, stationClear, artRatio: art.width / art.height, overflowX: document.documentElement.scrollWidth > innerWidth,
      sheetScroll: sheet.scrollTop, outer: outer.toJSON(), point: [x, y], focus: document.activeElement.id, compact };
  }, { id, compact });
  assert(!result.overflowX, 'Horizontal page overflow');
  if (!compact) {
    assert.deepEqual(result.clipped, [], 'Clipped essentials: ' + JSON.stringify(result.clipped));
    assert.deepEqual(result.overlaps, [], 'Sheet overlap: ' + JSON.stringify(result));
    assert(result.stationClear, 'Station covered by sheet: ' + JSON.stringify(result));
    assert.equal(result.sheetScroll, 0);
    assert(Math.abs(result.artRatio - 16 / 9) < .025, 'Station image must be 16:9');
  }
  return result;
}
async function tabTo(page, selector) {
  for (let n = 0; n < 90; n++) {
    if (await page.locator(selector).evaluate(el => document.activeElement === el)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error('Tab did not reach ' + selector);
}
async function drawCard(page) {
  await wait(page, () => document.getElementById('deckModal').classList.contains('open') &&
    document.getElementById('deckModal').contains(document.activeElement));
  await page.locator('#fannedDeckBox .fanned-card:enabled').first().focus();
  await page.keyboard.press('Enter');
  await wait(page, () => state.activeCard && !state.isDrawingCardLock);
}
async function enCheck(page) {
  const result = await evaluate(page, () => {
    const roots = ['#arrivalSheet', '#journeyRouteBar', '#stationPanel', '#arrivalStartHint', '#arrivalPinTip'];
    const bad = /Đã đến ga|Lượt của|Ga thứ|cả nhà|Chơi thẻ|Đọc sách|Còn \d+ lá|Sắp có|Bản nháp|Danh thắng|Hương vị|Di sản|Khám phá|Đến ngay|Đang qua|Đang chạy|Sẵn sàng|Danh sách ga|Ga tiếp theo|Đã đặt chân|Chọn ga khác|Sổ hành trình|Tìm ga|Kỷ niệm đã lưu|Mở bưu thiếp/;
    const leaks = roots.filter(sel => document.querySelector(sel)?.checkVisibility()).flatMap(sel => {
      const el = document.querySelector(sel);
      return bad.test(el.innerText) ? [{ sel, text: el.innerText }] : [];
    });
    const clippedText = roots.flatMap(sel => [...document.querySelectorAll(sel + ' button,' + sel + ' h3,' + sel + ' p,' + sel + ' dd,' + sel + ' strong,' + sel + ' small,' + sel + ' .arrival-stamp-title,' + sel + ' .journey-route-title')])
      // Photo buttons intentionally crop their image/blur backdrop; inspect actual UI text here.
      .filter(el => !el.classList.contains('gv-station-art') && el.innerText.trim() && el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && (el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 2))
      .map(el => ({ text: el.innerText, class: el.className, width: el.clientWidth, scrollWidth: el.scrollWidth }));
    return { leaks, clippedText, horizontal: document.documentElement.scrollWidth > innerWidth };
  });
  assert.deepEqual(result.leaks, [], 'VI UI left in EN: ' + JSON.stringify(result.leaks));
  assert.deepEqual(result.clippedText, [], 'EN text clipped: ' + JSON.stringify(result.clippedText));
  assert(!result.horizontal);
  return result;
}

async function verifyDark(page, size) {
await page.locator('#headerSettings > summary').click(); await page.locator('#btnTheme').click();
await page.locator('#headerSettings > summary').click();
assert.equal(await page.locator('#arrivalSheet').evaluate(el => getComputedStyle(el).backgroundImage), 'none', 'Dark contrast measurement requires an opaque background without a light gradient');
const contrast = await evaluate(page, () => {
  const rgb = s => (s.match(/[\d.]+/g) || []).map(Number);
  const luminance = color => rgb(color).slice(0, 3).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
  const elements = [...document.querySelectorAll('#arrivalSheet h3,#arrivalSheet p,#arrivalSheet small,#arrivalSheet dt,#arrivalSheet dd,#arrivalSheet strong,#arrivalSheet summary,#arrivalSheet .arrival-stamp-title,#arrivalSheet .arrival-station-kicker,#arrivalSheet .arrival-reached,#arrivalSheet [data-arrival-action="other"]')];
  return elements.filter(el => el.checkVisibility()).map(el => {
    let parent = el, bg;
    while (parent) { const color = getComputedStyle(parent).backgroundColor; if (rgb(color)[3] !== 0) { bg = color; break; } parent = parent.parentElement; }
    const fg = getComputedStyle(el).color, l = [luminance(fg), luminance(bg || 'rgb(255,255,255)')].sort((a, b) => b - a);
    return { text: el.innerText, fg, bg, ratio: (l[0] + .05) / (l[1] + .05) };
  });
});
assert(contrast.length > 12);
assert.deepEqual(contrast.filter(r => r.ratio < 4.5), [], 'Low contrast: ' + JSON.stringify(contrast));
await shot(page, size + '-15-dark');
return { minimum: Math.min(...contrast.map(r => r.ratio)), samples: contrast };
}

async function verifyAllStations(page, size) {
await page.emulateMedia({ reducedMotion: 'reduce' });
await wait(page, () => state.reducedMotion);
const stops = await evaluate(page, () => ALL_PLAYABLE_PLACES.map(place => ({ id: place.id, query: place.name })));
const layouts = [];
for (const stop of stops) {
  await travel(page, stop.query, stop.id);
  await wait(page, () => !isSceneAnimating());
  const en = await layout(page, stop.id);
  await enCheck(page);
  await page.locator('.gv-lang-toggle-header [data-set-lang="vi"]').click();
  const vi = await layout(page, stop.id);
  await page.locator('.gv-lang-toggle-header [data-set-lang="en"]').click();
  layouts.push({ id: stop.id, en, vi });
}
await shot(page, size + '-extra-36-stations');
return { checked: layouts.length, layouts };
}

async function verifySize(viewport) {
  const size = viewport.width + 'x' + viewport.height;
  const page = await openPage(viewport);
  try {
    await test(page, size, 1, 'Map starts without a panel or play modes; three chips', async () => {
      assert(!await page.locator('#stationPanel').isVisible());
      assert(!await page.locator('#arrivalSheet').isVisible());
      await assertNoModes(page);
      assert(await page.locator('#previewPanelOpen').isVisible());
      assert(await page.locator('#previewPanelOpen').evaluate(el => Boolean(el.closest('.top-header'))), 'Directory control belongs in the header');
      const headerOverlaps = await evaluate(page, () => {
        const items = ['.brand-group', '.session-strip', '.header-actions'].map(s => ({ s, r: document.querySelector('.top-header ' + s).getBoundingClientRect() }));
        return items.flatMap((a, i) => items.slice(i + 1).filter(b => a.r.left < b.r.right - 1 && a.r.right > b.r.left + 1 && a.r.top < b.r.bottom - 1 && a.r.bottom > b.r.top + 1).map(b => [a.s, b.s]));
      });
      assert.deepEqual(headerOverlaps, [], 'Header groups must not overlap');
      assert.equal(await page.locator('#arrivalStartHint button').count(), 3);
      assert.equal(await page.locator('script[src*="offline-control-5"]').count(), integrated ? 1 : 0);
      if (integrated) {
        await page.locator('#headerSettings > summary').click();
        assert(await page.locator('#btnPrepareOffline').isVisible());
        await page.keyboard.press('Escape');
      } else assert(!await page.locator('.settings-offline').isVisible());
      await page.locator('#previewPanelOpen').click();
      assert(await page.locator('#stationPanel').isVisible());
      assert(!await page.locator('#previewPanelClose').isVisible(), 'Only one directory control may be visible');
      assert.equal(await page.locator('#previewPanelOpen').getAttribute('aria-expanded'), 'true');
      assert.match(await page.locator('#previewPanelOpen').getAttribute('aria-label'), /Đóng danh sách/);
      const directory = await page.locator('#stationPanel').boundingBox();
      assert.equal(Math.round(directory.width), viewport.width >= 1600 ? 500 : viewport.width <= 1500 ? 392 : 420);
      const journal = await page.locator('#stationJournalToggle').boundingBox();
      assert(journal.y + journal.height <= directory.y + directory.height + 1, 'Featured journal must be visible without scrolling');
      await page.mouse.move(5, 5);
      await page.screenshot({ path: path.join(OUT, size + '-editorial-directory.png'), timeout: 12000 });
      await page.locator('#previewPanelOpen').click();
      assert(!await page.locator('#stationPanel').isVisible());
      assert.equal(await page.locator('#previewPanelOpen').getAttribute('aria-expanded'), 'false');
      await shot(page, size + '-01-start');
      return { directory, journal, directoryToggleCount: 1 };
    });
    await test(page, size, 2, 'Real mouse click on Huế pin previews the route only', async () => {
      const point = await clickPin(page, 'hue');
      assert.equal(await page.locator('#arrivalExplore').innerText(), 'Khám phá');
      assert.match(await page.locator('.arrival-eta').innerText(), /\d/);
      assert.match(await page.locator('.arrival-route-highlights').innerText(), /·/);
      assert((await evaluate(page, () => GoiVietJourneyPreview.inspect().plan.railLength)) > 0);
      assert(!await page.locator('#arrivalStartHint').isVisible());
      await assertNoModes(page);
      await shot(page, size + '-02-route');
      await page.locator('#journeyRouteBar').screenshot({ path: path.join(OUT, size + '-editorial-departure.png'), timeout: 12000 });
      return point;
    });
    await test(page, size, 3, 'Explore starts and locks; progress grows without modes', async () => {
      await page.locator('#arrivalExplore').click();
      assert.equal(await evaluate(page, () => GoiVietJourneyPreview.inspect().running), 'hue');
      assert(await page.locator('#arrivalExplore').isDisabled());
      const before = +(await page.locator('#journeyRouteBar [role="progressbar"]').getAttribute('aria-valuenow'));
      await page.waitForTimeout(650);
      const after = +(await page.locator('#journeyRouteBar [role="progressbar"]').getAttribute('aria-valuenow'));
      assert(after > before);
      await assertNoModes(page);
      await shot(page, size + '-03-moving');
      return { before, after, passing: await page.locator('.arrival-passing').innerText() };
    });
    await test(page, size, 4, 'Arrival photo, highlights, modes, safe area and heading focus', async () => {
      await arrived(page, 'hue');
      assert.equal(await page.locator('#arrivalSheet').getAttribute('role'), 'dialog');
      assert.equal(await page.locator('#arrivalSheet').getAttribute('aria-modal'), 'false');
      await wait(page, () => document.querySelector('#arrivalSheet .gv-station-art-photo')?.naturalWidth > 0);
      assert.equal(await page.locator('#arrivalSheet .gv-station-highlights > div').count(), 3);
      assert.equal(await page.locator('#arrivalSheet .gv-station-mode').count(), 2);
      assert.equal(await evaluate(page, () => document.activeElement.id), 'arrivalStationTitle');
      await wait(page, () => !isSceneAnimating());
      const result = await layout(page, 'hue');
      await page.locator('#arrivalSheet .gv-station-photo-credit summary').click();
      await layout(page, 'hue'); // expanding credits cannot push the modes out
      await page.locator('#arrivalSheet .gv-station-photo-credit summary').click();
      await shot(page, size + '-04-arrived');
      await page.locator('#arrivalSheet').screenshot({ path: path.join(OUT, size + '-editorial-arrival.png'), timeout: 12000 });
      // Blank sea closes the sheet, retaining arrival and a way to reopen it.
      const blank = await evaluate(page, () => {
        for (let y = 360; y < ch - 160; y += 40) for (let x = cw - 470; x > cw / 2; x -= 40)
          if (!hitTestCanvasAt(x, y) && document.elementFromPoint(x, y)?.id === 'mainCanvas') return { x, y };
      });
      assert(blank, 'Find a real blank map point');
      await page.mouse.click(blank.x, blank.y);
      assert(!await page.locator('#arrivalSheet').isVisible());
      assert.equal(await evaluate(page, () => GoiVietJourneyPreview.presentation().arrival.id), 'hue');
      await page.locator('#arrivalOpenInfo').click();
      return result;
    });
    await test(page, size, 5, 'Draw a real card; close preserves sheet, count and focus', async () => {
      await page.locator('#deck-open-hue').click();
      await page.locator(modal('deckModal')).waitFor();
      assert.equal(await evaluate(page, () => state.deckPlaceId), 'hue');
      await drawCard(page);
      await shot(page, size + '-05-card');
      await page.keyboard.press('Escape');
      assert(await page.locator('#arrivalSheet').isVisible());
      assert.match(await page.locator('#deck-open-hue small').innerText(), /Còn 3 lá/);
      assert.equal(await evaluate(page, () => document.activeElement.id), 'deck-open-hue');
    });
    await test(page, size, 6, 'Reader follows the draft policy for the same station and restores focus', async () => {
      await page.locator('#book-open-hue').click();
      await wait(page, () => GoiVietBooks.inspect().open && GoiVietBooks.inspect().placeId === 'hue');
      assert.equal(await evaluate(page, () => GoiVietBooks.inspect().kind), integrated ? 'soon' : 'book');
      await shot(page, size + '-06-book');
      await page.keyboard.press('Escape');
      assert(await page.locator('#arrivalSheet').isVisible());
      assert.equal(await evaluate(page, () => document.activeElement.id), 'book-open-hue');
      // UI gateway also rejects mismatched station/programmatic legacy entries.
      assert.equal(await evaluate(page, () => { openPlaceMode('hn', 'deck'); return document.getElementById('deckModal').classList.contains('open'); }), false);
      assert.equal(await evaluate(page, () => { openDeckModal('hue', document.getElementById('book-open-hue')); return document.getElementById('deckModal').classList.contains('open'); }), false);
    });
    await test(page, size, 8, 'Previously visited stop has Arrive now', async () => {
      await travel(page, 'hanoi', 'hn', true);
      await page.locator('#arrivalSheet .arrival-close').click();
      await pickFromList(page, 'hue', 'hue');
      assert(await page.locator('.journey-instant').isVisible());
      await page.locator('.journey-instant').click();
      assert.equal(await evaluate(page, () => GoiVietJourneyPreview.inspect().running), null);
      await arrived(page, 'hue');
      await shot(page, size + '-08-revisit');
    });
    await test(page, size, 9, 'Hoàng Sa takes a sea route and uses a ship without broken images', async () => {
      await page.locator('#btnIslandHoangSa').click();
      assert(!await page.locator('#arrivalSheet').isVisible());
      await page.locator('#arrivalExplore').click();
      assert((await evaluate(page, () => GoiVietJourneyPreview.inspect().plan.seaLength)) > 0);
      await arrived(page, 'hoang-sa');
      assert.equal(await page.locator('#arrivalSheet .gv-station-art img').count(), 0);
      assert.equal(await page.locator('#arrivalSheet .gv-station-art use[href="#gv-station-ship"]').count(), 1);
      assert.equal(await evaluate(page, () => [...document.querySelectorAll('#arrivalSheet img')].filter(img => img.complete && !img.naturalWidth).length), 0);
      await wait(page, () => !isSceneAnimating());
      const result = await layout(page, 'hoang-sa');
      await shot(page, size + '-09-hoang-sa');
      await page.locator('#book-open-hoang-sa').click();
      await wait(page, () => GoiVietBooks.inspect().open && GoiVietBooks.inspect().placeId === 'hoang-sa' && GoiVietBooks.inspect().kind === 'soon');
      await page.keyboard.press('Escape');
      assert(await page.locator('#arrivalSheet').isVisible());
      if (integrated) {
        const postOffice = page.locator('#arrivalSheet .arrival-island-entry');
        await postOffice.click();
        await wait(page, () => GoiVietFamilyVoyage.isOpenFor('hoang-sa'));
        await page.locator('#naturalClose').click();
        assert.equal(await evaluate(page, () => document.activeElement.dataset.arrivalAction), 'island');
        assert(await page.locator('#arrivalSheet').isVisible());
        await travel(page, 'truong sa', 'truong-sa');
        await layout(page, 'truong-sa');
        await postOffice.click();
        await wait(page, () => GoiVietFamilyVoyage.isOpenFor('truong-sa'));
        await shot(page, size + '-09-sea-post-office', { animations: 'disabled' });
        await page.locator('#naturalClose').click();
        assert(await page.locator('#arrivalSheet').isVisible());
      }
      return result;
    });
    await test(page, size, 10, 'Keyboard search: dish, unspaced name, English alias; Escape order', async () => {
      await page.keyboard.press('Escape');
      for (const [query, id] of [['bun bo', 'hue'], ['danang', 'dn'], ['saigon', 'hcm']]) {
        await tabTo(page, '#previewPanelOpen'); await page.keyboard.press('Enter');
        assert.equal(await evaluate(page, () => document.activeElement.id), 'provSearchInput');
        await page.keyboard.press('Control+A'); await page.keyboard.type(query); await page.keyboard.press('Enter');
        await wait(page, id => GoiVietJourneyPreview.inspect().selected === id && document.getElementById('stationPanel').hidden, id);
      }
      await tabTo(page, '#arrivalExplore'); await page.keyboard.press('Enter');
      await arrived(page, 'hcm');
      assert.equal(await evaluate(page, () => document.activeElement.id), 'arrivalStationTitle');
      await page.keyboard.press('Escape');
      assert.equal(await evaluate(page, () => document.activeElement.id), 'arrivalOpenInfo');
      await page.keyboard.press('Escape');
      assert.equal(await evaluate(page, () => GoiVietJourneyPreview.inspect().selected), null);
      await shot(page, size + '-10-keyboard');
    });
    await test(page, size, 11, 'Both ticket branches travel before modes; focus the requested mode', async () => {
      const destinations = [];
      for (const [action, prefix] of [['destination', 'deck-open-'], ['story', 'book-open-']]) {
        await page.locator('.header-actions > .craft-btn-red').click();
        await page.locator('#bambooCylinderGraphic').click();
        await page.locator('[data-ritual-action="' + action + '"]').waitFor({ state: 'visible' });
        const id = await evaluate(page, () => state.lastRolledPlaceId);
        assert.match(await page.locator('[data-ritual-action="' + action + '"]').innerText(), /Lên tàu/);
        await evaluate(page, () => GoiVietI18n.setLang('en', { remember: false }));
        try {
          assert.match(await page.locator('[data-ritual-action="' + action + '"]').innerText(), /Board the train/);
          assert(await page.locator('[data-ritual-action="' + action + '"]').evaluate(button => {
            // The ticket button's decorative notches extend outside its box; measure its text.
            const span = button.querySelector('span'), s = span.getBoundingClientRect(), b = button.getBoundingClientRect();
            return span.scrollWidth <= span.clientWidth + 2 && span.scrollHeight <= span.clientHeight + 2 && s.left >= b.left && s.right <= b.right && s.top >= b.top && s.bottom <= b.bottom;
          }));
        } finally { await evaluate(page, () => GoiVietI18n.setLang('vi', { remember: false })); }
        await page.locator('[data-ritual-action="' + action + '"]').click();
        assert.equal(await evaluate(page, () => GoiVietJourneyPreview.inspect().running), id);
        await assertNoModes(page);
        await arrived(page, id);
        assert.equal(await evaluate(page, () => document.activeElement.id), prefix + id);
        assert(await page.locator('#' + prefix + id).evaluate(el => el.classList.contains('arrival-mode-cue')));
        destinations.push(id);
        await shot(page, size + '-11-ticket-' + action);
        await page.keyboard.press('Escape');
      }
      return destinations;
    });
    await test(page, size, 12, 'Card suggestion closes the deck and prepares the next route', async () => {
      await travel(page, 'hanoi', 'hn', true);
      await page.locator('#deck-open-hn').click(); await drawCard(page);
      await page.locator('#btnDontKnowReveal').click();
      await page.locator('#memoryDetailsDrawer summary').click();
      await page.locator('#memoryPlaceInput').fill('Huế');
      await page.locator('#memoryNoteInput').fill('Kỷ niệm demo đến ga');
      await page.locator('#btnSaveMemoryPlace').click();
      const suggestion = page.locator('#memoryFeedbackBox button');
      await suggestion.waitFor(); await suggestion.click();
      await page.locator(modal('deckModal')).waitFor({ state: 'hidden' });
      assert.equal(await evaluate(page, () => GoiVietJourneyPreview.inspect().selected), 'hue');
      assert.equal(await evaluate(page, () => GoiVietJourneyPreview.inspect().running), null);
      assert.equal(await page.locator('#arrivalExplore').innerText(), 'Khám phá');
      assert.match(await page.locator('#srAnnouncer').innerText(), /Ga tiếp theo: Huế|Ga tiếp theo: TP\. Huế/);
      await shot(page, size + '-12-next-stop');
    });
    await test(page, size, 13, 'English updates open UI, list and tooltip without clipped text', async () => {
      assert.deepEqual(await evaluate(page, () => GoiVietI18n.missing().filter(key => key.startsWith('arrival.'))), []);
      await page.locator('.gv-lang-toggle-header [data-set-lang="en"]').click();
      await enCheck(page);
      await page.locator('.journey-instant').click(); await arrived(page, 'hue');
      await enCheck(page); await layout(page, 'hue');
      await page.locator('.gv-lang-toggle-header [data-set-lang="vi"]').click();
      assert.match(await page.locator('#arrivalSheet .arrival-reached').innerText(), /Đã đến ga/i);
      await page.locator('.gv-lang-toggle-header [data-set-lang="en"]').click();
      await enCheck(page);
      await wait(page, () => !document.getElementById('turnHandoffToast').classList.contains('show') && !document.getElementById('mapStationArrivalBanner').classList.contains('show'));
      await shot(page, size + '-13-english');
      await page.keyboard.press('Escape'); await page.locator('#previewPanelOpen').click();
      await page.locator('#tabScopeAll').click();
      await page.locator('#stationJournalToggle').click();
      await enCheck(page); await shot(page, size + '-13-list-english');
      await page.keyboard.press('Escape');
      await clickPin(page, 'hue');
      await wait(page, () => !isSceneAnimating());
      const point = await pinPoint(page, 'hue');
      await page.mouse.move(5, 5);
      await page.mouse.move(point.x, point.y); await page.locator('#arrivalPinTip').waitFor({ state: 'visible' });
      assert.match(await page.locator('#arrivalPinTip').innerText(), /Visited/); await enCheck(page);
      await shot(page, size + '-13-tooltip-english');
    });
    await test(page, size, 14, 'Reduced motion arrives immediately without sheet/banner animation', async () => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.mouse.move(10, 10);
      await pickFromList(page, 'danang', 'dn');
      await page.locator('#arrivalExplore').click();
      assert.equal(await evaluate(page, () => GoiVietJourneyPreview.inspect().running), null);
      await arrived(page, 'dn');
      assert.equal(await page.locator('#arrivalSheet').evaluate(el => getComputedStyle(el).animationName), 'none');
      assert(!await page.locator('#mapStationArrivalBanner').isVisible());
      await shot(page, size + '-14-reduced');
      await page.emulateMedia({ reducedMotion: 'no-preference' });
    });
    await test(page, size, 15, 'Dark theme screenshot and text contrast at least 4.5:1', () => verifyDark(page, size));
    await test(page, size, 16, 'Journal keeps visited stops, saved memory and postcard', async () => {
      await page.keyboard.press('Escape'); await page.locator('#previewPanelOpen').click();
      if (!await page.locator('#arrivalVisitedCount').isVisible()) await page.locator('#stationJournalToggle').click();
      assert.match(await page.locator('#arrivalVisitedCount').innerText(), /Visited \d+\/36/);
      assert((await page.locator('#arrivalVisitedList button').count()) >= 4);
      assert((await page.locator('#sidebarExploredList button').count()) >= 1);
      assert.match(await page.locator('#sidebarMentionedList').innerText(), /Huế/);
      await page.locator('#stationPostcard').click(); await page.locator(modal('postcardModal')).waitFor();
      assert.match(await page.locator('#postcardMentionedContainer').innerText(), /Kỷ niệm demo đến ga/);
      await shot(page, size + '-16-postcard');
      await page.keyboard.press('Escape');
      await page.locator('#sidebarMentionedList button').click();
      assert.equal(await evaluate(page, () => GoiVietJourneyPreview.inspect().selected), 'hue');
      assert(!await page.locator('#stationPanel').isVisible());
      await assertNoModes(page);
    });
    await test(page, size, 'P0/P1', 'Selection during travel, actual arrival, queued route and skip in motion', async () => {
      await pickFromList(page, 'hue', 'hue');
      await page.locator('#arrivalExplore').click();
      assert.equal(await evaluate(page, () => GoiVietJourneyPreview.inspect().running), 'hue');
      await pickFromList(page, 'saigon', 'hcm');
      assert.equal(await evaluate(page, () => GoiVietJourneyPreview.inspect().running), 'hue');
      await arrived(page, 'hue');
      assert.equal(await evaluate(page, () => GoiVietJourneyPreview.inspect().selected), 'hcm');
      // The queued stop is the route title's destination; no repeated caption after arrival.
      assert.equal(await page.locator('.journey-destination').innerText(), await evaluate(page, () => GoiVietArrivalDemo.stationName('hcm')));
      assert(!await page.locator('.journey-caption').isVisible());
      assert.equal(await page.locator('#arrivalSheet').getAttribute('data-place'), 'hue');
      await page.locator('#arrivalSheet .arrival-close').click();
      assert.equal(await evaluate(page, () => document.activeElement.id), 'arrivalOpenInfo');
      await page.keyboard.press('Enter');
      await page.locator('#arrivalExplore').click();
      await assertNoModes(page);
      assert.equal(await evaluate(page, () => GoiVietJourneyPreview.inspect().running), 'hcm');
      await page.locator('.journey-instant').click();
      await arrived(page, 'hcm');
      await shot(page, size + '-extra-queued-arrival');
    });
    await test(page, size, 17, 'No console errors, failed requests or HTTP errors', async () => {
      assert.deepEqual(errors.filter(r => r.tag === size + ':' + TARGET), []);
      assert.deepEqual(network.filter(r => r.tag === size + ':' + TARGET), []);
    });
  } finally { await bounded(page.context().close(), 12000, 'context.close'); }
}

async function verifyInitialStation(viewport) {
  const size=viewport.width+'x'+viewport.height, initial=await openPage(viewport,{lang:'en',draft:integrated});
  try {
    await test(initial,size,7,'Initial Hà Nội opens immediately and never runs',async()=>{
        await enCheck(initial);
        await initial.locator('#arrivalStartHint [data-arrival-pick="hn"]').click();
        assert.equal(await initial.locator('#arrivalExplore').innerText(), 'Explore');
        await initial.locator('#arrivalExplore').click();
        await arrived(initial, 'hn');
        assert.equal(await evaluate(initial, () => GoiVietJourneyPreview.inspect().running), null);
        await layout(initial, 'hn');
        await enCheck(initial);
        await shot(initial, size + '-07-current');
        // The picture and the same-station card link remain valid book entries.
        await initial.locator('#arrivalSheet .gv-station-art').click();
        await wait(initial, () => GoiVietBooks.inspect().open && GoiVietBooks.inspect().kind === 'book' && GoiVietBooks.inspect().placeId === 'hn');
        await initial.keyboard.press('Escape');
        assert.equal(await evaluate(initial, () => document.activeElement.id), 'story-hero-hn');
        await initial.locator('#deck-open-hn').click(); await drawCard(initial);
        const cardId = await evaluate(initial, () => state.activeCard.id);
        await initial.locator('#cardLinkedStoryContext [data-card-book="hn"]').click();
        await wait(initial, () => GoiVietBooks.inspect().open && GoiVietBooks.inspect().placeId === 'hn');
        await initial.keyboard.press('Escape');
        assert.equal(await evaluate(initial, () => state.activeCard.id), cardId);
        assert(await initial.locator(modal('deckModal')).isVisible());
        await initial.keyboard.press('Escape');
        if (viewport.width === 1366) {
          await initial.emulateMedia({ reducedMotion: 'reduce' });
          for (const [query, id] of [['hue', 'hue'], ['saigon', 'hcm'], ['thanh hoa', 'th']]) {
            await pickFromList(initial, query, id);
            await initial.locator('#arrivalExplore').click(); await arrived(initial, id);
            await initial.locator('#book-open-' + id).click();
            await wait(initial, id => GoiVietBooks.inspect().open && GoiVietBooks.inspect().kind === 'book' && GoiVietBooks.inspect().placeId === id, id);
            await shot(initial, size + '-07-default-book-' + id);
            await initial.keyboard.press('Escape');
            assert(await initial.locator('#arrivalSheet').isVisible());
          }
        }
    });
  } finally { await bounded(initial.context().close(),12000,'initial context.close'); }
}

async function mobileEnglish() {
  const page = await openPage({ width: 390, height: 844 }, { lang: 'en', reduced: true, touch: true });
  try {
    await test(page, '390x844', 13, 'English before map entry and bottom sheet without overflow', async () => {
      await enCheck(page); await shot(page, '390x844-13-start-english');
      await page.locator('#arrivalStartHint [data-arrival-pick="hn"]').click();
      await page.locator('#arrivalExplore').click(); await arrived(page, 'hn');
      await enCheck(page); await layout(page, 'hn', { compact: true });
      assert((await page.locator('#arrivalSheet').boundingBox()).x >= 0);
      await shot(page, '390x844-13-sheet-english');
      await page.keyboard.press('Escape'); await page.locator('#previewPanelOpen').click();
      await enCheck(page); await shot(page, '390x844-13-list-english');
      await page.locator('#station-pick-hue').tap();
      assert(await page.locator('#stationPanel').isHidden());
      assert(await page.locator('#arrivalSheet').isHidden());
      await page.locator('#arrivalExplore').tap();
      await arrived(page, 'hue');
      await enCheck(page);
    });
  } finally { await bounded(page.context().close(), 12000, 'context.close'); }
}

async function verifyRound3(viewport) {
  const size=viewport.width+'x'+viewport.height, page=await openPage(viewport,{draft:integrated});
  const reduce=async on=>{await page.emulateMedia({reducedMotion:on?'reduce':'no-preference'});await wait(page,on=>state.reducedMotion===on,on);};
  const visit=async(query,id)=>{await pickFromList(page,query,id);await page.locator('#arrivalExplore').click();await arrived(page,id);};
  let firstStamp=false,verse='';
  try {
    await test(page,size,'A','Book/Coming soon play opens the correct deck and restores sheet focus',async()=>{
      await reduce(true);await page.locator('#arrivalStartHint [data-arrival-pick="hn"]').click();await page.locator('#arrivalExplore').click();await arrived(page,'hn');
      await page.locator('#book-open-hn').click();await wait(page,()=>GoiVietBooks.inspect().open&&GoiVietBooks.inspect().kind==='book'&&!GoiVietBooks.inspect().busy&&document.getElementById('bookModal').contains(document.activeElement));
      await page.locator('#bookModal .gvb-page-range').focus();await page.keyboard.press('End');await wait(page,()=>GoiVietBooks.inspect().view===GoiVietBooks.inspect().lastView&&!GoiVietBooks.inspect().busy);
      await page.locator('#bookModal [data-act="play"]:visible').click();await page.locator('#deckModal.open').waitFor();assert.equal(await evaluate(page,()=>state.deckPlaceId),'hn');
      await page.keyboard.press('Escape');assert(await page.locator('#arrivalSheet').isVisible());assert(await evaluate(page,()=>['deck-open-hn','book-open-hn'].includes(document.activeElement.id)));
      await visit('danang','dn');await page.locator('#book-open-dn').click();await wait(page,()=>GoiVietBooks.inspect().kind==='soon'&&GoiVietBooks.inspect().placeId==='dn');
      await page.locator('#bookModal [data-act="play"]:visible').click();await page.locator('#deckModal.open').waitFor();assert.equal(await evaluate(page,()=>state.deckPlaceId),'dn');await shot(page,size+'-r3-A-book-to-cards');
      await page.keyboard.press('Escape');assert(await evaluate(page,()=>['deck-open-dn','book-open-dn'].includes(document.activeElement.id)));
      assert.equal(await evaluate(page,()=>GoiVietArrivalDemo.playFromReading('hn',document.getElementById('deck-open-dn'),'book')),false);
    });
    await test(page,size,'K','Six source regions plus islands; continuous 01–36; search is ungrouped',async()=>{
      await page.locator('#previewPanelOpen').click();await page.locator('#tabScopeAll').click();await page.locator('#provSearchInput').fill('');
      assert.equal(await page.locator('.arrival-region-group').count(),7);
      const numbers=await page.locator('.arrival-region-group .gv-station-folio').allTextContents();assert.deepEqual(numbers,Array.from({length:36},(_,i)=>String(i+1).padStart(2,'0')));
      const regions=await evaluate(page,()=>ALL_PLAYABLE_PLACES.map(p=>({id:p.id,region:GoiVietArrivalDemo.region(p)})));assert(regions.every(p=>p.region));
      await shot(page,size+'-r3-K-region-groups');await page.locator('#provSearchInput').fill('danang');assert.equal(await page.locator('.arrival-region-group').count(),0);assert.equal(await page.locator('#demoPlaceList [data-station-action="select"]').first().getAttribute('data-place'),'dn');await page.keyboard.press('Escape');return regions;
    });
    await test(page,size,'L','Turn handoff describes the prepared destination in VI and EN',async()=>{
      await visit('hanoi','hn');await pickFromList(page,'hue','hue');await page.locator('.turn-banner .small-wood-btn').click();assert.match(await page.locator('#turnHandoffToast').innerText(),/sẵn sàng tới.*Huế/);
      await page.locator('.gv-lang-toggle-header [data-set-lang="en"]').click();assert.match(await page.locator('#turnHandoffToast').innerText(),/train is ready for/);await page.locator('.gv-lang-toggle-header [data-set-lang="vi"]').click();await shot(page,size+'-r3-L-turn-ready');
    });
    await test(page,size,'B','Actual passing-text changes do not dirty fixed-size label obstacles',async()=>{
      await reduce(false);await pickFromList(page,'saigon','hcm');
      await evaluate(page,()=>{
        window.__r3Dirty=[];const bar=document.getElementById('journeyRouteBar');let last=bar.getBoundingClientRect();
        window.__r3Observer=new MutationObserver(records=>{if(!records.some(r=>(r.target.nodeType===3?r.target.parentElement:r.target).closest?.('.arrival-passing')))return;const r=bar.getBoundingClientRect(),s=GoiVietJourneyPreview.inspect();if(s.running&&s.elapsed>700&&Math.abs(r.width-last.width)<.1&&Math.abs(r.height-last.height)<.1)window.__r3Dirty.push({text:bar.querySelector('.arrival-passing').textContent,dirty:GoiVietLabelPerformance.inspect().dirty});last=r;});
        window.__r3Observer.observe(bar,{subtree:true,characterData:true,childList:true});
      });await page.locator('#arrivalExplore').click();await arrived(page,'hcm');const samples=await evaluate(page,()=>{window.__r3Observer.disconnect();return window.__r3Dirty;});assert(samples.length>=2,JSON.stringify(samples));assert(samples.every(s=>!s.dirty),JSON.stringify(samples));return samples;
    });
    await test(page,size,'D','Passing text tracks the nearest real vehicle position on rail and sea',async()=>{
      const result=[];
      for(const [fromQ,from,toQ,to]of [['danang','dn','ca mau','cm'],['hanoi','hn','truong sa','truong-sa']]){
        await reduce(true);await visit(fromQ,from);await reduce(false);await pickFromList(page,toQ,to);
        await evaluate(page,()=>{window.__r3Samples=[];window.__r3Sampling=setInterval(()=>{const s=GoiVietJourneyPreview.presentation();if(!s.trip)return;const run=s.trip.phase?.leg.mode==='sea'?state.seaRun:state.railRun;if(!run)return;const nearest=s.trip.route.nodeIds.filter(id=>CULTURAL_PLACE_MAP[id]).map(id=>({id,p:GoiVietJourneyNetwork.node(id).point})).sort((a,b)=>(a.p[0]-run.curWX)**2+(a.p[1]-run.curWY)**2-((b.p[0]-run.curWX)**2+(b.p[1]-run.curWY)**2))[0].id;window.__r3Samples.push({nearest,shown:document.getElementById('journeyRouteBar').dataset.passingId});},200);});
        await page.locator('#arrivalExplore').click();await arrived(page,to);const samples=await evaluate(page,()=>{clearInterval(window.__r3Sampling);return window.__r3Samples;});const ratio=samples.filter(s=>s.nearest===s.shown).length/samples.length;assert(samples.length>=8&&ratio>=.9,JSON.stringify({from,to,ratio,samples}));result.push({from,to,ratio,samples});
      }return result;
    });
    await test(page,size,'F','Arrival banner precedes sheet; skips reveal immediately',async()=>{
      await reduce(true);await visit('hanoi','hn');await reduce(false);await pickFromList(page,'hue','hue');
      await evaluate(page,()=>{window.__arriveSR=[];window.__arriveObserver=new MutationObserver(()=>{const text=document.getElementById('srAnnouncer').textContent;if(text.startsWith('Đã đến ga'))window.__arriveSR.push(text)});window.__arriveObserver.observe(document.getElementById('srAnnouncer'),{childList:true,subtree:true,characterData:true});});
      await page.locator('#arrivalExplore').click();await wait(page,()=>GoiVietJourneyPreview.inspect().currentId==='hue'&&!GoiVietJourneyPreview.inspect().running);const start=Date.now();
      assert(await page.locator('#mapStationArrivalBanner').isVisible());assert(!await page.locator('#arrivalSheet').isVisible());verse=await page.locator('#mapArrivalVerse').innerText();assert.equal(verse.split('\n').length,2);
      const clearPins = await evaluate(page, () => {
        const banner = document.getElementById('mapStationArrivalBanner').getBoundingClientRect();
        const canvas = document.getElementById('mainCanvas').getBoundingClientRect();
        return ['hn', 'hue'].every(id => {
          const point = GoiVietJourneyNetwork.node(id).point;
          const [x, y] = project3D(...point, 38, state.cam, cw, ch);
          return x + canvas.left < banner.left - 16 || x + canvas.left > banner.right + 16 ||
            y + canvas.top < banner.top - 16 || y + canvas.top > banner.bottom + 16;
        });
      });
      assert(clearPins, 'Arrival banner must leave both Hà Nội and Huế pins clear');
      await page.waitForTimeout(200);
      await shot(page,size+'-r3-F-banner');
      await wait(page,()=>GoiVietArrivalDemo.isSheetOpen(),null,1600);const delay=Date.now()-start;assert(delay<=1600);assert.equal(await evaluate(page,()=>document.activeElement.id),'arrivalStationTitle');firstStamp=await page.locator('.arrival-stamp').evaluate(el=>getComputedStyle(el).animationName!=='none');assert(!await page.locator('#mapStationArrivalBanner').isVisible());assert.equal(await page.locator('#mapStationArrivalBanner').getAttribute('aria-hidden'),'true');await page.waitForTimeout(100);const announces=await evaluate(page,()=>{window.__arriveObserver.disconnect();return window.__arriveSR;});assert.equal(announces.length,1,JSON.stringify(announces));
      await pickFromList(page,'hanoi','hn');await page.locator('#arrivalExplore').click();await page.locator('.journey-instant').click();assert(await page.locator('#arrivalSheet').isVisible());assert(!await page.locator('#mapStationArrivalBanner').isVisible());
      await pickFromList(page,'hanoi','hn');await page.locator('#arrivalExplore').click();assert(await page.locator('#arrivalSheet').isVisible());return {delay,safe:clearPins,firstStamp};
    });
    await test(page,size,'G','First stop stamp animates once; revisit/reduced motion do not; boat stays clear',async()=>{
      assert(firstStamp);await reduce(true);await visit('hanoi','hn');await reduce(false);await pickFromList(page,'hue','hue');await page.locator('.journey-instant').click();assert.equal(await page.locator('.arrival-stamp').evaluate(el=>getComputedStyle(el).animationName),'none');await reduce(true);await visit('hoang sa','hoang-sa');assert.equal(await page.locator('.arrival-stamp').evaluate(el=>getComputedStyle(el).animationName),'none');
      const clear=await evaluate(page,()=>{const a=document.querySelector('.arrival-stamp').getBoundingClientRect(),targets=[document.querySelector('#arrivalSheet .gv-station-art-fallback svg'),document.querySelector('#arrivalSheet .gv-station-photo-credit summary')].filter(Boolean);return targets.every(el=>{const b=el.getBoundingClientRect();return !(a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top)})});assert(clear);await shot(page,size+'-r3-G-island-stamp');return {clear};
    });
    await test(page,size,'E','Integer ETA, two verse lines and island wording in both languages',async()=>{
      await reduce(true);await visit('hoang sa','hoang-sa');assert(verse.includes('\n')&&!verse.includes(' · '));assert.match(await page.locator('.journey-status').innerText(),/Đang ở Quần đảo Hoàng Sa/);assert.equal(await page.locator('.arrival-reached').innerText(),'Đã ra tới quần đảo');
      await page.locator('.gv-lang-toggle-header [data-set-lang="en"]').click();assert.match(await page.locator('.journey-status').innerText(),/At the Hoàng Sa Islands/);assert.equal(await page.locator('.arrival-reached').innerText(),'Reached the islands');await page.locator('.gv-lang-toggle-header [data-set-lang="vi"]').click();await pickFromList(page,'truong sa','truong-sa');assert.match(await page.locator('.arrival-eta').innerText(),/^Khoảng \d+ giây$/);assert(!/\d[.,]\d/.test(await page.locator('.arrival-eta').innerText()));
    });
    await test(page,size,'H','Completing a card earns a seal and updates header and both journal counters',async()=>{
      await visit('hanoi','hn');const before=await evaluate(page,()=>state.totalCardsCompleted);await page.locator('#deck-open-hn').click();await drawCard(page);await page.locator('#btnDontKnowReveal').click();await page.locator('#conversationConnectionContent[aria-hidden="false"]').waitFor();await page.locator('#btnCompleteCardTurn').click();await wait(page,()=>!document.getElementById('deckModal').classList.contains('open'));await wait(page,()=>document.querySelector('.arrival-seal-status').textContent==='Đã đóng ấn ga');assert.equal(await evaluate(page,()=>state.totalCardsCompleted),before+1);assert.match(await page.locator('#cardProgressLabel').getAttribute('aria-label'),/Chơi xong lá bài/);await shot(page,size+'-r3-H-sealed');await page.locator('#previewPanelOpen').click();if(!await page.locator('#arrivalSealedCount').isVisible())await page.locator('#stationJournalToggle').click();assert.match(await page.locator('#arrivalVisitedCount').innerText(),/Đã đặt chân \d+\/36/);assert.match(await page.locator('#arrivalSealedCount').innerText(),/Đã đóng ấn 1/);await page.keyboard.press('Escape');
    });
    await test(page,size,'I','Unreadied books explain Coming soon; existing books keep Draft label',async()=>{
      await visit('danang','dn');assert.equal(await page.locator('#book-open-dn small').innerText(),'Sắp có · Góp chuyện quê bạn');await visit('hanoi','hn');assert.equal(await page.locator('#book-open-hn small').innerText(),'Bản nháp');
    });
    await test(page,size,'J','Projector type scale, safe layout and compact station controls',async()=>{
      await layout(page,'hn');const info=await evaluate(page,()=>{const s=document.getElementById('arrivalSheet'),f=sel=>parseFloat(getComputedStyle(s.querySelector(sel)).fontSize);return {width:s.getBoundingClientRect().width,body:f('.arrival-summary'),small:f('.arrival-turn'),label:f('dt'),caption:f('.gv-station-photo-credit summary')};});if(viewport.width>=1600){assert(info.width>=480&&info.width<=520);assert(info.body>=14&&info.small>=12&&info.label>=12&&info.caption>=12);}
      assert(await page.locator('.journey-choose').isVisible());assert(!await page.locator('#arrivalOpenInfo').isVisible());const gaps=await evaluate(page,()=>{const el=document.querySelector('.journey-status'),r=document.createRange();r.selectNodeContents(el);return el.getBoundingClientRect().width-r.getBoundingClientRect().width});assert(gaps<24,'Blank route-info width '+gaps);await page.locator('#arrivalSheet .arrival-close').click();assert(await page.locator('#arrivalOpenInfo').isVisible());assert(await page.locator('.journey-choose').isVisible());await page.locator('.journey-choose').click();assert(await page.locator('#stationPanel').isVisible());await page.keyboard.press('Escape');await shot(page,size+'-r3-J-station-strip');return {...info,gaps};
    });
  } finally {await bounded(page.context().close(),12000,'round3 context.close');}
}
async function measurePerformance(viewport) {
  const size = viewport.width+'x'+viewport.height;
  for (let iteration = 1; iteration <= 3; iteration++) for (const file of [BASELINE, DEMO]) {
    const page = await openPage(viewport, { file });
    try {
      await clickPin(page, 'hcm');
      await page.waitForTimeout(700);
      const cpuBusyPct = await systemBusyPct(500);
      const baseBefore = await evaluate(page, () => GoiVietJourneyPreview.inspect().baseFrames);
      await evaluate(page, () => {
        const sample = window.__arrivalPerf = { frames: [], tasks: [], start: performance.now(), previous: null, running: true };
        sample.observer = new PerformanceObserver(list => sample.tasks.push(...list.getEntries().map(e => ({ start: e.startTime, duration: e.duration }))));
        sample.observer.observe({ type: 'longtask', buffered: false });
        function frame(time) { if (!sample.running) return; if (sample.previous !== null) sample.frames.push(time - sample.previous); sample.previous = time; requestAnimationFrame(frame); }
        requestAnimationFrame(frame);
      });
      const departure = page.locator('#arrivalExplore');
      await (await departure.isVisible() ? departure : page.locator('#station-journey-hcm')).click();
      await wait(page, () => GoiVietJourneyPreview.inspect().currentId === 'hcm' && !GoiVietJourneyPreview.inspect().running, null);
      const sample = await evaluate(page, () => {
        const s = window.__arrivalPerf; s.running = false; s.observer.disconnect();
        return { frames: s.frames, tasks: s.tasks, duration: performance.now() - s.start };
      });
      const baseAfter = await evaluate(page, () => GoiVietJourneyPreview.inspect().baseFrames);
      const result = { size, file, iteration, cpuBusyPct, baseFrames:baseAfter-baseBefore, raf: summarize(sample.frames), rafP95: quantile([...sample.frames].sort((a,b)=>a-b), .95), longTasks: { count: sample.tasks.length, total: sample.tasks.reduce((n, t) => n + t.duration, 0), durations: sample.tasks.map(t => t.duration) }, duration: sample.duration };
      performanceRuns.push(result);
      console.log('PERF ' + JSON.stringify(result));
      if (file === TARGET && iteration === 3) {
        await page.mouse.move(5, 5);
        await page.waitForTimeout(4500);
        const before = await evaluate(page, () => GoiVietJourneyPreview.inspect());
        await page.waitForTimeout(1800);
        const after = await evaluate(page, () => GoiVietJourneyPreview.inspect());
        result.idle = { baseFrames: after.baseFrames - before.baseFrames, reusedFrames: after.reusedFrames - before.reusedFrames };
        assert(result.idle.baseFrames <= 1 && result.idle.reusedFrames <= 1, 'Map keeps painting at rest: ' + JSON.stringify(result.idle));
        await shot(page, size + '-perf-idle-sheet');
      }
    } finally { await bounded(page.context().close(), 12000, 'context.close'); }
  }
  const summary = {};
  for (const file of [BASELINE, DEMO]) {
    const runs = performanceRuns.filter(r => r.file === file && r.size === size);
    summary[file] = { baseFrameMedian: summarize(runs.map(r=>r.baseFrames)).median, rafMedian: summarize(runs.map(r => r.raf.median)).median, rafMeanMedian: summarize(runs.map(r => r.raf.mean)).median, rafP95: summarize(runs.map(r => r.rafP95)).median,
      longTaskTotalMedian: summarize(runs.map(r => r.longTasks.total)).median, longTaskCountMedian: summarize(runs.map(r => r.longTasks.count)).median };
  }
  const reference = integrated ? DEMO : BASELINE;
  assert(summary[TARGET].baseFrameMedian <= summary[reference].baseFrameMedian + 2, 'Base-frame regression > reference+2: '+JSON.stringify(summary));
  summary.slowdownPct = (summary[TARGET].rafMedian / summary[reference].rafMedian - 1) * 100;
  assert(summary.slowdownPct <= 10, 'Demo frame time regression >10%: ' + JSON.stringify(summary));
  assert(summary[TARGET].rafMeanMedian <= summary[reference].rafMeanMedian * 1.1, 'Mean frame time regression >10%: ' + JSON.stringify(summary));
  assert(summary[TARGET].rafP95 <= summary[reference].rafP95 * 1.1, 'P95 frame time regression >10%: ' + JSON.stringify(summary));
  assert(summary[TARGET].longTaskTotalMedian <= summary[reference].longTaskTotalMedian * 1.1, 'Median long-task time regression >10%: ' + JSON.stringify(summary));
  return summary;
}

async function main() {
  const timer = setTimeout(() => { console.error('FAIL global timeout 900 s'); process.exitCode = 1; browser?.close().finally(() => process.exit(1)); }, 890000);
  let perf;
  try {
    browser = await launch(process.env.ARRIVAL_GPU || 'real');
    const darkOnly = process.argv.includes('--dark-only'), allStations = process.argv.includes('--all-stations');
    // --sizes=1280x720,1024x768 replaces the default viewports (e.g. classroom projectors).
    const sizesArg = process.argv.find(arg => arg.startsWith('--sizes='));
    const customSizes = sizesArg && sizesArg.slice(8).split(',').map(size => { const [width, height] = size.split('x').map(Number); return { width, height }; });
    for (const viewport of (customSizes || (allStations ? [{ width:1366,height:768 },{ width:1600,height:900 },{ width:1920,height:1080 }] : [{ width:1366,height:768 },{ width:1920,height:1080 }]))) {
      if (!darkOnly && !allStations) { await verifySize(viewport); await verifyInitialStation(viewport); await verifyRound3(viewport); }
      else {
        const page = await openPage(viewport, { lang: 'en', reduced: true });
        try {
          const size = viewport.width + 'x' + viewport.height;
          if (allStations) await test(page, size, '36-stations', 'All 36 station layouts in VI/EN', () => verifyAllStations(page, size));
          else {
            await page.locator('#arrivalStartHint [data-arrival-pick="hue"]').click();
            await page.locator('#arrivalExplore').click();
            await arrived(page, 'hue');
            await test(page, size, 15, 'Dark theme screenshot and text contrast at least 4.5:1', () => verifyDark(page, size));
          }
        } finally { await bounded(page.context().close(), 12000, 'context.close'); }
      }
    }
    if (!darkOnly && !allStations) await mobileEnglish();
    // Only compare performance on a functioning candidate; keep failures visible and the run bounded.
    if (!darkOnly && !allStations && !failures.length) {
      perf={};
      for(const viewport of [{width:1366,height:768},{width:1920,height:1080}]){
        const size=viewport.width+'x'+viewport.height;
        try {const detail=await bounded(measurePerformance(viewport),220000,'Performance '+size);perf[size]=detail;rows.push({size,case:'C',label:'Three-run CPU/base-frame/rAF/long-task comparison',ok:true,detail});console.log('PASS ['+size+'] C. Performance '+JSON.stringify(detail));}
        catch(error){const row={size,case:'C',ok:false,error:String(error.stack||error)};rows.push(row);failures.push(row);console.error('FAIL ['+size+'] C. '+error.stack);}
      }
    } else if (!darkOnly && !allStations) console.log('SKIP [performance] functional failures must be fixed first');
    assert.deepEqual(errors, [], 'Console/page errors across all sessions');
    assert.deepEqual(network, [], 'Failed network requests across all sessions');
    if (!integrated) {
      const baseline = JSON.parse(fs.readFileSync(path.join(OUT,'tracked-baseline.json')));
      const changed = execFileSync('git',['status','--porcelain','-z'],{cwd:ROOT,encoding:'utf8'}).split('\0').filter(Boolean).filter(x=>!x.startsWith('?? '));
      const actual = changed.map(line=>{const file=line.slice(3);return {file,status:line.slice(0,2),hash:fs.existsSync(path.join(ROOT,file))?crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,file))).digest('hex'):null}});
      try { assert.deepEqual(actual,baseline.tracked,'Unrelated tracked work differs from the start baseline'); console.log('PASS [regression] tracked hashes match start baseline'); }
      catch(error) { const row={case:'tracked-baseline',ok:false,error:String(error.stack||error),expected:baseline.tracked,actual};failures.push(row);console.error('FAIL [regression] '+row.error); }
    }
  } finally {
    clearTimeout(timer);
    if (browser) await bounded(browser.close(), 12000, 'browser.close');
    fs.writeFileSync(path.join(OUT, process.argv.includes('--dark-only') ? 'dark-contrast-final.json' : process.argv.includes('--all-stations') ? 'station-layout-final.json' : 'results.json'), JSON.stringify({ generatedAt: new Date().toISOString(), rows, performanceRuns, performance: perf, failures, errors, network,
      screenshots: fs.readdirSync(OUT).filter(name => name.endsWith('.png')) }, null, 2));
  }
  console.log(`${rows.filter(r => r.ok).length}/${rows.length} functional cases passed; ${failures.length} failures.`);
  if (failures.length) process.exitCode = 1;
}
main().catch(error => { console.error('FAIL [harness] ' + error.stack); process.exitCode = 1; });
