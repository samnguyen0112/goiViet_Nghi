// GD4: attribute SYNCHRONOUS (forced) style/layout work during map interaction to the JS line that triggered it.
// Uses Chrome trace category disabled-by-default-devtools.timeline.stack (UpdateLayoutTree/Layout events carry the JS stack when sync).
// node tools/perf/trace-forced.cjs --target map-surroundings-preview-5.html --cpu 4 --label p5-x4
const { fs, path, os, launch, BASE, ROOT } = require('./lib.cjs');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const target = arg('target', 'map-surroundings-preview-5.html'), cpu = +arg('cpu', 1), gpu = arg('gpu', 'real'), label = arg('label', 'p5-x' + cpu);
const only = arg('only', '');
const outDir = path.join(ROOT, 'tools/perf/results/gd4-map'); fs.mkdirSync(outDir, { recursive: true });
const CATS = ['-*', 'devtools.timeline', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.stack', 'v8'];
const frameKey = f => (f.functionName || '(anon)') + ' @' + String(f.url || '').split('/').pop().split('?')[0] + ':' + (f.lineNumber + 1);
function analyze(events) {
  const main = new Map();
  for (const e of events) if (e.ph === 'M' && e.name === 'thread_name' && e.args.name === 'CrRendererMain') main.set(e.pid + ':' + e.tid, 1);
  const out = new Map(); let total = { n: 0, ms: 0 }, withStack = { n: 0, ms: 0 };
  for (const e of events) {
    if (e.ph !== 'X' || !main.has(e.pid + ':' + e.tid)) continue;
    if (e.name !== 'UpdateLayoutTree' && e.name !== 'Layout') continue;
    const ms = e.dur / 1000; total.n++; total.ms += ms;
    const st = e.args?.beginData?.stackTrace || e.args?.stackTrace || e.args?.data?.stackTrace; // Layout keeps it on its begin data
    if (!st || !st.length) continue;
    withStack.n++; withStack.ms += ms;
    const k = e.name + ' <= ' + st.slice(0, 3).map(frameKey).join(' < ');
    const o = out.get(k) || { n: 0, ms: 0, max: 0, elements: 0 }; o.n++; o.ms += ms; o.max = Math.max(o.max, ms); o.elements += e.args?.elementCount || e.args?.beginData?.elementCount || 0; out.set(k, o);
  }
  return { total: { n: total.n, ms: +total.ms.toFixed(1) }, withStack: { n: withStack.n, ms: +withStack.ms.toFixed(1) }, top: [...out.entries()].sort((a, b) => b[1].ms - a[1].ms).slice(0, 12).map(([k, v]) => ({ k, n: v.n, ms: +v.ms.toFixed(1), max: +v.max.toFixed(1) })) };
}
(async () => {
  const browser = await launch(gpu, ['--enable-precise-memory-info']);
  const ctx = await browser.newContext({ viewport: { width: 1707, height: 1067 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  const out = { label, target, cpu, chrome: browser.version(), scenarios: {} };
  const tmp = path.join(os.tmpdir(), 'perf-trace-gd4'); fs.mkdirSync(tmp, { recursive: true });
  const seg = async (name, fn) => {
    if (only && !only.split(',').includes(name)) { await fn(); return; }
    const file = path.join(tmp, `${label}-${name}.json`);
    await browser.startTracing(page, { path: file, categories: CATS });
    let err = null; try { await fn(); } catch (e) { err = String(e).slice(0, 160); }
    await browser.stopTracing();
    const ev = JSON.parse(fs.readFileSync(file, 'utf8')).traceEvents; fs.unlinkSync(file);
    out.scenarios[name] = { err, ...analyze(ev) };
    const s = out.scenarios[name];
    console.log(`${label} ${name}: style+layout events=${s.total.n}/${s.total.ms}ms; with JS stack=${s.withStack.n}/${s.withStack.ms}ms`);
    s.top.slice(0, 4).forEach(t => console.log(`   ${String(t.ms).padStart(7)}ms n=${String(t.n).padStart(3)} max=${t.max}  ${t.k.slice(0, 200)}`));
  };
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
  const cx = 614, cy = 587;
  await seg('drag-pan', async () => { await page.mouse.move(cx, cy); await page.mouse.down(); for (let i = 1; i <= 40; i++) { await page.mouse.move(cx + i * 6, cy + i * 3); await page.waitForTimeout(16); } await page.mouse.up(); await page.waitForTimeout(1000); });
  await seg('wheel-zoom', async () => { await page.mouse.move(cx, cy); for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, -240); await page.waitForTimeout(70); } await page.waitForTimeout(600); for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, 240); await page.waitForTimeout(70); } await page.waitForTimeout(800); });
  await seg('rotate', async () => { await page.mouse.move(cx, cy); await page.mouse.down({ button: 'right' }); for (let i = 1; i <= 30; i++) { await page.mouse.move(cx - i * 7, cy + i); await page.waitForTimeout(16); } await page.mouse.up({ button: 'right' }); await page.waitForTimeout(700); });
  await seg('fly-hue-api', async () => { await page.evaluate(() => selectDemoPlace('hue')); await page.waitForTimeout(2500); });
  await seg('panel-click-place', async () => {
    const id = await page.evaluate(() => { const r = [...document.querySelectorAll('#demoPlaceList .place-compact-row')].find(x => !/hue/.test(x.closest('.place-card')?.id || '')); return r ? r.closest('.place-card').id : null; });
    if (id) await page.click('#' + id + ' .place-compact-row', { timeout: 15000 }); await page.waitForTimeout(2500);
  });
  fs.writeFileSync(path.join(outDir, `forced-${label}.json`), JSON.stringify(out, null, 1));
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
