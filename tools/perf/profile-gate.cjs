// GD3 step 3: what does the main thread do between navigation start and "start button enabled" (gate ready)? CPU profile by script and function.
// node tools/perf/profile-gate.cjs --target map-surroundings-preview-5.html --cpu 4 --reps 3
const { launch, BASE, fs, path, ROOT, summarize } = require('./lib.cjs');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const target = arg('target', 'map-surroundings-preview-5.html'), cpu = +arg('cpu', 4), reps = +arg('reps', 3);
(async () => {
  const agg = { fn: {}, script: {}, runs: [] };
  for (let r = 0; r < reps; r++) {
    const b = await launch('real'); const ctx = await b.newContext({ viewport: { width: 1707, height: 1067 }, deviceScaleFactor: 1 }); const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
    await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 500 }); await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
    await page.addInitScript('(()=>{const f=()=>{const b=document.getElementById("btnHomeOpeningStart");if(b&&!b.disabled&&window.GoiVietHomeIntro){window.__gate=performance.now();return}requestAnimationFrame(f)};requestAnimationFrame(f)})();');
    await cdp.send('Profiler.start'); const t0 = Date.now();
    await page.goto(BASE + target, { waitUntil: 'commit', timeout: 600000 });
    await page.waitForFunction(() => window.__gate, null, { timeout: 600000 });
    const { profile } = await cdp.send('Profiler.stop'); const wall = Date.now() - t0; const gate = await page.evaluate(() => Math.round(window.__gate));
    const nodes = new Map(profile.nodes.map(n => [n.id, n])), parent = new Map(); for (const n of profile.nodes) for (const c of n.children || []) parent.set(c, n.id);
    const self = new Map(); profile.samples.forEach((id, i) => self.set(id, (self.get(id) || 0) + (profile.timeDeltas[i] || 0)));
    const incl = new Map(); for (const [id, us] of self) { let c = id; while (c != null) { incl.set(c, (incl.get(c) || 0) + us); c = parent.get(c); } }
    const key = n => (n.callFrame.functionName || '(anon)') + ' @' + (n.callFrame.url || '').split('/').pop().split('?')[0] + ':' + n.callFrame.lineNumber;
    let busy = 0, idle = 0; for (const [id, us] of self) { if (nodes.get(id).callFrame.functionName === '(idle)') idle += us; else busy += us; }
    const fn = {}; for (const n of profile.nodes) { const k = key(n); let a = parent.get(n.id), dup = false; while (a != null) { if (key(nodes.get(a)) === k) { dup = true; break; } a = parent.get(a); } const e = fn[k] = fn[k] || { incl: 0, self: 0 }; if (!dup) e.incl += incl.get(n.id) || 0; e.self += self.get(n.id) || 0; }
    const sc = {}; for (const [id, us] of self) { const n = nodes.get(id); if (n.callFrame.functionName === '(idle)') continue; const u = n.callFrame.url ? n.callFrame.url.split('/').pop().split('?')[0] : '(' + (n.callFrame.functionName || 'native') + ')'; sc[u] = (sc[u] || 0) + us; }
    for (const [k, v] of Object.entries(fn)) { const a = agg.fn[k] = agg.fn[k] || { incl: 0, self: 0 }; a.incl += v.incl; a.self += v.self; }
    for (const [k, v] of Object.entries(sc)) agg.script[k] = (agg.script[k] || 0) + v;
    agg.runs.push({ wall, gate, busyMs: Math.round(busy / 1000), idleMs: Math.round(idle / 1000) });
    await b.close();
  }
  const R = agg.runs, ms = us => Math.round(us / 1000 / reps);
  console.log(`# ${target} cpu x${cpu}: navigation -> gate ready x${reps}: gate (in-page) median ${summarize(R.map(x => x.gate)).median} ms, wall ${summarize(R.map(x => x.wall)).median} ms, main busy ${summarize(R.map(x => x.busyMs)).median} ms, idle ${summarize(R.map(x => x.idleMs)).median} ms`);
  console.log('-- by script (self ms per run)'); Object.entries(agg.script).sort((a, b) => b[1] - a[1]).slice(0, 16).forEach(([k, v]) => console.log(String(ms(v)).padStart(6), k));
  console.log('-- by function: inclusive / self ms per run (top 18 by inclusive)'); Object.entries(agg.fn).filter(([k]) => !/^\((root|program|idle|garbage)/.test(k)).sort((a, b) => b[1].incl - a[1].incl).slice(0, 18).forEach(([k, v]) => console.log(String(ms(v.incl)).padStart(6), String(ms(v.self)).padStart(6), k));
  fs.writeFileSync(path.join(ROOT, `tools/perf/results/gd4/gate-profile-x${cpu}.json`), JSON.stringify({ target, cpu, runs: R, script: Object.fromEntries(Object.entries(agg.script).map(([k, v]) => [k, ms(v)])), fn: Object.fromEntries(Object.entries(agg.fn).sort((a, b) => b[1].incl - a[1].incl).slice(0, 50).map(([k, v]) => [k, [ms(v.incl), ms(v.self)]])) }, null, 1));
})().catch(e => { console.error('FATAL', e); process.exit(1); });
