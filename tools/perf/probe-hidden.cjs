// Are the legacy gate images actually visible at any phase? node tools/perf/probe-hidden.cjs [target]
const { launch, BASE } = require('./lib.cjs');
const target = process.argv[2] || 'map-surroundings-preview-5.html';
const SEL = ['.gv-bg-artwork', '.gv-sway-fg.gv-sway-left', '.gv-sway-fg.gv-sway-right', '.gv-home-poster', 'img[src*="crane-left"]', 'img[src*="crane-right"]', 'img[src*="invitation/art-"]'];
const probe = () => document.querySelectorAll('img').length && Object.fromEntries(window.__SEL.map(sel => [sel, [...document.querySelectorAll(sel)].map(e => { const cs = getComputedStyle(e), r = e.getBoundingClientRect(); let hiddenByAncestor = false; for (let a = e; a; a = a.parentElement) { const c = getComputedStyle(a); if (c.display === 'none' || c.visibility === 'hidden') { hiddenByAncestor = true; break; } } return { display: cs.display, vis: cs.visibility, opacity: cs.opacity, w: Math.round(r.width), h: Math.round(r.height), hiddenByAncestor, loading: e.loading, complete: e.complete }; })]));
(async () => {
  const b = await launch('real'); const ctx = await b.newContext({ viewport: { width: 1707, height: 1067 } }); const page = await ctx.newPage();
  await page.addInitScript(`window.__SEL=${JSON.stringify(SEL)}`);
  await page.goto(BASE + target, { waitUntil: 'load' });
  await page.waitForFunction(() => window.GoiVietHomeIntro && !document.getElementById('btnHomeOpeningStart').disabled, null, { timeout: 60000 });
  const show = async (label) => console.log('##', label, JSON.stringify(await page.evaluate(probe)));
  await show('gate');
  await page.click('#btnHomeOpeningStart'); await page.waitForFunction(() => document.getElementById('introScreen').dataset.homeOpening === 'complete', null, { timeout: 60000 }); await page.waitForTimeout(500);
  await show('home');
  await page.evaluate(() => window.GoiVietMemoryChapter.begin()); await page.waitForTimeout(1500); await show('memory');
  await b.close();
})();
