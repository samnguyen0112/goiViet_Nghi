/* Preview 3: the existing coarse ground mesh, below country labels.
   This replaces only the temporary Canvas coverage pass during reprojection. */
(() => {
  'use strict';
  const LIMIT=2*1024*1024,intro=document.getElementById('introScreen');
  const disabled=new URLSearchParams(location.search).get('renderer')==='canvas';
  let canvas=null,gl=null,program=null,buffer=null,source=null,building=null,uniforms={},batches=[],count=0,bytes=0,frames=0,fanFallbacks=0,failed=false,lost=false,error=null;
  const vertex=`precision highp float;attribute vec2 a_position;
    uniform vec2 u_resolution,u_origin,u_pan,u_center;uniform vec4 u_rotation;uniform float u_zoom,u_screen;
    void main(){if(u_screen>.5){gl_Position=vec4(a_position,0.,1.);return;}vec2 d=a_position-u_center+u_pan;float rx=d.x*u_rotation.x-d.y*u_rotation.y,ry=d.x*u_rotation.y+d.y*u_rotation.x;
      float den=max(450.,2400.-ry*u_rotation.w*.52);vec2 screen=u_origin*den+vec2(rx,ry*u_rotation.z)*(u_zoom*2400.);
      gl_Position=vec4(screen.x/u_resolution.x*2.-den,den-screen.y/u_resolution.y*2.,0.,den);}`;
  const fragment=`precision mediump float;uniform vec3 u_color;void main(){gl_FragColor=vec4(u_color,1.);}`;
  function init(host){
    if(failed||lost)return false;if(gl)return true;
    try{
      canvas=document.createElement('canvas');canvas.id='regionalCoverageGPU3';canvas.style.display='none';host.prepend(canvas);
      canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;buffer=null;bytes=count=0;canvas.style.display='none';GoiVietRasterTasks.cancel('coverage-gpu3');building=null;requestMapRender(2);});
      canvas.addEventListener('webglcontextrestored',()=>{canvas.remove();canvas=null;gl=null;program=null;failed=lost=false;prepare(null,source);requestMapRender(2);});
      gl=canvas.getContext('webgl',{alpha:false,antialias:true,depth:false,stencil:true,powerPreference:'high-performance'});if(!gl||!gl.getContextAttributes().stencil)throw Error('Coverage WebGL/stencil unavailable');
      const compile=(type,text)=>{const s=gl.createShader(type);gl.shaderSource(s,text);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
      const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.bindAttribLocation(program,0,'a_position');gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
      for(const key of ['resolution','origin','pan','center','rotation','zoom','color','screen'])uniforms[key]=gl.getUniformLocation(program,'u_'+key);
      gl.useProgram(program);gl.enableVertexAttribArray(0);return true;
    }catch(e){error=e.message;failed=true;canvas?.remove();canvas=null;gl=null;return false;}
  }
  function prepare(original,mesh){
    if(disabled||!mesh||failed||lost)return;
    const host=original?.parentElement||document.querySelector('.regional-background');if(!host||!init(host))return;
    if(source===mesh&&(buffer||building===mesh))return;source=mesh;building=mesh;
    function* build(){const values=[],parts=[];let fans=0;for(const item of mesh){
      const rings=item.rings.filter(r=>r.length>=3);if(!rings.length)continue;
      const flat=GoiVietEarcut3.flatten(rings);if(!flat.vertices.length)continue;
      const indices=GoiVietEarcut3(flat.vertices,flat.holes,2),deviation=GoiVietEarcut3.deviation(flat.vertices,flat.holes,2,indices);
      if(Number.isFinite(deviation)&&deviation<=.001){const start=values.length/2;for(const i of indices)values.push(flat.vertices[i*2],flat.vertices[i*2+1]);parts.push({mode:gl.TRIANGLES,start,count:indices.length});}
      else{
        // The existing coarse simplifier can cross a coastline or a hole.
        // Stencil parity preserves its even-odd fill without repairing data.
        for(const ring of rings){const start=values.length/2;for(const p of ring)values.push(p[0],p[1]);parts.push({mode:gl.TRIANGLE_FAN,start,count:ring.length});fans++;}
      }
      if(values.length*4>LIMIT)throw Error('Ground mesh budget exceeded');yield;
    }const total=values.length/2;values.push(-1,-1,1,-1,1,1,-1,-1,1,1,-1,1);return{data:new Float32Array(values),parts,total,fans};}
    GoiVietRasterTasks.run('coverage-gpu3',build(),result=>{
      building=null;if(source!==mesh||lost||!gl)return;if(buffer)gl.deleteBuffer(buffer);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,result.data,gl.STATIC_DRAW);count=result.total;batches=result.parts;fanFallbacks=result.fans;bytes=result.data.byteLength;requestMapRender(2);
    },e=>{building=null;error=e.message;failed=true;hide();});
  }
  function paint(original,mesh,c,w,h,dark){
    if(disabled)return false;
    prepare(original,mesh);if(!gl||!buffer||failed||lost)return false;
    const ratio=GoiVietPixelBudget.ratio('coverage',w,h),width=Math.round(w*ratio),height=Math.round(h*ratio);
    if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
    gl.viewport(0,0,width,height);gl.useProgram(program);gl.colorMask(true,true,true,true);gl.stencilMask(255);gl.clearStencil(0);gl.clearColor(...(dark?[35/255,78/255,80/255]:[67/255,143/255,137/255]),1);gl.clear(gl.COLOR_BUFFER_BIT|gl.STENCIL_BUFFER_BIT);
    gl.uniform2f(uniforms.resolution,w,h);gl.uniform2f(uniforms.origin,...getMapScreenOrigin(w,h));gl.uniform2f(uniforms.center,MAP_CENTER_X,MAP_CENTER_Y);gl.uniform2f(uniforms.pan,c.panX,c.panY);gl.uniform4f(uniforms.rotation,Math.cos(c.yaw),Math.sin(c.yaw),Math.cos(c.pitch),Math.sin(c.pitch));gl.uniform1f(uniforms.zoom,c.zoom);gl.uniform3f(uniforms.color,...(dark?[94/255,96/255,68/255]:[230/255,211/255,164/255]));
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);gl.uniform1f(uniforms.screen,0);gl.enable(gl.STENCIL_TEST);gl.colorMask(false,false,false,false);gl.stencilFunc(gl.ALWAYS,0,255);gl.stencilOp(gl.KEEP,gl.KEEP,gl.INVERT);
    for(const part of batches)gl.drawArrays(part.mode,part.start,part.count);
    gl.colorMask(true,true,true,true);gl.stencilFunc(gl.NOTEQUAL,0,255);gl.stencilOp(gl.KEEP,gl.KEEP,gl.KEEP);gl.uniform1f(uniforms.screen,1);gl.drawArrays(gl.TRIANGLES,count,6);gl.disable(gl.STENCIL_TEST);if(!original.hidden)original.hidden=true;if(canvas.style.display)canvas.style.display='';frames++;return true;
  }
  // Any [hidden] change restyles the whole page (the stylesheets pair :has([hidden]) with body:has() rules);
  // an inline display change restyles only this element.
  function hide(){if(canvas&&canvas.style.display!=='none')canvas.style.display='none';}
  function clear(){GoiVietRasterTasks?.cancel('coverage-gpu3');building=null;if(gl&&!lost&&buffer)gl.deleteBuffer(buffer);buffer=null;bytes=count=0;hide();if(canvas)canvas.width=canvas.height=1;}
  // Back on the home screen: hide, but keep the mesh for the next entry (as the terrain keeps its textures).
  new MutationObserver(()=>{if(!intro.classList.contains('intro-hidden'))hide();}).observe(intro,{attributes:true,attributeFilter:['class']});
  window.GoiVietWebGLCoverage3=Object.freeze({prepare,paint,hide,clear,inspect:()=>({available:!!gl&&!failed&&!lost,ready:!!buffer,active:!!canvas&&canvas.style.display!=='none',building:!!building,failed,lost,error,bytes,limit:LIMIT,vertices:count,fanFallbacks,frames})});
})();
