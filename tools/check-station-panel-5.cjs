// Usage: node tools/check-station-panel-5.cjs
// Optional: STATION_BASE=http://127.0.0.1:8770/ with tools/perf/server.cjs for the hosted map renderer.
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const { launch, fs, path, ROOT } = require('./perf/lib.cjs');

const file = 'map-surroundings-preview-5.html';
const target = process.env.STATION_BASE ? new URL(file, process.env.STATION_BASE).href
  : pathToFileURL(path.join(ROOT, file)).href;
const output = path.join(ROOT, 'verification/station-panel-5');
const errors = [];
const bookRequests = [];
const station = '#demoPlaceList .place-card';
const selection = station + '.selected';
const modal = id => '#' + id + '.open';

async function openMap(browser, viewport, query = '', reducedMotion = 'reduce') {
  const page = await browser.newPage({ viewport, reducedMotion, isMobile: viewport.width < 769, hasTouch: viewport.width < 769 });
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (/\/books-5\/[^/]+\/book\.js\?/.test(request.url())) bookRequests.push(request.url());
  });
  // The drawer, decks and book reader must work when third-party photos are unavailable.
  await page.route(/^https?:/, route => {
    if (route.request().url().startsWith(new URL('.', target).href)) return route.continue();
    return route.abort();
  });
  await page.goto(target + query, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.GoiVietHomeIntro && window.GoiVietBooks && window.GoiVietJourneyPreview);
  await page.evaluate(() => { window.GoiVietHomeIntro.skip(); closeIntroModal(); });
  await page.waitForFunction(() => window.GoiVietPreviewPolish && document.querySelector('#station-pick-hn'));
  await page.evaluate(() => document.fonts.ready);
  return page;
}

async function waitForFocus(page, id) {
  await page.waitForFunction(expected => document.activeElement.id === expected, id);
}

async function findAndSelect(page, query, id) {
  await page.locator('#provSearchInput').fill(query);
  const row = page.locator('#station-pick-' + id);
  if (await row.count()) await row.click();
  assert.equal(await page.locator(selection).getAttribute('id'), 'placeCard-' + id);
}

async function verifyLayout(page, width, name = 'sidebar-' + width) {
  assert(await page.locator('#stationPanel').evaluate(panel => {
    const scroll = panel.querySelector('#previewPanelScroll');
    const title = panel.querySelector('#stationPanelTitle').getBoundingClientRect();
    const outer = panel.getBoundingClientRect();
    const modes = panel.querySelector('.gv-station-modes');
    const sheet = panel.querySelector('.gv-station-sheet');
    const modeOrder = !modes || sheet.getBoundingClientRect().bottom <= modes.getBoundingClientRect().top;
    return scroll.scrollWidth <= scroll.clientWidth + 1 && scroll.clientHeight > 80 && modeOrder
      && title.left >= outer.left && title.right <= outer.right && outer.right <= innerWidth;
  }), 'Sidebar overflows at ' + width);
  await page.locator('#stationPanel').screenshot({ path: path.join(output, name + '.png') });
}

