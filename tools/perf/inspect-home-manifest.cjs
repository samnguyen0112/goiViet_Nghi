// Read-only: list the home scene layers (kind, z, entrance timing) from the active art pack, to see which layers feed drawAtmosphere.
const fs = require('fs');
const f = process.argv[2] || 'assets/goi-viet/homepage-reference-v9/assets-2k.js';
const t = fs.readFileSync(f, 'utf8');
const key = '"layers":[';
const i = t.indexOf(key);
console.log('file chars', t.length, '| "layers" at', i);
if (i < 0) process.exit(0);
const start = i + key.length - 1;
let depth = 0, inStr = false, esc = false, quote = '', end = -1;
for (let p = start; p < t.length; p++) {
  const c = t[p];
  if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === quote) inStr = false; continue; }
  if (c === '"') { inStr = true; quote = c; continue; }
  if (c === '[') depth++;
  else if (c === ']') { depth--; if (depth === 0) { end = p; break; } }
}
const layers = JSON.parse(t.slice(start, end + 1));
console.log('layers:', layers.length);
for (const l of layers) console.log(String(l.z).padStart(3), String(l.kind || '').padEnd(9), String(l.id || '').padEnd(18), 'entrance', JSON.stringify(l.entrance || null));
const terrain = layers.filter(l => l.kind === 'mountain' || l.kind === 'terrain');
console.log('terrain/mountain layers (feed reveal weights; "sky" is added first):', terrain.map(l => l.id + '@' + JSON.stringify(l.entrance || 'default')).join(', '));
