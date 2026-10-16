/* Lightweight moving layer; terrain and labels remain on the original canvas. */
(() => {
  'use strict';
  const canvas=document.createElement('canvas');canvas.id='journeyVehicleCanvas';canvas.className='journey-vehicle-layer';canvas.setAttribute('aria-hidden','true');document.getElementById('mapScene').append(canvas);
  const ctx=canvas.getContext('2d'),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));let frames=0,lastFull=false,lastVehicle=null,lastPaintMS=0;
  const project=(x,y,z=30)=>project3D(x,y,z,state.cam,cw,ch);
  function clear(){ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);lastVehicle=null;}
  function rangePath(curve,from,to,offset=0){
    ctx.beginPath();let started=false;
    const draw=p=>{const a=project(p.wx,p.wy,27),b=project(p.wx+p.tx,p.wy+p.ty,27),length=Math.hypot(b[0]-a[0],b[1]-a[1])||1,x=a[0]-(b[1]-a[1])/length*offset,y=a[1]+(b[0]-a[0])/length*offset;if(started)ctx.lineTo(x,y);else{ctx.moveTo(x,y);started=true;}};
    draw(sampleCurveAtDist(curve,from));for(const p of curve.pts)if(p.dist>from&&p.dist<to)draw(p);draw(sampleCurveAtDist(curve,to));
  }
  function rail(curve,from,to,alpha){
    if(to-from<.001||alpha<.005)return;ctx.save();ctx.globalAlpha*=alpha;ctx.lineJoin='round';ctx.lineCap='round';
    rangePath(curve,from,to);ctx.lineWidth=5.1;ctx.strokeStyle=state.theme==='dark'?'#68523c':'#76563c';ctx.stroke();
    ctx.beginPath();const step=clamp(11/Math.max(.3,state.cam.zoom),3.5,30);
    for(let d=Math.ceil(from/step)*step;d<to;d+=step){const p=sampleCurveAtDist(curve,d),a=project(p.wx,p.wy,27),b=project(p.wx+p.tx,p.wy+p.ty,27),l=Math.hypot(b[0]-a[0],b[1]-a[1])||1,nx=-(b[1]-a[1])/l*4.6,ny=(b[0]-a[0])/l*4.6;ctx.moveTo(a[0]+nx,a[1]+ny);ctx.lineTo(a[0]-nx,a[1]-ny);}
    ctx.strokeStyle=state.theme==='dark'?'#ceb989':'#e8cf97';ctx.lineWidth=1.2;ctx.stroke();
    for(const offset of [-2,2]){rangePath(curve,from,to,offset);ctx.strokeStyle=state.theme==='dark'?'#efe5bb':'#fff2cf';ctx.lineWidth=1.15;ctx.stroke();}ctx.restore();
  }
  function sea(curve,from,to,alpha){if(to-from<.001)return;ctx.save();ctx.globalAlpha*=alpha;rangePath(curve,from,to);ctx.setLineDash([5,7]);ctx.lineWidth=2;ctx.lineCap='round';ctx.strokeStyle=state.theme==='dark'?'#a0d8d9':'#edf0cd';ctx.stroke();ctx.setLineDash([3,9]);ctx.strokeStyle=state.theme==='dark'?'#528f9d':'#226e7d';ctx.lineWidth=1;ctx.stroke();ctx.restore();}
  function completion(leg,p){if(!p.trip)return p.selected===p.currentId?1:0;const current=p.trip.route.legs.indexOf(p.trip.phase.leg),index=p.trip.route.legs.indexOf(leg);return index<current?1:index>current?0:p.trip.progress;}
  function tracks(p,now){
    for(const layer of GoiVietJourneyPreview.allLayers()){
      const c=completion(layer.leg,p),draw=layer.leg.mode==='sea'?sea:rail,limit=layer.curve.totalLen*(layer.role==='preview'&&!state.reducedMotion?clamp((now-p.changedAt)/300,0,1):1),split=Math.min(limit,layer.curve.totalLen*c);
      draw(layer.curve,0,split,layer.alpha*.35);draw(layer.curve,split,limit,layer.alpha*.94);
    }
  }
  function pose(curve,distance){const p=sampleCurveAtDist(curve,distance),a=sampleCurveAtDist(curve,Math.min(curve.totalLen,distance+3.5)),b=sampleCurveAtDist(curve,Math.max(0,distance-3.5)),q=project(p.wx,p.wy,38),ahead=project(a.wx,a.wy,38),behind=project(b.wx,b.wy,38);return{x:q[0],y:q[1],angle:Math.atan2(ahead[1]-behind[1],ahead[0]-behind[0]),world:[p.wx,p.wy]};}
  function wheel(x,rotation){ctx.beginPath();ctx.arc(x,3,3,0,Math.PI*2);ctx.fillStyle='#24322c';ctx.fill();ctx.strokeStyle='#e5be72';ctx.lineWidth=1;ctx.stroke();ctx.beginPath();ctx.moveTo(x-Math.cos(rotation)*2.2,3-Math.sin(rotation)*2.2);ctx.lineTo(x+Math.cos(rotation)*2.2,3+Math.sin(rotation)*2.2);ctx.stroke();}
  function car(p,type,rotation,scale=1){
    ctx.save();ctx.translate(p.x,p.y);let angle=p.angle,dir=1;if(Math.cos(angle)<0){angle+=Math.PI;dir=-1;}ctx.rotate(angle);ctx.scale(scale,scale);
    ctx.fillStyle='#122e2930';ctx.beginPath();ctx.ellipse(0,5,14,4,0,0,Math.PI*2);ctx.fill();
    if(type==='loco'){
      if(state.theme==='dark'){const g=ctx.createLinearGradient(dir*10,0,dir*34,0);g.addColorStop(0,'#ffe5a785');g.addColorStop(1,'#ffe5a700');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(dir*10,-4);ctx.lineTo(dir*36,-10);ctx.lineTo(dir*36,7);ctx.fill();}
      ctx.fillStyle='#a33223';ctx.strokeStyle='#efd19a';ctx.lineWidth=1.2;ctx.beginPath();ctx.roundRect(-12,-10,24,12,3);ctx.fill();ctx.stroke();
      const cab=dir>0?-12:2,stack=dir>0?5:-9;ctx.fillStyle='#6d281e';ctx.fillRect(cab,-14,10,16);ctx.strokeRect(cab,-14,10,16);ctx.fillStyle='#fff2c8';ctx.fillRect(cab+2,-11,6,5);ctx.fillStyle='#253c34';ctx.fillRect(stack,-15,4,5);ctx.fillStyle='#dfb772';ctx.fillRect(stack-1,-17,6,2);ctx.fillRect(-11,-3,22,1.7);
      for(const x of [-7,0,7])wheel(x,rotation);ctx.beginPath();ctx.moveTo(-7+Math.cos(rotation),3+Math.sin(rotation));ctx.lineTo(7+Math.cos(rotation),3+Math.sin(rotation));ctx.strokeStyle='#ecd8ac';ctx.lineWidth=.8;ctx.stroke();
      ctx.beginPath();ctx.moveTo(dir*12,2);ctx.lineTo(dir*17,2);ctx.lineTo(dir*12,-4);ctx.fillStyle='#d8ad67';ctx.fill();
    }else{
      ctx.fillStyle=type==='car1'?'#245663':'#3e6950';ctx.strokeStyle='#eed39b';ctx.lineWidth=1.2;ctx.beginPath();ctx.roundRect(-10,-9,20,11,2.5);ctx.fill();ctx.stroke();ctx.fillStyle='#d7b375';ctx.fillRect(-10.5,-11,21,2);ctx.fillStyle='#fff0c8';for(const x of [-6.5,-1.5,3.5])ctx.fillRect(x,-6,3.4,4);for(const x of [-5.5,5.5])wheel(x,rotation);
    }ctx.restore();
  }
  function train(v){
    const scale=state.cam.zoom<.45?.78:.93;if(state.cam.zoom>.68)lastFull=true;else if(state.cam.zoom<.54)lastFull=false;
    if(!v.leg){const q=project(...v.point,38),p={x:q[0],y:q[1],angle:.25,world:v.point};car(p,'loco',0,scale);return p;}
    const curve=v.leg.curve,head=v.progress*curve.totalLen,loco=pose(curve,head),specs=[{...loco,type:'loco'}];
    if(lastFull){const ds=getTrainCarDistances(curve,head,state.cam,cw,ch);for(const[type,d]of [['car1',ds[1]],['car2',ds[0]]]){const p=pose(curve,d),last=specs.at(-1);if(Math.hypot(p.x-last.x,p.y-last.y)>16)specs.push({...p,type});}}
    ctx.save();ctx.beginPath();specs.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle='#d8c397';ctx.lineWidth=2;ctx.stroke();ctx.restore();
    for(const p of [...specs].reverse())car(p,p.type,v.moving?head*state.cam.zoom/3:0,scale);
    if(v.moving&&!state.reducedMotion){for(let i=0;i<4;i++){const age=(v.elapsed/1000+i*.29)%1.15,old=pose(curve,Math.max(0,head-age*20));ctx.beginPath();ctx.arc(old.x-age*3,old.y-17-age*16,1.5+age*3,0,Math.PI*2);ctx.fillStyle='rgba(255,247,221,'+((1-age/1.15)*.36)+')';ctx.fill();}}
    return loco;
  }
  function boat(v){
    let p;if(v.leg)p=pose(v.leg.curve,v.progress*v.leg.curve.totalLen);else{const q=project(...v.point,38);p={x:q[0],y:q[1],angle:0,world:v.point};}
    ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.scale(.9,.9);
    if(v.moving){ctx.strokeStyle='#fff5d8a6';ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(-16,-4);ctx.lineTo(-25,-8);ctx.moveTo(-16,4);ctx.lineTo(-25,8);ctx.stroke();}
    ctx.fillStyle='#245e69';ctx.strokeStyle='#efdaa5';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-15,-6);ctx.lineTo(9,-6);ctx.lineTo(17,0);ctx.lineTo(9,6);ctx.lineTo(-15,6);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#fff1cf';ctx.fillRect(-7,-9,14,5);ctx.fillStyle='#ad3a26';ctx.fillRect(-4,-8,3,3);ctx.fillRect(1,-8,3,3);ctx.restore();return p;
  }
  function endpoints(p,now){
    const route=p.route,boxes=[];if(route?.legs.length){for(const[world,color,radius]of [[route.start,'#356c54',4],[route.end,'#aa3525',6]]){const q=project(...world,38);ctx.beginPath();ctx.arc(q[0],q[1],radius+2.5,0,Math.PI*2);ctx.fillStyle='#fff0cf';ctx.fill();ctx.beginPath();ctx.arc(q[0],q[1],radius,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();boxes.push({left:q[0]-13,right:q[0]+13,top:q[1]-13,bottom:q[1]+13});}
      for(const leg of route.legs)if(GoiVietJourneyNetwork.node(leg.to).kind==='port'){const q=project(...GoiVietJourneyNetwork.node(leg.to).point,30);ctx.beginPath();ctx.arc(q[0],q[1],4,0,Math.PI*2);ctx.fillStyle='#f7e8bd';ctx.fill();ctx.strokeStyle='#356c62';ctx.lineWidth=1.5;ctx.stroke();}}
    if(!state.reducedMotion&&now-p.arrivedAt<1100&&now>=p.arrivedAt){const q=project(...GoiVietJourneyNetwork.node(p.currentId).point,38),t=(now-p.arrivedAt)/1100;ctx.beginPath();ctx.arc(q[0],q[1],8+18*t,0,Math.PI*2);ctx.strokeStyle='rgba(193,125,51,'+(1-t)*.65+')';ctx.lineWidth=2;ctx.stroke();}
    GoiVietJourneyPreview.setObstacles(boxes);
  }
  function paint(now=performance.now()){
    const begin=performance.now(),ratio=Math.min(devicePixelRatio||1,1.5,Math.sqrt(6*1024*1024/Math.max(1,cw*ch)));if(canvas.width!==Math.round(cw*ratio)||canvas.height!==Math.round(ch*ratio)){canvas.width=Math.round(cw*ratio);canvas.height=Math.round(ch*ratio);}
    ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,cw,ch);if(!GoiVietJourneyPreview.active())return;
    const p=GoiVietJourneyPreview.presentation();tracks(p,now);endpoints(p,now);const v=GoiVietJourneyPreview.vehicle();lastVehicle=null;
    if(v){if(v.mode==='transfer'){ctx.save();ctx.globalAlpha=1-v.transfer;lastVehicle=(v.leg.mode==='sea'?boat:train)({...v,mode:v.leg.mode});ctx.restore();ctx.save();ctx.globalAlpha=v.transfer;(v.next.mode==='sea'?boat:train)({...v,leg:v.next,progress:0});ctx.restore();}else lastVehicle=(v.mode==='sea'?boat:train)(v);}
    frames++;lastPaintMS=performance.now()-begin;
  }
  window.GoiVietJourneyVehicles=Object.freeze({paint,clear,inspect:()=>({frames,lastPaintMS,fullConsist:lastFull,vehicle:lastVehicle&&{x:lastVehicle.x,y:lastVehicle.y,world:lastVehicle.world},canvasBytes:canvas.width*canvas.height*4})});
})();
