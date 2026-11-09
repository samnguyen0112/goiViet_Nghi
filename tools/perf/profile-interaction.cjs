// GD4: where does the main thread spend time during map interaction (drag / zoom / rotate / pitch / fly / panel)?
// V8 sampling profile (self + inclusive per function) + frame stats + forced-layout counters per scenario. Observes only; never edits the site.
// node tools/perf/profile-interaction.cjs --target map-surroundings-preview-5.html --cpu 4 --gpu real --label p5-x4 [--reps 1]
// Output: tools/perf/results/gd4-map/interaction-<label>.json
const { fs, path, launch, NET, BASE, ROOT } = require('./lib.cjs');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const target = arg('target', 'map-surroundings-preview-5.html'), cpu = +arg('cpu', 1), gpu = arg('gpu', 'real'), label = arg('label', 'p5-x' + cpu);
const W = +arg('w', 1707), H = +arg('h', 1067), interval = +arg('interval', 200); // sampling interval in microseconds
const variant = arg('variant', 'base'); // base | pause (what-if: raster-scheduler tick does nothing while the camera is moving)
const outDir = path.join(ROOT, 'tools/perf/results/gd4-map'); fs.mkdirSync(outDir, { recursive: true });

const INIT = `(()=>{
const M=window.__m={g:[],on:false,fn:{},forced:0,loaf:[],slow:[]};
try{new PerformanceObserver(l=>{for(const e of l.getEntries()){if(!M.on)continue;M.loaf.push({dur:Math.round(e.duration),block:Math.round(e.blockingDuration||0),render:Math.round(e.styleAndLayoutStart?e.startTime+e.duration-e.styleAndLayoutStart:0),scripts:(e.scripts||[]).filter(x=>x.duration>=8).slice(0,4).map(x=>({u:(x.sourceURL||'').split('/').pop().split('?')[0],f:x.sourceFunctionName||'',inv:x.invoker||'',type:x.invokerType,d:Math.round(x.duration),forced:Math.round(x.forcedStyleAndLayoutDuration||0),pos:x.sourceCharPosition}))})}}).observe({type:'long-animation-frame',buffered:false})}catch(e){}
let last=0;const loop=t=>{if(M.on&&last)M.g.push(t-last);last=t;requestAnimationFrame(loop)};requestAnimationFrame(loop);
// wrap selected page functions with self-contained timers (inclusive wall time); installed lazily once the map exists
window.__wrap=names=>{for(const n of names){const f=window[n];if(typeof f!=='function'||f.__w)continue;const w=function(){const t=performance.now();try{return f.apply(this,arguments)}finally{const d=performance.now()-t,s=M.fn[n]||(M.fn[n]={n:0,ms:0,max:0});s.n++;s.ms+=d;if(d>s.max)s.max=d}};w.__w=1;window[n]=w}};
// count forced reads on layout-dependent APIs while a scenario is on
for(const [proto,k] of [[Element.prototype,'getBoundingClientRect'],[Element.prototype,'scrollIntoView'],[HTMLElement.prototype,'focus']]){const o=proto[k];proto[k]=function(){if(M.on){const s=M.fn['DOM.'+k]||(M.fn['DOM.'+k]={n:0,ms:0,max:0});const t=performance.now();try{return o.apply(this,arguments)}finally{const d=performance.now()-t;s.n++;s.ms+=d;if(d>s.max)s.max=d;if(d>6&&M.slow.length<12)M.slow.push({api:k,ms:Math.round(d),el:(this.id||this.className||this.tagName)+'',stack:(new Error().stack||'').split(String.fromCharCode(10)).slice(2,7).map(x=>x.trim().split('/').pop())})}}return o.apply(this,arguments)}}
for(const k of ['offsetWidth','offsetHeight','clientWidth','clientHeight','scrollTop','scrollHeight']){const d=Object.getOwnPropertyDescriptor(HTMLElement.prototype,k)||Object.getOwnPropertyDescriptor(Element.prototype,k);if(!d||!d.get)continue;Object.defineProperty(Element.prototype,k,{configurable:true,get(){if(M.on){const s=M.fn['DOM.'+k]||(M.fn['DOM.'+k]={n:0,ms:0,max:0});s.n++}return d.get.call(this)}})}
})();`;

