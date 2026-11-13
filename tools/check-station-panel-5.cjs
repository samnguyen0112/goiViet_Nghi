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
const postcardRequests = [];
const station = '#demoPlaceList .place-card';
const selection = station + '.selected';
const modal = id => '#' + id + '.open';

async function openMap(browser, viewport, query = '', reducedMotion = 'reduce') {
  const page = await browser.newPage({ viewport, reducedMotion, isMobile: viewport.width < 769, hasTouch: viewport.width < 769 });
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (/\/books-5\/[^/]+\/book\.js\?/.test(request.url())) bookRequests.push(request.url());
    if (/\/books-5\/postcards\/[^/]+\.webp$/.test(request.url())) postcardRequests.push(request.url());
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

async function openDirectory(page) {
  if (await page.locator('#stationPanel').isHidden()) await page.locator('#previewPanelOpen').click();
}

async function selectRoute(page, query, id) {
  await openDirectory(page);
  await page.locator('#provSearchInput').fill(query);
  await page.locator('#station-pick-' + id).click();
  assert.equal(await page.evaluate(() => GoiVietJourneyPreview.inspect().selected), id);
  assert(await page.locator('#arrivalSheet').isHidden());
}

async function findAndSelect(page, query, id) {
  await selectRoute(page, query, id);
  await page.locator('#arrivalExplore').click();
  await page.waitForFunction(id => GoiVietArrivalDemo.isSheetOpen() && document.querySelector('#arrivalSheet').dataset.place === id, id);
}

async function verifyLayout(page, width, name = 'sidebar-' + width) {
  await openDirectory(page);
  const layout = await page.locator('#stationPanel').evaluate(panel => {
    const scroll = panel.querySelector('#previewPanelScroll');
    const title = panel.querySelector('#stationPanelTitle').getBoundingClientRect();
    const outer = panel.getBoundingClientRect();
    return { scrollWidth: scroll.scrollWidth, clientWidth: scroll.clientWidth, clientHeight: scroll.clientHeight,
      titleFits: title.left >= outer.left && title.right <= outer.right, panelFits: outer.right <= innerWidth,
      hasModes: Boolean(panel.querySelector('.gv-station-modes')) };
  });
  assert(layout.scrollWidth <= layout.clientWidth + 1 && layout.clientHeight > 80 && !layout.hasModes &&
    layout.titleFits && layout.panelFits, 'Station list at ' + width + ': ' + JSON.stringify(layout));
  await page.locator('#stationPanel').screenshot({ path: path.join(output, name + '.png') });
}

async function verifyDesktop(browser) {
  const page = await openMap(browser, { width: 1440, height: 1120 }, '?sach=nhap');
  await verifyLayout(page, 1440, 'sidebar-start-1440');
  assert.equal(await page.locator(station).count(), 3);
  assert.equal(await page.locator(selection).count(), 0);
  assert.deepEqual(await page.evaluate(() => [state.selectedPlaceId, GoiVietJourneyPreview.inspect().currentId]), [null, 'hn']);
  assert(await page.locator('#demoPlaceList .gv-station-other').isVisible());
  assert.equal(await page.locator('#stationPanel .topic-filter-bar, #sidebarSealSlots, #journalSealCount').count(), 0);
  assert.equal(await page.locator('#stationJournal').getAttribute('open'), null);
  assert.match(await page.locator('.gv-station-logo').evaluate(logo => logo.currentSrc), /goi-viet-logo-(512|1024)\.webp$/);
  assert.deepEqual(bookRequests, []);

  await page.locator('#previewPanelOpen').click();
  assert.equal(await page.locator('#stationPanel').getAttribute('inert'), '');
  assert.equal(await page.locator('#previewPanelOpen').getAttribute('aria-expanded'), 'false');
  await waitForFocus(page, 'previewPanelOpen');
  await page.keyboard.press('Enter');
  await waitForFocus(page, 'provSearchInput');

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
  assert(await page.locator('#arrivalSheet').isHidden());
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => GoiVietJourneyPreview.inspect().selected), null);
  await findAndSelect(page, 'ha noi', 'hn');
  await page.waitForFunction(() => document.querySelector('.gv-station-art img')?.naturalWidth > 0);
  assert.match(await page.locator('#book-open-hn').innerText(), /Bản nháp/);
  await page.locator('#story-hero-hn').click();
  await page.waitForFunction(() => GoiVietBooks.inspect().kind === 'book' && GoiVietBooks.inspect().placeId === 'hn');
  assert.equal(await page.locator(modal('storyModal')).count(), 0);
  await page.keyboard.press('Escape');
  await waitForFocus(page, 'story-hero-hn');

  await findAndSelect(page, 'hue', 'hue');
  await waitForFocus(page, 'arrivalStationTitle');
  assert.equal(await page.evaluate(() => GoiVietJourneyPreview.inspect().currentId), 'hue');
  assert.equal(await page.locator(modal('storyModal') + ', ' + modal('bookModal') + ', ' + modal('deckModal')).count(), 0);

  await findAndSelect(page, 'hoang sa', 'hoang-sa');
  assert.match(await page.locator('.arrival-station-kicker').innerText(), /Biển đảo/i);
  assert.equal(await page.evaluate(() => GoiVietJourneyPreview.inspect().currentId), 'hoang-sa');

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
  await openDirectory(page);
  await page.locator('#stationJournalToggle').click();
  assert.equal(await page.locator('#journalMentionedCount').innerText(), '1');
  assert.match(await page.locator('#sidebarMentionedList').innerText(), /Huế/);
  // P5-02: arriving at Huế and pressing "Khám phá" no longer opens a story, so only Hà Nội (book + cards) is explored.
  assert.equal(await page.locator('#sidebarExploredList button').count(), 1);
  assert.match(await page.locator('#sidebarExploredList').innerText(), /Hà Nội/);
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
  await page.waitForFunction(() => GoiVietJourneyPreview.inspect().selected === 'hue');
  assert(await page.locator('#stationPanel').isHidden());
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

  await openDirectory(page);
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
  await page.locator('#previewPanelOpen').tap();
  assert.equal(await page.locator('#stationPanel').getAttribute('aria-hidden'), 'true');
  await page.locator('#previewPanelOpen').tap();
  assert.equal(await page.locator('#stationPanel').getAttribute('aria-hidden'), 'false');
  await page.locator('#station-pick-hn').tap();
  await page.locator('#arrivalExplore').tap();
  await page.locator('#arrivalSheet').waitFor();
  const requestsBefore = bookRequests.length;
  await page.locator('#book-open-hn').tap();
  assert.equal(await page.evaluate(() => GoiVietBooks.inspect().kind), 'soon');
  assert.equal(await page.locator('#bookModal.gvb-open-call').count(), 0);
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
  assert.match(await page.locator('#gvbSoonInviteTitle').innerText(), /Share your hometown story/);
  assert.equal(bookRequests.length, requestsBefore);
  await page.close();

  for (const [width, height] of [[1024, 768], [820, 1180], [320, 568]]) {
    const sized = await openMap(browser, { width, height }, '?sach=nhap');
    await verifyLayout(sized, width);
    await findAndSelect(sized, 'ha noi', 'hn');
    await sized.locator('#book-open-hn').scrollIntoViewIfNeeded();
    assert(await sized.locator('#deck-open-hn').isVisible() && await sized.locator('#book-open-hn').isVisible());
    await sized.close();
  }
}

