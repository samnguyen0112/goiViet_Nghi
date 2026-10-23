/* Shared, preview-only geographic rendering helpers.
   Preview 3 copy: the three base64-heavy data files are read and decoded in a worker. */
(() => {
  'use strict';
  const base=new URL('.',document.currentScript.src),loads=new Map(),lods=new WeakMap();
  const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
  const version=file=>file==='bathymetry-data.js'?'wide-20261015':file==='hydrology-data.js'?'network-junctions-20261015':'1';
  function loadScript(file,name){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=new URL(file+'?v='+version(file),base).href;s.onload=()=>window[name]?resolve(window[name]):reject(new Error('Missing data '+name));s.onerror=()=>reject(new Error('Cannot load '+file));document.head.append(s);});}
  // Parsing these files and decoding their base64/gzip fields took 90-180 ms tasks on the main thread.
  // The worker returns each "...Base64" field as {__bytes}; decode() turns that into the same typed array.
  // Any worker failure falls back to the script tag.
  const WORKER_FILES=new Set(['terrain-data.js','bathymetry-data.js','regional-terrain-data.js']);
  const workerDecode=Boolean(window.Worker&&window.DecompressionStream)&&new Uint8Array(new Uint16Array([1]).buffer)[0]===1;
  const WORKER_SOURCE=`self.window=self;
const bytesOf=s=>{const bin=atob(s),out=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)out[i]=bin.charCodeAt(i);return out;};
const gunzip=async bytes=>new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
async function walk(value,transfer){
  if(Array.isArray(value)){const out=[];for(const item of value)out.push(await walk(item,transfer));return out;}
  if(!value||typeof value!=='object')return value;
  const out={};
  for(const [key,item] of Object.entries(value)){
    if(typeof item==='string'&&key.endsWith('Base64')){let bytes=bytesOf(item);if(value.compression==='gzip')bytes=await gunzip(bytes);transfer.push(bytes.buffer);out[key]={__bytes:bytes};}
    else out[key]=await walk(item,transfer);
  }
  return out;
}
onmessage=async e=>{try{importScripts(e.data.url);const transfer=[],data=await walk(self[e.data.name],transfer);postMessage({ok:true,data},transfer);}catch(error){postMessage({ok:false,error:String(error&&error.message||error)});}};`;
  function loadInWorker(file,name){return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(new Blob([WORKER_SOURCE],{type:'application/javascript'})),worker=new Worker(url);URL.revokeObjectURL(url);
    worker.onmessage=e=>{worker.terminate();if(!e.data.ok)return reject(new Error(e.data.error));window[name]=Object.freeze(e.data.data);resolve(window[name]);};
    worker.onerror=()=>{worker.terminate();reject(new Error('Cannot load '+file));};
    worker.postMessage({url:new URL(file+'?v='+version(file),base).href,name});
  });}
  async function load(file,name){if(window[name])return window[name];if(loads.has(file))return loads.get(file);const promise=workerDecode&&WORKER_FILES.has(file)?loadInWorker(file,name).catch(()=>loadScript(file,name)):loadScript(file,name);loads.set(file,promise);return promise;}
  async function decode(encoded,compression,Type=Int16Array){if(encoded?.__bytes){const b=encoded.__bytes;return Type===Uint8Array?b:new Int16Array(b.buffer,b.byteOffset,b.byteLength/2);}let bytes=Uint8Array.from(atob(encoded),c=>c.charCodeAt(0));if(compression==='gzip')bytes=new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());if(Type===Uint8Array)return bytes;const values=new Int16Array(bytes.length/2),view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);for(let i=0;i<values.length;i++)values[i]=view.getInt16(i*2,true);return values;}
  function sample(grid,values,x,y,nearest=false){const sx=grid.stepX||grid.step,sy=grid.stepY||grid.step,gx=(x-grid.left)/sx,gy=(y-grid.top)/sy;if(gx<0||gy<0||gx>grid.width-1||gy>grid.height-1)return null;if(nearest)return values[Math.round(gy)*grid.width+Math.round(gx)];const col=Math.min(grid.width-2,Math.floor(gx)),row=Math.min(grid.height-2,Math.floor(gy)),u=gx-col,v=gy-row,at=(r,c)=>values[r*grid.width+c];return (at(row,col)*(1-u)+at(row,col+1)*u)*(1-v)+(at(row+1,col)*(1-u)+at(row+1,col+1)*u)*v;}
  function projector(camera,w,h,z=0){const [ox,oy]=getMapScreenOrigin(w,h),co=Math.cos(camera.yaw),si=Math.sin(camera.yaw),cp=Math.cos(camera.pitch),sp=Math.sin(camera.pitch);return(x,y)=>{const dx=x-MAP_CENTER_X+camera.panX,dy=y-MAP_CENTER_Y+camera.panY,rx=dx*co-dy*si,ry=dx*si+dy*co,s=camera.zoom*2400/Math.max(450,2400-.52*(ry*sp+z*cp));return [ox+rx*s,oy+(ry*cp-z*sp)*s,s];};}
  function simplified(points,level){if(points.length<8)return points;let entries=lods.get(points);if(!entries){entries=new Map();lods.set(points,entries);}if(entries.has(level))return entries.get(level);const tol=[.16,.045,.012][level]||.012,tol2=tol*tol,keep=new Uint8Array(points.length);keep[0]=keep[points.length-1]=1;const stack=[[0,points.length-1]];while(stack.length){const [a,b]=stack.pop(),p=points[a],q=points[b],dx=q[0]-p[0],dy=q[1]-p[1],length=dx*dx+dy*dy;let best=tol2,index=-1;for(let i=a+1;i<b;i++){const r=points[i],t=length?clamp(((r[0]-p[0])*dx+(r[1]-p[1])*dy)/length):0,d=(r[0]-p[0]-t*dx)**2+(r[1]-p[1]-t*dy)**2;if(d>best){best=d;index=i;}}if(index>=0){keep[index]=1;stack.push([a,index],[index,b]);}}const reduced=points.filter((p,i)=>keep[i]),result=reduced.length>=4?reduced:points;entries.set(level,result);return result;}
  function path(context,rings,project,level=1){context.beginPath();for(const ring of rings){const pts=level<0?ring:simplified(ring,level);for(let i=0;i<pts.length;i++){const p=project(...pts[i]);if(i)context.lineTo(p[0],p[1]);else context.moveTo(p[0],p[1]);}context.closePath();}}
  // Rectangle UVs have closed-form affine coefficients. Keep the same two
  // triangles and 1.1px seam guard as before, without generic matrix allocation.
  let affineTiles=0,exactTiles=0,maxAffineError=0;
  function tile(context,image,box,project,w,h,points,allowAffine=false){
    const pts=points||[[box.left,box.top],[box.right,box.top],[box.right,box.bottom],[box.left,box.bottom]].map(p=>project(...p));
    if(pts.every(p=>p[0]<-400)||pts.every(p=>p[0]>w+400)||pts.every(p=>p[1]<-400)||pts.every(p=>p[1]>h+400))return false;
    if(allowAffine){
      const dx=pts[0][0]+pts[2][0]-pts[1][0]-pts[3][0],dy=pts[0][1]+pts[2][1]-pts[1][1]-pts[3][1],error=Math.hypot(dx,dy)/4;
      // Both reference triangles are affine: their difference from this fit is
      // bounded by the corner residual throughout the tile, not just its centre.
      if(error<=.15/Math.min(devicePixelRatio||1,2)){
        const a=((pts[1][0]-pts[0][0])+(pts[2][0]-pts[3][0]))/(2*image.width),b=((pts[1][1]-pts[0][1])+(pts[2][1]-pts[3][1]))/(2*image.width),c=((pts[3][0]-pts[0][0])+(pts[2][0]-pts[1][0]))/(2*image.height),d=((pts[3][1]-pts[0][1])+(pts[2][1]-pts[1][1]))/(2*image.height);
        context.save();context.transform(a,b,c,d,pts[0][0]-dx/4,pts[0][1]-dy/4);context.drawImage(image,0,0);context.restore();
        affineTiles++;maxAffineError=Math.max(maxAffineError,error);return true;
      }
    }
    exactTiles++;
    for(let half=0;half<2;half++){
      const a=pts[0],b=pts[half?2:1],c=pts[half?3:2];
      const cx=(a[0]+b[0]+c[0])/3,cy=(a[1]+b[1]+c[1])/3;
      context.save();context.beginPath();
      for(let i=0;i<3;i++){
        const p=i===0?a:i===1?b:c,dx=p[0]-cx,dy=p[1]-cy,length=Math.hypot(dx,dy)||1;
        if(i)context.lineTo(p[0]+dx/length*1.1,p[1]+dy/length*1.1);
        else context.moveTo(p[0]+dx/length*1.1,p[1]+dy/length*1.1);
      }
      context.closePath();context.clip();
      const right=half?pts[2]:pts[1],left=half?pts[3]:pts[0],bottom=half?pts[3]:pts[2],top=half?pts[0]:pts[1];
      context.transform((right[0]-left[0])/image.width,(right[1]-left[1])/image.width,(bottom[0]-top[0])/image.height,(bottom[1]-top[1])/image.height,a[0],a[1]);
      context.drawImage(image,0,0);context.restore();
    }
    return true;
  }
  const overlaps=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
  const boxes=new WeakMap();
  const box=ring=>{if(boxes.has(ring))return boxes.get(ring);let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;for(const [x,y]of ring){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}const b={left,top,right,bottom};boxes.set(ring,b);return b;};
  window.GoiVietNaturalCore=Object.freeze({load,decode,sample,projector,simplified,path,tile,overlaps,box,clamp,base,performance:()=>({affineTiles,exactTiles,maxAffineError})});
})();
