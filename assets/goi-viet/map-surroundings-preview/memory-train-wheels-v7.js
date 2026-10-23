/* Animate native painted wheel pixels in their original perspective. */
(() => {
 'use strict';
 const train=document.querySelector('.n6-train'),part=train?.querySelector('[data-train-part="4"]');
 const canvas=part?.querySelector('.n7-native-wheels'),intro=document.getElementById('introScreen');
 if(!canvas||!intro)return;
 const ctx=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 if(!ctx)return;
 const source=new Image(),W=2102,H=504;
 // Front faces measured on the original 2102 × 504 painting, before rail projection.
 const wheels=[
  {x:1599,y:381,rx:39,ry:46},
  {x:1700,y:400,rx:39,ry:46},
  {x:1797,y:417,rx:40,ry:47},
  {x:1903,y:442,rx:35,ry:40,pilot:true}
 ];
 // The original coach axle caps are slightly ahead of the tyre contact
 // samples used for track fitting. Measure the visible faces independently.
 const coachFaces=[
  [[49.5,160,26],[241,185,26]],
  [[362.5,201.5,28],[573,230,29]],
  [[715,252,29],[944.5,285,30]],
  [[1108.5,310,31],[1422,356,34]]
 ];
 const coaches=[...train.querySelectorAll('.n7-coach-wheels')].map(el=>({
  el,part:el.parentElement,ctx:el.getContext('2d'),left:Number(el.dataset.nativeLeft),
  wheels:coachFaces[Number(el.dataset.coachIndex)].map(([x,y,radius])=>({x,y,radius,rx:radius*.76,ry:radius*.89}))
 }));
 const R=56,S=112,body=document.createElement('canvas'),rod=document.createElement('canvas');
 body.width=rod.width=canvas.width=W;body.height=rod.height=canvas.height=H;
 let ready=false,visible=false,frame=0,phase=0,distance=0,mode='original',lastTime=null,draws=0;
 const layer=()=>{const c=document.createElement('canvas');c.width=c.height=S;return c;};
 function local(c,w){c.translate(w.x,w.y);c.scale(w.rx/R,w.ry/R);}
 function disk(c,r=R){c.beginPath();c.arc(0,0,r,0,Math.PI*2);}
 function barPath(c){
  c.beginPath();c.moveTo(1599,385.5);c.lineTo(1799,419);c.lineTo(1799,425.5);c.lineTo(1599,392);c.closePath();
  for(const w of wheels.slice(0,3)){c.moveTo(w.x+11,w.y);c.ellipse(w.x,w.y,11,13,.05,0,Math.PI*2);}
 }
 function prepare(){
  if(source.naturalWidth!==W||source.naturalHeight!==H)return;
  const b=body.getContext('2d'),r=rod.getContext('2d');
  b.drawImage(source,0,0);b.globalCompositeOperation='destination-out';
  // Remove only the moving front faces and the old painted coupling bar.
  // Tyres, undercarriage, boiler, coach pixels and cowcatcher stay in place.
  b.save();b.lineWidth=2;barPath(b);b.fill();b.stroke();b.restore();
  b.beginPath();b.moveTo(1599,388);b.lineTo(1799,421);b.lineWidth=16;b.stroke();
  // The old bar lies in front of painted chassis shadows. Restore those
  // shadows from the adjacent native pixels below, avoiding a transparent slot.
  b.save();b.globalCompositeOperation='source-over';b.beginPath();
  b.moveTo(1599,380);b.lineTo(1799,413);b.lineTo(1799,429);b.lineTo(1599,396);b.closePath();b.clip();
  b.drawImage(source,0,-18);b.restore();
  for(const w of wheels){b.save();local(b,w);disk(b,R+.8);b.fill();b.restore();}
  r.save();barPath(r);r.clip();r.drawImage(source,0,0);r.restore();
  for(const w of wheels){
   const raw=layer(),c=raw.getContext('2d');
   c.save();c.translate(R,R);c.scale(R/w.rx,R/w.ry);c.drawImage(source,-w.x,-w.y);c.restore();
   const clean=layer(),p=clean.getContext('2d');p.drawImage(raw,0,0);
   if(!w.pilot){
    // Recover the narrow bar-occluded strip from the same wheel's unobscured
    // upper spokes/rim. Each half samples the upper quadrant, so neither
    // side can copy the baked bar back into the cleaned strip.
    for(const side of [-1,1]){
     p.save();p.translate(R,R);p.beginPath();p.rect(side<0?-R-1:0,-R,R+1,R*2);p.clip();
     p.beginPath();
     [[1599,384.5],[1799,418],[1799,426.5],[1599,393]].forEach(([x,y],i)=>p[i?'lineTo':'moveTo']((x-w.x)*R/w.rx,(y-w.y)*R/w.ry));
     p.closePath();p.clip();
     p.rotate(side*Math.PI/2);p.drawImage(raw,-R,-R);p.restore();
    }
   }
   w.texture=clean;
  }
  for(const coach of coaches)for(const w of coach.wheels){
   const texture=layer(),c=texture.getContext('2d');
   c.translate(R,R);c.scale(R/w.rx,R/w.ry);c.drawImage(source,-w.x,-w.y);
   w.texture=texture;
  }
  ready=true;schedule();
 }
 function setRendered(value){
  part.classList.toggle('n7-wheels-ready',value);
  for(const coach of coaches)coach.part.classList.toggle('n7-coach-ready',value&&!!coach.ctx);
 }
 function paintCoaches(angle){
  for(const coach of coaches){
   const c=coach.ctx;if(!c)continue;
   c.clearRect(0,0,coach.el.width,coach.el.height);
   for(const w of coach.wheels){
    c.save();c.translate(-coach.left,0);local(c,w);
    // Draw only the spokes. The original static image supplies the axle
    // cap, rim, tyre, lighting and coach body without any reconstructed pixels.
    disk(c,R*.74);c.moveTo(R*.35,0);c.arc(0,0,R*.35,0,Math.PI*2);c.clip('evenodd');
    c.rotate(angle*47/w.radius);c.drawImage(w.texture,-R,-R);c.restore();
   }
  }
 }
 function paint(angle){
  ctx.clearRect(1500,0,W-1500,H);ctx.drawImage(body,1500,0,W-1500,H,1500,0,W-1500,H);
  for(const w of wheels){
   ctx.save();local(ctx,w);disk(ctx);ctx.clip();
   // Keep the rim's painted light and front/back perspective fixed, while
   // rotating the original spokes beneath it in the rectified wheel plane.
   ctx.drawImage(w.texture,-R,-R);
   ctx.save();disk(ctx,R*.76);ctx.moveTo(R*.33,0);ctx.arc(0,0,R*.33,0,Math.PI*2);ctx.clip('evenodd');ctx.rotate(angle*(w.pilot?47/40:1));ctx.drawImage(w.texture,-R,-R);ctx.restore();
   // The original axle cap stays on the axle. The three crank caps are on the rod.
   ctx.save();disk(ctx,R*.33);ctx.clip();
   ctx.scale(R/w.rx,R/w.ry);ctx.drawImage(source,-w.x,-w.y);ctx.restore();ctx.restore();
  }
  // One common orbit translates the complete native rod: all three pins
  // remain connected, and both bar segments retain their original lengths.
  const dx=14*Math.cos(angle),dy=17*Math.sin(angle);
  ctx.drawImage(rod,dx,dy);paintCoaches(angle);draws++;
 }
 function ease(x){
  let a=0,b=1,t=x;
  for(let i=0;i<24;i++){t=(a+b)/2;const v=1.5*t-1.5*t*t+t*t*t;if(v<x)a=t;else b=t;}
  return 1-Math.pow(1-t,3);
 }
 function sample(animation){
  const duration=Number(animation.effect.getTiming().duration),time=Math.max(0,Math.min(duration,Number(animation.currentTime)||0));
  const p=time/duration,travel=p<=.75?p/.75*6/7:6/7+ease((p-.75)/.25)/7;
  distance=Number(canvas.dataset.travel)*travel;
  phase=distance/Number(canvas.dataset.radius);
  return {time,duration};
 }
 const motion=()=>!reduced.matches&&!document.body.classList.contains('reduced-motion');
 const active=()=>ready&&visible&&!document.hidden&&!intro.classList.contains('intro-hidden')&&intro.dataset.memoryUnlocked==='true';
 function tick(){
  frame=0;if(!active()||!motion())return;
  const animation=train.getAnimations().find(a=>a.animationName==='n6-arrival');
  if(!animation){setRendered(false);mode='original';return;}
  const {time,duration}=sample(animation);
  if(time!==lastTime){paint(phase);lastTime=time;}
  setRendered(true);
  mode=time>=duration?'stopped':animation.playState==='paused'?'paused':'rolling';
  // No idle animation loop: the native wheels stop on exactly the final phase.
  if(mode==='rolling'||mode==='paused')frame=requestAnimationFrame(tick);
 }
 function schedule(){
  if(!active()||!motion()){
   if(frame)cancelAnimationFrame(frame);frame=0;
   if(!motion()){setRendered(false);mode='original';lastTime=null;}
   return;
  }
  if(!frame)frame=requestAnimationFrame(tick);
 }
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();},{root:intro,threshold:0}).observe(canvas.closest('.n6-exit-world'));
 new MutationObserver(schedule).observe(intro,{attributes:true,attributeFilter:['class','data-memory-unlocked']});
 let previousMotion=motion();new MutationObserver(()=>{const value=motion();if(value!==previousMotion){previousMotion=value;schedule();}}).observe(document.body,{attributes:true,attributeFilter:['class']});
 train.addEventListener('animationstart',event=>{if(event.animationName==='n6-arrival'){lastTime=null;schedule();}});
 train.addEventListener('animationend',event=>{if(event.animationName==='n6-arrival')schedule();});
 intro.addEventListener('scroll',schedule,{passive:true});
 document.addEventListener('visibilitychange',schedule);reduced.addEventListener('change',schedule);
 window.addEventListener('pageshow',schedule);window.addEventListener('pagehide',()=>{cancelAnimationFrame(frame);frame=0;});
 source.onload=prepare;source.src=canvas.dataset.nativeSrc;
 window.GoiVietMemoryWheels={getState:()=>({ready,running:!!frame,mode,phase,distance,draws,source:canvas.dataset.nativeSrc,nativePerspective:true,coachWheels:coaches.flatMap((coach,index)=>coach.wheels.map(w=>({coach:index,x:w.x,y:w.y,radius:w.radius,phase:phase*47/w.radius}))),pins:wheels.slice(0,3).map(w=>({x:w.x+14*Math.cos(phase),y:w.y+17*Math.sin(phase)}))})};
})();
