// GD3 step 1: where does the finished home screen spend main-thread time per frame? CPU profile (inclusive/self by function and by script) + frame stats.
// node tools/perf/profile-home.cjs --target map-surroundings-preview-5.html --cpu 4 --secs 6 --reps 2
const { launch, BASE, fs, path, ROOT, summarize } = require('./lib.cjs');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const target = arg('target', 'map-surroundings-preview-5.html'), cpu = +arg('cpu', 4), secs = +arg('secs', 6), reps = +arg('reps', 2), gpu = arg('gpu', 'real');
const variant = arg('variant', 'direct'); // r6: serve renderer-6 in place of renderer-5; r5pass: serve renderer-5 through the same route (control)
(async () => {
  const agg = { fn: {}, script: {}, runs: [] };
  for (let r = 0; r < reps; r++) {
    const b = await launch(gpu); const ctx = await b.newContext({ viewport: { width: 1707, height: 1067 }, deviceScaleFactor: 1 }); const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
    await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 500 }); await cdp.send('Performance.enable'); await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
    if (variant === 'r6' || variant === 'r5pass') { const body = fs.readFileSync(path.join(ROOT, variant === 'r6' ? 'assets/goi-viet/homepage-layered-renderer-6.js' : 'assets/goi-viet/homepage-layered-renderer-5.js'), 'utf8'); await page.route('**/homepage-layered-renderer-5.js*', route => route.fulfill({ status: 200, contentType: 'text/javascript', body })); }
    await page.addInitScript('window.__g=[];let l=0;const f=t=>{if(window.__on&&l)window.__g.push(t-l);l=t;requestAnimationFrame(f)};requestAnimationFrame(f);');
    await page.goto(BASE + target, { waitUntil: 'load', timeout: 600000 });
    await page.waitForFunction(() => window.GoiVietHomeIntro && !document.getElementById('btnHomeOpeningStart').disabled, null, { timeout: 600000 });
    await page.waitForTimeout(1200); await page.click('#btnHomeOpeningStart');
    await page.waitForFunction(() => document.getElementById('introScreen').dataset.homeOpening === 'complete', null, { timeout: 240000 });
    await page.waitForTimeout(2500); // let the map prewarm start/settle? no: we want the steady home state the audience sees
    const m = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
    await page.evaluate(() => { window.__g = []; window.__on = true; }); const m0 = await m(); await cdp.send('Profiler.start'); const t0 = Date.now();
    await page.waitForTimeout(secs * 1000);
    const { profile } = await cdp.send('Profiler.stop'); const wall = Date.now() - t0, m1 = await m();
    const g = await page.evaluate(() => { window.__on = false; return window.__g; }); const sorted = [...g].sort((a, b) => a - b), sum = g.reduce((a, b) => a + b, 0);
    const pw = await page.evaluate(() => window.GoiVietMapPrewarm3 && window.GoiVietMapPrewarm3.inspect());
    const nodes = new Map(profile.nodes.map(n => [n.id, n])), parent = new Map(); for (const n of profile.nodes) for (const c of n.children || []) parent.set(c, n.id);
    const self = new Map(); profile.samples.forEach((id, i) => self.set(id, (self.get(id) || 0) + (profile.timeDeltas[i] || 0)));
    const key = n => (n.callFrame.functionName || '(anon)') + ' @' + (n.callFrame.url || '').split('/').pop().split('?')[0] + ':' + n.callFrame.lineNumber;
    const incl = new Map(); for (const [id, us] of self) { let c = id; while (c != null) { incl.set(c, (incl.get(c) || 0) + us); c = parent.get(c); } }
    let busy = 0, idle = 0; for (const [id, us] of self) { if (nodes.get(id).callFrame.functionName === '(idle)') idle += us; else busy += us; }
    const fn = {}; for (const n of profile.nodes) { const k = key(n); let a = parent.get(n.id), dup = false; while (a != null) { if (key(nodes.get(a)) === k) { dup = true; break; } a = parent.get(a); } const e = fn[k] = fn[k] || { incl: 0, self: 0 }; if (!dup) e.incl += incl.get(n.id) || 0; e.self += self.get(n.id) || 0; }
    const sc = {}; for (const [id, us] of self) { const n = nodes.get(id); if (n.callFrame.functionName === '(idle)') continue; const u = n.callFrame.url ? n.callFrame.url.split('/').pop().split('?')[0] : '(' + (n.callFrame.functionName || 'native') + ')'; sc[u] = (sc[u] || 0) + us; }
    for (const [k, v] of Object.entries(fn)) { const a = agg.fn[k] = agg.fn[k] || { incl: 0, self: 0 }; a.incl += v.incl; a.self += v.self; }
    for (const [k, v] of Object.entries(sc)) agg.script[k] = (agg.script[k] || 0) + v;
    agg.runs.push({ wall, fps: +(1000 / (sum / g.length)).toFixed(1), p95: +sorted[Math.floor(sorted.length * .95)].toFixed(1), frames: g.length, busyMs: Math.round(busy / 1000), idleMs: Math.round(idle / 1000), taskMs: Math.round((m1.TaskDuration - m0.TaskDuration) * 1000), scriptMs: Math.round((m1.ScriptDuration - m0.ScriptDuration) * 1000), styleMs: Math.round((m1.RecalcStyleDuration - m0.RecalcStyleDuration) * 1000), layoutMs: Math.round((m1.LayoutDuration - m0.LayoutDuration) * 1000), prewarm: pw });
    await b.close();
  }
  const R = agg.runs; const med = k => summarize(R.map(x => x[k])).median;
  const ms = us => Math.round(us / 1000 / reps);
  console.log(`# ${target} cpu x${cpu} ${gpu}: home idle ${secs}s x${reps}: fps ${med('fps')} (p95 frame ${med('p95')} ms), main busy ${med('busyMs')} of ${R[0].wall} ms, task ${med('taskMs')}, script ${med('scriptMs')}, style ${med('styleMs')}, layout ${med('layoutMs')}; prewarm ${JSON.stringify(R[0].prewarm)}`);
  console.log('-- by script (self ms per run)'); Object.entries(agg.script).sort((a, b) => b[1] - a[1]).slice(0, 14).forEach(([k, v]) => console.log(String(ms(v)).padStart(6), k));
  console.log('-- by function: inclusive / self ms per run (top 22 by inclusive)'); Object.entries(agg.fn).filter(([k]) => !/^\((root|program|idle|garbage)/.test(k)).sort((a, b) => b[1].incl - a[1].incl).slice(0, 22).forEach(([k, v]) => console.log(String(ms(v.incl)).padStart(6), String(ms(v.self)).padStart(6), k));
  console.log('-- by function: top self'); Object.entries(agg.fn).sort((a, b) => b[1].self - a[1].self).slice(0, 12).forEach(([k, v]) => console.log(String(ms(v.self)).padStart(6), k));
  fs.writeFileSync(path.join(ROOT, `tools/perf/results/gd4/home-profile-x${cpu}-${gpu}.json`), JSON.stringify({ target, cpu, gpu, secs, runs: R, script: Object.fromEntries(Object.entries(agg.script).map(([k, v]) => [k, ms(v)])), fn: Object.fromEntries(Object.entries(agg.fn).sort((a, b) => b[1].incl - a[1].incl).slice(0, 60).map(([k, v]) => [k, [ms(v.incl), ms(v.self)]])) }, null, 1));
})().catch(e => { console.error('FATAL', e); process.exit(1); });