function analyzeProfile(p) {
  const nodes = new Map(); p.nodes.forEach(n => nodes.set(n.id, n));
  const parent = new Map(); p.nodes.forEach(n => (n.children || []).forEach(c => parent.set(c, n.id)));
  const key = n => { const c = n.callFrame; return (c.functionName || '(anon)') + ' @' + String(c.url || '').split('/').pop().split('?')[0] + ':' + (c.lineNumber + 1); };
  const self = new Map(), incl = new Map(); let total = 0, idle = 0, program = 0, gc = 0;
  for (let i = 0; i < p.samples.length; i++) {
    const dt = (p.timeDeltas[i] || 0) / 1000; const n = nodes.get(p.samples[i]); const k = key(n); total += dt;
    if (n.callFrame.functionName === '(idle)') { idle += dt; continue; }
    if (n.callFrame.functionName === '(program)') program += dt;
    if (n.callFrame.functionName === '(garbage collector)') gc += dt;
    self.set(k, (self.get(k) || 0) + dt);
    const seen = new Set(); let id = p.samples[i];
    while (id != null) { const kk = key(nodes.get(id)); if (!seen.has(kk)) { seen.add(kk); incl.set(kk, (incl.get(kk) || 0) + dt); } id = parent.get(id); }
  }
  const top = (m, n) => [...m.entries()].filter(([k]) => !/^\((idle|root|program)\)/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => [k, +v.toFixed(1)]);
  const lineMs = {}; const HOT = /^(placeCountryLabels|measure|paintLabels|paintIslandLabel|paintLandmarks|renderMainScene|visibleUI|paintBackdrop|ui|obstacles|ringOffscreen)$/;
  for (const n of p.nodes) { const f = n.callFrame; if (!HOT.test(f.functionName) || !n.positionTicks) continue; const file = String(f.url || '').split('/').pop().split('?')[0]; for (const t of n.positionTicks) { const k = f.functionName + ' @' + file + ':' + t.line; lineMs[k] = (lineMs[k] || 0) + t.ticks * (p.__interval || 200) / 1000; } }
  const lines = Object.entries(lineMs).sort((a, b) => b[1] - a[1]).slice(0, 24).map(([k, v]) => [k, +v.toFixed(1)]);
  return { lines, totalMs: +total.toFixed(0), busyMs: +(total - idle).toFixed(0), idleMs: +idle.toFixed(0), programMs: +program.toFixed(0), gcMs: +gc.toFixed(0), topSelf: top(self, 18), topIncl: top(incl, 22) };
}
const stats = g => { if (!g.length) return null; const s = [...g].sort((a, b) => a - b), n = s.length, q = p => s[Math.min(n - 1, Math.floor(n * p))], sum = g.reduce((a, b) => a + b, 0); return { frames: n, fps: +(1000 / (sum / n)).toFixed(1), p50: +q(.5).toFixed(1), p95: +q(.95).toFixed(1), max: +s[n - 1].toFixed(1), gt33: g.filter(x => x > 33.4).length, gt50: g.filter(x => x > 50).length }; };

