// Package the reviewed ImageGen bridge and render matching preview-3 posters.
const fs = require('node:fs/promises');
const path = require('node:path');
const vm = require('node:vm');
const deps = 'C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp = require(deps + '/sharp');
const { createCanvas, Image } = require(deps + '/@napi-rs/canvas');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'assets/goi-viet');
const proof = path.join(root, 'verification/bridge-unified-20261018');
(async () => {
  await fs.mkdir(proof, { recursive: true });
  const source = process.argv[2];
  if (!source) throw new Error('Provide the generated bridge PNG.');
  await fs.copyFile(source, path.join(proof, 'bridge-generated.png'));
  const crop = { left: 0, top: 283, width: 2172, height: 157 };
  const png = await sharp(source).extract(crop).resize(3840, 278, { fit: 'fill' }).png().toBuffer();
  await fs.writeFile(path.join(out, 'homepage-layered/bridge-unified-3.png'), png);
  for (const [width, suffix] of [[3840, ''], [1920, '-2k']]) {
    await sharp(png).resize({ width }).webp({ lossless: true, effort: 6 }).toFile(path.join(out, 'homepage-layered/bridge-unified-3' + suffix + '.webp'));
  }
  const box = { window: {}, Image, document: { createElement: () => createCanvas(1, 1) } };
  vm.runInNewContext(await fs.readFile(path.join(out, 'homepage-layered-assets-4k.js'), 'utf8'), box);
  vm.runInNewContext(await fs.readFile(path.join(out, 'homepage-layered-renderer.js'), 'utf8'), box);
  const pack = box.window.GoiVietHomeLayeredData;
  const bridge = pack.manifest.layers.find(l => l.id === 'bridge');
  const canvas = createCanvas(3840, 2378);
  const before = await box.window.LandscapeLab.create(canvas, pack.manifest, pack.sources);
  before.render(12);
  await sharp(canvas.toBuffer('image/png')).extract({ left: 0, top: 1255, width: 3840, height: 315 }).png().toFile(path.join(proof, 'before.png'));
  pack.sources[bridge.file] = 'data:image/png;base64,' + png.toString('base64');
  const scene = await box.window.LandscapeLab.create(canvas, pack.manifest, pack.sources);
  scene.render(12);
  const frame = canvas.toBuffer('image/png');
  await sharp(frame).extract({ left: 0, top: 1255, width: 3840, height: 315 }).png().toFile(path.join(proof, 'after.png'));
  for (const [width, suffix] of [[3840, '-4k'], [1920, '']]) {
    await sharp(frame).resize({ width }).webp({ quality: 92, effort: 5 }).toFile(path.join(out, 'homepage-layered-poster-3' + suffix + '.webp'));
  }
  // A fixed architectural sprite must remain identical as ambient time advances.
  scene.enabled.clear(); scene.enabled.add('bridge'); scene.setOcclusion(false);
  scene.render(12); const first = canvas.toBuffer('image/png');
  scene.setWind(1.5); scene.render(71);
  if (!first.equals(canvas.toBuffer('image/png'))) throw new Error('Bridge changed during ambient motion');
  const report = { source: 'bridge-generated.png', crop, rect: bridge.rect, stationary: true, qualityVariants: ['2k', '4k'] };
  await fs.writeFile(path.join(proof, 'checks.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
})().catch(error => { console.error(error); process.exitCode = 1; });
