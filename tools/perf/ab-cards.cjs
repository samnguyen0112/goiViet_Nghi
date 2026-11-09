// GD6: card-flow cost before/after merging the card design into preview-5. Interleaved fresh browsers.
// node tools/perf/ab-cards.cjs --a map-surroundings-gd6tmp-before.html --b map-surroundings-preview-5.html --n 10 --cpu 1
// Phases: open deck modal (sync handler + style/layout recalcs over 1 s), draw a card (frame stats until the card is active), flip/open the connection.
const { fs, path, launch, BASE, ROOT, summarize } = require('./lib.cjs');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const A = arg('a'), B = arg('b'), N = +arg('n', 10), cpu = +arg('cpu', 1), out = path.join(ROOT, 'tools/perf/results/gd6/cards', `ab-cards-x${cpu}.json`);
const SAMPLER = `window.__cs={g:[],last:0,on:false,loaf:[]};(function f(t){if(window.__cs.on&&window.__cs.last)window.__cs.g.push(t-window.__cs.last);window.__cs.last=window.__cs.on?t:0;requestAnimationFrame(f)})(0);
try{new PerformanceObserver(l=>{for(const e of l.getEntries())if(window.__cs.on)window.__cs.loaf.push(e.duration)}).observe({type:'long-animation-frame',buffered:false})}catch(e){}`;
async function one(target) {
  const b = await launch('real'); const ctx = await b.newContext({ viewport: { width: 1707, height: 1067 }, deviceScaleFactor: 1 }); const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
  await cdp.send('Performance.enable'); const R = { errors: [] }; page.on('pageerror', e => R.errors.push(String(e.message).slice(0, 120)));
  await page.goto(BASE + target, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.GoiVietHomeIntro && document.getElementById('deckModal'), null, { timeout: 600000 });
  await page.evaluate(() => { window.GoiVietHomeIntro.skip(); closeIntroModal(); state.reducedMotion = false; document.body.classList.remove('reduced-motion'); });
  await page.waitForTimeout(2500);
  if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  await page.evaluate(SAMPLER);
  const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
  const frames = () => page.evaluate(() => { const s = window.__cs, g = s.g.slice(), t = g.reduce((a, c) => a + c, 0), so = g.slice().sort((a, c) => a - c); s.g = []; s.loaf = s.loaf.splice(0); return { n: g.length, fps: t ? g.length / (t / 1000) : null, p95: so.length ? so[Math.floor((so.length - 1) * .95)] : null, max: so.length ? so[so.length - 1] : null, gt50: g.filter(x => x > 50).length }; });
  // ---- open
  let m0 = await metrics();
  R.openSyncMs = await page.evaluate(() => { const t = performance.now(); openDeckModal('hn'); return performance.now() - t; });
  await page.waitForTimeout(1000); let m1 = await metrics();
  R.openStyleMs = (m1.RecalcStyleDuration - m0.RecalcStyleDuration) * 1000; R.openLayoutMs = (m1.LayoutDuration - m0.LayoutDuration) * 1000; R.openLayouts = m1.LayoutCount - m0.LayoutCount;
  // ---- draw (real animation)
  await page.evaluate(() => { window.__cs.on = true; window.__cs.g = []; window.__cs.last = 0; });
  const t0 = Date.now();
  await page.evaluate(() => { window.__t0 = performance.now(); document.getElementById('btnDrawCard').click(); });
  await page.waitForFunction(() => !!state.activeCard, null, { timeout: 20000, polling: 20 });
  R.drawActiveMs = await page.evaluate(() => performance.now() - window.__t0);
  await page.waitForTimeout(400);
  const dr = await frames(); R.drawFps = dr.fps; R.drawP95 = dr.p95; R.drawMax = dr.max; R.drawGt50 = dr.gt50;
  // ---- flip / open connection
  await page.evaluate(() => { window.__cs.g = []; window.__cs.last = 0; });
  R.flipSyncMs = await page.evaluate(() => { const t = performance.now(); flipCardToBack(); return performance.now() - t; });
  await page.waitForTimeout(900);
  const fl = await frames(); R.flipFps = fl.fps; R.flipP95 = fl.p95; R.flipMax = fl.max; R.flipGt50 = fl.gt50;
  R.heapMB = (await metrics()).JSHeapUsedSize / 1048576;
  await b.close(); return R;
}
(async () => {
  const runs = { a: [], b: [] };
  for (let i = 0; i < N; i++) for (const k of (i % 2 ? ['b', 'a'] : ['a', 'b'])) { try { runs[k].push(await one(k === 'a' ? A : B)); } catch (e) { console.log('run failed', k, String(e.message).slice(0, 120)); } process.stdout.write(`${i + 1}${k} `); }
  console.log('');
  fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, JSON.stringify({ A, B, cpu, runs }, null, 1));
  for (const key of ['openSyncMs', 'openStyleMs', 'openLayoutMs', 'openLayouts', 'drawActiveMs', 'drawFps', 'drawP95', 'drawMax', 'drawGt50', 'flipSyncMs', 'flipFps', 'flipP95', 'flipMax', 'flipGt50', 'heapMB']) {
    const x = summarize(runs.a.map(r => r[key])), y = summarize(runs.b.map(r => r[key]));
    console.log(key.padEnd(13), 'before', String(x && x.median).padStart(8), `[${x && x.q1}-${x && x.q3}]`, ' after', String(y && y.median).padStart(8), `[${y && y.q1}-${y && y.q3}]`);
  }
  console.log('errors', runs.a.reduce((s, r) => s + r.errors.length, 0), runs.b.reduce((s, r) => s + r.errors.length, 0));
})();
