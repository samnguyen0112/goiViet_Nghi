// GD0 section 0.5: resource inventory from a flow JSONL run (transfer bytes vs decoded bytes, per phase, no double counting).
// node tools/perf/inventory.cjs <results.jsonl> [runIndex=0] [out.json]
const { fs, path, ROOT } = require('./lib.cjs');
const crypto = require('crypto');
const file = path.resolve(ROOT, process.argv[2] || 'tools/perf/results/gd0/inventory-p4-x1.jsonl');
const idx = +(process.argv[3] || 0);
const outPath = path.resolve(ROOT, process.argv[4] || 'tools/perf/results/gd0/inventory-p4.json');
const runs = fs.readFileSync(file, 'utf8').trim().split('\n').map(l => JSON.parse(l));
const R = runs[idx], w = R.wall;
const phaseOf = t => t < w.gate ? 'A. đến cổng sẵn sàng' : t < w.openingClick ? 'B. sau cổng, chờ bấm' : t < w.openingEnd ? 'C. mở đầu' : t < w.memoryBegin ? 'D. trang chủ' : t < w.enterClick ? 'E. chương Miền ký ức' : t < w.mapClear + 300 ? 'F. vào bản đồ' : 'G. trên bản đồ';
function dims(buf, ext) {
  try {
    if (ext === '.png') return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
    if (ext === '.webp') {
      const t = buf.toString('ascii', 12, 16);
      if (t === 'VP8X') return [1 + buf.readUIntLE(24, 3), 1 + buf.readUIntLE(27, 3)];
      if (t === 'VP8 ') return [buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff];
      if (t === 'VP8L') { const b = buf.readUInt32LE(21); return [(b & 0x3fff) + 1, ((b >> 14) & 0x3fff) + 1]; }
    }
    if (ext === '.jpg' || ext === '.jpeg') { let i = 2; while (i < buf.length) { if (buf[i] !== 0xff) { i++; continue; } const m = buf[i + 1]; if (m >= 0xc0 && m <= 0xc3) return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)]; i += 2 + buf.readUInt16BE(i + 2); } }
  } catch (e) { }
  return null;
}
const seen = new Map(), dup = [];
for (const q of R.inventory) {
  const key = q.u.split('?')[0];
  if (seen.has(key)) { dup.push({ u: key, tr: q.tr, t: q.t, ph: phaseOf(q.t) }); continue; }
  seen.set(key, { ...q, key, ph: phaseOf(q.t) });
}
const kind = (u, ty) => /\.(png|jpe?g|webp|gif|svg|ico)$/i.test(u) ? 'ảnh' : /\.js$/i.test(u) ? 'js' : /\.css$/i.test(u) ? 'css' : /\.(woff2?|ttf)$/i.test(u) ? 'font' : /\.(mp3|ogg|wav|m4a)$/i.test(u) ? 'audio' : /\.(mp4|webm)$/i.test(u) ? 'video' : /\.json$/i.test(u) ? 'json' : /\.html$/i.test(u) || ty === 'Document' ? 'html' : 'khác';
const rows = [];
for (const [key, q] of seen) {
  const fp = path.join(ROOT, decodeURIComponent(key)); let disk = null, sha = null, dim = null, gpuBytes = null;
  if (fs.existsSync(fp) && fs.statSync(fp).isFile()) {
    const buf = fs.readFileSync(fp); disk = buf.length; sha = crypto.createHash('sha256').update(buf).digest('hex').slice(0, 12);
    dim = dims(buf, path.extname(fp).toLowerCase()); if (dim) gpuBytes = dim[0] * dim[1] * 4;
  }
  rows.push({ url: key, phase: q.ph, kind: kind(key, q.ty), transfer: q.tr, wire: q.dec, disk, sha, dim, rgbaBytes: gpuBytes, t: q.t });
}
const mb = n => +(n / 1048576).toFixed(2);
const sum = (arr, f) => arr.reduce((a, r) => a + (f(r) || 0), 0);
const byPhase = {}, byKind = {}, byPK = {};
for (const r of rows) {
  const p = byPhase[r.phase] = byPhase[r.phase] || { n: 0, transfer: 0, rgba: 0 }; p.n++; p.transfer += r.transfer; p.rgba += r.rgbaBytes || 0;
  const k = byKind[r.kind] = byKind[r.kind] || { n: 0, transfer: 0, rgba: 0 }; k.n++; k.transfer += r.transfer; k.rgba += r.rgbaBytes || 0;
  const pk = byPK[r.phase + ' | ' + r.kind] = byPK[r.phase + ' | ' + r.kind] || { n: 0, transfer: 0 }; pk.n++; pk.transfer += r.transfer;
}
// Name-prefix groups (to see what the gate really pulls in)
const group = u => { const m = u.replace(/^assets\/goi-viet\//, '').split('/'); return m.length > 2 ? m.slice(0, 2).join('/') : (m.length > 1 ? m[0] : '(root)'); };
const byGroup = {};
for (const r of rows.filter(x => x.phase.startsWith('A'))) { const g = group(r.url); const b = byGroup[g] = byGroup[g] || { n: 0, transfer: 0, rgba: 0 }; b.n++; b.transfer += r.transfer; b.rgba += r.rgbaBytes || 0; }
const html = fs.readFileSync(path.join(ROOT, R.env.target), 'utf8'); let inJs = 0, inCss = 0;
for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) inCss += Buffer.byteLength(m[1]);
for (const m of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) inJs += Buffer.byteLength(m[1]);
const out = {
  source: path.relative(ROOT, file), target: R.env.target, htmlSha256: R.env.htmlSha256, env: { cpu: R.env.cpu, gpu: R.env.gpu, net: R.env.net, chrome: R.env.chrome },
  note: 'transfer = bytes on the wire (local server gzip level 6 for text); wire = bytes after content-decoding; rgba = width*height*4 of images when decoded (upper bound of RAM/GPU cost, not what the browser always keeps)',
  html: { inlineJsBytes: inJs, inlineCssBytes: inCss }, totals: { files: rows.length, duplicateRequests: dup.length, duplicateTransferMB: mb(sum(dup, r => r.tr)), transferMB: mb(sum(rows, r => r.transfer)), rgbaMB: mb(sum(rows, r => r.rgbaBytes)) },
  byPhase: Object.fromEntries(Object.entries(byPhase).sort().map(([k, v]) => [k, { n: v.n, transferMB: mb(v.transfer), rgbaMB: mb(v.rgba) }])),
  byKind: Object.fromEntries(Object.entries(byKind).map(([k, v]) => [k, { n: v.n, transferMB: mb(v.transfer), rgbaMB: mb(v.rgba) }])),
  byPhaseKind: Object.fromEntries(Object.entries(byPK).sort().map(([k, v]) => [k, { n: v.n, transferMB: mb(v.transfer) }])),
  gateByGroup: Object.fromEntries(Object.entries(byGroup).sort((a, b) => b[1].transfer - a[1].transfer).map(([k, v]) => [k, { n: v.n, transferMB: mb(v.transfer), rgbaMB: mb(v.rgba) }])),
  duplicates: dup, rows
};
fs.writeFileSync(outPath, JSON.stringify(out, null, 1));
console.log('totals', JSON.stringify(out.totals), '\nbyPhase', JSON.stringify(out.byPhase, null, 1), '\nbyKind', JSON.stringify(out.byKind), '\nhtml inline', JSON.stringify(out.html), '\ngateByGroup(top)', JSON.stringify(Object.entries(out.gateByGroup).slice(0, 14)));
console.log('duplicates:', dup.map(d => `${d.ph.slice(0, 1)} ${d.tr} ${d.u}`).join('\n  '));
console.log('top 20 files by transfer:'); rows.sort((a, b) => b.transfer - a.transfer).slice(0, 20).forEach(r => console.log(' ', r.phase.slice(0, 1), r.transfer, r.kind, r.dim ? r.dim.join('x') : '', r.url));
