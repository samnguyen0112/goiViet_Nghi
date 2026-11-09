// GD4 acceptance for the deferred panel scroll in selectDemoPlace().
//  1) function: after selecting a place far down a long list, the card ends up inside the list's visible area, with and without reduced motion;
//     a re-render of the list between the click and the next frame still scrolls the CURRENT selected card; no page errors.
//  2) perf: click-handler time, interleaved browsers  new (file as edited)  vs  orig (pre-GD4 copy served at the same URL).
// node tools/perf/verify-gd4-select.cjs --cpu 4 --pairs 3 --clicks 6
const { fs, path, launch, BASE, ROOT, summarize } = require('./lib.cjs');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const cpu = +arg('cpu', 4), pairs = +arg('pairs', 3), clicks = +arg('clicks', 6), gpu = arg('gpu', 'real');
const TARGET = 'map-surroundings-preview-5.html';
const ORIG = fs.readFileSync(path.join(ROOT, 'tools/perf/results/gd4-map/preview-5-before-gd4.html'), 'utf8');
const outDir = path.join(ROOT, 'tools/perf/results/gd4-map');

async function session(variant, functional) {
  const browser = await launch(gpu, []);
  const ctx = await browser.newContext({ viewport: { width: 1707, height: 1067 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
  const errors = []; page.on('pageerror', e => errors.push(String(e).slice(0, 200)));
  if (variant === 'orig') await page.route('**/' + TARGET + '*', r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: ORIG }));
  await cdp.send('Network.enable'); await cdp.send('Performance.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  await page.goto(BASE + TARGET, { waitUntil: 'load', timeout: 600000 });
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
  const res = { variant, errors };
  if (functional) {
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    const inView = () => page.evaluate(() => {
      const list = document.getElementById('demoPlaceList'); const sel = list.querySelector('.place-card.selected'); if (!sel) return { err: 'no selected card' };
      // the scrollable ancestor that actually clips the list
      let sc = list; while (sc && sc !== document.body && !(sc.scrollHeight > sc.clientHeight + 2 && /(auto|scroll)/.test(getComputedStyle(sc).overflowY))) sc = sc.parentElement;
      const r = sel.getBoundingClientRect(), c = (sc && sc !== document.body ? sc : document.documentElement).getBoundingClientRect();
      const vh = sc && sc !== document.body ? c : { top: 0, bottom: innerHeight };
      return { id: sel.id, scrolls: !!(sc && sc !== document.body), top: Math.round(r.top), bottom: Math.round(r.bottom), viewTop: Math.round(vh.top), viewBottom: Math.round(vh.bottom), visible: r.top >= vh.top - 2 && r.top < vh.bottom - 20 };
    });
    // long list: all places
    await page.evaluate(() => { state.placeScope = 'all'; renderDemoPlaceList(); });
    const ids = await page.evaluate(() => [...document.querySelectorAll('#demoPlaceList .place-card')].map(c => c.id.replace('placeCard-', '')));
    res.listLength = ids.length;
    const far = ids[ids.length - 1], mid = ids[Math.floor(ids.length / 2)];
    for (const [name, id, reduced] of [['far-smooth', far, false], ['mid-smooth', mid, false], ['far-reduced', ids[1], true]]) {
      await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' }); await page.waitForTimeout(300);
      await page.evaluate(id => { selectDemoPlace(id); }, id); await page.waitForTimeout(2200);
      res[name] = { requested: id, ...(await inView()) };
    }
    // re-render between the click and the next frame: the CURRENT selection must still be scrolled to
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.evaluate(id => { selectDemoPlace(id); renderDemoPlaceList(); }, far); await page.waitForTimeout(2200);
    res['rerender-between'] = { requested: far, ...(await inView()) };
    res.synchronousCallersOk = await page.evaluate(() => { selectDemoPlace('hue'); return Boolean(document.querySelector('#placeCard-hue.selected')) && state.selectedPlaceId === 'hue'; });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
    await page.evaluate(() => { state.placeScope = 'featured'; renderDemoPlaceList(); });
    await page.waitForTimeout(1500);
  }
  // perf: click the cards in turn and time the handler
  const ids = ['hn', 'hue', 'hcm']; const handler = [], styleMs = [], layouts = [];
  const metrics = async () => { const m = await cdp.send('Performance.getMetrics'); const o = {}; m.metrics.forEach(x => o[x.name] = x.value); return o; };
  for (let k = 0; k < clicks; k++) {
    await page.waitForTimeout(2600);
    const sel = await page.evaluate(() => document.querySelector('#demoPlaceList .place-card.selected')?.id?.replace('placeCard-', ''));
    const id = ids[(ids.indexOf(sel) + 1 + (k % 2)) % ids.length];
    const m0 = await metrics();
    const ms = await page.evaluate(id => { const row = document.querySelector('#placeCard-' + id + ' .place-compact-row'); if (!row) return null; const t = performance.now(); row.click(); return performance.now() - t; }, id);
    await page.waitForTimeout(1000); const m1 = await metrics();
    if (ms == null) console.log('  no row for', id, 'selected=', sel, 'cards=', await page.evaluate(() => [...document.querySelectorAll('#demoPlaceList .place-card')].map(c => c.id + (c.classList.contains('selected') ? '*' : '') + (c.querySelector('.place-compact-row') ? '' : '(no-row)')).join(',')));
    if (ms != null) { handler.push(ms); styleMs.push((m1.RecalcStyleDuration - m0.RecalcStyleDuration) * 1000); layouts.push(m1.LayoutCount - m0.LayoutCount); }
  }
  res.handler = handler; res.styleMs = styleMs; res.layouts = layouts;
  await browser.close(); return res;
}
(async () => {
  const all = { cpu, pairs, clicks, new: [], orig: [] }; let functional = null;
  for (let p = 0; p < pairs; p++) {
    for (const v of (p % 2 ? ['orig', 'new'] : ['new', 'orig'])) {
      const r = await session(v, v === 'new' && p === 0); all[v].push(r); if (!r.handler.length) { console.log('EMPTY handler sample for', v, JSON.stringify({ errors: r.errors, listLength: r.listLength })); continue; }
      if (r.listLength) functional = r;
      console.log(`pair ${p + 1}/${pairs} ${v}: handler med=${summarize(r.handler).median}ms  style med=${summarize(r.styleMs).median}ms  layouts med=${summarize(r.layouts).median}  errors=${r.errors.length}`);
    }
  }
  const agg = v => ({ handlerMs: summarize(all[v].flatMap(r => r.handler)), styleMs: summarize(all[v].flatMap(r => r.styleMs)), layouts: summarize(all[v].flatMap(r => r.layouts)), errors: all[v].flatMap(r => r.errors) });
  all.summary = { new: agg('new'), orig: agg('orig') }; all.functional = functional && Object.fromEntries(Object.entries(functional).filter(([k]) => !['handler', 'styleMs', 'layouts'].includes(k)));
  fs.writeFileSync(path.join(outDir, `verify-gd4-select-x${cpu}.json`), JSON.stringify(all, null, 1));
  console.log('\nFUNCTIONAL (new file):', JSON.stringify(all.functional, null, 1));
  for (const f of ['handlerMs', 'styleMs', 'layouts']) console.log(f.padEnd(10), 'orig med=' + all.summary.orig[f].median + ' [' + all.summary.orig[f].q1 + '–' + all.summary.orig[f].q3 + ']', ' new med=' + all.summary.new[f].median + ' [' + all.summary.new[f].q1 + '–' + all.summary.new[f].q3 + ']', ' n=' + all.summary.new[f].n);
  console.log('page errors new/orig:', all.summary.new.errors.length, all.summary.orig.errors.length);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
