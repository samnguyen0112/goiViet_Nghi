// Verify the deferred curtain artwork: not requested at the gate, armed after unlock, identical computed background to preview-4 once armed.
const { launch, BASE } = require('./lib.cjs');
(async () => {
  const out = {};
  for (const target of ['map-surroundings-preview-4.html', 'map-surroundings-preview-5.html']) {
    const b = await launch('real'); const ctx = await b.newContext({ viewport: { width: 1707, height: 1067 } }); const page = await ctx.newPage();
    const reqs = []; page.on('request', r => { if (/bay-water/.test(r.url())) reqs.push({ t: Date.now(), url: r.url().split('/').pop() }); });
    const bg = () => page.evaluate(() => { const d = document.querySelector('#memoryMapTransition > div'); const cs = getComputedStyle(d); return { image: cs.backgroundImage.replace(/^url\("?|"?\)$/g, '').split('/').pop(), color: cs.backgroundColor, size: cs.backgroundSize, pos: cs.backgroundPosition, armed: document.body.dataset.curtainArt || null }; });
    const t0 = Date.now();
    await page.goto(BASE + target, { waitUntil: 'load' });
    await page.waitForFunction(() => window.GoiVietHomeIntro && !document.getElementById('btnHomeOpeningStart').disabled, null, { timeout: 60000 });
    await page.waitForTimeout(1500);
    const atGate = { bg: await bg(), bayRequests: reqs.length };
    await page.click('#btnHomeOpeningStart'); await page.waitForFunction(() => document.getElementById('introScreen').dataset.homeOpening === 'complete', null, { timeout: 60000 }); await page.waitForTimeout(800);
    const atHome = { bg: await bg(), bayRequests: reqs.length };
    await page.evaluate(() => window.GoiVietMemoryChapter.begin()); await page.waitForTimeout(2000);
    const afterBegin = { bg: await bg(), bayRequests: reqs.length };
    await page.evaluate(() => { document.getElementById('memoryOpenMap').scrollIntoView(); document.getElementById('memoryOpenMap').click(); });
    await page.waitForFunction(() => { const i = document.getElementById('introScreen'), c = document.getElementById('memoryMapTransition'); return i.classList.contains('intro-hidden') && c && !/is-(covering|waiting|revealing)/.test(c.className); }, null, { timeout: 60000 });
    const afterMap = { bg: await bg(), bayRequests: reqs.length };
    out[target] = { atGate, atHome, afterBegin, afterMap, errors: [] };
    await b.close();
  }
  console.log(JSON.stringify(out, null, 1));
})();