async function verifyDesktop(browser) {
  const page = await openMap(browser, { width: 1440, height: 1120 }, '?sach=nhap');
  await verifyLayout(page, 1440, 'sidebar-start-1440');
  assert.equal(await page.locator(station).count(), 3);
  assert.equal(await page.locator(selection).count(), 0);
  assert.deepEqual(await page.evaluate(() => [state.selectedPlaceId, GoiVietJourneyPreview.inspect().currentId]), [null, 'hn']);
  assert(await page.locator('.gv-station-welcome').isVisible());
  assert.equal(await page.locator('#stationPanel .topic-filter-bar, #sidebarSealSlots, #journalSealCount').count(), 0);
  assert.equal(await page.locator('#stationJournal').getAttribute('open'), null);
  assert.match(await page.locator('.gv-station-logo').evaluate(logo => logo.currentSrc), /goi-viet-logo-(512|1024)\.webp$/);
  assert.deepEqual(bookRequests, []);

  await page.locator('#previewPanelClose').click();
  assert.equal(await page.locator('#stationPanel').getAttribute('inert'), '');
  assert.equal(await page.locator('#previewPanelOpen').getAttribute('aria-expanded'), 'false');
  await waitForFocus(page, 'previewPanelOpen');
  await page.keyboard.press('Enter');
  await waitForFocus(page, 'previewPanelClose');

  await page.locator('#tabScopeAll').click();
  assert.equal(await page.locator(station).count(), 36);
  await page.locator('#provSearchInput').fill('ho hoan kiem');
  assert(await page.locator('#station-pick-hn').isVisible());
  await page.locator('#provSearchInput').fill('pho ha noi');
  assert(await page.locator('#station-pick-hn').isVisible());
  assert.equal(await page.locator(selection).count(), 0);
  await page.locator('#provSearchInput').fill('zzzzzz');
  assert(await page.locator('.gv-station-empty').isVisible());
  await page.locator('#stationSearchClear').click();
  assert.equal(await page.locator(station).count(), 36);
  await waitForFocus(page, 'provSearchInput');
  await page.locator('#tabScopeFeatured').click();

  await page.locator('#station-pick-hn').click();
  await page.waitForFunction(() => document.querySelector('#station-journey-hn')?.dataset.journeyAction === 'explore');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator(selection).count(), 0);
  assert(await page.locator('.gv-station-welcome').isVisible());
  await page.locator('#station-pick-hn').click();
  await page.waitForFunction(() => document.querySelector('.gv-station-art img')?.naturalWidth > 0);
  assert.match(await page.locator('#book-open-hn').innerText(), /Bản nháp/);
  await verifyLayout(page, 1440);

  const drawer = page.locator('#station-stories-hn');
  await drawer.focus();
  await page.keyboard.press('Enter');
  const stories = page.locator('#placeCard-hn .gv-station-story');
  assert.equal(await stories.count(), 4);
  assert.equal(await stories.locator('small').count(), 0);
  await page.locator('#stationPanel').screenshot({ path: path.join(output, 'sidebar-stories-1440.png') });
  const story = stories.first();
  const storyId = await story.getAttribute('id');
  await story.click();
  await page.locator(modal('storyModal')).waitFor();
  await page.locator('#btnStoryBack').click();
  await waitForFocus(page, storyId);
  assert.equal(await drawer.locator('..').getAttribute('open'), '');
  assert.match(await story.innerText(), /Đọc lại/);

  await findAndSelect(page, 'hue', 'hue');
  await waitForFocus(page, 'station-title-hue');
  assert.equal(await page.evaluate(() => GoiVietJourneyPreview.inspect().selected), 'hue');
  await page.locator('#station-journey-hue').click();
  await page.waitForFunction(() => GoiVietJourneyPreview.inspect().currentId === 'hue');
  assert.match(await page.locator('#station-journey-hue').innerText(), /Khám phá/);
  await page.locator('#station-journey-hue').click();
  await page.locator(modal('storyModal')).waitFor();
  await page.locator('#btnStoryBack').click();
  await waitForFocus(page, 'station-journey-hue');

  await findAndSelect(page, 'hoang sa', 'hoang-sa');
  assert.match(await page.locator('#placeCard-hoang-sa .gv-station-kicker').innerText(), /Hải trình/i);
  await page.locator('#station-journey-hoang-sa').click();
  await page.waitForFunction(() => GoiVietJourneyPreview.inspect().currentId === 'hoang-sa');

  await findAndSelect(page, 'ha noi', 'hn');
  await page.locator('#deck-open-hn').click();
  await page.locator(modal('deckModal')).waitFor();
  await page.waitForFunction(() => document.getElementById('deckModal').contains(document.activeElement));
  const card = page.locator('.fanned-card:enabled').first();
  const cardId = await card.getAttribute('data-card-id');
  await card.focus();
  await page.keyboard.press('Enter');
  await page.waitForFunction(id => state.activeCard?.id === id, cardId);
  await page.locator('#btnDontKnowReveal').click();
  await page.locator('#conversationSeal').waitFor({ state: 'hidden' });
  await page.locator('#memoryDetailsDrawer summary').click();
  await page.locator('#memoryPlaceInput').fill('Huế');
  await page.locator('#memoryNoteInput').fill('Chuyến đi cùng cả nhà');
  await page.keyboard.press('Escape');
  await waitForFocus(page, 'deck-open-hn');
  assert.match(await page.locator('#deck-open-hn').innerText(), /Còn 3 lá/);
  await page.locator('#deck-open-hn').click();
  assert.equal(await page.locator('#memoryPlaceInput').inputValue(), 'Huế');
  assert.equal(await page.locator('#memoryNoteInput').inputValue(), 'Chuyến đi cùng cả nhà');
  await page.locator('#btnSaveMemoryPlace').click();
  await page.locator('#btnCompleteCardTurn').click();
  await page.locator(modal('deckModal')).waitFor({ state: 'hidden' });
  assert.equal(await page.evaluate(() => state.completedStamps.length), 1);
  await page.locator('#stationJournalToggle').click();
  assert.equal(await page.locator('#journalMentionedCount').innerText(), '1');
  assert.match(await page.locator('#sidebarMentionedList').innerText(), /Huế/);
  assert(await page.locator('#sidebarExploredList button').count() >= 2);
  await page.locator('#stationJournal').screenshot({ path: path.join(output, 'journal-1440.png') });
  await page.locator('#stationPostcard').click();
  await page.locator(modal('postcardModal')).waitFor();
  assert.match(await page.locator('#postcardMentionedContainer').innerText(), /Chuyến đi cùng cả nhà/);
  const includeMemory = page.locator('#postcardMentionedContainer input[type="checkbox"]');
  assert.equal(await includeMemory.isChecked(), false);
  await includeMemory.check();
  assert.equal(await page.evaluate(() => state.mentionedPlaces[0].includeInPostcard), true);
  await page.keyboard.press('Escape');
  await page.locator(modal('postcardModal')).waitFor({ state: 'hidden' });
  await waitForFocus(page, 'stationPostcard');
  await page.locator('#sidebarMentionedList button').click();
  await waitForFocus(page, 'station-title-hue');
  assert.equal(await page.locator('#provSearchInput').inputValue(), '');
  assert.equal(await page.locator('#stationJournal').getAttribute('open'), null);
  await findAndSelect(page, 'ha noi', 'hn');

  await page.locator('#book-open-hn').click();
  await page.waitForFunction(() => GoiVietBooks.inspect().kind === 'book');
  assert.equal(bookRequests.length, 1);
  const next = page.locator('#bookModal .gvb-nav-btn[data-act="next"]');
  await next.click();
  await page.waitForFunction(() => GoiVietBooks.inspect().view === 1 && !GoiVietBooks.inspect().busy);
  await page.keyboard.press('ArrowLeft');
  await page.waitForFunction(() => GoiVietBooks.inspect().view === 0 && !GoiVietBooks.inspect().busy);
  await next.click();
  await page.waitForFunction(() => GoiVietBooks.inspect().view === 1 && !GoiVietBooks.inspect().busy);
  await page.keyboard.press('Escape');
  await waitForFocus(page, 'book-open-hn');
  await page.locator('#book-open-hn').click();
  await page.waitForFunction(() => GoiVietBooks.inspect().kind === 'book' && GoiVietBooks.inspect().view === 1);
  await page.locator('#bookModal .gvb-bar [data-act="toc"]').click();
  assert.equal(await page.evaluate(() => GoiVietBooks.inspect().panel), 'toc');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await waitForFocus(page, 'book-open-hn');
  await page.evaluate(() => GoiVietI18n.setLang('en', { remember: false }));
  assert.equal(await page.locator('#stationPanelTitle').innerText(), 'Heritage stations');
  assert.match(await page.locator('#stationJournalToggle').innerText(), /Journey journal/);
  assert.match(await page.locator('#book-open-hn').innerText(), /Read book\s+Draft/);

  for (const [query, id] of [['thanh hoa', 'th'], ['hue', 'hue'], ['ho chi minh', 'hcm']]) {
    await findAndSelect(page, query, id);
    assert.match(await page.locator('#book-open-' + id).innerText(), /Draft/);
    await page.locator('#book-open-' + id).click();
    await page.waitForFunction(place => GoiVietBooks.inspect().placeId === place && GoiVietBooks.inspect().kind === 'book', id);
    await page.keyboard.press('Escape');
    await waitForFocus(page, 'book-open-' + id);
  }
  assert.equal(bookRequests.length, 4);

  await page.locator('#stationJournalToggle').click();
  await page.locator('#stationPostcard').click();
  await page.locator('#postcardModal .postcard-reset button').click();
  await page.locator('#resetSessionModal .btn-primary').click();
  await page.locator(modal('postcardModal')).waitFor({ state: 'hidden' });
  assert.equal(await page.locator('#stationJournal').getAttribute('open'), null);
  assert.equal(await page.locator('#journalMentionedCount').textContent(), '0');
  assert.equal(await page.locator(station).count(), 3);
  assert.equal(await page.locator(selection).count(), 0);
  assert.deepEqual(await page.evaluate(() => [state.selectedPlaceId, GoiVietJourneyPreview.inspect().currentId]), [null, 'hn']);
  await page.close();
}

