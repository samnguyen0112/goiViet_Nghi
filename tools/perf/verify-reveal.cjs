// Is the map shown at reveal complete, and does preview-5 end in the same picture as preview-4?
// For each target: enter the map, screenshot right after the curtain clears (S0) and again 6 s later (S1); then pixel-diff S0 vs S1 (still refining?)
// and p4.S1 vs p5.S1 (same final map?). Diff is computed in a browser canvas: share of pixels whose max channel difference exceeds 16.
// node tools/perf/verify-reveal.cjs --cpu 4 [--targets map-surroundings-preview-4.html,map-surroundings-preview-5.html]
const { launch, BASE, fs, os, path } = require('./lib.cjs');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const cpu = +arg('cpu', 4), targets = arg('targets', 'map-surroundings-preview-4.html,map-surroundings-preview-5.html').split(',');
const out = path.join(os.tmpdir(), 'perf-shots'); fs.mkdirSync(out, { recursive: true });
async function capture(target) {
  const b = await launch('real'); const ctx = await b.newContext({ viewport: { width: 1707, height: 1067 }, deviceScaleFactor: 1 }); const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  await page.goto(BASE + target, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.GoiVietHomeIntro && !document.getElementById('btnHomeOpeningStart').disabled, null, { timeout: 600000 });
  await page.waitForTimeout(1200); await page.click('#btnHomeOpeningStart');
  await page.waitForFunction(() => document.getElementById('introScreen').dataset.homeOpening === 'complete', null, { timeout: 180000 }); await page.waitForTimeout(800);
  await page.evaluate(() => window.GoiVietMemoryChapter.begin()); await page.waitForTimeout(1500);
  await page.evaluate(() => { document.getElementById('memoryOpenMap').scrollIntoView(); document.getElementById('memoryOpenMap').click(); });
  await page.waitForFunction(() => { const i = document.getElementById('introScreen'), c = document.getElementById('memoryMapTransition'); return i.classList.contains('intro-hidden') && c && !/is-(covering|waiting|revealing)/.test(c.className); }, null, { timeout: 300000 });
  await page.waitForTimeout(300);
  const pw0 = await page.evaluate(() => window.GoiVietMapPrewarm3.inspect());
  const s0 = (await page.screenshot()).toString('base64');
  await page.waitForTimeout(6000);
  const s1 = (await page.screenshot()).toString('base64');
  await b.close();
  fs.writeFileSync(path.join(out, `reveal-${target.replace('.html', '')}-x${cpu}-S0.png`), Buffer.from(s0, 'base64'));
  fs.writeFileSync(path.join(out, `reveal-${target.replace('.html', '')}-x${cpu}-S1.png`), Buffer.from(s1, 'base64'));
  return { s0, s1, wait: pw0.lastCurtainWaitMs };
}
(async () => {
  const shots = {};
  for (const t of targets) { shots[t] = await capture(t); console.log(t, 'curtain wait', shots[t].wait, 'ms'); }
  const b = await launch('real'); const page = await (await b.newContext()).newPage(); await page.goto('about:blank');
  const diff = async (a, c) => page.evaluate(async ([x, y]) => {
    const load = d => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + d; });
    const [A, B] = await Promise.all([load(x), load(y)]); const cv = document.createElement('canvas'); cv.width = A.width; cv.height = A.height; const g = cv.getContext('2d', { willReadFrequently: true });
    g.drawImage(A, 0, 0); const da = g.getImageData(0, 0, cv.width, cv.height).data; g.clearRect(0, 0, cv.width, cv.height); g.drawImage(B, 0, 0); const db = g.getImageData(0, 0, cv.width, cv.height).data;
    let n = 0, big = 0; const total = da.length / 4; for (let i = 0; i < da.length; i += 4) { const d = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2])); if (d > 16) n++; if (d > 64) big++; }
    return { pctOver16: +(n / total * 100).toFixed(3), pctOver64: +(big / total * 100).toFixed(3) };
  }, [a, c]);
  for (const t of targets) console.log(`${t}: S0 (just after reveal) vs S1 (+6 s) ->`, JSON.stringify(await diff(shots[t].s0, shots[t].s1)));
  if (targets.length === 2) { console.log('final maps, ' + targets[0] + ' S1 vs ' + targets[1] + ' S1 ->', JSON.stringify(await diff(shots[targets[0]].s1, shots[targets[1]].s1))); console.log('S0 vs S0 ->', JSON.stringify(await diff(shots[targets[0]].s0, shots[targets[1]].s0))); }
  await b.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
