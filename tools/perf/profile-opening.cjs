// CPU self-time of selected functions during the opening animation. node tools/perf/profile-opening.cjs --targets a.html,b.html --cpu 4 --reps 3
const { launch, BASE } = require('./lib.cjs');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const targets = arg('targets', 'map-surroundings-preview-4.html,map-surroundings-preview-5.html').split(','), cpu = +arg('cpu', 4), reps = +arg('reps', 3);
const WATCH = ['drawAtmosphere', 'putImageData', 'drawImage', 'tick', 'render', 'draw'];
(async () => {
  const res = {};
  for (let r = 0; r < reps; r++) for (const t of targets) {
    const b = await launch('real'); const ctx = await b.newContext({ viewport: { width: 1707, height: 1067 }, deviceScaleFactor: 1 }); const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
    await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 250 }); await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
    await page.goto(BASE + t, { waitUntil: 'load', timeout: 600000 });
    await page.waitForFunction(() => window.GoiVietHomeIntro && !document.getElementById('btnHomeOpeningStart').disabled, null, { timeout: 600000 });
    await page.waitForTimeout(1200);
    await cdp.send('Profiler.start'); const t0 = Date.now();
    await page.click('#btnHomeOpeningStart');
    await page.waitForFunction(() => document.getElementById('introScreen').dataset.homeOpening === 'complete', null, { timeout: 180000 });
    const wall = Date.now() - t0; const { profile } = await cdp.send('Profiler.stop');
    const self = new Map(); profile.samples.forEach((id, i) => self.set(id, (self.get(id) || 0) + (profile.timeDeltas[i] || 0)));
    const byFn = {}; let busy = 0, idle = 0; const lines = {}; for (const n of profile.nodes) if (n.callFrame.functionName === 'drawAtmosphere') for (const pt of n.positionTicks || []) lines[pt.line] = (lines[pt.line] || 0) + pt.ticks; (res.__lines = res.__lines || {})[t] = lines;
    for (const n of profile.nodes) { const us = self.get(n.id) || 0, f = n.callFrame.functionName || '(anon)'; if (f === '(idle)') idle += us; else busy += us; byFn[f] = (byFn[f] || 0) + us; }
    const o = res[t] = res[t] || { runs: [] }; o.runs.push({ wall, busyMs: Math.round(busy / 1000), atm: Math.round((byFn.drawAtmosphere || 0) / 1000), put: Math.round((byFn.putImageData || 0) / 1000), draw: Math.round((byFn.drawImage || 0) / 1000), program: Math.round((byFn['(program)'] || 0) / 1000) });
    await b.close();
  }
  for (const [t, l] of Object.entries(res.__lines || {})) console.log('lines of drawAtmosphere (ticks of 250us) ' + t, JSON.stringify(Object.entries(l).sort((a, b) => b[1] - a[1]).slice(0, 6)));
  delete res.__lines;
  for (const [t, o] of Object.entries(res)) { const med = k => { const v = o.runs.map(r => r[k]).sort((a, b) => a - b); return v[Math.floor(v.length / 2)]; }; console.log(t, 'x' + cpu, 'n=' + o.runs.length, 'busyMs', med('busyMs'), 'drawAtmosphere self', med('atm'), 'putImageData', med('put'), 'drawImage', med('draw'), '(program)', med('program'), '| runs', JSON.stringify(o.runs.map(r => [r.busyMs, r.atm]))); }
})().catch(e => { console.error('FATAL', e); process.exit(1); });
