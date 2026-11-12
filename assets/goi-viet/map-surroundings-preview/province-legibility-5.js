/* Preview-5 copy of province-legibility.js (P5-03 slice 2): interface text follows the VI/EN choice (GoiVietI18n).
   Other pages keep province-legibility.js. */
/* Clear administrative outlines and adaptive province names, map only.
   Rendering only: no province geometry, camera, railway or input mutation. */
(() => {
  'use strict';
  const intro=document.getElementById('introScreen');
  const active=()=>Boolean(intro?.classList.contains('intro-hidden'));
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const anchors=new WeakMap();
  let lastLayout=[],lastKey='',lastObstacles='',layoutCamera=null,visibleLayout=[],lastCamera=null,lastMotion=0,refineTimer=0,settled=false,layouts=0,reuses=0;
  const measure=(context,text)=>window.GoiVietLabelPerformance?.measure(context,text)??context.measureText(text).width;
  function refineAfterRest(){
    clearTimeout(refineTimer);
    refineTimer=setTimeout(()=>{refineTimer=0;if(active()&&!document.hidden)requestMapRender();},190);
  }
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
    context.font=label.font;context.textAlign='center';context.textBaseline='middle';
    label.lines.forEach((line,i)=>drawHaloText(context,line,label.x,label.y+(i-(label.lines.length-1)/2)*label.lineHeight,label.fill,label.halo,2.6));
  }
  function labelVariants(context,text,size,weight) {
    const font=canvasFont(size,weight,'ui'),lineHeight=size*1.32;
    context.font=font;
    const variant=lines=>{const widths=lines.map(line=>measure(context,line));return {lines,widths,font,lineHeight,width:Math.max(...widths)+8,height:lines.length*lineHeight+4};};
    const variants=[variant([text])],words=text.split(/\s+/);
    if(words.length>1){
      let best=null,score=Infinity;
      for(let i=1;i<words.length;i++){
        const lines=[words.slice(0,i).join(' '),words.slice(i).join(' ')],widths=lines.map(line=>measure(context,line)),next=Math.max(...widths)+Math.abs(widths[0]-widths[1])*.2;
        if(next<score){best=lines;score=next;}
      }
      variants.push(variant(best));
    }
    return variants;
  }
  function paintLabels(context,cam,width,height) {
    if(!active()){lastLayout=[];lastKey='';layoutCamera=null;clearTimeout(refineTimer);refineTimer=0;return;}
    context.save();
    const blocked=window.GoiVietLabelPerformance?GoiVietLabelPerformance.ui(5):[...document.querySelectorAll('.top-header,.left-helper,#stationPanel,.bottom-dock,.mobile-view-switcher,.journey-route-bar')].filter(el=>!el.inert&&el.getAttribute('aria-hidden')!=='true'&&getComputedStyle(el).visibility!=='hidden').map(el=>el.getBoundingClientRect()).filter(r=>r.width>0&&r.height>0).map(r=>({left:r.left-5,right:r.right+5,top:r.top-5,bottom:r.bottom+5}));
    blocked.push(...(window.GoiVietRegionalPreview?.labelObstacles() || []));
    blocked.push(...(window.GoiVietHeritageFrame?.obstacles() || []));
    blocked.push(...(window.GoiVietJourneyPreview?.labelObstacles() || []));
    for(const pin of renderedHitDemoPins){
      blocked.push(rect(pin.sx,pin.sy,pin.hitR*2+8,pin.hitR*2+8));
      if(P34_MAP[pin.place.id]&&(window.GoiVietJourneyPreview?.active()||state.selectedPlaceId!==pin.place.id)){context.font=canvasFont(13,700,'heading');const text=getCleanStationName(pin.place);blocked.push(rect(pin.sx,pin.sy-18,measure(context,text)+12,22));}
    }
    for(const mem of state.mentionedPlaces){if(!mem.center)continue;const[x,y]=project3D(...mem.center,36,cam,width,height);context.font=canvasFont(12.5,700,'heading');blocked.push(rect(x,y-10,measure(context,typeof uiT==='function'?uiT('js.canvas.memory',{name:mem.name}):`✦ ${mem.name} (Ký ức)`)+14,42));}
    if(!window.GoiVietJourneyPreview?.ownsVehicles&&state.railRun?.curve&&(!window.GoiVietJourneyPreview?.active()||window.GoiVietJourneyPreview.shouldPaintTrain())&&Number.isFinite(state.railRun.curWX)){const run=state.railRun,maxStop=Math.max(0,run.curve.totalLen-6),head=run.progress*maxStop;
      const positions=[head,...getTrainCarDistances(run.curve,head,cam,width,height)].map(d=>{const p=sampleCurveAtDist(run.curve,d);return project3D(p.wx,p.wy,38,cam,width,height);});
      positions.forEach(([x,y])=>blocked.push(rect(x,y-7,40,42)));
    }
    if(state.railRun?.curve&&!window.GoiVietJourneyPreview?.active()){const destination=P34_MAP[normalizePlaceId(state.selectedPlaceId)]?.center||ISLAND_MAP[state.selectedPlaceId]?.pt;
      if(destination){const[x,y]=project3D(...destination,44,cam,width,height),place=CULTURAL_PLACE_MAP[normalizePlaceId(state.selectedPlaceId)]||CULTURAL_PLACES[0],pawn=getPlayerPawn(state.currentPlayerIndex);context.font=canvasFont(12,700);blocked.push(rect(x,y-32,measure(context,`${getCleanStationName(place)} • ${pawn.roleLabel}`)+38,34));blocked.push(rect(x,y,36,36));}
    }
    const now=performance.now(),cameraChanged=!lastCamera||['zoom','yaw','pitch','panX','panY'].some(k=>cam[k]!==lastCamera[k]);
    if(cameraChanged){lastMotion=now;lastCamera={...cam};settled=false;refineAfterRest();}
    const quiet=now-lastMotion>=180&&!isDraggingMain&&!isTouchDragging;
    const key=JSON.stringify([width,height,getMapSelectedPlaceId(),window.GoiVietJourneyPreview?.revision(),state.hoveredItem?.id,state.theme,state.exploredPlaceIds,state.mentionedPlaces.map(m=>[m.name,m.center]),state.currentPlayerIndex,Boolean(window.GoiVietDEM||window.GoiVietNaturalTerrainRenderer?.inspect().ready),window.GoiVietLabelPerformance?.fontRevision(),window.GoiVietLabelPerformance?.revision(),getMapScreenOrigin(width,height)]);
    const significant=!layoutCamera||cam.zoom/layoutCamera.zoom<.8||cam.zoom/layoutCamera.zoom>1.25||Math.abs(cam.yaw-layoutCamera.yaw)>.16||Math.abs(cam.pitch-layoutCamera.pitch)>.12||Math.abs(cam.panX-layoutCamera.panX)>width*.4||Math.abs(cam.panY-layoutCamera.panY)>height*.4;
    const obstacles=quiet?JSON.stringify(blocked):'';
    const reuse=key===lastKey&&!significant&&(!quiet||settled&&obstacles===lastObstacles);
    const selected=getMapSelectedPlaceId(),hovered=state.hoveredItem?.id,candidates=[];
    const corridors=[];
    const visibleTracks=window.GoiVietJourneyPreview?.active()?window.GoiVietJourneyPreview.tracks().map(t=>[t.curve,27]):[[MAIN_RAIL_SPLINE,27],...(state.railRun?.branchCurves||[]).map(curve=>[curve,28])];
    for(const[curve,z]of visibleTracks){
      const points=curve.pts.map(p=>project3D(p.wx,p.wy,z,cam,width,height));
      for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],radius=window.GoiVietJourneyPreview?.ownsVehicles?Math.max(6,Math.min(13,7+cam.zoom*3)):Math.max(4,Math.max(a[3],b[3])*3.6+1);corridors.push({a,b,radius,bounds:{left:Math.min(a[0],b[0])-radius,right:Math.max(a[0],b[0])+radius,top:Math.min(a[1],b[1])-radius,bottom:Math.max(a[1],b[1])+radius}});}
    }
    const coversTrack=box=>corridors.some(({a,b,radius,bounds})=>overlaps(box,bounds)&&segmentHitsRect(a,b,{left:box.left-radius,right:box.right+radius,top:box.top-radius,bottom:box.bottom+radius}));
    if(reuse){
      const placed=[],visible=[];
      for(const label of lastLayout){
        const [x,y]=project3D(...label.anchor,label.z+4,cam,width,height),box=rect(x,y,label.rect.right-label.rect.left,label.rect.bottom-label.rect.top),safe={left:box.left-3,right:box.right+3,top:box.top-3,bottom:box.bottom+3};
        const entry=renderedHitProvinces.find(e=>e.prov.id===label.id),inside=(x,y)=>entry?.topProjectedRings.some(r=>pointInRing2D(x,y,r));
        if(box.left<8||box.right>width-8||box.top<8||box.bottom>height-8||blocked.some(b=>overlaps(safe,b))||placed.some(b=>overlaps(safe,b))||!inside(x,y)||(!label.priority&&coversTrack(safe)))continue;
        if(!label.priority&&!label.lines.every((_,i)=>{const cy=y+(i-(label.lines.length-1)/2)*label.lineHeight;return inside(x,cy-label.size*.2)&&inside(x,cy+label.size*.2);}))continue;
        label.x=x;label.y=y;label.rect=box;label.anchorScreen=[x,y];placed.push(box);visible.push(label);drawLabel(context,label);
      }
      // Retain hidden anchors so a temporary occluder does not cause a new
      // placement or lose the label for the rest of the gesture.
      visibleLayout=visible;
      reuses++;context.restore();return;
    }
    for(const entry of renderedHitProvinces){
      const p=entry.prov;if(['hn','hue','hcm'].includes(p.id)||!p.center)continue;
      const selectedHere=p.id===selected,hoveredHere=p.id===hovered,priority=selectedHere||hoveredHere;
      const points=entry.topProjectedRings.flat(),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),visibleWidth=Math.max(0,Math.min(width,Math.max(...xs))-Math.max(0,Math.min(...xs))),visibleHeight=Math.max(0,Math.min(height,Math.max(...ys))-Math.max(0,Math.min(...ys)));
      if(!priority&&(visibleWidth<9||visibleHeight<12))continue;
      const anchor=anchorFor(p),z=priority?36:state.exploredPlaceIds.includes(p.id)?24:16,[x,y]=project3D(...anchor,z+4,cam,width,height);
      const size=priority?13.5:cam.zoom>=1.4?13:12,text=(p.short||p.name).replace(/^TP\.?\s*/i,'').replace(/^(Tỉnh|Thành phố)\s+/,'').normalize('NFC');
      if(!points.length)continue;
      candidates.push({id:p.id,text,anchor,x,y,size,z,priority,selected:selectedHere,hovered:hoveredHere,variants:labelVariants(context,text,size,priority?700:600),area:visibleWidth*visibleHeight,rings:entry.topProjectedRings,visible:{left:Math.max(8,Math.min(...xs)),right:Math.min(width-8,Math.max(...xs)),top:Math.max(8,Math.min(...ys)),bottom:Math.min(height-8,Math.max(...ys))}});
    }
    candidates.sort((a,b)=>Number(b.hovered)-Number(a.hovered)||Number(b.selected)-Number(a.selected)||b.area-a.area||a.id.localeCompare(b.id));
    const placed=[];
    for(const label of candidates){
      const inside=(x,y)=>label.rings.some(r=>pointInRing2D(x,y,r));
      let chosen=null;
      // Names occupy the province itself. Try one line, then a balanced two-line
      // name; hide a crowded name until zoom/hover makes room, never use leaders.
      const offsets=[[0,0],[-18,-7],[18,7],[0,-16],[0,16],[-32,0],[32,0],[-24,-20],[24,20],[-42,0],[42,0],[0,-34],[0,34]],samples=offsets.map(([dx,dy])=>[label.x+dx,label.y+dy]);
      const b=label.visible;
      for(const row of [2,1,3,0,4])for(const col of [3,2,4,1,5,0,6])samples.push([b.left+(col+.5)*(b.right-b.left)/7,b.top+(row+.5)*(b.bottom-b.top)/5]);
      if(label.priority)for(const row of [4,3,5,2,6,1,7,0,8])for(const col of [4,3,5,2,6,1,7,0,8])samples.push([b.left+(col+.5)*(b.right-b.left)/9,b.top+(row+.5)*(b.bottom-b.top)/9]);
      // A temporary hovered/selected name can cross the rail if its province
      // has no clear space. Its anchor still stays inside, with no connector.
      const variants=label.priority?[...label.variants,{...label.variants[0],allowTrack:true}]:label.variants;
      for(const variant of variants){
        if(!label.priority&&variant.width>b.right-b.left+12)continue;
        for(const [x,y]of samples){
          const box=rect(x,y,variant.width,variant.height),safe={left:box.left-3,right:box.right+3,top:box.top-3,bottom:box.bottom+3};
          if(box.left<8||box.right>width-8||box.top<8||box.bottom>height-8||blocked.some(r=>overlaps(safe,r))||placed.some(p=>overlaps(safe,p.rect)))continue;
          if(!inside(x,y)||(!variant.allowTrack&&coversTrack(safe)))continue;
          // Keep the centre of every line in its own province. Small glyph
          // overhang is allowed at an irregular edge, as in printed atlases.
          // Do not repeatedly measure glyphs while the camera is moving.
          const fits=label.priority||variant.lines.every((line,i)=>{const cy=y+(i-(variant.lines.length-1)/2)*variant.lineHeight;return inside(x,cy-label.size*.2)&&inside(x,cy+label.size*.2);});
          if(!fits)continue;
          chosen={...variant,x,y,box,anchor:window.GoiVietRegionalPreview.inverse(x,y,cam,label.z+4)||label.anchor};break;
        }
        if(chosen)break;
      }
      if(chosen){
        const {x,y,box,anchor,lines,font,lineHeight}=chosen;
        placed.push({id:label.id,text:label.text,lines,font,lineHeight,x,y,size:label.size,anchor:[...anchor],anchorScreen:[x,y],offset:[0,0],z:label.z,rect:box,priority:label.priority,selected:label.selected,callout:false,inside:true,fill:'#FFF6DE',halo:'rgba(17,49,40,.94)'});
      }
    }
    lastLayout=placed;visibleLayout=placed;lastKey=key;lastObstacles=obstacles;layoutCamera={...cam};settled=quiet;layouts++;placed.forEach(label=>drawLabel(context,label));context.restore();
  }
  window.GoiVietMapLegibility=Object.freeze({active,paintBoundary,paintLabels,performance:()=>({layouts,reuses,refinePending:Boolean(refineTimer),settled}),inspect:()=>active()?visibleLayout.map(label=>({...label,lines:[...label.lines],rect:{...label.rect},anchor:[...label.anchor],anchorScreen:[...label.anchorScreen],offset:[...label.offset]})):[]});
})();
