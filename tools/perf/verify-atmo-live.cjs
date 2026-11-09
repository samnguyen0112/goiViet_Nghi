// Live bit-identity check of renderer-5's prefix cache: after every mask update, recompute the ORIGINAL per-pixel loop into a reference array
// and count alpha bytes that differ. The check code is injected by route into a throw-away copy only (never shipped).
// node tools/perf/verify-atmo-live.cjs --cpu 1 --reps 1
const { launch, BASE, fs, path, ROOT } = require('./lib.cjs');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const cpu = +arg('cpu', 1), reps = +arg('reps', 1), target = arg('target', 'map-surroundings-preview-5.html');
const ANCHOR = 'f.putImageData(field,0,0);';
const CHECK = '{const __r=new Uint8ClampedArray(n);for(let p=0;p<n;p++){let v=0;for(let i=0;i<weights.length;i++)v+=weights[i][p]*gains[i];__r[p]=Math.round(255*(1-v));}let bad=0;const dd=field.data;for(let p=0;p<n;p++)if(dd[p*4+3]!==__r[p])bad++;const C=(window.__atmCheck=window.__atmCheck||{frames:0,badFrames:0,badPixels:0,prefixMax:0,pixels:n});C.frames++;if(bad){C.badFrames++;C.badPixels+=bad;}C.prefixMax=Math.max(C.prefixMax,atmospherePrefix.length);}';
(async () => {
  const out = [];
  for (let r = 0; r < reps; r++) {
    const b = await launch('real'); const ctx = await b.newContext({ viewport: { width: 1707, height: 1067 }, deviceScaleFactor: 1 }); const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
    await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
    await page.route('**/homepage-layered-renderer-5.js*', async route => {
      const resp = await route.fetch(); const src = await resp.text();
      if (src.split(ANCHOR).length !== 2) throw new Error('anchor not unique');
      const h = { ...resp.headers() }; delete h['content-encoding']; delete h['content-length'];
      await route.fulfill({ status: 200, headers: h, body: src.replace(ANCHOR, CHECK + ANCHOR) });
    });
    await page.goto(BASE + target, { waitUntil: 'load', timeout: 600000 });
    await page.waitForFunction(() => window.GoiVietHomeIntro && !document.getElementById('btnHomeOpeningStart').disabled, null, { timeout: 600000 });
    await page.waitForTimeout(1500); await page.click('#btnHomeOpeningStart');
    await page.waitForFunction(() => document.getElementById('introScreen').dataset.homeOpening === 'complete', null, { timeout: 240000 });
    const c = await page.evaluate(() => window.__atmCheck); out.push(c);
    console.log(`x${cpu} run ${r + 1}: mask updates checked=${c && c.frames}, updates with any differing byte=${c && c.badFrames}, differing bytes=${c && c.badPixels}, mask pixels=${c && c.pixels}, longest cached prefix=${c && c.prefixMax} layers`);
    await b.close();
  }
  fs.writeFileSync(path.join(ROOT, `tools/perf/results/gd3/atmo-live-check-x${cpu}.json`), JSON.stringify(out, null, 1));
  process.exit(out.some(c => !c || c.badFrames || !c.frames) ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
