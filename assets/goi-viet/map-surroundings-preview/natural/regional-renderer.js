/* Preview-only warm relief: Copernicus for named neighbours, GEBCO for context. */
(() => {
  'use strict';
  const C=window.GoiVietNaturalCore,tiles=new Map(),pendingTiles=new Map(),placeholders=new Map();
  const colors={laos:[220,204,159],thailand:[229,209,168],cambodia:[218,204,154],context:[229,212,174]};
  let data=null,contextSource=null,promise=null,error=null,builds=0,rasterReady=false,fallbackKernel=null;
  function ensure(){
    if(promise)return promise;
    promise=C.load('regional-terrain-data.js','GoiVietNaturalRegionalTerrain').then(async source=>{
      data={grid:source.grid,values:await C.decode(source.elevationsBase64,source.compression)};
      setupRaster();requestMapRender(3);return true;
    }).catch(e=>{error=e.message;return false;});return promise;
  }
  function setupRaster(){
    if(!data)return;
    const factory='const source=data,C={clamp:'+C.clamp.toString()+',sample:'+C.sample.toString()+'},colors='+JSON.stringify(colors)+';return '+rasterPixels.toString();
    window.GoiVietRasterTasks?.define('regional',factory,{...data,context:contextSource});
    fallbackKernel=null;rasterReady=Boolean(window.GoiVietRasterTasks);
  }
  function rasterPixels(args){
    const {tx,ty,density,id,dark}=args,size=id==='context'?192:48,width=size*density+4,height=width,buffer=new Uint8ClampedArray(width*height*4);
    const regional=id==='context'?source.context:source,g=regional.grid,values=regional.values,base=colors[id]||colors.context,sx=g.stepX||g.step,sy=g.stepY||g.step;
    const sample=(x,y)=>{
      const main=C.sample(g,values,x,y);if(id==='context')return main;
      const broad=source.context?C.sample(source.context.grid,source.context.values,x,y):null;
      if(main===null)return broad;if(broad===null)return main;
      const edge=Math.min(x-g.left,y-g.top,g.left+(g.width-1)*sx-x,g.top+(g.height-1)*sy-y),t=C.clamp(edge/24),weight=t*t*(3-2*t);
      return broad*(1-weight)+main*weight;
    };
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
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
  function remember(key,canvas){tiles.set(key,canvas);builds++;while(tiles.size>640)tiles.delete(tiles.keys().next().value);}
  function image(tx,ty,density,id,dark){
    const key=[tx,ty,density,id,dark].join(':');if(tiles.has(key))return tiles.get(key);
    if(rasterReady&&!window.GoiVietRasterTasks.inspect().failed){
      if(!pendingTiles.has(key))pendingTiles.set(key,window.GoiVietRasterTasks.build('regional',key,{tx,ty,density,id,dark}).then(canvas=>{pendingTiles.delete(key);placeholders.delete(key);remember(key,canvas);}).catch(()=>pendingTiles.delete(key)));
      for(const d of [3,1.5]){const old=tiles.get([tx,ty,d,id,dark].join(':'));if(old)return old;}
      if(!placeholders.has(key)){const canvas=document.createElement('canvas');canvas.width=canvas.height=4;const ctx=canvas.getContext('2d');ctx.fillStyle='rgb('+(colors[id]||colors.context).map(v=>Math.round(v*(dark?.48:1))).join(',')+')';ctx.fillRect(0,0,4,4);placeholders.set(key,canvas);}return placeholders.get(key);
    }
    fallbackKernel ||= new Function('source','C','colors','return '+rasterPixels.toString())({...data,context:contextSource},C,colors);
    const result=fallbackKernel({tx,ty,density,id,dark}),canvas=document.createElement('canvas');canvas.width=result.width;canvas.height=result.height;
    canvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(result.buffer),result.width,result.height),0,0);remember(key,canvas);return canvas;
  }
  function paint(context,country,camera,w,h,extent,dark,path){
    ensure();
    if(country.id==='context'){
      const source=window.GoiVietNaturalLandscape?.contextTerrain();
      if(source&&source.values!==contextSource?.values){contextSource=source;setupRaster();}
      if(!contextSource)return;
    }
    context.save();context.fillStyle='rgb('+(colors[country.id]||colors.context).map(v=>Math.round(v*(dark?.48:1))).join(',')+')';context.fill(path,'evenodd');
    if(data){
      context.clip(path,'evenodd');const density=country.id==='context'?.75:camera.zoom>1.4?3:1.5,size=country.id==='context'?192:48;
      const box=C.box(country.polygons.flatMap(p=>p.outer||p[0]||[])),b={left:Math.max(box.left,extent.left),top:Math.max(box.top,extent.top),right:Math.min(box.right,extent.right),bottom:Math.min(box.bottom,extent.bottom)},project=C.projector(camera,w,h);
      for(let ty=Math.floor(b.top/size);ty<=Math.floor(b.bottom/size);ty++)for(let tx=Math.floor(b.left/size);tx<=Math.floor(b.right/size);tx++)C.tile(context,image(tx,ty,density,country.id,dark),{left:tx*size-2/density,top:ty*size-2/density,right:(tx+1)*size+2/density,bottom:(ty+1)*size+2/density},project,w,h);
    }
    context.restore();
  }
  window.GoiVietNaturalRegionalRelief=Object.freeze({ensure,paint,inspect:()=>({ready:!!data,contextReady:!!contextSource,error,builds,pendingTiles:pendingTiles.size,cacheTiles:tiles.size,grid:data?.grid,contextGrid:contextSource?.grid})});
})();
