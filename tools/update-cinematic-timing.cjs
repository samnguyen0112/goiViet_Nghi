// Animation metadata only; the reviewed image assets are left untouched.
const fs=require('node:fs/promises'),path=require('node:path');
const root=path.resolve(__dirname,'../exports/landscape-layers-lab-20261012/assets');
(async()=>{
  const file=path.join(root,'manifest.json'),manifest=JSON.parse(await fs.readFile(file,'utf8'));
  const timings={'mountains-far-left':[.2,2.2,0],'mountains-far-right':[.55,2.55,0],'mountains-mid-left':[1.45,3.9,0],'mountains-mid-right':[1.8,4.25,0],'mountains-near-left':[3.1,5.75,0],'mountains-near-right':[3.45,6.1,0],'river-valley':[1.6,5.75,0]};
  for(const l of manifest.layers)if(timings[l.id])l.entrance=timings[l.id];
  manifest.openingMethod='Staggered depth entrance: far, middle and near mountains reveal separately, with overlapping timing and a slight left-right delay. Normalized mist follows visible ownership from real object alpha, conceals foothill contacts and prevents pale seams. All terrain stays registered with a uniform approach limited to 1.8 percent. Bridge, train and architecture dissolve at final coordinates; independent sprites continue ambient motion.';
  await fs.writeFile(file,JSON.stringify(manifest,null,2));await fs.writeFile(path.join(root,'manifest.js'),'window.LandscapeManifest='+JSON.stringify(manifest)+';\n');
  console.log(JSON.stringify(timings));
})().catch(e=>{console.error(e);process.exitCode=1;});
