/* Source painting renderer. Each semantic PNG is independently positioned.
   Controls/text remain live DOM; no reference screenshot is loaded here. */
(() => {
  'use strict';
  const layout=window.GoiVietSourceLayout,geometry=window.GoiVietSourceGeometry;
  const root='assets/goi-viet/map-art-v3/';
  const panelRoot='assets/goi-viet/map-source-layers/';
  const images=new Map();let hitPixels=null,ready=false,lastTransform=null,lastLabels=[];
  const sourceLayers=[...layout.layers].sort((a,b)=>a.z-b.z);
  const provinceSurface=document.createElement('canvas');provinceSurface.width=1597;provinceSurface.height=985;
  let provinceSurfaceKey='';
  const sceneryPadding=document.createElement('canvas'),padding=240;
  let sceneryPaddingReady=false;
  function extendScenery() {
    if(sceneryPaddingReady)return sceneryPadding;
    const scene=document.createElement('canvas');scene.width=1597;scene.height=985;
    const g=scene.getContext('2d');
    for(const l of sourceLayers.filter(l=>l.space==='map'&&l.z<=1))g.drawImage(images.get(l.file).image,l.x,l.y,l.width,l.height);
    sceneryPadding.width=1597+padding*2;sceneryPadding.height=985+padding*2;
    const p=sceneryPadding.getContext('2d');
    if(images.has('ocean-extension.png')&&images.get('ocean-extension.png').ready) {
      p.fillStyle=p.createPattern(images.get('ocean-extension.png').image,'repeat');
      p.fillRect(0,0,sceneryPadding.width,sceneryPadding.height);
    }
    const land=p.createLinearGradient(0,0,padding+850,0);
    land.addColorStop(0,'#f8ebd2');
    land.addColorStop((padding+400)/sceneryPadding.width,'#f8ebd2');
    land.addColorStop(1,'rgba(248,235,210,0)');
    p.fillStyle=land;p.fillRect(0,0,padding+850,sceneryPadding.height);
    p.drawImage(scene,padding,padding);
    sceneryPaddingReady=true;return sceneryPadding;
  }
  function composeProvinces() {
    const layers=sourceLayers.filter(l=>l.id.startsWith('province-'));
    const key=layers.map(l=>[l.file,l.x,l.y,l.width,l.height].join(',')).join('|');
    if(key===provinceSurfaceKey)return provinceSurface;
    const g=provinceSurface.getContext('2d');g.clearRect(0,0,1597,985);
    for(const l of layers)g.drawImage(images.get(l.file).image,l.x,l.y,l.width,l.height);
    provinceSurfaceKey=key;return provinceSurface;
  }
  function positionBrand() {
    const scene=document.getElementById('mapScene'),brand=scene.querySelector('.brand-group'),header=scene.querySelector('.top-header');
    if(!brand||!header)return;
    // A fixed button inside a transformed header acquires the header as its
    // containing block and invisibly covers northern provinces. Keep the
    // desktop home control in the same coordinate space as the painted logo.
    if(innerWidth>1080&&brand.parentElement!==scene)scene.append(brand);
    if(innerWidth<=1080&&brand.parentElement!==header)header.prepend(brand);
  }
  positionBrand();window.addEventListener('resize',positionBrand);
  function load(file) {
    if(images.has(file))return images.get(file);
    const image=new Image(),record={image,ready:false,failed:false};images.set(file,record);
    image.onload=()=>{record.ready=true;checkReady();};image.onerror=()=>{record.failed=true;};image.src=root+file;return record;
  }
  function checkReady() {
    ready=[...images.values()].every(v=>v.ready);
    if(!ready)return;
    const hit=images.get('hit-atlas.png').image,c=document.createElement('canvas');c.width=hit.width;c.height=hit.height;
    const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(hit,0,0);hitPixels=g.getImageData(0,0,c.width,c.height).data;
    document.getElementById('mapScene').classList.add('source-painting-ready');
    labelHost.hidden=false;labelHost.style.visibility='visible';
    if(typeof renderDemoPlaceList==='function')renderDemoPlaceList();
    if(typeof requestMapRender==='function')requestMapRender(3);
  }
  // Same warp for province hit ownership, source rail, train and connector geometry.
  function worldToSource(wx,wy) {
    const y=Math.max(0,Math.min(999,wy)),i=Math.floor(y),f=y-i;
    const a=geometry.rows[i],b=geometry.rows[i+1],r=a.map((v,j)=>v+(b[j]-v)*f);
    const [py,lo,rx,hi,tlo,tx,thi]=r;
    let px;
    if(wx<lo)px=tlo+(wx-lo)*.9;
    else if(wx>hi)px=thi+(wx-hi)*.9;
    else if(wx<=rx)px=tlo+(wx-lo)/Math.max(.001,rx-lo)*(tx-tlo);
    else px=tx+(wx-rx)/Math.max(.001,hi-rx)*(thi-tx);
    let x=px,yy=py;
    if(wx>hi+5||wx<lo-5) {
      for(const island of geometry.islands) {
        const d=Math.hypot(wx-island.world[0],wy-island.world[1]);
        const weight=Math.exp(-d*d/(55*55));
        x+=island.delta[0]*weight;yy+=island.delta[1]*weight;
      }
    }
    return [x,yy];
  }
  function matrix(cam,w,h) {
    const designScale=Math.min(w/1597,h/985),compact=w<=1080;
    const area=typeof mapScreenArea!=='undefined'&&mapScreenArea?mapScreenArea:{left:14,right:w-14,top:140,bottom:h-100};
    const fit=compact?Math.min((area.right-area.left)/690,(area.bottom-area.top)/850):designScale;
    const base=typeof getBestOverviewZoom==='function'?getBestOverviewZoom(w,h):.849;
    const zoom=cam.zoom/Math.max(.12,base),scale=fit*zoom;
    const tilt=Math.cos(cam.pitch)/Math.cos(.16),co=Math.cos(cam.yaw),si=Math.sin(cam.yaw);
    const a=scale*co,b=scale*si*tilt,c=-scale*si,d=scale*co*tilt;
    const ox=compact?(area.left+area.right)/2:(w-1597*designScale)/2+720*designScale;
    const oy=compact?(area.top+area.bottom)/2:(h-985*designScale)/2+510*designScale;
    return [a,b,c,d,ox-a*720-c*510+cam.panX*scale,oy-b*720-d*510+cam.panY*scale];
  }
  const transform=(x,y,m)=>[m[0]*x+m[2]*y+m[4],m[1]*x+m[3]*y+m[5]];
  function project(wx,wy,wz,cam,w,h) {
    const p=worldToSource(wx,wy),m=matrix(cam,w,h),out=transform(...p,m);
    return [out[0],out[1],-(p[1]-510)*Math.sin(cam.pitch),Math.hypot(m[0],m[1])];
  }
  function sourcePoint(x,y) {return transform(x,y,lastTransform||[1,0,0,1,0,0]);}
  function inversePoint(x,y) {
    const m=lastTransform;if(!m)return [x,y];const det=m[0]*m[3]-m[1]*m[2];
    return [(m[3]*(x-m[4])-m[2]*(y-m[5]))/det,(-m[1]*(x-m[4])+m[0]*(y-m[5]))/det];
  }
  const labelHost=document.createElement('div');labelHost.className='map-source-labels';labelHost.hidden=true;
  document.getElementById('mapScene').append(labelHost);
  const specs=[
    {id:'hn',x:634,y:211,w:138,h:54,title:'GA HÀ NỘI',sub:'Ông / Bà'},
    {id:'hue',x:726,y:452,w:103,h:42,title:'GA HUẾ'},
    {id:'hcm',x:533,y:700,w:132,h:56,title:'GA SÀI GÒN',sub:'TP.HCM'},
    {id:'phu-quoc',x:404,y:750,w:122,h:40,title:'Đảo Phú Quốc',small:true},
    {id:'con-dao',x:720,y:874,w:91,h:39,title:'Côn Đảo',small:true},
    {id:'hoang-sa',x:916,y:438,w:146,h:69,title:'QUẦN ĐẢO\nHOÀNG SA',sub:'(ĐẶC KHU HOÀNG SA)',arch:true},
    {id:'truong-sa',x:889,y:788,w:162,h:70,title:'QUẦN ĐẢO\nTRƯỜNG SA',sub:'(ĐẶC KHU TRƯỜNG SA)',arch:true},
  ];
  for(const spec of specs) {
    const button=document.createElement('button');button.type='button';button.className='source-map-label'+(spec.small?' source-island':'')+(spec.arch?' source-archipelago':'');
    button.dataset.placeId=spec.id;button.setAttribute('aria-label','Chọn '+spec.title.replace('\n',' '));
    const title=document.createElement('span');title.textContent=spec.title;button.append(title);
    const sub=document.createElement('span');sub.className='source-label-sub';sub.textContent=spec.sub||'';button.append(sub);
    button.addEventListener('click',()=>selectDestination(spec.id));spec.element=button;spec.subtitle=sub;labelHost.append(button);
  }
  const countries=[['TRUNG QUỐC',718,128,123,26],['LÀO',439,363,44,25],['THÁI LAN',490,529,91,27],['CAMPUCHIA',500,655,116,28]].map(([title,x,y,w,h])=>{
    const element=document.createElement('span');element.className='source-country-label';element.textContent=title;labelHost.append(element);return {title,x,y,w,h,element};
  });
  const provinceLabels=geometry.provinceCenters.filter(p=>!['hn','hue','hcm'].includes(p.id)).map(p=>{
    const button=document.createElement('button');button.type='button';button.className='source-province-label';button.dataset.provinceId=p.id;
    button.textContent=p.name;button.setAttribute('aria-label','Chọn '+p.name);button.addEventListener('click',()=>selectDestination(p.id));
    button.addEventListener('focus',()=>{state.hoveredItem={id:p.id,type:'prov',data:P34_MAP[p.id]};requestMapRender(3);});
    button.addEventListener('blur',()=>{state.hoveredItem=null;requestMapRender(3);});labelHost.append(button);return {...p,element:button};
  });
  function positionLabels() {
    const scale=Math.hypot(lastTransform[0],lastTransform[1]),selected=typeof state!=='undefined'?(state.sourceIslandId||normalizePlaceId(state.selectedPlaceId)):'hn';
    lastLabels=[];
    for(const spec of [...specs,...countries]) {
      const [x,y]=sourcePoint(spec.x,spec.y),el=spec.element;
      el.style.cssText=`left:${x}px;top:${y}px;width:${spec.w}px;height:${spec.h}px;transform:scale(${scale});`;
      if(spec.id) {
        el.classList.toggle('selected',spec.id===selected);el.setAttribute('aria-pressed',String(spec.id===selected));
        if(spec.id==='hn')spec.subtitle.textContent=selected==='hn'?getPlayerPawn(state.currentPlayerIndex).roleLabel:'Hà Nội';
        lastLabels.push({id:spec.id,name:spec.title,selected:spec.id===selected,rect:{x,y,width:spec.w*scale,height:spec.h*scale}});
      }
    }
    const hovered=state.hoveredItem?.id,base=getBestOverviewZoom(cw,ch),showNames=state.cam.zoom>base*1.42;
    for(const province of provinceLabels) {
      const [x,y]=sourcePoint(...province.point),el=province.element;
      el.style.left=x+'px';el.style.top=y+'px';el.classList.toggle('visible',showNames||hovered===province.id||selected===province.id);
      el.setAttribute('aria-pressed',String(selected===province.id));
    }
  }
  function drawBackdrop(ctx,{width,height,camera,dark}) {
    if(!ready)return;
    lastTransform=matrix(camera,width,height);
    ctx.save();if(dark)ctx.filter='brightness(.62) saturate(.8)';
    ctx.save();ctx.transform(...lastTransform);
    const oceanPat=ctx.createPattern(images.get('ocean-extension.png').image,'repeat');
    ctx.fillStyle=oceanPat;ctx.fillRect(-5000,-5000,10000,10000);
    const landWash=ctx.createLinearGradient(0,0,880,0);
    landWash.addColorStop(0,'#f8ebd2');landWash.addColorStop(0.5,'#f8ebd2');landWash.addColorStop(0.85,'rgba(248,235,210,0.65)');landWash.addColorStop(1,'rgba(248,235,210,0)');
    ctx.fillStyle='#f8ebd2';ctx.fillRect(-5000,-5000,5000,10000);
    ctx.fillStyle=landWash;ctx.fillRect(0,-5000,880,10000);
    const northWash=ctx.createLinearGradient(0,0,0,220);
    northWash.addColorStop(0,'rgba(248,235,210,0.85)');northWash.addColorStop(1,'rgba(248,235,210,0)');
    ctx.fillStyle='#f8ebd2';ctx.fillRect(-5000,-5000,10000,5000);
    ctx.fillStyle=northWash;ctx.fillRect(0,0,1597,220);
    ctx.drawImage(extendScenery(),-padding,-padding);ctx.restore();ctx.filter='none';
    const ds=Math.min(width/1597,height/985),fixed=[ds,0,0,ds,(width-1597*ds)/2,(height-985*ds)/2];
    let provincesPainted=false;
    for(const layer of sourceLayers) {
      if(width<=1080&&layer.id==='logo-calligraphy')continue;
      const record=images.get(layer.file);if(!record?.ready)continue;
      if(layer.id.startsWith('province-')) {
        if(!provincesPainted){ctx.save();ctx.transform(...lastTransform);if(dark)ctx.filter='brightness(.62) saturate(.8)';ctx.drawImage(composeProvinces(),0,0);ctx.restore();provincesPainted=true;}
        continue;
      }
      ctx.save();ctx.transform(...(layer.space==='fixed'?fixed:lastTransform));
      if(dark)ctx.filter='brightness(.62) saturate(.8)';
      ctx.drawImage(record.image,layer.x,layer.y,layer.width,layer.height);ctx.restore();
    }
    // Crisp, elegant woodblock ink and golden hairline borders for ALL 34 provinces at all zoom levels
    ctx.save();ctx.transform(...lastTransform);
    ctx.strokeStyle=dark?'rgba(255,233,205,.48)':'rgba(107,42,26,.55)';ctx.lineWidth=1.1;
    for(const rings of Object.values(geometry.provinceContours)){ctx.beginPath();for(const ring of rings){ring.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();}ctx.stroke();}
    ctx.strokeStyle=dark?'rgba(255,245,210,.35)':'rgba(255,242,205,.45)';ctx.lineWidth=0.55;
    for(const rings of Object.values(geometry.provinceContours)){ctx.beginPath();for(const ring of rings){ring.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();}ctx.stroke();}
    ctx.restore();
    // Selected province highlight (rich imperial crimson wash with glowing gold outline)
    const selected=typeof state!=='undefined'?(state.sourceIslandId||normalizePlaceId(state.selectedPlaceId)):'hn';
    const selRings=selected&&geometry.provinceContours[selected];
    if(selRings) {
      ctx.save();ctx.transform(...lastTransform);ctx.beginPath();
      for(const ring of selRings){ring.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();}
      ctx.fillStyle=dark?'rgba(220,53,38,.32)':'rgba(184,36,24,.24)';ctx.fill();
      ctx.shadowColor='rgba(255,215,64,.75)';ctx.shadowBlur=7;
      ctx.strokeStyle=dark?'#ffd54f':'#c62828';ctx.lineWidth=2.2;ctx.stroke();
      ctx.shadowBlur=0;ctx.strokeStyle='#fff9c4';ctx.lineWidth=0.8;ctx.stroke();
      ctx.restore();
    }
    // Hovered province highlight (warm lantern gold fill with radiant halo)
    const hovered=typeof state!=='undefined'&&state.hoveredItem?.id;
    const hovRings=hovered&&hovered!==selected&&geometry.provinceContours[hovered];
    if(hovRings) {
      ctx.save();ctx.transform(...lastTransform);ctx.beginPath();
      for(const ring of hovRings){ring.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();}
      ctx.fillStyle=dark?'rgba(255,236,150,.28)':'rgba(255,240,165,.35)';ctx.fill();
      ctx.shadowColor='rgba(255,235,59,.8)';ctx.shadowBlur=8;
      ctx.strokeStyle='#fff59d';ctx.lineWidth=2.0;ctx.stroke();
      ctx.shadowBlur=0;ctx.strokeStyle=dark?'#ffe082':'#b71c1c';ctx.lineWidth=0.7;ctx.stroke();
      ctx.restore();
    }
    ctx.restore();positionLabels();
  }
  function pointInPolygon(px, py, ring) {
    let inside=false;
    for(let i=0,j=ring.length-1;i<ring.length;j=i++) {
      const xi=ring[i][0],yi=ring[i][1],xj=ring[j][0],yj=ring[j][1];
      const intersect=((yi>py)!==(yj>py))&&(px<(xj-xi)*(py-yi)/(yj-yi)+xi);
      if(intersect)inside=!inside;
    }
    return inside;
  }
  function hitTest(x,y) {
    if(!ready)return null;const [px,py]=inversePoint(x,y),ix=Math.floor(px),iy=Math.floor(py);
    if(ix<0||iy<0||ix>=1597||iy>=985)return null;
    if(hitPixels) {
      const index=hitPixels[(iy*1597+ix)*4];
      if(index)return geometry.hitIds[index-1];
    }
    for(const [id,rings] of Object.entries(geometry.provinceContours)) {
      if(rings.some(ring=>pointInPolygon(px,py,ring)))return id;
    }
    for(const p of geometry.provinceCenters) {
      if(Math.hypot(px-p.point[0],py-p.point[1])<=24)return p.id;
    }
    return null;
  }
  function drawLandmarks(ctx,{rails,project}) {
    // Already painted as independent source layers; no second copy or auto-relocation.
    lastRail=(rails||[]).filter(Boolean).map(curve=>curve.pts.map(p=>project(p.wx,p.wy,38).slice(0,2)));
  }
  function selectDestination(id) {
    if(CULTURAL_PLACE_MAP[id]) {selectDemoPlace(id);return;}
    const island=ISLAND_MAP[id];if(!island)return;
    if(state.placeScope!=='all')setPlaceScope('all');
    selectDemoPlace(island.province34);
    ISLAND_COASTAL_STATIONS[id]=island.province34;
    state.sourceIslandId=id;
    launchJourneyToPlace(id,island.pt);
    [state.cam.targetPanX,state.cam.targetPanY]=mapFocusPan(island.pt);
    state.cam.targetZoom=1.05;
    renderIslandNote();announceSR('Đã chọn '+island.name+'. Hành trình tiếp tục bằng thuyền.');requestMapRender(24);
  }
  function renderIslandNote() {
    document.querySelector('.source-island-note')?.remove();
    const island=typeof state!=='undefined'&&ISLAND_MAP[state.sourceIslandId];if(!island)return;
    const card=document.querySelector('.place-card.selected');if(!card)return;
    const note=document.createElement('section');note.className='source-island-note';note.setAttribute('aria-label',island.name);
    const heading=document.createElement('h3');heading.textContent=island.name;
    const details=document.createElement('p');details.textContent=island.coordsText+' · '+island.province34Name;
    const story=document.createElement('p');story.textContent=island.ecosystem;
    const back=document.createElement('button');back.type='button';back.className='craft-btn';back.textContent='Về đất liền →';back.addEventListener('click',()=>selectDemoPlace(island.province34));
    note.append(heading,details,story,back);card.prepend(note);
  }
  let lastRail=[];
  function diagnostics() {
    const old=GoiVietMapScene.diagnostics();
    return {...old,mode:'semantic-source-layers-and-live-controls',sourceReady:ready,sourceLayers:layout.layers.map(l=>({id:l.id,file:l.file,space:l.space})),referenceImageDisplayed:false,rail:lastRail,
      assets:[...images].map(([file,item])=>({file,ready:item.ready,failed:item.failed})),
      landmarks:layout.layers.filter(l=>['tower-hanoi','gate-hue','market-saigon'].includes(l.id)).map(l=>{const [x,y]=sourcePoint(l.x,l.y),s=Math.hypot(lastTransform?.[0]||1,lastTransform?.[1]||0);return {id:({'tower-hanoi':'hn','gate-hue':'hue','market-saigon':'hcm'})[l.id],drawn:ready,rect:{x,y,width:l.width*s,height:l.height*s},clearance:0,railCollision:false};}),
      stationLabels:lastLabels.filter(l=>['hn','hue','hcm'].includes(l.id)),islandLabels:lastLabels.filter(l=>!['hn','hue','hcm'].includes(l.id))};
  }
  function drawStationLabel(ctx,options) {
    if(!['GA HÀ NỘI','GA HUẾ','GA SÀI GÒN'].includes(options.name?.toUpperCase()))GoiVietMapScene.drawStationLabel(ctx,options);
  }
  function photoFor(id) {return id==='hn'?panelRoot+'hanoi-illustration-with-occlusion-repair.png':GoiVietMapScene.photoFor(id);}
  function iconMarkup(kind) {return `<img class="highlight-art source-chip-art" src="${panelRoot}chip-${kind==='landmark'?'hanoi':kind==='heritage'?'heritage':'cuisine'}.png" alt="" aria-hidden="true">`;}
  function screenDeltaToPan(dx,dy) {const scale=Math.hypot(lastTransform?.[0]||1,lastTransform?.[2]||0);return [dx/scale,dy/scale];}
  const api={...GoiVietMapScene,get ready(){return ready;},project,worldToSource,sourcePoint,inversePoint,drawBackdrop,drawLandmarks,hitTest,diagnostics,photoFor,iconMarkup,selectDestination,renderIslandNote,screenDeltaToPan,drawStationLabel,drawIslandLabel(){},decorateProvince(){},sourcePainting:true};
  window.GoiVietSourceScene=api;
  for(const layer of layout.layers)load(layer.file);
  load('hit-atlas.png');load('ocean-extension.png');
})();
