/* Rendering only: reuse camera math, reject invisible rings, avoid repeated
   style mutations. World coordinates, destinations and hit shapes stay intact. */
(() => {
  'use strict';
  const bounds=new WeakMap(),intro=document.getElementById('introScreen');let active=intro.classList.contains('intro-hidden'),cached=null,projected=0,culled=0;new MutationObserver(()=>active=intro.classList.contains('intro-hidden')).observe(intro,{attributes:true,attributeFilter:['class']});
  function cameraMath(cam,w,h){
    const area=mapScreenArea&&mapScreenArea.width===w&&mapScreenArea.height===h?mapScreenArea:null,ox=area?(area.left+area.right)/2:w*.5,oy=area?(area.top+area.bottom)/2:h*.5;
    if(!cached||cached.cam!==cam||cached.w!==w||cached.h!==h||cached.ox!==ox||cached.oy!==oy||cached.yaw!==cam.yaw||cached.pitch!==cam.pitch||cached.zoom!==cam.zoom||cached.panX!==cam.panX||cached.panY!==cam.panY){cached={cam,w,h,ox,oy,yaw:cam.yaw,pitch:cam.pitch,zoom:cam.zoom,panX:cam.panX,panY:cam.panY,co:Math.cos(cam.yaw),si:Math.sin(cam.yaw),cp:Math.cos(cam.pitch),sp:Math.sin(cam.pitch)};}return cached;
  }
  const original=project3D;
  project3D=function(x,y,z,cam,w,h){if(!active)return original(x,y,z,cam,w,h);const m=cameraMath(cam,w,h),dx=x-MAP_CENTER_X+m.panX,dy=y-MAP_CENTER_Y+m.panY,rx=dx*m.co-dy*m.si,ry=dx*m.si+dy*m.co,depth=-ry*m.sp-z*m.cp,scale=m.zoom*2400/Math.max(450,2400+depth*.52);projected++;return [m.ox+rx*scale,m.oy+(ry*m.cp-z*m.sp)*scale,depth,scale];};
  function ringOffscreen(ring,cam,w,h,z){let b=bounds.get(ring);if(!b){b={left:Infinity,top:Infinity,right:-Infinity,bottom:-Infinity};for(const [x,y]of ring){b.left=Math.min(b.left,x);b.right=Math.max(b.right,x);b.top=Math.min(b.top,y);b.bottom=Math.max(b.bottom,y);}bounds.set(ring,b);}const points=[];for(const height of [0,z])for(const [x,y]of [[b.left,b.top],[b.right,b.top],[b.right,b.bottom],[b.left,b.bottom]])points.push(project3D(x,y,height,cam,w,h));const outside=points.every(p=>p[0]<-48)||points.every(p=>p[0]>w+48)||points.every(p=>p[1]<-48)||points.every(p=>p[1]>h+48);if(outside)culled++;return outside;}
  const wallLevels=new WeakMap();let wallSourcePoints=0,wallDrawPoints=0;
  function wallRing(ring,zoom){
    const tolerance=zoom<.9?.45:zoom<1.6?.22:zoom<2.5?.12:0;
    wallSourcePoints+=ring.length;if(!tolerance||ring.length<12){wallDrawPoints+=ring.length;return ring;}
    let levels=wallLevels.get(ring);if(!levels){levels=new Map();wallLevels.set(ring,levels);}
    if(!levels.has(tolerance)){
      const keep=new Uint8Array(ring.length);keep[0]=keep[ring.length-1]=1;const stack=[[0,ring.length-1]],limit=tolerance*tolerance;
      while(stack.length){const[a,b]=stack.pop(),p=ring[a],q=ring[b],dx=q[0]-p[0],dy=q[1]-p[1],len=dx*dx+dy*dy;let max=limit,index=-1;
        for(let i=a+1;i<b;i++){const r=ring[i],t=len?Math.max(0,Math.min(1,((r[0]-p[0])*dx+(r[1]-p[1])*dy)/len)):0,d=(r[0]-p[0]-t*dx)**2+(r[1]-p[1]-t*dy)**2;if(d>max){max=d;index=i;}}
        if(index>=0){keep[index]=1;stack.push([a,index],[index,b]);}
      }
      const reduced=ring.filter((_,i)=>keep[i]);levels.set(tolerance,reduced.length>=4?reduced:ring);
    }
    const result=levels.get(tolerance);wallDrawPoints+=result.length;return result;
  }
  // Only the current camera is retained; the source rings remain immutable.
  let ringCamera='',rings=new WeakMap(),ringReuses=0;
  function projectRing(ring,z,cam,w,h){
    const key=[w,h,...getMapScreenOrigin(w,h),cam.yaw,cam.pitch,cam.zoom,cam.panX,cam.panY].join(':');
    if(key!==ringCamera){ringCamera=key;rings=new WeakMap();}
    let planes=rings.get(ring);if(!planes){planes=new Map();rings.set(ring,planes);}
    if(planes.has(z)){ringReuses++;return planes.get(z);}
    const points=ring.map(p=>project3D(p[0],p[1],z,cam,w,h));planes.set(z,points);return points;
  }
  let wallQuads=0,wallBatches=0,wallPass=0;
  const wallBuffers=new WeakMap(),wallColors=new Map();
  function prepareWalls(ring,base,top,palette,sunX,sunY){
    let quads=wallBuffers.get(ring);
    if(!quads||quads.length!==ring.length-1){quads=Array.from({length:ring.length-1},()=>({}));wallBuffers.set(ring,quads);}
    for(let i=0;i<quads.length;i++){
      const dx=top[i+1][0]-top[i][0],dy=top[i+1][1]-top[i][1],length=Math.hypot(dx,dy)||1;
      const factor=.85+((-dy/length)*sunX+(dx/length)*sunY)*.25;
      const r=Math.max(0,Math.min(255,Math.round(palette[0]*factor))),g=Math.max(0,Math.min(255,Math.round(palette[1]*factor))),b=Math.max(0,Math.min(255,Math.round(palette[2]*factor))),key=(r<<16)|(g<<8)|b;
      let fill=wallColors.get(key);if(!fill){fill=`rgba(${r},${g},${b},0.94)`;if(wallColors.size>=4096)wallColors.delete(wallColors.keys().next().value);wallColors.set(key,fill);}
      const q=quads[i];q.b0=base[i];q.b1=base[i+1];q.t1=top[i+1];q.t0=top[i];q.midZ=.25*(base[i][2]+base[i+1][2]+top[i+1][2]+top[i][2]);q.fill=fill;
    }
    quads.sort((a,b)=>b.midZ-a.midZ);return quads;
  }
  function paintWalls(context,quads){
    wallQuads+=quads.length;const pass=++wallPass,moving=Boolean(window.GoiVietRasterTasks?.isMoving?.());
    const add=q=>{context.moveTo(q.b0[0],q.b0[1]);context.lineTo(q.b1[0],q.b1[1]);context.lineTo(q.t1[0],q.t1[1]);context.lineTo(q.t0[0],q.t0[1]);context.closePath();q.drawn=pass;};
    for(const q of quads){q.lo=Math.min(q.b0[0],q.b1[0],q.t0[0],q.t1[0]);q.hi=Math.max(q.b0[0],q.b1[0],q.t0[0],q.t1[0]);q.top=Math.min(q.b0[1],q.b1[1],q.t0[1],q.t1[1]);q.bottom=Math.max(q.b0[1],q.b1[1],q.t0[1],q.t1[1]);}
    for(let i=0;i<quads.length;){
      if(quads[i].drawn===pass){i++;continue;}
      const start=i;
      const first=quads[i],fill=first.fill;let left=Infinity,right=-Infinity;
      context.beginPath();
      do{
        const q=quads[i],lo=q.lo,hi=q.hi;
        // Never merge overlapping translucent walls or reorder the depth sort.
        if(i>0&&left!==Infinity&&!(hi<=left||lo>=right))break;
        add(q);
        left=Math.min(left,lo);right=Math.max(right,hi);i++;
      }while(i<quads.length&&quads[i].drawn!==pass&&quads[i].fill===fill);
      // Reorder only across faces whose screen bounds are strictly disjoint,
      // including a 2px AA margin. Overlapping/translucent painter order stays.
      for(let j=i;moving&&j<Math.min(quads.length,i+24);j++){
        const q=quads[j];if(q.drawn===pass||q.fill!==fill)continue;
        let disjoint=true;for(let k=start;k<j;k++)if(!(q.hi+2<quads[k].lo||q.lo-2>quads[k].hi||q.bottom+2<quads[k].top||q.top-2>quads[k].bottom)){disjoint=false;break;}
        if(disjoint)add(q);
      }
      context.fillStyle=fill;context.fill();wallBatches++;
    }
  }
  window.GoiVietRenderPerformance=Object.freeze({ringOffscreen,wallRing,projectRing,prepareWalls,paintWalls,originalProject:original,inspect:()=>({projected,culled,wallSourcePoints,wallDrawPoints,ringReuses,wallQuads,wallBatches,wallColors:wallColors.size})});
})();
