// GD0 section 0.7: fallback / robustness matrix on the baseline. Observes only; nothing in the site is edited.
// node tools/perf/fallback.cjs [--target map-surroundings-preview-4.html] [--only name1,name2]
const { fs, path, os, launch, BASE, ROOT } = require('./lib.cjs');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const target = arg('target', 'map-surroundings-preview-4.html'), only = arg('only', '') ? arg('only', '').split(',') : null;
const shotDir = path.join(os.tmpdir(), 'perf-shots'); fs.mkdirSync(shotDir, { recursive: true });
const FILE_URL = 'file:///' + path.join(ROOT, target).replace(/\\/g, '/');

async function toMap(page, R, { mapTimeout = 120000, gateTimeout = 120000 } = {}) {
  const t = Date.now();
  await page.waitForFunction(() => window.GoiVietHomeIntro && document.getElementById('btnHomeOpeningStart') && !document.getElementById('btnHomeOpeningStart').disabled, null, { timeout: gateTimeout });
  R.gateMs = Date.now() - t;
  await page.waitForTimeout(800);
  await page.click('#btnHomeOpeningStart');
  await page.waitForFunction(() => document.getElementById('introScreen').dataset.homeOpening === 'complete', null, { timeout: 180000 });
  await page.waitForTimeout(800);
  await page.evaluate(() => window.GoiVietMemoryChapter.begin()); await page.waitForTimeout(1200);
  for (let i = 0; i < 8; i++) { await page.mouse.move(800, 600); await page.mouse.wheel(0, 200); await page.waitForTimeout(100); }
  const t1 = Date.now();
  await page.evaluate(() => { document.getElementById('memoryOpenMap').scrollIntoView(); document.getElementById('memoryOpenMap').click(); });
  await page.waitForFunction(() => { const i = document.getElementById('introScreen'), c = document.getElementById('memoryMapTransition'); return i.classList.contains('intro-hidden') && c && !/is-(covering|waiting|revealing)/.test(c.className); }, null, { timeout: mapTimeout });
  R.enterMapMs = Date.now() - t1;
  await page.waitForTimeout(1500);
}
async function fps(page, ms = 2000) {
  return await page.evaluate(ms => new Promise(res => { const g = []; let l = 0, t0 = performance.now(); const f = t => { if (l) g.push(t - l); l = t; if (t - t0 < ms) requestAnimationFrame(f); else { const s = g.reduce((a, b) => a + b, 0); res({ frames: g.length, fps: g.length ? +(1000 / (s / g.length)).toFixed(1) : 0, max: Math.round(Math.max(0, ...g)) }); } }; requestAnimationFrame(f); }), ms);
}
const glState = page => page.evaluate(() => ({ terrain: window.GoiVietWebGLTerrain3 ? { usable: window.GoiVietWebGLTerrain3.usable(), ...(({ available, disabled, failed, lost, error }) => ({ available, disabled, failed, lost, error: error ? String(error).slice(0, 80) : null }))(window.GoiVietWebGLTerrain3.inspect()) } : null, raster: window.GoiVietRasterTasks ? (({ available, failed, fallback }) => ({ available, failed, fallback }))(window.GoiVietRasterTasks.inspect()) : null }));

