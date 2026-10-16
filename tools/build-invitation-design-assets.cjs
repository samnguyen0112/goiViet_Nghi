/* Deterministic export of decorative fragments from the approved mockup.
   No type, copy, feature bar, or button is exported into the running interface. */
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'assets/goi-viet/map-surroundings-preview/invitation');

(async () => {
  const input = process.argv[2];
  if (!input) throw Error('Pass the approved mockup PNG as the sole argument.');
  const reference = await fs.readFile(input);
  const metadata = await sharp(reference).metadata();
  if (metadata.width !== 1962 || metadata.height !== 801) throw Error('Unexpected approved reference dimensions.');
  await fs.mkdir(output, {recursive: true});
  const fragments = [
    ['border-tl', 0, 0, 64, 64], ['border-top', 64, 0, 1834, 64], ['border-tr', 1898, 0, 64, 64],
    ['border-left', 0, 64, 64, 673], ['border-right', 1898, 64, 64, 673],
    ['border-bl', 0, 737, 64, 64], ['border-bottom', 64, 737, 1834, 64], ['border-br', 1898, 737, 64, 64],
    ['art-tl', 0, 24, 290, 396], ['art-tr', 1678, 24, 284, 396],
    ['art-bl', 0, 420, 507, 381], ['art-br', 1456, 420, 506, 381],
    ['icon-train', 646, 91, 46, 44], ['icon-landmark', 207, 439, 99, 82],
    ['icon-cards', 713, 445, 92, 74], ['icon-family', 1280, 446, 88, 73]
  ];
  const manifest = {referenceSize: [1962, 801], referenceSha256: crypto.createHash('sha256').update(reference).digest('hex'), fragments: []};
  for (const [name, left, top, width, height] of fragments) {
    let pipeline = sharp(reference).extract({left, top, width, height}).ensureAlpha();
    if (name.startsWith('art-')) {
      const {data} = await pipeline.raw().toBuffer({resolveWithObject: true});
      for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        let alpha = 1;
        if (name === 'art-bl' && y < 128 && x >= 165) alpha = 0;
        if (name === 'art-br' && y < 128 && x < 401) alpha = 0;
        if (name.endsWith('l')) alpha *= Math.min(1, (width - 1 - x) / 32);
        else alpha *= Math.min(1, x / 32);
        data[(y * width + x) * 4 + 3] = Math.round(255 * Math.max(0, alpha));
      }
      pipeline = sharp(data, {raw: {width, height, channels: 4}});
    }
    const file = name + '.png';
    await pipeline.png({compressionLevel: 9}).toFile(path.join(output, file));
    manifest.fragments.push({name, file, crop: [left, top, width, height]});
  }
  await fs.writeFile(path.join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(JSON.stringify({fragments: manifest.fragments.length, referenceSize: manifest.referenceSize, output}));
})().catch(error => {console.error(error.message); process.exitCode = 1;});
