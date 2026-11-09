// Read-only static server for the perf harness: serves the project root with gzip (like typical static hosting).
// Usage: node tools/perf/server.cjs   (PORT env, default 8770). NOGZIP=1 disables compression.
const http = require('http'), fs = require('fs'), path = require('path'), zlib = require('zlib');
const ROOT = path.resolve(__dirname, '..', '..');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.ico': 'image/x-icon' };
const gz = new Map();
function precompress(dir) { // warm the gzip cache so the first measured request is not penalised
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === '.git' || e.name === 'scratch' || e.name === 'verification' || e.name === 'exports') continue;
    const f = path.join(dir, e.name);
    if (e.isDirectory()) precompress(f);
    else if (['.html', '.js', '.css', '.json', '.svg', '.mjs'].includes(path.extname(f).toLowerCase())) { const z = zlib.gzipSync(fs.readFileSync(f), { level: 6 }); z.mtimeMs = fs.statSync(f).mtimeMs; gz.set(f, z); }
  }
}
if (!process.env.NOGZIP) precompress(ROOT);
http.createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  const f = path.join(ROOT, u);
  if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.stat(f, (e, st) => {
    if (e || !st.isFile()) { res.writeHead(404); return res.end('nf'); }
    const ext = path.extname(f).toLowerCase();
    const h = { 'Content-Type': types[ext] || 'application/octet-stream', 'Cache-Control': 'public, max-age=0' };
    const comp = ['.html', '.js', '.css', '.json', '.svg', '.mjs'].includes(ext) && /gzip/.test(req.headers['accept-encoding'] || '') && !process.env.NOGZIP;
    if (comp) {
      let b = gz.get(f); if (!b || b.mtimeMs !== st.mtimeMs) { const z = zlib.gzipSync(fs.readFileSync(f), { level: 6 }); z.mtimeMs = st.mtimeMs; gz.set(f, z); b = z; }
      h['Content-Encoding'] = 'gzip'; h['Content-Length'] = b.length; res.writeHead(200, h); return res.end(b);
    }
    h['Content-Length'] = st.size;
    res.writeHead(200, h); fs.createReadStream(f).pipe(res);
  });
}).listen(+process.env.PORT || 8770, '127.0.0.1', () => console.log('perf server up', ROOT));