const SCENARIOS = {
  'baseline-real-gpu': { gpu: 'real' },
  'swiftshader-x1': { gpu: 'swiftshader', mapTimeout: 240000 },
  'webgl-disabled': { gpu: 'nowebgl', mapTimeout: 240000 },
  'file-protocol': { gpu: 'real', url: FILE_URL },
  'missing-map-images': { gpu: 'real', route: ['**/map-art/hanoi-lake-illustration.png', '**/map-surroundings-preview/frame/reference-original.png'] },
  'external-images-blocked': { gpu: 'real', route: ['https://thumb.wikimedia.org/**'] },
  'missing-hydrology-data': { gpu: 'real', route: ['**/natural/hydrology-data.js*'] },
  'missing-islands-data': { gpu: 'real', route: ['**/natural/islands-data.js*'] },
  'worker-ctor-throws': { gpu: 'real', init: `window.Worker=function(){throw new Error('worker blocked by test')};` },
  'worker-error-event': { gpu: 'real', init: `(()=>{const OW=window.Worker;window.Worker=class extends OW{constructor(...a){super(...a);setTimeout(()=>this.dispatchEvent(new ErrorEvent('error',{message:'test worker error'})),300);}};})();` },
  'webgl-context-lost-restore': { gpu: 'real', after: 'contextLoss' },
  'tab-hidden-visible': { gpu: 'real', after: 'hiddenVisible' },
  'png-export': { gpu: 'real', after: 'pngExport' },
  'cache-cold-warm': { gpu: 'real', special: 'cache' }
};
(async () => {
  const results = {};
  for (const [name, sc] of Object.entries(SCENARIOS)) {
    if (only && !only.includes(name)) continue;
    const R = { name, ok: false, notes: [], console: [], pageErrors: [], failedReq: [] };
    const browser = await launch(sc.gpu, ['--enable-precise-memory-info']);
    try {
      const ctx = await browser.newContext({ viewport: { width: 1707, height: 1067 }, deviceScaleFactor: 1, acceptDownloads: true });
      if (sc.init) await ctx.addInitScript(sc.init);
      const page = await ctx.newPage();
      page.on('console', m => { if (['error', 'warning'].includes(m.type())) R.console.push(m.type() + ': ' + m.text().slice(0, 180)); });
      page.on('pageerror', e => R.pageErrors.push(String(e).slice(0, 220)));
      page.on('requestfailed', r => R.failedReq.push(r.url().slice(-90)));
      for (const pat of sc.route || []) await page.route(pat, r => r.abort());
      if (sc.special === 'cache') {
        const cdp = await ctx.newCDPSession(page); await cdp.send('Network.enable');
        let bytes = 0; cdp.on('Network.loadingFinished', e => { bytes += e.encodedDataLength; });
        const gate = async () => { const t = Date.now(); bytes = 0; await page.goto(BASE + target, { waitUntil: 'load' }); await page.waitForFunction(() => window.GoiVietHomeIntro && !document.getElementById('btnHomeOpeningStart').disabled, null, { timeout: 120000 }); return { ms: Date.now() - t, MB: +(bytes / 1048576).toFixed(2) }; };
        R.cold = await gate(); R.warm = await gate(); R.warm2 = await gate(); R.ok = true; R.notes.push('cold/warm/warm2 gate time + transferred MB (cache enabled, same context)');
      } else {
        await page.goto(sc.url || (BASE + target), { waitUntil: 'load', timeout: 120000 });
        R.gl = await page.evaluate(() => { const c = document.createElement('canvas'), g = c.getContext('webgl2') || c.getContext('webgl'), e = g && g.getExtension('WEBGL_debug_renderer_info'); return g ? (e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'webgl') : 'NO_WEBGL'; });
        await toMap(page, R, sc);
        R.state = await glState(page); R.fpsIdle = await fps(page, 1500);
        await page.screenshot({ path: path.join(shotDir, name + '.png') });
        R.ok = true;
        if (sc.after === 'contextLoss') {
          const info = await page.evaluate(async () => {
            const out = { canvases: 0, lost: 0 };
            for (const c of document.querySelectorAll('canvas')) { let g = null; try { g = c.getContext('webgl2') || c.getContext('webgl'); } catch (e) { } if (!g) continue; out.canvases++; const x = g.getExtension('WEBGL_lose_context'); if (x) { x.loseContext(); out.lost++; c.__x = x; } }
            await new Promise(r => setTimeout(r, 1500)); out.afterLost = window.GoiVietWebGLTerrain3 ? window.GoiVietWebGLTerrain3.inspect().lost : null;
            for (const c of document.querySelectorAll('canvas')) if (c.__x) c.__x.restoreContext();
            await new Promise(r => setTimeout(r, 2500)); out.afterRestore = window.GoiVietWebGLTerrain3 ? { usable: window.GoiVietWebGLTerrain3.usable(), lost: window.GoiVietWebGLTerrain3.inspect().lost } : null; return out;
          });
          R.contextLoss = info; R.fpsAfter = await fps(page, 1500); await page.screenshot({ path: path.join(shotDir, name + '-after.png') });
          R.ok = info.lost > 0 && !!R.fpsAfter.frames;
        }
        if (sc.after === 'hiddenVisible') {
          await page.evaluate(() => { Object.defineProperty(document, 'hidden', { get: () => true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
          await page.waitForTimeout(2500);
          await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
          await page.waitForTimeout(1500); R.fpsAfter = await fps(page, 1500); R.notes.push('visibility emulated by overriding document.hidden + visibilitychange (headless cannot truly hide a tab)');
        }
        if (sc.after === 'pngExport') {
          await page.evaluate(() => { openPostcardModal(); }); await page.waitForTimeout(2500);
          const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 60000 }), page.click('#btnDownloadPostcardPng')]);
          const p = await dl.path(); R.png = { file: dl.suggestedFilename(), bytes: p ? fs.statSync(p).size : 0 };
          R.pngStatus = await page.evaluate(() => (document.getElementById('postcardExportStatus') || {}).textContent);
          R.ok = R.png.bytes > 10000;
        }
      }
    } catch (e) { R.err = String(e).slice(0, 300); R.ok = false; }
    R.console = [...new Set(R.console)].slice(0, 8); R.failedReq = R.failedReq.slice(0, 8);
    results[name] = R;
    console.log(`${R.ok ? 'PASS' : 'FAIL'} ${name}: gl=${R.gl} gate=${R.gateMs}ms enter=${R.enterMapMs}ms fps=${R.fpsIdle?.fps} terrain=${JSON.stringify(R.state?.terrain)} raster=${JSON.stringify(R.state?.raster)} errs=${R.pageErrors.length} console=${R.console.length} ${R.err || ''}`);
    await browser.close();
  }
  fs.writeFileSync(path.join(ROOT, 'tools/perf/results/gd0/fallback-' + target.replace('.html', '') + (only ? '-partial' : '') + '.json'), JSON.stringify(results, null, 1));
})().catch(e => { console.error('FATAL', e); process.exit(1); });
