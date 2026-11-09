// GD1 1.4: label cost during map gestures. Reads GoiVietLabelPerformance.inspect() (hits/misses) and a CPU profile per gesture.
// node tools/perf/profile-labels.cjs --target map-surroundings-preview-5.html --cpu 4
const { launch, BASE, fs, path, ROOT } = require('./lib.cjs');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const target = arg('target', 'map-surroundings-preview-5.html'), cpu = +arg('cpu', 4);
const FOCUS = ['measure', 'placeCountryLabels', 'paintLabels', 'drawLabel', 'ui', 'changed', 'stringify', 'JSON.stringify', 'renderMainScene', 'animateLoop', 'layoutProvinceLabels', 'placeProvinceLabels'];
(async () => {
  const b = await launch('real'); const ctx = await b.newContext({ viewport: { width: 1707, height: 1067 }, deviceScaleFactor: 1 }); const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 250 }); await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  await page.goto(BASE + target, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.GoiVietHomeIntro && !document.getElementById('btnHomeOpeningStart').disabled, null, { timeout: 600000 });
  await page.waitForTimeout(1200); await page.click('#btnHomeOpeningStart');
  await page.waitForFunction(() => document.getElementById('introScreen').dataset.homeOpening === 'complete', null, { timeout: 180000 }); await page.waitForTimeout(800);
  await page.evaluate(() => window.GoiVietMemoryChapter.begin()); await page.waitForTimeout(1500);
  for (let i = 0; i < 8; i++) { await page.mouse.move(800, 600); await page.mouse.wheel(0, 200); await page.waitForTimeout(100); }
  await page.evaluate(() => { document.getElementById('memoryOpenMap').scrollIntoView(); document.getElementById('memoryOpenMap').click(); });
  await page.waitForFunction(() => { const i = document.getElementById('introScreen'), c = document.getElementById('memoryMapTransition'); return i.classList.contains('intro-hidden') && c && !/is-(covering|waiting|revealing)/.test(c.className); }, null, { timeout: 240000 });
  await page.waitForTimeout(3000);
  const insp = () => page.evaluate(() => window.GoiVietLabelPerformance ? window.GoiVietLabelPerformance.inspect() : null);
  const cx = 614, cy = 587, out = {};
  const gestures = {
    drag: async () => { await page.mouse.move(cx, cy); await page.mouse.down(); for (let i = 1; i <= 40; i++) { await page.mouse.move(cx + i * 6, cy + i * 3); await page.waitForTimeout(16); } await page.mouse.up(); await page.waitForTimeout(800); },
    zoom: async () => { await page.mouse.move(cx, cy); for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, -240); await page.waitForTimeout(70); } await page.waitForTimeout(500); for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, 240); await page.waitForTimeout(70); } await page.waitForTimeout(600); },
    rotate: async () => { await page.mouse.move(cx, cy); await page.mouse.down({ button: 'right' }); for (let i = 1; i <= 30; i++) { await page.mouse.move(cx - i * 7, cy + i); await page.waitForTimeout(16); } await page.mouse.up({ button: 'right' }); await page.waitForTimeout(600); },
    fly: async () => { await page.evaluate(() => selectDemoPlace('hue')); await page.waitForTimeout(2500); }
  };
  for (const [name, fn] of Object.entries(gestures)) {
    const before = await insp(); await cdp.send('Profiler.start'); const t0 = Date.now(); await fn(); const wall = Date.now() - t0; const { profile } = await cdp.send('Profiler.stop'); const after = await insp();
    const nodes = new Map(profile.nodes.map(n => [n.id, n])), parent = new Map(); for (const n of profile.nodes) for (const c of n.children || []) parent.set(c, n.id);
    const self = new Map(); profile.samples.forEach((id, i) => self.set(id, (self.get(id) || 0) + (profile.timeDeltas[i] || 0)));
    const incl = new Map(); for (const [id, us] of self) { let c = id; while (c != null) { incl.set(c, (incl.get(c) || 0) + us); c = parent.get(c); } }
    let busy = 0; for (const [id, us] of self) if (nodes.get(id).callFrame.functionName !== '(idle)') busy += us;
    const fn2 = {}; const key = n => (n.callFrame.functionName || '(anon)') + ' @' + (n.callFrame.url || '').split('/').pop().split('?')[0] + ':' + n.callFrame.lineNumber;
    for (const n of profile.nodes) { const k = key(n); let a = parent.get(n.id), dup = false; while (a != null) { if (key(nodes.get(a)) === k) { dup = true; break; } a = parent.get(a); } const r = fn2[k] = fn2[k] || { incl: 0, self: 0 }; if (!dup) r.incl += incl.get(n.id) || 0; r.self += self.get(n.id) || 0; }
    const pick = Object.entries(fn2).filter(([k]) => /label|Label|legib|Legib|measure|stringify|placeCountry/.test(k) || FOCUS.some(f => k.startsWith(f + ' '))).sort((a, b) => b[1].incl - a[1].incl).slice(0, 10).map(([k, v]) => [k, Math.round(v.incl / 1000), Math.round(v.self / 1000)]);
    const d = (a, b, k) => a && b ? b[k] - a[k] : null;
    out[name] = { wallMs: wall, busyMs: Math.round(busy / 1000), labelPerf: { hits: d(before, after, 'hits'), misses: d(before, after, 'misses'), reads: d(before, after, 'reads'), revisionDelta: d(before, after, 'revision'), fontRevisionDelta: d(before, after, 'fontRevision'), cacheSize: after && after.metrics }, topLabelFns: pick };
    console.log(`## ${name} (x${cpu}): wall ${wall} ms, busy ${out[name].busyMs} ms; label cache hits=${out[name].labelPerf.hits} misses=${out[name].labelPerf.misses} reads=${out[name].labelPerf.reads} revisionΔ=${out[name].labelPerf.revisionDelta} fontRevΔ=${out[name].labelPerf.fontRevisionDelta} size=${out[name].labelPerf.cacheSize}`);
    for (const r of pick) console.log('   ', String(r[1]).padStart(5), 'incl', String(r[2]).padStart(5), 'self', r[0]);
  }
  fs.writeFileSync(path.join(ROOT, `tools/perf/results/gd1/labels-${target.replace('.html', '')}-x${cpu}.json`), JSON.stringify(out, null, 1));
  await b.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