async function verifyCommunityInvitation(browser) {
  const page = await openMap(browser, { width: 1440, height: 900 }, '?sach=nhap');
  const requestsBefore = bookRequests.length;
  await findAndSelect(page, 'hai phong', 'hp');
  assert.deepEqual(postcardRequests, []);
  await page.locator('#book-open-hp').click();
  const dialog = page.locator('#bookModal.gvb-open-call');
  await dialog.waitFor();
  const qr = dialog.locator('.gvb-soon-qr img');
  await page.waitForFunction(() => document.querySelector('#bookModal .gvb-soon-qr img')?.naturalWidth > 0);
  await page.waitForFunction(() => document.querySelector('#bookModal .gvb-call-art')?.naturalWidth > 0);
  assert.match(await dialog.locator('.gvb-call-caption').innerText(), /Hải Phòng/);
  assert.equal(await dialog.locator('.gvb-call-landmark').innerText(), 'Vịnh Lan Hạ · Cát Bà');
  assert.equal(await dialog.locator('.gvb-call-signature').textContent(), 'Sắp có');
  assert.deepEqual(postcardRequests.map(url => new URL(url).pathname.split('/').pop()), ['hp.webp']);
  const link = dialog.locator('.gvb-soon-fanpage');
  assert.equal(await link.getAttribute('href'), await page.evaluate(() => GoiVietBookContribute.url));
  assert.equal(await link.getAttribute('target'), '_blank');
  await dialog.locator('.gvb-shell').screenshot({ path: path.join(output, 'coming-soon-1440.png') });
  await qr.screenshot({ path: path.join(output, 'coming-soon-qr.png') });

  await page.setViewportSize({ width: 390, height: 844 });
  await dialog.locator('.gvb-shell').screenshot({ path: path.join(output, 'coming-soon-390.png') });
  await page.setViewportSize({ width: 320, height: 568 });
  const stage = dialog.locator('.gvb-stage');
  assert(await stage.evaluate(el => el.scrollWidth <= el.clientWidth + 1 && el.scrollHeight > el.clientHeight));
  await dialog.locator('[data-act="play"]').click();
  await page.locator(modal('deckModal')).waitFor();
  assert.match(await page.locator('#deckModalHeading').innerText(), /Hải Phòng/);
  await page.keyboard.press('Escape');
  await waitForFocus(page, 'deck-open-hp');
  assert.equal(bookRequests.length, requestsBefore);

  const checked = await page.evaluate(async () => {
    const outside = ALL_PLAYABLE_PLACES.filter(place => GoiVietBooks.statusOf(place.id) === 'none');
    const postcards = GoiVietCommunityPostcards;
    const failures = [];
    for (const lang of ['vi', 'en']) {
      GoiVietI18n.setLang(lang, { remember: false });
      const stamp = lang === 'vi' ? 'Sắp có' : 'Coming soon';
      for (const place of outside) {
        const kind = await GoiVietBooks.open(place.id);
        const modal = document.querySelector('#bookModal.gvb-open-call');
        const stage = modal?.querySelector('.gvb-stage');
        const art = modal?.querySelector('.gvb-call-art');
        await art?.decode().catch(() => {});
        const title = (place.short || place.name).replace(/^TP\.\s*/u, '');
        if (kind !== 'soon' || modal?.lang !== lang
          || modal.querySelector('.gvb-call-place')?.textContent !== title
          || modal.querySelector('.gvb-call-landmark')?.textContent !== postcards[place.id]?.[lang]
          || modal.querySelector('.gvb-call-signature')?.textContent !== stamp
          || !art?.currentSrc.endsWith('/postcards/' + place.id + '.webp')
          || art.naturalWidth !== 1200 || art.naturalHeight !== 800
          || stage.scrollWidth > stage.clientWidth + 1) failures.push(lang + ':' + place.id);
      }
    }
    GoiVietBooks.close();
    return { outside: outside.length, cards: Object.keys(postcards).length, failures };
  });
  assert.deepEqual(checked, { outside: 32, cards: 32, failures: [] });
  assert.equal(new Set(postcardRequests).size, 32);
  assert.equal(bookRequests.length, requestsBefore);

  await page.evaluate(async () => {
    await GoiVietBooks.open('hp');
    document.querySelector('#bookModal .gvb-call-art').dispatchEvent(new Event('error'));
  });
  assert.equal(await dialog.locator('.gvb-call-art').count(), 0);
  assert(await dialog.locator('.gvb-call-landmark').isVisible());
  assert(await link.isVisible());
  assert(await dialog.locator('[data-act="play"]').isVisible());
  await page.close();
}

