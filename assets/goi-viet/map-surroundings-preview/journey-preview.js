/* Preview-only journey selection. Planning never starts or moves a vehicle. */
(() => {
  'use strict';
  const intro=document.getElementById('introScreen');
  const active=()=>Boolean(intro?.classList.contains('intro-hidden'));
  const network=new Set(MAIN_SPINE_PROVINCE_IDS);
  const parkedRun={...state.railRun,branchCurves:[...state.railRun.branchCurves]};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const duration=220;
  let selected=null,plan=null,trip=null,previous=null,changedAt=0,revision=0,currentId='hn',clearButton=null;
  let endpoints=[];
  const name=id=>(CULTURAL_PLACE_MAP[id]?.short||CULTURAL_PLACE_MAP[id]?.name||id).normalize('NFC');
  const point=id=>P34_MAP[id]?.center||ISLAND_MAP[id]?.pt;
  const connected=id=>network.has(id)||Boolean(ISLAND_COASTAL_STATIONS[id]&&ISLAND_MAP[id]);
  const moving=()=>Boolean(state.railRun?.progress<1||state.seaRun&&(state.seaRun.waitForRail||state.seaRun.progress<1||state.seaRun.nextRail));

  function trainPosition(now=performance.now()) {
    const run=state.railRun;
    if(!run)return [...MAIN_SPINE_WAYPOINTS[0]];
    if(run.progress<1){const p=sampleCurveAtDist(run.curve,mapRailProgress((now-run.startTime)/run.duration)*Math.max(0,run.curve.totalLen-6));return[p.wx,p.wy];}
    return[run.curWX,run.curWY];
  }
  function seaCurve(start,end) {
    const dx=end[0]-start[0],dy=end[1]-start[1],length=Math.hypot(dx,dy)||1,bend=Math.min(18,length*.08);
    return buildSmoothArcLengthCurve([start,[(start[0]+end[0])/2-dy/length*bend,(start[1]+end[1])/2+dx/length*bend],end],16);
  }
  function makePlan(id) {
    const end=point(id),result={id,originId:currentId,available:connected(id),rail:null,sea:null,start:trainPosition(),end};
    if(!result.available||!end)return result;
    if(id===currentId&&!moving())return result;
    const offshore=state.seaRun&&!state.seaRun.waitForRail;
    const at=offshore?seaPositionAtTime(state.seaRun,performance.now()):null;
    if(ISLAND_COASTAL_STATIONS[id]){
      const dock=point(ISLAND_COASTAL_STATIONS[id]);
      if(at){result.start=[at.wx,at.wy];result.sea=seaCurve(result.start,end);}
      else{result.rail=buildMapRailRoute(...result.start,dock)?.curve||null;result.sea=seaCurve(dock,end);}
    }else if(at){
      const dock=point(state.seaRun.dockId);
      result.start=[at.wx,at.wy];result.sea=seaCurve(result.start,dock);
      result.rail=buildMapRailRoute(...dock,end)?.curve||null;
    }else result.rail=buildMapRailRoute(...result.start,end)?.curve||null;
    return result;
  }
  function transition(next) {
    previous=state.reducedMotion?null:plan;
    plan=next;changedAt=performance.now();revision++;
    requestMapRender(3);syncControls();
  }
  function sync() {
    if(trip){
      if(trip.railRun!==state.railRun){
        trip.railRun=state.railRun;trip.route.rail=state.railRun?.curve||null;
        if(selected===trip.id)plan=trip.route;
        revision++;
      }
      if(state.seaRun)trip.route.sea=state.seaRun.curve;
      if(!moving()){
        const arrived=trip.id;currentId=arrived;trip=null;revision++;
        if(selected&&selected!==arrived)transition(makePlan(selected));else syncControls();
      }
    }
    if(previous&&(state.reducedMotion||performance.now()-changedAt>=duration)){previous=null;revision++;}
  }
  function layers(kind) {
    sync();
    const t=state.reducedMotion?1:clamp((performance.now()-changedAt)/duration,0,1),fade=t*t*(3-2*t),out=[];
    const add=(p,alpha,role)=>{if(p?.[kind]?.pts.length>1&&alpha>.005&&!out.some(l=>l.curve===p[kind]))out.push({curve:p[kind],alpha,role});};
    if(trip)add(trip.route,selected&&selected!==trip.id ? .75 : 1,'running');
    if(plan&&(!trip||selected!==trip.id))add(plan,fade,'preview');
    if(previous&&previous!==trip?.route)add(previous,1-fade,'leaving');
    return out;
  }
  function tracks(){return active()?layers('rail'):[];}
  function isAnimating(){return active()&&!state.reducedMotion&&performance.now()-changedAt<duration;}
  function shouldPaintTrain(){sync();return active()&&Boolean(trip||selected===currentId&&plan?.rail);}
  function select(rawId) {
    const id=normalizePlaceId(rawId);
    if(!CULTURAL_PLACE_MAP[id])return;
    selected=id;state.selectedPlaceId=id;
    transition(trip?.id===id?trip.route:makePlan(id));
    FolkAudio.playBambooClack();
    focus();
    announceSR(plan.available?`Đã chọn ${name(id)}. Xem trước hành trình; nhấn nút khởi hành để bắt đầu.`:`Đã chọn ${name(id)}. Chưa có tuyến đến ga này.`);
  }
  function start(rawId=selected) {
    const id=normalizePlaceId(rawId);
    if(!CULTURAL_PLACE_MAP[id])return false;
    if(selected!==id||state.selectedPlaceId!==id){state.selectedPlaceId=id;select(id);renderDemoPlaceList();}
    if(!connected(id)){announceSR('Chưa có tuyến đến ga này.');return false;}
    if(trip?.id===id&&moving())return false;
    const next=makePlan(id);
    if(!next.rail&&!next.sea){announceSR(`Tàu đang ở ga ${name(id)}.`);syncControls();return false;}
    launchJourneyToPlace(id,point(id));
    // Use the exact launched curve, so the preview and the moving train agree.
    if(!state.seaRun?.nextRail)next.rail=state.railRun?.progress<1||next.rail?state.railRun?.curve||next.rail:null;
    if(state.seaRun)next.sea=state.seaRun.curve;
    trip={id,route:next,railRun:state.railRun};
    transition(next);
    if(ISLAND_COASTAL_STATIONS[id])FolkAudio.playPentatonicChime();else FolkAudio.playTrainWhistle();
    showMapStationArrivalBanner(CULTURAL_PLACE_MAP[id]);
    spawnMapRipple(...point(id));focus();syncControls();requestMapRender(4);
    return true;
  }
  function clear() {
    if(!selected)return;
    selected=null;transition(null);endpoints=[];
    const banner=document.getElementById('mapStationArrivalBanner');banner?.classList.remove('show');
    announceSR(trip?'Đã bỏ chọn. Giữ tuyến đang chạy đến khi tàu tới ga.':'Đã bỏ chọn và ẩn tuyến hành trình.');
  }
  function reset() {
    selected=null;plan=null;trip=null;previous=null;changedAt=-duration;currentId='hn';revision++;endpoints=[];
    state.railRun={...parkedRun,branchCurves:[...parkedRun.branchCurves]};state.seaRun=null;state.trainSteamPuffs=[];
    syncControls();requestMapRender(2);
  }
  function focus() {
    if(!plan?.end)return;
    const points=plan.rail||plan.sea?[plan.start,plan.end,...(plan.rail?.pts||[]).map(p=>[p.wx,p.wy]),...(plan.sea?.pts||[]).map(p=>[p.wx,p.wy])]:[plan.end];
    const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),middle=[(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...ys)+Math.max(...ys))/2];
    const cam={...state.cam,yaw:0,pitch:.28,zoom:1.5,panX:MAP_CENTER_X-middle[0],panY:MAP_CENTER_Y-middle[1]};
    const area=mapScreenArea||{left:8,right:cw-8,top:80,bottom:ch-80};
    for(let i=0;i<3;i++){
      const projected=points.map(p=>project3D(...p,27,cam,cw,ch)),px=projected.map(p=>p[0]),py=projected.map(p=>p[1]);
      cam.zoom=clamp(cam.zoom*Math.min(1,(area.right-area.left-80)/(Math.max(...px)-Math.min(...px)||1),(area.bottom-area.top-90)/(Math.max(...py)-Math.min(...py)||1)),.2,1.5);
    }
    Object.assign(state.cam,{targetZoom:cam.zoom,targetYaw:0,targetPitch:.28,targetPanX:clampPanX(cam.panX),targetPanY:clampPanY(cam.panY)});
    requestMapRender(3);
  }
  function paintRail(context,cam,width,height,draw) {
    for(const layer of tracks()){context.save();context.globalAlpha*=layer.alpha;draw(layer.curve,27,false);context.restore();}
  }
  function paintSea(context,cam,width,height) {
    if(!active())return;
    for(const layer of layers('sea')){
      context.save();context.globalAlpha*=layer.alpha;context.beginPath();
      layer.curve.pts.forEach((p,i)=>{const q=project3D(p.wx,p.wy,27,cam,width,height);if(i)context.lineTo(q[0],q[1]);else context.moveTo(q[0],q[1]);});
      context.setLineDash([5,7]);context.lineCap='round';context.lineWidth=2.2;
      context.strokeStyle=state.theme==='dark'?'#8BDAE2':'#1E6F88';context.stroke();context.restore();
    }
  }
  function paintEndpoints(context,cam,width,height) {
    endpoints=[];
    if(!active())return;
    const route=plan?.available?plan:trip?.route;if(!route?.end||!route.rail&&!route.sea)return;
    for(const [p,color,radius]of [[route.start,'#286A51',6],[route.end,'#A83324',7]]){
      const [x,y]=project3D(...p,44,cam,width,height);
      if(x<0||x>width||y<0||y>height)continue;
      context.save();context.beginPath();context.arc(x,y,radius+3,0,Math.PI*2);context.fillStyle='#FFF3D3';context.fill();context.beginPath();context.arc(x,y,radius,0,Math.PI*2);context.fillStyle=color;context.fill();context.restore();
      endpoints.push({left:x-13,right:x+13,top:y-13,bottom:y+13});
    }
  }
  function setText(el,value){if(el&&el.textContent!==value)el.textContent=value;}
  function syncControls() {
    if(!clearButton)return;
    for(const [buttonId,id]of [['btnIslandHoangSa','hoang-sa'],['btnIslandTruongSa','truong-sa']]){
      const button=document.getElementById(buttonId),pressed=String(selected===id);
      if(button&&button.getAttribute('aria-pressed')!==pressed)button.setAttribute('aria-pressed',pressed);
    }
    const card=document.querySelector('#demoPlaceList .place-card.selected'),id=card?.id.replace('placeCard-','');
    const hidden=!selected;if(clearButton.hidden!==hidden){clearButton.hidden=hidden;requestAnimationFrame(()=>{syncMapControlLayout();window.GoiVietMapFrame?.syncSafeArea();});}
    if(!card)return;
    const button=card.querySelector('.station-board-action');if(!button)return;
    const available=connected(id),running=trip?.id===id,atCurrent=!trip&&id===currentId;
    const label=!available?'Chưa có tuyến':running?'Đang di chuyển':atCurrent?(ISLAND_COASTAL_STATIONS[id]?'Đã đến đảo':'Đang ở ga'):ISLAND_COASTAL_STATIONS[id]?'Khởi hành ra đảo':'Đưa tàu vào ga';
    button.disabled=!available||running||atCurrent;
    if(button.getAttribute('aria-label')!==label)button.setAttribute('aria-label',label);
    if(button.title!==label)button.title=label;
    setText(button.querySelector('.ui-ref-action-full'),label);setText(button.querySelector('.ui-ref-action-short'),label);
    let note=card.querySelector('.journey-preview-note');
    if(!note){note=document.createElement('p');note.className='journey-preview-note';note.setAttribute('role','status');card.querySelector('.station-board-ribbon').after(note);}
    const text=!available?'Chưa có tuyến đến ga này.':running?`Đang đi tới ${name(id)}`:selected!==id?'Chọn điểm trên bản đồ để xem trước hành trình.':atCurrent?(ISLAND_COASTAL_STATIONS[id]?`Đã đến ${name(id)}`:`Tàu đang ở ga ${name(id)}`):`Xem trước · ${name(plan.originId)} → ${name(id)}`;
    setText(note,text);
  }
  function mount() {
    const dock=document.querySelector('#mapScene .bottom-dock');if(!dock)return;
    clearButton=document.createElement('button');clearButton.type='button';clearButton.className='dock-btn journey-clear';clearButton.id='btnClearJourney';clearButton.hidden=true;
    clearButton.setAttribute('aria-label','Bỏ chọn tỉnh và ẩn tuyến hành trình');clearButton.title='Bỏ chọn và ẩn tuyến (Esc)';
    clearButton.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';
    clearButton.addEventListener('click',()=>{clear();document.getElementById('mainCanvas').focus({preventScroll:true});});dock.append(clearButton);
    new MutationObserver(syncControls).observe(document.getElementById('demoPlaceList'),{childList:true,subtree:true});
    new MutationObserver(()=>{syncControls();requestMapRender(2);}).observe(intro,{attributes:true,attributeFilter:['class']});
    changedAt=-duration;syncControls();requestMapRender(2);
  }
  window.GoiVietJourneyPreview=Object.freeze({active,select,start,clear,reset,focus,tracks,isAnimating,shouldPaintTrain,paintRail,paintSea,paintEndpoints,syncControls,
    selectedId:()=>selected,revision:()=>revision,labelObstacles:()=>endpoints.map(r=>({...r})),
    inspect:()=>{sync();return{selected,currentId,running:trip?.id||null,revision,connected:[...network],plan:plan&&{id:plan.id,available:plan.available,originId:plan.originId,start:[...plan.start],end:plan.end&&[...plan.end],railLength:plan.rail?.totalLen||0,seaLength:plan.sea?.totalLen||0},rail:tracks().map(t=>({role:t.role,alpha:t.alpha,length:t.curve.totalLen,points:t.curve.pts.map(p=>[p.wx,p.wy])})),sea:active()?layers('sea').map(t=>({role:t.role,alpha:t.alpha,length:t.curve.totalLen})):[],animating:isAnimating()};}
  });
  mount();
})();
