// Preview-3 only: restored preview-2 train and reference-matched crane body.
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto');
const sharp=require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const dir=path.resolve(__dirname,'../assets/goi-viet/homepage-transport-3');
async function bounds(file){const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});let left=info.width,top=info.height,right=0,bottom=0;for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>16){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}return {left,top,width:right-left+1,height:bottom-top+1};}
(async()=>{
 const trainSource=path.join(dir,'train-restored-source.png'),trainBox=await bounds(trainSource),craneSource=path.join(dir,'crane-body-source.png'),bodyBox=await bounds(craneSource);
 for(const [q,width,height]of [['2k',1387,137],['4k',2774,274]])await sharp(trainSource).extract(trainBox).resize(width,height,{fit:'fill'}).webp({lossless:true,effort:6}).toFile(path.join(dir,'train-'+q+'.webp'));
 const body=await sharp(craneSource).extract(bodyBox).resize({width:460}).png().toBuffer(),bm=await sharp(body).metadata();
 if(bm.height>155)throw Error('Body does not fit the original rig envelope');
 const tile=await sharp({create:{width:512,height:512,channels:4,background:'#0000'}}).composite([{input:body,left:32,top:215}]).png().toBuffer();
 // Keep both original wing materials byte-for-byte at the decoded-pixel level.
 const old=path.resolve(dir,'../homepage-cranes/articulated-parts.webp');
 const atlas=await sharp(old).ensureAlpha().raw().toBuffer(),bodyPixels=await sharp(tile).ensureAlpha().raw().toBuffer();
 for(let y=0;y<512;y++)bodyPixels.copy(atlas,y*2048*4,y*512*4,(y+1)*512*4);
 await sharp(atlas,{raw:{width:2048,height:512,channels:4}}).webp({lossless:true,effort:6}).toFile(path.join(dir,'crane-parts.webp'));
 await sharp(tile).flatten({background:'#fff6df'}).png().toFile(path.join(dir,'crane-body-review.png'));
 const rect=[1245,1157,1387,137],smoke=[1320,1160,70,45];
 const config=`// Preview-3 homepage only. Does not touch the memory chapter train.\n(()=>{const base=new URL('.',document.currentScript.src);window.GoiVietHomeTransport3={apply(pack){if(document.body.dataset.previewVersion!=='3')return;const train=pack.manifest.layers.find(l=>l.id==='train'),smoke=pack.manifest.layers.find(l=>l.id==='smoke');if(!train)return;const previous=train.file;train.file='homepage-transport-3/train-'+pack.quality+'.webp';pack.sources[train.file]=new URL('train-'+pack.quality+'.webp?v=20261023-old-style-1',base).href;delete pack.sources[previous];train.rect=${JSON.stringify(rect)};train.label='Đoàn tàu nguyên mẫu preview-2 · phục hồi nét vẽ';delete train.spriteParts;if(smoke)smoke.rect=${JSON.stringify(smoke)};pack.manifest.homeTransport={version:'preview2-reference-20261023',trainReference:'homepage-layered/train.webp',trainBaseline:1294,craneReference:'homepage-layered/bird-one.webp',scope:'preview-3 homepage only'};}};})();\n`;
 await fs.writeFile(path.join(dir,'transport.js'),config);
 await fs.writeFile(path.join(dir,'build.json'),JSON.stringify({trainSourceBounds:trainBox,bodySourceBounds:bodyBox,bodyTile:{x:32,y:215,width:bm.width,height:bm.height},trainRect:rect,smokeRect:smoke,railY:1294,rigTexture:[2048,512],wingPixelsUnchanged:true,sourceHashes:await Promise.all([trainSource,craneSource].map(async f=>({file:path.basename(f),sha256:crypto.createHash('sha256').update(await fs.readFile(f)).digest('hex')})))},null,2));
 console.log(JSON.stringify({trainBox,bodyBox,bodyTile:[460,bm.height],rect,smoke}));
})().catch(e=>{console.error(e);process.exitCode=1;});
