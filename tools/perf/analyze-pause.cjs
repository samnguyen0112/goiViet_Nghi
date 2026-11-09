// Aggregate the GD4 what-if (raster tick paused while the camera moves) from interaction-pause-<variant>-x<cpu>-<i>.json
// node tools/perf/analyze-pause.cjs 4
const fs = require('fs'), path = require('path');
const { summarize } = require('./lib.cjs');
const cpu = process.argv[2] || '4';
const dir = path.resolve(__dirname, 'results/gd4-map');
const files = fs.readdirSync(dir).filter(f => new RegExp(`^interaction-pause-(base|pause)-x${cpu}-\\d+\\.json$`).test(f));
// file name is interaction-pause-<variant>-x<cpu>-<i>.json, so the variant is the 3rd dash-separated token
const runs = { base: [], pause: [] };
for (const f of files) { const v = f.split('-')[2]; runs[v].push(JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'))); }
const scen = ['drag-pan', 'wheel-zoom', 'rotate', 'pitch-toggle', 'fly-hue-api', 'drag-after-panel'];
const row = (name, f) => { const o = {}; for (const v of ['base', 'pause']) o[v] = summarize(runs[v].map(r => r.scenarios[name] && f(r.scenarios[name]))); return o; };
const pct = (a, b) => (a && b && a.median) ? ((b.median - a.median) / a.median * 100).toFixed(0) + '%' : 'n/a';
console.log(`runs: base=${runs.base.length} pause=${runs.pause.length} (cpu x${cpu})`);
const lines = [];
for (const name of scen) {
  for (const [metric, f] of [['fps', s => s.frame?.fps], ['p95 ms', s => s.frame?.p95], ['max ms', s => s.frame?.max], ['frames>50ms', s => s.frame?.gt50], ['cpu %', s => s.cpuBusyPct]]) {
    const r = row(name, f);
    lines.push(`${name.padEnd(17)} ${metric.padEnd(12)} base ${String(r.base?.median).padStart(7)} [${r.base?.q1}-${r.base?.q3}]  pause ${String(r.pause?.median).padStart(7)} [${r.pause?.q1}-${r.pause?.q3}]  d=${pct(r.base, r.pause)}`);
  }
}
console.log(lines.join('\n'));
fs.writeFileSync(path.join(dir, `ab-pause-x${cpu}.txt`), lines.join('\n') + '\n');
