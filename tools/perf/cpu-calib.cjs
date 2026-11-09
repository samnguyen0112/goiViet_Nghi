// Does Emulation.setCPUThrottlingRate give a consistent slowdown factor? Synthetic CPU-bound + memory-bound loops
// measured at several throttle rates, repeated in two passes to expose drift. node tools/perf/cpu-calib.cjs
const { fs, path, launch, ROOT, summarize } = require('./lib.cjs');
const RATES = [1, 2, 4, 6];
const BENCH = `(() => {
  const cpuLoop = () => { let s = 0; for (let i = 0; i < 12e6; i++) s += Math.sqrt(i) * 1.0000001; return s; };
  const memLoop = () => { const a = new Float64Array(2e6); for (let i = 0; i < a.length; i++) a[i] = i * .5; let s = 0; for (let k = 0; k < 4; k++) for (let i = 0; i < a.length; i += 3) s += a[i]; return s; };
  const t = f => { const a = performance.now(); f(); return performance.now() - a; };
  const out = { cpu: [], mem: [] };
  for (let i = 0; i < 9; i++) { out.cpu.push(t(cpuLoop)); out.mem.push(t(memLoop)); }
  return out;
})()`;
(async () => {
  const browser = await launch('real');
  const res = { passes: [] };
  for (let pass = 1; pass <= 2; pass++) {
    const row = {};
    for (const rate of RATES) {
      const ctx = await browser.newContext(); const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
      await page.goto('about:blank');
      await cdp.send('Emulation.setCPUThrottlingRate', { rate });
      const o = await page.evaluate(BENCH);
      row[rate] = { cpu: summarize(o.cpu), mem: summarize(o.mem) };
      await ctx.close();
    }
    for (const rate of RATES) {
      row[rate].cpuFactor = +(row[rate].cpu.median / row[1].cpu.median).toFixed(2);
      row[rate].memFactor = +(row[rate].mem.median / row[1].mem.median).toFixed(2);
    }
    res.passes.push(row);
  }
  fs.writeFileSync(path.join(ROOT, 'tools/perf/results/gd0/cpu-calib.json'), JSON.stringify(res, null, 1));
  console.log('rate | pass | cpuLoop median ms (cv%) factor | memLoop median ms (cv%) factor');
  res.passes.forEach((row, i) => RATES.forEach(r => console.log(`x${r} | ${i + 1} | ${row[r].cpu.median} (${row[r].cpu.cvPct}) x${row[r].cpuFactor} | ${row[r].mem.median} (${row[r].mem.cvPct}) x${row[r].memFactor}`)));
  await browser.close();
})();
