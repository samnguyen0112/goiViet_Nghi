// Package the generated alpha artwork without tracing, sharpening or recoloring it.
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = path.resolve(__dirname, '..');

(async () => {
  const source = process.argv[2];
  if (!source) throw new Error('Usage: node tools/build-brand-logo.cjs <generated-logo.png>');
  const bytes = await fs.readFile(source);
  const metadata = await sharp(bytes).metadata();
  if (!metadata.hasAlpha) throw new Error('The generated logo must have a transparent alpha channel.');
  const destination = path.join(root, 'assets/goi-viet/brand');
  await fs.mkdir(destination, { recursive: true });
  await fs.writeFile(path.join(destination, 'goi-viet-logo.png'), bytes);
  const web = await sharp(bytes).webp({ lossless: true, effort: 6 }).toBuffer();
  await fs.writeFile(path.join(destination, 'goi-viet-logo.webp'), web);
  for (const width of [512, 1024]) {
    await sharp(bytes).resize({ width, withoutEnlargement: true }).webp({ lossless: true, effort: 6 })
      .toFile(path.join(destination, `goi-viet-logo-${width}.webp`));
  }
  await fs.writeFile(path.join(root, 'assets/goi-viet/postcard-logo-data.js'),
    '/* Shared regenerated logo, embedded for offline postcard canvas export. */\n' +
    'window.GoiVietPostcardLogoData=' + JSON.stringify('data:image/png;base64,' + bytes.toString('base64')) + ';\n');
  await fs.writeFile(path.join(destination, 'manifest.json'), JSON.stringify({
    generator: 'built-in image_gen', width: metadata.width, height: metadata.height,
    transparent: true, sourceSha256: crypto.createHash('sha256').update(bytes).digest('hex'),
    png: 'goi-viet-logo.png', web: 'goi-viet-logo.webp', responsiveWidths: [512, 1024, metadata.width], webEncoding: 'lossless',
    offlineExport: '../postcard-logo-data.js'
  }, null, 2) + '\n');
  console.log(JSON.stringify({ width: metadata.width, height: metadata.height, pngBytes: bytes.length, webBytes: web.length }));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
