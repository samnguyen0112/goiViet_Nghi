/* Preview 3 only: persistent world meshes and DEM/water textures on the GPU.
   Labels, boundaries, routes, vehicles and picking retain the existing camera.
   Missing resources/context => one complete Canvas frame, never half a map. */
(() => {
  'use strict';
  const intro=document.getElementById('introScreen'),entries=new Map(),jobs=new Map(),ids=new WeakMap(),islandTiles=new Map();
  const TEXTURE_LIMIT=64*1024*1024,MESH_LIMIT=16*1024*1024;
  const disabled=new URLSearchParams(location.search).get('renderer')==='canvas';
  const ISLAND_LIMIT=32*1024*1024,groupCells=new WeakMap(),lastEntries=new WeakMap(),lastGroupLevels=new WeakMap(),ringBoxes=new WeakMap();
  let lodLevels=new WeakMap(),idleTimer=false,lastCameraKey='',lastCameraMotion=-Infinity,deferredRefinements=0;
  let serial=0,gl=null,canvas=null,program=null,uniforms={},idle=0,failed=false,lost=false;
  let textureBytes=0,meshBytes=0,islandBytes=0,frames=0,requestedFrame=0,uploads=0,draws=0,islandDraws=0,islandGroups=0,islandFallbacks=0,fallbacks=0,lastMS=0,error=null,activeFrame=false,maxDeviation=0;
  // The home screen may build resources ahead of the map (map-prewarm-3.js); textures survive its return.
  const enabled=()=>(intro.classList.contains('intro-hidden')||Boolean(window.GoiVietMapPrewarm3?.preparing()))&&!document.hidden;
  const vertex=`
    precision highp float;
    attribute vec3 a_position;
    attribute vec4 a_edge;
    uniform vec2 u_resolution,u_origin,u_center,u_pan;
    uniform vec4 u_rotation,u_box;
    uniform vec3 u_wall;
    uniform float u_zoom,u_height,u_textured,u_outline,u_lineWidth;
    uniform vec4 u_outlineColor;
    varying vec2 v_uv;
    varying vec4 v_color;
    vec3 project(vec2 p,float z){
      vec2 d=p-u_center+u_pan;
      float rx=d.x*u_rotation.x-d.y*u_rotation.y;
      float ry=d.x*u_rotation.y+d.y*u_rotation.x;
      float depth=-ry*u_rotation.w-z*u_rotation.z;
      float den=max(450.,2400.+depth*.52);
      return vec3(rx,ry*u_rotation.z-z*u_rotation.w,den);
    }
    void main(){
      vec3 p=project(a_position.xy,u_outline>.5?u_height:a_position.z*u_height);
      vec2 screen=u_origin*p.z+p.xy*(u_zoom*2400.);
      if(u_outline>.5){
        vec3 a=project(a_edge.xy,u_height),b=project(a_edge.zw,u_height);
        vec2 before=p.xy/p.z-a.xy/a.z,after=b.xy/b.z-p.xy/p.z;
        before/=max(length(before),.000001);after/=max(length(after),.000001);
        vec2 n1=vec2(-before.y,before.x),n2=vec2(-after.y,after.x),m=n1+n2;
        m/=max(length(m),.000001);
        screen+=m*(a_position.z*u_lineWidth*.5/max(abs(dot(m,n2)),.4))*p.z;
      }
      float depth=(p.z-2400.)/.52;
      gl_Position=vec4(screen.x/u_resolution.x*2.-p.z,p.z-screen.y/u_resolution.y*2.,depth/8000.*p.z,p.z);
      v_uv=(a_position.xy-u_box.xy)/u_box.zw;
      float shade=1.;
      if(u_textured<.5){
        vec3 a=project(a_edge.xy,u_height),b=project(a_edge.zw,u_height);
        vec2 d=b.xy/b.z-a.xy/a.z;
        float len=max(length(d),.000001);
        shade=.85+dot(vec2(-d.y,d.x)/len,vec2(-.65,-.75))*.25;
      }
      v_color=u_outline>.5?u_outlineColor:vec4(floor(clamp(u_wall*shade,0.,255.)+.5)/255.,.94);
    }`;
  const fragment=`precision highp float;
    uniform sampler2D u_texture;
    uniform float u_textured;
    varying vec2 v_uv;
    varying vec4 v_color;
    void main(){gl_FragColor=u_textured>.5?texture2D(u_texture,v_uv):vec4(v_color.rgb*v_color.a,v_color.a);}`;
  function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const message=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error(message);}return s;}
  function init(){
    if(failed||lost)return false;if(gl)return true;
    try{
      canvas=document.createElement('canvas');canvas.id='terrainWebGL3';canvas.setAttribute('aria-hidden','true');
      Object.assign(canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',zIndex:'2',pointerEvents:'none',display:'none'});
      document.getElementById('mainCanvas').before(canvas);
      canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;clear();requestMapRender(3);});
      canvas.addEventListener('webglcontextrestored',()=>{entries.clear();islandTiles.clear();textureBytes=meshBytes=islandBytes=0;gl=null;lost=false;failed=false;canvas.remove();canvas=null;requestMapRender(3);});
      gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true,depth:true,stencil:false,preserveDrawingBuffer:false,powerPreference:'high-performance'});
      if(!gl)throw Error('WebGL unavailable');
      const vs=shader(gl.VERTEX_SHADER,vertex),fs=shader(gl.FRAGMENT_SHADER,fragment);
      program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.bindAttribLocation(program,0,'a_position');gl.bindAttribLocation(program,1,'a_edge');gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
      for(const key of ['resolution','origin','center','pan','rotation','box','wall','zoom','height','textured','texture','outline','lineWidth','outlineColor'])uniforms[key]=gl.getUniformLocation(program,'u_'+key);
      gl.useProgram(program);gl.uniform1i(uniforms.texture,0);gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.ONE,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
      gl.enableVertexAttribArray(0);gl.enableVertexAttribArray(1);return true;
    }catch(e){error=e.message;failed=true;canvas?.remove();canvas=null;gl=null;return false;}
  }
  function buffer(values){const b=gl.createBuffer();if(!b)throw Error('GPU buffer allocation failed');gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(values),gl.STATIC_DRAW);return b;}
  function bind(b){gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.vertexAttribPointer(0,3,gl.FLOAT,false,28,0);gl.vertexAttribPointer(1,4,gl.FLOAT,false,28,12);}
  function geometry(ring){
    const flat=ring.flat(),indices=GoiVietEarcut3(flat),deviation=GoiVietEarcut3.deviation(flat,null,2,indices);
    if(!indices.length||!Number.isFinite(deviation)||deviation>1e-5)throw Error('Unsafe polygon triangulation');
    maxDeviation=Math.max(maxDeviation,deviation);
    const top=[],walls=[],border=[],n=ring.length-1;
    for(const i of indices)top.push(ring[i][0],ring[i][1],1,0,0,0,0);
    for(let i=0;i<ring.length-1;i++){
      const a=ring[i],b=ring[i+1];
      for(const [p,z]of [[a,0],[b,0],[b,1],[a,0],[b,1],[a,1]])walls.push(p[0],p[1],z,...a,...b);
      for(const [j,side]of [[i,1],[i,-1],[(i+1)%n,1],[i,-1],[(i+1)%n,-1],[(i+1)%n,1]])border.push(...ring[j],side,...ring[(j+n-1)%n],...ring[(j+1)%n]);
    }
    return {top:buffer(top),walls:buffer(walls),border:buffer(border),topCount:top.length/7,wallCount:walls.length/7,borderCount:border.length/7,meshBytes:(top.length+walls.length+border.length)*4};
  }
  function texture(image){
    const t=gl.createTexture();if(!t)throw Error('GPU texture allocation failed');gl.bindTexture(gl.TEXTURE_2D,t);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);uploads++;
    return t;
  }
  function remove(key){const e=entries.get(key);if(!e)return;e.alive=false;for(const b of [e.top,e.walls,e.border,e.shadowBuffer])gl.deleteBuffer(b);for(const t of [e.texture,e.shadow])gl.deleteTexture(t);textureBytes-=e.textureBytes;meshBytes-=e.meshBytes;entries.delete(key);}
  function cancelJobs(){jobs.clear();if(idle){if(idleTimer)clearTimeout(idle);else cancelIdleCallback(idle);idle=0;}}
  function clear(){cancelJobs();if(gl&&!lost){for(const key of [...entries.keys()])remove(key);for(const e of islandTiles.values()){gl.deleteTexture(e.texture);gl.deleteBuffer(e.top);}}else{for(const e of entries.values())e.alive=false;entries.clear();}islandTiles.clear();textureBytes=meshBytes=islandBytes=0;activeFrame=false;if(canvas){canvas.style.display='none';canvas.width=canvas.height=1;}}
  function queue(key,job){
    const existing=jobs.get(key);
    if(existing){existing.requestedFrame=requestedFrame;existing.refinement=existing.refinement&&job.refinement;}
    else{
      if(jobs.size>=128)for(const [oldKey,old]of jobs){
        if(requestedFrame-old.requestedFrame>2||!job.refinement&&old.refinement){jobs.delete(oldKey);break;}
      }
      if(jobs.size<128)jobs.set(key,{...job,requestedFrame});
    }
    warm();
  }
  const refiningBlocked=()=>performance.now()-lastCameraMotion<180||Boolean(window.GoiVietJourneyPreview?.isMoving());
  function warm(){
    if(idle||!jobs.size||!enabled()||lost||failed)return;
    // Missing visible resources take priority. A valid old LOD keeps the
    // exact geometry on screen while costly refinement waits for a quiet GPU.
    const pick=()=>{
      let next;
      for(const entry of jobs){
        if(requestedFrame-entry[1].requestedFrame>2){jobs.delete(entry[0]);continue;}
        if(!entry[1].refinement){next=entry;break;}
        if(!refiningBlocked())next ||= entry;
      }
      return next;
    };
    const run=deadline=>{
      idle=0;if(!enabled()||lost||failed)return;
      if(!deadline.didTimeout&&deadline.timeRemaining()<2){warm();return;}
      // One job per idle period keeps visible frames smooth: each texture also costs GPU time. While the
      // entry curtain hides the map, take several jobs per idle period and stop at the first one that must
      // wait for its sources.
      const batch=Boolean(window.GoiVietMapPrewarm3?.holding());
      for(;;){
        const next=pick();
        if(!next){
          if(jobs.size){deferredRefinements++;idleTimer=true;idle=setTimeout(()=>{idle=0;warm();},180);}
          return;
        }
        const [key,job]=next;jobs.delete(key);
        if(!build(key,job)||!batch||failed||!jobs.size||deadline.didTimeout||deadline.timeRemaining()<2||!enabled())break;
      }
      warm();
    };
    idleTimer=!window.requestIdleCallback;
    idle=idleTimer?setTimeout(()=>run({didTimeout:true}),16):requestIdleCallback(run,{timeout:100});
  }
  // Returns false when the job was put back to wait for its sources.
  function build(key,job){
    try{
      if(requestedFrame-job.requestedFrame>2)return true;
      if(job.dark!==(state.theme==='dark'))return true;
      if(job.kind==='island'){
        const image=job.bake(job.group,job.sourceBox,job.density,job.dark,job.zoom);
        const terrain=GoiVietNaturalTerrainRenderer.inspect();
        if(terrain.pendingTiles||job.zoom>1.5&&['hoang-sa','truong-sa'].includes(job.group.id)&&!terrain.offshoreReady&&!terrain.offshoreError){jobs.set(key,job);return false;}
        retainIsland(key,image,job.box,job.sourceBox);
        GoiVietJourneyPreview?.invalidate();requestMapRender(2);return true;
      }
      const source=GoiVietNaturalTerrainRenderer.gpuTexture(job.ring,job.density,job.dark);
      if(!source||!GoiVietHydrology.inspect().ready){jobs.set(key,job);return false;}
      const {image,box,density}=source;
      GoiVietHydrology.paintWorld(image.getContext('2d'),job.ring,box,density,job.dark,job.styleZoom);
      const max=gl.getParameter(gl.MAX_TEXTURE_SIZE);if(image.width>max||image.height>max)throw Error('Texture exceeds device limit');
      // Soft ground shadows do not need DEM sampling density at deep zoom.
      // Keeping their world-space blur at <=1.5 px/unit avoids cache thrash
      // without reducing coastline, terrain or label resolution.
      const g=geometry(job.ring),pad=12,shadowDensity=Math.min(density,1.5),shadowBox={left:box.left-pad,top:box.top-pad,right:box.right+pad,bottom:box.bottom+pad};
      const shadow=document.createElement('canvas');shadow.width=Math.ceil((shadowBox.right-shadowBox.left)*shadowDensity);shadow.height=Math.ceil((shadowBox.bottom-shadowBox.top)*shadowDensity);
      shadowBox.right=shadowBox.left+shadow.width/shadowDensity;shadowBox.bottom=shadowBox.top+shadow.height/shadowDensity;
      const sg=shadow.getContext('2d'),pts=job.ring.map(([x,y])=>[(x-shadowBox.left)*shadowDensity,(y-shadowBox.top)*shadowDensity]);
      GoiVietTerrainRelief.paintShadow(sg,pts,shadowDensity);
      const q=[];for(const [x,y]of [[0,0],[1,0],[1,1],[0,0],[1,1],[0,1]])q.push(shadowBox.left+x*(shadowBox.right-shadowBox.left),shadowBox.top+y*(shadowBox.bottom-shadowBox.top),0,0,0,0,0);
      const e={...g,alive:true,texture:texture(image),shadow:texture(shadow),shadowBuffer:buffer(q),box,shadowBox,density,dark:job.dark,styleZoom:job.styleZoom,textureBytes:(image.width*image.height+shadow.width*shadow.height)*4};e.meshBytes+=q.length*4;
      if(e.textureBytes>TEXTURE_LIMIT||e.meshBytes>MESH_LIMIT)throw Error('GPU entry exceeds budget');
      remove(key);entries.set(key,e);textureBytes+=e.textureBytes;meshBytes+=e.meshBytes;
      while(textureBytes>TEXTURE_LIMIT||meshBytes>MESH_LIMIT)remove(entries.keys().next().value);
      GoiVietJourneyPreview?.invalidate();requestMapRender(2);return true;
    }catch(e){error=e.message;failed=true;clear();return false;}
  }
  function lod(ring,zoom){
    const thresholds=[.8,2,6],values=[2,4,8,12];
    let level=lodLevels.get(ring);
    if(level===undefined)level=thresholds.filter(t=>zoom>t).length;
    else{
      while(level<thresholds.length&&zoom>thresholds[level]*1.08)level++;
      while(level>0&&zoom<thresholds[level-1]*.92)level--;
    }
    lodLevels.set(ring,level);
    return lodDensity(ring,level);
  }
  // The level the first frame at this zoom would choose, without hysteresis.
  function freshLod(ring,zoom){return lodDensity(ring,[.8,2,6].filter(t=>zoom>t).length);}
  function lodDensity(ring,level){
    let b=ringBoxes.get(ring);if(!b){b=GoiVietNaturalCore.box(ring);ringBoxes.set(ring,b);}
    const span=Math.max(b.right-b.left,b.bottom-b.top)+24;
    return Math.max(.25,Math.min([2,4,8,12][level],Math.floor(1536/span*4)/4));
  }
  function boxUniform(box){gl.uniform4f(uniforms.box,box.left,box.top,box.right-box.left,box.bottom-box.top);}
  function drawTexture(e,shadow){gl.uniform1f(uniforms.textured,1);boxUniform(shadow?e.shadowBox:e.box);gl.bindTexture(gl.TEXTURE_2D,shadow?e.shadow:e.texture);bind(shadow?e.shadowBuffer:e.top);gl.drawArrays(gl.TRIANGLES,0,shadow?6:e.topCount);draws++;}
  function hide(){activeFrame=false;if(canvas)canvas.style.display='none';fallbacks++;return false;}
  function retainIsland(key,image,box,sourceBox=box){
    const q=[];for(const [x,y]of [[0,0],[1,0],[1,1],[0,0],[1,1],[0,1]])q.push(box.left+x*(box.right-box.left),box.top+y*(box.bottom-box.top),0,0,0,0,0);
    const e={texture:texture(image),top:buffer(q),topCount:6,box:sourceBox,bytes:image.width*image.height*4+q.length*4};islandTiles.set(key,e);islandBytes+=e.bytes;
    while(islandBytes>ISLAND_LIMIT&&islandTiles.size>1){const first=islandTiles.keys().next().value,old=islandTiles.get(first);gl.deleteTexture(old.texture);gl.deleteBuffer(old.top);islandBytes-=old.bytes;islandTiles.delete(first);}
    return e;
  }
  function paintIslandGroup(context,group,camera,w,h,dark,extent,bake,previous=null){
    if(!activeFrame||lost||failed||context.canvas.id!=='mainCanvas')return false;
    const density=previous?.density??Math.max(.25,Math.min(64,2**Math.ceil(Math.log2(camera.zoom*Math.min(devicePixelRatio||1,2))))),size=128/density;
    const styleZoom=previous?.styleZoom??2**(Math.floor(Math.log2(camera.zoom)*2)/2);
    const pad=12/density,b={left:Math.max(group.bounds.left-pad,extent.left),right:Math.min(group.bounds.right+pad,extent.right),top:Math.max(group.bounds.top-pad,extent.top),bottom:Math.min(group.bounds.bottom+pad,extent.bottom)};
    if(b.left>b.right||b.top>b.bottom)return true;
    let membership=groupCells.get(group);if(!membership){membership=new Map();groupCells.set(group,membership);}
    const features=[...group.islands,...group.reefs],work=[];let ready=true;
    for(let y=Math.floor(b.top/size);y<=Math.floor(b.bottom/size);y++)for(let x=Math.floor(b.left/size);x<=Math.floor(b.right/size);x++){
      const box={left:x*size,top:y*size,right:(x+1)*size,bottom:(y+1)*size},sourceBox={left:box.left-pad,top:box.top-pad,right:box.right+pad,bottom:box.bottom+pad},cell=[density,x,y].join(':');
      if(!membership.has(cell)){membership.set(cell,features.some(f=>GoiVietNaturalCore.overlaps(f.bounds,sourceBox)));if(membership.size>4096)membership.delete(membership.keys().next().value);}
      if(!membership.get(cell))continue;
      const key=['island',group.id,density,styleZoom,x,y,dark].join(':');let e=islandTiles.get(key);
      if(!e){ready=false;if(!previous){const old=lastGroupLevels.get(group);queue(key,{kind:'island',group,box,sourceBox,density,dark,zoom:styleZoom,bake,refinement:old?.dark===dark&&(old.density!==density||old.styleZoom!==styleZoom)});}}
      else{islandTiles.delete(key);islandTiles.set(key,e);work.push(e);}
    }
    if(!ready){
      const old=lastGroupLevels.get(group);
      if(!previous&&old?.dark===dark&&(old.density!==density||old.styleZoom!==styleZoom)){
        if(paintIslandGroup(context,group,camera,w,h,dark,extent,bake,old))return true;
        // The old level may have been evicted. Its replacement is essential,
        // so it must not wait indefinitely for movement to stop.
        for(const job of jobs.values())if(job.group===group)job.refinement=false;
      }
      islandFallbacks++;return false;
    }
    if(!previous)lastGroupLevels.set(group,{density,styleZoom,dark});
    gl.disable(gl.DEPTH_TEST);gl.depthMask(false);gl.uniform1f(uniforms.outline,0);gl.uniform1f(uniforms.height,0);
    for(const e of work){drawTexture(e,false);islandDraws++;}islandGroups++;return true;
  }
  function paintIslandTile(context,image,box){
    if(!activeFrame||lost||failed||context.canvas.id!=='mainCanvas')return false;
    let e=islandTiles.get(image);
    if(!e){
      e=retainIsland(image,image,box);
    }else{islandTiles.delete(image);islandTiles.set(image,e);}
    gl.disable(gl.DEPTH_TEST);gl.depthMask(false);gl.uniform1f(uniforms.outline,0);gl.uniform1f(uniforms.height,0);drawTexture(e,false);islandDraws++;return true;
  }
  function paint(sorted,c,w,h,dark,selected){
    const started=performance.now();requestedFrame++;if(disabled||!enabled()||!init())return hide();
    const cameraKey=[w,h,c.zoom,c.yaw,c.pitch,c.panX,c.panY].join(':');
    if(cameraKey!==lastCameraKey){lastCameraKey=cameraKey;lastCameraMotion=started;}
    // The terrain module's inspect() totals its tile caches; this runs every frame, so read only the error.
    const sourceError=GoiVietNaturalTerrainRenderer.error()||GoiVietHydrology.inspect().error;
    if(sourceError){error=sourceError;failed=true;clear();return hide();}
    const work=[];let ready=true;
    for(const {prov}of sorted){
      const hover=state.hoveredItem?.id===prov.id,z=selected===prov.id||hover?36:['hn','hue','hcm'].includes(prov.id)||state.exploredPlaceIds.includes(prov.id)?24:16;
      for(const ring of prov.polyRings||[]){
        if(GoiVietNaturalLandscape?.excludeProvinceIsland(ring)||GoiVietRenderPerformance.ringOffscreen(ring,c,w,h,z))continue;
        if(!ids.has(ring))ids.set(ring,++serial);
        const old=lastEntries.get(ring),reusable=old?.alive&&old.dark===dark;
        // During camera easing, prepare the destination LOD directly instead
        // of uploading each intermediate level. Old material remains usable.
        const resourceZoom=reusable&&Number.isFinite(c.targetZoom)&&Math.abs(c.targetZoom-c.zoom)>.04?c.targetZoom:c.zoom;
        const density=lod(ring,resourceZoom),styleZoom=resourceZoom<.6?.4:resourceZoom<1.15?.9:2,key=[ids.get(ring),density,dark,styleZoom].join(':');
        let e=entries.get(key);
        if(!e){queue(key,{ring,density,dark,styleZoom,refinement:reusable});if(reusable)e=old;}
        if(!e)ready=false;
        else{if(entries.has(key)){entries.delete(key);entries.set(key,e);}lastEntries.set(ring,e);work.push({e,z,selected:selected===prov.id,hover,pal:prov.pal||MINERAL_PALETTE['Đồng bằng sông Hồng']});}
      }
    }
    // An island-only viewport still needs the GPU ground/tile pass.
    if(!ready)return hide();
    const ratio=GoiVietPixelBudget.ratio('main',w,h),width=Math.round(w*ratio),height=Math.round(h*ratio);
    if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
    gl.viewport(0,0,width,height);gl.useProgram(program);gl.depthMask(true);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    const origin=getMapScreenOrigin(w,h);gl.uniform2f(uniforms.resolution,w,h);gl.uniform2f(uniforms.origin,...origin);gl.uniform2f(uniforms.center,MAP_CENTER_X,MAP_CENTER_Y);gl.uniform2f(uniforms.pan,c.panX,c.panY);gl.uniform4f(uniforms.rotation,Math.cos(c.yaw),Math.sin(c.yaw),Math.cos(c.pitch),Math.sin(c.pitch));gl.uniform1f(uniforms.zoom,c.zoom);
    gl.uniform1f(uniforms.outline,0);gl.disable(gl.DEPTH_TEST);gl.depthMask(false);gl.uniform1f(uniforms.height,0);
    for(const {e}of work)drawTexture(e,true);
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.depthMask(true);
    for(const {e,z,pal}of work){gl.uniform1f(uniforms.height,z);gl.uniform1f(uniforms.textured,0);gl.uniform3f(uniforms.wall,...pal.wall);bind(e.walls);gl.drawArrays(gl.TRIANGLES,0,e.wallCount);draws++;drawTexture(e,false);}
    gl.disable(gl.DEPTH_TEST);gl.depthMask(false);gl.uniform1f(uniforms.outline,1);gl.uniform1f(uniforms.textured,0);
    for(const {e,z,selected,hover}of work){
      gl.uniform1f(uniforms.height,z);bind(e.border);
      gl.uniform4f(uniforms.outlineColor,18/255,48/255,40/255,.84);gl.uniform1f(uniforms.lineWidth,selected?3.8:hover?3.2:Math.max(1.5,Math.min(2.2,1.35+c.zoom*.23)));gl.drawArrays(gl.TRIANGLES,0,e.borderCount);
      const color=selected?[1,247/255,216/255,1]:hover?[249/255,229/255,170/255,1]:[1,243/255,208/255,.86];
      gl.uniform4f(uniforms.outlineColor,...color);gl.uniform1f(uniforms.lineWidth,selected?2.15:hover?1.65:Math.max(.58,Math.min(.8,.52+c.zoom*.07)));gl.drawArrays(gl.TRIANGLES,0,e.borderCount);draws+=2;
    }
    canvas.style.display='block';activeFrame=true;frames++;lastMS=performance.now()-started;return true;
  }
  // Home-screen preparation (map-prewarm-3.js): queue what the first map frame at this zoom needs for every
  // province ring, without drawing. Returns the number of missing textures, or -1 when WebGL is unavailable.
  function prepare(provinces,c,dark){
    requestedFrame++;if(disabled||!enabled()||!init())return -1;
    const sourceError=GoiVietNaturalTerrainRenderer.error()||GoiVietHydrology.inspect().error;
    if(sourceError){error=sourceError;failed=true;clear();return -1;}
    let missing=0;
    for(const prov of provinces)for(const ring of prov.polyRings||[]){
      if(GoiVietNaturalLandscape?.excludeProvinceIsland(ring))continue;
      if(!ids.has(ring))ids.set(ring,++serial);
      const density=freshLod(ring,c.zoom),styleZoom=c.zoom<.6?.4:c.zoom<1.15?.9:2,key=[ids.get(ring),density,dark,styleZoom].join(':');
      if(!entries.has(key)){queue(key,{ring,density,dark,styleZoom,refinement:false});missing++;}
    }
    return missing;
  }
  // Same tiles as paintIslandGroup() would request for this camera; true when all are on the GPU.
  function prepareIslandGroup(group,camera,dark,extent,bake){
    if(disabled||!enabled()||!init())return true;
    const density=Math.max(.25,Math.min(64,2**Math.ceil(Math.log2(camera.zoom*Math.min(devicePixelRatio||1,2))))),size=128/density;
    const styleZoom=2**(Math.floor(Math.log2(camera.zoom)*2)/2);
    const pad=12/density,b={left:Math.max(group.bounds.left-pad,extent.left),right:Math.min(group.bounds.right+pad,extent.right),top:Math.max(group.bounds.top-pad,extent.top),bottom:Math.min(group.bounds.bottom+pad,extent.bottom)};
    if(b.left>b.right||b.top>b.bottom)return true;
    let membership=groupCells.get(group);if(!membership){membership=new Map();groupCells.set(group,membership);}
    const features=[...group.islands,...group.reefs];let ready=true;
    for(let y=Math.floor(b.top/size);y<=Math.floor(b.bottom/size);y++)for(let x=Math.floor(b.left/size);x<=Math.floor(b.right/size);x++){
      const box={left:x*size,top:y*size,right:(x+1)*size,bottom:(y+1)*size},sourceBox={left:box.left-pad,top:box.top-pad,right:box.right+pad,bottom:box.bottom+pad},cell=[density,x,y].join(':');
      if(!membership.has(cell)){membership.set(cell,features.some(f=>GoiVietNaturalCore.overlaps(f.bounds,sourceBox)));if(membership.size>4096)membership.delete(membership.keys().next().value);}
      if(!membership.get(cell))continue;
      const key=['island',group.id,density,styleZoom,x,y,dark].join(':');
      if(!islandTiles.has(key)){ready=false;queue(key,{kind:'island',group,box,sourceBox,density,dark,zoom:styleZoom,bake,refinement:false});}
    }
    return ready;
  }
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelJobs();else{warm();requestMapRender(2);}});
  // Back on the home screen: hide the layer but keep its textures for the next entry.
  new MutationObserver(()=>{if(!intro.classList.contains('intro-hidden')){activeFrame=false;if(canvas&&canvas.style.display!=='none')canvas.style.display='none';}}).observe(intro,{attributes:true,attributeFilter:['class']});
  window.GoiVietWebGLTerrain3=Object.freeze({paint,paintIslandTile,paintIslandGroup,prepare,prepareIslandGroup,clear,
    // The first real frame must choose its level like a fresh map, not from the home-screen zoom.
    resetLod:()=>{lodLevels=new WeakMap();},usable:()=>!disabled&&!failed&&!lost,inspect:()=>({available:!!gl&&!failed&&!lost,active:activeFrame,disabled,failed,lost,error,entries:entries.size,pending:jobs.size,refinementJobs:[...jobs.values()].filter(j=>j.refinement).length,deferredRefinements,textureBytes,textureLimit:TEXTURE_LIMIT,meshBytes,meshLimit:MESH_LIMIT,islandTiles:islandTiles.size,islandBytes,islandLimit:ISLAND_LIMIT,frames,uploads,draws,islandDraws,islandGroups,islandFallbacks,fallbacks,lastMS,maxDeviation})});
})();
