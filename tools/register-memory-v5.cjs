// Keep native ImageGen sources intact. Web exports only trim alpha or downsample.
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const base = path.resolve(__dirname, '../assets/goi-viet/memory-reference-v5');
(async () => {
  const input = process.argv[2] ? Buffer.from(process.argv[2], 'base64').toString('utf8') : require('node:fs').readFileSync(0, 'utf8');
  const { id, from, prompt = '' } = JSON.parse(input);
  if (!/^[a-z0-9-]+$/.test(id)) throw Error('Invalid asset id');
  await fs.mkdir(path.join(base, 'sources'), { recursive: true });
  const original = await fs.readFile(from);
  const sourceMeta = await sharp(original).metadata();
  await fs.writeFile(path.join(base, 'sources', id + '.png'), original);
  const retainCanvas = id.startsWith('river-') || ['bay-water', 'chapter-ridges', 'foreground-frame'].includes(id);
  const pixels = sourceMeta.hasAlpha && !retainCanvas
    ? await sharp(original).trim({ threshold: 6 }).png().toBuffer() : original;
  const meta = await sharp(pixels).metadata();
  await sharp(pixels).webp({ lossless: true, effort: 4 }).toFile(path.join(base, id + '.webp'));
  const variants = [];
  for (const width of [640, 1280]) {
    if (width >= meta.width) continue;
    const file = `${id}-${width}.webp`;
    await sharp(pixels).resize({ width, withoutEnlargement: true }).webp({ quality: 95, alphaQuality: 100 }).toFile(path.join(base, file));
    variants.push({ file, width });
  }
  // A separate record per asset keeps concurrent registrations from losing entries.
  const entry = { id, source: `sources/${id}.png`, file: `${id}.webp`, width: meta.width, height: meta.height,
    generatedWidth: sourceMeta.width, generatedHeight: sourceMeta.height, alpha: !!meta.hasAlpha,
    sha256: crypto.createHash('sha256').update(original).digest('hex'), variants,
    generator: 'built-in image_gen', prompt, sourcePath: from };
  await fs.writeFile(path.join(base, id + '.json'), JSON.stringify(entry, null, 2));
  console.log(JSON.stringify({ id, width: meta.width, height: meta.height, alpha: entry.alpha }));
})().catch(e => { console.error(e); process.exitCode = 1; });
