// Identity + speed check for the layer-major atmosphere loop (renderer-5) against the original per-pixel loop (renderer-4).
const W = 480, H = 297, n = W * H;
const rnd = (() => { let s = 123456789; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; })();
function original(weights, gains, data) { for (let p = 0; p < n; p++) { let visible = 0; for (let i = 0; i < weights.length; i++) visible += weights[i][p] * gains[i]; data[p * 4 + 3] = Math.round(255 * (1 - visible)); } }
let acc = null;
function optimized(weights, gains, data) { if (!acc || acc.length !== n) acc = new Float64Array(n); acc.fill(0); for (let i = 0; i < weights.length; i++) { const w = weights[i], g = gains[i]; for (let p = 0; p < n; p++) acc[p] += w[p] * g; } for (let p = 0; p < n; p++) data[p * 4 + 3] = Math.round(255 * (1 - acc[p])); }
const fused = new Map();
function fusedFor(k) { let f = fused.get(k); if (f) return f; const w = Array.from({ length: k }, (_, i) => 'w' + i + '=weights[' + i + ']'), g = Array.from({ length: k }, (_, i) => 'g' + i + '=gains[' + i + ']'); const sum = Array.from({ length: k }, (_, i) => 'w' + i + '[p]*g' + i).join('+');
  f = k ? new Function('weights', 'gains', 'data', 'n', 'const ' + w.join(',') + ',' + g.join(',') + '; for (let p = 0; p < n; p++) { const visible = 0+' + sum + '; data[p * 4 + 3] = Math.round(255 * (1 - visible)); }') : new Function('weights', 'gains', 'data', 'n', 'for (let p = 0; p < n; p++) data[p * 4 + 3] = 255;'); fused.set(k, f); return f; }
function unrolled(weights, gains, data) { fusedFor(weights.length)(weights, gains, data, n); }
function chunked(weights, gains, data, n, accRef) {
  const k = weights.length;
  if (!k) { for (let p = 0; p < n; p++) data[p * 4 + 3] = 255; return; }
  let acc = accRef.v; if (!acc || acc.length !== n) acc = accRef.v = new Float64Array(n);
  let i = 0;
  while (i < k) {
    const left = k - i, last = left <= 4, first = i === 0;
    if (left >= 4) {
      const w0 = weights[i], w1 = weights[i + 1], w2 = weights[i + 2], w3 = weights[i + 3], g0 = gains[i], g1 = gains[i + 1], g2 = gains[i + 2], g3 = gains[i + 3];
      if (last && first) for (let p = 0; p < n; p++) data[p * 4 + 3] = Math.round(255 * (1 - (0 + w0[p] * g0 + w1[p] * g1 + w2[p] * g2 + w3[p] * g3)));
      else if (last) for (let p = 0; p < n; p++) data[p * 4 + 3] = Math.round(255 * (1 - (acc[p] + w0[p] * g0 + w1[p] * g1 + w2[p] * g2 + w3[p] * g3)));
      else if (first) for (let p = 0; p < n; p++) acc[p] = 0 + w0[p] * g0 + w1[p] * g1 + w2[p] * g2 + w3[p] * g3;
      else for (let p = 0; p < n; p++) acc[p] = acc[p] + w0[p] * g0 + w1[p] * g1 + w2[p] * g2 + w3[p] * g3;
      i += 4;
    } else if (left === 3) {
      const w0 = weights[i], w1 = weights[i + 1], w2 = weights[i + 2], g0 = gains[i], g1 = gains[i + 1], g2 = gains[i + 2];
      if (first) for (let p = 0; p < n; p++) data[p * 4 + 3] = Math.round(255 * (1 - (0 + w0[p] * g0 + w1[p] * g1 + w2[p] * g2)));
      else for (let p = 0; p < n; p++) data[p * 4 + 3] = Math.round(255 * (1 - (acc[p] + w0[p] * g0 + w1[p] * g1 + w2[p] * g2)));
      i += 3;
    } else if (left === 2) {
      const w0 = weights[i], w1 = weights[i + 1], g0 = gains[i], g1 = gains[i + 1];
      if (first) for (let p = 0; p < n; p++) data[p * 4 + 3] = Math.round(255 * (1 - (0 + w0[p] * g0 + w1[p] * g1)));
      else for (let p = 0; p < n; p++) data[p * 4 + 3] = Math.round(255 * (1 - (acc[p] + w0[p] * g0 + w1[p] * g1)));
      i += 2;
    } else {
      const w0 = weights[i], g0 = gains[i];
      if (first) for (let p = 0; p < n; p++) data[p * 4 + 3] = Math.round(255 * (1 - (0 + w0[p] * g0)));
      else for (let p = 0; p < n; p++) data[p * 4 + 3] = Math.round(255 * (1 - (acc[p] + w0[p] * g0)));
      i += 1;
    }
  }
}

const accRef = { v: null };
function chunkedFn(weights, gains, data) { chunked(weights, gains, data, n, accRef); }
let mismatches = 0, cases = 0;
for (let c = 0; c < 60; c++) {
  const k = 1 + Math.floor(rnd() * 8), weights = [], gains = [];
  // normalised like the real reveal weights (sum to 1 per pixel) in half of the cases, arbitrary in the others
  const raw = Array.from({ length: k }, () => Float32Array.from({ length: n }, () => rnd()));
  if (c % 2 === 0) for (let p = 0; p < n; p++) { let t = 0; for (let i = 0; i < k; i++) t += raw[i][p]; for (let i = 0; i < k; i++) raw[i][p] /= t; }
  for (let i = 0; i < k; i++) { weights.push(raw[i]); gains.push(c % 5 === 0 ? 1 : rnd()); }
  const a = new Uint8ClampedArray(n * 4), b = new Uint8ClampedArray(n * 4);
  original(weights, gains, a); optimized(weights, gains, b); const u = new Uint8ClampedArray(n * 4); chunkedFn(weights, gains, u); for (let i = 3; i < a.length; i += 4) if (a[i] !== u[i]) { mismatches += 1000; break; }
  cases++; for (let i = 3; i < a.length; i += 4) if (a[i] !== b[i]) { mismatches++; break; }
}
// empty layer list
{ const a = new Uint8ClampedArray(n * 4), b = new Uint8ClampedArray(n * 4); original([], [], a); chunkedFn([], [], b); cases++; for (let i = 3; i < a.length; i += 4) if (a[i] !== b[i]) { mismatches++; break; } }
console.log(`cases=${cases} mismatching=${mismatches}`);
const weights = Array.from({ length: 6 }, () => Float32Array.from({ length: n }, () => rnd() / 6)), gains = [1, .8, .6, .4, .2, .1], d = new Uint8ClampedArray(n * 4);
const t = f => { const s = process.hrtime.bigint(); for (let r = 0; r < 40; r++) f(weights, gains, d); return Number(process.hrtime.bigint() - s) / 1e6 / 40; };
t(original); t(optimized); t(chunkedFn);
const o = t(original), p = t(optimized);
const u2 = t(chunkedFn); console.log(`unrolled ${u2.toFixed(2)} ms, speedup x${(o / u2).toFixed(2)}`);
console.log(`per frame: original ${o.toFixed(2)} ms, layer-major ${p.toFixed(2)} ms, speedup x${(o / p).toFixed(2)}`);
process.exit(mismatches ? 1 : 0);
