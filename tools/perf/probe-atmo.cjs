// Pre-condition measurement for drawAtmosphere (renderer-4): real n/k, per-call cost, and an UPPER BOUND on what optimising it could give.
// Only the renderer JS URL is intercepted (route), everything else is untouched. Variants:
//   base   : original code + a timing wrapper (calls, total ms, max ms) and capture of n (pixels) and k (layers summed)
//   noloop : same, but the per-pixel loop is removed (picture is wrong; used ONLY to bound the possible gain)
// node tools/perf/probe-atmo.cjs --cpu 4 --reps 3
const { launch, BASE, fs, path, ROOT, summarize } = require('./lib.cjs');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const cpu = +arg('cpu', 4), reps = +arg('reps', 3), target = arg('target', 'map-surroundings-preview-5.html');
const LOOP = 'for(let p=0,n=field.data.length/4;p<n;p++){let visible=0;for(let i=0;i<weights.length;i++)visible+=weights[i][p]*gains[i];field.data[p*4+3]=Math.round(255*(1-visible));}';
function patch(src, variant) {
  if (src.split(LOOP).length !== 2) throw new Error('loop anchor');
  const head = 'function drawAtmosphere(introTime){';
  if (src.split(head).length !== 2) throw new Error('head anchor');
  let s = src.replace(head, 'function drawAtmosphere(introTime){const __t=performance.now();try{return __drawAtmosphere(introTime);}finally{const A=(window.__atm=window.__atm||{calls:0,ms:0,max:0,loops:0,loopMs:0});const d=performance.now()-__t;A.calls++;A.ms+=d;if(d>A.max)A.max=d;}}\n    function __drawAtmosphere(introTime){');
  const body = variant === 'noloop' ? '(window.__atm=window.__atm||{calls:0,ms:0,max:0,loops:0,loopMs:0}).k=weights.length;' : 'const __a=window.__atm=window.__atm||{calls:0,ms:0,max:0,loops:0,loopMs:0};__a.k=weights.length;__a.n=field.data.length/4;const __l=performance.now();' + LOOP + '__a.loops++;__a.loopMs+=performance.now()-__l;';
  return s.replace(LOOP, body);
}
(async () => {
  const res = { base: [], noloop: [] };
  for (let r = 0; r < reps; r++) for (const variant of ['base', 'noloop']) {
    const b = await launch('real'); const ctx = await b.newContext({ viewport: { width: 1707, height: 1067 }, deviceScaleFactor: 1 }); const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
    await cdp.send('Performance.enable'); await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
    await page.route('**/homepage-layered-renderer-4.js*', async route => { const resp = await route.fetch(); const body = patch(await resp.text(), variant); const h = { ...resp.headers() }; delete h['content-encoding']; delete h['content-length']; await route.fulfill({ status: 200, headers: h, body }); });
    await page.addInitScript('window.__g=[];let l=0;const f=t=>{if(window.__on&&l)window.__g.push(t-l);l=t;requestAnimationFrame(f)};requestAnimationFrame(f);');
    await page.goto(BASE + target, { waitUntil: 'load', timeout: 600000 });
    await page.waitForFunction(() => window.GoiVietHomeIntro && !document.getElementById('btnHomeOpeningStart').disabled, null, { timeout: 600000 });
    await page.waitForTimeout(1500);
    const m = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
    await page.evaluate(() => { window.__g = []; window.__on = true; window.__atm = null; }); const m0 = await m(); const t0 = Date.now();
    await page.click('#btnHomeOpeningStart'); await page.waitForFunction(() => document.getElementById('introScreen').dataset.homeOpening === 'complete', null, { timeout: 180000 });
    const wall = Date.now() - t0, m1 = await m();
    const o = await page.evaluate(() => { window.__on = false; const g = window.__g, s = [...g].sort((a, b) => a - b), sum = g.reduce((a, b) => a + b, 0); return { fps: +(1000 / (sum / g.length)).toFixed(1), p95: +s[Math.floor(s.length * .95)].toFixed(1), max: +s[s.length - 1].toFixed(1), over33: g.filter(x => x > 33.4).length, frames: g.length, atm: window.__atm }; });
    res[variant].push({ wall, cpuPct: +(((m1.TaskDuration - m0.TaskDuration) * 1000) / wall * 100).toFixed(1), ...o });
    console.log(`[${variant}#${r + 1}] fps=${o.fps} p95=${o.p95} max=${o.max} >33ms=${o.over33} cpu=${res[variant].at(-1).cpuPct}% atm calls=${o.atm && o.atm.calls} total=${o.atm && Math.round(o.atm.ms)}ms max=${o.atm && Math.round(o.atm.max)}ms loops=${o.atm && o.atm.loops} loopMs=${o.atm && Math.round(o.atm.loopMs || 0)} k=${o.atm && o.atm.k} n=${o.atm && o.atm.n}`);
    await b.close();
  }
  for (const v of ['base', 'noloop']) console.log(v, 'x' + cpu, 'median fps', summarize(res[v].map(x => x.fps)).median, 'p95 frame', summarize(res[v].map(x => x.p95)).median, 'cpu%', summarize(res[v].map(x => x.cpuPct)).median, 'frames>33ms', summarize(res[v].map(x => x.over33)).median, 'drawAtmosphere total ms', summarize(res[v].map(x => x.atm && x.atm.ms)).median);
  fs.writeFileSync(path.join(ROOT, `tools/perf/results/gd2/atmo-probe-x${cpu}.json`), JSON.stringify(res, null, 1));
})().catch(e => { console.error('FATAL', e); process.exit(1); });
