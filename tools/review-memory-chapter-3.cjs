const fs=require('node:fs/promises'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const sharp=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const root=path.resolve(__dirname,'..'),art=path.join(root,'assets/goi-viet/memory-chapter-3'),out=path.join(root,'verification/memory-chapter-3');
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
const luminance=hex=>hex.match(/\w\w/g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
(async()=>{
 const html=await fs.readFile(path.join(root,'map-surroundings-preview-3.html'),'utf8');
 const chapter=html.slice(html.indexOf('<section id="memoryChapter"'),html.indexOf('<div id="memoryMapTransition"'));
 const ids=[...chapter.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,'New duplicate IDs');
 const resources=[...chapter.matchAll(/\b(?:src|href)="(assets\/[^"?#]+)[^"]*"/g)].map(m=>m[1]);
 for(const file of resources)await fs.access(path.join(root,file));
 const manifest=JSON.parse(await fs.readFile(path.join(art,'manifest.json'),'utf8'));
 for(const asset of manifest.assets){const file=path.join(art,asset.file),meta=await sharp(file).metadata();assert.equal(meta.width,asset.width);assert.equal(meta.height,asset.height);assert.equal(meta.hasAlpha,asset.hasAlpha);}
 const files=['map-surroundings-preview-3.html','assets/goi-viet/map-surroundings-preview/memory-chapter-3.css','assets/goi-viet/map-surroundings-preview/memory-chapter-3.js','assets/goi-viet/homepage-opening-controller.js'];
 const sources=[];
 for(const file of files){const data=await fs.readFile(path.join(root,file));if(file.endsWith('.js'))new vm.Script(data.toString());sources.push({file,sha256:hash(data)});assert(!data.toString().includes('references/approved-concept.png'),'Mockup is used in running page');}
 const css=await fs.readFile(path.join(root,files[1]),'utf8'),numberColor=css.match(/\.mc-number\s*\{[^}]*color:#([0-9a-f]{6})/i)[1];
 const contrast={};for(const color of ['123d34','932e27','81592b',numberColor]){const a=luminance(color),b=luminance('fcf1dc');contrast[color]=(Math.max(a,b)+.05)/(Math.min(a,b)+.05);}
 assert(Object.values(contrast).every(value=>value>=4.5),'Palette contrast misses normal-text target');
 const report={ids:ids.length,resources:resources.length,assetVariants:manifest.assets.length,approvedReferenceSHA256:hash(await fs.readFile(path.join(art,'references/approved-concept.png'))),contrastOnBasePaper:contrast,sources};
 await fs.writeFile(path.join(out,'source-review.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1;});
