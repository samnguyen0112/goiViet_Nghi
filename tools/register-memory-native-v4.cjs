// Preserve generated originals and export web assets at their actual native resolution.
// Never enlarge, sharpen, or interpolate a small source to manufacture an HD asset.
const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const crypto = require('node:crypto');
const dir = path.resolve(__dirname, '../assets/goi-viet/memory-native-v4');
(async () => {
  const [id, from] = process.argv.slice(2);
  if (!/^[a-z0-9-]+$/.test(id || '') || !from) throw Error('Usage: register-memory-native-v4.cjs asset-id generated-path');
  await fs.mkdir(path.join(dir, 'sources'), { recursive: true });
  const original = await fs.readFile(from), originalMeta = await sharp(original).metadata();
  await fs.writeFile(path.join(dir, 'sources', id + '.png'), original);
  // Trim only transparent export margins, retaining the untouched generation.
  // River canvas coordinates are part of its authored, continuous route.
  const pixels = originalMeta.hasAlpha && id !== 'river-continuous' ? await sharp(original).trim({ threshold: 8 }).png().toBuffer() : original;
  const meta = await sharp(pixels).metadata();
  const webp = await sharp(pixels).webp({ lossless: true, effort: 4 }).toBuffer();
  await fs.writeFile(path.join(dir, id + '.webp'), webp);
  const variants = [];
  for (const width of [640, 1280]) {
    if (width >= meta.width) continue;
    const name = `${id}-${width}.webp`;
    await sharp(pixels).resize({ width, withoutEnlargement: true }).webp({ quality: 96, alphaQuality: 100, effort: 4 }).toFile(path.join(dir, name));
    variants.push({ file: name, width });
  }
  let manifest;
  try { manifest = JSON.parse(await fs.readFile(path.join(dir, 'assets.json'), 'utf8')); }
  catch { manifest = { version: 4, method: 'Individually generated detailed native raster assets. Responsive exports downsample only; no upscaling.', assets: {} }; }
  manifest.assets[id] = { file: id + '.webp', source: 'sources/' + id + '.png', width: meta.width, height: meta.height, generatedWidth: originalMeta.width, generatedHeight: originalMeta.height, alpha: !!meta.hasAlpha, nativeEncoding:'lossless WebP', responsiveQuality:96, bytes: webp.length, sha256: crypto.createHash('sha256').update(original).digest('hex'), variants };
  await fs.writeFile(path.join(dir, 'assets.json'), JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify({ id, ...manifest.assets[id] }));
})().catch(error => { console.error(error); process.exitCode = 1; });

