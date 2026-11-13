// Complete preview-5 photo coverage, responsive placement, source isolation and cold offline reload.
// Start tools/perf/server.cjs, then: node tools/check-station-photos-5.cjs
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { launch, fs, path, ROOT, BASE } = require('./perf/lib.cjs');
const OUT = path.join(ROOT, 'verification/station-photos-5/e2e');
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/goi-viet/station-photos-5/catalog.json'), 'utf8')).photos;
const photos = catalog.filter(photo => photo.src);
const target = new URL('map-surroundings-preview-5.html?sach=nhap', process.env.STATION_BASE || BASE).href;
const origin = new URL(target).origin;
const report = { static: {}, frames: [], interactions: [], offline: null, errors: [], externalRequests: [] };
const resources = new Set();
const completed = new Set();

function staticChecks() {
  const text = fs.readFileSync(path.join(ROOT, 'map-surroundings-preview-5.html'), 'utf8');
  assert.equal(catalog.length, 36);
  assert.equal(new Set(catalog.map(p => p.id)).size, 36);
  assert.equal(photos.length, 35);
  assert.equal(new Set(photos.map(p => p.sha256)).size, 35, 'Every approved photo is distinct');
  assert.equal(catalog.find(p => p.id === 'hoang-sa').status, 'placeholder');
  assert(!fs.existsSync(path.join(ROOT, 'assets/goi-viet/station-photos-5/hoang-sa.webp')));
  assert(!/https?:\/\/(?:upload|thumb)\.wikimedia\.org/i.test(text), 'A remote image URL remains in preview-5');
  for (const photo of photos) {
    const bytes = fs.readFileSync(path.join(ROOT, photo.src));
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), photo.sha256, photo.id);
    assert(photo.reviewed && photo.author && photo.license && photo.titleVi && photo.titleEn, photo.id);
    assert(photo.width >= 1280 && photo.width <= photo.nativeWidth, photo.id + ': no upscale');
  }
  const baseline = JSON.parse(fs.readFileSync(path.join(ROOT, 'verification/station-photos-5/baseline-page-hashes.json'), 'utf8'));
  for (const [name, hash] of Object.entries(baseline)) {
    if (name === 'map-surroundings-preview-5.html') continue;
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, name))).digest('hex'), hash, name + ' changed');
  }
  report.static = { surface: 'arrival-sheet', stations: 36, photos: 35, placeholders: 1, distinctFiles: 35, remoteImageURLs: 0, otherPagesUnchanged: true,
                    bytes: catalog.reduce((sum, p) => sum + p.bytes, 0),
                    catalogSHA256: crypto.createHash('sha256').update(JSON.stringify(catalog)).digest('hex') };
  if (process.argv.includes('--resume')) {
    const previous = JSON.parse(fs.readFileSync(path.join(OUT, 'report.json'), 'utf8'));
    assert.equal(previous.static.bytes, report.static.bytes, 'Photo set changed; run without --resume');
    assert.equal(previous.static.surface, 'arrival-sheet', 'Photo surface changed; run without --resume');
    assert.deepEqual(previous.errors, []);
    assert.deepEqual(previous.externalRequests, []);
    const labels = new Set(previous.frames.map(frame => frame.viewport).filter(label => !label.startsWith('offline-')));
    for (const label of labels) {
      const frames = previous.frames.filter(frame => frame.viewport === label);
      if (frames.length !== 36 || new Set(frames.map(frame => frame.id)).size !== 36) continue;
      for (const frame of frames) {
        const photo = catalog.find(photo => photo.id === frame.id);
        if (photo?.status === 'placeholder' && frame.placeholder) continue;
        assert(photo && frame.naturalWidth === photo.width && frame.naturalHeight === photo.height
          && frame.position === photo.position && frame.objectFit === photo.fit, 'Photo framing changed; run without --resume');
      }
      completed.add(label);
      report.frames.push(...frames);
    }
    report.interactions = previous.interactions;
    report.resumedCompletedViewports = [...completed];
  }
}

