// Shared helpers for the performance harness (Giai doan 0). Read-only against the site.
const os = require('os');
const fs = require('fs');
const path = require('path');

const PW = process.env.PLAYWRIGHT_PATH || 'C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright';
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = +process.env.PORT || 8770;
const ROOT = path.resolve(__dirname, '..', '..');
const BASE = `http://127.0.0.1:${PORT}/`;
const { chromium } = require(PW);

// gpu: 'real' (ANGLE D3D11), 'swiftshader' (software WebGL), 'nowebgl' (WebGL unavailable)
function launch(gpu = 'real', extra = []) {
  const common = ['--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'];
  const g = gpu === 'swiftshader' ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
    : gpu === 'nowebgl' ? ['--disable-gpu', '--disable-3d-apis', '--disable-webgl', '--disable-webgl2']
      : ['--enable-gpu-rasterization', '--ignore-gpu-blocklist', '--use-angle=d3d11'];
  return chromium.launch({ executablePath: CHROME, headless: true, args: [...common, ...g, ...extra] });
}

const NET = {
  none: null,
  fast4g: { latency: 40, down: 9 * 1024 * 1024 / 8, up: 1.5 * 1024 * 1024 / 8 },
  slow4g: { latency: 150, down: 1.6 * 1024 * 1024 / 8, up: 750 * 1024 / 8 }
};

function quantile(sorted, p) {
  if (!sorted.length) return null;
  const i = (sorted.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}
function summarize(values) {
  const v = values.filter(x => typeof x === 'number' && isFinite(x)).sort((a, b) => a - b);
  if (!v.length) return null;
  const q1 = quantile(v, .25), q3 = quantile(v, .75), med = quantile(v, .5);
  const mean = v.reduce((a, b) => a + b, 0) / v.length;
  const sd = Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, v.length - 1));
  return { n: v.length, min: +v[0].toFixed(2), q1: +q1.toFixed(2), median: +med.toFixed(2), q3: +q3.toFixed(2), max: +v[v.length - 1].toFixed(2), iqr: +(q3 - q1).toFixed(2), mean: +mean.toFixed(2), sd: +sd.toFixed(2), cvPct: mean ? +(sd / mean * 100).toFixed(1) : 0 };
}
// Share of the machine's CPU that is busy over `ms` (to detect background load before a run).
async function systemBusyPct(ms = 1000) {
  const snap = () => os.cpus().reduce((a, c) => { for (const k in c.times) a.t += c.times[k]; a.i += c.times.idle; return a; }, { t: 0, i: 0 });
  const a = snap(); await new Promise(r => setTimeout(r, ms)); const b = snap();
  const dt = b.t - a.t, di = b.i - a.i; return dt ? +((1 - di / dt) * 100).toFixed(1) : 0;
}
module.exports = { os, fs, path, chromium, launch, NET, BASE, PORT, ROOT, CHROME, quantile, summarize, systemBusyPct };
