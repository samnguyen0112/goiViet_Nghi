/* Shared orthographic camera for painted geography, raised faces, labels and hits. */
(() => {
  'use strict';
  function matrix(camera, width, height, area, baseZoom, design={center:[720,510],width:690,height:850}) {
    const designScale = Math.min(width / 1597, height / 985);
    const compact = width <= 1080;
    const visible = area || {left:14,right:width-14,top:100,bottom:height-80};
    const fit = Math.min(compact?Infinity:designScale,(visible.right-visible.left)/design.width,(visible.bottom-visible.top)/design.height*.96);
    const scale = fit * camera.zoom / Math.max(.12,baseZoom);
    const tilt = Math.cos(camera.pitch) / Math.cos(.16);
    const co = Math.cos(camera.yaw), si = Math.sin(camera.yaw);
    const a=scale*co,b=scale*si*tilt,c=-scale*si,d=scale*co*tilt;
    const ox=(visible.left+visible.right)/2;
    const oy=visible.originY ?? (visible.top+visible.bottom)/2;
    const [cx,cy]=design.center;
    return [a,b,c,d,ox-a*cx-c*cy+camera.panX*scale,oy-b*cx-d*cy+camera.panY*scale];
  }
  function transform(point, m) {
    return [m[0]*point[0]+m[2]*point[1]+m[4],m[1]*point[0]+m[3]*point[1]+m[5]];
  }
  function inverse(point, m) {
    const det=m[0]*m[3]-m[1]*m[2];
    return [(m[3]*(point[0]-m[4])-m[2]*(point[1]-m[5]))/det,(-m[1]*(point[0]-m[4])+m[0]*(point[1]-m[5]))/det];
  }
  function scale(m) { return Math.hypot(m[0],m[2]); }
  function panDelta(dx,dy,m) {const s=scale(m);return [dx/s,dy/s];}
  function anchoredZoom(camera, point, zoom, width, height, area, baseZoom, design, elevation=0) {
    const previous=matrix(camera,width,height,area,baseZoom,design);
    const before=inverse([point[0],point[1]+elevation*Math.sin(camera.pitch)*scale(previous)],previous);
    const next={...camera,zoom};
    const m=matrix(next,width,height,area,baseZoom,design),after=transform(before,m),s=scale(m);
    after[1]-=elevation*Math.sin(camera.pitch)*s;
    return {zoom,panX:next.panX+(point[0]-after[0])/s,panY:next.panY+(point[1]-after[1])/s};
  }
  function interpolate(rows,key,value,extrapolate=false){if(!extrapolate)value=Math.max(rows[0][key],Math.min(rows.at(-1)[key],value));let i=1;while(i<rows.length-1&&rows[i][key]<value)i++;const a=rows[i-1],b=rows[i],t=(value-a[key])/Math.max(.001,b[key]-a[key]);return a.map((v,j)=>v+(b[j]-v)*t);}
  function warpPoint(point,warp){const [x,y]=point,py=interpolate(warp.heightAnchors,0,y,true)[1],rx=interpolate(warp.worldRail,1,y)[0],tx=interpolate(warp.sourceRail,1,py)[0];let px=tx+(x-rx)*warp.scaleX,yy=py;for(const island of warp.islands){const d=Math.hypot(x-island.world[0],y-island.world[1]),weight=Math.exp(-d*d/1600);px+=island.delta[0]*weight;yy+=island.delta[1]*weight;}return [px,yy];}
  window.GoiVietMapCamera={matrix,transform,inverse,scale,panDelta,anchoredZoom,warpPoint};
})();