async function openMap(context, viewport, query = '') {
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.photoFailures = [];
  page.on('requestfailed', request => page.photoFailures.push({ url: request.url(), reason: request.failure()?.errorText }));
  await page.setViewportSize(viewport);
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('request', request => {
    const url = request.url();
    if (/^https?:/.test(url)) {
      if (new URL(url).origin !== origin) report.externalRequests.push(url);
      else resources.add(new URL(url).pathname.slice(1));
    }
  });
  await page.goto(target + query, { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => window.GoiVietHomeIntro && window.GoiVietBooks && window.GoiVietJourneyPreview);
  await page.evaluate(() => { GoiVietHomeIntro.skip(); closeIntroModal(); });
  await page.waitForFunction(() => window.GoiVietArrivalDemo && document.querySelector('#station-pick-hn'));
  await page.evaluate(() => document.fonts.ready);
  return page;
}

async function select(page, photo) {
  const name = await page.evaluate(id => contentVi(CULTURAL_PLACE_MAP[id], 'name'), photo.id);
  if (await page.locator('#stationPanel').isHidden()) await page.locator('#previewPanelOpen').click();
  await page.locator('#provSearchInput').fill(name);
  const pick = page.locator('#station-pick-' + photo.id);
  await pick.click();
  await page.locator('#arrivalExplore').click();
  await page.waitForFunction(id => GoiVietArrivalDemo.isSheetOpen() && document.querySelector('#arrivalSheet').dataset.place === id, photo.id);
  const art = page.locator('#story-hero-' + photo.id + ' .gv-station-art-photo');
  if (photo.status === 'placeholder') {
    await page.locator('#story-hero-' + photo.id).waitFor({ state: 'visible' });
    assert.equal(await art.count(), 0);
    return null;
  }
  await art.waitFor({ state: 'visible' });
  await art.evaluate(image => image.decode());
  return art;
}

async function inspectFrame(page, photo, label, screenshots) {
  const art = await select(page, photo);
  if (!art) {
    const hero = page.locator('#story-hero-' + photo.id);
    assert(await hero.locator('.gv-station-art-fallback svg').isVisible());
    assert.equal(await page.locator('#arrivalSheet .gv-station-photo-credit').count(), 0);
    assert.equal(await hero.getAttribute('title'), label.includes('en') ? photo.titleEn : photo.titleVi);
    assert(await page.evaluate(id => {
      const place = CULTURAL_PLACE_MAP[id];
      return place.photoTitleVi === contentVi(place, 'highlights').landmark && !place.photoUrl && !place.photos.length;
    }, photo.id));
    if (screenshots) await page.locator('#arrivalSheet').screenshot({ path: path.join(OUT, label, photo.id + '.png') });
    report.frames.push({ viewport: label, id: photo.id, placeholder: true });
    return;
  }
  await page.mouse.move(2, 2);
  await page.locator('#arrivalSheet').evaluate(async sheet => {
    await Promise.allSettled(sheet.getAnimations().map(animation => animation.finished));
  });
  const frame = await art.evaluate(image => {
    const rect = image.getBoundingClientRect();
    const wrapper = image.closest('.gv-station-art');
    const outer = wrapper.getBoundingClientRect();
    const style = getComputedStyle(wrapper);
    const left = parseFloat(style.borderLeftWidth), top = parseFloat(style.borderTopWidth);
    const right = parseFloat(style.borderRightWidth), bottom = parseFloat(style.borderBottomWidth);
    const panel = image.closest('#arrivalSheet');
    const sheet = panel.getBoundingClientRect();
    const summary = panel.querySelector('.arrival-summary').getBoundingClientRect();
    return { src: image.currentSrc, alt: image.alt, id: image.dataset.photoPlace, width: rect.width, height: rect.height,
      naturalWidth: image.naturalWidth, naturalHeight: image.naturalHeight,
      objectFit: getComputedStyle(image).objectFit, position: image.style.objectPosition,
      fits: Math.abs(rect.left - outer.left - left) < 1 && Math.abs(rect.top - outer.top - top) < 1
        && Math.abs(rect.width - outer.width + left + right) < 1 && Math.abs(rect.height - outer.height + top + bottom) < 1,
      inSheet: outer.left >= sheet.left && outer.right <= sheet.right && outer.bottom <= summary.top + 1,
      noOverflow: panel.scrollWidth <= panel.clientWidth + 1,
      density: getComputedStyle(image).objectFit === 'contain'
        ? Math.max(image.naturalWidth / rect.width, image.naturalHeight / rect.height)
        : Math.min(image.naturalWidth / rect.width, image.naturalHeight / rect.height) };
  });
  assert.equal(new URL(frame.src).pathname.endsWith('/' + photo.src), true, label + ':' + photo.id);
  assert.equal(frame.id, photo.id);
  assert.equal(frame.alt, label.includes('en') ? photo.titleEn : photo.titleVi);
  assert.equal(frame.objectFit, photo.fit || 'cover');
  assert.equal(frame.position, photo.position);
  assert(frame.naturalWidth === photo.width && frame.naturalHeight === photo.height);
  assert(frame.fits && frame.inSheet && frame.noOverflow, label + ':' + photo.id + ' frame placement ' + JSON.stringify(frame));
  assert(frame.density >= 2, label + ':' + photo.id + ' source density below 2x');
  const credit = page.locator('#arrivalSheet .gv-station-photo-credit');
  await credit.locator('summary').click();
  const creditText = (await credit.innerText()).replace(/\s+/g, ' ');
  assert(creditText.includes(photo.author.replace(/\s+/g, ' ')), label + ':' + photo.id + ' author: ' + creditText);
  assert(creditText.includes(photo.license.replace(/\s+/g, ' ')), label + ':' + photo.id + ' license');
  // Close by keyboard as a user can: avoids scroll anchoring moving the pointer
  // target when a large tablet photo and its attribution details resize the panel.
  assert.equal(await page.evaluate(() => document.activeElement?.tagName), 'SUMMARY');
  await page.keyboard.press('Space');
  assert.equal(await credit.getAttribute('open'), null);
  if (screenshots) {
    await page.locator('#arrivalSheet').screenshot({ path: path.join(OUT, label, photo.id + '.png') });
    await page.locator('#story-hero-' + photo.id).screenshot({ path: path.join(OUT, label, photo.id + '-photo.png') });
  }
  report.frames.push({ viewport: label, id: photo.id, ...frame });
}

async function responsive(browser) {
  const context = await browser.newContext({ serviceWorkers: 'block', reducedMotion: 'reduce', deviceScaleFactor: 2 });
  await context.route(/^https?:/, route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  for (const viewport of [{ width: 1440, height: 1120 }, { width: 1366, height: 900 }, { width: 1024, height: 768 },
                          { width: 768, height: 1024 }, { width: 390, height: 844 }, { width: 360, height: 800 }]) {
    if (['vi', 'en'].every(lang => completed.has(viewport.width + '-' + lang))) continue;
    const page = await openMap(context, viewport);
    const security = await page.evaluate(() => ({
      remote: getStationPhotoUrl('https://upload.wikimedia.org/fake.webp'),
      traversal: getStationPhotoUrl('assets/goi-viet/station-photos-5/../fake.webp'),
      data: getStationPhotoUrl('data:image/png;base64,AAAA'),
      javascript: getStationPhotoUrl('javascript:alert(1)'),
      allLocal: ALL_PLAYABLE_PLACES.every(p => (p.id === 'hoang-sa' ? !p.photoUrl : !!getStationPhotoUrl(p.photoUrl)) && p.photos.every(photo => !!getStationPhotoUrl(photo.url)))
    }));
    assert.deepEqual(security, { remote: null, traversal: null, data: null, javascript: null, allLocal: true });
    for (const lang of ['vi', 'en']) {
      if (completed.has(viewport.width + '-' + lang)) continue;
      console.log('Checking', viewport.width, lang);
      await page.evaluate(lang => GoiVietI18n.setLang(lang, { remember: false }), lang);
      const label = viewport.width + '-' + lang;
      fs.mkdirSync(path.join(OUT, label), { recursive: true });
      for (const photo of catalog) {
        if (catalog.indexOf(photo) % 12 === 0) console.log('  station', photo.id);
        await inspectFrame(page, photo, label, lang === 'vi' && [1440, 390].includes(viewport.width));
        if (viewport.width === 1440 && lang === 'vi') {
          await page.locator('#story-hero-' + photo.id).click();
          await page.waitForFunction(id => GoiVietBooks.inspect().placeId === id && ['book', 'soon'].includes(GoiVietBooks.inspect().kind), photo.id);
          await page.keyboard.press('Escape');
          await page.waitForFunction(() => !document.querySelector('#bookModal.open'));
          assert.equal(await page.evaluate(() => document.activeElement.id), 'story-hero-' + photo.id);
          report.interactions.push({ id: photo.id, bookEntry: true, focusRestored: true });
        }
      }
    }
    if (viewport.width === 1440) {
      for (const photo of catalog) {
        await page.evaluate(id => renderStoryLocation(CULTURAL_PLACE_MAP[id]), photo.id);
        const image = page.locator('#storyRealPhoto');
        if (photo.status === 'placeholder') {
          assert(await page.locator('#storyLocationDetails').isHidden());
          assert.equal(await image.getAttribute('src'), null);
          continue;
        }
        // The legacy location panel is collapsed and intentionally lazy-loaded.
        // Force only this test image to load before checking its bundled URL.
        await image.evaluate(img => { img.loading = 'eager'; return img.decode(); });
        assert((await image.getAttribute('src')).endsWith(photo.src));
      }
      // A failed file keeps the existing visual fallback and selecting again recovers.
      await select(page, catalog[0]);
      await page.locator('.gv-station-art-photo').dispatchEvent('error');
      assert(await page.locator('.gv-station-art-photo').isHidden());
      await select(page, catalog[1]);
      await select(page, catalog[0]);
      assert(await page.locator('.gv-station-art-photo').isVisible());
      await page.locator('#arrivalSheet').screenshot({ path: path.join(OUT, 'desktop-arrival.png') });
    }
    await page.close();
  }
  await context.close();
}

async function offline(browser) {
  const context = await browser.newContext({ reducedMotion: 'reduce', deviceScaleFactor: 2 });
  await context.route(/^https?:/, route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
  let page = await openMap(context, { width: 1440, height: 1120 });
  assert.equal((await page.evaluate(() => GoiVietOffline.ready)).ready, false, 'Fresh visits must not install a worker');
  await page.locator('#headerSettings > summary').click();
  await page.locator('#btnPrepareOffline').click();
  await page.waitForFunction(() => GoiVietOffline.inspect().ready || GoiVietOffline.inspect().phase === 'error', null, { timeout: 180000 });
  const ready = await page.evaluate(() => GoiVietOffline.ready);
  assert(ready.ready, JSON.stringify(ready));
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await page.close();
  await context.setOffline(true);
  // New tab and uncached query: no warm DOM, no online server or browser HTTP-cache dependency.
  page = await openMap(context, { width: 1440, height: 1120 }, '&offline=cold-reload&lang=vi');
  const failures = page.photoFailures;
  fs.mkdirSync(path.join(OUT, 'offline-vi'), { recursive: true });
  for (const photo of catalog) await inspectFrame(page, photo, 'offline-vi', false);
  await page.reload({ waitUntil: 'load' });
  await page.waitForFunction(() => window.GoiVietArrivalDemo);
  await page.evaluate(() => { GoiVietHomeIntro.skip(); closeIntroModal(); GoiVietI18n.setLang('en', { remember: false }); });
  for (const photo of catalog) await inspectFrame(page, photo, 'offline-en', false);
  assert.deepEqual(failures, [], 'Missing resources during offline operation');
  await page.locator('#arrivalSheet').screenshot({ path: path.join(OUT, 'offline-arrival.png') });
  report.offline = { ...ready, coldReload: true, provinces: 36, languages: 2, failures };
  await context.close();
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const temp = path.join(OUT, 'browser-temp'); fs.mkdirSync(temp, { recursive: true });
  process.env.TEMP = process.env.TMP = temp;
  staticChecks();
  const browser = await launch();
  try {
    await responsive(browser);
    await offline(browser);
    assert.deepEqual(report.errors, []);
    assert.deepEqual(report.externalRequests, []);
    console.log('PASS: 35 photos + Hoàng Sa symbol, 6 viewports × 2 languages, 36 book entries, opt-in preparation, and 72 cold-offline frames.');
  } finally {
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
    fs.writeFileSync(path.join(OUT, 'observed-resources.json'), JSON.stringify([...resources].sort(), null, 2));
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
