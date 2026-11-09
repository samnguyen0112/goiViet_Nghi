// GD6: sample GoiVietMapPrewarm3.holding() and GoiVietWebGLTerrain3.usable() every 50 ms from the "open map" click until the curtain clears.
// node tools/perf/probe-gd6-usable.cjs [--cpu 4] [--gpu real]
const { launch, BASE } = require('./lib.cjs');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
(async () => {
  const b = await launch(arg('gpu', 'real')); const ctx = await b.newContext({ viewport: { width: 1707, height: 1067 }, deviceScaleFactor: 1 }); const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: +arg('cpu', 4) });
  await page.goto(BASE + 'map-surroundings-preview-5.html', { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.GoiVietHomeIntro && !document.getElementById('btnHomeOpeningStart').disabled, null, { timeout: 600000 }); await page.waitForTimeout(800);
  await page.click('#btnHomeOpeningStart'); await page.waitForFunction(() => document.getElementById('introScreen').dataset.homeOpening === 'complete', null, { timeout: 240000 }); await page.waitForTimeout(800);
  await page.evaluate(() => window.GoiVietMemoryChapter.begin()); await page.waitForTimeout(1200);
  await page.evaluate(() => {
    window.__s = []; const t0 = performance.now(); const s = () => { const P = window.GoiVietMapPrewarm3, T = window.GoiVietWebGLTerrain3; window.__s.push([Math.round(performance.now() - t0), !!(P && P.holding()), T ? T.usable() : 'noT', T && T.inspect ? !!T.inspect().available : 'n/a']); };
    window.__iv = setInterval(s, 50); document.getElementById('memoryOpenMap').scrollIntoView(); document.getElementById('memoryOpenMap').click();
  });
  await page.waitForFunction(() => { const i = document.getElementById('introScreen'), c = document.getElementById('memoryMapTransition'); return i.classList.contains('intro-hidden') && c && !/is-(covering|waiting|revealing)/.test(c.className); }, null, { timeout: 240000 });
  const s = await page.evaluate(() => { clearInterval(window.__iv); return window.__s; });
  const hold = s.filter(r => r[1]); const bad = hold.filter(r => r[2] !== true);
  console.log(`samples ${s.length}, during hold ${hold.length}, hold && usable!==true: ${bad.length}`);
  const first = (f) => { const r = s.find(f); return r ? r[0] : null; };
  console.log('first hold at ms', first(r => r[1]), '| first usable true', first(r => r[2] === true), '| first available(gl created)', first(r => r[3] === true), '| last hold at', [...s].reverse().find(r => r[1])?.[0]);
  console.log('distinct (hold,usable) combos:', [...new Set(s.map(r => r[1] + '/' + r[2]))].join(', '));
  await b.close();
})();
