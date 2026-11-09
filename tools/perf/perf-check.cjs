// GD1 section 1.5: performance gate. Compares candidate vs baseline JSONL runs with the GD0 noise rule:
//   a change is REAL only if |delta median| >= baseline IQR AND Mann-Whitney p < 0.05 AND n >= 10 on both sides.
// node tools/perf/perf-check.cjs <baseline.jsonl> <candidate.jsonl> [--out report.md]
// Exit code 1 if any gated metric REGRESSED beyond noise, or the candidate has errors the baseline lacks.
const { fs, path, ROOT, summarize } = require('./lib.cjs');
const argv = process.argv.slice(2).filter(a => !a.startsWith('--'));
const outIdx = process.argv.indexOf('--out');
const read = f => fs.readFileSync(path.resolve(ROOT, f), 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l));
const base = read(argv[0]), cand = read(argv[1]);
const ph = (r, n, f) => { const p = r.phases[n]; return p ? f(p) : null; };
const d = (r, a, b) => (r.marks && typeof r.marks[a] === 'number' && typeof r.marks[b] === 'number') ? r.marks[b] - r.marks[a] : null;
// dir: 'lower' = smaller is better, 'higher' = larger is better; gate: true = a real regression fails the check
const M = [
  ['gateReady (in-page ms)', r => r.nav && r.nav.gateReady, 'lower', true],
  ['FCP (ms)', r => r.nav && r.nav.fcp, 'lower', false],
  ['TBT to gate (ms)', r => r.nav && r.nav.tbtToGate, 'lower', false],
  ['Transfer MiB whole flow', r => r.totals && r.totals.transferMB, 'lower', false],
  ['Opening FPS', r => ph(r, 'opening', p => p.frame && p.frame.fps), 'higher', true],
  ['Opening CPU %', r => ph(r, 'opening', p => p.cpuBusyPct), 'lower', false],
  ['Home idle FPS', r => ph(r, 'home-idle-4s', p => p.frame && p.frame.fps), 'higher', true],
  ['Home idle CPU %', r => ph(r, 'home-idle-4s', p => p.cpuBusyPct), 'lower', false],
  // Not gating (decision for GD2): while map-prewarm's curtain holds, this frame is drawn UNDER the curtain and cannot be seen; the user-visible
  // milestones are the curtain reveal/clear below. If a change ever reveals the map before it is complete, this must become gating again.
  ['Enter map -> first ground frame (ms, hidden by curtain)', r => d(r, 'enterClick', 'firstGroundFrame'), 'lower', false],
  ['Enter map -> curtain reveal (ms)', r => d(r, 'enterClick', 'curtainReveal'), 'lower', true],
  ['Enter map -> curtain clear (ms)', r => d(r, 'enterClick', 'curtainClear'), 'lower', true],
  ['Enter map LoAF max (ms)', r => ph(r, 'enter-map', p => p.loaf && p.loaf.maxMs), 'lower', false],
  ['Map idle CPU %', r => ph(r, 'map-idle-3s', p => p.cpuBusyPct), 'lower', false],
  ['Drag FPS', r => ph(r, 'map-drag-pan', p => p.frame && p.frame.fps), 'higher', true],
  ['Zoom FPS', r => ph(r, 'map-wheel-zoom', p => p.frame && p.frame.fps), 'higher', true],
  ['Rotate FPS', r => ph(r, 'map-rotate', p => p.frame && p.frame.fps), 'higher', true],
  ['2D/3D FPS', r => ph(r, 'map-pitch-toggle', p => p.frame && p.frame.fps), 'higher', true],
  ['Fly to Hue FPS', r => ph(r, 'map-fly-hue', p => p.frame && p.frame.fps), 'higher', true],
  ['Final JS heap (MB)', r => r.finalHeapMB, 'lower', false]
];
function mwuP(a, b) { // two-sided Mann-Whitney U, normal approximation with tie correction
  const n1 = a.length, n2 = b.length; if (n1 < 3 || n2 < 3) return null;
  const all = [...a.map(v => [v, 0]), ...b.map(v => [v, 1])].sort((x, y) => x[0] - y[0]); const ranks = new Array(all.length); let tie = 0;
  for (let i = 0; i < all.length;) { let j = i; while (j + 1 < all.length && all[j + 1][0] === all[i][0]) j++; const r = (i + j) / 2 + 1; for (let k = i; k <= j; k++) ranks[k] = r; const t = j - i + 1; tie += t ** 3 - t; i = j + 1; }
  let r1 = 0; all.forEach((x, i) => { if (x[1] === 0) r1 += ranks[i]; });
  const U = r1 - n1 * (n1 + 1) / 2, mu = n1 * n2 / 2, N = n1 + n2, sd = Math.sqrt(n1 * n2 / 12 * ((N + 1) - tie / (N * (N - 1))));
  if (!sd) return 1; const z = Math.abs(U - mu) / sd, t = 1 / (1 + .3275911 * (z / Math.SQRT2));
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - .284496736) * t + .254829592) * t * Math.exp(-((z / Math.SQRT2) ** 2));
  return +(1 - erf).toFixed(3);
}
let fail = false; const rows = [];
for (const [name, fn, dir, gate] of M) {
  const a = base.map(fn).filter(v => typeof v === 'number'), b = cand.map(fn).filter(v => typeof v === 'number');
  if (!a.length || !b.length) continue;
  const sa = summarize(a), sb = summarize(b), delta = sb.median - sa.median, p = mwuP(a, b), enough = a.length >= 10 && b.length >= 10;
  const real = enough && Math.abs(delta) >= sa.iqr && p !== null && p < .05;
  const better = dir === 'lower' ? delta < 0 : delta > 0;
  const verdict = !enough ? 'n<10 (không kết luận)' : !real ? 'trong biên nhiễu' : better ? 'CẢI THIỆN thật' : 'HỒI QUY thật';
  if (gate && real && !better) fail = true;
  rows.push(`| ${name} | ${sa.median} (IQR ${sa.iqr}) | ${sb.median} (IQR ${sb.iqr}) | ${delta >= 0 ? '+' : ''}${delta.toFixed(2)} (${sa.median ? (delta / sa.median * 100).toFixed(1) : '—'}%) | ${p === null ? '—' : p} | ${verdict}${gate ? '' : ' (không chặn)'} |`);
}
const errs = r => r.filter(x => x.errors && x.errors.length).length;
if (errs(cand) > errs(base)) fail = true;
const md = `| Chỉ số | Baseline median | Candidate median | Δ | p (MWU) | Kết luận |\n|---|---|---|---|---|---|\n${rows.join('\n')}\n\nn: baseline ${base.length}, candidate ${cand.length}. Lượt có lỗi: baseline ${errs(base)}, candidate ${errs(cand)}. Kết quả cổng: **${fail ? 'KHÔNG ĐẠT (có hồi quy thật hoặc lỗi mới)' : 'ĐẠT (không có hồi quy thật)'}**\n`;
console.log(md);
if (outIdx > 0) fs.writeFileSync(path.resolve(ROOT, process.argv[outIdx + 1]), md);
process.exit(fail ? 1 : 0);
