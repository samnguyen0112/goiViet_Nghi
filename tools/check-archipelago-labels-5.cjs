// Checks Hoàng Sa & Trường Sa labels and detail buttons across 7 desktop viewports
// × VI/EN × light/dark × arrivalSheet closed/open.
// Run with tools/perf/server.cjs on port 8770:
//   node tools/check-archipelago-labels-5.cjs
const assert = require('node:assert/strict');
const { launch, BASE, fs, path, ROOT } = require('./perf/lib.cjs');

const OUT = path.join(ROOT, process.env.ARCHIPELAGO_OUT || 'verification/ts-label-fix');
const PAGE = 'map-surroundings-preview-5.html';
const VIEWPORTS = [
  { width: 1024, height: 768 },
  { width: 1280, height: 720 },
  { width: 1280, height: 800 },
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1536, height: 864 },
  { width: 1920, height: 1080 },
];
const LANGS = ['vi', 'en'];
const THEMES = ['light', 'dark'];

fs.mkdirSync(OUT, { recursive: true });

async function waitStable(page) {
  await page.evaluate(() => new Promise(resolve => {
    requestMapRender(4);
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  }));
  await page.waitForFunction(
    () => !isSceneAnimating() && window.GoiVietRegionalPreview?.inspect().geometryLoaded && !window.GoiVietRegionalPreview.inspect().backdropPending,
    null,
    { timeout: 30000 }
  );
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function setState(page, lang, theme) {
  await page.evaluate(({ lang, theme }) => {
    if (window.GoiVietI18n?.lang() !== lang) window.GoiVietI18n.setLang(lang, { remember: false });
    if (state.theme !== theme) {
      state.theme = theme;
      document.documentElement.setAttribute('data-theme', theme);
      if (typeof syncThemeLabels === 'function') syncThemeLabels();
    }
    requestMapRender(6);
  }, { lang, theme });
  await waitStable(page);
}

async function inspectFrame(page, { sheetOpen }) {
  return page.evaluate(({ sheetOpen }) => {
    const ov = (a, b, tol = 0.5) =>
      a.left < b.right - tol && a.right > b.left + tol && a.top < b.bottom - tol && a.bottom > b.top + tol;
    const reg = GoiVietRegionalPreview.inspect();
    const islandMap = Object.fromEntries(reg.islandLabels.map(l => [l.id, l]));
    const visibleEl = el => Boolean(el && el.checkVisibility?.({ checkOpacity: true, checkVisibilityCSS: true }));

    const uiSelectors = ['.top-header', '.left-helper', '#stationPanel', '#arrivalSheet', '.bottom-dock', '.journey-route-bar', '#arrivalStartHint'];
    const uiBoxes = [];
    for (const sel of uiSelectors) {
      const el = document.querySelector(sel);
      if (!visibleEl(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) uiBoxes.push({ id: sel, left: r.left, right: r.right, top: r.top, bottom: r.bottom });
    }
    if (mapCompass) {
      uiBoxes.push({
        id: 'compass',
        left: mapCompass.x - 43,
        right: mapCompass.x + 43,
        top: mapCompass.y - 45,
        bottom: mapCompass.y + 65,
      });
    }
    for (const ob of window.GoiVietHeritageFrame?.obstacles() || []) {
      uiBoxes.push({ id: 'frame', left: ob.left, right: ob.right, top: ob.top, bottom: ob.bottom });
    }

    const hitsMainland = box => {
      const probes = [];
      for (let ix = 0; ix <= 4; ix++) {
        for (let iy = 0; iy <= 4; iy++) {
          probes.push([
            box.left + (box.right - box.left) * ix / 4,
            box.top + (box.bottom - box.top) * iy / 4,
          ]);
        }
      }
      for (const entry of renderedHitProvinces || []) {
        for (const ring of entry.topProjectedRings || []) {
          if (probes.some(([x, y]) => pointInRing2D(x, y, ring))) return entry.prov?.id || 'province';
          if (ring.some(([x, y]) => x > box.left && x < box.right && y > box.top && y < box.bottom)) {
            return entry.prov?.id || 'province';
          }
        }
      }
      return null;
    };

    const landObjects = reg.landmarks.filter(l => l.id !== 'sailboat');
    const sailboat = reg.landmarks.find(l => l.id === 'sailboat') || null;
    const countryBoxes = reg.countryLabels.map(l => ({ id: l.id, ...l.box }));

    // Hainan polygon screen box (world x in [400..600], y in [200..380])
    let hainanBox = null;
    const hainanPoly = (window.GoiVietRegionalGeometry?.land || [])
      .map(p => (Array.isArray(p) ? p[0] : p.outer))
      .find(o => {
        if (!o || o.length <= 50) return false;
        const bb = GoiVietNaturalCore.box(o);
        return bb.left > 400 && bb.right < 600 && bb.top > 200 && bb.bottom < 380;
      });
    if (hainanPoly) {
      const pts = hainanPoly.map(([x, y]) => project3D(x, y, 0, state.cam, cw, ch));
      hainanBox = {
        left: Math.min(...pts.map(p => p[0])),
        right: Math.max(...pts.map(p => p[0])),
        top: Math.min(...pts.map(p => p[1])),
        bottom: Math.max(...pts.map(p => p[1])),
      };
    }

    const arch = {};
    for (const id of ['hoang-sa', 'truong-sa']) {
      const label = islandMap[id] || null;
      const btnEl = document.getElementById('detailButton-' + id);
      const btnStyle = btnEl ? getComputedStyle(btnEl) : null;
      const btnRect = btnEl ? btnEl.getBoundingClientRect() : null;
      const btnVisible = Boolean(btnEl && btnStyle.display !== 'none' && btnStyle.visibility !== 'hidden' && btnRect.width > 0 && btnRect.height > 0);
      const btnBox = btnVisible ? { left: btnRect.left, right: btnRect.right, top: btnRect.top, bottom: btnRect.bottom } : null;

      const labelBox = label ? label.box : null;
      const uiOverlapsLabel = labelBox ? uiBoxes.filter(u => ov(labelBox, u)).map(u => u.id) : [];
      const uiOverlapsBtn = btnBox ? uiBoxes.filter(u => ov(btnBox, u)).map(u => u.id) : [];
      const landOverlapLabel = labelBox ? hitsMainland(labelBox) : null;
      const landOverlapBtn = btnBox ? hitsMainland(btnBox) : null;
      const countryOverlapLabel = labelBox ? countryBoxes.filter(c => ov(labelBox, c)).map(c => c.id) : [];
      const landObjOverlapLabel = labelBox ? landObjects.filter(o => ov(labelBox, o)).map(o => o.id) : [];
      const inBoundsLabel = labelBox
        ? labelBox.left >= 0 && labelBox.right <= cw && labelBox.top >= 0 && labelBox.bottom <= ch
        : false;
      const inBoundsBtn = btnBox
        ? btnBox.left >= 0 && btnBox.right <= cw && btnBox.top >= 0 && btnBox.bottom <= ch
        : false;

      arch[id] = {
        hasLabel: Boolean(label),
        text: label ? label.text : null,
        labelBox: labelBox ? { left: Math.round(labelBox.left), top: Math.round(labelBox.top), right: Math.round(labelBox.right), bottom: Math.round(labelBox.bottom) } : null,
        btnVisible,
        btnText: btnEl ? btnEl.innerText.trim() : null,
        btnBox: btnBox ? { left: Math.round(btnBox.left), top: Math.round(btnBox.top), right: Math.round(btnBox.right), bottom: Math.round(btnBox.bottom) } : null,
        inBoundsLabel,
        inBoundsBtn,
        uiOverlapsLabel,
        uiOverlapsBtn,
        landOverlapLabel,
        landOverlapBtn,
        countryOverlapLabel,
        landObjOverlapLabel,
      };
    }

    const pairOverlap = Boolean(
      islandMap['hoang-sa'] && islandMap['truong-sa'] && ov(islandMap['hoang-sa'].box, islandMap['truong-sa'].box)
    );

    let boatCheck = null;
    if (!sheetOpen) {
      const headerBox = uiBoxes.find(u => u.id === '.top-header') || null;
      const hintBox = uiBoxes.find(u => u.id === '#arrivalStartHint') || null;
      let boatOnWater = false;
      if (sailboat) {
        boatOnWater = true;
        for (let ix = 0; ix <= 4 && boatOnWater; ix++) {
          for (let iy = 0; iy <= 4 && boatOnWater; iy++) {
            const sx = sailboat.left + (sailboat.right - sailboat.left) * ix / 4;
            const sy = sailboat.top + (sailboat.bottom - sailboat.top) * iy / 4;
            if (!GoiVietRegionalPreview.waterAtScreen(sx, sy)) boatOnWater = false;
          }
        }
      }
      boatCheck = {
        present: Boolean(sailboat),
        scale: sailboat ? +sailboat.scale.toFixed(3) : null,
        box: sailboat ? { left: Math.round(sailboat.left), top: Math.round(sailboat.top), right: Math.round(sailboat.right), bottom: Math.round(sailboat.bottom) } : null,
        onWater: boatOnWater,
        hitsHeader: Boolean(sailboat && headerBox && ov(sailboat, headerBox)),
        hitsHint: Boolean(sailboat && hintBox && ov(sailboat, hintBox)),
        hitsHainan: Boolean(sailboat && hainanBox && ov(sailboat, hainanBox)),
        hitsHoangSa: Boolean(sailboat && islandMap['hoang-sa'] && ov(sailboat, islandMap['hoang-sa'].box)),
        hitsTruongSa: Boolean(sailboat && islandMap['truong-sa'] && ov(sailboat, islandMap['truong-sa'].box)),
      };
    }

    return {
      zoom: +state.cam.zoom.toFixed(3),
      sheetVisible: visibleEl(document.getElementById('arrivalSheet')),
      sheetLeft: visibleEl(document.getElementById('arrivalSheet')) ? Math.round(document.getElementById('arrivalSheet').getBoundingClientRect().left) : null,
      islandIds: reg.islandLabels.map(l => l.id),
      arch,
      pairOverlap,
      boatCheck,
    };
  }, { sheetOpen });
}

function validate(info, { sheetOpen }) {
  const problems = [];
  if (sheetOpen && !info.sheetVisible) problems.push('#arrivalSheet expected open but is hidden');
  if (!sheetOpen && info.sheetVisible) problems.push('#arrivalSheet expected closed but is visible');
  for (const id of ['hoang-sa', 'truong-sa']) {
    const a = info.arch[id];
    if (!a.hasLabel) problems.push(`missing islandLabel ${id}`);
    if (!a.btnVisible) problems.push(`missing #detailButton-${id}`);
    if (a.hasLabel && !a.inBoundsLabel) problems.push(`${id} label out of bounds`);
    if (a.btnVisible && !a.inBoundsBtn) problems.push(`${id} button out of bounds`);
    if (a.uiOverlapsLabel.length) problems.push(`${id} label overlaps UI: ${a.uiOverlapsLabel.join(',')}`);
    if (a.uiOverlapsBtn.length) problems.push(`${id} button overlaps UI: ${a.uiOverlapsBtn.join(',')}`);
    if (a.landOverlapLabel) problems.push(`${id} label overlaps mainland: ${a.landOverlapLabel}`);
    if (a.landOverlapBtn) problems.push(`${id} button overlaps mainland: ${a.landOverlapBtn}`);
    if (a.countryOverlapLabel.length) problems.push(`${id} label overlaps countryLabel: ${a.countryOverlapLabel.join(',')}`);
    if (a.landObjOverlapLabel.length) problems.push(`${id} label overlaps land object: ${a.landObjOverlapLabel.join(',')}`);
  }
  if (info.pairOverlap) problems.push('hoang-sa and truong-sa labels overlap');
  if (!sheetOpen && info.boatCheck) {
    const b = info.boatCheck;
    if (!b.present) problems.push('sailboat missing');
    if (b.present && !b.onWater) problems.push('sailboat not completely on open sea');
    if (b.hitsHeader) problems.push('sailboat overlaps .top-header');
    if (b.hitsHint) problems.push('sailboat overlaps #arrivalStartHint');
    if (b.hitsHainan) problems.push('sailboat overlaps Hainan Island');
    if (b.hitsHoangSa) problems.push('sailboat overlaps hoang-sa label');
    if (b.hitsTruongSa) problems.push('sailboat overlaps truong-sa label');
  }
  return problems;
}

(async () => {
  const browser = await launch('real');
  const rows = [];
  const failures = [];
  const errors = [];
  try {
    for (const vp of VIEWPORTS) {
      const size = `${vp.width}x${vp.height}`;
      const ctx = await browser.newContext({ viewport: vp, reducedMotion: 'reduce', serviceWorkers: 'block' });
      const page = await ctx.newPage();
      page.setDefaultTimeout(20000);
      page.on('pageerror', err => errors.push({ size, type: 'pageerror', message: err.message }));
      page.on('console', msg => { if (msg.type() === 'error') errors.push({ size, type: 'console', message: msg.text() }); });
      await page.route(/^https?:/, r => (r.request().url().startsWith(BASE) ? r.continue() : r.abort('blockedbyclient')));
      await page.goto(BASE + PAGE + '?lang=vi', { waitUntil: 'domcontentloaded', timeout: 120000 });
      await page.waitForFunction(() => window.GoiVietHomeIntro && window.GoiVietJourneyPreview && window.GoiVietNaturalLandscape, null, { timeout: 120000 });
      await page.evaluate(() => GoiVietHomeIntro.skip());
      await page.locator('#btnHomeExploreMemory').click();
      await page.locator('#memoryOpenMap').click({ timeout: 120000 });
      await page.waitForFunction(
        () => document.querySelector('#introScreen.intro-hidden') && !document.querySelector('#memoryMapTransition.is-covering'),
        null,
        { timeout: 120000 }
      );
      await page.evaluate(() => document.fonts.ready);
      await waitStable(page);

      // Phase 1: #arrivalSheet closed
      for (const lang of LANGS) {
        for (const theme of THEMES) {
          await setState(page, lang, theme);
          const info = await inspectFrame(page, { sheetOpen: false });
          const problems = validate(info, { sheetOpen: false });
          const ok = problems.length === 0;
          const tag = `${size}-${lang}-${theme}-closed`;
          rows.push({ size, lang, theme, sheet: 'closed', ok, problems, info });
          const capture = (lang === 'vi' && theme === 'light') || size === '1280x720' || !ok;
          if (capture) {
            const fname = ok ? `${size}-${lang}-${theme}.png` : `FAIL-${tag}.png`;
            await page.screenshot({ path: path.join(OUT, fname), timeout: 15000 });
          }
          if (!ok) failures.push({ tag, problems, info });
          console.log(`${ok ? 'PASS' : 'FAIL'} [${tag}] labels=[${info.islandIds.join(',')}] boat=${info.boatCheck?.present ? `scale:${info.boatCheck.scale}` : 'none'}${ok ? '' : ' -> ' + problems.join('; ')}`);
        }
      }

      // Phase 2: Open #arrivalSheet (Hà Nội) and recenter map to overview so both archipelagos stay in view
      await setState(page, 'vi', 'light');
      await page.locator('#arrivalStartHint [data-arrival-pick="hn"]').click();
      await page.locator('#arrivalExplore').click();
      await page.waitForFunction(() => GoiVietArrivalDemo.isSheetOpen() && !isSceneAnimating(), null, { timeout: 20000 });
      await page.locator('#btnRecenterMap').click();
      await waitStable(page);

      for (const lang of LANGS) {
        for (const theme of THEMES) {
          await setState(page, lang, theme);
          const info = await inspectFrame(page, { sheetOpen: true });
          const problems = validate(info, { sheetOpen: true });
          const ok = problems.length === 0;
          const tag = `${size}-${lang}-${theme}-sheet`;
          rows.push({ size, lang, theme, sheet: 'open', ok, problems, info });
          const capture = (lang === 'vi' && theme === 'light') || size === '1280x800' || !ok;
          if (capture) {
            const fname = ok ? `${size}-${lang}-${theme}-sheet.png` : `FAIL-${tag}.png`;
            await page.screenshot({ path: path.join(OUT, fname), timeout: 15000 });
          }
          if (!ok) failures.push({ tag, problems, info });
          console.log(`${ok ? 'PASS' : 'FAIL'} [${tag}] labels=[${info.islandIds.join(',')}] sheetL=${info.sheetLeft}${ok ? '' : ' -> ' + problems.join('; ')}`);
        }
      }

      await ctx.close();
    }
  } finally {
    await browser.close();
  }

  const summary = {
    total: rows.length,
    passed: rows.filter(r => r.ok).length,
    failed: failures.length,
    errors,
    failures: failures.map(f => ({ tag: f.tag, problems: f.problems })),
    rows,
  };
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(summary, null, 2));
  console.log(`\nSUMMARY: ${summary.passed}/${summary.total} checks passed; ${failures.length} failed; ${errors.length} console/page errors.`);
  if (failures.length || errors.length) process.exit(1);
})();
