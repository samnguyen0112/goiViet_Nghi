// GD6: leak check. After GC, JS heap / DOM nodes / event listeners / documents must not grow with repeated map exit-enter and place selection.
// node tools/perf/verify-gd6-leak.cjs [--targets map-surroundings-preview-4.html,map-surroundings-preview-5.html] [--cycles 12] [--cpu 1]
const { fs, path, launch, BASE, ROOT } = require('./lib.cjs');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const targets = arg('targets', 'map-surroundings-preview-4.html,map-surroundings-preview-5.html').split(',');
const cycles = +arg('cycles', 12), cpu = +arg('cpu', 1);
const outFile = path.join(ROOT, 'tools/perf/results/gd6', arg('out', 'leak.json'));

async function run(target) {
  const b = await launch('real', ['--enable-precise-memory-info']); const ctx = await b.newContext({ viewport: { width: 1707, height: 1067 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
  await cdp.send('Performance.enable'); await cdp.send('HeapProfiler.enable');
  if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  const errors = []; page.on('pageerror', e => errors.push(String(e.message).slice(0, 160)));
  const wait = ms => page.waitForTimeout(ms);
  const sample = async () => {
    for (let i = 0; i < 3; i++) { await cdp.send('HeapProfiler.collectGarbage'); await wait(250); }
    const m = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
    return { heapMB: +(m.JSHeapUsedSize / 1048576).toFixed(2), nodes: m.Nodes, listeners: m.JSEventListeners, documents: m.Documents, frames: m.Frames };
  };
  await page.goto(BASE + target, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.GoiVietHomeIntro && document.getElementById('btnHomeOpeningStart') && !document.getElementById('btnHomeOpeningStart').disabled, null, { timeout: 600000 }); await wait(800);
  await page.click('#btnHomeOpeningStart');
  await page.waitForFunction(() => document.getElementById('introScreen').dataset.homeOpening === 'complete', null, { timeout: 180000 }); await wait(800);
  await page.evaluate(() => window.GoiVietMemoryChapter.begin()); await wait(1200);
  for (let i = 0; i < 8; i++) { await page.mouse.move(800, 600); await page.mouse.wheel(0, 200); await wait(100); }
  await page.evaluate(() => { document.getElementById('memoryOpenMap').scrollIntoView(); document.getElementById('memoryOpenMap').click(); });
  await page.waitForFunction(() => { const i = document.getElementById('introScreen'), c = document.getElementById('memoryMapTransition'); return i.classList.contains('intro-hidden') && c && !/is-(covering|waiting|revealing)/.test(c.className); }, null, { timeout: 240000 });
  await wait(2500);
  await page.click('#tabScopeAll'); await wait(300);
  const ids = await page.evaluate(() => Array.from(document.querySelectorAll('#demoPlaceList [id^="placeCard-"]')).map(e => e.id.replace('placeCard-', '')));

  const R = { target, errors, series: {} };
  // A) exit the map to the intro and come back (the Escape path / Back button), with a pan/zoom gesture in between
  R.series.baseline = await sample();
  R.series.exitEnter = [];
  for (let i = 0; i < cycles; i++) {
    await page.evaluate(() => openIntroModal()); await wait(500);
    await page.evaluate(() => closeIntroModal()); await wait(500);
    await page.mouse.move(850, 520); await page.mouse.down(); await page.mouse.move(920, 560, { steps: 6 }); await page.mouse.up(); await wait(250);
    if (i % 3 === 2) R.series.exitEnter.push({ cycle: i + 1, ...(await sample()) });
  }
  // B) place selection churn (list rebuild + deferred scroll + journey bar)
  R.series.afterExitEnter = await sample();
  R.series.select = [];
  for (let i = 0; i < cycles * 3; i++) {
    await page.evaluate(id => selectDemoPlace(id), ids[(i * 5) % ids.length]); await wait(450);
    if (i % 9 === 8) R.series.select.push({ cycle: i + 1, ...(await sample()) });
  }
  R.series.final = await sample();
  await b.close(); return R;
}
(async () => {
  const out = [];
  for (const t of targets) out.push(await run(t));
  fs.mkdirSync(path.dirname(outFile), { recursive: true }); fs.writeFileSync(outFile, JSON.stringify(out, null, 1));
  for (const r of out) {
    const s = r.series, d = (k) => +(s.final[k] - s.baseline[k]).toFixed(2);
    console.log(`${r.target}  errors=${r.errors.length}`);
    console.log('  baseline', JSON.stringify(s.baseline)); console.log('  afterExitEnter', JSON.stringify(s.afterExitEnter)); console.log('  final   ', JSON.stringify(s.final));
    console.log(`  growth: heap ${d('heapMB')} MB, nodes ${d('nodes')}, listeners ${d('listeners')}, documents ${d('documents')}`);
    console.log('  exitEnter series heap:', s.exitEnter.map(x => x.heapMB).join(' → '), '| nodes:', s.exitEnter.map(x => x.nodes).join(' → '));
  }
})();