async function verifyPublicAndMobile(browser) {
  const page = await openMap(browser, { width: 390, height: 844 }, '?lang=en');
  await verifyLayout(page, 390);
  assert.equal(await page.locator('#stationPanelTitle').innerText(), 'Heritage stations');
  await page.locator('#btnMobileTogglePanel').tap();
  assert.equal(await page.locator('#stationPanel').getAttribute('aria-hidden'), 'true');
  await page.locator('#btnMobileTogglePanel').tap();
  assert.equal(await page.locator('#stationPanel').getAttribute('aria-hidden'), 'false');
  await page.locator('#station-pick-hn').tap();
  const requestsBefore = bookRequests.length;
  await page.locator('#book-open-hn').tap();
  assert.equal(await page.evaluate(() => GoiVietBooks.inspect().kind), 'soon');
  assert.equal(bookRequests.length, requestsBefore);
  await page.locator('#bookModal .gvb-soon [data-act="play"]').tap();
  await page.locator(modal('deckModal')).waitFor();
  await page.keyboard.press('Escape');
  await page.locator(modal('deckModal')).waitFor({ state: 'hidden' });

  await findAndSelect(page, 'hoang sa', 'hoang-sa');
  assert.match(await page.locator('#book-open-hoang-sa').innerText(), /Coming soon/);
  await page.locator('#book-open-hoang-sa').tap();
  assert.equal(await page.evaluate(() => GoiVietBooks.inspect().placeId), 'hoang-sa');
  assert.equal(await page.evaluate(() => GoiVietBooks.inspect().kind), 'soon');
  assert.equal(bookRequests.length, requestsBefore);
  await page.close();

  for (const [width, height] of [[1024, 768], [820, 1180], [320, 568]]) {
    const sized = await openMap(browser, { width, height }, '?sach=nhap');
    await verifyLayout(sized, width);
    await sized.locator('#station-pick-hn').click();
    await sized.locator('#station-stories-hn').click();
    assert(await sized.locator('#station-stories-hn + .gv-station-story-items .gv-station-story').first().isVisible());
    await sized.close();
  }
}