(async () => {
  const browser = await launch(gpu, ['--enable-precise-memory-info']);
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await ctx.addInitScript(INIT);
  const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
  if (variant === 'pause') {
    let body = fs.readFileSync(path.join(ROOT, 'assets/goi-viet/map-surroundings-preview/natural/raster-scheduler-5.js'), 'utf8');
    const anchor = /if \(paused\(\)\) return;(\r?\n\s*)const started = performance\.now\(\);/; // source files use CRLF
    if (!anchor.test(body)) throw new Error('pause anchor not found');
    body = body.replace(anchor, (m, nl) => 'if (paused()) return;' + nl + 'if (view && view.moving && !holding()) { timer = setTimeout(tick, 16); return; }' + nl + 'const started = performance.now();');
    await page.route('**/raster-scheduler-5.js*', route => route.fulfill({ status: 200, contentType: 'text/javascript', body }));
  }
  await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Performance.enable'); await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval', { interval });
  if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  const out = { label, variant, target, cpu, gpu, chrome: browser.version(), interval, scenarios: {}, errors: [] };
  page.on('pageerror', e => out.errors.push(String(e).slice(0, 200)));
  const metrics = async () => { const m = await cdp.send('Performance.getMetrics'); const o = {}; m.metrics.forEach(x => o[x.name] = x.value); return o; };
  const scen = async (name, fn) => {
    await page.evaluate(() => { const M = window.__m; M.g = []; M.fn = {}; M.loaf = []; M.slow = []; M.on = true; });
    const m0 = await metrics(); await cdp.send('Profiler.start'); const w0 = Date.now(); let err = null;
    try { await fn(); } catch (e) { err = String(e).slice(0, 200); out.errors.push(name + ': ' + err); }
    const wall = Date.now() - w0; const { profile } = await cdp.send('Profiler.stop'); const m1 = await metrics();
    const o = await page.evaluate(() => { const M = window.__m; M.on = false; return { g: M.g, fn: M.fn, loaf: M.loaf, slow: M.slow }; });
    profile.__interval = interval; const a = analyzeProfile(profile);
    out.scenarios[name] = { wallMs: wall, err, frame: stats(o.g), cpuBusyPct: +(((m1.TaskDuration - m0.TaskDuration) * 1000) / wall * 100).toFixed(1), scriptMs: Math.round((m1.ScriptDuration - m0.ScriptDuration) * 1000), layoutMs: Math.round((m1.LayoutDuration - m0.LayoutDuration) * 1000), styleMs: Math.round((m1.RecalcStyleDuration - m0.RecalcStyleDuration) * 1000), layouts: m1.LayoutCount - m0.LayoutCount, styleRecalcs: m1.RecalcStyleCount - m0.RecalcStyleCount, profile: a, loaf: o.loaf.sort((a, b) => b.dur - a.dur).slice(0, 4), loafCount: o.loaf.length, slow: o.slow, wrapped: Object.fromEntries(Object.entries(o.fn).map(([k, v]) => [k, { n: v.n, ms: +v.ms.toFixed(1), max: +v.max.toFixed(1) }])) };
    const f = out.scenarios[name].frame;
    console.log(`${label} ${name}: wall=${wall}ms fps=${f?.fps} p95=${f?.p95} max=${f?.max} cpu=${out.scenarios[name].cpuBusyPct}% layout=${out.scenarios[name].layoutMs}ms style=${out.scenarios[name].styleMs}ms (${out.scenarios[name].layouts} layouts/${out.scenarios[name].styleRecalcs} recalcs) | top: ${a.topIncl.slice(0, 6).map(x => x[0].split(' @')[0] + '=' + x[1]).join(', ')}`);
  };
  await page.goto(BASE + target, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.GoiVietHomeIntro && !document.getElementById('btnHomeOpeningStart').disabled, null, { timeout: 600000 });
  await page.waitForTimeout(1500);
  await page.click('#btnHomeOpeningStart');
  await page.waitForFunction(() => document.getElementById('introScreen').dataset.homeOpening === 'complete', null, { timeout: 240000 });
  await page.waitForTimeout(3000);
  await page.evaluate(() => window.GoiVietMemoryChapter.begin()); await page.waitForTimeout(1500);
  for (let i = 0; i < 10; i++) { await page.mouse.move(800, 600); await page.mouse.wheel(0, 200); await page.waitForTimeout(120); }
  await page.waitForTimeout(600);
  await page.evaluate(() => { document.getElementById('memoryOpenMap').scrollIntoView(); document.getElementById('memoryOpenMap').click(); });
  await page.waitForFunction(() => { const i = document.getElementById('introScreen'), c = document.getElementById('memoryMapTransition'); return i.classList.contains('intro-hidden') && c && !/is-(covering|waiting|revealing)/.test(c.className); }, null, { timeout: 300000 });
  await page.waitForTimeout(3000);
  out.wrapNames = ['animateLoop', 'renderMainScene', 'flushMapInput', 'advanceMapCamera', 'renderDemoPlaceList', 'selectDemoPlace', 'renderSidebarTrackers', 'updateSessionHeaderUI', 'syncBackgroundInertAndRenderState'];
  await page.evaluate(n => window.__wrap(n), out.wrapNames);
  out.env = await page.evaluate(() => ({ journey: !!window.GoiVietJourneyPreview, journeyOwns: !!(window.GoiVietJourneyPreview && window.GoiVietJourneyPreview.ownsVehicles), regional: !!window.GoiVietRegionalPreview, terrain: !!(window.GoiVietWebGLTerrain3 && window.GoiVietWebGLTerrain3.usable && window.GoiVietWebGLTerrain3.usable()), places: document.querySelectorAll('#demoPlaceList .place-card').length, dom: document.getElementsByTagName('*').length }));
  console.log(label, 'env', JSON.stringify(out.env));
  const cx = Math.round(W * .36), cy = Math.round(H * .55);
  await scen('map-idle-3s', async () => { await page.waitForTimeout(3000); });
  await scen('drag-pan', async () => { await page.mouse.move(cx, cy); await page.mouse.down(); for (let i = 1; i <= 40; i++) { await page.mouse.move(cx + i * 6, cy + i * 3); await page.waitForTimeout(16); } await page.mouse.up(); await page.waitForTimeout(1000); });
  await scen('wheel-zoom', async () => { await page.mouse.move(cx, cy); for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, -240); await page.waitForTimeout(70); } await page.waitForTimeout(600); for (let i = 0; i < 8; i++) { await page.mouse.wheel(0, 240); await page.waitForTimeout(70); } await page.waitForTimeout(800); });
  await scen('rotate', async () => { await page.mouse.move(cx, cy); await page.mouse.down({ button: 'right' }); for (let i = 1; i <= 30; i++) { await page.mouse.move(cx - i * 7, cy + i); await page.waitForTimeout(16); } await page.mouse.up({ button: 'right' }); await page.waitForTimeout(700); });
  await scen('pitch-toggle', async () => { await page.click('.control-disclosure .dock-btn:has-text("Góc nhìn")'); await page.waitForTimeout(300); await page.click('#btnTogglePitch'); await page.waitForTimeout(1500); await page.click('#btnTogglePitch'); await page.waitForTimeout(1500); await page.keyboard.press('Escape'); });
  await scen('fly-hue-api', async () => { await page.evaluate(() => selectDemoPlace('hue')); await page.waitForTimeout(2500); });
  // real panel click: pick a non-selected card row and click it like a user would
  await scen('panel-click-place', async () => {
    const id = await page.evaluate(() => { const r = [...document.querySelectorAll('#demoPlaceList .place-compact-row')].find(x => !/hue/.test(x.closest('.place-card')?.id || '')); return r ? r.closest('.place-card').id : null; });
    out.panelClickedId = id; if (id) await page.click('#' + id + ' .place-compact-row', { timeout: 15000 });
    await page.waitForTimeout(2500);
  });
  await scen('drag-after-panel', async () => { await page.mouse.move(cx, cy); await page.mouse.down(); for (let i = 1; i <= 40; i++) { await page.mouse.move(cx - i * 6, cy - i * 3); await page.waitForTimeout(16); } await page.mouse.up(); await page.waitForTimeout(800); });
  fs.writeFileSync(path.join(outDir, `interaction-${label}.json`), JSON.stringify(out, null, 1));
  await browser.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
