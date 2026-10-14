/* DEM-grounded illustrated material on the existing world coordinate plane.
   Elevation/slope: Mapzen Terrain Tiles (USGS SRTM/GMTED2010, NOAA ETOPO1).
   Colors/light exaggeration are art direction; no displaced hit geometry. */
(() => {
  'use strict';
  const intro = document.getElementById('introScreen');
  const active = () => Boolean(intro?.classList.contains('intro-hidden'));
  const scale = 2.5;
  const bounds = { left: minWX - 2, top: minWY - 2, right: maxWX + 2, bottom: maxWY + 2 };
  const materials = new Map();
  let shading;
  let dem, loading = false, failed = false;
  const meshes = new WeakMap();
  const clamp = (n, low=0, high=1) => Math.max(low, Math.min(high,n));
  const lerp = (a,b,t) => a+(b-a)*t;
  function readyDEM() {
    if(dem)return true;
    const source=window.GoiVietDEM;if(!source)return false;
    const bytes=Uint8Array.from(atob(source.data),c=>c.charCodeAt(0)),view=new DataView(bytes.buffer),values=new Int16Array(bytes.length/2);
    for(let i=0;i<values.length;i++)values[i]=view.getInt16(i*2,true);
    dem={...source.grid,values};return true;
  }
  function ensureDEM() {
    if(readyDEM())return true;
    if(loading||failed)return false;
    loading=true;const script=document.createElement('script');script.src='assets/goi-viet/map-dem-grid.js?v=20261014-1';
    script.onload=()=>{loading=false;if(active()){readyDEM();requestMapRender(2);syncAttribution();}};
    script.onerror=()=>{loading=false;failed=true;};document.head.appendChild(script);return false;
  }
  function elevation(x,y) {
    const gx=clamp((x-dem.left)/dem.step,0,dem.width-1),gy=clamp((y-dem.top)/dem.step,0,dem.height-1),col=Math.min(dem.width-2,Math.floor(gx)),row=Math.min(dem.height-2,Math.floor(gy)),u=gx-col,v=gy-row,at=(r,c)=>Math.max(0,dem.values[r*dem.width+c]);
    return lerp(lerp(at(row,col),at(row,col+1),u),lerp(at(row+1,col),at(row+1,col+1),u),v);
  }
  // Elevation drives a continuous jade/gold ramp. No silhouette-side tint or
  // procedural terrain is added; geometry and hit coordinates remain unchanged.
  const toneAtHeight = metres => clamp(metres / 2400);
  function sample(x,y) {
    const metres=elevation(x,y);
    return {x,y,metres,height:metres/80,tone:toneAtHeight(metres)};
  }
  function smoothDEM() {
    if(shading)return shading;
    const {width,height,step}=dem,length=width*height;
    let heights=Float32Array.from(dem.values,v=>Math.max(0,v));
    // A separable binomial filter softens the resampled DEM, without introducing
    // peaks or patterned facets. Two passes also smooth the normals at grid joins.
    for(let pass=0;pass<2;pass++)for(const axis of[0,1]){
      const next=new Float32Array(length);
      for(let y=0;y<height;y++)for(let x=0;x<width;x++){
        const at=(dx,dy)=>heights[clamp(y+dy,0,height-1)*width+clamp(x+dx,0,width-1)];
        next[y*width+x]=axis?(at(0,-1)+2*at(0,0)+at(0,1))/4:(at(-1,0)+2*at(0,0)+at(1,0))/4;
      }
      heights=next;
    }
    const tones=new Float32Array(length),lights=new Float32Array(length);
    for(let y=0;y<height;y++)for(let x=0;x<width;x++){
      const at=(dx,dy)=>heights[clamp(y+dy,0,height-1)*width+clamp(x+dx,0,width-1)];
      const nx=-(at(1,0)-at(-1,0))/(2*step*80),ny=-(at(0,1)-at(0,-1))/(2*step*80),normal=Math.hypot(nx,ny,1);
      tones[y*width+x]=toneAtHeight(at(0,0));
      lights[y*width+x]=clamp(.70+.42*(nx*-.48+ny*-.52+.71)/normal,.73,1.08);
    }
    let softLights=lights;
    // Smooth lighting as well as height: avoid bands where steep normals meet.
    for(let pass=0;pass<2;pass++)for(const axis of[0,1]){
      const next=new Float32Array(length);
      for(let y=0;y<height;y++)for(let x=0;x<width;x++){
        const at=(dx,dy)=>softLights[clamp(y+dy,0,height-1)*width+clamp(x+dx,0,width-1)];
        next[y*width+x]=axis?(at(0,-1)+2*at(0,0)+at(0,1))/4:(at(-1,0)+2*at(0,0)+at(1,0))/4;
      }
      softLights=next;
    }
    shading={heights,tones,lights:softLights};return shading;
  }
  function shadeAt(x,y) {
    const {heights,tones,lights}=smoothDEM(),gx=clamp((x-dem.left)/dem.step,0,dem.width-1),gy=clamp((y-dem.top)/dem.step,0,dem.height-1),col=Math.min(dem.width-2,Math.floor(gx)),row=Math.min(dem.height-2,Math.floor(gy)),u=gx-col,v=gy-row;
    const mix=values=>lerp(lerp(values[row*dem.width+col],values[row*dem.width+col+1],u),lerp(values[(row+1)*dem.width+col],values[(row+1)*dem.width+col+1],u),v);
    return {metres:mix(heights),tone:mix(tones),light:mix(lights)};
  }
  function bake(group) {
    const key=group.materialKey;
    if(materials.has(key))return materials.get(key);
    if(!ensureDEM())return null;
    const canvas=document.createElement('canvas');canvas.width=Math.ceil((bounds.right-bounds.left)*scale);canvas.height=Math.ceil((bounds.bottom-bounds.top)*scale);
    const brush=canvas.getContext('2d',{alpha:false}),image=brush.createImageData(canvas.width,canvas.height),pixels=image.data;
    // Continuous raster shading: no drawn contour, facet edge or pigment flecks.
    for(let row=0;row<canvas.height;row++)for(let col=0;col<canvas.width;col++){
      const {metres,light}=shadeAt(bounds.left+(col+.5)/scale,bounds.top+(row+.5)/scale),base=window.GoiVietMapPalette.colorAtHeight(metres),offset=(row*canvas.width+col)*4;
      for(let c=0;c<3;c++)pixels[offset+c]=Math.round(clamp(base[c]*light,0,255));
      pixels[offset+3]=255;
    }
    brush.putImageData(image,0,0);materials.set(key,canvas);return canvas;
  }
  function meshFor(ring) {
    if(meshes.has(ring))return meshes.get(ring);
    const step=24,left=Math.max(bounds.left,Math.min(...ring.map(p=>p[0]))),right=Math.min(bounds.right,Math.max(...ring.map(p=>p[0]))),top=Math.max(bounds.top,Math.min(...ring.map(p=>p[1]))),bottom=Math.min(bounds.bottom,Math.max(...ring.map(p=>p[1]))),tiles=[];
    for(let y=top;y<bottom;y+=step)for(let x=left;x<right;x+=step){const x1=Math.min(x+step,right),y1=Math.min(y+step,bottom),sx=(x-bounds.left)*scale,sy=(y-bounds.top)*scale,sw=(x1-x)*scale,sh=(y1-y)*scale;
      tiles.push({world:[[x,y],[x1,y],[x1,y1],[x,y1]],source:[[sx,sy],[sx+sw,sy],[sx+sw,sy+sh],[sx,sy+sh]],crop:[sx,sy,sw,sh]});
    }
    meshes.set(ring,tiles);return tiles;
  }
  function transformTriangle(context,source,target) {
    const[a,b,c]=source,[p,q,r]=target,det=a[0]*(b[1]-c[1])+b[0]*(c[1]-a[1])+c[0]*(a[1]-b[1]);
    const coefficients=axis=>[
      (p[axis]*(b[1]-c[1])+q[axis]*(c[1]-a[1])+r[axis]*(a[1]-b[1]))/det,
      (p[axis]*(c[0]-b[0])+q[axis]*(a[0]-c[0])+r[axis]*(b[0]-a[0]))/det,
      (p[axis]*(b[0]*c[1]-c[0]*b[1])+q[axis]*(c[0]*a[1]-a[0]*c[1])+r[axis]*(a[0]*b[1]-b[0]*a[1]))/det
    ];
    const x=coefficients(0),y=coefficients(1);context.transform(x[0],y[0],x[1],y[1],x[2],y[2]);
  }
  function paintTop(context,ring,z,cam,w,h,selected) {
    if(!active())return false;
    const group=window.GoiVietMapPalette?.forRing(ring);if(!group)return false;
    const texture=bake(group);if(!texture)return false;context.save();context.clip();
    // A mesh accounts for the renderer's perspective division. Each patch uses
    // the same project3D function as the boundaries, stations and railway.
    for(const tile of meshFor(ring)){
      const projected=tile.world.map(([x,y])=>project3D(x,y,z,cam,w,h));
      if(projected.every(p=>p[0]<-1)||projected.every(p=>p[0]>w+1)||projected.every(p=>p[1]<-1)||projected.every(p=>p[1]>h+1))continue;
      for(const indices of[[0,1,2],[0,2,3]]){
        const source=indices.map(i=>tile.source[i]),target=indices.map(i=>projected[i]);
        // Equal overlap perpendicular to every edge prevents antialias gaps on
        // long, narrow patches. The enclosing province clip remains exact.
        const orientation=Math.sign((target[1][0]-target[0][0])*(target[2][1]-target[0][1])-(target[1][1]-target[0][1])*(target[2][0]-target[0][0]))||1;
        const normal=(a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy)||1;return[dy/length*orientation,-dx/length*orientation];};
        const clip=target.map((p,i)=>{const before=normal(target[(i+2)%3],p),after=normal(p,target[(i+1)%3]),factor=1.5/Math.max(.01,1+before[0]*after[0]+before[1]*after[1]);return[p[0]+(before[0]+after[0])*factor,p[1]+(before[1]+after[1])*factor];});
        const sx=Math.max(0,tile.crop[0]-2),sy=Math.max(0,tile.crop[1]-2),sw=Math.min(texture.width,tile.crop[0]+tile.crop[2]+2)-sx,sh=Math.min(texture.height,tile.crop[1]+tile.crop[3]+2)-sy;
        context.save();context.beginPath();clip.forEach((p,i)=>i?context.lineTo(p[0],p[1]):context.moveTo(p[0],p[1]));context.closePath();context.clip();
        transformTriangle(context,source,target);context.drawImage(texture,sx,sy,sw,sh,sx,sy,sw,sh);context.restore();
      }
    }
    context.restore();
    // Canvas save/restore doesn't save the current path. Restore the exact top
    // outline so the existing province stroke remains on the original geometry.
    context.beginPath();ring.forEach(([x,y],i)=>{const p=project3D(x,y,z,cam,w,h);if(i)context.lineTo(p[0],p[1]);else context.moveTo(p[0],p[1]);});context.closePath();return true;
  }
  function paintShadow(context,points,zoom) {
    if(!active())return;
    context.save();context.beginPath();points.forEach((p,i)=>i?context.lineTo(p[0],p[1]):context.moveTo(p[0],p[1]));context.closePath();
    context.fillStyle='rgba(38,70,62,.18)';context.shadowColor='rgba(33,54,47,.43)';context.shadowBlur=5*Math.max(.55,zoom);context.shadowOffsetX=-2*zoom;context.shadowOffsetY=4*zoom;context.fill();context.restore();
  }
  function inspectAt(x,y,provinceId) {
    if(!active()||!ensureDEM())return null;
    const s=sample(x,y),shade=shadeAt(x,y),group=provinceId?window.GoiVietMapPalette?.forProvince(provinceId):null,base=window.GoiVietMapPalette.colorAtHeight(shade.metres);
    return{elevationMetres:s.metres,tone:s.tone,heightForShading:s.height,hillshade:shade.light,smoothedTone:shade.tone,smoothedElevationMetres:shade.metres,
      pixelRGB:base.map(v=>Math.round(clamp(v*shade.light,0,255))),...(group?{group:group.id,baseHex:group.hex}:{})};
  }
  function syncAttribution() {
    const parent=document.querySelector('#mapSourcesContent');if(!parent)return;
    const existing=parent.querySelector('[data-terrain-source]');
    if(!active()){existing?.remove();return;}
    if(existing||!window.GoiVietDEM)return;
    const note=document.createElement('p');note.className='island-helper-note';note.dataset.terrainSource='dem';
    note.innerHTML='Độ cao: <a href="https://registry.opendata.aws/terrain-tiles/" target="_blank" rel="noopener noreferrer">Mapzen Terrain Tiles</a> · USGS (SRTM/GMTED2010), NOAA (ETOPO1). Màu và độ nổi được minh họa.';
    parent.appendChild(note);
  }
  new MutationObserver(()=>{if(active())ensureDEM();syncAttribution();}).observe(intro,{attributes:true,attributeFilter:['class']});
  window.GoiVietTerrainRelief=Object.freeze({active,paintTop,paintShadow,inspectAt});
  if(active())ensureDEM();
})();
