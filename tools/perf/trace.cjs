// Chrome trace attribution per segment (Main / Compositor / Raster workers / GPU) with SELF time and forced-layout detection.
// node tools/perf/trace.cjs --target map-surroundings-preview-4.html --cpu 4 --gpu real --label p4-x4
// Output: tools/perf/results/gd0/trace-<label>.json (+ prints a table). Raw traces go to the OS temp dir and are not kept.
// NOTE: tracing itself adds overhead; use these numbers for attribution (where time goes), not as performance baselines.
const { fs, path, os, launch, BASE, ROOT } = require('./lib.cjs');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const target = arg('target', 'map-surroundings-preview-4.html'), cpu = +arg('cpu', 1), gpu = arg('gpu', 'real'), label = arg('label', 'p4-x' + cpu);
const CATS = ['-*', 'devtools.timeline', 'disabled-by-default-devtools.timeline', 'v8', 'v8.execute', 'cc', 'gpu', 'viz', 'toplevel', 'blink', 'disabled-by-default-devtools.timeline.frame'];
const JS_PARENTS = new Set(['FunctionCall', 'v8.callFunction', 'EvaluateScript', 'v8.run', 'v8.compile', 'FireIdleCallback', 'TimerFire', 'FireAnimationFrame']);
const LAYOUT_NAMES = new Set(['Layout', 'UpdateLayoutTree', 'RecalcStyle']);
const GC_RE = /^(MinorGC|MajorGC|V8\.GC)/;

