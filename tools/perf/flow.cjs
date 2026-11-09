// GD0 measurement flow. One fresh browser per rep; appends one JSON object per rep to --out (JSONL).
// node tools/perf/flow.cjs --target map-surroundings-preview-4.html --cpu 4 --gpu real --net none --reps 1 --label p4-x4 --out tools/perf/results/gd0/aa-x4.jsonl
// Milestones (all in-page performance.now() unless noted; the harness only observes, it never edits the site):
//   gateReady        first rAF where #btnHomeOpeningStart is enabled and GoiVietHomeIntro exists
//   openingEnd       first rAF where #introScreen[data-home-opening]==='complete', measured from the click on the start button
//   firstGroundFrame first terrain WebGL frame drawn after the "open map" click (GoiVietWebGLTerrain3.inspect().frames increased)
//   curtainReveal    #memoryMapTransition gets .is-revealing. In preview-4 the prewarm hold() only reveals when the map is
//                    complete (ground + raster queue + backdrop + 5 even frames), so this is "map full quality" under the curtain gate
//   curtainClear     curtain has no is-covering/is-waiting/is-revealing
//   rasterIdle       RasterTasks has no pending/auxiliary/updating work for 3 consecutive 100 ms samples after curtainClear
const { fs, path, launch, NET, BASE, ROOT, os, summarize, systemBusyPct } = require('./lib.cjs');
const crypto = require('crypto');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const target = arg('target', 'map-surroundings-preview-4.html');
const cpu = +arg('cpu', 1), gpu = arg('gpu', 'real'), net = arg('net', 'none'), reps = +arg('reps', 1);
const label = arg('label', target.replace(/\.html$/, '') + '-x' + cpu), outFile = arg('out', null);
const W = +arg('w', 1707), H = +arg('h', 1067);
const stopAt = arg('stop', 'all');
const dwell = +arg('dwell', 4); // seconds spent on the finished home screen before the memory chapter / map entry
const variant = arg('variant', 'direct'); // direct | passthru | has (experiment: rewrite :has(#introScreen.intro-hidden) -> .gv-map-open)
const cacheOn = arg('cache', 'off') === 'on'; // default off keeps A/A runs comparable // 'gate' | 'home' | 'map' | 'all'

const INIT = `(()=>{
const M=window.__m={marks:{},lt:[],loaf:[],ev:[],lcp:0,cls:0,fs:{on:false,g:[]}};
try{new PerformanceObserver(l=>{for(const e of l.getEntries())M.lcp=e.startTime}).observe({type:'largest-contentful-paint',buffered:true})}catch(e){}
try{new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)M.cls+=e.value}).observe({type:'layout-shift',buffered:true})}catch(e){}
try{new PerformanceObserver(l=>{for(const e of l.getEntries())M.lt.push([e.startTime,e.duration])}).observe({type:'longtask',buffered:true})}catch(e){}
try{new PerformanceObserver(l=>{for(const e of l.getEntries()){const s=(e.scripts||[]).slice(0,3).map(x=>[(x.sourceURL||'').split('/').pop().split('?')[0],x.sourceFunctionName||x.invoker||'',Math.round(x.duration)]);M.loaf.push([e.startTime,e.duration,e.blockingDuration||0,s])}}).observe({type:'long-animation-frame',buffered:true})}catch(e){}
try{new PerformanceObserver(l=>{for(const e of l.getEntries())M.ev.push([e.name,e.startTime,e.duration,e.processingStart-e.startTime])}).observe({type:'event',durationThreshold:16,buffered:true})}catch(e){}
let last=0;
const loop=t=>{
  if(M.fs.on&&last)M.fs.g.push(t-last);last=t;
  const m=M.marks,n=performance.now();
  if(!m.gateReady){const b=document.getElementById('btnHomeOpeningStart');if(b&&!b.disabled&&window.GoiVietHomeIntro)m.gateReady=n;}
  if(m.openingClick&&!m.openingEnd){const s=document.getElementById('introScreen');if(s&&s.dataset.homeOpening==='complete')m.openingEnd=n;}
  requestAnimationFrame(loop);
};requestAnimationFrame(loop);
window.__watchEnter=()=>{
  const m=M.marks;m.enterClick=performance.now();
  const T=window.GoiVietWebGLTerrain3;const f0=T&&T.usable&&T.usable()?T.inspect().frames:0;let quiet=0;
  const iv=setInterval(()=>{
    const n=performance.now(),c=document.getElementById('memoryMapTransition'),cls=c?c.className:'',i=document.getElementById('introScreen');
    if(!m.mapHidden&&i&&i.classList.contains('intro-hidden'))m.mapHidden=n;
    if(!m.firstGroundFrame&&T&&T.usable&&T.usable()&&T.inspect().frames>f0)m.firstGroundFrame=n;
    if(!m.curtainWaiting&&/is-waiting/.test(cls))m.curtainWaiting=n;
    if(!m.curtainReveal&&/is-revealing/.test(cls))m.curtainReveal=n;
    if(m.mapHidden&&!m.curtainClear&&!/is-(covering|waiting|revealing)/.test(cls))m.curtainClear=n;
    if(m.curtainClear&&!m.rasterIdle){const r=window.GoiVietRasterTasks&&window.GoiVietRasterTasks.inspect();const busy=r&&(r.pending||r.auxiliaryTasks||r.updating);quiet=busy?0:quiet+1;if(quiet>=3){m.rasterIdle=n;clearInterval(iv);}}
  },100);
};
})();`;

