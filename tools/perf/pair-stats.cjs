// Paired comparison of two JSONL run files (same index = same interleaved pair). node tools/perf/pair-stats.cjs a.jsonl b.jsonl
const fs = require('fs'), { summarize } = require('./lib.cjs');
const rd = f => fs.readFileSync(f, 'utf8').trim().split('\n').map(JSON.parse);
const a = rd(process.argv[2]), b = rd(process.argv[3]);
const ph = (r, n, f) => { const p = r.phases && r.phases[n]; return p ? f(p) : null; };
const d = (r, x, y) => r.marks && typeof r.marks[x] === 'number' && typeof r.marks[y] === 'number' ? (r.marks[y] - r.marks[x]) / 1000 : null;
const M = [['enter->reveal s', r => d(r, 'enterClick', 'curtainReveal')], ['enter->clear s', r => d(r, 'enterClick', 'curtainClear')], ['drag FPS', r => ph(r, 'map-drag-pan', p => p.frame && p.frame.fps)], ['rotate FPS', r => ph(r, 'map-rotate', p => p.frame && p.frame.fps)], ['fly FPS', r => ph(r, 'map-fly-hue', p => p.frame && p.frame.fps)]];
for (const [n, f] of M) {
  const x = a.map(f), y = b.map(f), sx = summarize(x), sy = summarize(y);
  const wins = x.map((v, i) => (v != null && y[i] != null) ? (y[i] < v ? 'B<A' : 'B>=A') : '?');
  console.log(n.padEnd(16), 'A', sx.median, '[' + sx.q1 + '-' + sx.q3 + ']', 'B', sy.median, '[' + sy.q1 + '-' + sy.q3 + ']', '| A:', x.map(v => v && +v.toFixed(1)).join(','), '| B:', y.map(v => v && +v.toFixed(1)).join(','), '|', wins.join(' '));
}
