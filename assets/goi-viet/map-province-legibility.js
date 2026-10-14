/* Clear administrative outlines and adaptive province names, map only.
   Rendering only: no province geometry, camera, railway or input mutation. */
(() => {
  'use strict';
  const intro=document.getElementById('introScreen');
  const active=()=>Boolean(intro?.classList.contains('intro-hidden'));
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const anchors=new WeakMap();
  let lastLayout=[],lastKey='';
  const overlaps=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
  const rect=(x,y,w,h)=>({left:x-w/2,right:x+w/2,top:y-h/2,bottom:y+h/2});
  function segmentHitsRect(a,b,box) {
    const dx=b[0]-a[0],dy=b[1]-a[1],p=[-dx,dx,-dy,dy],q=[a[0]-box.left,box.right-a[0],a[1]-box.top,box.bottom-a[1]];let low=0,high=1;
    for(let i=0;i<4;i++){if(!p[i]){if(q[i]<0)return false;continue;}const t=q[i]/p[i];if(p[i]<0){if(t>high)return false;low=Math.max(low,t);}else{if(t<low)return false;high=Math.min(high,t);}}
    return true;
  }
  function paintBoundary(context,zoom,selected,hovered) {
    if(!active())return false;
    context.save();context.lineJoin='round';context.lineCap='round';
    context.strokeStyle='rgba(18,48,40,.84)';context.lineWidth=selected?3.8:hovered?3.2:clamp(1.35+zoom*.23,1.5,2.2);context.stroke();
    context.strokeStyle=selected?'#FFF7D8':hovered?'#F9E5AA':'rgba(255,243,208,.86)';
    context.lineWidth=selected?2.15:hovered?1.65:clamp(.52+zoom*.07,.58,.8);context.stroke();
    context.restore();return true;
  }
  function anchorFor(province) {
    if(anchors.has(province))return anchors.get(province);
    const rings=province.polyRings||[],area=ring=>Math.abs(ring.reduce((sum,p,i)=>{const q=ring[(i+1)%ring.length];return sum+p[0]*q[1]-q[0]*p[1];},0));
    const ring=rings.reduce((best,r)=>!best||area(r)>area(best)?r:best,null);
    if(!ring)return province.center;
    const xs=ring.map(p=>p[0]),ys=ring.map(p=>p[1]),left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);
    function clearance(point) {
      if(!pointInRing2D(...point,ring))return -1;
      let closest=Infinity;
      for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length],dx=b[0]-a[0],dy=b[1]-a[1],t=clamp(((point[0]-a[0])*dx+(point[1]-a[1])*dy)/(dx*dx+dy*dy||1),0,1);closest=Math.min(closest,Math.hypot(point[0]-a[0]-t*dx,point[1]-a[1]-t*dy));}
      return closest;
    }
    let best=province.center||[(left+right)/2,(top+bottom)/2],score=clearance(best);
    for(let y=0;y<7;y++)for(let x=0;x<7;x++){const point=[left+(x+.5)*(right-left)/7,top+(y+.5)*(bottom-top)/7],next=clearance(point);if(next>score){best=point;score=next;}}
    anchors.set(province,best);return best;
  }
  function drawLabel(context,label) {
    context.font=canvasFont(label.size,700);context.textAlign='center';context.textBaseline='middle';
    if(label.priority){
      if(!label.inside){context.beginPath();context.moveTo(...label.anchorScreen);context.lineTo(label.x,label.y);context.strokeStyle='rgba(20,57,46,.8)';context.lineWidth=1;context.stroke();}
      context.beginPath();context.roundRect(label.rect.left,label.rect.top,label.rect.right-label.rect.left,label.rect.bottom-label.rect.top,5);context.fillStyle=label.selected?'rgba(253,236,188,.97)':'rgba(255,249,232,.97)';context.fill();context.fillStyle=label.fill;context.fillText(label.text,label.x,label.y+.25);
    }else drawHaloText(context,label.text,label.x,label.y,label.fill,label.halo,2.8);
  }
  function paintLabels(context,cam,width,height) {
    if(!active()){lastLayout=[];lastKey='';return;}
    context.save();
    const blocked=[...document.querySelectorAll('.top-header,.left-helper,#stationPanel,.bottom-dock,.mobile-view-switcher')].map(el=>el.getBoundingClientRect()).filter(r=>r.width>0&&r.height>0).map(r=>({left:r.left-5,right:r.right+5,top:r.top-5,bottom:r.bottom+5}));
    for(const pin of renderedHitDemoPins){
      blocked.push(rect(pin.sx,pin.sy,pin.hitR*2+8,pin.hitR*2+8));
      if(P34_MAP[pin.place.id]&&state.selectedPlaceId!==pin.place.id){context.font=canvasFont(13,700,'heading');const text=getCleanStationName(pin.place);blocked.push(rect(pin.sx,pin.sy-18,context.measureText(text).width+12,22));}
    }
    for(const mem of state.mentionedPlaces){if(!mem.center)continue;const[x,y]=project3D(...mem.center,36,cam,width,height);context.font=canvasFont(12.5,700,'heading');blocked.push(rect(x,y-10,context.measureText(`✦ ${mem.name} (Ký ức)`).width+14,42));}
    if(state.railRun?.curve&&Number.isFinite(state.railRun.curWX)){const run=state.railRun,maxStop=Math.max(0,run.curve.totalLen-6),head=run.progress*maxStop;
      const positions=[head,...getTrainCarDistances(run.curve,head,cam,width,height)].map(d=>{const p=sampleCurveAtDist(run.curve,d);return project3D(p.wx,p.wy,38,cam,width,height);});
      positions.forEach(([x,y])=>blocked.push(rect(x,y-7,40,42)));
    }
    if(state.railRun?.curve){const destination=P34_MAP[normalizePlaceId(state.selectedPlaceId)]?.center||ISLAND_MAP[state.selectedPlaceId]?.pt;
      if(destination){const[x,y]=project3D(...destination,44,cam,width,height),place=CULTURAL_PLACE_MAP[normalizePlaceId(state.selectedPlaceId)]||CULTURAL_PLACES[0],pawn=getPlayerPawn(state.currentPlayerIndex);context.font=canvasFont(12,700);blocked.push(rect(x,y-32,context.measureText(`${getCleanStationName(place)} • ${pawn.roleLabel}`).width+38,34));blocked.push(rect(x,y,36,36));}
    }
    const key=JSON.stringify([width,height,cam.zoom,cam.yaw,cam.pitch,cam.panX,cam.panY,state.selectedPlaceId,state.hoveredItem?.id,state.theme,state.exploredPlaceIds,state.mentionedPlaces.map(m=>[m.name,m.center]),state.railRun?.progress,state.railRun?.curWX,state.railRun?.curWY,state.currentPlayerIndex,Boolean(window.GoiVietDEM),document.fonts.check(canvasFont(13,700)),blocked]);
    if(key===lastKey){lastLayout.forEach(label=>drawLabel(context,label));context.restore();return;}
    const selected=normalizePlaceId(state.selectedPlaceId),hovered=state.hoveredItem?.id,candidates=[];
    const corridors=[];
    for(const[curve,z]of[[MAIN_RAIL_SPLINE,27],...(state.railRun?.branchCurves||[]).map(curve=>[curve,28])]){
      const points=curve.pts.map(p=>project3D(p.wx,p.wy,z,cam,width,height));
      for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],radius=Math.max(4,Math.max(a[3],b[3])*3.6+1);corridors.push({a,b,radius,bounds:{left:Math.min(a[0],b[0])-radius,right:Math.max(a[0],b[0])+radius,top:Math.min(a[1],b[1])-radius,bottom:Math.max(a[1],b[1])+radius}});}
    }
    const coversTrack=box=>corridors.some(({a,b,radius,bounds})=>overlaps(box,bounds)&&segmentHitsRect(a,b,{left:box.left-radius,right:box.right+radius,top:box.top-radius,bottom:box.bottom+radius}));
    for(const entry of renderedHitProvinces){
      const p=entry.prov;if(['hn','hue','hcm'].includes(p.id)||!p.center)continue;
      const selectedHere=p.id===selected,hoveredHere=p.id===hovered,priority=selectedHere||hoveredHere;
      const points=entry.topProjectedRings.flat(),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),visibleWidth=Math.max(0,Math.min(width,Math.max(...xs))-Math.max(0,Math.min(...xs))),visibleHeight=Math.max(0,Math.min(height,Math.max(...ys))-Math.max(0,Math.min(...ys)));
      if(!priority&&(visibleWidth<9||visibleHeight<12))continue;
      const anchor=anchorFor(p),z=priority?36:state.exploredPlaceIds.includes(p.id)?24:16,[x,y]=project3D(...anchor,z+4,cam,width,height);
      const size=priority?14:cam.zoom>=1.4?13:cam.zoom>=.95?12:11.5,text=(p.short||p.name).replace(/^TP\.?\s*/i,'').replace(/^(Tỉnh|Thành phố)\s+/,'');
      context.font=canvasFont(size,700);const textWidth=context.measureText(text).width;
      candidates.push({id:p.id,text,anchor,x,y,size,z,priority,selected:selectedHere,hovered:hoveredHere,width:textWidth+12,height:size+9,area:visibleWidth*visibleHeight,rings:entry.topProjectedRings});
    }
    candidates.sort((a,b)=>Number(b.hovered)-Number(a.hovered)||Number(b.selected)-Number(a.selected)||b.area-a.area||a.id.localeCompare(b.id));
    const placed=[];
    for(const label of candidates){
      const offsets=[[0,0],[-18,-7],[18,7],[0,-16],[0,16],[-32,0],[32,0],[-24,-20],[24,20],[-42,0],[42,0],[0,-34],[0,34]];
      for(const[dx,dy]of offsets){
        const x=label.x+dx,y=label.y+dy,box=rect(x,y,label.width,label.height),safe={left:box.left-3,right:box.right+3,top:box.top-3,bottom:box.bottom+3};
        if(box.left<8||box.right>width-8||box.top<8||box.bottom>height-8||blocked.some(r=>overlaps(safe,r))||placed.some(p=>overlaps(safe,p.rect))||coversTrack(safe))continue;
        const inside=label.rings.some(r=>pointInRing2D(x,y,r));if(!inside&&!label.priority)continue;
        const sample=window.GoiVietTerrainRelief?.inspectAt(...label.anchor),rgb=sample?.pixelRGB||[170,175,130],light=(rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722)>130;
        const fill=light?'#173D34':'#FFF8E5',halo=light?'rgba(255,249,231,.96)':'rgba(13,42,35,.93)';
        placed.push({id:label.id,text:label.text,x,y,size:label.size,anchor:[...label.anchor],anchorScreen:[label.x,label.y],offset:[dx,dy],z:label.z,rect:box,priority:label.priority,selected:label.selected,inside,fill:label.priority?'#173D34':fill,halo});break;
      }
    }
    lastLayout=placed;lastKey=key;placed.forEach(label=>drawLabel(context,label));context.restore();
  }
  window.GoiVietMapLegibility=Object.freeze({active,paintBoundary,paintLabels,inspect:()=>active()?lastLayout.map(label=>({...label,rect:{...label.rect},anchor:[...label.anchor],anchorScreen:[...label.anchorScreen],offset:[...label.offset]})):[]});
})();
