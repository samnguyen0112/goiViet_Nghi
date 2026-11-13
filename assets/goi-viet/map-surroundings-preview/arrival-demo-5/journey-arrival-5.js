/* Sao từ journey-system-5.js; Khám phá khởi hành rồi mở bảng, Đến ngay, ETA nguyên, chú thích gần vị trí tàu, thanh đến ga gọn và SVG đường ray. */
// Preview-5 copy of journey-system-4.js (P5-02): on arrival the card offers both modes (Chơi thẻ / Đọc sách) for the
// station just reached, kept separate from the stop selected for the next trip. Preview 4 keeps journey-system-4.js.
// Preview 4: reuse journey-bar measurements until its layout inputs change.
/* Private preview: one trip clock, immutable plans, independent browsing. */
(() => {
  'use strict';
  const N=window.GoiVietJourneyNetwork,intro=document.getElementById('introScreen'),active=()=>intro.classList.contains('intro-hidden'),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  let selected=null,currentId='hn',plan=null,trip=null,previous=null,lastLeg=null,changedAt=-1000,arrivedAt=-1000,revision=0,dirty=1,baseDirty=-1,baseKey='',lastNow=performance.now(),paused=false,phaseKey='',bar=null,clearButton=null,obstacles=[],progressUpdate=0;
  let baseFrames=0,reusedFrames=0,arrival=null,lastArrival=null;
  const tr=(key,vars,fallback)=>window.GoiVietI18n?window.GoiVietI18n.t(key,vars):fallback;
  let barLayoutDirty=true,barLayoutKey='';
  const barLayoutTargets=[],barLayoutTransitions=new Map();
  let lastReduced=state.reducedMotion;
  const name=id=>window.GoiVietArrivalDemo?.stationName(id)||(CULTURAL_PLACE_MAP[id]?.short||CULTURAL_PLACE_MAP[id]?.name||window.GoiVietContent?.geo(N.node(id)?.name)||N.node(id)?.name||id||'').replace(/^TP\.\s*/,'').normalize('NFC');
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
  function finish(now,{instant=false}={}){
    if(!trip)return;
    const route=trip.route,last=route.legs.at(-1);compatibility({leg:last,duration:0},1);lastLeg=last;currentId=route.id;trip=null;arrivedAt=now;phaseKey='';revision++;invalidate();
    if(selected&&selected!==currentId){previous=null;plan=N.plan(currentId,selected);changedAt=now;}else if(!selected)plan=null;
    arrival={id:currentId,originId:route.originId};lastArrival=arrival;
    FolkAudio.playPentatonicChime();syncControls();window.GoiVietArrivalDemo?.onArrive(currentId,{instant});requestMapRender(3);
  }
  function tick(now=performance.now()){
    if(lastReduced!==state.reducedMotion){lastReduced=state.reducedMotion;syncControls();invalidate();}
    const suspended=!active()||document.hidden||Boolean(getTopOpenModalElement()),delta=Math.max(0,now-lastNow);lastNow=now;
    if(trip){
      if(!paused&&!suspended)trip.elapsed+=delta;
      paused=suspended;
      if(state.reducedMotion){finish(now,{instant:true});return;}
      if(trip.elapsed>=trip.total){finish(now);return;}
      const phase=trip.phases.find(p=>trip.elapsed<p.start+p.duration)||trip.phases.at(-1),index=trip.phases.indexOf(phase);
      trip.phase=phase;trip.progress=phase.kind==='transfer'?1:ease((trip.elapsed-phase.start)/phase.duration);
      compatibility(phase,trip.progress);syncPassing();
      if(index+':'+phase.kind!==phaseKey){phaseKey=index+':'+phase.kind;revision++;invalidate();syncControls();}
      if(now-progressUpdate>180){progressUpdate=now;syncProgress();}
    }else paused=suspended;
    if(previous&&(state.reducedMotion||now-changedAt>=300)){previous=null;revision++;invalidate();}
  }
  function select(raw){
    const id=normalizePlaceId(raw);if(!N.playable.includes(id))return false;
    tick();if(!trip)arrival=null;selected=id;state.selectedPlaceId=id;transition(trip?.route.id===id?trip.route:makePlan(id));
    FolkAudio.playBambooClack();if(!trip)focus();
    announceSR(tr(trip?'arrival.sr.selectMoving':'arrival.sr.select',{place:name(id),dest:name(trip?.route.id)}));return true;
  }
  function start(raw=selected){
    const id=normalizePlaceId(raw);if(!N.playable.includes(id))return false;
    tick();if(trip){announceSR(tr('journey.sr.busy',{dest:name(trip.route.id)}));return false;}
    if(selected!==id){select(id);renderDemoPlaceList();}
    const route=N.plan(currentId,id);if(!route?.legs.length){explore(id);return true;}
    window.GoiVietArrivalDemo?.closeSheet({restore:false,announce:false});
    arrival=null;previous=null;plan=route;changedAt=performance.now();const phases=N.schedule(route,state.reducedMotion);
    trip={route,phases,phase:phases[0],elapsed:0,total:phases.reduce((s,p)=>s+p.duration,0),progress:0,startedAt:changedAt};lastNow=changedAt;paused=false;phaseKey='';revision++;invalidate();
    compatibility(phases[0],0);if(!state.reducedMotion)FolkAudio.playTrainWhistle();announceSR(tr('arrival.sr.depart',{from:name(currentId),to:name(id)}));
    focus();syncControls();if(state.reducedMotion)finish(changedAt,{instant:true});requestMapRender(3);return true;
  }
  function clear(){
    window.GoiVietArrivalDemo?.routeCleared();
    window.GoiVietStationPanel?.clearSelection();
    if(!selected&&!arrival)return;arrival=null;selected=null;transition(null);obstacles=[];document.getElementById('mapStationArrivalBanner')?.classList.remove('show');
    announceSR(trip?tr('journey.sr.clearedTrip',{dest:name(trip.route.id)}):tr('journey.sr.cleared'));
  }
  function reset(){
    window.GoiVietArrivalDemo?.resetSession();
    arrival=null;selected=null;currentId='hn';plan=null;trip=null;previous=null;lastLeg=null;changedAt=arrivedAt=-1000;phaseKey='';lastNow=performance.now();revision++;obstacles=[];
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
    // Reserve only the compact journey bar; arrivalSheet participates in mapScreenArea separately.
    const camera={...state.cam,yaw:0,pitch:.24,zoom:1.5,panX:MAP_CENTER_X-middle[0],panY:MAP_CENTER_Y-middle[1]},base=mapScreenArea||{left:12,right:cw-12,top:100,bottom:ch-110},br=bar&&!bar.hidden?bar.getBoundingClientRect():null,reservedBottom=br?br.top-12:base.bottom,area={...base,bottom:Math.min(base.bottom,reservedBottom)};
    for(let i=0;i<3;i++){const ps=points.map(p=>project3D(...p,27,camera,cw,ch)),px=ps.map(p=>p[0]),py=ps.map(p=>p[1]);camera.zoom=clamp(camera.zoom*Math.min(1,(area.right-area.left-64)/(Math.max(...px)-Math.min(...px)||1),(area.bottom-area.top-70)/(Math.max(...py)-Math.min(...py)||1)),.2,1.5);}
    // Place the route in the actual usable area above the journey bar.
    const [ox,oy]=getMapScreenOrigin(cw,ch);camera.panX+=(area.left+area.right-2*ox)/(2*camera.zoom);camera.panY+=(area.top+area.bottom-2*oy)/(2*camera.zoom*Math.cos(camera.pitch));
    Object.assign(state.cam,{targetZoom:camera.zoom,targetYaw:0,targetPitch:.24,targetPanX:clampPanX(camera.panX),targetPanY:clampPanY(camera.panY)});
    window.GoiVietRegionalPreview?.constrainCamera();
    requestMapRender(3);
  }
  function buttonLabel(id){return tr(trip?id!==trip.route.id?'journey.btn.wait':paused?'journey.btn.paused':trip.phase?.kind==='transfer'?'journey.btn.transfer':trip.phase?.kind==='sea'?'journey.btn.sea':'journey.btn.running':id===currentId?(N.node(id).kind==='island'?'journey.btn.atIsland':'journey.btn.atStation'):state.reducedMotion?'journey.btn.instant':'journey.btn.depart');}
  function syncProgress(){
    if(!bar)return;
    const progress=trip?clamp(trip.elapsed/trip.total,0,1):selected===currentId?1:0;
    bar.querySelector('.journey-progress-fill').style.transform='scaleX('+progress+')';
    const meter=bar.querySelector('[role=progressbar]'),value=String(Math.round(progress*100));
    if(meter.getAttribute('aria-valuenow')!==value)meter.setAttribute('aria-valuenow',value);
    syncPassing();
  }
  function syncPassing(){
    if(!bar)return;
    const ids=trip?.route.nodeIds.filter(id=>CULTURAL_PLACE_MAP[id])||[];
    const run=trip?.phase?.leg.mode==='sea'?state.seaRun:state.railRun;
    const nearest=run&&ids.length?ids.reduce((best,id)=>{const p=N.node(id).point,d=(p[0]-run.curWX)**2+(p[1]-run.curWY)**2;return d<best.d?{id,d}:best;},{id:null,d:Infinity}).id:null;
    if(bar.dataset.passingId!==(nearest||''))bar.dataset.passingId=nearest||'';
    setText(bar.querySelector('.arrival-passing'),nearest?tr('arrival.passing',{place:name(nearest)}):'');
  }
  function positionBar(){
    if(!bar||bar.hidden)return;
    const area=mapScreenArea||{left:8,right:innerWidth-8};
    const layoutKey=[innerWidth,innerHeight,area.left,area.right,bar.dataset.mode,window.GoiVietArrivalDemo?.isSheetOpen(),window.GoiVietLabelPerformance?.revision()??0].join(':');
    if(!barLayoutDirty&&barLayoutKey===layoutKey&&!barLayoutTransitions.size)return;
    barLayoutDirty=false;barLayoutKey=layoutKey;
    let top=innerHeight-20;
    for(const target of barLayoutTargets){
      const rect=target.getBoundingClientRect();
      if(rect.width>0&&rect.top>innerHeight*.5&&getComputedStyle(target).display!=='none')top=Math.min(top,rect.top);
    }
    let desired=520;
    if(bar.dataset.mode==='station'){
      const range=document.createRange();range.selectNodeContents(bar.querySelector('.journey-status'));
      const actions=bar.querySelector('.arrival-route-actions').getBoundingClientRect();
      desired=Math.ceil(range.getBoundingClientRect().width+actions.width+70);
    }
    const width=Math.max(220,Math.min(desired,area.right-area.left-20,innerWidth-20)),left=clamp((area.left+area.right-width)/2,10,innerWidth-width-10);
    const key=[Math.round(left),Math.round(innerHeight-top+8),Math.round(width)].join(':');if(bar.dataset.position===key)return;bar.dataset.position=key;bar.style.left=Math.round(left)+'px';bar.style.bottom=Math.round(innerHeight-top+8)+'px';bar.style.width=Math.round(width)+'px';requestAnimationFrame(()=>{adjustControlLayout();invalidate();requestMapRender(2);});
  }
  function invalidateBarLayout(){barLayoutDirty=true;if(active())requestMapRender(2);}
  function affectsBarLayout(target){return target===document||target===window||target instanceof Element&&barLayoutTargets.some(el=>target===el||target.contains(el));}
  function adjustControlLayout(){
    barLayoutDirty=true;
    if(!bar||bar.hidden||!mapCompass)return;
    const r=bar.getBoundingClientRect(),c=mapCompass;
    const dock=document.querySelector('#mapScene .bottom-dock')?.getBoundingClientRect();
    if(dock?.top>innerHeight*.5){const x=Math.min(dock.left,r.left)-57,y=Math.min(dock.top+21,innerHeight-66);mapCompass=x-43>Math.max(8,mapScreenArea?.left||8)?{...c,x,y}:null;return;}
    if(c.x+45<r.left||c.x-45>r.right||c.y+62<r.top||c.y-38>r.bottom)return;
    const x=r.left-58;if(x-43>Math.max(8,mapScreenArea?.left||8))mapCompass={...c,x};else mapCompass=null;
  }
  function syncControls(){
    if(!bar)return;
    const route=visibleRoute(),show=active()&&Boolean(selected||trip||arrival),had=bar.hidden;
    if(bar.hidden!==!show){bar.hidden=!show;barLayoutDirty=true;}
    clearButton.hidden=!active()||!(selected||arrival);
    for(const[id,key]of [['btnIslandHoangSa','hoang-sa'],['btnIslandTruongSa','truong-sa']]){
      const button=document.getElementById(id);if(button)button.setAttribute('aria-pressed',String(selected===key));
    }
    if(show){
      const origin=trip?.route.originId||currentId,destination=trip?.route.id||selected||arrival?.id||currentId;
      const atStation=!trip&&destination===currentId,confirmed=atStation&&arrival?.id===currentId;
      bar.dataset.mode=trip?'moving':confirmed?'station':'preview';
      setText(bar.querySelector('.journey-status'),tr(trip?'arrival.moving':confirmed?(N.node(currentId).kind==='island'?'arrival.atIsland':'arrival.at'):'arrival.ready',{place:name(currentId)}));
      // As in journey-system-5.js, the route title drops "Quần đảo" so island routes stay on one line.
      setText(bar.querySelector('.journey-origin'),name(origin).replace(/^Quần đảo /,''));
      setText(bar.querySelector('.journey-destination'),name(destination).replace(/^Quần đảo /,''));
      const estimated=(N.schedule(route||N.plan(currentId,destination),false).reduce((n,p)=>n+p.duration,0)/1000).toFixed(0);
      setText(bar.querySelector('.arrival-eta'),tr('arrival.eta',{seconds:estimated}));
      const hl=CULTURAL_PLACE_MAP[destination]?.highlights;
      setText(bar.querySelector('.arrival-route-highlights'),hl?[hl.landmark,hl.cuisine].filter(Boolean).join(' · '):'');
      // Only while travelling does the next stop differ from the destination already shown in the title.
      const caption=trip&&selected&&selected!==trip.route.id?tr('arrival.next',{place:name(selected)}):'';
      setText(bar.querySelector('.journey-caption'),caption);
      bar.querySelector('.journey-caption').hidden=!caption;
      const button=bar.querySelector('.journey-depart');
      setText(button,tr(trip?'arrival.running':'arrival.explore'));
      button.disabled=Boolean(trip);button.hidden=Boolean(confirmed);
      button.dataset.action=atStation?'explore':'depart';
      const choose=bar.querySelector('.journey-choose');
      setText(choose,tr('arrival.chooseNext'));choose.hidden=!confirmed;
      const reopen=bar.querySelector('.journey-reopen');
      setText(reopen,tr('arrival.reopen'));reopen.hidden=Boolean(trip)||arrival?.id!==currentId||Boolean(window.GoiVietArrivalDemo?.isSheetOpen())||Boolean(window.GoiVietArrivalDemo?.isArrivalPending());
      const instant=bar.querySelector('.journey-instant');
      setText(instant,tr('arrival.instant'));instant.hidden=!(trip||!atStation&&window.GoiVietArrivalDemo?.hasVisited(destination));
      bar.querySelector('.journey-progress').hidden=!trip;
      bar.querySelector('.arrival-passing').hidden=!trip;
      bar.querySelector('.arrival-eta').hidden=confirmed;
      bar.querySelector('.arrival-route-highlights').hidden=confirmed||Boolean(trip);
      // The old arrival detail never owns an entry to a play mode in this demo.
      bar.querySelector('.journey-arrival-detail').hidden=true;
    }
    syncProgress();positionBar();
    if(had!==bar.hidden){invalidate();requestAnimationFrame(()=>{syncMapControlLayout();window.GoiVietMapFrame?.syncSafeArea();positionBar();});}
  }
  function screenKey(now){const c=state.cam;return JSON.stringify([cw,ch,c.zoom,c.yaw,c.pitch,c.panX,c.panY,c.targetZoom,c.targetYaw,c.targetPitch,c.targetPanX,c.targetPanY,state.theme,getMapSelectedPlaceId(),state.hoveredItem?.id,revision,window.GoiVietRegionalPreview?.isAnimating()?Math.floor(now/50):0,...getMapScreenOrigin(cw,ch)]);}
  function renderFrame(now){
    tick(now);if(!active()){window.GoiVietJourneyVehicles?.clear();return false;}
    const key=screenKey(now),camera=state.cam,settled=Math.abs(camera.zoom-camera.targetZoom)+Math.abs(camera.pitch-camera.targetPitch)+Math.abs(camera.yaw-camera.targetYaw)+Math.abs(camera.panX-camera.targetPanX)*.01+Math.abs(camera.panY-camera.targetPanY)*.01<.00008;
    if(baseDirty===dirty&&baseKey===key&&settled&&!state.ripples.length&&!window.GoiVietLabelPerformance?.needsPaint()){reusedFrames++;window.GoiVietJourneyVehicles?.paint(now);return true;}return false;
  }
  function afterBase(now){baseFrames++;baseDirty=dirty;baseKey=screenKey(now);positionBar();window.GoiVietJourneyVehicles?.paint(now);}
  function isAnimating(){const now=performance.now();return active()&&(moving()||!state.reducedMotion&&(now-changedAt<300||now-arrivedAt<1100));}
  function explore(id=currentId){
    if(trip||id!==currentId||!CULTURAL_PLACE_MAP[id])return false;
    arrival=lastArrival?.id===id?lastArrival:{id,originId:null};lastArrival=arrival;
    syncControls();window.GoiVietArrivalDemo?.onArrive(id,{stationary:true});return true;
  }
  function instant(id=selected){
    if(trip){finish(performance.now(),{instant:true});return true;}
    if(!window.GoiVietArrivalDemo?.hasVisited(id))return false;
    if(!start(id))return false;
    if(trip)finish(performance.now(),{instant:true});
    return true;
  }
  function labelStatic(){
    if(!bar)return;
    bar.setAttribute('aria-label',tr('arrival.bar'));
    bar.querySelector('.journey-arrival-detail')?.setAttribute('aria-label',tr('journey.detailLabel',null,'Thông tin điểm đến'));
    bar.querySelector('.journey-arrival-close')?.setAttribute('aria-label',tr('journey.closeLabel',null,'Đóng thông tin đến ga'));
    bar.querySelector('.journey-progress')?.setAttribute('aria-label',tr('arrival.progress'));
    if(clearButton){clearButton.title=tr('journey.clearTitle',null,'Bỏ chọn và ẩn tuyến (Esc)');clearButton.setAttribute('aria-label',tr('journey.clearLabel',null,'Bỏ chọn tỉnh và ẩn tuyến'));}
    const network=document.querySelector('[data-journey-network="true"]');
    if(network)network.textContent=tr('journey.networkNote',null,network.textContent);
  }
  function mount(){
    const scene=document.getElementById('mapScene');bar=document.createElement('section');bar.className='journey-route-bar';bar.id='journeyRouteBar';bar.hidden=true;bar.setAttribute('aria-label','Hành trình di sản');
    bar.innerHTML='<div class="journey-route-main"><span class="journey-route-emblem" aria-hidden="true"><svg class="journey-emblem-train" viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="15" rx="4"/><path d="M5 10h14M9 3v7m6-7v7M8 18l-2 3m10-3 2 3M8 14h1m6 0h1"/></svg><svg class="journey-emblem-check" viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg></span><div class="journey-route-info" tabindex="-1"><div class="journey-status"></div><div class="journey-route-title"><span class="journey-origin"></span><span class="journey-route-link" aria-hidden="true"><svg viewBox="0 0 144 24" preserveAspectRatio="none"><path class="route-sleepers" d="M22 6v12m16-12v12m16-12v12m16-12v12m16-12v12m16-12v12"/><path class="route-rails" d="M12 9h104M12 15h104"/><circle cx="5" cy="12" r="3.5"/><path class="route-head" d="m119 5 13 7-13 7 3-7Z"/></svg></span><strong class="journey-destination"></strong></div><div class="arrival-eta"></div><div class="arrival-route-highlights"></div><div class="journey-caption"></div><div class="arrival-passing"></div></div><div class="arrival-route-actions"><button type="button" id="arrivalExplore" class="journey-depart"></button><button type="button" id="arrivalOpenInfo" class="journey-reopen" hidden></button><button type="button" class="journey-choose" hidden></button><button type="button" class="journey-instant" hidden></button></div></div><div class="journey-arrival-detail" hidden></div><div class="journey-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i class="journey-progress-fill"></i></div>';
    bar.querySelector('.journey-depart').addEventListener('click',event=>event.currentTarget.dataset.action==='explore'?explore(currentId):start());
    bar.querySelector('.journey-reopen').addEventListener('click',()=>window.GoiVietArrivalDemo?.openSheet(currentId));
    bar.querySelector('.journey-choose').addEventListener('click',()=>window.GoiVietArrivalDemo?.toggleList());
    bar.querySelector('.journey-instant').addEventListener('click',()=>instant());
    scene.append(bar);
    new ResizeObserver(()=>{syncMapControlLayout();invalidate();requestMapRender(2);}).observe(bar);
    clearButton=document.createElement('button');clearButton.id='btnClearJourney';clearButton.type='button';clearButton.className='dock-btn journey-clear';clearButton.hidden=true;clearButton.title='Bỏ chọn và ẩn tuyến (Esc)';clearButton.setAttribute('aria-label','Bỏ chọn tỉnh và ẩn tuyến');clearButton.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>';clearButton.onclick=()=>{clear();document.getElementById('mainCanvas').focus({preventScroll:true});};scene.querySelector('.bottom-dock').append(clearButton);
    const sources=document.getElementById('mapSourcesContent');if(sources&&!sources.querySelector('[data-journey-network]')){const note=document.createElement('p');note.dataset.journeyNetwork='true';note.textContent='Mạng ga di sản và các chặng đi là minh họa để khám phá văn hóa; không biểu thị tuyến vận tải đang khai thác.';sources.append(note);}
    new MutationObserver(syncControls).observe(document.getElementById('demoPlaceList'),{childList:true,subtree:true});
    new MutationObserver(()=>{const before=paused;tick();if(before!==paused)syncControls();if(!active())window.GoiVietJourneyVehicles?.clear();}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
    new MutationObserver(()=>{invalidate();syncControls();requestMapRender(2);}).observe(intro,{attributes:true,attributeFilter:['class']});
    barLayoutTargets.push(...[scene.querySelector('.bottom-dock'),document.querySelector('.mobile-view-switcher')].filter(Boolean));
    const layoutResize=new ResizeObserver(invalidateBarLayout);for(const target of barLayoutTargets)layoutResize.observe(target);
    for(const type of ['transitionrun','transitionend','transitioncancel'])document.addEventListener(type,event=>{
      if(!affectsBarLayout(event.target))return;
      let properties=barLayoutTransitions.get(event.target);
      if(type==='transitionrun'){if(!properties)barLayoutTransitions.set(event.target,properties=new Set());properties.add(event.propertyName);}
      else if(properties){properties.delete(event.propertyName);if(!properties.size)barLayoutTransitions.delete(event.target);}
      invalidateBarLayout();
    },true);
    window.addEventListener('scroll',event=>{if(affectsBarLayout(event.target))invalidateBarLayout();},{capture:true,passive:true});
    window.visualViewport?.addEventListener('resize',invalidateBarLayout);
    document.fonts.ready.then(invalidateBarLayout);
    document.addEventListener('visibilitychange',()=>{tick();barLayoutDirty=true;syncControls();if(!document.hidden)requestMapRender(2);});window.addEventListener('resize',()=>{invalidate();barLayoutDirty=true;positionBar();});
    window.GoiVietRasterTasks?.onUpdate(()=>{invalidate();});
    labelStatic();document.addEventListener('goiviet:langchange',()=>{labelStatic();syncControls();});
    reset();
  }
  window.GoiVietJourneyPreview=Object.freeze({ownsVehicles:true,active,select,start,instant,explore,clear,reset,focus,tick,tracks,isAnimating,isMoving:moving,shouldPaintTrain:()=>active()&&vehicle()?.mode==='rail',syncControls,invalidate,renderFrame,afterBase,adjustControlLayout,vehicle,allLayers,paintRail:()=>{},paintSea:()=>{},paintEndpoints:()=>{},
    selectedId:()=>selected,revision:()=>revision,labelObstacles:()=>{const route=visibleRoute(),boxes=(route?.legs.length?[route.start,route.end]:[N.node(currentId).point]).map(point=>{const[x,y]=project3D(...point,38,state.cam,cw,ch);return{left:x-16,right:x+16,top:y-20,bottom:y+13};});if(mapCompass)boxes.push({left:mapCompass.x-45,right:mapCompass.x+45,top:mapCompass.y-38,bottom:mapCompass.y+64});return boxes;},setObstacles:values=>{obstacles=values;},
    presentation:()=>({route:visibleRoute(),trip,plan,selected,currentId,arrivedAt,changedAt,paused,arrival}),
    inspect:()=>({selected,currentId,running:trip?.route.id||null,paused,revision,connected:N.playable,phase:trip?.phase?.kind||null,phaseProgress:trip?.progress||0,elapsed:trip?.elapsed||0,total:trip?.total||0,plan:plan&&{id:plan.id,originId:plan.originId,available:plan.available,start:plan.start,end:plan.end,nodeIds:plan.nodeIds,railLength:plan.legs.filter(l=>l.mode==='rail').reduce((s,l)=>s+l.curve.totalLen,0),seaLength:plan.legs.filter(l=>l.mode==='sea').reduce((s,l)=>s+l.curve.totalLen,0)},rail:tracks().map(l=>({role:l.role,alpha:l.alpha,length:l.curve.totalLen,points:l.curve.pts.map(p=>[p.wx,p.wy])})),sea:allLayers().filter(l=>l.leg.mode==='sea').map(l=>({role:l.role,length:l.curve.totalLen})),baseFrames,reusedFrames,animating:isAnimating()})});
  mount();
})();