async function verifyMovingTrain(browser) {
  const page = await openMap(browser, { width: 1366, height: 900 }, '', 'no-preference');
  await verifyLayout(page, 1366);
  await findAndSelect(page, 'bac ninh', 'bn');
  const departure = page.locator('#station-journey-bn');
  assert.match(await departure.innerText(), /Vào ga/);
  await departure.click();
  await page.waitForFunction(() => GoiVietJourneyPreview.inspect().running === 'bn');
  assert(await departure.isDisabled());
  await page.waitForFunction(() => GoiVietJourneyPreview.inspect().currentId === 'bn', null, { timeout: 15000 });
  assert(await departure.isEnabled());
  assert.match(await departure.innerText(), /Khám phá/);

  await page.locator('#headerSettings summary').first().click();
  await page.locator('#btnTheme').click();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  await page.keyboard.press('Escape');
  await page.locator('#stationPanel').screenshot({ path: path.join(output, 'sidebar-dark.png') });
  await page.close();
}

(async () => {
  const temp = path.join(output, 'browser-temp');
  fs.mkdirSync(temp, { recursive: true });
  process.env.TEMP = process.env.TMP = temp;
  const browser = await launch();
  try {
    await verifyDesktop(browser);
    await verifyPublicAndMobile(browser);
    await verifyMovingTrain(browser);
    assert.deepEqual(errors, []);
    console.log('PASS: preview-5 station panel, 6 sizes, journey, stories, cards, memory, postcard, draft and public book flows, and dark mode.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
