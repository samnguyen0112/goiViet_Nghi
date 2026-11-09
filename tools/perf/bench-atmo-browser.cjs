// In-browser micro-benchmark of drawAtmosphere variants (real data sizes, CPU throttle like the page runs). All variants must produce identical alpha bytes.
// node tools/perf/bench-atmo-browser.cjs --cpu 4
const { launch, fs, path, ROOT } = require('./lib.cjs');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const cpu = +arg('cpu', 4);
const BENCH = `(() => {
  const n = 142560, K = 7, M = 4; // 7 non-zero layers, first 4 fully revealed (typical mid-intro frame)
  let s = 123456789; const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  const raw = Array.from({ length: K }, () => new Float32Array(n)); for (let p = 0; p < n; p++) { let t = 0; const v = Array.from({ length: K }, () => rnd()); for (const x of v) t += x; for (let i = 0; i < K; i++) raw[i][p] = v[i] / t; }
  const weights = raw, gains = [1, 1, 1, 1, .62, .35, .08];
  const field = new ImageData(480, 297); const data = field.data;
  const original = () => { for (let p = 0; p < n; p++) { let v = 0; for (let i = 0; i < weights.length; i++) v += weights[i][p] * gains[i]; data[p * 4 + 3] = Math.round(255 * (1 - v)); } };
  const acc = new Float64Array(n); for (let i = 0; i < M; i++) { const w = weights[i]; for (let p = 0; p < n; p++) acc[p] += w[p] * 1; }
  const shipped = () => { const a = acc, d = data, count = weights.length, m = M; for (let p = 0; p < n; p++) { let v = a[p]; for (let j = m; j < count; j++) v += weights[j][p] * gains[j]; d[p * 4 + 3] = Math.round(255 * (1 - v)); } };
  const tmp = new Float64Array(n);
  const layerMajor = () => { tmp.set(acc); for (let j = M; j < weights.length; j++) { const w = weights[j], g = gains[j]; for (let p = 0; p < n; p++) tmp[p] += w[p] * g; } const d = data; for (let p = 0; p < n; p++) d[p * 4 + 3] = Math.round(255 * (1 - tmp[p])); };
  const w4 = weights[M], w5 = weights[M + 1], w6 = weights[M + 2], g4 = gains[M], g5 = gains[M + 1], g6 = gains[M + 2];
  const fused3 = () => { const a = acc, d = data; for (let p = 0; p < n; p++) { const v = a[p] + w4[p] * g4 + w5[p] * g5 + w6[p] * g6; d[p * 4 + 3] = Math.round(255 * (1 - v)); } };
  const fused3NoRound = () => { const a = acc, d = data; for (let p = 0; p < n; p++) { const v = a[p] + w4[p] * g4 + w5[p] * g5 + w6[p] * g6; d[p * 4 + 3] = (255 * (1 - v) + 0.5) | 0; } };
  // exact Math.round for x >= 0 (and any x after Uint8ClampedArray clamping): floor via |0, then compare the (exactly representable) fraction with 0.5
  const originalExact = () => { for (let p = 0; p < n; p++) { let v = 0; for (let i = 0; i < weights.length; i++) v += weights[i][p] * gains[i]; const x = 255 * (1 - v), f = x | 0; data[p * 4 + 3] = f + (x - f >= 0.5 ? 1 : 0); } };
  const shippedExact = () => { const a = acc, d = data, count = weights.length, m = M; for (let p = 0; p < n; p++) { let v = a[p]; for (let j = m; j < count; j++) v += weights[j][p] * gains[j]; const x = 255 * (1 - v), f = x | 0; d[p * 4 + 3] = f + (x - f >= 0.5 ? 1 : 0); } };
  const layerMajorExact = () => { tmp.set(acc); for (let j = M; j < weights.length; j++) { const w = weights[j], g = gains[j]; for (let p = 0; p < n; p++) tmp[p] += w[p] * g; } const d = data; for (let p = 0; p < n; p++) { const x = 255 * (1 - tmp[p]), f = x | 0; d[p * 4 + 3] = f + (x - f >= 0.5 ? 1 : 0); } };
  const fused3Exact = () => { const a = acc, d = data; for (let p = 0; p < n; p++) { const x = 255 * (1 - (a[p] + w4[p] * g4 + w5[p] * g5 + w6[p] * g6)), f = x | 0; d[p * 4 + 3] = f + (x - f >= 0.5 ? 1 : 0); } };
  // fast path (x+0.5)|0; the only inexact case is when x+0.5 was ROUNDED UP to an integer (then y === trunc(y)); fall back to Math.round there
  const shippedFast = () => { const a = acc, d = data, count = weights.length, m = M; for (let p = 0; p < n; p++) { let v = a[p]; for (let j = m; j < count; j++) v += weights[j][p] * gains[j]; const x = 255 * (1 - v), y = x + 0.5, r = y | 0; d[p * 4 + 3] = y === r ? Math.round(x) : r; } };
  const layerMajorFast = () => { tmp.set(acc); for (let j = M; j < weights.length; j++) { const w = weights[j], g = gains[j]; for (let p = 0; p < n; p++) tmp[p] += w[p] * g; } const d = data; for (let p = 0; p < n; p++) { const x = 255 * (1 - tmp[p]), y = x + 0.5, r = y | 0; d[p * 4 + 3] = y === r ? Math.round(x) : r; } };
  const originalFast = () => { for (let p = 0; p < n; p++) { let v = 0; for (let i = 0; i < weights.length; i++) v += weights[i][p] * gains[i]; const x = 255 * (1 - v), y = x + 0.5, r = y | 0; data[p * 4 + 3] = y === r ? Math.round(x) : r; } };
  const layerMajorFastNoPrefix = () => { tmp.fill(0); for (let j = 0; j < weights.length; j++) { const w = weights[j], g = gains[j]; for (let p = 0; p < n; p++) tmp[p] += w[p] * g; } const d = data; for (let p = 0; p < n; p++) { const x = 255 * (1 - tmp[p]), y = x + 0.5, r = y | 0; d[p * 4 + 3] = y === r ? Math.round(x) : r; } };
  const writeOnly = () => { const a = acc, d = data; for (let p = 0; p < n; p++) d[p * 4 + 3] = Math.round(255 * (1 - a[p])); };
  const sumOnly = () => { const a = acc; let t = 0; for (let p = 0; p < n; p++) t += a[p] + w4[p] * g4 + w5[p] * g5 + w6[p] * g6; return t; };
  const bytes = f => { f(); return Array.from(data.filter((_, i) => i % 4 === 3)); };
  const ref = bytes(original); const same = f => { const b = bytes(f); for (let i = 0; i < ref.length; i++) if (b[i] !== ref[i]) return false; return true; };
  const t = f => { const out = []; for (let r = 0; r < 25; r++) { const a = performance.now(); f(); out.push(performance.now() - a); } out.sort((x, y) => x - y); return +out[12].toFixed(2); };
  const res = {};
  for (const [name, f] of Object.entries({ original, originalFast, shippedFast, layerMajorFast, layerMajorFastNoPrefix, originalExact, shipped, shippedExact, layerMajor, layerMajorExact, fused3, fused3Exact, fused3NoRound, writeOnly, sumOnly })) { f(); f(); res[name] = { ms: t(f), identical: name === 'sumOnly' || name === 'writeOnly' ? null : same(f) }; }
  // Stress: exact formula vs Math.round (then clamp to 0..255 like Uint8ClampedArray) on random values, grid values and values 1-3 ulp around every k+0.5
  const f64 = new Float64Array(1), u64 = new BigUint64Array(f64.buffer); const next = (x, d) => { f64[0] = x; u64[0] += BigInt(d); return f64[0]; };
  const clamp = v => v < 0 ? 0 : v > 255 ? 255 : v; const exact = x => { const f = x | 0; return f + (x - f >= 0.5 ? 1 : 0); };
  let bad = 0, tested = 0; const check = x => { if (!Number.isFinite(x)) return; tested++; if (clamp(exact(x)) !== clamp(Math.round(x))) bad++; };
  for (let i = 0; i < 3000000; i++) check(-3 + rnd() * 262);
  for (let k = -2; k <= 258; k++) { const h = k + 0.5; for (const d of [-3, -2, -1, 0, 1, 2, 3]) check(next(h, d)); for (const d of [-2, -1, 0, 1, 2]) { check(next(k, d)); } }
  for (let i = 0; i < 200000; i++) { const v = rnd(); check(255 * (1 - v)); check(255 * (1 - (v + 1e-16))); check(255 * (1 - (1 + 1e-15 * rnd()))); }
  const fastR = x => { const y = x + 0.5, r = y | 0; return y === r ? Math.round(x) : r; };
  let badFast = 0, testedFast = 0; const firstBad = []; const checkFast = x => { if (!Number.isFinite(x)) return; testedFast++; if (clamp(fastR(x)) !== clamp(Math.round(x))) { badFast++; if (firstBad.length < 4) firstBad.push(x); } };
  s = 123456789; for (let i = 0; i < 3000000; i++) checkFast(-3 + rnd() * 262);
  for (let k = -2; k <= 258; k++) { const h = k + 0.5; for (const d of [-3, -2, -1, 0, 1, 2, 3]) checkFast(next(h, d)); for (const d of [-2, -1, 0, 1, 2]) checkFast(next(k, d)); }
  for (let i = 0; i < 200000; i++) { const v = rnd(); checkFast(255 * (1 - v)); checkFast(255 * (1 - (v + 1e-16))); checkFast(255 * (1 - (1 + 1e-15 * rnd()))); }
  checkFast(0.49999999999999994); checkFast(-0.49999999999999994); checkFast(0.5); checkFast(254.5); checkFast(255.5);
  res.__roundStress = { tested, mismatches: bad, fast: { tested: testedFast, mismatches: badFast, firstBad } };
  return res;
})()`;
(async () => {
  const b = await launch('real'); const ctx = await b.newContext(); const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
  await page.goto('about:blank');
  const all = {};
  for (const rate of [1, cpu]) { await cdp.send('Emulation.setCPUThrottlingRate', { rate }); all['x' + rate] = await page.evaluate(BENCH); console.log('## CPU x' + rate + ' (median of 25 calls, ms per mask update; 142,560 px, 7 layers, 4 cached)'); for (const [k, v] of Object.entries(all['x' + rate])) if (k === '__roundStress') console.log('   compare-formula stress:', v.tested, 'values, mismatches', v.mismatches, '| fast-with-fallback stress:', v.fast.tested, 'values, mismatches vs Math.round (after 0..255 clamp):', v.fast.mismatches, JSON.stringify(v.fast.firstBad)); else console.log('  ', k.padEnd(14), String(v.ms).padStart(7), 'ms', v.identical === null ? '(partial op)' : 'identical=' + v.identical); }
  fs.writeFileSync(path.join(ROOT, 'tools/perf/results/gd3/atmo-bench-browser.json'), JSON.stringify(all, null, 1));
  await b.close();
})();
