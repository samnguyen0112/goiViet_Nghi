const fs = require('fs'), path = require('path'), crypto = require('crypto');
const root = path.resolve(__dirname, '..');
const dependencies = process.argv[2] ? path.resolve(process.argv[2]) : path.join(root, 'node_modules');
const source = path.join(root, 'assets/departure-3d.mjs');
const hash = crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex');
const threePackage = require(path.join(dependencies, 'three/package.json'));
if (threePackage.version !== '0.186.1') throw new Error('Build requires pinned three@0.186.1.');
require(path.join(dependencies, 'esbuild')).buildSync({
  absWorkingDir: root, entryPoints: [source], bundle: true, format: 'iife',
  globalName: 'HeritageDeparture3D', outfile: path.join(root, 'assets/departure-3d.bundle.js'),
  minify: true, target: ['es2020'], nodePaths: [dependencies], tsconfigRaw: {}, legalComments: 'eof',
  banner: { js: `/* Source SHA256: ${hash}; Three.js 0.186.1 (MIT). */` }
});
fs.copyFileSync(path.join(dependencies, 'three/LICENSE'), path.join(root, 'assets/THREE-LICENSE.txt'));
console.log('Built local, offline departure scene.');
