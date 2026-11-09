// Sampling CPU profile of the "enter map" step: inclusive time under closeIntroModal() and the memory-reference-v2 timers.
// node tools/perf/profile-enter.cjs --target map-surroundings-preview-5.html --cpu 4 --reps 3
const { fs, path, launch, BASE, ROOT } = require('./lib.cjs');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const target = arg('target', 'map-surroundings-preview-5.html'), cpu = +arg('cpu', 4), reps = +arg('reps', 1), root = arg('root', 'closeIntroModal');
(async () => {
  const agg = {}, callers = {};
  for (let r = 0; r < reps; r++) {
    const browser = await launch('real');
    const ctx = await browser.newContext({ viewport: { width: 1707, height: 1067 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
    await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 250 });
    await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
    await page.goto(BASE + target, { waitUntil: 'load', timeout: 600000 });
    await page.waitForFunction(() => window.GoiVietHomeIntro && !document.getElementById('btnHomeOpeningStart').disabled, null, { timeout: 600000 });
    await page.waitForTimeout(1200);
    await page.click('#btnHomeOpeningStart');
    await page.waitForFunction(() => document.getElementById('introScreen').dataset.homeOpening === 'complete', null, { timeout: 180000 });
    await page.waitForTimeout(800);
    await page.evaluate(() => window.GoiVietMemoryChapter.begin()); await page.waitForTimeout(1500);
    for (let i = 0; i < 8; i++) { await page.mouse.move(800, 600); await page.mouse.wheel(0, 200); await page.waitForTimeout(100); }
    await cdp.send('Profiler.start');
    await page.evaluate(() => { document.getElementById('memoryOpenMap').scrollIntoView(); document.getElementById('memoryOpenMap').click(); });
    await page.waitForFunction(() => { const i = document.getElementById('introScreen'), c = document.getElementById('memoryMapTransition'); return i.classList.contains('intro-hidden') && c && !/is-(covering|waiting|revealing)/.test(c.className); }, null, { timeout: 240000 });
    const { profile } = await cdp.send('Profiler.stop');
    const nodes = new Map(profile.nodes.map(n => [n.id, n]));
    const parent = new Map(); for (const n of profile.nodes) for (const c of n.children || []) parent.set(c, n.id);
    const self = new Map(); profile.samples.forEach((id, i) => self.set(id, (self.get(id) || 0) + (profile.timeDeltas[i] || 0)));
    const incl = new Map(); // node id -> inclusive us
    for (const [id, us] of self) { let cur = id; while (cur != null) { incl.set(cur, (incl.get(cur) || 0) + us); cur = parent.get(cur); } }
    const name = n => (n.callFrame.functionName || '(anon)') + ' @' + (n.callFrame.url || '').split('/').pop().split('?')[0] + ':' + n.callFrame.lineNumber;
    // inclusive by function across the whole profile (sum over nodes whose ancestor chain does not contain the same function = no double count)
    const inRoot = id => { let c = id; while (c != null) { if (nodes.get(c).callFrame.functionName === root) return true; c = parent.get(c); } return false; };
    const perFn = {};
    for (const n of profile.nodes) {
      const k = name(n); let anc = parent.get(n.id), dup = false; while (anc != null) { if (name(nodes.get(anc)) === k) { dup = true; break; } anc = parent.get(anc); }
      if (dup) continue;
      const rec = perFn[k] = perFn[k] || { incl: 0, self: 0, inRoot: 0 };
      rec.incl += incl.get(n.id) || 0; if (inRoot(n.id)) rec.inRoot += incl.get(n.id) || 0;
    }
    for (const n of profile.nodes) { const k = name(n); if (perFn[k]) perFn[k].self += self.get(n.id) || 0; }
    for (const [k, v] of Object.entries(perFn)) { const a = agg[k] = agg[k] || { incl: 0, self: 0, inRoot: 0, n: 0 }; a.incl += v.incl; a.self += v.self; a.inRoot += v.inRoot; }
    for (const n of profile.nodes) { const f = n.callFrame.functionName; if (!['getBoundingClientRect','focus','getContext','putImageData','drawImage','getComputedStyle'].includes(f)) continue; const us = self.get(n.id) || 0; if (!us) continue; const chain = []; let c = parent.get(n.id); while (c != null && chain.length < 3) { const x = nodes.get(c); if (x.callFrame.functionName !== '(program)') chain.push(name(x)); c = parent.get(c); } const k = f + ' <- ' + chain.join(' <- '); callers[k] = (callers[k] || 0) + us; }
    await browser.close();
  }
  const rows = Object.entries(agg).map(([k, v]) => [k, Math.round(v.incl / 1000 / reps), Math.round(v.self / 1000 / reps), Math.round(v.inRoot / 1000 / reps)]);
  console.log(`# ${target} cpu x${cpu} reps=${reps}: ms per run (inclusive / self / inclusive inside ${root})`);
  console.log('-- inside ' + root + ' (inclusive), top 18'); rows.filter(r => r[3] > 5).sort((a, b) => b[3] - a[3]).slice(0, 18).forEach(r => console.log(String(r[3]).padStart(6), String(r[2]).padStart(6), r[0]));
  console.log('-- overall inclusive, top 14'); rows.sort((a, b) => b[1] - a[1]).slice(0, 14).forEach(r => console.log(String(r[1]).padStart(6), String(r[2]).padStart(6), r[0]));
  console.log('-- callers of hot native calls (ms/run)'); Object.entries(callers).sort((a, b) => b[1] - a[1]).slice(0, 14).forEach(([k, v]) => console.log(String(Math.round(v / 1000 / reps)).padStart(6), k));
  console.log('-- overall self, top 14'); rows.sort((a, b) => b[2] - a[2]).slice(0, 14).forEach(r => console.log(String(r[2]).padStart(6), r[0]));
})().catch(e => { console.error('FATAL', e); process.exit(1); });
