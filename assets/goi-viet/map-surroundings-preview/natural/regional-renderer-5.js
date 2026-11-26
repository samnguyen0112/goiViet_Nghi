/* Preview-5 copy of regional-renderer-4.js (A-01): polygon-tile culling skips empty bounding-box tiles
   outside actual country/land outlines without losing any pixel; shared placeholder while curtain holds.
   Other previews keep regional-renderer-4.js untouched. */
(() => {
  'use strict';
  const C=window.GoiVietNaturalCore,tiles=window.GoiVietRasterTasks?.createCache?.()||new Map(),pendingTiles=new Map(),placeholders=new Map();
  const colors={laos:[220,204,159],thailand:[229,209,168],cambodia:[218,204,154],context:[229,212,174]};
  const polygonTiles=new WeakMap();
  let sharedPlaceholders=null;
  let data=null,contextSource=null,promise=null,error=null,builds=0,rasterReady=false,fallbackKernel=null,culledTiles=0;
  function ensure(){
    if(promise)return promise;
    promise=C.load('regional-terrain-data.js','GoiVietNaturalRegionalTerrain').then(async source=>{
      data={grid:source.grid,values:await C.decode(source.elevationsBase64,source.compression)};
      setupRaster();requestMapRender(3);return true;
    }).catch(e=>{error=e.message;return false;});return promise;
  }
  function setupRaster(){
    if(!data)return;
    if(window.GoiVietRasterTasks?.managed){tiles.clear();placeholders.clear();}
    const factory='const source=data,C={clamp:'+C.clamp.toString()+',sample:'+C.sample.toString()+'},colors='+JSON.stringify(colors)+';return '+rasterPixels.toString();
    window.GoiVietRasterTasks?.define('regional',factory,{...data,context:contextSource});
    fallbackKernel=null;rasterReady=Boolean(window.GoiVietRasterTasks);
  }
  function rasterPixels(args){
    const {tx,ty,density,id,dark}=args,size=id==='context'?192:48,width=size*density+4,height=width,buffer=args.buffer?new Uint8ClampedArray(args.buffer):new Uint8ClampedArray(width*height*4);
    const regional=id==='context'?source.context:source,g=regional.grid,values=regional.values,base=colors[id]||colors.context,sx=g.stepX||g.step,sy=g.stepY||g.step;
    const sample=(x,y)=>{
      const main=C.sample(g,values,x,y);if(id==='context')return main;
      const broad=source.context?C.sample(source.context.grid,source.context.values,x,y):null;
      if(main===null)return broad;if(broad===null)return main;
      const edge=Math.min(x-g.left,y-g.top,g.left+(g.width-1)*sx-x,g.top+(g.height-1)*sy-y),t=C.clamp(edge/24),weight=t*t*(3-2*t);
      return broad*(1-weight)+main*weight;
    };
    for(let y=args.rowStart||0;y<Math.min(args.rowEnd??height,height);y++)for(let x=0;x<width;x++){
      const wx=tx*size+(x-1.5)/density,wy=ty*size+(y-1.5)/density,h=sample(wx,wy),n=(y*width+x)*4;
      let shade=1,elevation=0,fade=0;
      if(h!==null){
        const at=(dx,dy)=>sample(wx+dx,wy+dy)??h;
        const nx=-(at(sx,0)-at(-sx,0))/(sx*3560)*3,ny=-(at(0,sy)-at(0,-sy))/(sy*3560)*3;
        shade=C.clamp(.9+.14*(nx*-.5+ny*-.55+.7)/Math.hypot(nx,ny,1),.83,1.04);
        elevation=C.clamp((h-60)/1800);
        fade=1;
      }
      const strength=id==='context'?.34:.45,grain=Math.sin(wx*31.2+wy*65.4)*Math.sin(wx*79.1-wy*13.8)*.55;
      for(let i=0;i<3;i++){
        const terrain=(base[i]*(1-elevation*strength)+[145,160,124][i]*elevation*strength)*shade;
        buffer[n+i]=(base[i]*(1-fade)+terrain*fade+grain)*(dark?.48:1);
      }
      buffer[n+3]=255;
    }
    return {width,height,buffer:buffer.buffer};
  }
  function fastPlaceholder(id,dark){
    if(!sharedPlaceholders)sharedPlaceholders={};
    const key=id+':'+(dark?1:0);
    if(!sharedPlaceholders[key]){
      const canvas=document.createElement('canvas');canvas.width=canvas.height=4;
      const ctx=canvas.getContext('2d');
      ctx.fillStyle='rgb('+(colors[id]||colors.context).map(v=>Math.round(v*(dark?.48:1))).join(',')+')';
      ctx.fillRect(0,0,4,4);
      sharedPlaceholders[key]=canvas;
    }
    return sharedPlaceholders[key];
  }
  function remember(key,canvas){builds++;if(window.GoiVietRasterTasks?.managed)window.GoiVietRasterTasks.cache(tiles,key,canvas,64*1024*1024);else{tiles.set(key,canvas);while(tiles.size>640)tiles.delete(tiles.keys().next().value);}}
  function image(tx,ty,density,id,dark){
    const key=[tx,ty,density,id,dark].join(':');if(tiles.has(key)){if(window.GoiVietRasterTasks?.managed&&tiles.touch)return tiles.touch(key);const image=tiles.get(key);if(window.GoiVietRasterTasks?.managed){tiles.delete(key);tiles.set(key,image);}return image;}
    if(rasterReady&&(!window.GoiVietRasterTasks.inspect().failed||window.GoiVietRasterTasks.managed)){
      if(!pendingTiles.has(key))pendingTiles.set(key,window.GoiVietRasterTasks.build('regional',key,{tx,ty,density,id,dark}).then(canvas=>{pendingTiles.delete(key);placeholders.delete(key);remember(key,canvas);}).catch(()=>pendingTiles.delete(key)));
      for(const d of [3,1.5]){const old=tiles.get([tx,ty,d,id,dark].join(':'));if(old)return old;}
      if(window.GoiVietMapPrewarm3?.holding()||window.GoiVietMapPrewarm3?.preparing())return fastPlaceholder(id,dark);
      if(!placeholders.has(key)){const canvas=document.createElement('canvas');canvas.width=canvas.height=4;const ctx=canvas.getContext('2d');ctx.fillStyle='rgb('+(colors[id]||colors.context).map(v=>Math.round(v*(dark?.48:1))).join(',')+')';ctx.fillRect(0,0,4,4);placeholders.set(key,canvas);}if(window.GoiVietRasterTasks.managed)while(placeholders.size>128)placeholders.delete(placeholders.keys().next().value);return placeholders.get(key);
    }
    fallbackKernel ||= new Function('source','C','colors','return '+rasterPixels.toString())({...data,context:contextSource},C,colors);
    const result=fallbackKernel({tx,ty,density,id,dark}),canvas=document.createElement('canvas');canvas.width=result.width;canvas.height=result.height;
    canvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(result.buffer),result.width,result.height),0,0);remember(key,canvas);return canvas;
  }
  // Exact segment-vs-AABB intersection (Liang-Barsky) for conservative tile-outline overlap.
  function segHitsRect(x1,y1,x2,y2,left,top,right,bottom){
    let t0=0,t1=1;const dx=x2-x1,dy=y2-y1;
    const checks=[[-dx,x1-left],[dx,right-x1],[-dy,y1-top],[dy,bottom-y1]];
    for(let i=0;i<4;i++){
      const p=checks[i][0],q=checks[i][1];
      if(p===0){if(q<0)return false;}
      else{const t=q/p;if(p<0){if(t>t1)return false;if(t>t0)t0=t;}else{if(t<t0)return false;if(t<t1)t1=t;}}
    }
    return t0<=t1;
  }
  // Precompute all (tx, ty) tiles that intersect any polygon outer ring (edge-walk + scanline interior).
  // Margin 4 world units exceeds the maximum tile gutter (2/0.75 = 2.67) so zero edge pixels are clipped.
  function candidates(polygons,size){
    let bySize=polygonTiles.get(polygons);
    if(bySize&&bySize.has(size))return bySize.get(size);
    const cells=new Map(),margin=4;
    for(const poly of polygons){
      const r=Array.isArray(poly)?poly[0]:poly.outer;
      if(!r||r.length<3)continue;
      let minY=Infinity,maxY=-Infinity;const n=r.length;
      for(let i=0;i<n;i++){
        const a=r[i],b=r[(i+1)%n],ax=a[0],ay=a[1],bx=b[0],by=b[1];
        if(ay<minY)minY=ay;if(ay>maxY)maxY=ay;
        const tx0=Math.floor((Math.min(ax,bx)-margin)/size),tx1=Math.floor((Math.max(ax,bx)+margin)/size);
        const ty0=Math.floor((Math.min(ay,by)-margin)/size),ty1=Math.floor((Math.max(ay,by)+margin)/size);
        if(tx0===tx1&&ty0===ty1){const k=tx0+':'+ty0;if(!cells.has(k))cells.set(k,[tx0,ty0]);}
        else for(let ty=ty0;ty<=ty1;ty++)for(let tx=tx0;tx<=tx1;tx++){
          const k=tx+':'+ty;if(cells.has(k))continue;
          if(segHitsRect(ax,ay,bx,by,tx*size-margin,ty*size-margin,(tx+1)*size+margin,(ty+1)*size+margin))cells.set(k,[tx,ty]);
        }
      }
      const row0=Math.floor((minY-margin)/size),row1=Math.floor((maxY+margin)/size),rowCount=row1-row0+1;
      if(rowCount<=0)continue;
      const xsByRow=Array.from({length:rowCount},()=>[]);
      for(let i=0;i<n;i++){
        const a=r[i],b=r[(i+1)%n],y1=a[1],y2=b[1];
        if(y1===y2)continue;
        const lo=Math.min(y1,y2),hi=Math.max(y1,y2);
        const rStart=Math.max(row0,Math.ceil(lo/size-0.5)),rEnd=Math.min(row1,Math.floor(hi/size-0.5));
        for(let ty=rStart;ty<=rEnd;ty++){
          const y=(ty+0.5)*size;
          if((y1>y)!==(y2>y))xsByRow[ty-row0].push(a[0]+(b[0]-a[0])*(y-y1)/(y2-y1));
        }
      }
      for(let idx=0;idx<rowCount;idx++){
        const xs=xsByRow[idx];if(xs.length<2)continue;
        xs.sort((u,v)=>u-v);const ty=row0+idx;
        for(let j=0;j+1<xs.length;j+=2){
          const tx0=Math.ceil(xs[j]/size-0.5),tx1=Math.floor(xs[j+1]/size-0.5);
          for(let tx=tx0;tx<=tx1;tx++){const k=tx+':'+ty;if(!cells.has(k))cells.set(k,[tx,ty]);}
        }
      }
    }
    const list=[...cells.values()].sort((a,b)=>a[1]-b[1]||a[0]-b[0]);
    if(!bySize){bySize=new Map();polygonTiles.set(polygons,bySize);}
    bySize.set(size,list);
    return list;
  }
  // Clipping every tile triangle to a country outline made the GPU rebuild that outline's mask about 1,500 times per
  // backdrop. The tiles are drawn unclipped into this layer instead, and the layer is cut to the outline once.
  let layer=null;
  function layerFor(context){
    if(!(context instanceof CanvasRenderingContext2D))return context; // the home-screen preparation draws nothing
    const c=context.canvas;layer ||= document.createElement('canvas').getContext('2d');
    if(layer.canvas.width!==c.width||layer.canvas.height!==c.height){layer.canvas.width=c.width;layer.canvas.height=c.height;}
    layer.setTransform(1,0,0,1,0,0);layer.clearRect(0,0,c.width,c.height);layer.setTransform(context.getTransform());return layer;
  }
  function* paintSteps(context,country,camera,w,h,extent,dark,path){
    ensure();
    if(country.id==='context'){
      const source=window.GoiVietNaturalLandscape?.contextTerrain();
      if(source&&source.values!==contextSource?.values){contextSource=source;setupRaster();}
      if(!contextSource)return;
    }
    context.save();context.fillStyle='rgb('+(colors[country.id]||colors.context).map(v=>Math.round(v*(dark?.48:1))).join(',')+')';context.fill(path,'evenodd');
    if(data){
      const target=layerFor(context);if(target===context)context.clip(path,'evenodd');const density=country.id==='context'?.75:(window.GoiVietRasterTasks?.lod?.('regional',camera.zoom,[1.4],[1.5,3])??(camera.zoom>1.4?3:1.5)),size=country.id==='context'?192:48;
      const box=C.box(country.polygons.flatMap(p=>p.outer||p[0]||[])),b={left:Math.max(box.left,extent.left),top:Math.max(box.top,extent.top),right:Math.min(box.right,extent.right),bottom:Math.min(box.bottom,extent.bottom)},project=C.projector(camera,w,h);
      const txMin=Math.floor(b.left/size),txMax=Math.floor(b.right/size),tyMin=Math.floor(b.top/size),tyMax=Math.floor(b.bottom/size);
      const bboxCount=txMax>=txMin&&tyMax>=tyMin?(txMax-txMin+1)*(tyMax-tyMin+1):0;
      let drawn=0;
      for(const [tx,ty] of candidates(country.polygons,size)){
        if(tx<txMin||tx>txMax||ty<tyMin||ty>tyMax)continue;
        C.tile(target,image(tx,ty,density,country.id,dark),{left:tx*size-2/density,top:ty*size-2/density,right:(tx+1)*size+2/density,bottom:(ty+1)*size+2/density},project,w,h);
        drawn++;yield;
      }
      if(bboxCount>drawn)culledTiles+=bboxCount-drawn;
      if(target!==context){target.save();target.globalCompositeOperation='destination-in';target.fill(path,'evenodd');target.restore();context.setTransform(1,0,0,1,0,0);context.drawImage(target.canvas,0,0);}
    }
    context.restore();
  }
  function paint(...args){for(const step of paintSteps(...args)){} }
  window.GoiVietNaturalRegionalRelief=Object.freeze({ensure,paint,paintSteps,inspect:()=>({ready:!!data,contextReady:!!contextSource,error,builds,culledTiles,pendingTiles:pendingTiles.size,cacheTiles:tiles.size,cacheBytes:tiles.byteSize??[...tiles.values()].reduce((sum,c)=>sum+c.width*c.height*4,0),grid:data?.grid,contextGrid:contextSource?.grid})});
})();
