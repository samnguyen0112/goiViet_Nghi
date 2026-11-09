// Visual regression harness (pre-condition for any CSS refactor): capture key UI states in both themes, then pixel-diff two captures.
// A/A noise floor: node tools/perf/visual-states.cjs --a map-surroundings-preview-4.html --b map-surroundings-preview-4.html
// Candidate check:  node tools/perf/visual-states.cjs --a map-surroundings-preview-4.html --b map-surroundings-preview-5.html
// Reports, per state, the share of pixels whose max channel difference exceeds 16 and 64. Screenshots go to the OS temp dir (perf-shots).
const { launch, BASE, fs, os, path } = require('./lib.cjs');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const A = arg('a', 'map-surroundings-preview-4.html'), B = arg('b', 'map-surroundings-preview-4.html'), cpu = +arg('cpu', 1), variantB = arg('variantB', 'direct'), variantA = arg('variantA', 'direct'); // variantB=has: rewrite :has(#introScreen.intro-hidden) -> .gv-map-open via route (experiment)
const dir = path.join(os.tmpdir(), 'perf-shots'); fs.mkdirSync(dir, { recursive: true });
async function capture(target, tag, variant = 'direct') {
  const b = await launch('real'); const ctx = await b.newContext({ viewport: { width: 1707, height: 1067 }, deviceScaleFactor: 1 }); const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
  if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  if (variant === 'passthru') {
    await page.route('**/*', async route => { const u = route.request().url(); if (!u.startsWith(BASE) || !/(\.css|\.html)(\?|$)/.test(u)) return route.continue(); const resp = await route.fetch(); const body = await resp.text(); const h = { ...resp.headers() }; delete h['content-encoding']; delete h['content-length']; await route.fulfill({ status: resp.status(), headers: h, body }); });
  }
  if (variant === 'hassync' || variant === 'hassync2') { // hassync2 keeps the specificity of :has(#id.class) = (1,1,0) via .gv-map-open:not(#gvNone)
    await page.route('**/*', async route => { const u = route.request().url(); if (!u.startsWith(BASE) || !/(\.css|\.html)(\?|$)/.test(u)) return route.continue(); const resp = await route.fetch(); let body = (await resp.text()).split(':has(#introScreen.intro-hidden)').join(variant === 'hassync2' ? '.gv-map-open:not(#gvNone)' : '.gv-map-open'); if (/\.html(\?|$)/.test(u)) { const add = "intro.classList.add('intro-hidden');", rem = "intro.classList.remove('intro-hidden');"; if (body.split(add).length !== 2 || body.split(rem).length !== 2) throw new Error('intro-hidden writers not unique'); body = body.replace(add, add + " document.body.classList.add('gv-map-open');").replace(rem, rem + " document.body.classList.remove('gv-map-open');"); } const h = { ...resp.headers() }; delete h['content-encoding']; delete h['content-length']; await route.fulfill({ status: resp.status(), headers: h, body }); });
  }
  if (variant === 'has') {
    await ctx.addInitScript(`(()=>{const sync=()=>{const i=document.getElementById('introScreen');if(i&&document.body)document.body.classList.toggle('gv-map-open',i.classList.contains('intro-hidden'));};document.addEventListener('DOMContentLoaded',()=>{const i=document.getElementById('introScreen');sync();new MutationObserver(sync).observe(i,{attributes:true,attributeFilter:['class']});});})();`);
    await page.route('**/*', async route => { const u = route.request().url(); if (!u.startsWith(BASE) || !/(\.css|\.html)(\?|$)/.test(u)) return route.continue(); const resp = await route.fetch(); const body = (await resp.text()).split(':has(#introScreen.intro-hidden)').join('.gv-map-open'); const h = { ...resp.headers() }; delete h['content-encoding']; delete h['content-length']; await route.fulfill({ status: resp.status(), headers: h, body }); });
  }
  const shots = {}; const snap = async name => { const buf = await page.screenshot(); fs.writeFileSync(path.join(dir, `vis-${tag}-${name}.png`), buf); shots[name] = buf.toString('base64'); };
  await page.goto(BASE + target, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.GoiVietHomeIntro && !document.getElementById('btnHomeOpeningStart').disabled, null, { timeout: 600000 });
  await page.waitForTimeout(1500); await snap('1-gate');
  await page.click('#btnHomeOpeningStart'); await page.waitForFunction(() => document.getElementById('introScreen').dataset.homeOpening === 'complete', null, { timeout: 180000 }); await page.waitForTimeout(1200); await snap('2-home');
  await page.evaluate(() => window.GoiVietMemoryChapter.begin()); await page.waitForTimeout(2500); await snap('3-memory-top');
  await page.evaluate(() => { document.getElementById('memoryOpenMap').scrollIntoView(); document.getElementById('memoryOpenMap').click(); });
  await page.waitForFunction(() => { const i = document.getElementById('introScreen'), c = document.getElementById('memoryMapTransition'); return i.classList.contains('intro-hidden') && c && !/is-(covering|waiting|revealing)/.test(c.className); }, null, { timeout: 300000 });
  await page.waitForTimeout(7000); await snap('4-map-light');
  await page.evaluate(() => selectDemoPlace('hue')); await page.waitForTimeout(4000); await snap('5-map-panel-hue');
  await page.evaluate(() => toggleMaterialTheme()); await page.waitForTimeout(5000); await snap('6-map-dark');
  await page.evaluate(() => toggleMaterialTheme()); await page.waitForTimeout(3000);
  await page.click('#tabScopeAll').catch(() => {}); await page.waitForTimeout(1500); await snap('7-map-scope-all');
  await b.close(); return shots;
}
(async () => {
  const sa = await capture(A, 'A', variantA), sb = await capture(B, 'B', variantB);
  const b = await launch('real'); const page = await (await b.newContext()).newPage(); await page.goto('about:blank');
  const diff = (x, y) => page.evaluate(async ([p, q]) => {
    const load = d => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + d; });
    const [I, J] = await Promise.all([load(p), load(q)]); const cv = document.createElement('canvas'); cv.width = I.width; cv.height = I.height; const g = cv.getContext('2d', { willReadFrequently: true });
    g.drawImage(I, 0, 0); const a = g.getImageData(0, 0, cv.width, cv.height).data; g.clearRect(0, 0, cv.width, cv.height); g.drawImage(J, 0, 0); const c = g.getImageData(0, 0, cv.width, cv.height).data;
    let n16 = 0, n64 = 0, minX = 1e9, minY = 1e9, maxX = -1, maxY = -1; const W = cv.width;
    for (let i = 0; i < a.length; i += 4) { const d = Math.max(Math.abs(a[i] - c[i]), Math.abs(a[i + 1] - c[i + 1]), Math.abs(a[i + 2] - c[i + 2])); if (d > 16) { n16++; const px = (i / 4) % W, py = Math.floor(i / 4 / W); if (px < minX) minX = px; if (px > maxX) maxX = px; if (py < minY) minY = py; if (py > maxY) maxY = py; } if (d > 64) n64++; }
    const total = a.length / 4; return { pctOver16: +(n16 / total * 100).toFixed(3), pctOver64: +(n64 / total * 100).toFixed(3), bbox: n16 ? [minX, minY, maxX, maxY] : null };
  }, [x, y]);
  console.log(`# visual diff ${A} vs ${B}${variantB !== 'direct' ? ' [' + variantB + ']' : ''} (cpu x${cpu})`);
  const rows = {};
  for (const k of Object.keys(sa)) { rows[k] = await diff(sa[k], sb[k]); console.log(k.padEnd(18), JSON.stringify(rows[k])); }
  fs.writeFileSync(path.join(__dirname, 'results', 'gd2', `visual-${A.replace('.html', '')}-vs-${B.replace('.html', '')}${variantB !== 'direct' ? '-' + variantB : ''}.json`), JSON.stringify(rows, null, 1));
  await b.close();
})().catch(e => { console.error('FATAL', e); process.exit(1); });
