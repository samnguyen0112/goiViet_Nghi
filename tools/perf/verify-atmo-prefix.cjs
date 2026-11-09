// Pre-condition checks for the "finished-prefix cache" idea in drawAtmosphere (renderer-4 line ~110). Read-only; nothing in the site is touched.
//  A. With the real layer order and entrance windows: at every frame of the 6.1 s intro, are all fully revealed layers (gain === 1) a PREFIX of the
//     non-zero layer list? (needed for a bit-identical cache of the running sum)
//  B. Replay the whole intro at 60 fps with random normalised weights: original loop vs prefix-cached loop produce identical alpha bytes?
//  C. Work saved: average layers summed per frame, original vs cached; plus timing in node.
const W = 480, H = 297, n = W * H;
const smooth = v => { v = Math.max(0, Math.min(1, v)); return v * v * (3 - 2 * v); };
// order of revealWeights in the page: sky first, then terrain/mountain layers sorted by z (stable)
const LAYERS = [
  ['sky', [.05, 1.1]], ['mountains-far-left', [.2, 2.2]], ['mountains-far-right', [.55, 2.55]], ['mountains-mid-left', [1.45, 3.9]],
  ['mountains-mid-right', [1.8, 4.25]], ['river-valley', [1.6, 5.75]], ['mountains-near-left', [3.1, 5.75]], ['mountains-near-right', [3.45, 6.1]]
];
const lightAt = t => LAYERS.map(([, [a, b]]) => smooth((t - a) / (b - a)));
let prefixOK = true, framesChecked = 0, maxActive = 0, sumNonZero = 0, sumChanging = 0, firstViolation = null;
let prev = null;
for (let f = 0; f * (1 / 60) < 6.1; f++) {
  const t = f / 60, light = lightAt(t), list = [];
  for (let i = 0; i < light.length; i++) if (light[i] !== 0) list.push({ i, g: light[i] });
  // finished layers must be a prefix of the list
  let seenUnfinished = false, okFrame = true;
  for (const e of list) { if (e.g === 1) { if (seenUnfinished) okFrame = false; } else seenUnfinished = true; }
  if (!okFrame) { prefixOK = false; firstViolation = firstViolation ?? t; }
  const finishedCount = list.filter(e => e.g === 1).length;
  sumNonZero += list.length; sumChanging += list.length - (okFrame ? finishedCount : 0); maxActive = Math.max(maxActive, list.length - finishedCount);
  framesChecked++;
}
console.log(`A. frames=${framesChecked}; finished layers always a prefix of the non-zero list: ${prefixOK}${firstViolation !== null ? ' (first violation at t=' + firstViolation.toFixed(2) + 's)' : ''}`);
console.log(`   avg non-zero layers/frame ${(sumNonZero / framesChecked).toFixed(2)}, avg layers still changing/frame ${(sumChanging / framesChecked).toFixed(2)}, max changing at once ${maxActive}`);

// B/C: random normalised weights, replay
const rnd = (() => { let s = 987654321; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; })();
const raw = LAYERS.map(() => new Float32Array(n));
for (let p = 0; p < n; p++) { let tot = 0; const v = LAYERS.map(() => rnd()); for (const x of v) tot += x; for (let i = 0; i < LAYERS.length; i++) raw[i][p] = v[i] / tot; }
function original(weights, gains, data) { for (let p = 0; p < n; p++) { let visible = 0; for (let i = 0; i < weights.length; i++) visible += weights[i][p] * gains[i]; data[p * 4 + 3] = Math.round(255 * (1 - visible)); } }
// prefix cache: running sum of the leading gain===1 layers (same operations, same order => same bits), then add the remaining layers
let cache = { ids: [], acc: new Float64Array(n) };
function cached(ids, weights, gains, data) {
  let m = 0; while (m < gains.length && gains[m] === 1) m++;               // finished prefix of the current list
  // reuse the cached partial sum only if it covers exactly the same first m layers (or a prefix of them we can extend)
  let k = 0; while (k < cache.ids.length && k < m && cache.ids[k] === ids[k]) k++;
  if (k !== cache.ids.length) { cache.ids = []; cache.acc.fill(0); k = 0; } // cache not a prefix of the current finished layers -> rebuild
  for (let i = k; i < m; i++) { const w = weights[i]; const a = cache.acc; for (let p = 0; p < n; p++) a[p] += w[p] * 1; cache.ids.push(ids[i]); }
  const a = cache.acc, rest = weights.length - m;
  for (let p = 0; p < n; p++) { let v = a[p]; for (let j = m; j < weights.length; j++) v += weights[j][p] * gains[j]; data[p * 4 + 3] = Math.round(255 * (1 - v)); }
  return rest;
}
let mismatching = 0, orig = 0, cach = 0, tOrig = 0, tCache = 0, layerOps = { orig: 0, cached: 0 };
const A = new Uint8ClampedArray(n * 4), B = new Uint8ClampedArray(n * 4);
let lastKey = '';
for (let f = 0; f * (1 / 60) < 6.1; f++) {
  const light = lightAt(f / 60), key = light.join(',');
  if (key === lastKey) continue; lastKey = key;
  const ids = [], weights = [], gains = [];
  for (let i = 0; i < light.length; i++) if (light[i] !== 0) { ids.push(i); weights.push(raw[i]); gains.push(light[i]); }
  let s = process.hrtime.bigint(); original(weights, gains, A); tOrig += Number(process.hrtime.bigint() - s) / 1e6;
  s = process.hrtime.bigint(); const rest = cached(ids, weights, gains, B); tCache += Number(process.hrtime.bigint() - s) / 1e6;
  layerOps.orig += weights.length; layerOps.cached += rest;
  for (let i = 3; i < A.length; i += 4) if (A[i] !== B[i]) { mismatching++; break; }
  orig++;
}
console.log(`B. replayed ${orig} distinct frames: frames with any differing alpha byte = ${mismatching}`);
console.log(`C. per-pixel layer additions: original ${layerOps.orig}, cached ${layerOps.cached} (${(layerOps.cached / layerOps.orig * 100).toFixed(0)}% of the original); node time total ${tOrig.toFixed(0)} ms -> ${tCache.toFixed(0)} ms (x${(tOrig / tCache).toFixed(2)})`);
process.exit(mismatching || !prefixOK ? 1 : 0);
