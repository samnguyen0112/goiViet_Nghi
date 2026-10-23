/* World-space smoke: moving chimney emits fresh smoke; older smoke keeps drifting. */
(() => {
 'use strict';
 const scene=document.querySelector('.n6-exit-world'), canvas=scene?.querySelector('.n6-smoke');
 const anchor=scene?.querySelector('.n6-chimney'), train=scene?.querySelector('[data-mc-train]');
 const intro=document.getElementById('introScreen'), chapter=document.getElementById('memoryChapter');
 if(!canvas||!anchor||!train||!intro||!chapter)return;
 const ctx=canvas.getContext('2d',{alpha:true}), reduced=matchMedia('(prefers-reduced-motion: reduce)');
 if(!ctx)return;
 const W=795,H=394,particles=[],sprites=[];
 let frame=0,last=0,clock=0,debt=0,previous=null,visible=false,emitted=0,mode='idle',density=1,speed=0;
 // Stable, seamless value noise builds soft irregular clouds, rather than circles.
 const hash=(x,y,s)=>{const n=Math.sin(x*127.1+y*311.7+s*74.7)*43758.5453;return n-Math.floor(n);};
 function noise(x,y,s){
  const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
  const u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);
  const a=hash(ix,iy,s),b=hash(ix+1,iy,s),c=hash(ix,iy+1,s),d=hash(ix+1,iy+1,s);
  return (a+(b-a)*u)*(1-v)+(c+(d-c)*u)*v;
 }
 for(let s=0;s<8;s++){
  const tile=document.createElement('canvas');tile.width=tile.height=96;
  const c=tile.getContext('2d'),data=c.createImageData(96,96);
  for(let y=0;y<96;y++)for(let x=0;x<96;x++){
   const nx=(x-47.5)/47.5,ny=(y-47.5)/47.5,r=Math.hypot(nx,ny);
   const n=noise(x/19,y/19,s)*.56+noise(x/8,y/8,s+13)*.29+noise(x/3.6,y/3.6,s+31)*.15;
   const edge=Math.max(0,1-r),a=Math.pow(edge,1.12)*Math.max(0,n-.1)*2.7;
   // White steam gets its volume from varied density, without a grey/sooty core.
   const i=(y*96+x)*4;
   data.data[i]=255;data.data[i+1]=255;data.data[i+2]=252;
   data.data[i+3]=Math.min(255,a*255);
  }
  c.putImageData(data,0,0);sprites.push(tile);
 }
 const motion=()=>!reduced.matches&&!document.body.classList.contains('reduced-motion');
 function active(){
  if(!visible||document.hidden||intro.classList.contains('intro-hidden')||intro.dataset.memoryUnlocked!=='true')return false;
  const r=scene.getBoundingClientRect(),v=intro.getBoundingClientRect();
  return r.bottom>v.top&&r.top<v.bottom;
 }
 function chimney(){
  const r=scene.getBoundingClientRect(),a=anchor.getBoundingClientRect();
  return {x:(a.left+a.width/2-r.left)/r.width*W,y:(a.top+a.height/2-r.top)/r.width*W};
 }
 function resize(){
  const w=scene.getBoundingClientRect().width;
  density=Math.min(2,devicePixelRatio||1,1800/Math.max(1,w));
  const width=Math.max(1,Math.round(w*density)),height=Math.max(1,Math.round(w/W*H*density));
  if(canvas.width===width&&canvas.height===height)return false;
  canvas.width=width;canvas.height=height;
  if(!motion()&&active())still();
  return true;
 }
 function emit(origin,age=0,velocity=0){
  const p={x:origin.x,y:origin.y,age:0,life:4.0+Math.random()*1.0,
   vx:-12-Math.random()*5-Math.min(9,velocity*.22),vy:-7-Math.random()*3,
   radius:3.1+Math.random()*1.2,spin:(Math.random()-.5)*.22,
   angle:Math.random()*Math.PI*2,seed:Math.random()*20,sprite:Math.floor(Math.random()*sprites.length)};
  if(age)advance(p,age);particles.push(p);emitted++;
 }
 function advance(p,dt){
  p.age+=dt;
  p.x+=(p.vx+Math.sin(p.age*1.2+p.seed)*1.2)*dt;
  p.y+=(p.vy-Math.min(4,p.age)*1.0+Math.cos(p.age*1.4+p.seed)*.7)*dt;
  p.angle+=p.spin*dt;
 }
 function paint(){
  ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);ctx.clearRect(0,0,W,H);
  for(const p of particles){
   const t=p.age/p.life,fade=Math.min(1,p.age/.12)*Math.pow(Math.max(0,1-t),1.1);
   const r=p.radius+p.age*3.4;
   ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);
   ctx.globalAlpha=fade*.96;
   ctx.drawImage(sprites[p.sprite],-r,-r,r*2,r*2);ctx.restore();
  }
 }
 function still(){
  particles.length=0;mode='still';const origin=chimney();
  // One quiet static plume for reduced motion; no perpetual redraw.
  for(let i=0;i<42;i++)emit(origin,.12+i*.115);
  paint();
 }
 function tick(now){
  frame=0;if(!active()){last=0;previous=null;return;}
  if(!motion()){still();return;}
  const dt=last?Math.min(.05,(now-last)/1000):1/60;last=now;clock+=dt;
  const origin=chimney(),measured=previous?Math.max(0,Math.min(80,(origin.x-previous.x)/dt)):0;
  speed+=(measured-speed)*(1-Math.exp(-dt/.22));
  mode=speed>.65?'moving':'idle';
  // Keep both movement and idle exhaust alive. Irregular pulses avoid a metronomic chain.
  debt+=dt*(18+Math.min(22,speed*.45))*(1+Math.sin(clock*3.6)*.05);
  while(debt>=1){emit(origin,0,speed);debt--;}
  previous=origin;
  for(let i=particles.length-1;i>=0;i--){advance(particles[i],dt);if(particles[i].age>=particles[i].life)particles.splice(i,1);}
  paint();frame=requestAnimationFrame(tick);
 }
 function schedule(){
  if(!active()){
   if(frame)cancelAnimationFrame(frame);frame=0;last=0;previous=null;speed=0;
   particles.length=0;ctx.clearRect(0,0,canvas.width,canvas.height);return;
  }
  resize();
  if(!motion()){
   if(frame)cancelAnimationFrame(frame);frame=0;last=0;previous=null;speed=0;still();return;
  }
  if(frame)return;
  last=0;previous=null;speed=0;
  if(!particles.length){const origin=chimney();for(let i=0;i<30;i++)emit(origin,.12+i*.115);}
  frame=requestAnimationFrame(tick);
 }
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();},{root:intro,threshold:0}).observe(scene);
 new ResizeObserver(()=>{if(resize())previous=null;schedule();}).observe(scene);
 new MutationObserver(schedule).observe(intro,{attributes:true,attributeFilter:['class','data-memory-unlocked']});
 let previousMotion=motion();
 new MutationObserver(()=>{const value=motion();if(value!==previousMotion){previousMotion=value;schedule();}}).observe(document.body,{attributes:true,attributeFilter:['class']});
 intro.addEventListener('scroll',schedule,{passive:true});
 document.addEventListener('visibilitychange',schedule);reduced.addEventListener('change',schedule);
 window.addEventListener('pageshow',schedule);
 train.addEventListener('animationstart',event=>{if(event.animationName==='n6-arrival'){particles.length=0;debt=0;previous=null;speed=0;}});
 window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);frame=0;});
 // Small read-only diagnostic surface used by the visual/animation checks.
 window.GoiVietMemorySmoke={getState:()=>({running:!!frame,visible,mode,particles:particles.length,emitted,origin:chimney(),canvas:[canvas.width,canvas.height],worldSpace:true,bounds:particles.length?{left:Math.min(...particles.map(p=>p.x)),right:Math.max(...particles.map(p=>p.x)),top:Math.min(...particles.map(p=>p.y)),bottom:Math.max(...particles.map(p=>p.y))}:null})};
})();
