const fs=require('node:fs/promises'),path=require('node:path');
const root=path.resolve(__dirname,'..');
(async()=>{
 const file=path.join(root,'map-surroundings-preview-3.html');let html=await fs.readFile(file,'utf8');
 if(!html.includes('data-home-art="reference-v8"'))html=html.replace('data-home-theme="classic"','data-home-theme="classic" data-home-art="reference-v8"');
 html=html.replaceAll('homepage-classic-3/poster-','homepage-reference-v8/poster-');
 html=html.replace(/homepage-layered-scene\.js\?[^"\s]+/g,'homepage-layered-scene.js?v=reference-layers-v8-20261021-1');
 html=html.replace(/(homepage-reference-v8\/poster-(?:2k|4k)\.webp)\?[^"\s]+/g,'$1?v=reference-layers-v8-20261021-1');
 await fs.writeFile(file,html);console.log('Preview-3 selects independent reference-v8 layers; intro controller and page content unchanged.');
})().catch(e=>{console.error(e);process.exitCode=1;});
