/* Editable art around a native Canvas map. No screenshot is used as a screen layer. */
(() => {
  'use strict';
  const config = window.GoiVietMapConfig;
  const images = new Map();
  const terrainTextures = new Map();
  const mirroredTextures = new Map();
  const backdrop = document.createElement('canvas');
  backdrop.id='mapBackdropCanvas';backdrop.setAttribute('aria-hidden','true');
  let backdropKey = '', composition = { scale:1, x:0, y:0 };
  let last = { landmarks:[], rail:[], stationLabels:[], islandLabels:[], backdropFrames:0 };
  const frame = document.createElement('div');
  frame.className = 'map-art-layers'; frame.setAttribute('aria-hidden','true');
  const redraw = () => { if (typeof window.requestMapRender === 'function') window.requestMapRender(3); };
  function asset(file) {
    if (!images.has(file)) {
      const img = new Image();
      const item = { img, ready:false, failed:false };
      images.set(file,item);
      img.onload = () => { item.ready=true; backdropKey=''; redraw(); };
      img.onerror = () => { item.failed=true; redraw(); };
      img.src = config.artRoot + file;
    }
    return images.get(file);
  }
  function cropped(parent, layer) {
    const img = document.createElement('img');
    img.src = config.artRoot + layer.file; img.alt=''; img.draggable=false;
    const [x,y,w,h] = layer.source, [iw,ih] = layer.size;
    Object.assign(img.style,{ width:`${iw/w*100}%`, height:`${ih/h*100}%`, left:`${-x/w*100}%`, top:`${-y/h*100}%` });
    parent.appendChild(img); asset(layer.file);
  }
  function applyConfig() {
    const w=window.innerWidth,h=window.innerHeight;
    const scale=Math.min(w/config.design.width,h/config.design.height);
    composition={scale,x:(w-config.design.width*scale)/2,y:(h-config.design.height*scale)/2};
    const root=document.documentElement;
    root.style.setProperty('--map-unit',scale+'px');
    root.style.setProperty('--map-scale',String(scale));
    root.style.setProperty('--map-offset-x',composition.x+'px');
    root.style.setProperty('--map-offset-y',composition.y+'px');
    frame.querySelectorAll('[data-map-layer]').forEach(el => {
      const name=el.dataset.mapLayer,layer=config.layers[name];
      let x=composition.x+layer.x*scale,y=composition.y+layer.y*scale,width=layer.width*scale;
      if(w<=1080 && name==='left') { x=-50;y=h*.1;width=Math.min(w*.4,260); }
      if(w<=1080 && name==='right') { width=Math.max(w*.72,420);x=w-width;y=h-width*(layer.source[3]/layer.source[2]); }
      if(w<=1080 && name==='clouds') { width=w;x=0;y=h-38; }
      Object.assign(el.style,{left:x+'px',top:y+'px',width:width+'px',height:width*layer.source[3]/layer.source[2]+'px'});
    });
    backdropKey=''; redraw();
  }
  function init() {
    const scene=document.getElementById('mapScene');
    if(!scene) return;
    ['upperLeft','middle','left','right','clouds','crane'].forEach(name=>{
      const el=document.createElement('div');el.className='map-art-piece';el.dataset.mapLayer=name;
      cropped(el,config.layers[name]);frame.appendChild(el);
    });
    scene.insertBefore(frame,scene.firstChild);
    scene.insertBefore(backdrop,scene.firstChild);
    const brand=scene.querySelector('.brand-group');
    if(brand) {
      brand.replaceChildren();
      const crop=document.createElement('span');crop.className='map-brand-art';crop.setAttribute('aria-hidden','true');
      cropped(crop,config.layers.logo);brand.appendChild(crop);
      const label=document.createElement('span');label.className='sr-only';label.textContent='Gói Việt — về trang chủ';brand.appendChild(label);
    }
    Object.values(config.landmarks).forEach(l=>asset(l.file));
    asset(config.sailboat.file);
    Object.values(config.placeIllustrations).forEach(asset);
    Object.values(config.textures).forEach(asset);
    Object.values(config.compass).forEach(asset);
    applyConfig();
    window.addEventListener('resize',applyConfig);
  }
  function layoutArea(area,w,h) {
    if(w<=1080) return area;
    const bottom=h-38*composition.scale;
    return {...area,bottom:Math.max(area.top+80,bottom),originY:area.top+(bottom-area.top)*.47};
  }
  function overviewZoom(area,minZoom) {
    return +Math.max(minZoom,Math.min(.88,(area.right-area.left)/780*.95,(area.bottom-area.top)/935*.95)).toFixed(3);
  }
  function worldPoint(x,y,b) { return [b.minX+x*(b.maxX-b.minX),b.minY+y*(b.maxY-b.minY)]; }
  function paintPath(context,points,project,close=true) {
    context.beginPath();points.forEach((p,i)=>{const [x,y]=project(p[0],p[1],0);i?context.lineTo(x,y):context.moveTo(x,y);});
    if(close)context.closePath();
  }
  function paintOrganic(context,points,project,closed=true) {
    const p=points.map(point=>project(point[0],point[1],0));
    context.beginPath();
    if(closed) {
      const prev=p[p.length-1];context.moveTo((prev[0]+p[0][0])/2,(prev[1]+p[0][1])/2);
      p.forEach((q,i)=>{const next=p[(i+1)%p.length];context.quadraticCurveTo(q[0],q[1],(q[0]+next[0])/2,(q[1]+next[1])/2);});context.closePath();
    } else {
      context.moveTo(...p[0]);
      for(let i=1;i<p.length-1;i++)context.quadraticCurveTo(p[i][0],p[i][1],(p[i][0]+p[i+1][0])/2,(p[i][1]+p[i+1][1])/2);
      context.lineTo(...p[p.length-1]);
    }
  }
  function terrainTexture(terrain) {
    const art=asset(terrain.file);if(!art.ready)return null;
    const key=terrain.file+terrain.source.join(',');
    if(!terrainTextures.has(key)) {
      const [sx,sy,sw,sh]=terrain.source,canvas=document.createElement('canvas');canvas.width=sw;canvas.height=sh;
      const t=canvas.getContext('2d');t.drawImage(art.img,sx,sy,sw,sh,0,0,sw,sh);
      t.globalCompositeOperation='destination-in';
      const fadeX=t.createLinearGradient(0,0,sw,0);
      fadeX.addColorStop(0,'transparent');fadeX.addColorStop(.18,'#000');fadeX.addColorStop(.82,'#000');fadeX.addColorStop(1,'transparent');
      t.fillStyle=fadeX;t.fillRect(0,0,sw,sh);
      const fadeY=t.createLinearGradient(0,0,0,sh);
      fadeY.addColorStop(0,'transparent');fadeY.addColorStop(.07,'#000');fadeY.addColorStop(.9,'#000');fadeY.addColorStop(1,'transparent');
      t.fillStyle=fadeY;t.fillRect(0,0,sw,sh);terrainTextures.set(key,canvas);
    }
    return terrainTextures.get(key);
  }
  function mirroredTexture(file) {
    const item=asset(file);if(!item.ready)return null;
    if(!mirroredTextures.has(file)) {
      const w=item.img.width,h=item.img.height,t=document.createElement('canvas');t.width=w*2;t.height=h*2;
      const g=t.getContext('2d');
      for(let row=0;row<2;row++)for(let col=0;col<2;col++) {
        g.save();g.translate(col?w*2:0,row?h*2:0);g.scale(col?-1:1,row?-1:1);g.drawImage(item.img,0,0);g.restore();
      }
      mirroredTextures.set(file,t);
    }
    return mirroredTextures.get(file);
  }
  function drawBackdrop(ctx,{width,height,camera,bounds,project,dark}) {
    last.stationLabels=[];last.islandLabels=[];
    const key=[width,height,dark,camera.yaw,camera.pitch,camera.zoom,camera.panX,camera.panY].map(v=>typeof v==='number'?v.toFixed(3):v).join('|');
    if(key!==backdropKey) {
      backdrop.width=width;backdrop.height=height;
      const bg=backdrop.getContext('2d');
      const grad=bg.createRadialGradient(width*.43,height*.33,20,width*.60,height*.50,Math.max(width,height)*.70);
      const sea=dark?['#365B60','#1B4753','#12333F']:config.colors.sea;
      grad.addColorStop(0,sea[0]);grad.addColorStop(.47,sea[1]);grad.addColorStop(1,sea[2]);
      bg.fillStyle=grad;bg.fillRect(0,0,width,height);
      const seaArt=asset(config.textures.sea);
      if(seaArt.ready) {
        bg.save();bg.globalAlpha=dark?.35:1;
        bg.fillStyle=bg.createPattern(mirroredTexture(config.textures.sea),'repeat');bg.fillRect(0,0,width,height);bg.restore();
      }
      const land=config.neighborLand.map(p=>worldPoint(p[0],p[1],bounds));
      paintOrganic(bg,land,project);
      const paper=bg.createLinearGradient(0,0,width*.68,height);
      paper.addColorStop(0,dark?'#2D4037':'#FCEDCD');paper.addColorStop(1,dark?'#20362F':'#EADDBC');
      bg.fillStyle=paper;bg.fill();
      bg.strokeStyle=dark?'#59685A':'rgba(153,150,112,.24)';bg.lineWidth=1;bg.stroke();
      bg.save();bg.clip();
      const terrain=config.backgroundTerrain,terrainArt=null;
      if(terrainArt) {
        const [wx,wy,ww,wh]=terrain.world,[,,sw,sh]=terrain.source;
        const a=project(wx,wy,0),b=project(wx+ww,wy,0),c=project(wx,wy+wh,0);
        bg.save();bg.globalAlpha=dark?terrain.opacity*.6:terrain.opacity;
        bg.setTransform((b[0]-a[0])/sw,(b[1]-a[1])/sw,(c[0]-a[0])/sh,(c[1]-a[1])/sh,a[0],a[1]);
        bg.drawImage(terrainArt,0,0);bg.restore();
      }
      bg.strokeStyle=dark?'rgba(109,134,109,.12)':'rgba(88,128,103,.11)';
      for(let i=0;i<12;i++) {
        const y=260+i*40;
        paintOrganic(bg,[[-200,y],[10,y-37],[55,y-67],[105,y-11],[170,y-42],[270,y+40]],project,false);bg.stroke();
      }
      bg.restore();
      bg.fillStyle=dark?'#B9C6AC':'#938569';bg.textAlign='center';bg.textBaseline='middle';
      bg.font=`600 ${Math.max(10,18*composition.scale)}px Georgia,serif`;
      config.countryLabels.forEach(label=>{const p=worldPoint(label.x,label.y,bounds);const [x,y]=project(...p,0);bg.fillText(label.text,x,y);});
      backdropKey=key;last.backdropFrames++;
    }
    // Backdrop is its own DOM canvas. Native map/labels sit above scenic foreground art.
  }
  function decorateProvince(ctx,points,prov,dark) {
    if(points.length<3) return;
    ctx.save();ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.clip();
    const texture=asset(config.textures.terrain);
    if(texture.ready) {
      ctx.globalAlpha=dark?.22:.48;
      ctx.fillStyle=ctx.createPattern(mirroredTexture(config.textures.terrain),'repeat');
      ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
    }
    ctx.restore();
  }
  /* Liang–Barsky clipping: true if a rail segment enters an expanded landmark rectangle. */
  function segmentTouches(a,b,rect,padding=0) {
    const minX=rect.x-padding,maxX=rect.x+rect.width+padding,minY=rect.y-padding,maxY=rect.y+rect.height+padding;
    const dx=b[0]-a[0],dy=b[1]-a[1];let lo=0,hi=1;
    const pairs=[[-dx,a[0]-minX],[dx,maxX-a[0]],[-dy,a[1]-minY],[dy,maxY-a[1]]];
    for(const [p,q] of pairs) { if(p===0) { if(q<0)return false; } else { const t=q/p;if(p<0)lo=Math.max(lo,t);else hi=Math.min(hi,t);if(lo>hi)return false; } }
    return true;
  }
  function intersectsRail(rect,rails,padding) { return rails.some(line=>line.some((p,i)=>i>0&&segmentTouches(line[i-1],p,rect,padding))); }
  function drawLandmarks(ctx,{camera,project,places,rails,area,dark}) {
    const scale=composition.scale*Math.max(.5,Math.min(1.7,camera.zoom/config.design.referenceZoom));
    const lines=rails.filter(Boolean).map(curve=>curve.pts.map(p=>project(p.wx,p.wy,38).slice(0,2)));
    last.rail=lines;last.landmarks=[];
    for(const [id,item] of Object.entries(config.landmarks)) {
      const place=places[id],image=asset(item.file);if(!place||!image.ready)continue;
      const [x,y]=project(place.center[0],place.center[1],34);
      const width=item.width*scale,height=item.height*scale,margin=Math.max(24,config.railwayClearance*composition.scale);
      // Explicit placement: never hide or displace a landmark to pass clearance checks.
      // Landmarks render before rails and vehicles, keeping the train in front.
      const rect={x:x+item.dx*scale-width/2,y:y+item.dy*scale-height,width,height};
      if(rect) { ctx.save();ctx.globalAlpha=dark?.80:1;ctx.drawImage(image.img,rect.x,rect.y,width,height);ctx.restore(); }
      last.landmarks.push({id,drawn:!!rect,rect,clearance:margin,railCollision:rect?intersectsRail(rect,lines,margin):false});
    }
    const ship=asset(config.sailboat.file);
    if(ship.ready) {
      const [x,y]=project(...config.sailboat.world,0),width=config.sailboat.width*scale,height=config.sailboat.height*scale;
      ctx.save();ctx.globalAlpha=dark?.65:1;ctx.drawImage(ship.img,x-width/2,y-height,width,height);ctx.restore();
    }
  }
  function drawCompass(ctx, circle, yaw, dark, font) {
    const rim=asset(config.compass.rim),needle=asset(config.compass.needle),exact=asset(config.compass.exact||'compass-exact.png');
    const r=circle.radius;
    ctx.save();ctx.translate(circle.x,circle.y);
    if (!dark && Math.abs(yaw) < 0.005 && exact.ready) {
      ctx.drawImage(exact.img,-r,-r,r*2,r*2);
      ctx.restore();
      return;
    }
    const fill=ctx.createRadialGradient(-r*.3,-r*.3,0,0,0,r);
    fill.addColorStop(0,dark?'#364941':'#fff8e4');fill.addColorStop(1,dark?'#23362e':'#f6dfad');
    ctx.fillStyle=fill;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();
    if(rim.ready)ctx.drawImage(rim.img,-r,-r,r*2,r*2);
    ctx.save();ctx.rotate(yaw);
    if(needle.ready)ctx.drawImage(needle.img,-r*.20,-r*.44,r*.4,r*1.08);
    ctx.restore();ctx.font=font(15,700);ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle=dark?'#ffedce':'#8a1f18';
    ctx.fillText('B',0,-r*.77);
    ctx.fillStyle=dark?'#ffedce':'#9c7a52';
    ctx.fillText('T',-r*.77,0);
    ctx.fillText('Đ',r*.77,0);
    ctx.fillText('N',0,r*.78);
    ctx.restore();
  }
  function photoFor(id) { return config.placeIllustrations[id]?config.artRoot+config.placeIllustrations[id]:null; }
  function drawStationLabel(ctx,{name,role,x,y,selected,dark,font,area}) {
    const saigon=name.includes('SÀI GÒN');
    const title=saigon?'GA SÀI GÒN':name.toUpperCase();
    const subtitle=saigon?(selected&&role?'TP.HCM · '+role:'TP.HCM'):(selected?role:'');
    ctx.save();ctx.font=font(14,700);
    const titleWidth=ctx.measureText(title).width;
    ctx.font=font(12,500);
    const width=Math.max(100,titleWidth+27,subtitle?ctx.measureText(subtitle).width+24:0);
    const height=subtitle?48:35;
    const leftSide=saigon||(window.innerWidth<=1080&&title==='GA HUẾ');
    let left=leftSide?x-width-26:(selected?x+29:x+25),top=y-height/2;
    if(area)left=Math.max(area.left+3,Math.min(area.right-width-3,left));
    ctx.beginPath();ctx.roundRect(left,top,width,height,selected?22:17);
    ctx.fillStyle=selected?'#B73327':dark?'#345247':'#FFF0D4';ctx.strokeStyle=selected?'#FFE2B3':dark?'#B8A87A':'#E3C095';ctx.lineWidth=1.3;ctx.fill();ctx.stroke();
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=selected?'#FFF5E2':dark?'#FFF2D6':'#923326';
    ctx.font=font(14,700);ctx.fillText(title,left+width/2,top+(subtitle?17:18));
    if(subtitle){ctx.font=font(12,500);ctx.fillText(subtitle,left+width/2,top+34);}
    last.stationLabels.push({name,selected,rect:{x:left,y:top,width,height}});
    ctx.restore();
  }
  function drawIslandLabel(ctx,island,label,x,y,dark,font,area) {
    const arch=island.id==='hoang-sa'||island.id==='truong-sa';
    if(arch&&area)y=Math.min(y,area.bottom-58);
    ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';
    if(arch) {
      const lines=['QUẦN ĐẢO',island.id==='hoang-sa'?'HOÀNG SA':'TRƯỜNG SA'];
      const admin=island.name.match(/\(([^)]+)\)/);if(admin)lines.push('('+admin[1].toUpperCase()+')');
      ctx.fillStyle=dark?'#FFEDC6':'#FFF2DA';ctx.shadowColor='#21535C';ctx.shadowBlur=2;
      let width=0;
      lines.forEach((text,i)=>{ctx.font=font(i===2?11:14,i===2?500:600);width=Math.max(width,ctx.measureText(text).width);ctx.fillText(text,x,y+i*18);});
      last.islandLabels.push({id:island.id,rect:{x:x-width/2,y:y-10,width,height:(lines.length-1)*18+20}});
    } else {
      ctx.font=font(12,600);const width=ctx.measureText(label).width+24;
      ctx.fillStyle=dark?'#345447':'#FFF0D2';ctx.strokeStyle=dark?'#B8A774':'#D9BA83';
      ctx.beginPath();ctx.roundRect(x-width/2,y-12,width,24,12);ctx.fill();ctx.stroke();
      ctx.fillStyle=dark?'#FFF3D9':'#6A3022';ctx.fillText(label,x,y+.5);
      last.islandLabels.push({id:island.id,rect:{x:x-width/2,y:y-12,width,height:24}});
    }
    ctx.restore();
  }
  function iconMarkup(kind) {
    const file=kind==='landmark'?'landmark-hanoi.png':kind==='heritage'?'landmark-hue.png':'cuisine.png';
    return `<img class="highlight-art" src="${config.artRoot+file}" alt="" aria-hidden="true" width="37" height="30">`;
  }
  function diagnostics() {
    return {mode:'native-canvas-and-dom',referenceImageDisplayed:false,composition,assets:[...images].map(([file,item])=>({file,ready:item.ready,failed:item.failed})),layers:[...frame.querySelectorAll('[data-map-layer]')].map(el=>el.dataset.mapLayer),...last};
  }
  window.GoiVietMapScene={applyConfig,layoutArea,overviewZoom,drawBackdrop,decorateProvince,drawLandmarks,drawIslandLabel,drawStationLabel,drawCompass,photoFor,iconMarkup,diagnostics,segmentTouches};
  init();
})();
