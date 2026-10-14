// Build production packs from the reviewed Canvas lab, without debug images.
const fs=require('node:fs/promises'),path=require('node:path'),vm=require('node:vm');
const deps='C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp=require(deps+'/sharp'),{createCanvas,Image}=require(deps+'/@napi-rs/canvas');
const root=path.resolve(__dirname,'..'),lab=path.join(root,'exports/landscape-layers-lab-20261012'),out=path.join(root,'assets/goi-viet'),proof=path.join(root,'verification/homepage-layered-integration-20261012');
(async()=>{
  await fs.mkdir(path.join(out,'homepage-layered'),{recursive:true});await fs.mkdir(proof,{recursive:true});
  const source=JSON.parse(await fs.readFile(path.join(lab,'assets/manifest.json'),'utf8'));
  const renderer=await fs.readFile(path.join(lab,'scene.js'),'utf8');
  await fs.writeFile(path.join(out,'homepage-layered-renderer.js'),renderer);
  const packs=[],files=[];
  for(const quality of ['2k','4k']){
    const manifest=structuredClone(source),sources={};
    for(const field of ['reference','outline','source','objectFootprintPixels','originalRidgePixels'])delete manifest[field];
    for(const l of manifest.layers){
      const original=await fs.readFile(path.join(lab,l.file)),meta=await sharp(original).metadata();
      const bytes=quality==='4k'?original:await sharp(original).resize(Math.max(1,Math.round(meta.width/2)),Math.max(1,Math.round(meta.height/2))).webp({quality:92,alphaQuality:100,effort:5}).toBuffer();
      const file='homepage-layered/'+l.id+(quality==='2k'?'-2k':'')+'.webp';
      await fs.writeFile(path.join(out,file),bytes);l.file=file;delete l.png;
      sources[file]='data:image/webp;base64,'+bytes.toString('base64');
      files.push({id:l.id,quality,bytes:bytes.length,width:quality==='4k'?meta.width:Math.round(meta.width/2)});
    }
    const pack={manifest,sources,quality,sourceWidth:quality==='4k'?3840:1920};
    const filename=quality==='4k'?'homepage-layered-assets-4k.js':'homepage-layered-assets.js';
    const bundle='window.GoiVietHomeLayeredData='+JSON.stringify(pack)+';\n';
    await fs.writeFile(path.join(out,filename),bundle);await fs.writeFile(path.join(out,'homepage-layered/manifest-'+quality+'.json'),JSON.stringify(manifest,null,2));
    packs.push({quality,filename,bytes:Buffer.byteLength(bundle),pack});
  }
  const sandbox={window:{},Image,document:{createElement:()=>createCanvas(1,1)}};
  vm.runInNewContext(renderer,sandbox);const canvas=createCanvas(3840,2378),pack=packs.find(p=>p.quality==='4k').pack;
  const scene=await sandbox.window.LandscapeLab.create(canvas,pack.manifest,pack.sources);scene.render(12);
  const frame=canvas.toBuffer('image/png');
  for(const [width,filename]of [[3840,'homepage-layered-poster-4k.webp'],[1920,'homepage-layered-poster.webp']])await sharp(frame).resize({width}).webp({quality:92,effort:5}).toFile(path.join(out,filename));
  const report={generatedAt:new Date().toISOString(),layers:source.layers.length,packs:packs.map(({quality,filename,bytes})=>({quality,filename,bytes})),files};
  await fs.writeFile(path.join(proof,'production-size-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({layers:source.layers.length,packs:report.packs}));
})().catch(e=>{console.error(e);process.exitCode=1;});
