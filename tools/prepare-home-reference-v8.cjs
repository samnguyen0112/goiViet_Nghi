const fs=require('node:fs/promises'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const sharp=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),out=path.join(root,'assets/goi-viet/homepage-reference-v8'),proof=path.join(root,'verification/home-reference-v8');
const ids=['sky','mountains-far-left','mountains-far-right','mountains-mid-left','mountains-mid-right','mountains-near-left','mountains-near-right','river-valley','hanoi','hue','saigon','bridge'];
(async()=>{
 await fs.mkdir(path.join(out,'sources'),{recursive:true});await fs.mkdir(path.join(out,'references'),{recursive:true});await fs.mkdir(path.join(proof,'original-layers'),{recursive:true});
 const before=path.join(proof,'before.html');try{await fs.access(before);throw Error('Baseline already exists; refusing to replace it.');}catch(e){if(e.code!=='ENOENT')throw e;}
 await fs.copyFile(path.join(root,'map-surroundings-preview-3.html'),before);
 await fs.copyFile('C:/Users/Uy/AppData/Local/Temp/codex-clipboard-cbf4d39f-7a18-4e2e-8f66-61d4076bcd6b.png',path.join(out,'references/approved-home.png'));
 const originalFiles=['map-surroundings-preview-3.html','assets/goi-viet/homepage-layered-scene.js','assets/goi-viet/homepage-layered-renderer.js','assets/goi-viet/homepage-opening-controller.js','assets/goi-viet/homepage-layered-opening.js','assets/goi-viet/homepage-opening-config.js','assets/goi-viet/homepage-scene-layout.js'];
 for(const folder of ['assets/goi-viet/homepage-classic-3','assets/goi-viet/homepage-layered','assets/goi-viet/memory-reference-v5','assets/goi-viet/memory-rail-v6','assets/goi-viet/map-surroundings-preview']){
  for(const file of await fs.readdir(path.join(root,folder),{withFileTypes:true}))if(file.isFile())originalFiles.push(folder+'/'+file.name);
 }
 const hashes=[];for(const file of [...new Set(originalFiles)])hashes.push({file,sha256:crypto.createHash('sha256').update(await fs.readFile(path.join(root,file))).digest('hex')});
 await fs.writeFile(path.join(proof,'original-hashes.json'),JSON.stringify(hashes,null,2));
 for(const file of originalFiles.slice(1,7))await fs.copyFile(path.join(root,file),path.join(proof,path.basename(file)+'.before'));
 const box={window:{}};vm.runInNewContext(await fs.readFile(path.join(root,'assets/goi-viet/homepage-classic-3/assets-4k.js'),'utf8'),box);
 const pack=box.window.GoiVietHomeLayeredData;await fs.writeFile(path.join(proof,'original-manifest.json'),JSON.stringify(pack.manifest,null,2));
 const layers=[];
 for(const layer of pack.manifest.layers){
  if(!ids.includes(layer.id))continue;
  const bytes=Buffer.from(pack.sources[layer.file].split(',')[1],'base64'),file=path.join(proof,'original-layers',layer.id+'.webp');await fs.writeFile(file,bytes);
  const m=await sharp(bytes).metadata();layers.push({id:layer.id,rect:layer.rect,width:m.width,height:m.height,alpha:m.hasAlpha,file:path.relative(root,file).replaceAll('\\','/')});
 }
 await fs.writeFile(path.join(out,'generation-plan.json'),JSON.stringify({reference:'references/approved-home.png',basePack:'../homepage-classic-3/assets-4k.js',preserve:'All layer transforms, entrance times, order, motion and original alpha contours.',layers},null,2));
 console.log(JSON.stringify({reference:[(await sharp(path.join(out,'references/approved-home.png')).metadata()).width,(await sharp(path.join(out,'references/approved-home.png')).metadata()).height],layers,protectedFiles:hashes.length}));
})().catch(e=>{console.error(e);process.exitCode=1;});
