// Summarise the A/A batch: per metric median/IQR/min/max for preview-4 and its identical copy preview-5,
// plus a Mann-Whitney U check that the two identical builds are indistinguishable (sanity of the harness).
// node tools/perf/analyze-aa.cjs [dir=tools/perf/results/gd0]  -> prints markdown, writes aa-summary.json
const { fs, path, ROOT, summarize } = require('./lib.cjs');
const dir = path.resolve(ROOT, process.argv[2] || 'tools/perf/results/gd0');
const read = f => { const p = path.join(dir, f); return fs.existsSync(p) ? fs.readFileSync(p, 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l)) : []; };
const ph = (r, n, f) => { const p = r.phases[n]; if (!p) return null; return f(p); };
const d = (a, b) => (typeof a === 'number' && typeof b === 'number') ? b - a : null;
const METRICS = [
  ['Tải: gateReady (ms, trang)', r => r.nav?.gateReady],
  ['Tải: FCP (ms)', r => r.nav?.fcp],
  ['Tải: LCP (ms)', r => r.nav?.lcp],
  ['Tải: TBT đến cổng (ms)', r => r.nav?.tbtToGate],
  ['Tải: DCL (ms)', r => r.nav?.dcl],
  ['Tải: load event (ms)', r => r.nav?.load],
  ['Mở đầu: thời lượng click→complete (ms)', r => d(r.marks.openingClick, r.marks.openingEnd)],
  ['Mở đầu: FPS', r => ph(r, 'opening', p => p.frame?.fps)],
  ['Mở đầu: CPU bận %', r => ph(r, 'opening', p => p.cpuBusyPct)],
  ['Mở đầu: khung max (ms)', r => ph(r, 'opening', p => p.frame?.max)],
  ['Trang chủ đứng yên: FPS', r => ph(r, 'home-idle-4s', p => p.frame?.fps)],
  ['Trang chủ đứng yên: CPU bận %', r => ph(r, 'home-idle-4s', p => p.cpuBusyPct)],
  ['Trang chủ đứng yên: p95 khung (ms)', r => ph(r, 'home-idle-4s', p => p.frame?.p95)],
  ['Vào bản đồ: click→firstGroundFrame (ms)', r => d(r.marks.enterClick, r.marks.firstGroundFrame)],
  ['Vào bản đồ: click→curtainReveal (ms)', r => d(r.marks.enterClick, r.marks.curtainReveal)],
  ['Vào bản đồ: click→curtainClear (ms)', r => d(r.marks.enterClick, r.marks.curtainClear)],
  ['Vào bản đồ: click→rasterIdle (ms)', r => d(r.marks.enterClick, r.marks.rasterIdle)],
  ['Vào bản đồ: LoAF max (ms)', r => ph(r, 'enter-map', p => p.loaf?.maxMs)],
  ['Vào bản đồ: longtask max (ms)', r => ph(r, 'enter-map', p => p.longTasks?.maxMs)],
  ['Bản đồ đứng yên: CPU bận %', r => ph(r, 'map-idle-3s', p => p.cpuBusyPct)],
  ['Kéo: FPS', r => ph(r, 'map-drag-pan', p => p.frame?.fps)],
  ['Kéo: p95 khung (ms)', r => ph(r, 'map-drag-pan', p => p.frame?.p95)],
  ['Zoom: FPS', r => ph(r, 'map-wheel-zoom', p => p.frame?.fps)],
  ['Xoay: FPS', r => ph(r, 'map-rotate', p => p.frame?.fps)],
  ['Xoay: p95 khung (ms)', r => ph(r, 'map-rotate', p => p.frame?.p95)],
  ['2D/3D: FPS', r => ph(r, 'map-pitch-toggle', p => p.frame?.fps)],
  ['Bay tới Huế: FPS', r => ph(r, 'map-fly-hue', p => p.frame?.fps)],
  ['Bay tới Huế: p95 khung (ms)', r => ph(r, 'map-fly-hue', p => p.frame?.p95)],
  ['Heap JS cuối (MB)', r => r.finalHeapMB],
  ['Tổng byte truyền cả flow (MB)', r => r.totals?.transferMB],
];
// Two-sided Mann-Whitney U, normal approximation with tie correction (adequate for n=10 vs 10 as a sanity check).
function mannWhitneyP(a, b) {
  const n1 = a.length, n2 = b.length; if (n1 < 3 || n2 < 3) return null;
  const all = [...a.map(v => [v, 0]), ...b.map(v => [v, 1])].sort((x, y) => x[0] - y[0]);
  const ranks = new Array(all.length); let tieSum = 0;
  for (let i = 0; i < all.length;) { let j = i; while (j + 1 < all.length && all[j + 1][0] === all[i][0]) j++; const r = (i + j) / 2 + 1; for (let k = i; k <= j; k++) ranks[k] = r; const t = j - i + 1; tieSum += t ** 3 - t; i = j + 1; }
  let r1 = 0; all.forEach((x, i) => { if (x[1] === 0) r1 += ranks[i]; });
  const U1 = r1 - n1 * (n1 + 1) / 2, mu = n1 * n2 / 2, N = n1 + n2;
  const sd = Math.sqrt(n1 * n2 / 12 * ((N + 1) - tieSum / (N * (N - 1))));
  if (!sd) return 1; const z = Math.abs(U1 - mu) / sd;
  const erf = x => { const t = 1 / (1 + .3275911 * x), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - .284496736) * t + .254829592) * t * Math.exp(-x * x); return y; };
  return +(1 - erf(z / Math.SQRT2)).toFixed(3);
}
const out = {};
let md = '';
for (const cpu of [1, 4]) {
  const p4 = read(`aa-p4-x${cpu}.jsonl`), p5 = read(`aa-p5-x${cpu}.jsonl`);
  if (!p4.length) continue;
  md += `\n### CPU ×${cpu} — preview-4 n=${p4.length}, preview-5 (bản sao y hệt) n=${p5.length}\n\n| Chỉ số | p4 median [min–max] | p5 median [min–max] | IQR gộp | IQR/median | p (MWU p4≠p5) |\n|---|---|---|---|---|---|\n`;
  out[cpu] = {};
  for (const [name, fn] of METRICS) {
    const a = p4.map(fn).filter(v => typeof v === 'number'), b = p5.map(fn).filter(v => typeof v === 'number');
    if (!a.length) continue;
    const sa = summarize(a), sb = b.length ? summarize(b) : null, sp = summarize([...a, ...b]);
    const rel = sp.median ? +(sp.iqr / Math.abs(sp.median) * 100).toFixed(1) : 0;
    const p = b.length ? mannWhitneyP(a, b) : null;
    out[cpu][name] = { p4: sa, p5: sb, pooled: sp, iqrRelPct: rel, mwuP: p };
    md += `| ${name} | ${sa.median} [${sa.min}–${sa.max}] | ${sb ? `${sb.median} [${sb.min}–${sb.max}]` : '—'} | ${sp.iqr} | ${rel}% | ${p ?? '—'} |\n`;
  }
  const bad = (x) => x.filter(r => r.errors?.length).length;
  md += `\nLượt có lỗi: p4=${bad(p4)}/${p4.length}, p5=${bad(p5)}/${p5.length}. RAM trống trước lượt (GB): ${JSON.stringify(summarize(p4.concat(p5).map(r => r.env.freeMemGB)))}. CPU hệ thống bận trước lượt (%): ${JSON.stringify(summarize(p4.concat(p5).map(r => r.env.sysBusyPctBefore)))}\n`;
}
fs.writeFileSync(path.join(dir, 'aa-summary.json'), JSON.stringify(out, null, 1));
fs.writeFileSync(path.join(dir, 'aa-summary.md'), md);
console.log(md);
