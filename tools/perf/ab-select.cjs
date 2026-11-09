// GD4: what-if A/B for the "select a place" path, variants patched at run time inside ONE page session (interleaved, no file edits).
//   v0 = current preview-5
//   v1 = renderDemoPlaceList: island-button aria writes moved AFTER the list innerHTML (pure reorder)
//   v2 = v1 + scrollIntoView of the selected card deferred to requestAnimationFrame (after the frame's own style/layout)
//   v3 = scrollIntoView deferred only (this is the variant that ships; v1/v2 were the first round, v1 showed no benefit)
// node tools/perf/ab-select.cjs --target map-surroundings-preview-5.html --cpu 4 --rounds 8 --label sel-x4
const { fs, path, launch, BASE, ROOT, summarize } = require('./lib.cjs');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const target = arg('target', 'map-surroundings-preview-5.html'), cpu = +arg('cpu', 1), gpu = arg('gpu', 'real'), label = arg('label', 'sel-x' + cpu), rounds = +arg('rounds', 8);
const outDir = path.join(ROOT, 'tools/perf/results/gd4-map'); fs.mkdirSync(outDir, { recursive: true });
const INIT = `(()=>{const M=window.__s={loaf:[],g:[]};let last=0;const loop=t=>{if(last)M.g.push([t,t-last]);last=t;requestAnimationFrame(loop)};requestAnimationFrame(loop);
try{new PerformanceObserver(l=>{for(const e of l.getEntries())M.loaf.push([e.startTime,e.duration,e.blockingDuration||0])}).observe({type:'long-animation-frame'})}catch(e){}})();`;
(async () => {
  const browser = await launch(gpu, ['--enable-precise-memory-info']);
  const ctx = await browser.newContext({ viewport: { width: 1707, height: 1067 }, deviceScaleFactor: 1 });
  await ctx.addInitScript(INIT);
  const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true }); await cdp.send('Performance.enable');
  if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  const metrics = async () => { const m = await cdp.send('Performance.getMetrics'); const o = {}; m.metrics.forEach(x => o[x.name] = x.value); return o; };
  await page.goto(BASE + target, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.GoiVietHomeIntro && !document.getElementById('btnHomeOpeningStart').disabled, null, { timeout: 600000 });
  await page.waitForTimeout(1500); await page.click('#btnHomeOpeningStart');
  await page.waitForFunction(() => document.getElementById('introScreen').dataset.homeOpening === 'complete', null, { timeout: 240000 });
  await page.waitForTimeout(3000);
  await page.evaluate(() => window.GoiVietMemoryChapter.begin()); await page.waitForTimeout(1500);
  for (let i = 0; i < 10; i++) { await page.mouse.move(800, 600); await page.mouse.wheel(0, 200); await page.waitForTimeout(120); }
  await page.waitForTimeout(600);
  await page.evaluate(() => { document.getElementById('memoryOpenMap').scrollIntoView(); document.getElementById('memoryOpenMap').click(); });
  await page.waitForFunction(() => { const i = document.getElementById('introScreen'), c = document.getElementById('memoryMapTransition'); return i.classList.contains('intro-hidden') && c && !/is-(covering|waiting|revealing)/.test(c.className); }, null, { timeout: 300000 });
  await page.waitForTimeout(4000);
  // install run-time variants
  const ok = await page.evaluate(() => {
    const src = renderDemoPlaceList.toString();
    const head = "for (const [id, placeId] of [['btnIslandHoangSa', 'hoang-sa'], ['btnIslandTruongSa', 'truong-sa']]) {\n    const button = document.getElementById(id);\n    if (button) setAriaPressed(button, state.selectedPlaceId === placeId);\n  }\n";
    if (!src.includes(head)) return { err: 'head not found' };
    const tailAnchor = "    lastPlaceListMarkup4 = nextMarkup;\n  }\n}";
    if (!src.includes(tailAnchor)) return { err: 'tail not found' };
    const moved = src.replace(head, '').replace(tailAnchor, "    lastPlaceListMarkup4 = nextMarkup;\n  }\n" + head + "}");
    window.__rdpl0 = renderDemoPlaceList;
    window.__rdpl1 = (0, eval)('(' + moved + ')');
    window.__sis0 = Element.prototype.scrollIntoView;
    window.__sisDeferred = function (...a) { const el = this; requestAnimationFrame(() => window.__sis0.apply(el, a)); };
    window.__setVariant = v => { Element.prototype.scrollIntoView = v === 'v3' ? window.__sisDeferred : window.__sis0; };
    return { ok: true };
  });
  if (ok.err) { console.error('PATCH FAIL', ok.err); await browser.close(); process.exit(2); }
  const places = await page.evaluate(() => [...document.querySelectorAll('#demoPlaceList .place-card')].map(c => c.id.replace('placeCard-', '')));
  console.log(label, 'cards in list:', places.join(','));
  const ids = ['hn', 'hue', 'hcm'];
  const rows = [], order = ['v0', 'v3'];
  let k = 0;
  for (let r = 0; r < rounds; r++) {
    const seq = [...order]; if (r % 2) seq.reverse();
    for (const v of seq) {
      await page.evaluate(v => window.__setVariant(v), v);
      const sel = await page.evaluate(() => document.querySelector('#demoPlaceList .place-card.selected')?.id?.replace('placeCard-', ''));
      const nextId = ids[(ids.indexOf(sel) + 1 + (k++ % 2)) % ids.length];
      await page.waitForTimeout(2600); // let the previous camera flight settle
      const m0 = await metrics();
      const res = await page.evaluate(id => new Promise(resolve => {
        const row = document.querySelector('#placeCard-' + id + ' .place-compact-row');
        if (!row) return resolve({ err: 'no row ' + id });
        const S = window.__s; const t0 = performance.now(); S.loaf.length = 0; S.g.length = 0;
        row.click(); const handler = performance.now() - t0;
        setTimeout(() => {
          const gaps = S.g.filter(x => x[0] >= t0).map(x => x[1]);
          resolve({ id, handler, loaf: S.loaf.filter(x => x[0] >= t0).map(x => Math.round(x[1])), maxGap: Math.max(0, ...gaps), gaps: gaps.length });
        }, 1200);
      }), nextId);
      const m1 = await metrics();
      if (res.err) { console.log(res.err); continue; }
      rows.push({ v, round: r, id: res.id, handlerMs: +res.handler.toFixed(1), maxFrameGapMs: +res.maxGap.toFixed(1), loafMaxMs: Math.max(0, ...res.loaf), loafN: res.loaf.length, styleMs: Math.round((m1.RecalcStyleDuration - m0.RecalcStyleDuration) * 1000), layoutMs: Math.round((m1.LayoutDuration - m0.LayoutDuration) * 1000), styleCount: m1.RecalcStyleCount - m0.RecalcStyleCount, layoutCount: m1.LayoutCount - m0.LayoutCount });
    }
    console.log(`round ${r + 1}/${rounds} done`);
  }
  const sum = {};
  for (const v of order) { const R = rows.filter(x => x.v === v); sum[v] = {}; for (const f of ['handlerMs', 'maxFrameGapMs', 'loafMaxMs', 'styleMs', 'layoutMs', 'styleCount', 'layoutCount']) sum[v][f] = summarize(R.map(x => x[f])); }
  fs.writeFileSync(path.join(outDir, `ab-select-${label}.json`), JSON.stringify({ label, target, cpu, chrome: browser.version(), rounds, rows, sum }, null, 1));
  for (const f of ['handlerMs', 'maxFrameGapMs', 'loafMaxMs', 'styleMs', 'layoutMs', 'styleCount', 'layoutCount']) console.log(f.padEnd(14), order.map(v => `${v}: med=${sum[v][f].median} [q1=${sum[v][f].q1} q3=${sum[v][f].q3}] n=${sum[v][f].n}`).join('  |  '));
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
