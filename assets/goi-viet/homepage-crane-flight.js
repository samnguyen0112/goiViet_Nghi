// One fixed painted crane, articulated in a fixed camera. Textures never morph.
(() => {
  const sourceURL=new URL('homepage-cranes/articulated-parts.webp?v=20261022-rig1',document.currentScript.src).href;
  const S=512,VIEW=640,ORIGIN=64,SPAN=460,ANCHOR=[280,290],TAU=2*Math.PI;
  let pending;
  const load=()=>pending||(pending=new Promise((resolve,reject)=>{
    const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>{pending=null;reject(new Error('Không tải được hình hạc.'));};image.src=sourceURL;
  }));
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t;
  const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
  function phase(layer,time){
    const second=layer.direction===-1,offset=second?.39:0,period=second?1.84:1.72;
    return ((time/period+offset+.014*Math.sin(time*.43+(second?1.7:0)))%1+1)%1;
  }
  function pose(layer,time){
    const p=phase(layer,time),radians=TAU*p,stroke=q=>{const a=TAU*q;return a+.055*TAU*(1-Math.cos(a));};
    const a=stroke(p),up=clamp((a/TAU-.5)/.5),fold=Math.sin(Math.PI*up)**2;
    return {phase:radians,angles:[.08+1.03*Math.cos(a),.08+1.07*Math.cos(stroke(p-.018)),.08+1.11*Math.cos(stroke(p-.043))],
      yaw:-.29+.055*Math.sin(radians-.4),fold,twist:.07+.55*fold+.055*Math.sin(radians-.2),heave:3.4*Math.sin(radians-.9),pitch:.007*Math.sin(radians-.3)};
  }
  function vertex(part,x,y,p){
    const ox=x,oy=y;let depth=0;
    if(part){
      const side=part===1?1:-1,scale=part===1?.52:.445,dx=x-440,dy=y-395,u=(-.882*dx-.471*dy)*scale,v=(.471*dx-.882*dy)*scale*1.18,L=480*scale,f=clamp(u/L);
      const lengths=[Math.min(u,L*.32),clamp(u-L*.32,0,L*.34),Math.max(0,u-L*.66)],yaw=[p.yaw,p.yaw+p.fold*.38,p.yaw+p.fold*.70];let X=0,Y=0,Z=0;
      for(let j=0;j<3;j++){const c=Math.cos(p.angles[j]),l=lengths[j];X+=l*c*Math.sin(yaw[j]);Y+=l*Math.sin(p.angles[j]);Z+=l*c*Math.cos(yaw[j]);}
      const e=mix(mix(p.angles[0],p.angles[1],smooth(.22,.44,f)),p.angles[2],smooth(.55,.88,f)),az=mix(p.yaw,p.yaw+p.fold*.7,smooth(.2,.95,f)),roll=p.twist*f*f;
      X+=v*(Math.cos(az)*Math.cos(roll)-Math.sin(az)*Math.sin(e)*Math.sin(roll));
      Y+=v*Math.cos(e)*Math.sin(roll)+1.25*Math.sin(p.phase-3*f)*f*f*f;
      Z+=v*(-Math.sin(az)*Math.cos(roll)-Math.cos(az)*Math.sin(e)*Math.sin(roll));
      x=(part===1?278:296)+X-side*Z*.68;y=(part===1?277:270)-Y+side*Z*.23;depth=-side*Z/700;
    }
    const neck=part?0:smooth(345,415,ox),angle=p.pitch*(1-neck),dx=x-250,dy=y-298;
    x=250+dx*Math.cos(angle)-dy*Math.sin(angle);y=298+dx*Math.sin(angle)+dy*Math.cos(angle)+p.heave*(1-neck);
    if(!part){
      const bend=Math.sin(Math.PI*clamp((ox-330)/90)),leg=(1-smooth(145,190,ox))*smooth(292,325,oy),lag=.023*Math.sin(p.phase-1.6+(oy-325)*.012)*leg;
      y+=2.1*Math.sin(p.phase-.45)*bend;const lx=x-165,ly=y-318;x=165+lx*Math.cos(lag)-ly*Math.sin(lag);y=318+lx*Math.sin(lag)+ly*Math.cos(lag);
    }
    return {x,y,z:depth};
  }
  function webglRenderer(image,surface,direct=false){
    const gl=surface.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:true,depth:true,stencil:false,preserveDrawingBuffer:!direct,powerPreference:'low-power'});
    if(!gl)return null;
    if(gl.getParameter(gl.MAX_TEXTURE_SIZE)<Math.max(image.width,image.height)){gl.getExtension('WEBGL_lose_context')?.loseContext();return null;}
    const vertexSource=`precision highp float;
      attribute vec2 a;varying vec2 uv;varying float rootAlpha;
      uniform float part,phase,yaw,fold,twist,heave,pitch;uniform vec3 angles;
      ${direct?'uniform vec3 placementX,placementY;uniform vec2 viewport;':''}
      vec3 bone(float l,float e,float az){return l*vec3(cos(e)*sin(az),sin(e),cos(e)*cos(az));}
      void main(){
        uv=vec2((a.x+part)/4.,a.y);vec2 original=a*512.,p=original;float depth=0.;rootAlpha=1.;
        if(part>.5){
          float side=part<1.5?1.:-1.,scale=part<1.5?.52:.445;
          vec2 delta=p-vec2(440.,395.);float u=dot(delta,vec2(-.882,-.471))*scale,v=dot(delta,vec2(.471,-.882))*scale*1.18,L=480.*scale,f=clamp(u/L,0.,1.);
          vec3 lengths=vec3(min(u,L*.32),clamp(u-L*.32,0.,L*.34),max(0.,u-L*.66));
          vec3 xyz=bone(lengths.x,angles.x,yaw)+bone(lengths.y,angles.y,yaw+fold*.38)+bone(lengths.z,angles.z,yaw+fold*.70);
          float e=mix(mix(angles.x,angles.y,smoothstep(.22,.44,f)),angles.z,smoothstep(.55,.88,f));
          float az=mix(yaw,yaw+fold*.70,smoothstep(.2,.95,f)),roll=twist*f*f;
          vec3 chord=vec3(cos(az)*cos(roll)-sin(az)*sin(e)*sin(roll),cos(e)*sin(roll),-sin(az)*cos(roll)-cos(az)*sin(e)*sin(roll));
          xyz+=v*chord;xyz.y+=1.25*sin(phase-3.*f)*f*f*f;
          p=vec2((part<1.5?278.:296.)+xyz.x-side*xyz.z*.68,(part<1.5?277.:270.)-xyz.y+side*xyz.z*.23);depth=-side*xyz.z/700.;
          rootAlpha=smoothstep(-7.,22.,u);
        }
        float neck=part<.5?smoothstep(345.,415.,original.x):0.,angle=pitch*(1.-neck),c=cos(angle),s=sin(angle);vec2 d=p-vec2(250.,298.);
        p=vec2(250.+d.x*c-d.y*s,298.+d.x*s+d.y*c+heave*(1.-neck));
        if(part<.5){
          float bend=sin(3.14159265*clamp((original.x-330.)/90.,0.,1.));p.y+=2.1*sin(phase-.45)*bend;
          float leg=(1.-smoothstep(145.,190.,original.x))*smoothstep(292.,325.,original.y),lag=.023*sin(phase-1.6+(original.y-325.)*.012)*leg;
          d=p-vec2(165.,318.);p=vec2(165.+d.x*cos(lag)-d.y*sin(lag),318.+d.x*sin(lag)+d.y*cos(lag));
        }
        ${direct?`vec3 local=vec3(p-vec2(280.,290.),1.);vec2 pixel=vec2(dot(placementX,local),dot(placementY,local));
        gl_Position=vec4(pixel.x/viewport.x*2.-1.,1.-pixel.y/viewport.y*2.,depth,1.);`:'gl_Position=vec4((p.x+64.)/320.-1.,1.-(p.y+64.)/320.,depth,1.);'}
      }`;
    const fragmentSource=`precision mediump float;varying vec2 uv;varying float rootAlpha;uniform sampler2D art;uniform float shade,opacity;void main(){vec4 c=texture2D(art,uv)*rootAlpha;if(c.a<.005)discard;c.rgb*=shade;gl_FragColor=c*opacity;}`;
    const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));return shader;};
    const program=gl.createProgram(),vs=compile(gl.VERTEX_SHADER,vertexSource),fs=compile(gl.FRAGMENT_SHADER,fragmentSource);gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
    const mesh=[],ranges=[];
    for(const [left,top,right,bottom,cols,rows]of [[28,218,496,358,40,14],[6,146,466,462,36,32],[35,112,466,464,36,32]]){
      const start=mesh.length/2;
      for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)for(const [dx,dy]of [[0,0],[1,0],[0,1],[0,1],[1,0],[1,1]])mesh.push((left+(right-left)*(x+dx)/cols)/S,(top+(bottom-top)*(y+dy)/rows)/S);
      ranges.push([start,mesh.length/2-start]);
    }
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(mesh),gl.STATIC_DRAW);
    const a=gl.getAttribLocation(program,'a');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
    const texture=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL,gl.NONE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);gl.generateMipmap(gl.TEXTURE_2D);
    const anisotropy=gl.getExtension('EXT_texture_filter_anisotropic');if(anisotropy)gl.texParameterf(gl.TEXTURE_2D,anisotropy.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(4,gl.getParameter(anisotropy.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    gl.uniform1i(gl.getUniformLocation(program,'art'),0);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    const uniforms={};for(const key of ['part','phase','yaw','fold','twist','heave','pitch','angles','shade','opacity','placementX','placementY','viewport'])uniforms[key]=gl.getUniformLocation(program,key);
    let lost=false;surface.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;});
    function begin(width,height){
      if(surface.width!==width||surface.height!==height){surface.width=width;surface.height=height;}
      gl.viewport(0,0,width,height);gl.disable(gl.SCISSOR_TEST);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      if(direct)gl.uniform2f(uniforms.viewport,width,height);
    }
    function paint(p,opacity){
      gl.uniform1f(uniforms.opacity,opacity);
      gl.uniform3fv(uniforms.angles,p.angles);for(const key of ['phase','yaw','fold','twist','heave','pitch'])gl.uniform1f(uniforms[key],p[key]);
      for(const part of [2,0,1]){gl.uniform1f(uniforms.part,part);gl.uniform1f(uniforms.shade,part===2?.93:part===1?.99:1);gl.clear(gl.DEPTH_BUFFER_BIT);part?gl.enable(gl.DEPTH_TEST):gl.disable(gl.DEPTH_TEST);gl.drawArrays(gl.TRIANGLES,...ranges[part]);}
      gl.disable(gl.DEPTH_TEST);
    }
    return {get lost(){return lost||gl.isContextLost();},begin,
      render(p){begin(VIEW,VIEW);paint(p,1);return surface;},
      draw(p,matrix,scale,opacity){
        if(opacity<=0)return;
        const a=matrix.a*scale,b=matrix.b*scale,c=matrix.c*scale,d=matrix.d*scale;
        // Clear depth only around this bird; both birds share one displayed context.
        const corners=[[-ORIGIN-ANCHOR[0],-ORIGIN-ANCHOR[1]],[VIEW-ORIGIN-ANCHOR[0],-ORIGIN-ANCHOR[1]],[-ORIGIN-ANCHOR[0],VIEW-ORIGIN-ANCHOR[1]],[VIEW-ORIGIN-ANCHOR[0],VIEW-ORIGIN-ANCHOR[1]]];
        const xs=corners.map(([x,y])=>a*x+c*y+matrix.e),ys=corners.map(([x,y])=>b*x+d*y+matrix.f);
        const left=Math.max(0,Math.floor(Math.min(...xs))),top=Math.max(0,Math.floor(Math.min(...ys))),right=Math.min(surface.width,Math.ceil(Math.max(...xs))),bottom=Math.min(surface.height,Math.ceil(Math.max(...ys)));
        if(right<=left||bottom<=top)return;
        gl.enable(gl.SCISSOR_TEST);gl.scissor(left,surface.height-bottom,right-left,bottom-top);
        gl.uniform3f(uniforms.placementX,a,c,matrix.e);gl.uniform3f(uniforms.placementY,b,d,matrix.f);paint(p,opacity);
      },
      dispose(){gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.getExtension('WEBGL_lose_context')?.loseContext();}};
  }
  function canvasRenderer(image,surface){
    const g=surface.getContext('2d'),tiles=[];for(let part=0;part<3;part++){
      const tile=document.createElement('canvas');tile.width=tile.height=S;const t=tile.getContext('2d');t.drawImage(image,part*S,0,S,S,0,0,S,S);
      if(part){const scale=part===1?.52:.445,gradient=t.createLinearGradient(440+.882*7/scale,395+.471*7/scale,440-.882*22/scale,395-.471*22/scale);gradient.addColorStop(0,'#0000');gradient.addColorStop(1,'#000');t.globalCompositeOperation='destination-in';t.fillStyle=gradient;t.fillRect(0,0,S,S);}
      tiles.push(tile);
    }
    const grid=14;
    function triangle(tile,source,target){
      const [p0,p1,p2]=source,[q0,q1,q2]=target,det=(p1.x-p0.x)*(p2.y-p0.y)-(p2.x-p0.x)*(p1.y-p0.y);
      const a=((q1.x-q0.x)*(p2.y-p0.y)-(q2.x-q0.x)*(p1.y-p0.y))/det,c=((q2.x-q0.x)*(p1.x-p0.x)-(q1.x-q0.x)*(p2.x-p0.x))/det;
      const b=((q1.y-q0.y)*(p2.y-p0.y)-(q2.y-q0.y)*(p1.y-p0.y))/det,d=((q2.y-q0.y)*(p1.x-p0.x)-(q1.y-q0.y)*(p2.x-p0.x))/det;
      g.save();g.beginPath();const cx=(q0.x+q1.x+q2.x)/3,cy=(q0.y+q1.y+q2.y)/3;target.forEach((q,i)=>{const dx=q.x-cx,dy=q.y-cy,n=Math.hypot(dx,dy)||1,x=q.x+dx/n*.35,y=q.y+dy/n*.35;i?g.lineTo(x,y):g.moveTo(x,y);});g.closePath();g.clip();
      g.transform(a,b,c,d,q0.x-a*p0.x-c*p0.y,q0.y-b*p0.x-d*p0.y);g.drawImage(tile,0,0);g.restore();
    }
    return {render(p){
      if(surface.width!==VIEW)surface.width=surface.height=VIEW;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,VIEW,VIEW);g.translate(ORIGIN,ORIGIN);g.imageSmoothingQuality='high';
      for(const part of [2,0,1]){
        const triangles=[];
        for(let y=0;y<grid;y++)for(let x=0;x<grid;x++){
          const a={x:x*S/grid,y:y*S/grid},b={x:(x+1)*S/grid,y:a.y},c={x:a.x,y:(y+1)*S/grid},d={x:b.x,y:c.y};
          for(const source of [[a,b,c],[c,b,d]]){const target=source.map(v=>vertex(part,v.x,v.y,p));triangles.push({source,target,z:target.reduce((n,v)=>n+v.z,0)});}
        }
        if(part)triangles.sort((a,b)=>b.z-a.z);for(const t of triangles)triangle(tiles[part],t.source,t.target);
      }return surface;
    },dispose(){for(const tile of tiles)tile.width=tile.height=1;}};
  }
  window.GoiVietCraneFlight={async create(options={}){
    const image=await load();let surface=document.createElement('canvas');surface.width=surface.height=VIEW;let renderer=null,mode='canvas2d',lastKey='';
    const sceneCanvas=options.sceneCanvas?.parentElement?.classList.contains('gv-home-scene-plane')?options.sceneCanvas:null;
    if(!options.forceCanvas){try{renderer=webglRenderer(image,surface,!!sceneCanvas);if(renderer)mode='webgl';}catch(_){}}
    if(!renderer){surface=document.createElement('canvas');surface.width=surface.height=VIEW;renderer=canvasRenderer(image,surface);}
    if(sceneCanvas&&mode==='webgl'){
      surface.className='gv-home-scene-overlay';surface.dataset.homeSceneLayer='cranes';surface.setAttribute('aria-hidden','true');sceneCanvas.after(surface);
      renderer.begin(sceneCanvas.width,sceneCanvas.height);
    }else renderer.render(pose({direction:1},0));
    const updateMode=()=>{if(sceneCanvas)sceneCanvas.dataset.craneCompositing=mode==='webgl'?'webgl-layer':'canvas-copy';};updateMode();
    function fallback(){
      if(!renderer.lost)return;
      renderer.dispose();surface.remove();surface=document.createElement('canvas');surface.width=surface.height=VIEW;
      renderer=canvasRenderer(image,surface);mode='canvas2d';lastKey='';updateMode();
    }
    return {
      get layered(){return !!sceneCanvas&&mode==='webgl';},
      beginFrame(){fallback();if(sceneCanvas&&mode==='webgl'){surface.hidden=false;renderer.begin(sceneCanvas.width,sceneCanvas.height);}},
      beat:(layer,time)=>Math.cos(phase(layer,time)*TAU),
      draw(ctx,layer,time,width){
        fallback();
        if(sceneCanvas&&mode==='webgl'){renderer.draw(pose(layer,time),ctx.getTransform(),width/SPAN,ctx.globalAlpha);return;}
        const key=layer.direction+':'+time;
        if(lastKey!==key||surface.width!==VIEW){renderer.render(pose(layer,time));lastKey=key;}
        const scale=width/SPAN;ctx.drawImage(surface,(-ORIGIN-ANCHOR[0])*scale,(-ORIGIN-ANCHOR[1])*scale,VIEW*scale,VIEW*scale);
      },
      clear(){surface.width=surface.height=1;surface.hidden=true;lastKey='';},
      dispose(){renderer.dispose();surface.width=surface.height=1;surface.remove();},
      inspect:()=>({artwork:'articulated-ivory-gold-crane',renderer:mode,compositing:sceneCanvas&&mode==='webgl'?'webgl-layer':'canvas-copy',sourcePoses:1,parts:3,morphing:false,continuous:true,texturePixels:image.width*image.height,bufferPixels:surface.width>1?surface.width*surface.height:0})
    };
  }};
})();
