// GD2: where does main-thread time go between "opening complete" and "map revealed"? (prewarm on home + hold under the curtain)
// node tools/perf/profile-prewarm.cjs --target map-surroundings-preview-5.html --cpu 4 --dwell 8
const { launch, BASE, fs, path, ROOT } = require('./lib.cjs');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const target = arg('target', 'map-surroundings-preview-5.html'), cpu = +arg('cpu', 4), dwell = +arg('dwell', 8);
(async () => {
  const b = await launch('real'); const ctx = await b.newContext({ viewport: { width: 1707, height: 1067 }, deviceScaleFactor: 1 }); const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 500 }); await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  await page.goto(BASE + target, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.GoiVietHomeIntro && !document.getElementById('btnHomeOpeningStart').disabled, null, { timeout: 600000 });
  await page.waitForTimeout(1200); await page.click('#btnHomeOpeningStart');
  await page.waitForFunction(() => document.getElementById('introScreen').dataset.homeOpening === 'complete', null, { timeout: 180000 });
  const t0 = Date.now(); await cdp.send('Profiler.start');
  await page.waitForTimeout(dwell * 1000);
  const tClick = Date.now();
  await page.evaluate(() => window.GoiVietMemoryChapter.begin()); await page.waitForTimeout(1500);
  await page.evaluate(() => { document.getElementById('memoryOpenMap').scrollIntoView(); document.getElementById('memoryOpenMap').click(); });
  await page.waitForFunction(() => { const i = document.getElementById('introScreen'), c = document.getElementById('memoryMapTransition'); return i.classList.contains('intro-hidden') && c && !/is-(covering|waiting|revealing)/.test(c.className); }, null, { timeout: 240000 });
  const wall = Date.now() - t0; const { profile } = await cdp.send('Profiler.stop');
  const pw = await page.evaluate(() => window.GoiVietMapPrewarm3 && window.GoiVietMapPrewarm3.inspect());
  const nodes = new Map(profile.nodes.map(n => [n.id, n])), parent = new Map(); for (const n of profile.nodes) for (const c of n.children || []) parent.set(c, n.id);
  const self = new Map(); profile.samples.forEach((id, i) => self.set(id, (self.get(id) || 0) + (profile.timeDeltas[i] || 0)));
  let total = 0, idle = 0; for (const [id, us] of self) { total += us; if (nodes.get(id).callFrame.functionName === '(idle)') idle += us; }
  const key = n => (n.callFrame.functionName || '(anon)') + ' @' + (n.callFrame.url || '').split('/').pop().split('?')[0];
  // inclusive per top-level entry point (first ancestor/self frame in the watch list; no double counting)
  const WATCH = [
    ['raster-scheduler tick (ingest/putImageData)', k => /^tick @raster-scheduler-4\.js/.test(k)],
    ['buildBackdrop (regional/sea paint on main)', k => /^buildBackdrop @preview-3\.js/.test(k)],
    ['backdropJob / keepOverview', k => /^(backdropJob|keepOverview|window\.GoiVietRasterTasks\.run\.backdropJob) @preview-3\.js/.test(k)],
    ['webgl terrain run/build/upload', k => /@webgl-terrain-renderer-3\.js/.test(k)],
    ['renderMainScene (map frame)', k => /^renderMainScene @/.test(k)],
    ['closeIntroModal', k => /^closeIntroModal @/.test(k)],
    ['prewarm tick/check', k => /@map-prewarm-3\.js/.test(k)],
    ['home opening controller tick', k => /@homepage-opening-controller-3\.js/.test(k)],
    ['home layered renderer', k => /@homepage-layered-renderer-4\.js/.test(k)],
    ['crane flight / transport', k => /@(homepage-crane-flight-3|transport)\.js/.test(k)],
    ['landscape/terrain paint (non-GL)', k => /@(landscape-4|terrain-renderer-4|archipelago-renderer-3|core-3|regional-renderer-4)\.js/.test(k)],
    ['memory chapter scripts', k => /@memory-/.test(k)]
  ];
  const acc = Object.fromEntries(WATCH.map(([n]) => [n, 0])); let other = 0;
  for (const [id, us] of self) {
    const n = nodes.get(id); if (n.callFrame.functionName === '(idle)') continue;
    // classify by the OUTERMOST matching ancestor (including self)
    const chain = []; for (let c = id; c != null; c = parent.get(c)) chain.push(key(nodes.get(c)));
    let hit = null; for (let i = chain.length - 1; i >= 0 && !hit; i--) for (const [name, fn] of WATCH) if (fn(chain[i])) { hit = name; break; }
    if (hit) acc[hit] += us; else other += us;
  }
  const ms = us => Math.round(us / 1000);
  console.log(`# ${target} x${cpu} dwell ${dwell}s: profile window ${wall} ms (dwell ${tClick - t0} ms + chapter/enter ${Date.now() - tClick} ms); busy ${ms(total - idle)} ms, idle ${ms(idle)} ms; prewarm ${JSON.stringify(pw)}`);
  for (const [n, us] of Object.entries(acc).sort((a, b) => b[1] - a[1])) console.log(String(ms(us)).padStart(7), 'ms', n);
  console.log(String(ms(other)).padStart(7), 'ms', 'other (incl. (program), GC, natives outside watched stacks)');
  fs.writeFileSync(path.join(ROOT, `tools/perf/results/gd2/prewarm-profile-x${cpu}-d${dwell}.json`), JSON.stringify({ target, cpu, dwell, wall, busyMs: ms(total - idle), idleMs: ms(idle), acc: Object.fromEntries(Object.entries(acc).map(([k, v]) => [k, ms(v)])), otherMs: ms(other), prewarm: pw }, null, 1));
  await b.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
