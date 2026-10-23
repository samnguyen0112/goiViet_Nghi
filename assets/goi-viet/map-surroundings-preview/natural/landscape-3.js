/* Real coastlines, reef habitats and ocean-depth colors. Preview only. */
(() => {
  'use strict';
  const C=window.GoiVietNaturalCore,intro=document.getElementById('introScreen'),active=()=>intro.classList.contains('intro-hidden')||Boolean(window.GoiVietMapPrewarm3?.preparing()),seaTiles=new Map(),reefTiles=new Map();
  let seaRasterReady=false;const pendingSea=new Map(),seaPlaceholders=new Map();
  let fine=null,finePromise=null,fineError=null,fineFallbackReady=false,offshorePaintPromise=null;
  let bathy=null,islands=null,promise=null,error=null,seaDraws=0,reefDraws=0,islandDraws=0,hitRegions=[],dialog=null,detailGroup='phu-quoc',detailFeature=-1,detailReef=-1,detailZoom=1,detailPan=[0,0],detailBase=1,detailFrames=0;
  const provinceIslandRings=new WeakMap();
  const names={'phu-quoc':'Phú Quốc','con-dao':'Côn Đảo','hoang-sa':'Hoàng Sa','truong-sa':'Trường Sa'};
  const ramp=[[0,[125,180,165]],[20,[105,169,157]],[100,[79,151,146]],[500,[53,136,137]],[1500,[41,124,131]],[3500,[35,114,125]],[6000,[31,107,120]]];
  function seaColor(value,dark){const depth=Math.max(0,-value);let i=1;while(i<ramp.length-1&&depth>ramp[i][0])i++;const a=ramp[i-1],b=ramp[i],t=C.clamp((depth-a[0])/(b[0]-a[0]));return a[1].map((v,c)=>Math.round((v*(1-t)+b[1][c]*t)*(dark?.57:1)));}
  function normalize(data){for(const group of data.groups){group.islands ||= [];group.reefs ||= [];for(const item of [...group.islands,...group.reefs]){item.rings ||= item.polygons?.[0]||[];item.bounds=Array.isArray(item.bbox)?{left:item.bbox[0],top:item.bbox[1],right:item.bbox[2],bottom:item.bbox[3]}:item.bbox||C.box(item.rings[0]);}const boxes=[...group.islands,...group.reefs].map(i=>i.bounds);group.bounds=boxes.length?{left:Math.min(...boxes.map(b=>b.left)),top:Math.min(...boxes.map(b=>b.top)),right:Math.max(...boxes.map(b=>b.right)),bottom:Math.max(...boxes.map(b=>b.bottom))}:C.box([group.center]);}return data;}
  function displayName(item){return (['hoang-sa','truong-sa'].includes(detailGroup)&&window.GoiVietIslandChart?.name(item))||(item.osmWayIds?.includes(181098592)&&item.osmWayIds?.includes(969687455)?'Phú Lâm – Đảo Đá':item.name);}
  const reefMenus=new WeakMap();
  function reefChoices(group){
    if(reefMenus.has(group))return reefMenus.get(group);
    const choices=new Map();let unnamed=0;
    group.reefs.forEach((reef,index)=>{
      if(reef.className!=='Reef footprint')return;
      const name=String(reef.name||'').trim(),hasLocalName=/^(Đảo|Đá|Bãi|Rạn)(?:\s|$)/u.test(name)&&!/^Rạn biển (Hoàng Sa|Trường Sa)$/.test(name);
      const key=hasLocalName?name:reef.osmRelationId?'relation:'+reef.osmRelationId:reef.osmWayIds?.length?'ways:'+reef.osmWayIds.join(','):'feature:'+index;
      const entry=choices.get(key);
      if(entry){const a=entry.bounds,b=reef.bounds;entry.bounds={left:Math.min(a.left,b.left),top:Math.min(a.top,b.top),right:Math.max(a.right,b.right),bottom:Math.max(a.bottom,b.bottom)};}
      else choices.set(key,{index,label:hasLocalName?name:'Vành rạn '+(++unnamed),bounds:{...reef.bounds}});
    });
    const result=[...choices.values()];reefMenus.set(group,result);return result;
  }
  function ensureFine(){
    if(finePromise)return finePromise;
    finePromise=Promise.all([C.load('islands-detail-data.js','GoiVietNaturalIslandDetail'),C.load('archipelago-detail-fallback.js','GoiVietIslandDetailFallback').catch(()=>null)]).then(async([source,fallback])=>{
      const unpack=async value=>value.dataBase64?JSON.parse(new TextDecoder().decode(await C.decode(value.dataBase64,value.compression,Uint8Array))):value;
      const data=await unpack(source);
      if(fallback){const residual=normalize(await unpack(fallback));for(const group of data.groups)group.fallbackGroup=residual.groups.find(g=>g.id===group.id);fineFallbackReady=true;}
      fine=normalize(data);drawDetail();requestMapRender(2);return true;
    }).catch(e=>{fineError=e.message;return false;});return finePromise;
  }
  function ensure(){if(promise)return promise;promise=Promise.all([C.load('bathymetry-data.js','GoiVietNaturalBathymetry').then(async data=>{bathy={...data,values:await C.decode(data.depthsBase64,data.compression)};setupSeaRaster();}),C.load('islands-data.js','GoiVietNaturalIslands').then(data=>{islands=normalize(data);for(const group of islands.groups){const old=ISLAND_MAP[group.id];if(old)old.pt=[...group.center];}}),window.GoiVietNaturalTerrainRenderer.ensure()]).then(()=>{seaTiles.clear();requestMapRender(4);mountUI();syncAttribution();return true;}).catch(e=>{error=e.message;requestMapRender(2);return false;});return promise;}
  function sampleDepth(wx,wy){
    const g=bathy.grid,center=C.sample(g,bathy.values,wx,wy);if(center===null)return null;
    let total=center*8,weight=8;
    for(const [dx,dy,w]of [[1,0,2],[-1,0,2],[0,1,2],[0,-1,2],[1,1,1],[-1,1,1],[1,-1,1],[-1,-1,1]]){
      const other=C.sample(g,bathy.values,wx+dx*g.stepX,wy+dy*g.stepY);if(other!==null){total+=other*w;weight+=w;}
    }
    return total/weight;
  }
  function setupSeaRaster(){const factory='const bathy=data,C={clamp:'+C.clamp.toString()+',sample:'+C.sample.toString()+'},ramp='+JSON.stringify(ramp)+';'+seaColor.toString()+';'+sampleDepth.toString()+';return '+seaPixels.toString();window.GoiVietRasterTasks?.define('sea',factory,{grid:bathy.grid,values:bathy.values});seaRasterReady=Boolean(window.GoiVietRasterTasks);}
  function seaPixels(args){
    const {tx,ty,dark}=args,pixels={data:args.buffer?new Uint8ClampedArray(args.buffer):new Uint8ClampedArray(100*100*4)},g=bathy.grid;
    for(let y=args.rowStart||0;y<Math.min(args.rowEnd??100,100);y++)for(let x=0;x<100;x++){
      const wx=tx*192+(x-1.5)*2,wy=ty*192+(y-1.5)*2,value=sampleDepth(wx,wy),n=(y*100+x)*4;if(value===null)continue;
      const color=seaColor(value,dark),grain=Math.sin(wx*42.7+wy*73.9)*Math.sin(wx*19.3-wy*51.2)*.35;
      pixels.data[n]=color[0]+grain;pixels.data[n+1]=color[1]+grain;pixels.data[n+2]=color[2]+grain;
      const distance=Math.min(wx-g.left,wy-g.top,g.left+(g.width-1)*g.stepX-wx,g.top+(g.height-1)*g.stepY-wy);
      pixels.data[n+3]=Math.round(255*C.clamp(distance/12));
    }
    return {width:100,height:100,buffer:pixels.data.buffer};
  }
  function seaTile(tx,ty,dark){
    const key=[tx,ty,dark].join(':');if(seaTiles.has(key)){const image=seaTiles.get(key);if(window.GoiVietRasterTasks?.managed){seaTiles.delete(key);seaTiles.set(key,image);}return image;}
    if(seaRasterReady&&(!window.GoiVietRasterTasks.inspect().failed||window.GoiVietRasterTasks.managed)){
      if(!pendingSea.has(key)){pendingSea.set(key,window.GoiVietRasterTasks.build('sea',key,{tx,ty,dark}).then(image=>{pendingSea.delete(key);seaPlaceholders.delete(key);if(window.GoiVietRasterTasks?.managed)window.GoiVietRasterTasks.cache(seaTiles,key,image,32*1024*1024);else{seaTiles.set(key,image);while(seaTiles.size>640)seaTiles.delete(seaTiles.keys().next().value);}}).catch(()=>pendingSea.delete(key)));}
      if(!seaPlaceholders.has(key)){const canvas=document.createElement('canvas');canvas.width=canvas.height=8;const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(8,8);for(let y=0;y<8;y++)for(let x=0;x<8;x++){const value=sampleDepth(tx*192-4+(x+.5)*25,ty*192-4+(y+.5)*25)??-500,color=seaColor(value,dark),n=(y*8+x)*4;pixels.data[n]=color[0];pixels.data[n+1]=color[1];pixels.data[n+2]=color[2];pixels.data[n+3]=255;}ctx.putImageData(pixels,0,0);seaPlaceholders.set(key,canvas);}if(window.GoiVietRasterTasks.managed)while(seaPlaceholders.size>128)seaPlaceholders.delete(seaPlaceholders.keys().next().value);return seaPlaceholders.get(key);
    }
    const result=seaPixels({tx,ty,dark}),image=document.createElement('canvas');image.width=result.width;image.height=result.height;
    image.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(result.buffer),result.width,result.height),0,0);
    seaTiles.set(key,image);while(seaTiles.size>640)seaTiles.delete(seaTiles.keys().next().value);return image;
  }
  function* paintSeaSteps(context,camera,w,h,dark,extent){if(!active())return false;ensure();if(!bathy)return false;extent ||= window.GoiVietRegionalPreview?.viewportWorld(camera,w,h,320);if(!extent)return false;const g=bathy.grid,project=C.projector(camera,w,h),box={left:Math.max(extent.left,g.left),top:Math.max(extent.top,g.top),right:Math.min(extent.right,g.left+(g.width-1)*g.stepX),bottom:Math.min(extent.bottom,g.top+(g.height-1)*g.stepY)};for(let ty=Math.floor(box.top/192);ty<=Math.floor(box.bottom/192);ty++)for(let tx=Math.floor(box.left/192);tx<=Math.floor(box.right/192);tx++){C.tile(context,seaTile(tx,ty,dark),{left:tx*192-4,top:ty*192-4,right:(tx+1)*192+4,bottom:(ty+1)*192+4},project,w,h);seaDraws++;yield;}return true;}
  function paintSea(...args){const steps=paintSeaSteps(...args);let result;do{result=steps.next();}while(!result.done);return result.value;}
  function reefColor(item,dark){const label=String(item.habitat||item.className||item.class_name||item.name).toLowerCase();const base=label.includes('lagoon')?[83,164,154]:label.includes('crest')?[199,216,178]:label.includes('flat')?[131,192,169]:label.includes('slope')?[64,137,139]:[120,181,159];return 'rgba('+base.map(v=>Math.round(v*(dark?.62:1))).join(',')+','+(label.includes('footprint')?.09:label.includes('crest')?.72:label.includes('lagoon')?.32:label.includes('flat')?.65:.42)+')';}
  function reefTile(group,tx,ty,density,dark){const key=[group.id,tx,ty,density,dark].join(':');if(reefTiles.has(key))return reefTiles.get(key);const image=document.createElement('canvas');image.width=image.height=64*density+4;const context=image.getContext('2d'),box={left:tx*64-2/density,top:ty*64-2/density,right:(tx+1)*64+2/density,bottom:(ty+1)*64+2/density},project=(x,y)=>[(x-box.left)*density,(y-box.top)*density,density];for(const reef of group.reefs){if(!C.overlaps(reef.bounds,box))continue;C.path(context,reef.rings,project,1);context.fillStyle=reefColor(reef,dark);context.fill('evenodd');reefDraws++;}reefTiles.set(key,image);while(reefTiles.size>150)reefTiles.delete(reefTiles.keys().next().value);return image;}
  function paintGroup(context,group,camera,w,h,dark,extent,detail=false){if(['hoang-sa','truong-sa'].includes(group.id)&&window.GoiVietArchipelagoArt){if((detail||camera.zoom>1.5)&&!offshorePaintPromise)offshorePaintPromise=window.GoiVietNaturalTerrainRenderer.ensureOffshore().then(()=>{requestMapRender(2);drawDetail();});return window.GoiVietArchipelagoArt.paint(context,group,camera,w,h,dark,extent,{detail,fine:fine?.groups.find(g=>g.id===group.id)});}const project=C.projector(camera,w,h),level=detail?2:camera.zoom>1.7?2:camera.zoom>.65?1:0;let count=0;
    if(detail){const refined=camera.zoom>12&&fine?.groups.find(g=>g.id===group.id),reefs=refined?[...group.reefs.filter(r=>r.className==='Reef footprint'),...refined.reefs]:group.reefs;for(const reef of reefs){if(extent&&!C.overlaps(reef.bounds,extent))continue;C.path(context,reef.rings,project,refined?-1:level);context.fillStyle=reefColor(reef,dark);context.save();if(refined&&reef.className==='Reef footprint')context.globalAlpha*=.333;context.fill('evenodd');context.restore();reefDraws++;}}
    else {const density=camera.zoom>1.4?3:1.5,b=extent?{left:Math.max(group.bounds.left,extent.left),top:Math.max(group.bounds.top,extent.top),right:Math.min(group.bounds.right,extent.right),bottom:Math.min(group.bounds.bottom,extent.bottom)}:group.bounds;for(let ty=Math.floor(b.top/64);ty<=Math.floor(b.bottom/64);ty++)for(let tx=Math.floor(b.left/64);tx<=Math.floor(b.right/64);tx++){const image=reefTile(group,tx,ty,density,dark),box={left:tx*64-2/density,top:ty*64-2/density,right:(tx+1)*64+2/density,bottom:(ty+1)*64+2/density};if(!window.GoiVietWebGLTerrain3?.paintIslandTile(context,image,box))C.tile(context,image,box,project,w,h);}}
    for(const item of group.islands){if(extent&&!C.overlaps(item.bounds,extent))continue;C.path(context,item.rings,project,level);context.save();context.shadowColor=dark?'rgba(8,37,47,.32)':'rgba(25,73,72,.2)';context.shadowBlur=Math.min(3,camera.zoom*1.2);context.shadowOffsetY=Math.min(2,camera.zoom*.5);context.fillStyle=dark?'#A49E74':'#DCCDA3';context.fill('evenodd');context.restore();
      const terrain=window.GoiVietNaturalTerrainRenderer,center=[(item.bounds.left+item.bounds.right)/2,(item.bounds.top+item.bounds.bottom)/2];if(terrain.material(...center,dark)&&['phu-quoc','con-dao'].includes(group.id)){context.save();C.path(context,item.rings,project,level);context.clip('evenodd');terrain.paintTop(context,item.rings[0],0,camera,w,h);context.restore();}else if(detail)terrain.paintOffshore(context,item,camera,w,h);
      C.path(context,item.rings,project,level);context.strokeStyle=dark?'rgba(221,216,167,.55)':'rgba(243,230,186,.86)';context.lineWidth=detail?1.3:Math.min(1.2,.45+camera.zoom*.2);context.stroke();
      if(camera.zoom>1.25){context.save();C.path(context,item.rings,project,level);context.strokeStyle=dark?'rgba(189,220,207,.22)':'rgba(245,249,227,.36)';context.lineWidth=Math.min(1.6,camera.zoom*.6);context.stroke();context.restore();}
      islandDraws++;count++;
    }
    return count;
  }
  // Bake the original flat island/reef artwork at native sampling density.
  // Projection stays in world space; detail-dialog rendering remains original.
  function bakeIslandTile(group,box,density,dark,zoom){
    const image=document.createElement('canvas');image.width=Math.round((box.right-box.left)*density);image.height=Math.round((box.bottom-box.top)*density);
    const context=image.getContext('2d'),scale=density/zoom,w=image.width/scale,h=image.height/scale,[ox,oy]=getMapScreenOrigin(w,h);
    const camera={yaw:0,pitch:0,zoom,panX:MAP_CENTER_X-box.left-ox/zoom,panY:MAP_CENTER_Y-box.top-oy/zoom};
    context.setTransform(scale,0,0,scale,0,0);paintGroup(context,group,camera,w,h,dark,box);return image;
  }
  function paintIslands(context,camera,w,h,dark){hitRegions=[];if(!active())return false;ensure();if(!islands)return false;const extent=window.GoiVietRegionalPreview.viewportWorld(camera,w,h,40),project=C.projector(camera,w,h);context.save();for(const group of islands.groups){if(!window.GoiVietWebGLTerrain3?.paintIslandGroup(context,group,camera,w,h,dark,extent,bakeIslandTile))paintGroup(context,group,camera,w,h,dark,extent);if(['phu-quoc','con-dao'].includes(group.id)){const p=project(...group.center);hitRegions.push({id:group.id,x:p[0],y:p[1],radius:Math.max(15,Math.min(25,8*camera.zoom))});}}context.restore();return true;}
  function hitIsland(x,y){if(!islands)return null;for(const hit of hitRegions)if(Math.hypot(x-hit.x,y-hit.y)<=hit.radius)return {type:'island',id:hit.id};return null;}
  function excludeBackgroundIsland(rings){if(!islands||!rings?.[0])return false;const b=C.box(rings[0]);if(b.right-b.left>70||b.bottom-b.top>75)return false;const area=(b.right-b.left)*(b.bottom-b.top);return islands.groups.some(g=>g.islands.some(i=>{const r=i.bounds,overlap=Math.max(0,Math.min(b.right,r.right)-Math.max(b.left,r.left))*Math.max(0,Math.min(b.bottom,r.bottom)-Math.max(b.top,r.top));return overlap>area*.2;}));}
  function excludeProvinceIsland(ring){if(!islands)return false;if(!provinceIslandRings.has(ring))provinceIslandRings.set(ring,excludeBackgroundIsland([ring]));return provinceIslandRings.get(ring);}
  function coastalWaves(context,camera,w,h,source){if(!bathy||camera.zoom<1.05)return;const project=C.projector(camera,w,h),level=camera.zoom>1.8?2:1;context.save();context.strokeStyle=state.theme==='dark'?'rgba(198,226,211,.13)':'rgba(238,245,219,.26)';context.lineWidth=Math.min(2.2,camera.zoom*.85);context.lineJoin='round';context.beginPath();for(const line of source.coastlines){if(excludeBackgroundIsland([line]))continue;const points=C.simplified(line,level);if(!points.length)continue;const b=C.box(points),extent=window.GoiVietRegionalPreview.viewportWorld(camera,w,h,320);if(extent&&!C.overlaps(b,extent))continue;points.forEach((p,i)=>{const q=project(...p);if(i)context.lineTo(q[0],q[1]);else context.moveTo(q[0],q[1]);});}context.stroke();context.restore();}
  function syncAttribution(){const parent=document.querySelector('#mapSourcesContent');if(!parent||parent.querySelector('[data-natural-sea]'))return;const note=document.createElement('p');note.className='island-helper-note';note.dataset.naturalSea='true';note.innerHTML='Biển và địa hình vùng nền mở rộng: <a href="https://www.gebco.net/data-products/gridded-bathymetry-data" target="_blank" rel="noopener">GEBCO 2026</a>. Đường bờ: © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors — ODbL</a>. Rạn: © 2018–2022 Allen Coral Atlas Partnership &amp; Arizona State University, <a href="https://allencoralatlas.org/methods/" target="_blank" rel="noopener">Allen Coral Atlas</a>, <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>. Màu, đường bờ và rạn đã được giản lược để minh họa.';parent.append(note);}
  function mountUI(){if(document.getElementById('naturalIslandsButton'))return;const menu=document.querySelector('#mapViewOptions .control-options');if(!menu)return;const button=document.createElement('button');button.type='button';button.id='naturalIslandsButton';button.className='dock-btn';button.textContent='Khám phá biển đảo';button.addEventListener('click',()=>{closeControlDisclosures();openDetail('phu-quoc',button);});menu.append(button);}
  function createDialog(){if(dialog)return;dialog=document.createElement('div');dialog.id='naturalIslandModal';dialog.className='modal-backdrop natural-island-modal';dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');dialog.setAttribute('aria-labelledby','naturalIslandHeading');dialog.innerHTML='<section class="modal-sheet"><header class="modal-header"><div><h2 id="naturalIslandHeading">Khám phá biển đảo</h2><p class="natural-detail-caption">Đường bờ, địa hình và rạn được minh họa từ dữ liệu địa lý.</p></div><button class="small-wood-btn" id="naturalClose" type="button" aria-label="Đóng bản đồ đảo">Đóng ×</button></header><div class="natural-detail-body"><div class="natural-island-tabs" role="group" aria-label="Chọn đảo và quần đảo">'+Object.entries(names).map(([id,name])=>'<button class="small-wood-btn" type="button" data-island="'+id+'">'+name+'</button>').join('')+'</div><div class="natural-detail-controls"><label for="naturalFeatureSelect" class="sr-only">Chọn đảo để xem gần</label><select id="naturalFeatureSelect"></select><button class="small-wood-btn" id="naturalMinus" type="button" aria-label="Thu nhỏ">−</button><button class="small-wood-btn" id="naturalPlus" type="button" aria-label="Phóng to">+</button><button class="small-wood-btn" id="naturalFit" type="button">Vừa khung</button></div><div class="natural-detail-map"><canvas id="naturalDetailCanvas" tabindex="0" aria-label="Bản đồ đảo chi tiết. Kéo để di chuyển, lăn chuột hoặc dùng nút để thu phóng."></canvas></div><div class="natural-detail-legend" aria-label="Chú giải biển đảo"><span><i class="island-swatch sand"></i>Đảo nổi / cát</span><span><i class="island-swatch reef"></i>Rạn san hô</span><span><i class="island-swatch lagoon"></i>Đầm phá</span></div><p id="naturalDetailInfo" class="natural-detail-info"></p></div></section>';document.body.append(dialog);document.getElementById('naturalClose').onclick=closeDetail;dialog.addEventListener('click',e=>{if(e.target===dialog)closeDetail();});dialog.querySelectorAll('[data-island]').forEach(b=>b.onclick=()=>switchGroup(b.dataset.island));document.getElementById('naturalFeatureSelect').onchange=e=>{const value=e.target.value;detailReef=value.startsWith('reef:')?Number(value.slice(5)):-1;detailFeature=detailReef>=0?-1:Number(value);fitDetail();};document.getElementById('naturalPlus').onclick=()=>{detailZoom=C.clamp(detailZoom*1.35,.5,160);drawDetail();};document.getElementById('naturalMinus').onclick=()=>{detailZoom=C.clamp(detailZoom/1.35,.5,160);drawDetail();};document.getElementById('naturalFit').onclick=fitDetail;
    const canvas=document.getElementById('naturalDetailCanvas'),pointers=new Map();
    const gesture=()=>{const points=[...pointers.values()];return {center:points.length>1?[(points[0][0]+points[1][0])/2,(points[0][1]+points[1][1])/2]:points[0],distance:points.length>1?Math.hypot(points[1][0]-points[0][0],points[1][1]-points[0][1]):0};};
    canvas.addEventListener('pointerdown',e=>{pointers.set(e.pointerId,[e.clientX,e.clientY]);canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});});
    canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;const before=gesture(),oldZoom=detailZoom;pointers.set(e.pointerId,[e.clientX,e.clientY]);const after=gesture();if(pointers.size>1&&before.distance>1&&after.distance>1){const r=canvas.getBoundingClientRect(),oldPoint=[before.center[0]-r.left-r.width/2,before.center[1]-r.top-r.height/2],newPoint=[after.center[0]-r.left-r.width/2,after.center[1]-r.top-r.height/2];detailZoom=C.clamp(oldZoom*after.distance/before.distance,.5,160);detailPan=detailPan.map((v,i)=>v+oldPoint[i]/oldZoom-newPoint[i]/detailZoom);}else if(before.center&&after.center){detailPan=detailPan.map((v,i)=>v-(after.center[i]-before.center[i])/detailZoom);}drawDetail();});
    for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,e=>pointers.delete(e.pointerId));
    canvas.addEventListener('wheel',e=>{e.preventDefault();const r=canvas.getBoundingClientRect(),point=[e.clientX-r.left-r.width/2,e.clientY-r.top-r.height/2],oldZoom=detailZoom;detailZoom=C.clamp(oldZoom*(e.deltaY<0?1.15:1/1.15),.5,160);detailPan=detailPan.map((v,i)=>v+point[i]*(1/oldZoom-1/detailZoom));drawDetail();},{passive:false});
    canvas.addEventListener('keydown',e=>{const deltas={ArrowLeft:[-25,0],ArrowRight:[25,0],ArrowUp:[0,-25],ArrowDown:[0,25]};if(deltas[e.key]){e.preventDefault();detailPan[0]+=deltas[e.key][0]/detailZoom;detailPan[1]+=deltas[e.key][1]/detailZoom;drawDetail();}else if(e.key==='+'||e.key==='='){e.preventDefault();detailZoom=C.clamp(detailZoom*1.2,.5,160);drawDetail();}else if(e.key==='-'){e.preventDefault();detailZoom=C.clamp(detailZoom/1.2,.5,160);drawDetail();}});new ResizeObserver(()=>{if(dialog.classList.contains('open'))drawDetail();}).observe(canvas);
    window.GoiVietIslandChart?.mount(dialog,{select(value){const select=document.getElementById('naturalFeatureSelect');select.value=value;select.dispatchEvent(new Event('change',{bubbles:true}));},navigate(point){const group=islands.groups.find(g=>g.id===detailGroup),b=group.bounds;detailPan=[C.clamp(point[0],b.left,b.right),C.clamp(point[1],b.top,b.bottom)];drawDetail();}});
  }
  function closeDetail(){if(!dialog)return;dialog.classList.remove('open');popModalFocus('naturalIslandModal');requestMapRender(2);}
  function switchGroup(id){
    const archipelago=['hoang-sa','truong-sa'].includes(id);
    if(archipelago){ensureFine();window.GoiVietNaturalTerrainRenderer.ensureOffshore().then(drawDetail);}
    detailGroup=id;detailFeature=-1;detailReef=-1;
    const group=islands.groups.find(g=>g.id===id),select=document.getElementById('naturalFeatureSelect'),chart=archipelago&&window.GoiVietIslandChart;
    const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const entries=chart?chart.catalog(group,reefChoices(group)):[...group.islands.map((item,index)=>({value:String(index),label:displayName(item),type:'land'})),...reefChoices(group).map(item=>({value:'reef:'+item.index,label:item.label,type:'reef'}))];
    select.innerHTML='<option value="-1">Toàn cảnh '+names[id]+'</option>'+[['land','Đảo và đất nổi'],['reef','Bãi và rạn']].map(([type,label])=>'<optgroup label="'+label+'">'+entries.filter(e=>e.type===type).map(e=>'<option value="'+e.value+'">'+escape(e.label)+'</option>').join('')+'</optgroup>').join('');
    dialog.querySelectorAll('[data-island]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.island===id)));
    document.getElementById('naturalIslandHeading').textContent='Khám phá '+names[id];
    dialog.querySelector('.natural-detail-caption').textContent=archipelago?'Chọn địa danh, hoặc bấm điểm định vị trên bản đồ để xem gần.':'Đường bờ, địa hình và rạn được minh họa từ dữ liệu địa lý.';
    dialog.querySelector('.natural-detail-legend').innerHTML=archipelago?'<span><i class="island-swatch sand"></i>Đất nổi theo đường bờ</span><span><i class="island-swatch reef"></i>Thềm rạn</span><span><i class="island-swatch lagoon"></i>Nước trong rạn</span><span>○ Điểm định vị</span>':'<span><i class="island-swatch sand"></i>Đảo nổi / cát</span><span><i class="island-swatch reef"></i>Rạn san hô</span><span><i class="island-swatch lagoon"></i>Đầm phá</span>';
    window.GoiVietIslandChart?.sync(group,reefChoices(group),'-1');fitDetail();
  }
  function fitDetail(){const group=islands?.groups.find(g=>g.id===detailGroup);if(!group)return;const value=detailReef>=0?'reef:'+detailReef:String(detailFeature),archipelago=['hoang-sa','truong-sa'].includes(detailGroup);window.GoiVietIslandChart?.sync(group,reefChoices(group),value);const b=(archipelago&&window.GoiVietIslandChart?.focusBounds(group,value))||(detailReef>=0?reefChoices(group).find(r=>r.index===detailReef).bounds:detailFeature>=0?group.islands[detailFeature].bounds:group.bounds),canvas=document.getElementById('naturalDetailCanvas'),r=canvas.getBoundingClientRect();detailPan=[(b.left+b.right)/2,(b.top+b.bottom)/2];detailBase=Math.min((r.width-(archipelago?50:40))/Math.max(.1,b.right-b.left),(r.height-(archipelago?55:35))/Math.max(.1,b.bottom-b.top));detailZoom=C.clamp(detailBase,.5,160);drawDetail();}
  function drawDetail(){
    if(!dialog?.classList.contains('open')||!islands)return;
    cancelAnimationFrame(detailFrames);detailFrames=requestAnimationFrame(()=>{
      detailFrames=0;const canvas=document.getElementById('naturalDetailCanvas'),r=canvas.getBoundingClientRect(),ratio=Math.min(devicePixelRatio||1,2),w=r.width,h=r.height;if(!w||!h)return;
      if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);}
      const ctx=canvas.getContext('2d');ctx.setTransform(ratio,0,0,ratio,0,0);
      const camera={yaw:0,pitch:0,zoom:detailZoom,panX:MAP_CENTER_X-detailPan[0],panY:MAP_CENTER_Y-detailPan[1]},extent={left:detailPan[0]-w/2/detailZoom,top:detailPan[1]-h/2/detailZoom,right:detailPan[0]+w/2/detailZoom,bottom:detailPan[1]+h/2/detailZoom},dark=state.theme==='dark';
      window.GoiVietRasterTasks?.setView?.(camera,w,h,dark,extent,false);
      const group=islands.groups.find(g=>g.id===detailGroup),archipelago=['hoang-sa','truong-sa'].includes(detailGroup),chart=archipelago&&window.GoiVietIslandChart;
      ctx.fillStyle=dark?'#183E43':'#318989';ctx.fillRect(0,0,w,h);paintSea(ctx,camera,w,h,dark,extent);
      if(chart)chart.before(ctx,camera,w,h,group);
      paintGroup(ctx,group,camera,w,h,dark,extent,true);
      if(chart)chart.after(ctx,group,camera,w,h,dark);
      const value=detailReef>=0?'reef:'+detailReef:String(detailFeature),entry=chart&&chart.catalog(group).find(e=>e.value===value);
      document.getElementById('naturalDetailInfo').textContent=names[detailGroup]+(entry?' · '+entry.label:detailReef>=0?' · '+reefChoices(group).find(r=>r.index===detailReef).label:detailFeature>=0?' · '+displayName(group.islands[detailFeature]):'')+(archipelago?' · Màu rạn thể hiện lớp địa mạo, không phải số đo độ sâu.':' · Kéo và thu phóng để xem gần. Hình theo dữ liệu địa lý; màu được minh họa.');
    });
  }
  function openDetail(id='phu-quoc',trigger=document.activeElement){ensure().then(ok=>{if(!ok)return;createDialog();dialog.classList.add('open');switchGroup(id);pushModalFocus('naturalIslandModal',trigger);requestMapRender(2);});}
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&dialog?.classList.contains('open')){e.preventDefault();e.stopImmediatePropagation();closeDetail();}},true);
  new MutationObserver(()=>{if(active())ensure();else closeDetail();}).observe(intro,{attributes:true,attributeFilter:['class']});
  new MutationObserver(()=>{if(dialog?.classList.contains('open'))drawDetail();}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  // Home-screen preparation: island tiles for this camera on the GPU, without drawing. A wider extent than
  // paintIslands() covers the small shift of the map centre once the map controls are laid out.
  function prepareIslands(camera,w,h,dark){ensure();if(!islands||!window.GoiVietWebGLTerrain3?.usable())return true;const extent=window.GoiVietRegionalPreview.viewportWorld(camera,w,h,160);if(!extent)return false;let ready=true;for(const group of islands.groups)if(!window.GoiVietWebGLTerrain3.prepareIslandGroup(group,camera,dark,extent,bakeIslandTile))ready=false;return ready;}
  window.GoiVietNaturalLandscape=Object.freeze({ensure,prepareIslands,paintSea,paintSeaSteps,paintIslands,hitIsland,contextTerrain:()=>bathy&&({grid:bathy.grid,values:bathy.values}),seaSample:(x,y,dark=false)=>{const value=bathy&&sampleDepth(x,y);return value===null||value===undefined?null:{value,color:seaColor(value,dark)};},excludeBackgroundIsland,excludeProvinceIsland,coastalWaves,openDetail,closeDetail,inspect:()=>({ready:!!islands&&!!bathy,error,seaCacheTiles:seaTiles.size,seaCacheBytes:[...seaTiles.values()].reduce((sum,c)=>sum+c.width*c.height*4,0),pendingSea:pendingSea.size,seaDraws,reefDraws,islandDraws,groups:islands?.groups.map(g=>({id:g.id,center:g.center,bounds:g.bounds,islands:g.islands.length,reefs:g.reefs.length})),bathyGrid:bathy?.grid,hitRegions,detailOpen:!!dialog?.classList.contains('open'),fineReady:!!fine,fineFallbackReady,fineError,detailGroup,detailFeature,detailReef,detailZoom,detailPan:[...detailPan]})});
  window.GoiVietRasterTasks?.onUpdate(()=>{if(dialog?.classList.contains('open'))drawDetail();});
  if(active())ensure();
})();