const stats = g => {
  if (!g.length) return null;
  const s = [...g].sort((a, b) => a - b), n = s.length, q = p => s[Math.min(n - 1, Math.floor(n * p))], sum = g.reduce((a, b) => a + b, 0);
  return { frames: n, fps: +(1000 / (sum / n)).toFixed(1), avg: +(sum / n).toFixed(1), p50: +q(.5).toFixed(1), p95: +q(.95).toFixed(1), p99: +q(.99).toFixed(1), max: +s[n - 1].toFixed(1), gt33: g.filter(x => x > 33.4).length, gt50: g.filter(x => x > 50).length, gt100: g.filter(x => x > 100).length };
};

async function oneRun(rep) {
  const html = fs.readFileSync(path.join(ROOT, target));
  const env = { rep, target, dwell, variant, cache: cacheOn ? 'on' : 'off', htmlSha256: crypto.createHash('sha256').update(html).digest('hex').slice(0, 16), cpu, gpu, net, viewport: [W, H], freeMemGB: +(os.freemem() / 2 ** 30).toFixed(2), sysBusyPctBefore: await systemBusyPct(1000), t: new Date().toISOString() };
  const browser = await launch(gpu, ['--enable-precise-memory-info']);
  env.chrome = browser.version();
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await ctx.addInitScript(INIT);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  if (variant === 'r5pass' || variant === 'r6') { // GD3: route ONLY the home renderer script; r6 serves renderer-6 in its place, r5pass serves renderer-5 unchanged (fair control)
    const body = fs.readFileSync(path.join(ROOT, variant === 'r6' ? 'assets/goi-viet/homepage-layered-renderer-6.js' : 'assets/goi-viet/homepage-layered-renderer-5.js'), 'utf8');
    await page.route('**/homepage-layered-renderer-5.js*', route => route.fulfill({ status: 200, contentType: 'text/javascript', body }));
  }
  if (variant === 'passthru' || variant === 'has') {
    if (variant === 'has') await ctx.addInitScript(`(()=>{const sync=()=>{const i=document.getElementById('introScreen');if(i&&document.body)document.body.classList.toggle('gv-map-open',i.classList.contains('intro-hidden'));};document.addEventListener('DOMContentLoaded',()=>{const i=document.getElementById('introScreen');sync();new MutationObserver(sync).observe(i,{attributes:true,attributeFilter:['class']});});})();`);
    await page.route('**/*', async route => { const u = route.request().url(); if (!u.startsWith(BASE) || !/(\.css|preview-5\.html)(\?|$)/.test(u)) return route.continue(); const resp = await route.fetch(); let body = await resp.text(); if (variant === 'has') body = body.split(':has(#introScreen.intro-hidden)').join('.gv-map-open'); const headers = { ...resp.headers() }; delete headers['content-encoding']; delete headers['content-length']; await route.fulfill({ status: resp.status(), headers, body }); });
  }
  await cdp.send('Performance.enable'); await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: !cacheOn });
  if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  if (NET[net]) await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: NET[net].latency, downloadThroughput: NET[net].down, uploadThroughput: NET[net].up });
  const R = { label, env, nav: null, phases: {}, marks: {}, wall: {}, errors: [], console: [], failedReq: [] };
  page.on('console', m => { if (['error', 'warning'].includes(m.type())) R.console.push(m.type() + ': ' + m.text().slice(0, 200)); });
  page.on('pageerror', e => R.errors.push('PAGEERROR ' + String(e).slice(0, 240)));
  page.on('requestfailed', r => R.failedReq.push(r.url().slice(-90)));
  const reqs = {}; let t0 = 0;
  cdp.on('Network.requestWillBeSent', e => { reqs[e.requestId] = { url: e.request.url.replace(BASE, ''), t: Math.round(Date.now() - t0), transfer: 0, decoded: 0, type: e.type }; });
  cdp.on('Network.responseReceived', e => { if (reqs[e.requestId]) { reqs[e.requestId].status = e.response.status; reqs[e.requestId].mime = e.response.mimeType; } });
  cdp.on('Network.dataReceived', e => { if (reqs[e.requestId]) reqs[e.requestId].decoded += e.dataLength; });
  cdp.on('Network.loadingFinished', e => { if (reqs[e.requestId]) { reqs[e.requestId].transfer = e.encodedDataLength; reqs[e.requestId].done = Math.round(Date.now() - t0); } });
  const metrics = async () => { const m = await cdp.send('Performance.getMetrics'); const o = {}; m.metrics.forEach(x => o[x.name] = x.value); return o; };
  const phase = async (name, fn) => {
    await page.evaluate(() => { const M = window.__m; M.fs.g = []; M.fs.on = true; M._t0 = performance.now(); });
    const m0 = await metrics(), w0 = Date.now(); let err = null, extra = null;
    try { extra = await fn(); } catch (e) { err = String(e).slice(0, 200); R.errors.push(name + ': ' + err); }
    const wall = Date.now() - w0, m1 = await metrics();
    const o = await page.evaluate(() => { const M = window.__m; M.fs.on = false; const a = M._t0, b = performance.now(); return { g: M.fs.g, lt: M.lt.filter(x => x[0] >= a && x[0] <= b), loaf: M.loaf.filter(x => x[0] >= a && x[0] <= b), ev: M.ev.filter(x => x[1] >= a && x[1] <= b) }; });
    const lt = o.lt;
    R.phases[name] = {
      wallMs: wall, err, extra, frame: stats(o.g),
      cpuBusyPct: wall ? +(((m1.TaskDuration - m0.TaskDuration) * 1000) / wall * 100).toFixed(1) : null,
      scriptMs: Math.round((m1.ScriptDuration - m0.ScriptDuration) * 1000), layoutMs: Math.round((m1.LayoutDuration - m0.LayoutDuration) * 1000), styleMs: Math.round((m1.RecalcStyleDuration - m0.RecalcStyleDuration) * 1000), layouts: m1.LayoutCount - m0.LayoutCount,
      longTasks: { n: lt.length, totalMs: Math.round(lt.reduce((a, x) => a + x[1], 0)), maxMs: Math.round(Math.max(0, ...lt.map(x => x[1]))), tbtMs: Math.round(lt.reduce((a, x) => a + Math.max(0, x[1] - 50), 0)) },
      loaf: { n: o.loaf.length, maxMs: Math.round(Math.max(0, ...o.loaf.map(x => x[1]))), top: o.loaf.sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => ({ dur: Math.round(x[1]), block: Math.round(x[2]), scripts: x[3] })) },
      events: { n: o.ev.length, maxDurMs: Math.round(Math.max(0, ...o.ev.map(x => x[2]))), maxInputDelayMs: Math.round(Math.max(0, ...o.ev.map(x => x[3]))) },
      heapMB: +(m1.JSHeapUsedSize / 1048576).toFixed(1), nodes: m1.Nodes
    };
    const f = R.phases[name].frame;
    console.log(`[${label}#${rep}] ${name}: ${wall}ms` + (f ? ` fps=${f.fps} p95=${f.p95} max=${f.max}` : '') + ` cpu=${R.phases[name].cpuBusyPct}% LT=${lt.length}/${R.phases[name].longTasks.maxMs}ms` + (err ? ' ERR ' + err : ''));
    return !err;
  };
  const finish = async () => {
    R.marks = await page.evaluate(() => window.__m.marks).catch(() => ({}));
    R.inventory = Object.values(reqs).map(r => ({ u: r.url.slice(0, 160), t: r.t, d: r.done || null, tr: r.transfer, dec: r.decoded, ty: r.type, st: r.status }));
    R.totals = { reqs: R.inventory.length, transferMB: +(R.inventory.reduce((a, r) => a + r.tr, 0) / 1048576).toFixed(2), decodedMB: +(R.inventory.reduce((a, r) => a + r.dec, 0) / 1048576).toFixed(2) };
    R.console = [...new Set(R.console)].slice(0, 12);
    if (outFile) fs.appendFileSync(path.resolve(ROOT, outFile), JSON.stringify(R) + '\n');
    await browser.close();
  };
  try {
    // ---- load -> gate
    t0 = Date.now();
    await page.goto(BASE + target, { waitUntil: 'load', timeout: 600000 });
    R.wall.load = Date.now() - t0;
    await page.waitForFunction(() => window.__m.marks.gateReady, null, { timeout: 600000 });
    R.wall.gate = Date.now() - t0;
    await page.waitForTimeout(1500);
    R.nav = await page.evaluate(() => {
      const n = performance.getEntriesByType('navigation')[0], p = {}; performance.getEntriesByType('paint').forEach(e => p[e.name] = Math.round(e.startTime));
      const M = window.__m, lt = M.lt.filter(x => x[0] < (M.marks.gateReady || 1e9));
      return { ttfb: Math.round(n.responseStart), dcl: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd), fp: p['first-paint'], fcp: p['first-contentful-paint'], lcp: Math.round(M.lcp), cls: +M.cls.toFixed(4), gateReady: Math.round(M.marks.gateReady), tbtToGate: Math.round(lt.reduce((a, x) => a + Math.max(0, x[1] - 50), 0)), ltMaxToGate: Math.round(Math.max(0, ...lt.map(x => x[1]))), domNodes: document.getElementsByTagName('*').length };
    });
    R.env.glRenderer = await page.evaluate(() => { const c = document.createElement('canvas'), g = c.getContext('webgl2') || c.getContext('webgl'), e = g && g.getExtension('WEBGL_debug_renderer_info'); return g ? (e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'webgl-no-debug-info') : 'NO_WEBGL'; });
    R.wall.gateSettled = Date.now() - t0;
    if (stopAt === 'gate') return await finish();
    await phase('gate-idle-3s', async () => { await page.waitForTimeout(3000); });
    // ---- opening
    await phase('opening', async () => {
      R.wall.openingClick = Date.now() - t0;
      await page.evaluate(() => { window.__m.marks.openingClick = performance.now(); });
      await page.click('#btnHomeOpeningStart');
      await page.waitForFunction(() => window.__m.marks.openingEnd, null, { timeout: 180000 });
      R.wall.openingEnd = Date.now() - t0;
    });
    await phase('home-idle-4s', async () => { await page.waitForTimeout(dwell * 1000); });
    if (stopAt === 'home') return await finish();
    // ---- memory chapter + enter map
    await phase('memory-scroll', async () => {
      R.wall.memoryBegin = Date.now() - t0;
      await page.evaluate(() => window.GoiVietMemoryChapter.begin()); await page.waitForTimeout(1500);
      for (let i = 0; i < 10; i++) { await page.mouse.move(800, 600); await page.mouse.wheel(0, 200); await page.waitForTimeout(120); }
      await page.waitForTimeout(600);
    });
    R.prewarmBeforeEnter = await page.evaluate(() => window.GoiVietMapPrewarm3 && window.GoiVietMapPrewarm3.inspect()).catch(() => null);
    const ok = await phase('enter-map', async () => {
      R.wall.enterClick = Date.now() - t0;
      await page.evaluate(() => { document.getElementById('memoryOpenMap').scrollIntoView(); window.__watchEnter(); document.getElementById('memoryOpenMap').click(); });
      await page.waitForFunction(() => window.__m.marks.curtainClear, null, { timeout: 240000 });
      R.wall.mapClear = Date.now() - t0;
      await page.waitForFunction(() => window.__m.marks.rasterIdle, null, { timeout: 60000 }).catch(() => { });
      await page.waitForTimeout(500);
    });
    R.prewarmAfterEnter = await page.evaluate(() => window.GoiVietMapPrewarm3 && window.GoiVietMapPrewarm3.inspect()).catch(() => null);
    if (!ok) return await finish();
    if (stopAt === 'map-enter') return await finish();
    await phase('map-idle-3s', async () => { await page.waitForTimeout(3000); });
    const cx = Math.round(W * .36), cy = Math.round(H * .55);
    await phase('map-drag-pan', async () => { await page.mouse.move(cx, cy); await page.mouse.down(); for (let i = 1; i <= 40; i++) { await page.mouse.move(cx + i * 6, cy + i * 3); await page.waitForTimeout(16); } await page.mouse.up(); await page.waitForTimeout(1000); });
    await phase('map-wheel-zoom', async () => { await page.mouse.move(cx, cy); for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, -240); await page.waitForTimeout(70); } await page.waitForTimeout(600); for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, 240); await page.waitForTimeout(70); } await page.waitForTimeout(800); });
    await phase('map-rotate', async () => { await page.mouse.move(cx, cy); await page.mouse.down({ button: 'right' }); for (let i = 1; i <= 30; i++) { await page.mouse.move(cx - i * 7, cy + i); await page.waitForTimeout(16); } await page.mouse.up({ button: 'right' }); await page.waitForTimeout(700); });
    await phase('map-pitch-toggle', async () => { await page.click('.control-disclosure .dock-btn:has-text("Góc nhìn")'); await page.waitForTimeout(300); await page.click('#btnTogglePitch'); await page.waitForTimeout(1500); await page.click('#btnTogglePitch'); await page.waitForTimeout(1500); await page.keyboard.press('Escape'); });
    await phase('map-fly-hue', async () => { await page.evaluate(() => selectDemoPlace('hue')); await page.waitForTimeout(2500); });
    R.finalHeapMB = (await metrics()).JSHeapUsedSize / 1048576; R.finalHeapMB = +R.finalHeapMB.toFixed(1);
    return await finish();
  } catch (e) {
    R.errors.push('FATAL ' + String(e).slice(0, 300)); console.log(`[${label}#${rep}] FATAL ${String(e).slice(0, 200)}`);
    try { return await finish(); } catch (_) { try { await browser.close(); } catch (__) { } }
  }
}
(async () => { for (let i = 1; i <= reps; i++) await oneRun(i); })().catch(e => { console.error('FATAL', e); process.exit(1); });
