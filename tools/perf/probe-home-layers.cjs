// GD3 step 2: per-layer-kind main-thread cost of the home scene (instrumented draw()) and ablation (skip a kind => upper bound of what optimising it could give).
// Instrumentation is injected by route into renderer-5 for measurement only. The picture is WRONG in ablation runs.
// node tools/perf/probe-home-layers.cjs --cpu 4 --reps 2 --variants none,cloud,mountain+terrain,fixed,tree,leaf,smoke,bird,all
const { launch, BASE, fs, path, ROOT, summarize } = require('./lib.cjs');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const cpu = +arg('cpu', 4), reps = +arg('reps', 2), secs = +arg('secs', 6), target = arg('target', 'map-surroundings-preview-5.html');
const variants = arg('variants', 'none,cloud,mountain+terrain,fixed,tree,leaf,smoke,bird,all').split(',');
const HEAD = 'function draw(l,t,introTime){';
const FASTA = 'const enter=arrival(l,introTime);if(!enter.a)return;';
// Pixel-identical fast path: after the intro a static layer (no occluders) is drawn with save()/globalAlpha=1/identity transform/restore, all no-ops; skip them.
const FASTB = `const enter=arrival(l,introTime);if(!enter.a)return;if(introTime===null&&!(l.occlusion&&l.occlusion.length)&&l.kind!=='cloud'&&l.kind!=='tree'&&l.kind!=='bird'&&l.kind!=='leaf'&&l.kind!=='smoke'&&!(l.id==='train'&&l.spriteParts)){ctx.drawImage(im,x,y,w,h);return;}`;
const FAST = (arg('fast', '0') === '1');
const patch = src => {
  if (src.split(HEAD).length !== 2) throw new Error('draw anchor');
  if (FAST) { if (src.split(FASTA).length !== 2) throw new Error('fast anchor'); src = src.replace(FASTA, FASTB); }
  return src.replace(HEAD, 'function draw(l,t,introTime){const __k=l.kind,__S=window.__skip;if(__S&&__S.has(__k))return;const __t0=performance.now();try{return __draw(l,t,introTime);}finally{const A=(window.__lk=window.__lk||{});const e=A[__k]||(A[__k]={ms:0,n:0});e.ms+=performance.now()-__t0;e.n++;}}\n    function __draw(l,t,introTime){');
};
(async () => {
  const res = {};
  for (let r = 0; r < reps; r++) for (const v of variants) {
    const b = await launch('real'); const ctx = await b.newContext({ viewport: { width: 1707, height: 1067 }, deviceScaleFactor: 1 }); const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
    await cdp.send('Performance.enable'); await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
    await page.route('**/homepage-layered-renderer-5.js*', async route => { const resp = await route.fetch(); const h = { ...resp.headers() }; delete h['content-encoding']; delete h['content-length']; await route.fulfill({ status: 200, headers: h, body: patch(await resp.text()) }); });
    await page.addInitScript('window.__g=[];let l=0;const f=t=>{if(window.__on&&l)window.__g.push(t-l);l=t;requestAnimationFrame(f)};requestAnimationFrame(f);');
    await page.goto(BASE + target, { waitUntil: 'load', timeout: 600000 });
    await page.waitForFunction(() => window.GoiVietHomeIntro && !document.getElementById('btnHomeOpeningStart').disabled, null, { timeout: 600000 });
    await page.waitForTimeout(1200); await page.click('#btnHomeOpeningStart');
    await page.waitForFunction(() => document.getElementById('introScreen').dataset.homeOpening === 'complete', null, { timeout: 240000 });
    await page.waitForTimeout(2500);
    const kinds = v === 'none' ? [] : v === 'all' ? ['sky', 'mountain', 'terrain', 'fixed', 'cloud', 'tree', 'bird', 'leaf', 'smoke'] : v.split('+');
    await page.evaluate(k => { window.__skip = new Set(k); window.__lk = {}; window.__g = []; window.__on = true; }, kinds);
    const m = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(x => [x.name, x.value]));
    const m0 = await m(); const t0 = Date.now(); await page.waitForTimeout(secs * 1000); const wall = Date.now() - t0, m1 = await m();
    const o = await page.evaluate(() => { window.__on = false; const g = window.__g, s = [...g].sort((a, b) => a - b), sum = g.reduce((a, b) => a + b, 0); return { fps: +(1000 / (sum / g.length)).toFixed(1), p95: +s[Math.floor(s.length * .95)].toFixed(1), frames: g.length, lk: window.__lk }; });
    const row = { fps: o.fps, p95: o.p95, frames: o.frames, cpuPct: +(((m1.TaskDuration - m0.TaskDuration) * 1000) / wall * 100).toFixed(1), taskMs: Math.round((m1.TaskDuration - m0.TaskDuration) * 1000), lk: Object.fromEntries(Object.entries(o.lk).map(([k, e]) => [k, { ms: Math.round(e.ms), n: e.n }])) };
    (res[v] = res[v] || []).push(row);
    console.log(`[${v}#${r + 1}] fps=${row.fps} p95=${row.p95} cpu=${row.cpuPct}% task=${row.taskMs}ms | draw ms by kind: ${Object.entries(row.lk).map(([k, e]) => k + ':' + e.ms).join(' ')}`);
    await b.close();
  }
  console.log(`\n# home idle ${secs}s, CPU x${cpu}: medians over ${reps} runs`);
  for (const v of variants) { const R = res[v]; console.log(String(v).padEnd(18), 'fps', summarize(R.map(x => x.fps)).median, '| p95', summarize(R.map(x => x.p95)).median, '| cpu%', summarize(R.map(x => x.cpuPct)).median, '| task ms', summarize(R.map(x => x.taskMs)).median); }
  const base = res.none && res.none[0].lk; if (base) { console.log('\nper-kind draw() main-thread ms (baseline run 1):'); let tot = 0; for (const [k, e] of Object.entries(base).sort((a, b) => b[1].ms - a[1].ms)) { tot += e.ms; console.log('  ', k.padEnd(9), String(e.ms).padStart(6), 'ms', e.n, 'calls'); } console.log('   total  ', tot, 'ms'); }
  fs.writeFileSync(path.join(ROOT, `tools/perf/results/gd4/home-layers-x${cpu}.json`), JSON.stringify(res, null, 1));
})().catch(e => { console.error('FATAL', e); process.exit(1); });