async function verifyMovingTrain(browser) {
  const page = await openMap(browser, { width: 1366, height: 900 }, '', 'no-preference');
  await verifyLayout(page, 1366);
  await selectRoute(page, 'bac ninh', 'bn');
  const departure = page.locator('#arrivalExplore');
  assert.match(await departure.innerText(), /Khám phá/);
  await departure.click();
  await page.waitForFunction(() => GoiVietJourneyPreview.inspect().running === 'bn');
  assert(await departure.isDisabled());
  await page.waitForFunction(() => GoiVietJourneyPreview.inspect().currentId === 'bn', null, { timeout: 15000 });
  await page.locator('#arrivalSheet').waitFor();
  assert(await departure.isHidden());
  assert.match(await page.locator('#arrivalStationTitle').innerText(), /Bắc Ninh/);

  await page.locator('#headerSettings summary').first().click();
  await page.locator('#btnTheme').click();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
  if (await page.locator('#headerSettings').getAttribute('open') !== null) await page.keyboard.press('Escape');
  await page.locator('#arrivalSheet').screenshot({ path: path.join(output, 'arrival-dark.png') });
  await page.close();
}

(async () => {
  const temp = path.join(output, 'browser-temp');
  fs.mkdirSync(temp, { recursive: true });
  process.env.TEMP = process.env.TMP = temp;
  const browser = await launch();
  try {
    await verifyCommunityInvitation(browser);
    await verifyDesktop(browser);
    await verifyPublicAndMobile(browser);
    await verifyMovingTrain(browser);
    assert.deepEqual(errors, []);
    console.log('PASS: preview-5 station panel, 6 sizes, journey, cards, memory, postcard, draft books, 32 community invitations and dark mode.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
