// Export the existing brand layer and package the supplied text-free scenery.
// Original artwork is never overwritten; only delivery size/encoding changes.
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const deps = 'C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp = require(deps + '/sharp');
const { chromium } = require(deps + '/playwright');
const root = path.resolve(__dirname, '..');
const assets = path.join(root, 'assets/goi-viet');
const evidence = path.join(root, 'verification/homepage-editable-20261012');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

(async () => {
  await fs.mkdir(evidence, { recursive: true });
  process.env.TMP = process.env.TEMP = path.join(evidence, 'browser-temp');
  await fs.mkdir(process.env.TEMP, { recursive: true });
  // Reuse the exact alpha extraction already used by the approved renderer.
  const oldLayout = await fs.readFile(path.join(evidence, 'homepage-scene-layout.js.before'), 'utf8');
  const oldScene = await fs.readFile(path.join(evidence, 'homepage-scene.js.before'), 'utf8');
  const source = await fs.readFile(path.join(assets, 'homepage-scene-4k/source-with-text.webp'));
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  let logo;
  try {
    const page = await browser.newPage();
    await page.route('**/*', route => {
      const url = route.request().url();
      if (url === 'http://homepage-assets.test/') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><meta charset="utf-8">' });
      if (url === 'http://homepage-assets.test/layout.js') return route.fulfill({ contentType: 'application/javascript', body: oldLayout });
      if (url === 'http://homepage-assets.test/scene.js') return route.fulfill({ contentType: 'application/javascript', body: oldScene });
      return route.abort();
    });
    await page.goto('http://homepage-assets.test/');
    await page.addScriptTag({ url: 'http://homepage-assets.test/layout.js' });
    await page.addScriptTag({ url: 'http://homepage-assets.test/scene.js' });
    const exported = await page.evaluate(async src => {
      const image = new Image();
      image.src = src;
      await image.decode();
      const layer = GoiVietHomeScene.createLogoLayer(image);
      if (!layer) throw Error('Existing logo layer unavailable');
      return layer.canvas.toDataURL('image/png');
    }, 'data:image/webp;base64,' + source.toString('base64'));
    logo = Buffer.from(exported.split(',')[1], 'base64');
  } finally { await browser.close(); }
  await fs.writeFile(path.join(assets, 'homepage-logo.png'), logo);

  // This existing clean layer was made from image/Giao diện trang đầu-4K.png.
  // It contains the train/scenery, with the stationary particle duplicates removed.
  const landscape = await fs.readFile(path.join(assets, 'homepage-scene-4k/edge-landscape.webp'));
  const reports = [];
  for (const [suffix, width, quality] of [['', 1920, 90], ['-4k', 3840, 92]]) {
    const poster = await sharp(landscape).resize({ width, withoutEnlargement: true }).webp({ quality, effort: 6 }).toBuffer();
    await fs.writeFile(path.join(assets, 'homepage-landscape' + suffix + '.webp'), poster);
    const packed = { 'landscape.webp': 'data:image/webp;base64,' + poster.toString('base64') };
    for (const name of ['crane.webp', 'leaf.webp', 'petal.webp']) {
      packed[name] = 'data:image/webp;base64,' + (await fs.readFile(path.join(assets, 'homepage-scene-4k', name))).toString('base64');
    }
    const bundle = Buffer.from('window.GoiVietHomeSceneAssets=' + JSON.stringify(packed) + ';\n');
    await fs.writeFile(path.join(assets, 'homepage-landscape-assets' + suffix + '.js'), bundle);
    reports.push({ width, posterBytes: poster.length, bundleBytes: bundle.length, bundleSHA256: sha(bundle) });
  }
  await fs.writeFile(path.join(evidence, 'asset-evidence.json'), JSON.stringify({
    landscapeSource: 'image/Giao diện trang đầu-4K.png',
    cleanRuntimeSource: 'assets/goi-viet/homepage-scene-4k/edge-landscape.webp',
    cleanRuntimeSourceSHA256: sha(landscape),
    logoSource: 'existing GoiVietHomeScene.createLogoLayer, exported without changing its ink',
    logoBytes: logo.length,
    variants: reports
  }, null, 2));
  console.log(JSON.stringify({ logoBytes: logo.length, variants: reports }));
})().catch(error => { console.error(error); process.exitCode = 1; });
