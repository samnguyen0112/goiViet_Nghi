// Pixel difference between the original per-layer drawing and the static-run cache (renderer-6), measured on the real scene canvas.
// For several scene times t: render(t) with the cache off, render(t) with it on, and render(t) with it off again (noise control), all in ONE task, then diff canvas pixels.
// node tools/perf/verify-run-cache.cjs [--cpu 1] [--candidate assets/goi-viet/homepage-layered-renderer-6.js]
const { launch, BASE, fs, path, ROOT } = require('./lib.cjs');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const cpu = +arg('cpu', 1), candidate = arg('candidate', 'assets/goi-viet/homepage-layered-renderer-6.js'), target = arg('target', 'map-surroundings-preview-5.html');
const INIT = `(()=>{let L;Object.defineProperty(window,'LandscapeLab',{configurable:true,get(){return L},set(v){const c=v.create;v.create=async function(canvas,...a){const e=await c.call(this,canvas,...a);window.__eng=e;window.__sceneCanvas=canvas;return e;};L=v;}});})();`;
(async () => {
  const b = await launch('real'); const ctx = await b.newContext({ viewport: { width: 1707, height: 1067 }, deviceScaleFactor: 1 }); const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
  if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  await ctx.addInitScript(INIT);
  const code = fs.readFileSync(path.resolve(ROOT, candidate), 'utf8');
  await page.route('**/homepage-layered-renderer-5.js*', route => route.fulfill({ status: 200, contentType: 'text/javascript', body: code }));
  await page.goto(BASE + target, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.GoiVietHomeIntro && !document.getElementById('btnHomeOpeningStart').disabled, null, { timeout: 600000 });
  await page.waitForTimeout(1200); await page.click('#btnHomeOpeningStart');
  await page.waitForFunction(() => document.getElementById('introScreen').dataset.homeOpening === 'complete', null, { timeout: 240000 });
  await page.waitForTimeout(2000);
  const res = await page.evaluate(async () => {
    const e = window.__eng, cv = window.__sceneCanvas; if (!e || !cv) return { error: 'engine not captured' };
    // Do NOT getImageData() the scene canvas: repeated read-backs make Chrome switch it from GPU to CPU rendering, which itself changes the pixels.
    // createImageBitmap() snapshots it at call time without a read-back; the bitmap is then read from a separate scratch canvas.
    const scratch = document.createElement('canvas'); scratch.width = cv.width; scratch.height = cv.height; const sg = scratch.getContext('2d', { willReadFrequently: true });
    const readBitmap = bm => { sg.clearRect(0, 0, scratch.width, scratch.height); sg.drawImage(bm, 0, 0); return new Uint8ClampedArray(sg.getImageData(0, 0, scratch.width, scratch.height).data); };
    const cmp = (a, b) => { let n = 0, max = 0; const h = { 1: 0, 2: 0, 3: 0, '4+': 0 }; for (let i = 0; i < a.length; i += 4) { const d = Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2])); if (d) { n++; if (d > max) max = d; h[d >= 4 ? '4+' : d]++; } } return { diffPixels: n, pct: +(n / (a.length / 4) * 100).toFixed(4), maxChannelDiff: max, hist: h }; };
    const out = { canvas: [cv.width, cv.height], times: [] };
    // birds are drawn by the WebGL crane flight, which follows the wall clock rather than t: switch them off so only the static layers are compared
    for (const l of e.manifest.layers) if (l.kind === 'bird') e.enabled.delete(l.id);
    for (const T of [3.7, 11.2, 23.9, 41.5, 77.3]) {
      window.__noRunCache = true; e.render(T, {}); const pA = createImageBitmap(cv);
      window.__noRunCache = false; e.render(T, {}); const pB = createImageBitmap(cv);
      window.__noRunCache = true; e.render(T, {}); const pA2 = createImageBitmap(cv);
      const [bA, bB, bA2] = await Promise.all([pA, pB, pA2]); const A = readBitmap(bA), B = readBitmap(bB), A2 = readBitmap(bA2);
      out.times.push({ t: T, offVsOff: cmp(A, A2), offVsOn: cmp(A, B) });
    }
    window.__noRunCache = false; return out;
  });
  console.log(JSON.stringify(res, null, 1));
  fs.writeFileSync(path.join(ROOT, `tools/perf/results/gd4/run-cache-diff-x${cpu}.json`), JSON.stringify(res, null, 1));
  await b.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
