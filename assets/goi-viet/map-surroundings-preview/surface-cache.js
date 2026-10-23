/* Main preview: reuse only raised terrain/water planes during camera motion.
   Walls, boundaries, labels and picking always use the current exact geometry. */
(() => {
  'use strict';
  if(!window.GoiVietPixelBudget)return;
  const limit=32*1024*1024,entries=new Map(),ids=new WeakMap(),jobs=new Map();
  let serial=0,bytes=0,idle=0,hits=0,shadowHits=0,builds=0,fallbacks=0,coverageFallbacks=0,patches=0,errors=0;
  const active=()=>!document.hidden&&document.getElementById('introScreen').classList.contains('intro-hidden');
  function matrix(c,w,h,z){
    const [ox,oy]=getMapScreenOrigin(w,h),co=Math.cos(c.yaw),si=Math.sin(c.yaw),cp=Math.cos(c.pitch),sp=Math.sin(c.pitch),tx=c.panX-MAP_CENTER_X,ty=c.panY-MAP_CENTER_Y,k=c.zoom*2400,dx=-.52*sp*si,dy=-.52*sp*co,d=2400-.52*(sp*(tx*si+ty*co)+z*cp);
    return [ox*dx+k*co,ox*dy-k*si,ox*d+k*(tx*co-ty*si),oy*dx+k*cp*si,oy*dy+k*cp*co,oy*d+k*(cp*(tx*si+ty*co)-z*sp),dx,dy,d];
  }
  function inverse(m){const[a,b,c,d,e,f,g,h,i]=m,A=e*i-f*h,B=f*g-d*i,C=d*h-e*g,det=a*A+b*B+c*C;if(Math.abs(det)<1e-12)return null;return[A,c*h-b*i,b*f-c*e,B,a*i-c*g,c*d-a*f,C,b*g-a*h,a*e-b*d].map(v=>v/det);}
  function multiply(a,b){const m=[];for(let r=0;r<3;r++)for(let c=0;c<3;c++)m[r*3+c]=a[r*3]*b[c]+a[r*3+1]*b[c+3]+a[r*3+2]*b[c+6];return m;}
  function point(m,x,y){const d=m[6]*x+m[7]*y+m[8];return [(m[0]*x+m[1]*y+m[2])/d,(m[3]*x+m[4]*y+m[5])/d];}
  function warm(){
    if(idle||!jobs.size||!active())return;
    const run=deadline=>{
      idle=0;if(!active()){jobs.clear();return;}
      if(!deadline.didTimeout&&deadline.timeRemaining()<3){warm();return;}
      const [key,job]=jobs.entries().next().value;jobs.delete(key);
      const terrain=GoiVietNaturalTerrainRenderer.inspect();
      try{if(terrain.ready&&GoiVietHydrology.inspect().ready&&!terrain.pendingTiles&&!GoiVietRasterTasks.inspect().pending)build(key,job);}catch(_){errors++;}
      warm();
    };
    idle=window.requestIdleCallback?requestIdleCallback(run,{timeout:1000}):setTimeout(()=>run({didTimeout:true}),50);
  }
  function build(key,job){
    const {ring,z,camera,w,h,dark,ratio,points,signature}=job;
    if([w,h,...getMapScreenOrigin(w,h)].join(':')!==signature||(state.theme==='dark')!==dark||ratio!==GoiVietPixelBudget.ratio('main',cw,ch)||Math.abs(Math.log(camera.zoom/state.cam.zoom))>.01)return;
    const left=Math.floor(Math.min(...points.map(p=>p[0]))-2),top=Math.floor(Math.min(...points.map(p=>p[1]))-2),right=Math.ceil(Math.max(...points.map(p=>p[0]))+2),bottom=Math.ceil(Math.max(...points.map(p=>p[1]))+2);
    const width=Math.ceil((right-left)*ratio),height=Math.ceil((bottom-top)*ratio);
    if(width<2||height<2||width*height>2*1024*1024)return;
    const homography=matrix(camera,w,h,z),box=GoiVietNaturalCore.box(ring);
    if([[box.left,box.top],[box.right,box.top],[box.right,box.bottom],[box.left,box.bottom]].some(([x,y])=>homography[6]*x+homography[7]*y+homography[8]<=450))return;
    const image=document.createElement('canvas');image.width=width;image.height=height;
    const g=image.getContext('2d');g.setTransform(ratio,0,0,ratio,-left*ratio,-top*ratio);g.beginPath();points.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();
    // Both APIs restore their own clip state; no text or walls enter this cache.
    if(!GoiVietTerrainRelief.paintTop(g,ring,z,camera,w,h,false))return;
    GoiVietHydrology.paintTop(g,ring,z,camera,w,h,dark,points);
    const entry={image,left,top,ratio,camera,homography,signature,w,h,partial:left<0||top<0||right>w||bottom>h,bytes:width*height*4};
    const base=ring.map(p=>project3D(p[0],p[1],0,camera,w,h)),pad=Math.ceil(9*Math.max(.55,camera.zoom)+2*camera.zoom+3),sl=Math.floor(Math.min(...base.map(p=>p[0]))-pad),st=Math.floor(Math.min(...base.map(p=>p[1]))-pad),sw=Math.ceil((Math.max(...base.map(p=>p[0]))+pad-sl)*ratio),sh=Math.ceil((Math.max(...base.map(p=>p[1]))+pad-st)*ratio);
    if(sw*sh<=2*1024*1024){const shadow=document.createElement('canvas');shadow.width=sw;shadow.height=sh;const sg=shadow.getContext('2d');sg.setTransform(ratio,0,0,ratio,-sl*ratio,-st*ratio);GoiVietTerrainRelief.paintShadow(sg,base,camera.zoom);entry.shadow={image:shadow,left:sl,top:st,ratio,homography:matrix(camera,w,h,0)};entry.bytes+=sw*sh*4;}
    if(entries.has(key)){bytes-=entries.get(key).bytes;entries.delete(key);}
    entries.set(key,entry);bytes+=entry.bytes;builds++;
    while(bytes>limit&&entries.size){const first=entries.keys().next().value;bytes-=entries.get(first).bytes;entries.delete(first);}
  }
  function draw(context,entry,transform,clip=true){
    const image=entry.image,tolerance=.10/Math.min(devicePixelRatio||1,2),list=[];
    const project=(x,y)=>point(transform,entry.left+x/entry.ratio,entry.top+y/entry.ratio);
    function split(x,y,w,h,depth){
      const p=[project(x,y),project(x+w,y),project(x+w,y+h),project(x,y+h)];
      if(p.some(q=>!q.every(Number.isFinite)))return false;
      const dx=p[0][0]+p[2][0]-p[1][0]-p[3][0],dy=p[0][1]+p[2][1]-p[1][1]-p[3][1];
      let error=Math.hypot(dx,dy)/4;
      const middle=project(x+w/2,y+h/2);error=Math.max(error,Math.hypot(middle[0]-p.reduce((n,q)=>n+q[0],0)/4,middle[1]-p.reduce((n,q)=>n+q[1],0)/4));
      for(const [u,v,a,b]of [[.5,0,0,1],[1,.5,1,2],[.5,1,3,2],[0,.5,0,3]]){const q=project(x+w*u,y+h*v);error=Math.max(error,Math.hypot(q[0]-(p[a][0]+p[b][0])/2,q[1]-(p[a][1]+p[b][1])/2));}
      if(error>tolerance){if(depth>=6||w<4||h<4||list.length>192)return false;const a=Math.floor(w/2),b=Math.floor(h/2);return split(x,y,a,b,depth+1)&&split(x+a,y,w-a,b,depth+1)&&split(x,y+b,a,h-b,depth+1)&&split(x+a,y+b,w-a,h-b,depth+1);}
      list.push({x,y,w,h});return true;
    }
    if(!split(0,0,image.width,image.height,0))return false;
    context.save();if(clip)context.clip();
    for(const patch of list){
      // One source-pixel overlap hides filtering seams between neighbouring fits.
      const overlap=clip?1:0,x=Math.max(0,patch.x-overlap),y=Math.max(0,patch.y-overlap),w=Math.min(image.width,patch.x+patch.w+overlap)-x,h=Math.min(image.height,patch.y+patch.h+overlap)-y;
      const p=[project(x,y),project(x+w,y),project(x+w,y+h),project(x,y+h)],dx=p[0][0]+p[2][0]-p[1][0]-p[3][0],dy=p[0][1]+p[2][1]-p[1][1]-p[3][1];
      context.save();context.transform(((p[1][0]-p[0][0])+(p[2][0]-p[3][0]))/(2*w),((p[1][1]-p[0][1])+(p[2][1]-p[3][1]))/(2*w),((p[3][0]-p[0][0])+(p[2][0]-p[1][0]))/(2*h),((p[3][1]-p[0][1])+(p[2][1]-p[1][1]))/(2*h),p[0][0]-dx/4,p[0][1]-dy/4);
      context.drawImage(image,x,y,w,h,0,0,w,h);context.restore();
    }
    context.restore();patches+=list.length;return true;
  }
  function paint(context,ring,z,camera,w,h,dark,points){
    if(!active()||!window.GoiVietRasterTasks?.managed)return false;
    if(!ids.has(ring))ids.set(ring,++serial);
    const ratio=GoiVietPixelBudget.ratio('main',w,h),signature=[w,h,...getMapScreenOrigin(w,h)].join(':'),key=[ids.get(ring),z,dark,ratio].join(':');
    const entry=entries.get(key),moving=GoiVietRasterTasks.isMoving();let refresh=!entry||entry.signature!==signature;
    if(entry&&entry.signature===signature&&moving){
      const zoom=camera.zoom/entry.camera.zoom;
      refresh=zoom<.85||zoom>1.2||Math.abs(camera.pitch-entry.camera.pitch)>=.35||Math.abs(camera.yaw-entry.camera.yaw)>=.4;
      if(zoom>=.85&&zoom<=1.2&&Math.abs(camera.pitch-entry.camera.pitch)<.35&&Math.abs(camera.yaw-entry.camera.yaw)<.4&&!points.some(p=>2400+p[2]*.52<=450)){
        const inv=inverse(entry.homography),m=inv&&multiply(matrix(camera,w,h,z),inv);
        let covered=true;
        if(m&&entry.partial){
          // Terrain/hydrology reject work outside their captured viewport.
          // Never expose those uncaptured pixels when a border province enters.
          const left=Math.max(0,Math.min(...points.map(p=>p[0]))),right=Math.min(w,Math.max(...points.map(p=>p[0]))),top=Math.max(0,Math.min(...points.map(p=>p[1]))),bottom=Math.min(h,Math.max(...points.map(p=>p[1]))),back=inverse(m);
          covered=!!back&&[[left,top],[right,top],[right,bottom],[left,bottom]].every(([x,y])=>{const q=point(back,x,y);return q[0]>=0&&q[1]>=0&&q[0]<=entry.w&&q[1]<=entry.h;});
          if(!covered)coverageFallbacks++;
        }
        if(m&&covered&&draw(context,entry,m)){entries.delete(key);entries.set(key,entry);hits++;return true;}
      }
    }
    fallbacks++;
    if((refresh||!moving&&JSON.stringify(entry.camera)!==JSON.stringify(camera))&&!jobs.has(key)&&jobs.size<64){jobs.set(key,{ring,z,camera:{...camera},w,h,dark,ratio,points,signature});warm();}
    return false;
  }
  function clear(){entries.clear();bytes=0;jobs.clear();if(idle){if(window.requestIdleCallback)cancelIdleCallback(idle);else clearTimeout(idle);}idle=0;}
  function paintShadow(context,ring,z,camera,w,h,dark){
    if(!active()||!window.GoiVietRasterTasks?.isMoving?.()||!ids.has(ring))return false;
    const ratio=GoiVietPixelBudget.ratio('main',w,h),entry=entries.get([ids.get(ring),z,dark,ratio].join(':'));
    if(!entry?.shadow||entry.signature!==[w,h,...getMapScreenOrigin(w,h)].join(':'))return false;
    const zoom=camera.zoom/entry.camera.zoom;if(zoom<.85||zoom>1.2||Math.abs(camera.pitch-entry.camera.pitch)>=.35||Math.abs(camera.yaw-entry.camera.yaw)>=.4)return false;
    const current=matrix(camera,w,h,0),box=GoiVietNaturalCore.box(ring);if([[box.left,box.top],[box.right,box.top],[box.right,box.bottom],[box.left,box.bottom]].some(([x,y])=>current[6]*x+current[7]*y+current[8]<=450))return false;
    const inv=inverse(entry.shadow.homography);if(inv&&draw(context,entry.shadow,multiply(current,inv),false)){shadowHits++;return true;}return false;
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden){jobs.clear();if(idle){if(window.requestIdleCallback)cancelIdleCallback(idle);else clearTimeout(idle);}idle=0;}});
  new MutationObserver(()=>{if(!active())clear();}).observe(document.getElementById('introScreen'),{attributes:true,attributeFilter:['class']});
  window.GoiVietSurfaceCache=Object.freeze({paint,paintShadow,clear,inspect:()=>({entries:entries.size,bytes,limit,pending:jobs.size,builds,hits,shadowHits,fallbacks,coverageFallbacks,patches,errors})});
})();
