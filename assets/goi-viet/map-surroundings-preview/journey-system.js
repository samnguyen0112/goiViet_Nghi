/* Private preview: one trip clock, immutable plans, independent browsing. */
(() => {
  'use strict';
  const N=window.GoiVietJourneyNetwork,intro=document.getElementById('introScreen'),active=()=>intro.classList.contains('intro-hidden'),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  let selected=null,currentId='hn',plan=null,trip=null,previous=null,lastLeg=null,changedAt=-1000,arrivedAt=-1000,revision=0,dirty=1,baseDirty=-1,baseKey='',lastNow=performance.now(),paused=false,phaseKey='',bar=null,clearButton=null,obstacles=[],progressUpdate=0;
  let baseFrames=0,reusedFrames=0,arrival=null,focusCamera=null;
  const cameraFields=[['zoom','targetZoom'],['yaw','targetYaw'],['pitch','targetPitch'],['panX','targetPanX'],['panY','targetPanY']];
  let lastReduced=state.reducedMotion;
  const name=id=>(N.node(id)?.name||CULTURAL_PLACE_MAP[id]?.short||id).replace(/^TP\.\s*/,'').normalize('NFC');
  const ease=t=>mapRailProgress(clamp(t,0,1));
  const moving=()=>active()&&Boolean(trip)&&!paused;
  const invalidate=()=>{dirty++;};
  function makePlan(id){return N.plan(trip?.route.id||currentId,id);}
  function setText(el,text){if(el&&el.textContent!==text)el.textContent=text;}
  function transition(next){previous=!trip&&!state.reducedMotion?plan:null;plan=next;changedAt=performance.now();revision++;invalidate();syncControls();requestMapRender(3);}
  function pointOn(leg,progress){return sampleCurveAtDist(leg.curve,clamp(progress,0,1)*leg.curve.totalLen);}
  function compatibility(phase,progress){
    if(!phase)return;
    const leg=phase.leg,p=pointOn(leg,progress),run={curve:leg.curve,progress,curWX:p.wx,curWY:p.wy,branchCurves:[],startTime:trip?.startedAt||0,duration:phase.duration,stopDistance:leg.curve.totalLen};
    if(leg.mode==='rail'){state.railRun=run;state.seaRun=null;}else{state.seaRun={...run,dockId:N.node(leg.from)?.kind==='port'?leg.from:leg.to,waitForRail:false,didFocus:true,nextRail:null,endPt:N.node(leg.to).point};}
  }
  function finish(now){
    if(!trip)return;
    const route=trip.route,last=route.legs.at(-1);compatibility({leg:last,duration:0},1);lastLeg=last;currentId=route.id;trip=null;arrivedAt=now;phaseKey='';revision++;invalidate();
    if(selected&&selected!==currentId){previous=null;plan=N.plan(currentId,selected);changedAt=now;}else if(!selected)plan=null;
    arrival={id:currentId,originId:route.originId};
    announceSR('Đã đến '+name(currentId)+'. Thông tin điểm đến đã hiện trên bản đồ. Chọn Khám phá để mở câu chuyện.');FolkAudio.playPentatonicChime();syncControls();requestMapRender(3);
  }
  function tick(now=performance.now()){
    if(lastReduced!==state.reducedMotion){lastReduced=state.reducedMotion;syncControls();invalidate();}
    const suspended=!active()||document.hidden||Boolean(getTopOpenModalElement()),delta=Math.max(0,now-lastNow);lastNow=now;
    if(focusCamera&&(suspended||paused))focusCamera.last=now;
    if(trip){
      if(!paused&&!suspended)trip.elapsed+=delta;
      paused=suspended;
      if(state.reducedMotion){finish(now);return;}
      if(trip.elapsed>=trip.total){finish(now);return;}
      const phase=trip.phases.find(p=>trip.elapsed<p.start+p.duration)||trip.phases.at(-1),index=trip.phases.indexOf(phase);
      trip.phase=phase;trip.progress=phase.kind==='transfer'?1:ease((trip.elapsed-phase.start)/phase.duration);
      compatibility(phase,trip.progress);
      if(index+':'+phase.kind!==phaseKey){phaseKey=index+':'+phase.kind;revision++;invalidate();syncControls();}
      if(now-progressUpdate>180){progressUpdate=now;syncProgress();}
    }else paused=suspended;
    if(previous&&(state.reducedMotion||now-changedAt>=300)){previous=null;revision++;invalidate();}
  }
  function select(raw){
    const id=normalizePlaceId(raw);if(!N.playable.includes(id))return false;
    tick();if(!trip&&arrival?.id!==id)arrival=null;selected=id;state.selectedPlaceId=id;transition(trip?.route.id===id?trip.route:makePlan(id));
    FolkAudio.playBambooClack();if(!trip)focus();
    announceSR(trip?'Đã chọn '+name(id)+'. Chuyến đang chạy tiếp tục đến '+name(trip.route.id)+'.':'Đã chọn '+name(id)+'. Nhấn Khởi hành để bắt đầu.');return true;
  }
  function start(raw=selected){
    const id=normalizePlaceId(raw);if(!N.playable.includes(id))return false;
    tick();if(trip){announceSR('Tàu đang đến '+name(trip.route.id)+'. Có thể khởi hành chuyến mới sau khi đến ga.');return false;}
    if(selected!==id){select(id);renderDemoPlaceList();}
    const route=N.plan(currentId,id);if(!route?.legs.length){syncControls();return false;}
    arrival=null;previous=null;plan=route;changedAt=performance.now();const phases=N.schedule(route,state.reducedMotion);
    trip={route,phases,phase:phases[0],elapsed:0,total:phases.reduce((s,p)=>s+p.duration,0),progress:0,startedAt:changedAt};lastNow=changedAt;paused=false;phaseKey='';revision++;invalidate();
    compatibility(phases[0],0);if(!state.reducedMotion)FolkAudio.playTrainWhistle();announceSR('Khởi hành từ '+name(currentId)+' đến '+name(id)+'.');
    focus();syncControls();if(state.reducedMotion)finish(changedAt);requestMapRender(3);return true;
  }
  function clear(){
    if(!selected&&!arrival)return;arrival=null;selected=null;transition(null);obstacles=[];document.getElementById('mapStationArrivalBanner')?.classList.remove('show');
    announceSR(trip?'Đã bỏ chọn. Tàu tiếp tục đến '+name(trip.route.id)+'.':'Đã bỏ chọn và ẩn tuyến hành trình.');
  }
  function reset(){
    focusCamera=null;arrival=null;selected=null;currentId='hn';plan=null;trip=null;previous=null;lastLeg=null;changedAt=arrivedAt=-1000;phaseKey='';lastNow=performance.now();revision++;obstacles=[];
    const point=N.node(currentId).point;state.railRun={curve:buildArcLengthCurveFromRaw([[point[0]-1,point[1]],[...point]]),progress:1,curWX:point[0],curWY:point[1],duration:0,startTime:0,branchCurves:[],stopDistance:1};state.seaRun=null;state.trainSteamPuffs=[];
    invalidate();syncControls();requestMapRender(2);
  }
  function visibleRoute(){return trip?.route||plan;}
  function tracks(){
    if(!active())return [];
    const now=performance.now(),t=state.reducedMotion?1:clamp((now-changedAt)/300,0,1),out=[];
    const add=(route,alpha,role)=>{for(const leg of route?.legs||[])if(leg.mode==='rail'&&alpha>.005)out.push({curve:leg.curve,alpha,role,leg});};
    add(visibleRoute(),trip?1:t,trip?'running':'preview');if(previous&&!trip)add(previous,1-t,'leaving');return out;
  }
  function allLayers(){
    const layers=tracks(),route=visibleRoute(),now=performance.now(),t=state.reducedMotion?1:clamp((now-changedAt)/300,0,1);
    for(const leg of route?.legs||[])if(leg.mode==='sea')layers.push({curve:leg.curve,alpha:trip?1:t,role:trip?'running':'preview',leg});
    if(previous&&!trip&&t<1)for(const leg of previous.legs)if(leg.mode==='sea')layers.push({curve:leg.curve,alpha:1-t,role:'leaving',leg});
    return layers;
  }
  function vehicle(){
    if(!active())return null;
    if(trip){const phase=trip.phase||trip.phases[0];return{mode:phase.kind,leg:phase.leg,next:phase.next,progress:trip.progress,transfer:phase.kind==='transfer'?clamp((trip.elapsed-phase.start)/phase.duration,0,1):0,moving:!paused,elapsed:trip.elapsed};}
    const origin=plan?.originId===currentId?plan.legs[0]:null;if(origin)return{mode:origin.mode,leg:origin,progress:0,moving:false,elapsed:0};
    if(lastLeg)return{mode:lastLeg.mode,leg:lastLeg,progress:1,moving:false,elapsed:0};
    return{mode:N.node(currentId).kind==='island'?'sea':'rail',point:N.node(currentId).point,moving:false,progress:0,elapsed:0};
  }
  function focus(){
    const route=trip?.route||plan;if(!route)return;
    const points=route.legs.length?route.legs.flatMap(l=>l.curve.pts.map(p=>[p.wx,p.wy])):[route.end],xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),middle=[(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...ys)+Math.max(...ys))/2];
    // Reserve the expanded arrival card before departure so it cannot cover the final stop.
    const camera={...state.cam,yaw:0,pitch:.24,zoom:1.5,panX:MAP_CENTER_X-middle[0],panY:MAP_CENTER_Y-middle[1]},base=mapScreenArea||{left:12,right:cw-12,top:100,bottom:ch-110},br=bar&&!bar.hidden?bar.getBoundingClientRect():null,reservedBottom=br?br.bottom-(trip?Math.max(br.height,cw<=600?230:250):br.height):base.bottom,area={...base,bottom:Math.min(base.bottom,reservedBottom)};
    for(let i=0;i<3;i++){const ps=points.map(p=>project3D(...p,27,camera,cw,ch)),px=ps.map(p=>p[0]),py=ps.map(p=>p[1]);camera.zoom=clamp(camera.zoom*Math.min(1,(area.right-area.left-64)/(Math.max(...px)-Math.min(...px)||1),(area.bottom-area.top-70)/(Math.max(...py)-Math.min(...py)||1)),.2,1.5);}
    // Place the route in the actual usable area above the journey bar.
    const [ox,oy]=getMapScreenOrigin(cw,ch);camera.panX+=(area.left+area.right-2*ox)/(2*camera.zoom);camera.panY+=(area.top+area.bottom-2*oy)/(2*camera.zoom*Math.cos(camera.pitch));
    Object.assign(state.cam,{targetZoom:camera.zoom,targetYaw:0,targetPitch:.24,targetPanX:clampPanX(camera.panX),targetPanY:clampPanY(camera.panY)});
    window.GoiVietRegionalPreview?.constrainCamera();
    focusCamera=state.reducedMotion?null:{last:performance.now(),target:cameraFields.map(([,target])=>state.cam[target])};requestMapRender(3);
  }
  function advanceFocusCamera(now){
    if(!focusCamera)return;
    const c=state.cam;
    if(state.reducedMotion||isDraggingMain||isTouchDragging||cameraFields.some(([,target],i)=>Math.abs(c[target]-focusCamera.target[i])>1e-7)){focusCamera=null;return;}
    if(paused||document.hidden){focusCamera.last=now;return;}
    // The host applies 14% per frame. Add only the elapsed-time correction on slow
    // frames during our own focus, so a terrain load cannot stretch it for seconds.
    const steps=Math.max(1,Math.min(100,Math.max(0,now-focusCamera.last))/(1000/60)),extra=1-Math.pow(.86,steps-1);focusCamera.last=now;
    for(const[key,target]of cameraFields)c[key]+=(c[target]-c[key])*extra;
    const delta=cameraFields.reduce((sum,[key,target])=>sum+Math.abs(c[target]-c[key])*((key==='panX'||key==='panY') ? .01 : 1),0);
    if(delta<.00008){for(const[key,target]of cameraFields)c[key]=c[target];focusCamera=null;}
  }
  function buttonLabel(id){return trip?id!==trip.route.id?'Chờ đến ga':paused?'Tạm dừng':trip.phase?.kind==='transfer'?'Chuyển chặng':trip.phase?.kind==='sea'?'Đang đi biển':'Đang chạy':id===currentId?(N.node(id).kind==='island'?'Đã đến đảo':'Đang ở ga'):state.reducedMotion?'Đến ngay':'Khởi hành';}
  function syncProgress(){
    if(!bar)return;const progress=trip?clamp(trip.elapsed/trip.total,0,1):selected===currentId?1:0;
    bar.querySelector('.journey-progress-fill').style.transform='scaleX('+progress+')';bar.querySelector('[role=progressbar]').setAttribute('aria-valuenow',String(Math.round(progress*100)));
  }
  function positionBar(){
    if(!bar||bar.hidden)return;
    const area=mapScreenArea||{left:8,right:innerWidth-8},dock=document.querySelector('#mapScene .bottom-dock'),switcher=document.querySelector('.mobile-view-switcher'),targets=[dock,switcher].filter(el=>el&&el.getBoundingClientRect().width>0&&el.getBoundingClientRect().top>innerHeight*.5&&getComputedStyle(el).display!=='none'),top=Math.min(...targets.map(el=>el.getBoundingClientRect().top),innerHeight-20),width=Math.max(220,Math.min(464,area.right-area.left-20,innerWidth-20)),left=clamp((area.left+area.right-width)/2,10,innerWidth-width-10);
    const key=[Math.round(left),Math.round(innerHeight-top+8),Math.round(width)].join(':');if(bar.dataset.position===key)return;bar.dataset.position=key;bar.style.left=Math.round(left)+'px';bar.style.bottom=Math.round(innerHeight-top+8)+'px';bar.style.width=Math.round(width)+'px';requestAnimationFrame(()=>{adjustControlLayout();invalidate();requestMapRender(2);});
  }
  function adjustControlLayout(){
    if(!bar||bar.hidden||!mapCompass)return;
    const r=bar.getBoundingClientRect(),c=mapCompass;
    const dock=document.querySelector('#mapScene .bottom-dock')?.getBoundingClientRect();
    if(dock?.top>innerHeight*.5){const x=Math.min(dock.left,r.left)-57,y=Math.min(dock.top+21,innerHeight-66);mapCompass=x-43>Math.max(8,mapScreenArea?.left||8)?{...c,x,y}:null;return;}
    if(c.x+45<r.left||c.x-45>r.right||c.y+62<r.top||c.y-38>r.bottom)return;
    const x=r.left-58;if(x-43>Math.max(8,mapScreenArea?.left||8))mapCompass={...c,x};else mapCompass=null;
  }
  function syncControls(){
    if(!bar)return;
    const route=visibleRoute(),show=active()&&Boolean(selected||trip||arrival),had=bar.hidden;bar.hidden=!show;clearButton.hidden=!active()||!(selected||arrival);
    for(const[id,key]of [['btnIslandHoangSa','hoang-sa'],['btnIslandTruongSa','truong-sa']])document.getElementById(id)?.setAttribute('aria-pressed',String(selected===key));
    if(show){
      const origin=trip?.route.originId||route?.originId||currentId,destination=trip?.route.id||selected||arrival?.id,atStation=!trip&&destination===currentId;
      bar.dataset.mode=atStation?'station':trip?'moving':'preview';
      setText(bar.querySelector('.journey-status'),atStation?(arrival?'Đã đến ga':'Bạn đang ở ga'):trip?'Hành trình di sản':'Sẵn sàng khởi hành');
      setText(bar.querySelector('.journey-origin'),name(origin).replace(/^Quần đảo /,''));setText(bar.querySelector('.journey-destination'),name(destination).replace(/^Quần đảo /,''));
      const phase=trip?.phase,caption=trip?(selected&&selected!==trip.route.id?'Tiếp theo: '+name(selected)+' · Chờ đến ga':paused?'Tạm dừng hành trình':phase?.kind==='transfer'?'Tiếp nối '+(phase.next.mode==='sea'?'hải trình':'đường sắt'):phase?.kind==='sea'?'Hải trình đến '+name(phase.leg.to):'Đang đến '+name(trip.route.id)):atStation?(arrival?name(arrival.originId)+' → '+name(currentId):CULTURAL_PLACE_MAP[currentId]?.region||'Mở câu chuyện tại ga'):'Tuyến hành trình minh họa'+(state.reducedMotion?' · Giảm chuyển động':'');
      setText(bar.querySelector('.journey-caption'),caption);const button=bar.querySelector('.journey-depart');setText(button,atStation?'Khám phá':buttonLabel(destination));button.disabled=Boolean(trip);button.dataset.action=atStation?'explore':'depart';
      const detail=bar.querySelector('.journey-arrival-detail');detail.hidden=!arrival;
      if(arrival){const place=CULTURAL_PLACE_MAP[arrival.id];setText(detail.querySelector('.journey-arrival-heading'),atStation?'Dừng chân và khám phá':'Đã đến '+name(arrival.id));setText(detail.querySelector('.journey-arrival-description'),place?.tagline||place?.summary||'Cùng mở câu chuyện và tìm hiểu vùng đất này.');setText(detail.querySelector('.journey-arrival-landmark'),place?.highlights?.landmark||place?.photoTitle||place?.region||name(arrival.id));detail.querySelector('.journey-arrival-explore').hidden=atStation;}
    }
    const card=document.querySelector('#demoPlaceList .place-card.selected'),id=card?.id.replace('placeCard-',''),button=card?.querySelector('.station-board-action');
    if(button){const label=buttonLabel(id);button.disabled=Boolean(trip)||id===currentId;button.setAttribute('aria-label',label);button.title=label;setText(button.querySelector('.ui-ref-action-full'),label);setText(button.querySelector('.ui-ref-action-short'),label);if(!button.querySelector('.ui-ref-action-full'))setText(button,label+' →');
      let note=card.querySelector('.journey-preview-note');if(!note){note=document.createElement('p');note.className='journey-preview-note';card.querySelector('.station-board-ribbon').after(note);}setText(note,trip?'Chuyến đang chạy đến '+name(trip.route.id)+'.':id===currentId?'Đã đến '+name(id)+'. Mở câu chuyện để khám phá ga.':'Xem tuyến và khởi hành trên bản đồ.');}
    syncProgress();positionBar();if(had!==bar.hidden){invalidate();requestAnimationFrame(()=>{syncMapControlLayout();window.GoiVietMapFrame?.syncSafeArea();positionBar();});}
  }
  function screenKey(now){const c=state.cam;return JSON.stringify([cw,ch,c.zoom,c.yaw,c.pitch,c.panX,c.panY,c.targetZoom,c.targetYaw,c.targetPitch,c.targetPanX,c.targetPanY,state.theme,getMapSelectedPlaceId(),state.hoveredItem?.id,revision,window.GoiVietRegionalPreview?.isAnimating()?Math.floor(now/50):0,...getMapScreenOrigin(cw,ch)]);}
  function renderFrame(now){
    tick(now);advanceFocusCamera(now);if(!active()){window.GoiVietJourneyVehicles?.clear();return false;}
    const key=screenKey(now),camera=state.cam,settled=Math.abs(camera.zoom-camera.targetZoom)+Math.abs(camera.pitch-camera.targetPitch)+Math.abs(camera.yaw-camera.targetYaw)+Math.abs(camera.panX-camera.targetPanX)*.01+Math.abs(camera.panY-camera.targetPanY)*.01<.00008;
    if(baseDirty===dirty&&baseKey===key&&settled&&!state.ripples.length&&!isDraggingMain&&!isTouchDragging){reusedFrames++;window.GoiVietJourneyVehicles?.paint(now);return true;}return false;
  }
  function afterBase(now){baseFrames++;baseDirty=dirty;baseKey=screenKey(now);positionBar();window.GoiVietJourneyVehicles?.paint(now);}
  function isAnimating(){const now=performance.now();return active()&&(moving()||!state.reducedMotion&&(now-changedAt<300||now-arrivedAt<1100));}
  function explore(id,trigger){
    const place=CULTURAL_PLACE_MAP[id];if(!place?.stories?.length)return;
    openStoryModal(id,place.stories[0].id,trigger);
    // Reading the arrival must leave a prepared next destination selected in both views.
    if(selected&&selected!==id){state.selectedPlaceId=selected;renderDemoPlaceList();}
  }
  function mount(){
    const scene=document.getElementById('mapScene');bar=document.createElement('section');bar.className='journey-route-bar';bar.id='journeyRouteBar';bar.hidden=true;bar.setAttribute('aria-label','Hành trình di sản');
    bar.innerHTML='<div class="journey-route-main"><span class="journey-route-emblem" aria-hidden="true"><svg class="journey-emblem-train" viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="15" rx="4"/><path d="M5 10h14M9 3v7m6-7v7M8 18l-2 3m10-3 2 3M8 14h1m6 0h1"/></svg><svg class="journey-emblem-check" viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg></span><div class="journey-route-info"><div class="journey-status"></div><div class="journey-route-title"><span class="journey-origin"></span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h16m-6-6 6 6-6 6"/></svg><strong class="journey-destination"></strong></div><div class="journey-caption"></div></div><button type="button" class="journey-depart">Khởi hành</button></div><div class="journey-arrival-detail" hidden role="group" aria-label="Thông tin điểm đến"><div class="journey-arrival-top"><strong class="journey-arrival-heading"></strong><button type="button" class="journey-arrival-close" aria-label="Đóng thông tin đến ga"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div><p class="journey-arrival-description"></p><div class="journey-arrival-foot"><span class="journey-arrival-landmark"></span><button type="button" class="journey-arrival-explore">Khám phá →</button></div></div><div class="journey-progress" role="progressbar" aria-label="Tiến độ hành trình" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i class="journey-progress-fill"></i></div>';
    bar.querySelector('.journey-depart').addEventListener('click',event=>event.currentTarget.dataset.action==='explore'?explore(currentId,event.currentTarget):start());
    bar.querySelector('.journey-arrival-explore').addEventListener('click',event=>{if(arrival)explore(arrival.id,event.currentTarget);});
    bar.querySelector('.journey-arrival-close').addEventListener('click',()=>{arrival=null;syncControls();(bar.hidden?document.getElementById('mainCanvas'):bar.querySelector('.journey-depart')).focus({preventScroll:true});});scene.append(bar);
    new ResizeObserver(()=>{syncMapControlLayout();invalidate();requestMapRender(2);}).observe(bar);
    clearButton=document.createElement('button');clearButton.id='btnClearJourney';clearButton.type='button';clearButton.className='dock-btn journey-clear';clearButton.hidden=true;clearButton.title='Bỏ chọn và ẩn tuyến (Esc)';clearButton.setAttribute('aria-label','Bỏ chọn tỉnh và ẩn tuyến');clearButton.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';clearButton.onclick=()=>{clear();document.getElementById('mainCanvas').focus({preventScroll:true});};scene.querySelector('.bottom-dock').append(clearButton);
    const sources=document.getElementById('mapSourcesContent');if(sources&&!sources.querySelector('[data-journey-network]')){const note=document.createElement('p');note.dataset.journeyNetwork='true';note.textContent='Mạng ga di sản và các chặng đi là minh họa để khám phá văn hóa; không biểu thị tuyến vận tải đang khai thác.';sources.append(note);}
    new MutationObserver(syncControls).observe(document.getElementById('demoPlaceList'),{childList:true,subtree:true});
    new MutationObserver(()=>{const before=paused;tick();if(before!==paused)syncControls();if(!active())window.GoiVietJourneyVehicles?.clear();}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
    new MutationObserver(()=>{invalidate();syncControls();requestMapRender(2);}).observe(intro,{attributes:true,attributeFilter:['class']});
    document.addEventListener('visibilitychange',()=>{tick();syncControls();if(!document.hidden)requestMapRender(2);});window.addEventListener('resize',()=>{invalidate();positionBar();});
    window.GoiVietRasterTasks?.onUpdate(()=>{invalidate();});
    reset();
  }
  window.GoiVietJourneyPreview=Object.freeze({ownsVehicles:true,active,select,start,clear,reset,focus,tick,tracks,isAnimating,isMoving:moving,shouldPaintTrain:()=>active()&&vehicle()?.mode==='rail',syncControls,invalidate,renderFrame,afterBase,adjustControlLayout,vehicle,allLayers,paintRail:()=>{},paintSea:()=>{},paintEndpoints:()=>{},
    selectedId:()=>selected,revision:()=>revision,labelObstacles:()=>{const route=visibleRoute(),boxes=(route?.legs.length?[route.start,route.end]:[N.node(currentId).point]).map(point=>{const[x,y]=project3D(...point,38,state.cam,cw,ch);return{left:x-16,right:x+16,top:y-20,bottom:y+13};});if(mapCompass)boxes.push({left:mapCompass.x-45,right:mapCompass.x+45,top:mapCompass.y-38,bottom:mapCompass.y+64});return boxes;},setObstacles:values=>{obstacles=values;},
    presentation:()=>({route:visibleRoute(),trip,plan,selected,currentId,arrivedAt,changedAt,paused,arrival}),
    inspect:()=>({selected,currentId,running:trip?.route.id||null,paused,revision,connected:N.playable,phase:trip?.phase?.kind||null,phaseProgress:trip?.progress||0,elapsed:trip?.elapsed||0,total:trip?.total||0,plan:plan&&{id:plan.id,originId:plan.originId,available:plan.available,start:plan.start,end:plan.end,nodeIds:plan.nodeIds,railLength:plan.legs.filter(l=>l.mode==='rail').reduce((s,l)=>s+l.curve.totalLen,0),seaLength:plan.legs.filter(l=>l.mode==='sea').reduce((s,l)=>s+l.curve.totalLen,0)},rail:tracks().map(l=>({role:l.role,alpha:l.alpha,length:l.curve.totalLen,points:l.curve.pts.map(p=>[p.wx,p.wy])})),sea:allLayers().filter(l=>l.leg.mode==='sea').map(l=>({role:l.role,length:l.curve.totalLen})),baseFrames,reusedFrames,animating:isAnimating()})});
  mount();
})();
