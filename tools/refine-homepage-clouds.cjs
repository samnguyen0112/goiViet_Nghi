const fs=require('node:fs/promises'),path=require('node:path');
const root=path.resolve(__dirname,'..'),lab=path.join(root,'exports/landscape-layers-lab-20261012'),out=path.join(root,'verification/cloud-refinement-20261014');
(async()=>{
 const manifest=JSON.parse(await fs.readFile(path.join(lab,'assets/manifest.json'),'utf8'));
 const repairs=await require(path.join(lab,'tools/cloud-repair.cjs')).applyCloudRepairs({layers:manifest.layers,root:lab});
 manifest.cloudRepairs=repairs;if(!manifest.alphaMethod.includes('Seven damaged clouds'))manifest.alphaMethod+=' Seven damaged clouds have complete ImageGen contours, preserving true transparent alpha; occlusion by hills is applied only in the renderer.';
 const bundle={};for(const file of new Set([...manifest.layers.map(l=>l.file),manifest.reference,manifest.outline])){const b=await fs.readFile(path.join(lab,file));bundle[file]='data:image/'+(file.endsWith('.png')?'png':'webp')+';base64,'+b.toString('base64');}
 await fs.writeFile(path.join(lab,'assets/manifest.json'),JSON.stringify(manifest,null,2));await fs.writeFile(path.join(lab,'assets/manifest.js'),'window.LandscapeManifest='+JSON.stringify(manifest)+';\n');await fs.writeFile(path.join(lab,'assets/bundle.js'),'window.LandscapeAssets='+JSON.stringify(bundle)+';\n');
 await fs.writeFile(path.join(out,'cloud-repair-registration.json'),JSON.stringify(repairs,null,2));console.log(JSON.stringify(repairs));
})().catch(e=>{console.error(e);process.exitCode=1;});
