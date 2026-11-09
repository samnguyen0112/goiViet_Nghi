// GD2 pilot: which condition of map-prewarm complete() keeps the curtain up, and when does each become true?
// node tools/perf/probe-hold.cjs --target map-surroundings-preview-5.html --cpu 4 --dwell 4
const { launch, BASE, fs, path, ROOT } = require('./lib.cjs');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const target = arg('target', 'map-surroundings-preview-5.html'), cpu = +arg('cpu', 4), dwell = +arg('dwell', 4);
(async () => {
  const b = await launch('real'); const ctx = await b.newContext({ viewport: { width: 1707, height: 1067 }, deviceScaleFactor: 1 }); const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  await page.addInitScript(`(()=>{window.__tl=[];window.__sample=()=>{const T=window.GoiVietWebGLTerrain3,R=window.GoiVietRasterTasks&&window.GoiVietRasterTasks.inspect(),B=window.GoiVietRegionalPreview&&window.GoiVietRegionalPreview.inspect(),t=T&&T.usable()?T.inspect():null,c=document.getElementById('memoryMapTransition');
    return {t:Math.round(performance.now()),cls:c?c.className.replace('mc-transition','').trim():'',
      terrain:t?{active:t.active,pending:t.pending,frames:t.frames}:null,
      raster:R?{pending:R.pending,aux:R.auxiliaryTasks,upd:R.updating,ready:R.ready,done:R.completed}:null,
      backdrop:B?{commits:B.backdropCommits,pending:B.backdropPending,dirty:B.backdropDirty,covFallback:B.coverageFallback,refine:B.refinePending,gerr:!!B.geometryError,berr:!!B.backdropError}:null};};})();`);
  await page.goto(BASE + target, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.GoiVietHomeIntro && !document.getElementById('btnHomeOpeningStart').disabled, null, { timeout: 600000 });
  await page.waitForTimeout(1200); await page.click('#btnHomeOpeningStart');
  await page.waitForFunction(() => document.getElementById('introScreen').dataset.homeOpening === 'complete', null, { timeout: 180000 });
  await page.waitForTimeout(dwell * 1000);
  await page.evaluate(() => window.GoiVietMemoryChapter.begin()); await page.waitForTimeout(1500);
  const click = await page.evaluate(() => { document.getElementById('memoryOpenMap').scrollIntoView(); const t = performance.now(); document.getElementById('memoryOpenMap').click(); return t; });
  const tl = [];
  for (let i = 0; i < 400; i++) {
    await page.waitForTimeout(500);
    const s = await page.evaluate(() => window.__sample()); s.t -= Math.round(click); tl.push(s);
    if (!/covering|waiting|revealing/.test(s.cls) && tl.length > 4) break;
  }
  const flat = s => `${String(s.t).padStart(6)}ms [${s.cls || '-'}] terrain=${JSON.stringify(s.terrain)} raster=${JSON.stringify(s.raster)} backdrop=${JSON.stringify(s.backdrop)}`;
  const every = Math.max(1, Math.floor(tl.length / 22)); tl.forEach((s, i) => { if (i % every === 0 || i === tl.length - 1) console.log(flat(s)); });
  fs.writeFileSync(path.join(ROOT, `tools/perf/results/gd2/hold-timeline-x${cpu}-d${dwell}.json`), JSON.stringify(tl, null, 1));
  await b.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
