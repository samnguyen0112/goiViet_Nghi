/* True DEM and land-cover materials, local and limited to the demo. */
(() => {
  'use strict';
  const C=window.GoiVietNaturalCore,intro=document.getElementById('introScreen'),active=()=>intro.classList.contains('intro-hidden'),tiles=new Map();
  let rasterReady=false;const pendingTiles=new Map(),placeholders=new Map();
  let terrain=null,promise=null,error=null,draws=0,builds=0,offshore=null,offshorePromise=null,offshoreError=null;
  const offshoreBuckets=new Map(),islandTiles=new Map();
  const colors={10:[61,106,76],20:[110,136,93],30:[125,146,101],40:[137,151,104],50:[164,160,144],60:[192,177,145],70:[218,220,201],80:[102,151,140],90:[91,134,109],95:[57,108,86],100:[127,142,101]};
  const blend=(a,b,t)=>a.map((v,i)=>v*(1-t)+b[i]*t);
  async function unpack(data){const result={...data};if(data.elevationsBase64)result.elevations=await C.decode(data.elevationsBase64,data.compression);if(data.landcoverBase64)result.landcover=await C.decode(data.landcoverBase64,data.compression,Uint8Array);result.patches=await Promise.all((data.patches||[]).map(unpack));return result;}
  function ensure(){if(promise)return promise;promise=C.load('terrain-data.js','GoiVietNaturalTerrain').then(unpack).then(data=>{terrain=data;tiles.clear();setupRaster();requestMapRender(3);syncAttribution();return data;}).catch(e=>{error=e.message;requestMapRender(2);return null;});return promise;}
  function contains(patch,x,y){const g=patch.grid;return x>=g.left&&y>=g.top&&x<=g.left+(g.width-1)*(g.stepX||g.step)&&y<=g.top+(g.height-1)*(g.stepY||g.step);}
  function sourceAt(x,y){if(!terrain)return null;for(const patch of offshoreBuckets.get(Math.floor(x/8)+':'+Math.floor(y/8))||[])if(contains(patch,x,y))return patch;for(const patch of terrain.patches||[])if(contains(patch,x,y))return patch;return terrain;}
  function ensureOffshore(){if(offshorePromise)return offshorePromise;offshorePromise=C.load('offshore-terrain-data.js','GoiVietNaturalOffshoreTerrain').then(unpack).then(data=>{offshore=data;for(const patch of data.patches||[]){const g=patch.grid;for(let row=Math.floor(g.top/8);row<=Math.floor((g.top+(g.height-1)*g.step)/8);row++)for(let col=Math.floor(g.left/8);col<=Math.floor((g.left+(g.width-1)*g.step)/8);col++){const key=col+':'+row;if(!offshoreBuckets.has(key))offshoreBuckets.set(key,[]);offshoreBuckets.get(key).push(patch);}}return data;}).catch(e=>{offshoreError=e.message;return null;});return offshorePromise;}
  function paintOffshore(context,item,camera,w,h){if(!offshore)return false;const density=camera.zoom>90?96:camera.zoom>40?48:24,dark=state.theme==='dark',b=item.bounds,key=[b.left,b.top,b.right,b.bottom,density,dark].join(':');let texture=islandTiles.get(key);if(!texture){const gutter=2/density,box={left:b.left-gutter,top:b.top-gutter,right:b.right+gutter,bottom:b.bottom+gutter},image=document.createElement('canvas');image.width=Math.max(4,Math.ceil((box.right-box.left)*density));image.height=Math.max(4,Math.ceil((box.bottom-box.top)*density));const ctx=image.getContext('2d'),pixels=ctx.createImageData(image.width,image.height);for(let row=0;row<image.height;row++)for(let col=0;col<image.width;col++){const x=box.left+(col+.5)/image.width*(box.right-box.left),y=box.top+(row+.5)/image.height*(box.bottom-box.top),m=material(x,y,dark),color=m&&m.cover!==0&&m.cover!==80?m.color:dark?[164,158,116]:[220,205,163],n=(row*image.width+col)*4;pixels.data[n]=color[0];pixels.data[n+1]=color[1];pixels.data[n+2]=color[2];pixels.data[n+3]=255;}ctx.putImageData(pixels,0,0);texture={image,box};islandTiles.set(key,texture);let bytes=[...islandTiles.values()].reduce((s,t)=>s+t.image.width*t.image.height*4,0);while(bytes>16*1024*1024&&islandTiles.size>1){const first=islandTiles.keys().next().value,t=islandTiles.get(first);bytes-=t.image.width*t.image.height*4;islandTiles.delete(first);}}context.save();C.path(context,item.rings,C.projector(camera,w,h),2);context.clip('evenodd');C.tile(context,texture.image,texture.box,C.projector(camera,w,h),w,h);context.restore();return true;}
  function material(x,y,dark=false){const source=sourceAt(x,y);if(!source)return null;const grid=source.grid,h=C.sample(grid,source.elevations,x,y);if(h===null)return null;const spacing=grid.step||grid.stepX,sx=grid.stepX||spacing,sy=grid.stepY||spacing;const at=(dx,dy)=>C.sample(grid,source.elevations,x+dx,y+dy)??h;
    const nx=-(at(sx,0)-at(-sx,0))/(2*sx*1780)*2.2,ny=-(at(0,sy)-at(0,-sy))/(2*sy*1780)*2.2,norm=Math.hypot(nx,ny,1),light=C.clamp(.62+.46*(nx*-.48+ny*-.55+.69)/norm,.54,1.12);
    const cover=source.landcover?C.sample(grid,source.landcover,x,y,true):null;let base=colors[cover]||blend([155,166,111],[59,104,76],C.clamp(h/1500));
    if(source.landcover){let sum=base.map(v=>v*4),weight=4;for(const [dx,dy]of [[sx,0],[-sx,0],[0,sy],[0,-sy]]){const c=C.sample(grid,source.landcover,x+dx,y+dy,true),other=colors[c];if(other){sum=sum.map((v,i)=>v+other[i]);weight++;}}base=sum.map(v=>v/weight);}
    base=blend(base,[139,139,114],C.clamp((h-1800)/2200)*.38);return {height:h,cover,light,color:base.map(v=>Math.round(C.clamp(v*light*(dark?.66:1),0,255)))};
  }
  function setupRaster(){
    const factory='const terrain=data,offshoreBuckets=new Map(),C={clamp:'+C.clamp.toString()+',sample:'+C.sample.toString()+'},colors='+JSON.stringify(colors)+';const blend='+blend.toString()+';'+contains.toString()+sourceAt.toString()+material.toString()+';return '+rasterPixels.toString();
    window.GoiVietRasterTasks?.define('terrain',factory,terrain);rasterReady=Boolean(window.GoiVietRasterTasks);
  }
  function rasterPixels(args){
    const {tx,ty,density,dark}=args,width=Math.ceil(48*density)+4,pixels=args.buffer?new Uint8ClampedArray(args.buffer):new Uint8ClampedArray(width*width*4);
    for(let y=args.rowStart||0;y<Math.min(args.rowEnd??width,width);y++)for(let x=0;x<width;x++){const m=material(tx*48+(x-1.5)/density,ty*48+(y-1.5)/density,dark),n=(y*width+x)*4,color=m?.color||[159,166,116];pixels[n]=color[0];pixels[n+1]=color[1];pixels[n+2]=color[2];pixels[n+3]=255;}
    return {width,height:width,buffer:pixels.buffer};
  }
  function retainTile(key,image){tiles.set(key,image);builds++;let bytes=[...tiles.values()].reduce((sum,c)=>sum+c.width*c.height*4,0);while(bytes>64*1024*1024&&tiles.size>1){const first=tiles.keys().next().value,c=tiles.get(first);bytes-=c.width*c.height*4;tiles.delete(first);}}
  function bake(tx,ty,density,dark){const key=[tx,ty,density,dark].join(':');if(tiles.has(key)){const t=tiles.get(key);tiles.delete(key);tiles.set(key,t);return t;}if(rasterReady&&(!window.GoiVietRasterTasks.inspect().failed||window.GoiVietRasterTasks.managed)){
    if(!pendingTiles.has(key)){const job=window.GoiVietRasterTasks.build('terrain',key,{tx,ty,density,dark}).then(image=>{pendingTiles.delete(key);placeholders.delete(key);retainTile(key,image);}).catch(()=>{pendingTiles.delete(key);});pendingTiles.set(key,job);}
    for(const d of [4,2,1.5,1]){const old=tiles.get([tx,ty,d,dark].join(':'));if(old)return old;}
    if(!placeholders.has(key)){const image=document.createElement('canvas');image.width=image.height=4;const context=image.getContext('2d'),color=material(tx*48+24,ty*48+24,dark)?.color||[159,166,116];context.fillStyle='rgb('+color.join(',')+')';context.fillRect(0,0,4,4);placeholders.set(key,image);}if(window.GoiVietRasterTasks.managed)while(placeholders.size>128)placeholders.delete(placeholders.keys().next().value);return placeholders.get(key);
  }const size=48,image=document.createElement('canvas');image.width=image.height=Math.ceil(size*density)+4;const ctx=image.getContext('2d'),pixels=ctx.createImageData(image.width,image.height);for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++){const m=material(tx*size+(x-1.5)/density,ty*size+(y-1.5)/density,dark),n=(y*image.width+x)*4;const color=m?.color||[159,166,116];pixels.data[n]=color[0];pixels.data[n+1]=color[1];pixels.data[n+2]=color[2];pixels.data[n+3]=255;}ctx.putImageData(pixels,0,0);tiles.set(key,image);builds++;let bytes=[...tiles.values()].reduce((sum,c)=>sum+c.width*c.height*4,0);while(bytes>64*1024*1024&&tiles.size>1){const first=tiles.keys().next().value,c=tiles.get(first);bytes-=c.width*c.height*4;tiles.delete(first);}return image;}
  const ringTiles=new WeakMap();
  let projectionKey='',tileProjections=new Map(),rejectedTiles=0;
  function candidates(ring){
    if(ringTiles.has(ring))return ringTiles.get(ring);
    const b=C.box(ring),result=[];
    for(let ty=Math.floor(b.top/48);ty<=Math.floor(b.bottom/48);ty++)for(let tx=Math.floor(b.left/48);tx<=Math.floor(b.right/48);tx++){
      // Conservative margin includes texture gutters and screen seam guards.
      const r={left:tx*48-32,top:ty*48-32,right:(tx+1)*48+32,bottom:(ty+1)*48+32};
      const edge=ring.some((p,i)=>{const q=ring[(i+1)%ring.length];return Math.min(p[0],q[0])<=r.right&&Math.max(p[0],q[0])>=r.left&&Math.min(p[1],q[1])<=r.bottom&&Math.max(p[1],q[1])>=r.top;});
      if(edge||pointInRing2D(r.left,r.top,ring))result.push([tx,ty]);else rejectedTiles++;
    }
    ringTiles.set(ring,result);return result;
  }
  function paintTop(context,ring,z,camera,w,h){
    if(!active())return false;ensure();if(!terrain)return false;
    const density=window.GoiVietRasterTasks?.lod?.("terrain",camera.zoom,[.8,1.8,4,12],[1.5,2,4,12,24])??(camera.zoom>12?24:camera.zoom>4?12:camera.zoom>1.8?4:camera.zoom>.8?2:1.5),dark=state.theme==='dark',project=C.projector(camera,w,h,z),gutter=2/density;
    const key=[w,h,...getMapScreenOrigin(w,h),camera.zoom,camera.yaw,camera.pitch,camera.panX,camera.panY].join(':');
    if(key!==projectionKey){projectionKey=key;tileProjections.clear();}
    const allowAffine=Boolean(window.GoiVietRasterTasks?.isMoving?.());
    context.save();context.clip();
    for(const[tx,ty]of candidates(ring)){
      const tileBox={left:tx*48-gutter,top:ty*48-gutter,right:(tx+1)*48+gutter,bottom:(ty+1)*48+gutter},id=[tx,ty,z,density].join(':');
      let pts=tileProjections.get(id);
      if(!pts){pts=[[tileBox.left,tileBox.top],[tileBox.right,tileBox.top],[tileBox.right,tileBox.bottom],[tileBox.left,tileBox.bottom]].map(p=>project(...p));tileProjections.set(id,pts);}
      if(pts.every(p=>p[0]<-2)||pts.every(p=>p[0]>w+2)||pts.every(p=>p[1]<-2)||pts.every(p=>p[1]>h+2))continue;
      C.tile(context,bake(tx,ty,density,dark),tileBox,project,w,h,pts,allowAffine);draws++;
    }
    context.restore();
    const points=window.GoiVietRenderPerformance?.projectRing?.(ring,z,camera,w,h)||ring.map(p=>project3D(p[0],p[1],z,camera,w,h));
    context.beginPath();for(let i=0;i<points.length;i++){const p=points[i];if(i)context.lineTo(p[0],p[1]);else context.moveTo(p[0],p[1]);}context.closePath();
    return true;
  }
  function paintShadow(context,points,zoom){if(!active())return;context.save();context.beginPath();points.forEach((p,i)=>i?context.lineTo(p[0],p[1]):context.moveTo(p[0],p[1]));context.closePath();context.fillStyle='rgba(26,60,46,.14)';context.shadowColor='rgba(23,50,41,.24)';context.shadowBlur=3*Math.max(.55,zoom);context.shadowOffsetY=2*zoom;context.fill();context.restore();}
  function syncAttribution(){const parent=document.querySelector('#mapSourcesContent');if(!parent||!terrain)return;let note=parent.querySelector('[data-natural-terrain]');if(!note){note=document.createElement('p');note.className='island-helper-note';note.dataset.naturalTerrain='true';note.innerHTML='Địa hình: <a href="https://dataspace.copernicus.eu/explore-data/data-collections/copernicus-contributing-missions/collections-description/COP-DEM" target="_blank" rel="noopener">Copernicus DEM</a>. Lớp phủ: <a href="https://esa-worldcover.org/en/data-access" target="_blank" rel="noopener">ESA WorldCover</a> 2021, CC BY 4.0. Dữ liệu đã được lấy mẫu và tô màu. © ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021). Copernicus WorldDEM-30 © DLR e.V. 2010–2014, © Airbus Defence and Space GmbH 2014–2018, provided under COPERNICUS by the European Union and ESA; all rights reserved.';parent.append(note);}}
  new MutationObserver(()=>{if(active())ensure();}).observe(intro,{attributes:true,attributeFilter:['class']});
  window.GoiVietNaturalTerrainRenderer=Object.freeze({ensure,ensureOffshore,paintOffshore,material,sourceAt,paintTop,paintShadow,inspect:()=>({ready:!!terrain,error,offshoreReady:!!offshore,offshoreError,offshorePatches:offshore?.patches?.length||0,islandCacheBytes:[...islandTiles.values()].reduce((sum,t)=>sum+t.image.width*t.image.height*4,0),pendingTiles:pendingTiles.size,grid:terrain?.grid,patches:terrain?.patches?.map(p=>({id:p.id,grid:p.grid})),builds,draws,rejectedTiles,cacheTiles:tiles.size,cacheBytes:[...tiles.values()].reduce((sum,c)=>sum+c.width*c.height*4,0),sources:terrain?{elevation:terrain.elevationDataset,landcover:terrain.landcoverDataset}:null})});
  window.GoiVietTerrainRelief=Object.freeze({active,paintTop,paintShadow,inspectAt:(x,y)=>{const m=material(x,y,state.theme==='dark');return m?{...m,pixelRGB:m.color,elevationMetres:m.height}:null;}});
  if(active())ensure();
})();
