/* Preview-5 copy of island-chart.js (P5-03 slice 2): interface text follows the VI/EN choice (GoiVietI18n). Map names follow it too (slice 3).
   Other pages keep island-chart.js. */
/* Readable geographic chart tools. Shapes stay in their original coordinates. */
(() => {
  'use strict';
  const T = (key, fallback, vars) => { const I = window.GoiVietI18n; if (!I) return fallback; const value = I.t(key, vars); return value === key ? fallback : value; };
  const G = text => (window.GoiVietContent ? window.GoiVietContent.geo(text) : text);

  const C=window.GoiVietNaturalCore,archipelagos=new Set(['hoang-sa','truong-sa']),catalogs=new WeakMap();
  const overrides=[
    {way:14235185,name:'Đảo Linh Côn',reference:[112.7297,16.6667]},
    {way:537200587,name:'Đá Xu Bi',reference:[114.0847,10.9236]},
    {way:1315977536,name:'Đá Xu Bi',reference:[114.0847,10.9236]}
  ];
  let dialog,sidebar,list,search,count,minimap,hud,callbacks,current=null,selection='-1',lastTargets=[],lastLabels=[],lastCamera=null,miniTransform=null;
  const text=value=>String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/đ/g,'d');
  const center=b=>[(b.left+b.right)/2,(b.top+b.bottom)/2];
  const union=(a,b)=>({left:Math.min(a.left,b.left),top:Math.min(a.top,b.top),right:Math.max(a.right,b.right),bottom:Math.max(a.bottom,b.bottom)});
  function coordinate(point){return (23.8-point[1]/62.5).toFixed(3)+T('chart.lat','°B')+' · '+(101.5+point[0]/60).toFixed(3)+T('chart.lon','°Đ');}
  function name(item){
    const corrected=overrides.find(o=>item.osmWayIds?.includes(o.way));
    if(corrected)return corrected.name;
    if(item.osmWayIds?.includes(181098592)&&item.osmWayIds?.includes(969687455))return 'Phú Lâm – Đảo Đá';
    if(!item.name||/^Đảo nhỏ /u.test(item.name))return 'Đất nổi · '+coordinate(center(item.bounds));
    return item.name.normalize('NFC');
  }
  function catalog(group,reefs=[]){
    if(catalogs.has(group)&&(!reefs.length||catalogs.get(group).some(e=>e.type==='reef')))return catalogs.get(group);
    const entries=[],named=new Map();
    group.islands.forEach((item,index)=>{
      const label=name(item),known=!label.startsWith('Đất nổi ·'),point=center(item.bounds),previous=known&&named.get(label);
      // One destination can contain several sourced pieces of land. Group only
      // nearby pieces sharing the same name; never join or enlarge their shapes.
      if(previous&&Math.hypot(point[0]-previous.point[0],point[1]-previous.point[1])<2){previous.bounds=union(previous.bounds,item.bounds);previous.members.push(index);return;}
      const entry={value:String(index),index,label,known,type:'land',bounds:{...item.bounds},point,members:[index]};
      entries.push(entry);if(known)named.set(label,entry);
    });
    for(const reef of reefs){
      const raw=group.reefs[reef.index],corrected=overrides.find(o=>raw.osmWayIds?.includes(o.way));
      const label=corrected?'Rạn '+corrected.name.replace(/^(Đảo|Đá)\s+/u,''):/^Vành rạn \d+$/u.test(reef.label)?'Rạn · '+coordinate(center(reef.bounds)):reef.label;
      entries.push({value:'reef:'+reef.index,index:reef.index,label,known:!label.startsWith('Rạn ·'),type:'reef',bounds:reef.bounds,point:center(reef.bounds)});
    }
    const priority=e=>/^(Phú Lâm|Đảo (Hoàng Sa|Linh Côn|Trường Sa|Song Tử Tây|Nam Yết|Sơn Ca|Ba Bình)|Đá Xu Bi)/u.test(e.label)?2:e.known?1:0;
    entries.sort((a,b)=>priority(b)-priority(a)||Number(a.type==='reef')-Number(b.type==='reef')||a.label.localeCompare(b.label,'vi'));
    catalogs.set(group,entries);return entries;
  }
  function mount(modal,actions){
    if(dialog)return;dialog=modal;callbacks=actions;
    const sources=document.getElementById('mapSourcesContent');
    if(sources&&!sources.querySelector('[data-island-chart-source]')){const note=document.createElement('p');note.dataset.islandChartSource='true';note.innerHTML='Tên <a href="https://amti.csis.org/dao-linh-con/?lang=vi" target="_blank" rel="noopener">Linh Côn</a> và <a href="https://amti.csis.org/subi-reef/" target="_blank" rel="noopener">Xu Bi</a> được đối chiếu với tọa độ và hồ sơ CSIS/AMTI. Các tên còn lại theo dữ liệu nguồn. Đường bờ OSM 2026 có thể bao gồm đất bồi đắp; lớp địa mạo rạn ACA dùng ảnh 2018–2020, nên hai lớp không cùng thời điểm.';note.dataset.i18n='src.chart.1|src.chart.2|src.chart.3';sources.append(note);window.GoiVietI18nDom?.apply(note);}
    const map=dialog.querySelector('.natural-detail-map'),layout=document.createElement('div');layout.className='island-chart-layout';map.before(layout);
    sidebar=document.createElement('details');sidebar.className='island-chart-sidebar';sidebar.open=innerWidth>720;
    sidebar.innerHTML='<summary data-i18n="chart.directory">Danh mục đảo & rạn <span class="island-chart-count"></span></summary><div class="island-chart-directory"><label for="islandChartSearch" data-i18n="chart.search">Tìm địa danh</label><input id="islandChartSearch" type="search" placeholder="Tên đảo, bãi hoặc tọa độ…" data-i18n-placeholder="chart.searchHint" autocomplete="off"><div class="island-chart-list" role="group" aria-label="Chọn địa danh trên bản đồ" data-i18n-label="chart.listLabel"></div></div>';window.GoiVietI18nDom?.apply(sidebar);
    layout.append(sidebar,map);search=sidebar.querySelector('input');list=sidebar.querySelector('.island-chart-list');count=sidebar.querySelector('.island-chart-count');search.addEventListener('input',renderList);
    hud=document.createElement('div');hud.className='island-chart-hud';hud.innerHTML='<span class="island-chart-north" aria-label="Hướng Bắc" data-i18n-label="chart.north" data-i18n="chart.northLetter">B<span>↑</span></span><span class="island-chart-scale"></span><span class="island-chart-position"></span>';
    map.append(hud);window.GoiVietI18nDom?.apply(hud);minimap=document.createElement('canvas');minimap.className='island-chart-minimap';minimap.width=280;minimap.height=204;minimap.tabIndex=0;minimap.setAttribute('role','button');const labelMinimap=()=>{minimap.setAttribute('aria-label',T('chart.minimap','Bản đồ định vị. Bấm hoặc dùng phím mũi tên để di chuyển; Enter để xem toàn quần đảo.'));minimap.title=T('chart.minimapTitle','Vị trí khung đang xem trong toàn quần đảo');};labelMinimap();map.append(minimap);
    minimap.addEventListener('click',event=>{if(!miniTransform)return;const r=minimap.getBoundingClientRect(),p=[(event.clientX-r.left)*280/r.width,(event.clientY-r.top)*204/r.height];callbacks.navigate([(p[0]-miniTransform.x)/miniTransform.scale,(p[1]-miniTransform.y)/miniTransform.scale]);});
    minimap.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();callbacks.select('-1');return;}const d={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];if(d&&current&&lastCamera){event.preventDefault();callbacks.navigate([MAP_CENTER_X-lastCamera.panX+d[0]*(current.bounds.right-current.bounds.left)/10,MAP_CENTER_Y-lastCamera.panY+d[1]*(current.bounds.bottom-current.bounds.top)/10]);}});
    const overview=document.createElement('button');overview.type='button';overview.id='naturalOverview';overview.className='small-wood-btn';overview.textContent=T('chart.overview','Toàn quần đảo');document.addEventListener('goiviet:langchange',()=>{labelMinimap();overview.textContent=T('chart.overview','Toàn quần đảo');renderList();});overview.onclick=()=>callbacks.select('-1');dialog.querySelector('.natural-detail-controls').append(overview);
    const canvas=document.getElementById('naturalDetailCanvas'),pointers=new Set();let start=null,multi=false;
    canvas.addEventListener('pointerdown',event=>{pointers.add(event.pointerId);if(pointers.size>1)multi=true;start=[event.clientX,event.clientY];});
    canvas.addEventListener('pointerup',event=>{const click=start&&!multi&&Math.hypot(event.clientX-start[0],event.clientY-start[1])<=5;pointers.delete(event.pointerId);if(!pointers.size){start=null;multi=false;}if(!click)return;const r=canvas.getBoundingClientRect(),x=event.clientX-r.left,y=event.clientY-r.top;const target=lastTargets.filter(t=>Math.hypot(t.x-x,t.y-y)<Math.max(12,t.radius)).sort((a,b)=>Math.hypot(a.x-x,a.y-y)-Math.hypot(b.x-x,b.y-y))[0];if(target)callbacks.select(target.value);});
    canvas.addEventListener('pointercancel',()=>{pointers.clear();start=null;multi=false;});
    let narrow=innerWidth<=720;addEventListener('resize',()=>{const next=innerWidth<=720;if(next!==narrow){narrow=next;sidebar.open=!next;}});
  }
  function renderList(){
    if(!current||!list)return;
    const query=text(search.value),items=catalog(current).filter(e=>text(e.label+' '+coordinate(e.point)).includes(query));list.replaceChildren();count.textContent=String(items.length);
    for(const item of items){const button=document.createElement('button');button.type='button';button.className='island-chart-entry';button.setAttribute('aria-pressed',String(item.value===selection));const label=document.createElement('strong');label.textContent=G(item.label);const detail=document.createElement('span');detail.textContent=(item.type==='reef'?T('chart.reef','Bãi / rạn'):T('chart.land','Đất nổi'))+' · '+coordinate(item.point);button.append(label,detail);button.onclick=()=>callbacks.select(item.value);list.append(button);}
    if(!items.length){const empty=document.createElement('p');empty.textContent=T('chart.empty','Không có địa danh khớp tìm kiếm.');list.append(empty);}
  }
  function sync(group,reefMenu,value){
    if(!dialog)return;const changed=current!==group;current=group;selection=String(value);catalog(group,reefMenu);
    const enabled=archipelagos.has(group.id);dialog.classList.toggle('island-chart-enabled',enabled);dialog.dataset.islandGroup=group.id;
    if(changed)search.value='';renderList();
  }
  function focusBounds(group,value){
    const entry=catalog(group).find(e=>e.value===String(value));if(!entry)return null;
    const b=entry.bounds,pad=entry.type==='land'?Math.max(.18,Math.min(.8,Math.max(b.right-b.left,b.bottom-b.top)*.45)):.1;
    return {left:b.left-pad,right:b.right+pad,top:b.top-pad,bottom:b.bottom+pad};
  }
  function before(context,camera,w,h,group){
    if(!archipelagos.has(group.id))return;
    const step=[.005,.01,.02,.05,.1,.25,.5,1,2,5].find(v=>v*60*camera.zoom>100)||5,project=C.projector(camera,w,h),cx=MAP_CENTER_X-camera.panX,cy=MAP_CENTER_Y-camera.panY,left=cx-w/2/camera.zoom,right=cx+w/2/camera.zoom,top=cy-h/2/camera.zoom,bottom=cy+h/2/camera.zoom;
    context.save();context.strokeStyle='rgba(226,239,221,.13)';context.lineWidth=.6;context.fillStyle='rgba(246,240,216,.74)';context.font='10px "Be Vietnam Pro",sans-serif';context.textAlign='left';
    for(let lon=Math.ceil((101.5+left/60)/step)*step;lon<=101.5+right/60;lon+=step){const x=project((lon-101.5)*60,cy)[0];context.beginPath();context.moveTo(x,0);context.lineTo(x,h);context.stroke();context.fillText(lon.toFixed(step<.1?2:1)+T('chart.lon','°Đ'),x+4,h-8);}
    for(let lat=Math.ceil((23.8-bottom/62.5)/step)*step;lat<=23.8-top/62.5;lat+=step){const y=project(cx,(23.8-lat)*62.5)[1];context.beginPath();context.moveTo(0,y);context.lineTo(w,y);context.stroke();if(y>25&&y<h-30)context.fillText(lat.toFixed(step<.1?2:1)+T('chart.lat','°B'),5,y-4);}
    context.restore();
  }
  function after(context,group,camera,w,h,dark){
    lastTargets=[];lastLabels=[];lastCamera={...camera};if(!archipelagos.has(group.id))return;
    const project=C.projector(camera,w,h),items=catalog(group),blocked=[],selected=items.find(e=>e.value===selection);
    context.save();context.textBaseline='middle';context.font='600 11px "Be Vietnam Pro",sans-serif';context.lineJoin='round';
    const candidates=items.filter(e=>e.type==='land'&&e.known||e===selected).sort((a,b)=>Number(b===selected)-Number(a===selected)||Math.max(b.bounds.right-b.bounds.left,b.bounds.bottom-b.bounds.top)-Math.max(a.bounds.right-a.bounds.left,a.bounds.bottom-a.bounds.top));
    for(const entry of items){if(entry.type!=='land'&&entry!==selected)continue;const p=project(...entry.point);if(p[0]<6||p[0]>w-6||p[1]<6||p[1]>h-6)continue;const radius=Math.max(3,Math.min(10,Math.max(entry.bounds.right-entry.bounds.left,entry.bounds.bottom-entry.bounds.top)*camera.zoom/2));lastTargets.push({value:entry.value,x:p[0],y:p[1],radius});if(radius<6||entry===selected){context.beginPath();context.arc(p[0],p[1],entry===selected?7:3,0,Math.PI*2);context.strokeStyle=entry===selected?'#ffe0a1':'#efdfb8';context.lineWidth=entry===selected?1.6:1.1;context.stroke();}}
    for(const entry of candidates){if(window.GoiVietFamilyVoyage?.suppressesLabel(entry.value))continue;const p=project(...entry.point);if(p[0]<16||p[0]>w-16||p[1]<20||p[1]>h-25)continue;const label=G(entry.label.replace(/^Đảo\s+/,''));context.font=(entry===selected?'700 12px':'600 11px')+' "Be Vietnam Pro",sans-serif';const width=context.measureText(label).width+10;let chosen=null;
      for(const [dx,dy,align]of [[13,-10,'left'],[-13,-10,'right'],[0,18,'center'],[0,-23,'center']]){const x=p[0]+dx,y=p[1]+dy,left=align==='left'?x:align==='right'?x-width:x-width/2,box={left,right:left+width,top:y-9,bottom:y+9};if(box.left<7||box.right>w-7||box.top<7||box.bottom>h-35||box.right>w-150&&box.top<120||blocked.some(b=>C.overlaps(b,box)))continue;chosen={x,y,align,box};break;}
      if(!chosen||lastLabels.length>=(camera.zoom<8?9:24)&&entry!==selected)continue;blocked.push(chosen.box);context.textAlign=chosen.align;context.strokeStyle=dark?'rgba(15,45,49,.96)':'rgba(25,70,73,.92)';context.lineWidth=3.2;context.strokeText(label,chosen.x,chosen.y);context.fillStyle=entry===selected?'#ffe1a3':'#fff2d3';context.fillText(label,chosen.x,chosen.y);lastLabels.push({value:entry.value,label,box:chosen.box});
    }
    context.restore();
    if(hud){const lat=23.8-(MAP_CENTER_Y-camera.panY)/62.5,kmPerWorld=111.32*Math.cos(lat*Math.PI/180)/60,desired=100/camera.zoom*kmPerWorld,power=10**Math.floor(Math.log10(desired)),km=[1,2,5,10].map(n=>n*power).filter(n=>n<=desired).at(-1)||power/2,pixels=km/kmPerWorld*camera.zoom;const scale=hud.querySelector('.island-chart-scale');scale.style.setProperty('--scale-width',pixels+'px');scale.textContent=(km<1?(km*1000).toFixed(0)+' m':km.toLocaleString('vi-VN',{maximumFractionDigits:1})+' km');hud.querySelector('.island-chart-position').textContent=coordinate([MAP_CENTER_X-camera.panX,MAP_CENTER_Y-camera.panY]);drawMini(group,camera,w,h);}
  }
  function drawMini(group,camera,w,h){
    const ctx=minimap.getContext('2d'),b=group.bounds,scale=Math.min(256/(b.right-b.left),180/(b.bottom-b.top)),x=140-(b.left+b.right)/2*scale,y=102-(b.top+b.bottom)/2*scale;miniTransform={x,y,scale};ctx.clearRect(0,0,280,204);ctx.fillStyle='#215b63';ctx.fillRect(0,0,280,204);ctx.strokeStyle='#74ac9c';ctx.lineWidth=1;
    for(const item of group.reefs){if(item.className!=='Reef footprint')continue;C.path(ctx,item.rings,(a,b)=>[x+a*scale,y+b*scale],0);ctx.stroke();}
    ctx.fillStyle='#f0dbac';for(const item of group.islands){const p=center(item.bounds);ctx.beginPath();ctx.arc(x+p[0]*scale,y+p[1]*scale,1.8,0,Math.PI*2);ctx.fill();}
    const cx=MAP_CENTER_X-camera.panX,cy=MAP_CENTER_Y-camera.panY,left=Math.max(2,x+(cx-w/2/camera.zoom)*scale),top=Math.max(2,y+(cy-h/2/camera.zoom)*scale),right=Math.min(278,x+(cx+w/2/camera.zoom)*scale),bottom=Math.min(202,y+(cy+h/2/camera.zoom)*scale);ctx.strokeStyle='#ffdfa0';ctx.lineWidth=2;if(right>left&&bottom>top)ctx.strokeRect(left,top,right-left,bottom-top);
  }
  window.GoiVietIslandChart=Object.freeze({mount,sync,name,catalog,focusBounds,before,after,inspect:()=>({group:current?.id,selection,labels:lastLabels,targets:lastTargets,camera:lastCamera,overrides,entries:current?catalog(current).map(e=>({value:e.value,label:e.label,type:e.type,point:e.point,bounds:e.bounds})):[]})});
})();
