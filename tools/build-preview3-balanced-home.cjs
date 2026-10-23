// Recompose native alpha layers for the approved lower railway, preview 3 only.
// Architecture translates rigidly; terrain is resampled once at build time.
const fs = require('node:fs/promises');
const path = require('node:path');
const vm = require('node:vm');
const deps = 'C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const sharp = require(deps + '/sharp');
const { createCanvas, Image } = require(deps + '/@napi-rs/canvas');
const root = path.resolve(__dirname, '..');
const base = path.join(root, 'assets/goi-viet');
const folder = path.join(base, 'homepage-balanced-3');
const smooth = t => { t = Math.max(0, Math.min(1,t)); return t*t*(3-2*t); };
const height = 2378;
const railwayOffset = 0;
function mapY(y) {
  const p=y/height;
  // Lower the peaks with the railway instead of stretching a tall slope from
  // the top edge. Keep the central landscape almost at its native proportions.
  const offset=railwayOffset;
  const shift=p<.38?270+(offset-270)*smooth(p/.38):p>.66?offset*(1-smooth((p-.66)/.34)):offset;
  return y + shift;
}
function inverseY(y) {
  let lo=0,hi=height;
  for(let i=0;i<28;i++){const mid=(lo+hi)/2;if(mapY(mid)<y)lo=mid;else hi=mid;}
  return (lo+hi)/2;
}
async function image(source) { const im=new Image(); im.src=source; await im.decode(); return im; }
(async()=>{
  await fs.mkdir(folder,{recursive:true});
  let maxUpperStretch=0;
  for(let y=0;y<height*.38;y++)maxUpperStretch=Math.max(maxUpperStretch,mapY(y+1)-mapY(y));
  if(maxUpperStretch>1.04)throw Error('Upper slopes are stretched too steeply');
  const reports=[];
  const repairedRidge=await require('./repair-preview3-ridge.cjs')(root);
  for(const quality of ['2k','4k']) {
    const box={window:{}};
    await vm.runInNewContext(await fs.readFile(path.join(base,quality==='4k'?'homepage-layered-assets-4k.js':'homepage-layered-assets.js'),'utf8'),box);
    const pack=box.window.GoiVietHomeLayeredData;
    const old=JSON.parse(JSON.stringify(pack.manifest));
    const birdZ=Math.max(...pack.manifest.layers.map(l=>l.z))+1;
    const terrain=[];
    for(const layer of pack.manifest.layers) {
      const [x,y,w,h]=layer.rect;
      if(['mountain','terrain'].includes(layer.kind)) {
        const im=await image(layer.id==='mountains-far-right'?repairedRidge[quality]:pack.sources[layer.file]);
        const top=mapY(y),bottom=mapY(y+h);
        const outHeight=Math.max(1,Math.round((bottom-top)*im.height/h));
        const canvas=createCanvas(im.width,outHeight),g=canvas.getContext('2d');
        g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
        // Integer destination rows avoid transparent seams between resampled strips.
        for(let row=0;row<outHeight;row++) {
          const world=top+(row+.5)*(bottom-top)/outHeight;
          const source=Math.max(0,Math.min(im.height-1,(inverseY(world)-y)*im.height/h-.5));
          g.drawImage(im,0,source,im.width,1,0,row,im.width,1);
        }
        // Interior rectangular asset bounds must not show through the expanded
        // paper sky. Feather only those side edges, never the screen perimeter.
        const edge=Math.min(64*im.width/w,im.width*.1);
        if(x>0||x+w<3840){
          const mask=g.createLinearGradient(0,0,im.width,0);
          mask.addColorStop(0,x>0?'#0000':'#000');
          if(x>0)mask.addColorStop(edge/im.width,'#000');
          if(x+w<3840)mask.addColorStop(1-edge/im.width,'#000');
          mask.addColorStop(1,x+w<3840?'#0000':'#000');
          g.globalCompositeOperation='destination-in';g.fillStyle=mask;g.fillRect(0,0,im.width,outHeight);
        }
        const name=layer.id+'-'+quality+'.webp';
        const encoded=await sharp(canvas.toBuffer('image/png')).webp({quality:96,alphaQuality:100,effort:5}).toBuffer();
        await fs.writeFile(path.join(folder,name),encoded);
        // The reveal compositor reads alpha pixels. Embedded sources keep that
        // canvas origin-clean when preview-3 is opened directly with file://.
        pack.sources[layer.file]='data:image/webp;base64,'+encoded.toString('base64');
        layer.rect=[x,top,w,bottom-top];
        terrain.push(layer.id);
      } else if(layer.kind==='fixed'||layer.kind==='smoke') {
        layer.rect=[x,mapY(y),w,h];
      } else if(layer.kind==='tree') {
        layer.rect=[x,mapY(y+h)-h,w,h];
        if(layer.root)layer.root[1]=mapY(layer.root[1]);
      } else if(layer.kind==='cloud') {
        const bottomEdge=y+h>=height-1;
        layer.rect=[x,bottomEdge?height-h:mapY(y+h*.5)-h*.5,w,h];
      } else if(layer.kind==='leaf') {
        layer.rect=[x,mapY(y),w,h];
      } else if(layer.kind==='bird') {
        layer.rect=[x-w*.05,y-h*.05,w*1.1,h*1.1];
        layer.period=(layer.period||25)/1.15;
        layer.z=birdZ;
        // Keep both birds visible throughout their flight across the invitation.
        layer.copySafeArea=false;
        if(layer.spriteFraming)layer.spriteFraming.scale*=1.1;
      }
    }
    const designHeight=pack.manifest.occlusionDesign?.[1]||987;
    for(const contour of Object.values(pack.manifest.occlusionContours||{})) {
      for(const command of contour.commands)for(let i=2;i<command.length;i+=2)command[i]=mapY(command[i]*height/designHeight)*designHeight/height;
    }
    // The sun belongs to the distant sky: all original mountains and clouds
    // occlude it. Reveal it after the far ridges arrive, never as a foreground badge.
    const sunFile='homepage-balanced-3/sun-painterly.png';
    const sun=await sharp(await fs.readFile(path.join(base,sunFile))).resize(quality==='4k'?700:350).png().toBuffer();
    pack.sources[sunFile]='data:image/png;base64,'+sun.toString('base64');
    pack.manifest.layers.push({id:'sun',label:'Mặt trời sau núi',kind:'sky',z:1,file:sunFile,rect:[620,350,700,700],alpha:true,entrance:[2.65,5.1,0]});
    pack.manifest.homeComposition={version:3,railwayOffset,terrainResampled:true,architectureRigid:true,upperTransition:'native-proportions',peakInset:270,sun:'behind-mountains-and-clouds',birds:{speedMultiplier:1.15,sizeMultiplier:1.1,foreground:true},invitationRestored:true};
    const bridge=pack.manifest.layers.find(l=>l.id==='bridge');
    pack.sources[bridge.file]='assets/goi-viet/homepage-layered/bridge-unified-3'+(quality==='2k'?'-2k':'')+'.webp';
    await fs.writeFile(path.join(folder,'assets-'+quality+'.js'),'window.GoiVietHomeLayeredData='+JSON.stringify(pack)+';\n');
    // Render the poster through the same compositor used by the animated view.
    const renderBox={window:{},Image,document:{createElement:()=>createCanvas(1,1)}};
    vm.runInNewContext(await fs.readFile(path.join(base,'homepage-layered-renderer.js'),'utf8'),renderBox);
    const width=quality==='4k'?3840:1920,canvas=createCanvas(width,Math.round(width*height/3840));
    const resolved=Object.fromEntries(Object.entries(pack.sources).map(([key,value])=>[key,value.startsWith('data:')?value:path.join(root,value)]));
    const scene=await renderBox.window.LandscapeLab.create(canvas,pack.manifest,resolved,{copySafeArea:true});
    scene.render(12);
    await sharp(canvas.toBuffer('image/png')).webp({quality:94,effort:5}).toFile(path.join(folder,'poster-'+quality+'.webp'));
    const rigid=pack.manifest.layers.filter(l=>l.kind==='fixed').map(l=>{
      const before=old.layers.find(o=>o.id===l.id);
      if(l.rect[2]!==before.rect[2]||l.rect[3]!==before.rect[3]||Math.abs(l.rect[1]-before.rect[1]-railwayOffset)>.01)throw Error('Architecture deformed: '+l.id);
      return {id:l.id,rect:l.rect,offset:l.rect[1]-before.rect[1]};
    });
    reports.push({quality,rigid,terrain,maxUpperStretch,poster:'poster-'+quality+'.webp'});
    console.log(JSON.stringify({quality,terrainLayers:terrain.length,rigidObjects:rigid.length}));
  }
  await fs.writeFile(path.join(folder,'composition.json'),JSON.stringify({height,offset:railwayOffset,reports},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
