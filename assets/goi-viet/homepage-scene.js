// Landscape renderer only. Visible content and the brand are independent HTML layers.
(() => {
 const layout=window.GoiVietHomeLayout;
 const SX=layout.width/layout.designWidth;
 const scriptBase=new URL('.',document.currentScript.src);
 let sources=null,sourceLoad=null;
 function loadSources(){
  if(sources)return Promise.resolve(sources);
  if(sourceLoad)return sourceLoad;
  sourceLoad=new Promise((resolve,reject)=>{
   const script=document.createElement('script');let settled=false;
   const finish=error=>{
    if(settled)return;settled=true;
    script.onload=script.onerror=null;clearTimeout(timeout);script.remove();sourceLoad=null;
    if(error){reject(error);return;}
    const loaded=window.GoiVietHomeSceneAssets;delete window.GoiVietHomeSceneAssets;
    if(!loaded||!['landscape.webp','crane.webp','leaf.webp','petal.webp'].every(name=>typeof loaded[name]==='string'&&loaded[name].startsWith('data:image/'))){reject(new Error('Thiếu lớp phong cảnh'));return;}
    sources=loaded;resolve(sources);
   };
   const timeout=setTimeout(()=>finish(new Error('Tải phong cảnh quá lâu')),45000);
   script.onload=()=>finish();script.onerror=()=>finish(new Error('Không tải được lớp phong cảnh'));
   const high=matchMedia('(min-resolution: 1.5dppx) and (min-width: 1000px), (min-width: 2200px)').matches;
   script.src=new URL(high?layout.highResolutionBundle:layout.bundle,scriptBase).href;
   document.head.append(script);
  });return sourceLoad;
 }
 const loadImage=(src,label)=>new Promise((resolve,reject)=>{
  const image=new Image();
  const timeout=setTimeout(()=>{image.onload=image.onerror=null;reject(new Error('Tải quá lâu: '+label));},45000);
  image.onload=()=>{clearTimeout(timeout);resolve(image);};
  image.onerror=()=>{clearTimeout(timeout);reject(new Error('Không tải được '+label));};image.src=src;
 });
 function surface(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
 window.GoiVietHomeScene={async create(canvas){
 const W=layout.designWidth,H=layout.designHeight,DURATION=layout.duration,FPS=layout.fps;
 const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw new Error('Không dựng được tranh động');
 const assetSources=await loadSources();
 const [plate,crane,leaf,petal]=await Promise.all(['landscape.webp','crane.webp','leaf.webp','petal.webp'].map(name=>loadImage(assetSources[name],name))).catch(error=>{sources=null;throw error;});
 let mode='canvas2d',resizeBackdrop=()=>{};
 let drawBackdrop=()=>ctx.drawImage(plate,0,0,W,H);
 // Keep birds, leaves and smoke animated even when WebGL is unavailable.
 try {
 const bg=surface(canvas.width,canvas.height),gl=bg.getContext('webgl',{alpha:false,preserveDrawingBuffer:true,antialias:false});
 if(!gl||gl.getParameter(gl.MAX_TEXTURE_SIZE)<layout.width)throw new Error('WebGL unavailable for 4K');
 const vs=`attribute vec2 position;varying vec2 uv;void main(){uv=(position+1.0)*0.5;gl_Position=vec4(position,0.,1.);}`;
 const fs=`precision highp float;
 varying vec2 uv;uniform sampler2D picture;uniform float time;
 const vec2 size=vec2(1594.,987.);
 float blob(vec2 p,vec2 center,vec2 radius){vec2 q=(p-center)/radius;return exp(-dot(q,q)*2.5);}
 vec2 tree(vec2 p,vec2 center,vec2 radius,float phase,float wind){
  float g=blob(p,center,radius);float tip=clamp((center.y+radius.y-p.y)/(radius.y*1.6),0.,1.);
  float wave=sin(time*6.2831853/6.+phase)+.22*sin(time*6.2831853/3.+phase);
  return vec2(wind*wave*tip*g,.55*cos(time*6.2831853/6.+phase)*tip*g);
 }
 void main(){
  vec2 p=vec2(uv.x,1.-uv.y)*size,offset=vec2(0.);
  // Trees bend at their crowns; the bridge, villages and mountain shapes stay anchored.
  offset+=tree(p,vec2(81.,460.),vec2(124.,102.),0.,4.2);
  offset+=tree(p,vec2(176.,514.),vec2(55.,83.),1.6,3.5);
  offset+=tree(p,vec2(154.,718.),vec2(56.,83.),.7,4.5);
  offset+=tree(p,vec2(49.,771.),vec2(60.,106.),1.8,3.);
  offset+=tree(p,vec2(1513.,520.),vec2(100.,100.),2.2,4.5);
  offset+=tree(p,vec2(1435.,624.),vec2(80.,94.),3.3,4.);
  offset+=tree(p,vec2(1541.,658.),vec2(54.,84.),.9,3.2);
  offset+=tree(p,vec2(1278.,284.),vec2(26.,51.),1.4,2.2);
  offset+=tree(p,vec2(1571.,397.),vec2(45.,63.),2.7,2.8);
  // Clouds drift in a closed cycle so the repeat has no cut.
  float a=time*6.2831853/12.;
  offset+=vec2(9.*sin(a),1.8*cos(a))*blob(p,vec2(111.,212.),vec2(193.,74.));
  offset+=vec2(13.*sin(a+.7),1.5*cos(a+.7))*blob(p,vec2(193.,399.),vec2(205.,67.));
  offset+=vec2(11.*sin(a+2.),2.*cos(a+2.))*blob(p,vec2(1434.,443.),vec2(166.,65.));
  offset+=vec2(8.*sin(a+1.),1.2*cos(a+1.))*blob(p,vec2(1450.,65.),vec2(185.,50.));
  offset+=vec2(9.*sin(a+3.),1.8*cos(a+3.))*blob(p,vec2(1502.,847.),vec2(192.,118.));
  offset+=vec2(8.*sin(a+4.),1.8*cos(a+4.))*blob(p,vec2(159.,876.),vec2(192.,93.));
  // Distant haze and foreground depth move less than the vegetation.
  float sides=1.-smoothstep(280.,490.,min(p.x,size.x-p.x));
  offset.x+=.6*sin(a)*sides;
  float centerDamp=1.-smoothstep(240.,310.,p.x)*(1.-smoothstep(1280.,1350.,p.x));
  offset*=centerDamp;
  vec2 sampleAt=(p+offset)/size;gl_FragColor=texture2D(picture,vec2(sampleAt.x,1.-sampleAt.y));
 }`;
 function shader(type,src){let s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
 let program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));gl.useProgram(program);
 let buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
 let position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
 gl.activeTexture(gl.TEXTURE0);let tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
 gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,plate);
 if(gl.getError()!==gl.NO_ERROR)throw new Error('4K texture unavailable');
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
 gl.uniform1i(gl.getUniformLocation(program,'picture'),0);let timeUniform=gl.getUniformLocation(program,'time');
 mode='webgl';
 resizeBackdrop=(w,h)=>{bg.width=w;bg.height=h;gl.viewport(0,0,w,h);};
 resizeBackdrop(canvas.width,canvas.height);
 drawBackdrop=t=>{
  if(gl.isContextLost()){mode='canvas2d';ctx.drawImage(plate,0,0,W,H);return;}
  gl.uniform1f(timeUniform,t);gl.drawArrays(gl.TRIANGLES,0,6);ctx.drawImage(bg,0,0,W,H);
 };
 bg.addEventListener('webglcontextlost',event=>event.preventDefault());
 } catch (_) { /* The Canvas 2D fallback keeps the scene usable. */ }

 function triangle(c,im,s,d){
  const [p0,p1,p2]=s,[q0,q1,q2]=d;
  const det=(p1.x-p0.x)*(p2.y-p0.y)-(p2.x-p0.x)*(p1.y-p0.y);
  const a=((q1.x-q0.x)*(p2.y-p0.y)-(q2.x-q0.x)*(p1.y-p0.y))/det;
  const cc=((q2.x-q0.x)*(p1.x-p0.x)-(q1.x-q0.x)*(p2.x-p0.x))/det;
  const b=((q1.y-q0.y)*(p2.y-p0.y)-(q2.y-q0.y)*(p1.y-p0.y))/det;
  const dd=((q2.y-q0.y)*(p1.x-p0.x)-(q1.y-q0.y)*(p2.x-p0.x))/det;
  c.save();c.beginPath();const center={x:(q0.x+q1.x+q2.x)/3,y:(q0.y+q1.y+q2.y)/3};
  d.forEach((q,i)=>{let x=q.x+(q.x-center.x)*.012,y=q.y+(q.y-center.y)*.012;i?c.lineTo(x,y):c.moveTo(x,y);});c.closePath();c.clip();
  c.transform(a,b,cc,dd,q0.x-a*p0.x-cc*p0.y,q0.y-b*p0.x-dd*p0.y);c.drawImage(im,0,0);c.restore();
 }
 let birds=[],birdRasterScale=1;
 function birdFrames(im,facing){
  const cache=new Map(),nx=8,ny=8;
  return {get(k){
   if(cache.has(k)){const frame=cache.get(k);cache.delete(k);cache.set(k,frame);return frame;}
   const sx=im.width/280,sy=im.height/230,frame=surface(Math.round(340*sx),Math.round(290*sy)),c=frame.getContext('2d');c.translate(30*sx,30*sy);
   const flap=Math.sin(k/60*Math.PI*2);
   function vertex(px,py){
    const x=px/sx,y=py/sy,tip=Math.max(0,Math.min(1,(155-y)/115));
    const avoidHead=y>105?Math.max(0,Math.min(1,(facing===1?195-x:x-85)/42)):1;
    const weight=tip*avoidHead,rootX=facing===1?137:143;
    return {x:(x+(x-rootX)*.13*flap*weight)*sx,y:(y+(160-y)*.34*flap*weight)*sy};
   }
   for(let iy=0;iy<ny;iy++)for(let ix=0;ix<nx;ix++){
    const a={x:ix*im.width/nx,y:iy*im.height/ny},b={x:(ix+1)*im.width/nx,y:a.y},e={x:a.x,y:(iy+1)*im.height/ny},d={x:b.x,y:e.y};
    triangle(c,im,[a,b,e],[vertex(a.x,a.y),vertex(b.x,b.y),vertex(e.x,e.y)]);
    triangle(c,im,[b,d,e],[vertex(b.x,b.y),vertex(d.x,d.y),vertex(e.x,e.y)]);
   }
   cache.set(k,frame);if(cache.size>6)cache.delete(cache.keys().next().value);return frame;
  },get cachedFrames(){return cache.size;}};
 }
 function prepareBirds(scale){
  birdRasterScale=Math.max(1,Math.min(SX,scale));
  const left=surface(Math.round(280*birdRasterScale),Math.round(230*birdRasterScale)),right=surface(left.width,left.height);
  const fit=Math.min(left.width/crane.width,left.height/crane.height),w=crane.width*fit,h=crane.height*fit;
  left.getContext('2d').drawImage(crane,(left.width-w)/2,(left.height-h)/2,w,h);
  const mirror=right.getContext('2d');mirror.translate(right.width,0);mirror.scale(-1,1);mirror.drawImage(left,0,0);
  birds=[birdFrames(left,1),birdFrames(right,-1)];
 }
 function drawBird(t,which){
  const phase=(t/12+(which===0?.21:.09))%1;
  const scale=which===0?.86:.82;
  const x=which===0?-260+(W+520)*phase:W+35-(W+520)*phase;
  const y=84-125*Math.sin(Math.PI*phase)+5*Math.sin(t*Math.PI*2/1.2+which);
  const angle=.025*Math.sin(t*Math.PI*2/6+which);
  const k=Math.floor(((t/1.2+(which?.34:0))%1)*60);
  const frame=birds[which].get(k);
  ctx.save();ctx.translate(x+140*scale,y+150*scale);ctx.rotate(angle);
  ctx.drawImage(frame,-170*scale,-180*scale,340*scale,290*scale);ctx.restore();
 }
 function floating(t){
  // Particles follow the margins and are composited behind the protected UI.
  const particles=[
   [leaf,145,180,.25,1,30],[petal,252,420,.62,1,26],[leaf,54,654,.71,1,37],
   [petal,1365,167,.12,-1,24],[leaf,1440,406,.55,-1,34],[petal,1530,662,.83,-1,30],
   [leaf,354,9,.07,1,27],[petal,1250,31,.37,-1,22]
  ];
  particles.forEach(([im,x,y,phase,dir,size],i)=>{
   const p=(t/12+phase)%1,fade=Math.min(1,p*10,(1-p)*10);
   ctx.save();ctx.globalAlpha=fade*.83;
   ctx.translate(x+dir*(80*p+15*Math.sin(p*Math.PI*4+i)),y+320*p);
   ctx.rotate(i*.6+dir*p*Math.PI*2);ctx.scale(.5+.5*Math.abs(Math.cos(p*Math.PI*2+i)),1);
   ctx.drawImage(im,-size/2,-size/2,size,size*im.height/im.width);ctx.restore();
  });
 }
 function drawTrainSmoke(t){
  const [chimneyX,chimneyY]=layout.chimney;
  const numPuffs=8,period=4.8;
  for(let i=0;i<numPuffs;i++){
   const phase=((t/period+i/numPuffs)%1+1)%1;
   const px=chimneyX+phase*150+Math.sin(phase*Math.PI*2)*8;
   const py=chimneyY-phase*58+Math.cos(phase*Math.PI)*4;
   const scale=0.35+phase*2.8;
   const alpha=Math.sin(phase*Math.PI)*0.82;
   ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,alpha));
   const grad=ctx.createRadialGradient(px-2*scale,py-2*scale,1,px,py,14*scale);
   grad.addColorStop(0,'rgba(255,255,255,0.95)');
   grad.addColorStop(0.42,'rgba(252,248,238,0.65)');
   grad.addColorStop(0.75,'rgba(245,236,222,0.22)');
   grad.addColorStop(1,'rgba(240,230,215,0)');
   ctx.fillStyle=grad;ctx.beginPath();
   ctx.ellipse(px,py,14*scale,10*scale,phase*0.35,0,Math.PI*2);
   ctx.fill();ctx.restore();
  }
 }

 let frames=0,lastTime=0,prepared=false;
 const metadata={width:canvas.width,height:canvas.height,sourceWidth:plate.naturalWidth,sourceHeight:plate.naturalHeight,designWidth:W,designHeight:H,duration:DURATION,fps:FPS};
 const renderFrame=t=>{
  t=((t%DURATION)+DURATION)%DURATION;lastTime=t;
  ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);ctx.imageSmoothingQuality='high';
  drawBackdrop(t);drawTrainSmoke(t);floating(t);drawBird(t,0);drawBird(t,1);
  ctx.setTransform(1,0,0,1,0,0);frames++;
 };
 const setResolution=(width,height)=>{
  const scale=Math.min(1,width/plate.naturalWidth,height/plate.naturalHeight);
  width=Math.max(1,Math.round(plate.naturalWidth*scale));height=Math.max(1,Math.round(plate.naturalHeight*scale));
  if(prepared&&canvas.width===width&&canvas.height===height)return;
  canvas.width=width;canvas.height=height;resizeBackdrop(width,height);prepareBirds(width/W);prepared=true;
  metadata.width=width;metadata.height=height;renderFrame(lastTime);
 };
 setResolution(canvas.width,canvas.height);
 return {renderFrame,setResolution,metadata,assets:{landscape:plate,crane,leaf,petal},get frames(){return frames;},get mode(){return mode;},get cachedBirdFrames(){return birds.reduce((n,b)=>n+b.cachedFrames,0);}};
 }};
})();