function analyze(events) {
  const procName = {}, threadName = {};
  for (const e of events) if (e.ph === 'M') { if (e.name === 'process_name') procName[e.pid] = e.args.name; if (e.name === 'thread_name') threadName[e.pid + ':' + e.tid] = e.args.name; }
  const byThread = new Map();
  for (const e of events) {
    if (e.ph !== 'X' || e.dur == null) continue;
    const k = e.pid + ':' + e.tid; if (!byThread.has(k)) byThread.set(k, []); byThread.get(k).push(e);
  }
  const threads = [];
  for (const [k, list] of byThread) {
    list.sort((a, b) => a.ts - b.ts || b.dur - a.dur);
    const stack = [], self = new Map(), fnSelf = new Map(), forced = { layoutUs: 0, styleUs: 0, n: 0 }, frame = { layoutUs: 0, styleUs: 0 };
    let topBusy = 0, maxTask = 0, tasksOver50 = 0, first = Infinity, last = 0;
    for (const e of list) {
      while (stack.length && stack[stack.length - 1].end <= e.ts) closeTop(stack, self);
      const node = { e, end: e.ts + e.dur, child: 0, inJs: stack.some(s => JS_PARENTS.has(s.e.name)) };
      if (stack.length) stack[stack.length - 1].child += e.dur; else { topBusy += e.dur; if (e.dur > maxTask) maxTask = e.dur; if (e.dur > 50000) tasksOver50++; }
      first = Math.min(first, e.ts); last = Math.max(last, e.ts + e.dur);
      stack.push(node);
    }
    while (stack.length) closeTop(stack, self);
    function closeTop(st, selfMap) {
      const n = st.pop(), s = Math.max(0, n.e.dur - n.child);
      const name = n.e.name; selfMap.set(name, (selfMap.get(name) || 0) + s);
      if (name === 'FunctionCall' || name === 'EvaluateScript' || name === 'v8.callFunction') { const d = (n.e.args && n.e.args.data) || {}; const k = (d.functionName || '(anon)') + ' @' + String(d.url || '').split('/').pop().split('?')[0] + ':' + (d.lineNumber ?? ''); fnSelf.set(k, (fnSelf.get(k) || 0) + s); }
      if (LAYOUT_NAMES.has(name)) { const dst = n.inJs ? forced : frame; if (name === 'Layout') dst.layoutUs += n.e.dur; else dst.styleUs += n.e.dur; if (n.inJs) forced.n++; }
    }
    const top = [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14).map(([n, us]) => [n, Math.round(us / 1000)]);
    const topFn = [...fnSelf.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([n, us]) => [n, Math.round(us / 1000)]);
    const gcMs = Math.round([...self.entries()].filter(([n]) => GC_RE.test(n)).reduce((a, [, us]) => a + us, 0) / 1000);
    threads.push({ proc: procName[k.split(':')[0]] || '?', name: threadName[k] || '?', events: list.length, busyMs: Math.round(topBusy / 1000), spanMs: first < Infinity ? Math.round((last - first) / 1000) : 0, maxTaskMs: Math.round(maxTask / 1000), tasksOver50: tasksOver50, gcMs, topFn, forcedLayoutMs: Math.round(forced.layoutUs / 1000), forcedStyleMs: Math.round(forced.styleUs / 1000), forcedCount: forced.n, frameLayoutMs: Math.round(frame.layoutUs / 1000), frameStyleMs: Math.round(frame.styleUs / 1000), topSelf: top });
  }
  const main = threads.filter(t => t.name === 'CrRendererMain').sort((a, b) => b.busyMs - a.busyMs)[0] || null;
  const sumBy = re => threads.filter(t => re.test(t.name)).reduce((a, t) => a + t.busyMs, 0);
  return {
    main, compositorMs: sumBy(/^Compositor$/), rasterWorkersMs: sumBy(/CompositorTileWorker/), gpuMainMs: threads.filter(t => /GPU/i.test(t.proc) && t.name === 'CrGpuMain').reduce((a, t) => a + t.busyMs, 0), vizMs: sumBy(/VizCompositorThread/),
    selectedThreads: threads.filter(t => t.busyMs > 20).sort((a, b) => b.busyMs - a.busyMs).slice(0, 10).map(({ proc, name, busyMs, maxTaskMs, tasksOver50, gcMs }) => ({ proc, name, busyMs, maxTaskMs, tasksOver50, gcMs }))
  };
}
(async () => {
  const browser = await launch(gpu, ['--enable-precise-memory-info']);
  const ctx = await browser.newContext({ viewport: { width: 1707, height: 1067 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  const out = { label, target, cpu, gpu, chrome: browser.version(), segments: {} };
  const tmp = path.join(os.tmpdir(), 'perf-trace'); fs.mkdirSync(tmp, { recursive: true });
  const seg = async (name, fn) => {
    const file = path.join(tmp, `${label}-${name}.json`);
    await browser.startTracing(page, { path: file, categories: CATS });
    const w0 = Date.now(); let err = null; try { await fn(); } catch (e) { err = String(e).slice(0, 160); }
    const wall = Date.now() - w0; await browser.stopTracing();
    const ev = JSON.parse(fs.readFileSync(file, 'utf8')).traceEvents;
    const a = analyze(ev); a.wallMs = wall; a.err = err; a.eventCount = ev.length; out.segments[name] = a; fs.unlinkSync(file);
    const m = a.main;
    console.log(`${label} ${name}: wall=${wall}ms main.busy=${m?.busyMs} self-top=${m?.topSelf.slice(0, 5).map(x => x.join(':')).join(', ')} | forcedLayout=${m?.forcedLayoutMs}ms(+style ${m?.forcedStyleMs}, n=${m?.forcedCount}) frameLayout=${m?.frameLayoutMs}ms gc=${m?.gcMs}ms maxTask=${m?.maxTaskMs}ms | compositor=${a.compositorMs} raster=${a.rasterWorkersMs} gpu=${a.gpuMainMs}${err ? ' ERR ' + err : ''}`);
  };
  await page.goto(BASE + target, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.GoiVietHomeIntro && !document.getElementById('btnHomeOpeningStart').disabled, null, { timeout: 600000 });
  await page.waitForTimeout(1500);
  await seg('opening', async () => { await page.click('#btnHomeOpeningStart'); await page.waitForFunction(() => document.getElementById('introScreen').dataset.homeOpening === 'complete', null, { timeout: 180000 }); });
  await seg('home-idle', async () => { await page.waitForTimeout(4000); });
  await page.evaluate(() => window.GoiVietMemoryChapter.begin()); await page.waitForTimeout(1500);
  for (let i = 0; i < 10; i++) { await page.mouse.move(800, 600); await page.mouse.wheel(0, 200); await page.waitForTimeout(120); }
  await page.waitForTimeout(600);
  await seg('enter-map', async () => {
    await page.evaluate(() => document.getElementById('memoryOpenMap').click());
    await page.waitForFunction(() => { const i = document.getElementById('introScreen'), c = document.getElementById('memoryMapTransition'); return i.classList.contains('intro-hidden') && c && !/is-(covering|waiting|revealing)/.test(c.className); }, null, { timeout: 240000 });
    await page.waitForTimeout(1000);
  });
  await seg('map-idle', async () => { await page.waitForTimeout(3000); });
  const cx = 614, cy = 587;
  await seg('map-drag', async () => { await page.mouse.move(cx, cy); await page.mouse.down(); for (let i = 1; i <= 40; i++) { await page.mouse.move(cx + i * 6, cy + i * 3); await page.waitForTimeout(16); } await page.mouse.up(); await page.waitForTimeout(800); });
  await seg('map-rotate', async () => { await page.mouse.move(cx, cy); await page.mouse.down({ button: 'right' }); for (let i = 1; i <= 30; i++) { await page.mouse.move(cx - i * 7, cy + i); await page.waitForTimeout(16); } await page.mouse.up({ button: 'right' }); await page.waitForTimeout(600); });
  await seg('map-fly-hue', async () => { await page.evaluate(() => selectDemoPlace('hue')); await page.waitForTimeout(2500); });
  fs.writeFileSync(path.join(ROOT, `tools/perf/results/gd0/trace-${label}.json`), JSON.stringify(out, null, 1));
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
