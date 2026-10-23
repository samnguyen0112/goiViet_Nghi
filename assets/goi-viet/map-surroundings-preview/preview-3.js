/* Regional landscape experiment: all integration hooks live in the cloned HTML.
   Existing world geometry, journey data and shared assets are read-only. */
(() => {
  'use strict';
  const intro = document.getElementById('introScreen');
  const scene = document.getElementById('mapScene');
  const scriptURL = document.currentScript.src;
  const active = () => Boolean(intro?.classList.contains('intro-hidden'));
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
  const hash = (x, y) => {const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n);};
  const boundsObject = value => Array.isArray(value) ? {left:value[0],top:value[1],right:value[2],bottom:value[3]} : value;
  const geometry = () => window.GoiVietRegionalGeometry;
  const host = document.createElement('div');
  host.className = 'regional-background';host.setAttribute('aria-hidden', 'true');host.inert = true;host.hidden = true;
  let background = document.createElement('canvas');background.id = 'regionalLandSeaCanvas';
  const waveCanvas = document.createElement('canvas');waveCanvas.id = 'regionalWavesCanvas';
  const labelCanvas = document.createElement('canvas');labelCanvas.id = 'regionalContextLabelsCanvas';
  host.append(background, waveCanvas, labelCanvas);scene.prepend(host);
  let back = background.getContext('2d');const waves = waveCanvas.getContext('2d');const labels = labelCanvas.getContext('2d');
  const images = new Map();
  const worldBoxes = new WeakMap(),polygonAreas=new WeakMap();
  const minimumValues = new Map();
  const simplified = new WeakMap();
  let detailLevel = 2, projectionPoints = 0;
  let lastKey = '', lastWaveKey = '', lastWater = null, lastLand = null;
  let lastLabelKey='', cachedCamera=null, cachedHomography=null, bufferToScreen=null, screenToBuffer=null, rasterGuard=0;
  let cachedViewport=null;
  let countryLabels = [], objectBoxes = [], islandLabels = [], minimumKey = '', minimumValue = .12;
  let waveMotion = false, pinchAnchor = null, waveCheckbox = null, mounted = false;
  let geometryLoading = false, geometryError = false;
  let backdropDraws = 0, waveDraws = 0, waveCount = 0, cameraConstraints = 0;
  let rasterDirty=false,lastRasterRefine=0,rasterRefineTimer=0;
  const targetCamera = () => ({...state.cam, zoom:state.cam.targetZoom, yaw:state.cam.targetYaw, pitch:state.cam.targetPitch, panX:state.cam.targetPanX, panY:state.cam.targetPanY});
  const mapOrigin = () => getMapScreenOrigin(cw, ch);
  function ensureGeometry() {
    if(geometry()||geometryLoading||geometryError)return;
    geometryLoading=true;const script=document.createElement('script');script.src=new URL('regional-geometry.js?v=seamless-20261015',scriptURL).href;
    script.onload=()=>{geometryLoading=false;lastKey='';lastWaveKey='';minimumValues.clear();if(active()){syncHeaderOffset();constrainCamera();requestMapRender(3);}};
    script.onerror=()=>{geometryLoading=false;geometryError=true;};document.head.append(script);
  }
  function inverse(x, y, camera, z = 0) {
    // Exact inverse of the existing perspective projection at a known plane.
    const [ox, oy] = mapOrigin(), co = Math.cos(camera.yaw), si = Math.sin(camera.yaw);
    const cp = Math.cos(camera.pitch), sp = Math.sin(camera.pitch), fov = 2400;
    const v = (y - oy) / camera.zoom;
    const denominator = fov * cp + .52 * v * sp;
    if (denominator <= 1) return null;
    const ry = (v * (fov - .52 * z * cp) + fov * z * sp) / denominator;
    const depthDenominator = fov - .52 * (ry * sp + z * cp);
    if (depthDenominator < 450) return null;
    const rx = (x - ox) / camera.zoom * depthDenominator / fov;
    return [MAP_CENTER_X - camera.panX + rx * co + ry * si, MAP_CENTER_Y - camera.panY - rx * si + ry * co];
  }
  function viewportWorld(camera, width = cw, height = ch, pad = 0) {
    const points = [[-pad,-pad],[width+pad,-pad],[width+pad,height+pad],[-pad,height+pad]].map(([x,y]) => inverse(x,y,camera));
    if (points.some(point => !point)) return null;
    return {left:Math.min(...points.map(p=>p[0])),right:Math.max(...points.map(p=>p[0])),top:Math.min(...points.map(p=>p[1])),bottom:Math.max(...points.map(p=>p[1])),points};
  }
  function minimumZoom(camera = targetCamera()) {
    const source = geometry();if (!source) return MIN_MAP_ZOOM;
    const key = [cw,ch,...mapOrigin(),camera.yaw.toFixed(3),camera.pitch.toFixed(3)].join(':');
    if (minimumValues.has(key)) return minimumValues.get(key);
    const bounds = boundsObject(source.bounds), margin = 70;
    const fits = zoom => {
      const extent = viewportWorld({...camera,zoom,panX:0,panY:0});
      return extent && extent.left >= bounds.left + margin && extent.right <= bounds.right - margin && extent.top >= bounds.top + margin && extent.bottom <= bounds.bottom - margin;
    };
    let low = MIN_MAP_ZOOM, high = 3;
    for (let i = 0; i < 18; i++) {const middle = (low + high) / 2;if (fits(middle)) high = middle;else low = middle;}
    minimumKey = key;minimumValue = high * 1.025;
    if(minimumValues.size>64)minimumValues.delete(minimumValues.keys().next().value);
    minimumValues.set(key,minimumValue);return minimumValue;
  }
  function panRanges(camera = targetCamera()) {
    const source = geometry();if (!source) return {x:[-360,360],y:[-460,460]};
    const bounds = boundsObject(source.bounds), nav = boundsObject(source.navBounds), margin = 32;
    const zero = {...camera,panX:0,panY:0,zoom:Math.max(camera.zoom,minimumZoom(camera))};
    const extent = viewportWorld(zero), area = mapScreenArea;
    const center = inverse((area.left+area.right)/2,(area.top+area.bottom)/2,zero);
    if (!extent || !center) return {x:[0,0],y:[0,0]};
    const x = [Math.max(extent.right-bounds.right+margin,center[0]-nav.right),Math.min(extent.left-bounds.left-margin,center[0]-nav.left)];
    const y = [Math.max(extent.bottom-bounds.bottom+margin,center[1]-nav.bottom),Math.min(extent.top-bounds.top-margin,center[1]-nav.top)];
    for (const range of [x,y]) if (range[0] > range[1]) range[0] = range[1] = (range[0]+range[1])/2;
    return {x,y};
  }
  function clampPan(value, axis) {
    if (!active()) return clamp(value, axis === 'x' ? -360 : -460, axis === 'x' ? 360 : 460);
    const range = panRanges()[axis];return clamp(value,...range);
  }
  function constrainCamera() {
    if (!active() || !geometry()) return;
    const camera = targetCamera(), zoom = clamp(camera.zoom,minimumZoom(camera),3);
    const ranges = panRanges({...camera,zoom});
    const x = clamp(camera.panX,...ranges.x), y = clamp(camera.panY,...ranges.y);
    if (zoom !== camera.zoom || x !== camera.panX || y !== camera.panY) cameraConstraints++;
    state.cam.targetZoom = zoom;state.cam.targetPanX = x;state.cam.targetPanY = y;
  }
  function heightAt(x,y,camera=state.cam) {
    for (let i = renderedHitProvinces.length - 1; i >= 0; i--) {
      const item = renderedHitProvinces[i];
      const id=item.prov.id;
      const z=getMapSelectedPlaceId()===id || state.hoveredItem?.id===id ? 36 : ['hn','hue','hcm'].includes(id) || state.exploredPlaceIds.includes(id) ? 24 : 16;
      if(item.prov.polyRings.some(ring=>!window.GoiVietNaturalLandscape?.excludeProvinceIsland(ring)&&pointInRing2D(x,y,projectMapRing(ring,z,camera,cw,ch))))return z;
    }
    return 0;
  }
  function zoomAt(x, y, desiredZoom, schedule=true) {
    if (state.seaRun) state.seaRun.didFocus = true;
    const before = targetCamera(), z = heightAt(x,y,before), point = inverse(x,y,before,z);
    const next = {...before,zoom:clamp(desiredZoom,minimumZoom(before),3)};
    const after = inverse(x,y,next,z);
    state.cam.targetZoom = next.zoom;
    if (point && after) {state.cam.targetPanX += after[0]-point[0];state.cam.targetPanY += after[1]-point[1];}
    constrainCamera();if(schedule)requestMapRender();
  }
  function panBy(dx,dy,x,y) {
    if (state.seaRun) state.seaRun.didFocus = true;
    const camera = targetCamera();
    const bounds=mainCanvas.getBoundingClientRect();
    x ??= (isTouchDragging ? lastTouchX : lastMouseX)-bounds.left;
    y ??= (isTouchDragging ? lastTouchY : lastMouseY)-bounds.top;
    const from = inverse(x-dx,y-dy,camera), to = inverse(x,y,camera);
    if (from && to) {state.cam.targetPanX += to[0]-from[0];state.cam.targetPanY += to[1]-from[1];}
    constrainCamera();
  }
  function beginPinch(touches) {
    if (touches.length < 2) return;
    const bounds=mainCanvas.getBoundingClientRect();
    const x=(touches[0].clientX+touches[1].clientX)/2-bounds.left,y=(touches[0].clientY+touches[1].clientY)/2-bounds.top;
    pinchAnchor = inverse(x,y,state.cam);
  }
  function pinch(touches, zoom) {
    if (touches.length < 2 || !pinchAnchor) return;
    if (state.seaRun) state.seaRun.didFocus = true;
    const next={...targetCamera(),zoom:clamp(zoom,minimumZoom(),3)};
    const bounds=mainCanvas.getBoundingClientRect();
    const x=(touches[0].clientX+touches[1].clientX)/2-bounds.left,y=(touches[0].clientY+touches[1].clientY)/2-bounds.top,point=inverse(x,y,next);
    state.cam.targetZoom=next.zoom;
    if(point){state.cam.targetPanX+=point[0]-pinchAnchor[0];state.cam.targetPanY+=point[1]-pinchAnchor[1];}
    constrainCamera();
  }
  function sizeCanvas(canvas, context, width, height, pad=0) {
    const ratio=window.GoiVietPixelBudget?.ratio(canvas===waveCanvas?'waves':'labels',width,height,pad) ?? (pad?backdropRatio(width,height,pad):Math.min(window.devicePixelRatio||1,2));
    const w=width+2*pad,h=height+2*pad;
    if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){
      canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);canvas.style.width=w+'px';canvas.style.height=h+'px';
      context.setTransform(ratio,0,0,ratio,pad*ratio,pad*ratio);
      if(window.GoiVietPixelBudget){if(canvas===waveCanvas)lastWaveKey='';else lastLabelKey='';}
      else {lastKey='';lastWaveKey='';lastLabelKey='';cachedCamera=null;}
    }
  }
  function multiply(a,b){const c=[];for(let r=0;r<3;r++)for(let col=0;col<3;col++)c[r*3+col]=a[r*3]*b[col]+a[r*3+1]*b[col+3]+a[r*3+2]*b[col+6];return c;}
  function invertMatrix(m){const[a,b,c,d,e,f,g,h,i]=m,A=e*i-f*h,B=f*g-d*i,C=d*h-e*g,det=a*A+b*B+c*C;if(Math.abs(det)<1e-12)return null;return[A,(c*h-b*i),(b*f-c*e),B,(a*i-c*g),(c*d-a*f),C,(b*g-a*h),(a*e-b*d)].map(v=>v/det);}
  function matrixPoint(m,x,y){const divisor=m[6]*x+m[7]*y+m[8];return[(m[0]*x+m[1]*y+m[2])/divisor,(m[3]*x+m[4]*y+m[5])/divisor];}
  function homography(camera,width,height){
    const co=Math.cos(camera.yaw),si=Math.sin(camera.yaw),cp=Math.cos(camera.pitch),sp=Math.sin(camera.pitch),[ox,oy]=getMapScreenOrigin(width,height),fov=2400;
    const tx=camera.panX-MAP_CENTER_X,ty=camera.panY-MAP_CENTER_Y,dx=-.52*sp*si,dy=-.52*sp*co,constant=fov-.52*sp*(tx*si+ty*co),z=camera.zoom*fov;
    return[ox*dx+z*co,ox*dy-z*si,ox*constant+z*(tx*co-ty*si),oy*dx+z*cp*si,oy*dy+z*cp*co,oy*constant+z*cp*(tx*si+ty*co),dx,dy,constant];
  }
  function cssMatrix(h){const m=h.map(v=>v/h[8]);return 'matrix3d('+[m[0],m[3],0,m[6],m[1],m[4],0,m[7],0,0,1,0,m[2],m[5],0,m[8]].join(',')+')';}
  function applyRasterTransform(camera,width,height){
    if(!cachedHomography)return false;
    const source=window.GoiVietPixelBudget&&cachedViewport||{width,height,pad:rasterGuard};
    const shift=[1,0,-source.pad,0,1,-source.pad,0,0,1];
    bufferToScreen=multiply(multiply(homography(camera,width,height),invertMatrix(cachedHomography)),shift);screenToBuffer=invertMatrix(bufferToScreen);
    const css=cssMatrix(bufferToScreen);
    if(background.style.transform!==css){background.style.transform=css;waveCanvas.style.transform=css;}
    return [[0,0],[width,0],[width,height],[0,height]].every(([x,y])=>{const p=matrixPoint(screenToBuffer,x,y);return p[0]>=24&&p[1]>=24&&p[0]<=source.width+2*source.pad-24&&p[1]<=source.height+2*source.pad-24;});
  }
  function displayLine(points, level=detailLevel) {
    if(points.length<7)return points;
    let levels=simplified.get(points);if(!levels){levels=new Map();simplified.set(points,levels);}if(levels.has(level))return levels.get(level);
    const tolerance=[.12,.28,.55,1][level],squared=tolerance*tolerance,keep=new Uint8Array(points.length);keep[0]=keep[points.length-1]=1;
    const stack=[[0,points.length-1]];
    while(stack.length){const[first,last]=stack.pop(),a=points[first],b=points[last],dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy;let maximum=squared,index=-1;
      for(let i=first+1;i<last;i++){const p=points[i],t=length?clamp(((p[0]-a[0])*dx+(p[1]-a[1])*dy)/length,0,1):0,x=p[0]-a[0]-t*dx,y=p[1]-a[1]-t*dy,d=x*x+y*y;if(d>maximum){maximum=d;index=i;}}
      if(index>=0){keep[index]=1;stack.push([first,index],[index,last]);}
    }
    const reduced=points.filter((p,i)=>keep[i]);const output=reduced.length<4&&points[0][0]===points.at(-1)[0]&&points[0][1]===points.at(-1)[1]?points:reduced;levels.set(level,output);return output;
  }
  const measureText=(context,text)=>window.GoiVietLabelPerformance?.measure(context,text)??context.measureText(text).width;
  let frameUI=null;
  function visibleUI() {
    if(frameUI)return frameUI.slice();
    if(window.GoiVietLabelPerformance){frameUI=GoiVietLabelPerformance.ui(7,true).concat(window.GoiVietHeritageFrame?.obstacles()||[]);return frameUI.slice();}
    frameUI=[...scene.querySelectorAll('.top-header,.left-helper,#stationPanel,.bottom-dock,.mobile-view-switcher,.journey-route-bar')].filter(el=>{
      const style=getComputedStyle(el);return !el.inert&&el.getAttribute('aria-hidden')!=='true'&&style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)>.1;
    }).map(el=>{const r=el.getBoundingClientRect();return {left:r.left-7,right:r.right+7,top:r.top-7,bottom:r.bottom+7};}).concat(window.GoiVietHeritageFrame?.obstacles()||[]);
    return frameUI.slice();
  }
  const overlaps = (a,b) => a.left<b.right && a.right>b.left && a.top<b.bottom && a.bottom>b.top;
  const insideScreen = (box,width,height) => box.left>=8 && box.right<=width-8 && box.top>=8 && box.bottom<=height-8;
  function rect(x,y,width,height) {return {left:x-width/2,right:x+width/2,top:y-height/2,bottom:y+height/2};}
  // Quarter-pixel sizes reuse native glyphs while the camera rotates.
  // Anchors and province labels retain their original exact geometry.
  function placeCountryLabels(context,camera,width,height,dark) {
    countryLabels=[];const blocked=visibleUI();
    const source=geometry();if(!source)return;
    for(const country of source.countries) {
      const anchor=country.label||country.anchor,p=project3D(...anchor,0,camera,width,height),size=Math.round(clamp(14*Math.sqrt(p[3]/.828),12,20)*4)/4;
      const name=country.name.toLocaleUpperCase('vi-VN');
      context.font=canvasFont(size,600,'ui');
      const labelWidth=measureText(context,name)+16,box=rect(p[0],p[1],labelWidth,size+14);
      if(!insideScreen(box,width,height)||blocked.some(b=>overlaps(box,b))||countryLabels.some(b=>overlaps(box,b.box)))continue;
      context.textAlign='center';context.textBaseline='middle';context.lineJoin='round';
      context.strokeStyle=dark?'rgba(62,79,57,.5)':'rgba(249,236,202,.65)';context.lineWidth=3;context.strokeText(name,p[0],p[1]);
      context.fillStyle=dark?'#D7D0AD':'#685D3D';context.fillText(name,p[0],p[1]);
      countryLabels.push({id:country.id,text:name,point:[p[0],p[1]],world:anchor,box,size});
    }
    const p=project3D(700,635,0,camera,width,height),size=Math.round(clamp(17*Math.sqrt(p[3]/.828),13,23)*4)/4;
    context.font=canvasFont(size,500,'ui');
    const name='BIỂN ĐÔNG',box=rect(p[0],p[1],measureText(context,name)+16,size+16);
    if(insideScreen(box,width,height)&&!blocked.some(b=>overlaps(box,b))) {
      context.textAlign='center';context.textBaseline='middle';context.fillStyle=dark?'#B9D1C5':'#E6E9CA';context.fillText(name,p[0],p[1]);
      countryLabels.push({id:'bien-dong',text:name,point:[p[0],p[1]],world:[700,635],box,size});
    }
  }
  function drawWaves(camera,width,height,dark,now,pad=rasterGuard) {
    const moving=isAnimating(),phase=moving?Math.floor(now/50):0;
    const key=lastKey+':'+phase+':'+moving;if(key===lastWaveKey)return;lastWaveKey=key;
    waves.clearRect(-pad,-pad,width+2*pad,height+2*pad);if(!lastWater)return;
    const extent=window.GoiVietPixelBudget&&cachedViewport?cachedViewport.extent:viewportWorld(camera,width,height,pad);if(!extent)return;
    const wavePoint=(x,y)=>window.GoiVietPixelBudget?matrixPoint(cachedHomography,x,y):project3D(x,y,0,camera,width,height);
    waves.save();waves.clip(lastWater,'evenodd');
    const spacing=camera.zoom<.4?240:camera.zoom<.8?165:130,span=spacing*2.5;
    const path=new Path2D();waveCount=0;
    for(let gy=Math.floor(extent.top/spacing)-1;gy<=Math.ceil(extent.bottom/spacing)+1;gy++){
      for(let gx=Math.floor(extent.left/span)-1;gx<=Math.ceil(extent.right/span)+1;gx++){
        if(waveCount>900)break;
        const n=hash(gx,gy),shift=(gy%2)*span*.37;if(n<.2)continue;
        const x=gx*span+shift+span*.18*n,y=gy*spacing+(n-.5)*spacing*.38;
        const drift=moving?Math.sin(now*.00035+n*8)*2.3:0,length=span*(.30+.46*hash(gx+3,gy-1));
        const points=[[x,y+drift],[x+length*.22,y-spacing*.30+drift],[x+length*.46,y+spacing*.29+drift],[x+length*.74,y+drift],[x+length*.91,y-spacing*.08+drift],[x+length,y-spacing*.18+drift]];
        const p=points.map(([wx,wy])=>wavePoint(wx,wy));
        if(p.every(q=>q[0]<-pad-20)||p.every(q=>q[0]>width+pad+20)||p.every(q=>q[1]<-pad-20)||p.every(q=>q[1]>height+pad+20))continue;
        path.moveTo(p[0][0],p[0][1]);path.bezierCurveTo(p[1][0],p[1][1],p[2][0],p[2][1],p[3][0],p[3][1]);path.quadraticCurveTo(p[4][0],p[4][1],p[5][0],p[5][1]);
        if(n>.84){const a=wavePoint(x+length*.35,y+spacing*.34+drift),b=wavePoint(x+length*.49,y+spacing*.10+drift),c=wavePoint(x+length*.64,y+spacing*.39+drift),d=wavePoint(x+length*.82,y+spacing*.26+drift);path.moveTo(a[0],a[1]);path.bezierCurveTo(b[0],b[1],c[0],c[1],d[0],d[1]);}
        waveCount++;
      }
    }
    waves.lineCap='round';waves.lineJoin='round';waves.strokeStyle=dark?'rgba(171,211,191,.12)':'rgba(235,239,209,.17)';waves.lineWidth=clamp(camera.zoom*.65,.45,.95);waves.stroke(path);
    window.GoiVietNaturalLandscape?.coastalWaves(waves,camera,width,height,geometry());waves.restore();waveDraws++;
  }
  // A private staging canvas is filled in small tasks. The visible canvas and
  // its camera/water geometry change together, only after a complete pass.
  let stagingCanvas=null,backdropJob=null,backdropSerial=0,backdropCancels=0,backdropError=null;
  let textureRevision=0,lastBackdropAttempt=0,lastCameraChange=0,lastObservedCamera='',cachedDark=null;
  function backdropRatio(w,h,pad){return window.GoiVietPixelBudget?.ratio('backdrop',w,h,pad) ?? Math.min(window.devicePixelRatio||1,w>1080?1:1.25,Math.sqrt((4*1024*1024-4096)/((w+2*pad)*(h+2*pad))));}
  const coverageCanvas=document.createElement('canvas');coverageCanvas.id='regionalCoverageCanvas';coverageCanvas.hidden=true;host.prepend(coverageCanvas);
  // Zooming out exposes more than the detailed backdrop holds. A copy of the widest complete backdrop lies beneath it,
  // reprojected the same way, so exposed areas keep relief, rivers and sea depth instead of the flat coverage fill.
  const overviewCanvas=document.createElement('canvas');overviewCanvas.id='regionalOverviewCanvas';overviewCanvas.hidden=true;overviewCanvas.style.willChange='transform';coverageCanvas.after(overviewCanvas);
  let underlay=null;
  function keepOverview(camera,pad,key){
    if(overviewCanvas.width!==background.width||overviewCanvas.height!==background.height){overviewCanvas.width=background.width;overviewCanvas.height=background.height;}
    overviewCanvas.style.width=background.style.width;overviewCanvas.style.height=background.style.height;
    const g=overviewCanvas.getContext('2d');g.setTransform(1,0,0,1,0,0);g.drawImage(background,0,0);
    underlay={zoom:camera.zoom,homography:cachedHomography,pad,key};
  }
  function placeOverview(camera,width,height,key,needed){
    const show=Boolean(needed&&underlay?.key===key);
    if(show){const css=cssMatrix(multiply(multiply(homography(camera,width,height),invertMatrix(underlay.homography)),[1,0,-underlay.pad,0,1,-underlay.pad,0,0,1]));if(overviewCanvas.style.transform!==css)overviewCanvas.style.transform=css;}
    if(overviewCanvas.hidden===show)overviewCanvas.hidden=!show;
  }
  function cancelBackdrop(){if(backdropJob){window.GoiVietRasterTasks?.cancel('backdrop');stagingCanvas=backdropJob.canvas;backdropJob=null;backdropCancels++;}}
  function deferBackdrop(delay){
    if(rasterRefineTimer)clearTimeout(rasterRefineTimer);
    rasterRefineTimer=0;
    // A trip already owns the RAF loop. Its current backdrop and GPU coverage
    // remain valid; refining here competes with presentation on the GPU.
    if(cachedCamera&&window.GoiVietJourneyPreview?.isMoving())return;
    rasterRefineTimer=setTimeout(()=>{rasterRefineTimer=0;if(active()&&!document.hidden)requestMapRender();},Math.max(1,delay));
  }
  function projectionFor(camera,width,height){
    const [ox,oy]=getMapScreenOrigin(width,height),co=Math.cos(camera.yaw),si=Math.sin(camera.yaw),cp=Math.cos(camera.pitch),sp=Math.sin(camera.pitch);
    return(x,y)=>{const dx=x-MAP_CENTER_X+camera.panX,dy=y-MAP_CENTER_Y+camera.panY,rx=dx*co-dy*si,ry=dx*si+dy*co,scale=camera.zoom*2400/Math.max(450,2400-ry*sp*.52);return[ox+rx*scale,oy+ry*cp*scale,scale];};
  }
  function* backdropPath(polygons,job,lines=false,path=new Path2D()){
    for(const polygon of polygons){
      const rings=lines?[polygon]:(Array.isArray(polygon)?polygon:[polygon.outer,...(polygon.holes||[])]);
      const outer=rings[0];let bounds=worldBoxes.get(outer);if(!bounds){bounds=window.GoiVietNaturalCore.box(outer);worldBoxes.set(outer,bounds);}
      if(job.extent&&!overlaps(bounds,job.extent)||window.GoiVietNaturalLandscape?.excludeBackgroundIsland(rings))continue;
      if(lines&&Math.hypot(bounds.right-bounds.left,bounds.bottom-bounds.top)*job.camera.zoom<2)continue;
      if(!lines){let area=polygonAreas.get(outer);if(area===undefined){area=Math.abs(outer.reduce((sum,p,i)=>{const q=outer[(i+1)%outer.length];return sum+p[0]*q[1]-q[0]*p[1];},0))/2;polygonAreas.set(outer,area);}if(area*job.camera.zoom*job.camera.zoom<1.8)continue;}
      for(const ring of rings){const points=displayLine(ring,job.level);for(let i=0;i<points.length;i++){const p=job.project(...points[i]);if(i)path.lineTo(p[0],p[1]);else path.moveTo(p[0],p[1]);}if(!lines)path.closePath();job.points=(job.points||0)+points.length;yield;}
    }
    return path;
  }
  function* buildBackdrop(job){
    const {context:b,camera:c,width:w,height:h,dark,pad,source}=job;
    const near=job.project(300,250),far=job.project(1200,800),sea=b.createLinearGradient(near[0],near[1],far[0],far[1]);
    sea.addColorStop(0,dark?'#285650':'#74AD9B');sea.addColorStop(.34,dark?'#234E50':'#438F89');sea.addColorStop(1,dark?'#193E46':'#286F7C');b.fillStyle=sea;b.fillRect(-pad,-pad,w+2*pad,h+2*pad);yield;
    if(window.GoiVietNaturalLandscape?.paintSeaSteps)yield* window.GoiVietNaturalLandscape.paintSeaSteps(b,c,w,h,dark,job.extent);
    job.land=yield* backdropPath(source.land,job);job.water=new Path2D(job.land);job.water.rect(-pad-2,-pad-2,w+2*pad+4,h+2*pad+4);
    const shore=yield* backdropPath(source.coastlines,job,true);
    b.save();b.clip(job.water,'evenodd');b.strokeStyle=dark?'rgba(122,179,161,.05)':'rgba(188,220,191,.08)';b.lineWidth=clamp(8*c.zoom,2,15);b.lineJoin='round';b.stroke(shore);b.restore();yield;
    const a=job.project(50,0),end=job.project(220,1050),paper=b.createLinearGradient(a[0],a[1],end[0],end[1]);paper.addColorStop(0,dark?'#555A40':'#F0DFB6');paper.addColorStop(.6,dark?'#5E6044':'#E6D3A4');paper.addColorStop(1,dark?'#615E42':'#DCC99A');b.fillStyle=paper;b.fill(job.land,'evenodd');yield;
    const relief=window.GoiVietNaturalRegionalRelief;
    if(relief?.paintSteps){yield* relief.paintSteps(b,{id:'context',polygons:source.land},c,w,h,job.extent,dark,job.land);for(const country of source.countries){const path=yield* backdropPath(country.polygons,job);yield* relief.paintSteps(b,country,c,w,h,job.extent,dark,path);}}
    const exclusion=new Path2D();exclusion.rect(-pad-2,-pad-2,w+2*pad+4,h+2*pad+4);yield* backdropPath(source.vietnamOuter,job,false,exclusion);
    if(window.GoiVietHydrology?.paintSteps)yield* window.GoiVietHydrology.paintSteps(b,c,w,h,dark,0,job.land,null,exclusion);
    b.strokeStyle=dark?'rgba(209,196,135,.20)':'rgba(206,180,123,.45)';b.lineWidth=clamp(c.zoom*.95,.6,1.2);b.stroke(shore);yield;
    for(const country of source.countries){b.strokeStyle=dark?'rgba(207,192,143,.52)':'rgba(135,112,66,.66)';b.lineWidth=clamp(c.zoom*.82,.55,1.1);b.stroke(yield* backdropPath(country.borders,job,true));yield;}
    return job;
  }
  function startBackdrop(camera,width,height,dark,key){
    cancelBackdrop();lastBackdropAttempt=performance.now();backdropError=null;
    const pad=rasterGuard,ratio=backdropRatio(width,height,pad);
    const canvas=stagingCanvas||document.createElement('canvas');stagingCanvas=null;
    canvas.width=Math.round((width+2*pad)*ratio);canvas.height=Math.round((height+2*pad)*ratio);canvas.style.width=width+2*pad+'px';canvas.style.height=height+2*pad+'px';
    const context=canvas.getContext('2d');context.setTransform(ratio,0,0,ratio,pad*ratio,pad*ratio);
    const c={...camera},extent=viewportWorld(c,width,height,pad),margin=70/c.zoom;
    if(extent){extent.left-=margin;extent.right+=margin;extent.top-=margin;extent.bottom+=margin;}
    const job={id:++backdropSerial,canvas,context,camera:c,width,height,dark,pad,key,source:geometry(),extent,project:projectionFor(c,width,height),origin:mapOrigin(),revision:textureRevision,level:c.zoom>1.7?0:c.zoom>.9?1:c.zoom>.45?2:3};backdropJob=job;
    window.GoiVietRasterTasks.run('backdrop',buildBackdrop(job),(result,missing)=>{
      if(backdropJob!==job)return;
      backdropJob=null;stagingCanvas=canvas;
      if(!active()||document.hidden||(state.theme==='dark')!==dark||cw!==width||ch!==height||mapOrigin().some((v,i)=>v!==job.origin[i]))return;
      // Do not replace a complete valid backdrop with a partially loaded one.
      // On first load/outside coverage the low-detail pass is a valid fallback.
      const covered=cachedCamera&&applyRasterTransform(state.cam,width,height);
      if(missing&&covered){rasterDirty=true;deferBackdrop(180);return;}
      const old=background;canvas.id='regionalLandSeaCanvas';old.replaceWith(canvas);old.removeAttribute('id');background=canvas;back=context;stagingCanvas=old;
      cachedCamera=c;cachedViewport={width,height,pad,extent};cachedDark=dark;background.hidden=false;cachedHomography=homography(c,width,height);lastLand=job.land;lastWater=job.water;lastKey=key;lastWaveKey='';detailLevel=job.level;projectionPoints=job.points;backdropDraws++;
      rasterDirty=missing||textureRevision!==job.revision;lastRasterRefine=performance.now();applyRasterTransform(state.cam,width,height);
      if(!missing&&(underlay?.key!==key||c.zoom<=underlay.zoom))keepOverview(c,pad,key);
      coverageCanvas.hidden=true;requestMapRender();
      if(rasterDirty)deferBackdrop(180);
    },error=>{backdropJob=null;backdropError=error.message;stagingCanvas=canvas;});
  }
  let coverageMesh=null,coverageSource=null;
  function prepareCoverage(source){
    if(coverageSource===source)return;
    coverageSource=source;coverageMesh=null;
    function* build(){
      const candidates=[];
      for(const polygon of source.land){const rings=Array.isArray(polygon)?polygon:[polygon.outer,...(polygon.holes||[])],bounds=window.GoiVietNaturalCore.box(rings[0]),area=(bounds.right-bounds.left)*(bounds.bottom-bounds.top);if(area>16)candidates.push({rings,bounds,area});yield;}
      candidates.sort((a,b)=>b.area-a.area);const mesh=[];
      for(const item of candidates.slice(0,64)){const rings=[];for(const ring of item.rings){const simple=displayLine(ring,3),stride=Math.max(1,Math.ceil(simple.length/1024));rings.push(simple.filter((p,i)=>i%stride===0));yield;}mesh.push({bounds:item.bounds,rings});}
      return mesh;
    }
    window.GoiVietRasterTasks.run('coverage-mesh',build(),mesh=>{if(coverageSource===source){coverageMesh=mesh;window.GoiVietWebGLCoverage3?.prepare(coverageCanvas,mesh);if(active())requestMapRender();}});
  }
  function drawCoverage(camera,width,height,dark){
    if(window.GoiVietWebGLCoverage3?.paint(coverageCanvas,coverageMesh,camera,width,height,dark))return;
    if(coverageCanvas.hidden)coverageCanvas.hidden=false;const ratio=window.GoiVietPixelBudget?.ratio('coverage',width,height) ?? Math.min(1,Math.sqrt(2*1024*1024/(width*height)));
    if(coverageCanvas.width!==Math.round(width*ratio)||coverageCanvas.height!==Math.round(height*ratio)){coverageCanvas.width=Math.round(width*ratio);coverageCanvas.height=Math.round(height*ratio);coverageCanvas.style.width=width+'px';coverageCanvas.style.height=height+'px';}
    const context=coverageCanvas.getContext('2d');context.setTransform(ratio,0,0,ratio,0,0);context.fillStyle=dark?'#234E50':'#438F89';context.fillRect(0,0,width,height);
    const project=projectionFor(camera,width,height),extent=viewportWorld(camera,width,height),path=new Path2D();let count=0;
    // A bounded coarse mesh keeps coverage fast even while the detailed
    // backdrop is being rebuilt. Its immutable world geometry is prepared once.
    const mesh=coverageMesh||geometry().land.slice(0,32).map(p=>({rings:[Array.isArray(p)?p[0]:p.outer]}));
    for(const item of mesh){if(extent&&item.bounds&&!overlaps(extent,item.bounds))continue;for(const ring of item.rings){const stride=coverageMesh?1:Math.max(1,Math.ceil(ring.length/64));let first=true;for(let i=0;i<ring.length&&count<8192;i+=stride){const p=project(...ring[i]);if(first){path.moveTo(p[0],p[1]);first=false;}else path.lineTo(p[0],p[1]);count++;}path.closePath();}if(count>=8192)break;}
    context.fillStyle=dark?'#5E6044':'#E6D3A4';context.fill(path,'evenodd');
  }
  // inspect() rebuilds each module's diagnostics; these sources only ever become ready, so stop asking then.
  let readySources=null;
  function sourceReadiness(){
    if(readySources)return readySources;
    const ready=[Boolean(window.GoiVietNaturalLandscape?.inspect().ready),Boolean(window.GoiVietNaturalRegionalRelief?.inspect().ready),Boolean(window.GoiVietHydrology?.inspect().ready)];
    if(ready.every(Boolean))readySources=ready;
    return ready;
  }
  // Home-screen preparation (map-prewarm-3.js): run the backdrop steps against a canvas that draws nothing,
  // so the raster workers compute every sea and relief tile they use. The backdrop itself is drawn under the
  // curtain, once the real map area is known. 'tiles' = a whole pass found every tile cached while idle.
  let tileState='idle',tileKey='';
  function dryContext(width,height){
    const noop=()=>{},gradient={addColorStop:noop};
    const target={canvas:{width,height},createLinearGradient:()=>gradient,createRadialGradient:()=>gradient,createPattern:()=>null,getTransform:()=>new DOMMatrix(),isPointInPath:()=>false,isPointInStroke:()=>false,measureText:()=>({width:0})};
    return new Proxy(target,{get:(t,k)=>k in t?t[k]:noop,set:()=>true});
  }
  function prepareTiles(camera,width,height,dark,margin=0){
    if(active()||document.hidden)return 'inactive';
    ensureGeometry();loadArt();
    const source=geometry();if(!source)return 'geometry';
    if(!window.GoiVietRasterTasks?.managed)return 'unmanaged';
    prepareCoverage(source);
    const pad=(width<=768?160:260)+margin;
    window.GoiVietRasterTasks.setView(camera,width,height,dark,viewportWorld(camera,width,height,pad+160),false);
    if(!sourceReadiness().every(Boolean))return 'sources';
    const key=JSON.stringify([width,height,dark,camera.zoom,margin]);
    if(key!==tileKey){tileKey=key;if(tileState!=='running')tileState='idle';}
    if(tileState==='running')return 'pending';
    if(tileState==='complete')return 'tiles';
    const pending=window.GoiVietRasterTasks.inspect().pending;
    if(pending>=32||tileState==='requested'&&pending)return 'pending';
    const c={...camera},extent=viewportWorld(c,width,height,pad),idle=!pending;
    if(extent){const m=70/c.zoom;extent.left-=m;extent.right+=m;extent.top-=m;extent.bottom+=m;}
    const job={context:dryContext(width+2*pad,height+2*pad),camera:c,width,height,dark,pad,source,extent,project:projectionFor(c,width,height),level:c.zoom>1.7?0:c.zoom>.9?1:c.zoom>.45?2:3};
    tileState='running';
    window.GoiVietRasterTasks.run('backdrop-tiles',buildBackdrop(job),(result,missing)=>{tileState=key!==tileKey||missing?'idle':idle?'complete':'requested';},()=>{tileState='idle';});
    return 'pending';
  }
  function paintBackdrop(camera,width,height,dark,now=performance.now()){
    frameUI=null;if(!active()){host.hidden=true;cancelBackdrop();return;}
    islandLabels=[];host.hidden=false;const ui=visibleUI();
    // Bound both front and staging surfaces to 32 MiB RGBA combined.
    rasterGuard=width<=768?160:260;
    // Keep the displayed front intact; startBackdrop commits its replacement atomically.
    if(!window.GoiVietPixelBudget)sizeCanvas(background,back,width,height,rasterGuard);
    const waveView=window.GoiVietPixelBudget&&cachedViewport||{width,height,pad:rasterGuard};
    sizeCanvas(waveCanvas,waves,waveView.width,waveView.height,waveView.pad);sizeCanvas(labelCanvas,labels,width,height);
    const source=geometry();if(!source)return;
    if(!window.GoiVietRasterTasks?.managed){background.hidden=true;drawCoverage(camera,width,height,dark);return;}
    prepareCoverage(source);
    const cameraKey=[width,height,...mapOrigin(),camera.zoom,camera.yaw,camera.pitch,camera.panX,camera.panY].join(':');
    if(cameraKey!==lastObservedCamera){lastObservedCamera=cameraKey;lastCameraChange=now;rasterDirty=true;}
    const moving=isDraggingMain||isTouchDragging||['zoom','yaw','pitch','panX','panY'].some(k=>Math.abs(camera[k]-camera['target'+k[0].toUpperCase()+k.slice(1)])>.001);
    window.GoiVietRasterTasks.setView(camera,width,height,dark,viewportWorld(camera,width,height,rasterGuard+100),moving||now-lastCameraChange<180);
    const key=JSON.stringify([width,height,window.devicePixelRatio||1,dark,...mapOrigin(),...sourceReadiness()]);
    const covered=cachedCamera&&cachedDark===dark&&applyRasterTransform(camera,width,height),zoomRatio=cachedCamera?camera.zoom/cachedCamera.zoom:1;
    const guardPoints=screenToBuffer&&[[-80,-80],[width+80,-80],[width+80,height+80],[-80,height+80]].map(([x,y])=>matrixPoint(screenToBuffer,x,y));
    const safe=covered&&guardPoints.every(p=>p[0]>=24&&p[1]>=24&&p[0]<=waveView.width+2*waveView.pad-24&&p[1]<=waveView.height+2*waveView.pad-24);
    const needsCoverage=!safe||zoomRatio<.74||zoomRatio>1.3||Math.abs(camera.pitch-(cachedCamera?.pitch||0))>.12||Math.abs(camera.yaw-(cachedCamera?.yaw||0))>.14;
    const quiet=!moving&&!window.GoiVietJourneyPreview?.isMoving()&&now-lastCameraChange>=180;
    // The displayed ground plane is already reprojected exactly. Do not submit
    // expensive background raster passes to the GPU while the camera moves;
    // the bounded coverage mesh fills newly exposed areas until refinement.
    if(backdropJob&&cachedCamera&&!quiet){cancelBackdrop();rasterDirty=true;deferBackdrop(190);}
    if(backdropJob&&(backdropJob.key!==key||Math.abs(Math.log(camera.zoom/backdropJob.camera.zoom))>.35))cancelBackdrop();
    if(!backdropJob&&(key!==lastKey||needsCoverage||rasterDirty&&quiet)){
      if(cachedCamera&&!quiet)deferBackdrop(190);
      else if(key!==lastKey||needsCoverage&&now-lastBackdropAttempt>80||quiet&&now-lastRasterRefine>=180)startBackdrop(camera,width,height,dark,key);
      else deferBackdrop(Math.max(180-(now-lastCameraChange),180-(now-lastRasterRefine)));
    }else if(rasterDirty&&!quiet)deferBackdrop(180);
    // Runs on every moving frame; write the canvas state only when it changes.
    if(background.hidden!==(cachedDark!==dark))background.hidden=cachedDark!==dark;
    if(!covered)drawCoverage(camera,width,height,dark);else {if(!coverageCanvas.hidden)coverageCanvas.hidden=true;window.GoiVietWebGLCoverage3?.hide();}
    placeOverview(camera,width,height,key,!covered);
    const labelKey=JSON.stringify([camera,width,height,dark,ui,document.fonts.status,window.GoiVietLabelPerformance?.fontRevision()]);
    if(labelKey!==lastLabelKey){lastLabelKey=labelKey;labels.clearRect(0,0,width,height);labels.save();placeCountryLabels(labels,camera,width,height,dark);labels.restore();}
    if(cachedCamera)drawWaves(cachedCamera,waveView.width,waveView.height,dark,now,waveView.pad);mountCrane();
  }
  const landmarkSpecs = [
    {id:'hn',file:'hanoi.svg',width:34,height:46,geo:[105.8523,21.02786]},
    {id:'hue',file:'hue.svg',width:52,height:31,geo:[107.576,16.468]},
    {id:'hcm',file:'saigon.svg',width:44,height:37,geo:[106.698019,10.772521]},
    {id:'sailboat',file:'sailboat.svg',width:114,height:117,point:[700,250]}
  ];
  function loadArt() {
    for(const spec of landmarkSpecs){
      if(images.has(spec.id))continue;
      const image=new Image();const record={image,ready:false,failed:false};images.set(spec.id,record);image.decoding='async';
      image.onload=()=>{record.ready=true;requestMapRender(3);};image.onerror=()=>{record.failed=true;requestMapRender(2);};
      const vector=window.GoiVietRegionalArt?.[spec.id];
      image.src=vector?'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(vector):new URL(spec.id==='sailboat'?spec.file:'../map-art/'+spec.file,scriptURL).href;
    }
  }
  function paintLandmarks(context,camera,width,height,dark) {
    objectBoxes=[];if(!active())return;
    loadArt();const blocked=visibleUI(),overview=getBestOverviewZoom(width,height);
    const visibleTracks=window.GoiVietJourneyPreview?.active()?window.GoiVietJourneyPreview.tracks().map(t=>t.curve):[MAIN_RAIL_SPLINE];
    const tracks=visibleTracks.map(curve=>curve.pts.map(p=>project3D(p.wx,p.wy,27,camera,width,height)));
    const pinBoxes=[];
    for(const id of ['hn','hue','hcm']){
      const selected=getMapSelectedPlaceId()===id,province=P34_MAP[id],p=project3D(...province.center,selected?44:34,camera,width,height);
      pinBoxes.push(rect(p[0],p[1],44,44));
      if(!selected||window.GoiVietJourneyPreview?.active()){context.save();context.font=canvasFont(13,700);const name=getCleanStationName(CULTURAL_PLACE_MAP[id]);pinBoxes.push(rect(p[0],p[1]-21,measureText(context,name)+14,24));context.restore();}
      else {const pawn=getPlayerPawn(state.currentPlayerIndex);context.save();context.font=canvasFont(12,700);const name=getCleanStationName(CULTURAL_PLACE_MAP[id])+' • '+pawn.roleLabel;pinBoxes.push(rect(p[0],p[1]-33,measureText(context,name)+40,27));context.restore();}
    }
    const hitsTrack=box=>tracks.some(points=>points.some((p,i)=>{if(!i)return false;const a=points[i-1],dx=p[0]-a[0],dy=p[1]-a[1],steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/4));for(let t=0;t<=steps;t++){const x=a[0]+dx*t/steps,y=a[1]+dy*t/steps;if(x>box.left-6&&x<box.right+6&&y>box.top-6&&y<box.bottom+6)return true;}return false;}));
    for(const spec of landmarkSpecs){
      const image=images.get(spec.id);if(!image?.ready)continue;
      if(width<=768&&camera.zoom<overview*1.15&&spec.id!=='sailboat')continue;
      const province=P34_MAP[spec.id];
      // These are city emblems, so share the displayed station anchor and height.
      // Keep the landmark's geographical metadata separate from its map symbol.
      const point=spec.point||province.center;
      const z=spec.id==='sailboat'?0:getMapSelectedPlaceId()===spec.id?44:34;
      let p=project3D(...point,z,camera,width,height),scale=spec.id==='sailboat'?clamp(p[3],.7,1.45):clamp(Math.sqrt(p[3]),.65,1.12);
      let box={left:p[0]-spec.width*scale/2,right:p[0]+spec.width*scale/2,top:p[1]-spec.height*scale,bottom:p[1]+3};
      const anchorScreen=[p[0],p[1]];let displacement=[0,0];
      if(mapCompass)blocked.push(rect(mapCompass.x,mapCompass.y+10,86,110));
      if(province){
        let chosen=null;
        // Only try positions in the immediate station cluster. Prefer shrinking
        // to pushing an emblem into another province; never draw a leader line.
        for(const shrink of [1,.88,.76]){
          const size=scale*shrink,w=spec.width*size,h=spec.height*size;
          for(const [dx,dy]of [[w/2+23,h-7],[-w/2-23,h-7],[16,h+23],[-16,h+23],[0,h+23]]){
            const q=[anchorScreen[0]+dx,anchorScreen[1]+dy],b={left:q[0]-w/2,right:q[0]+w/2,top:q[1]-h,bottom:q[1]+3};
            if(!insideScreen(b,width,height)||blocked.some(r=>overlaps(b,r))||pinBoxes.some(r=>overlaps(b,r))||hitsTrack(b))continue;
            chosen={p:q,box:b,scale:size,displacement:[dx,dy]};break;
          }
          if(chosen)break;
        }
        if(!chosen)continue;({p,box,scale,displacement}=chosen);
      }
      if(!insideScreen(box,width,height)||blocked.some(b=>overlaps(box,b)))continue;
      context.save();if(dark)context.filter='brightness(.78) saturate(.8)';
      context.drawImage(image.image,box.left,box.top,box.right-box.left,box.bottom-box.top-3);context.restore();objectBoxes.push({...box,id:spec.id,world:[...point],geo:spec.geo&&[...spec.geo],anchorScreen,displacement,scale});
    }
  }
  let archipelagoGroups=null;
  function paintIslandLabel(context,island,camera,width,height,isArchipelago) {
    if(!active())return false;
    const group=island.id==='con-dao'?window.GoiVietNaturalIslands?.groups.find(g=>g.id===island.id):null;
    // The landscape's island groups are fixed once loaded; inspect() would rebuild all its diagnostics per label.
    if(isArchipelago&&!archipelagoGroups)archipelagoGroups=window.GoiVietNaturalLandscape?.inspect().groups||null;
    const archipelago=isArchipelago?archipelagoGroups?.find(g=>g.id===island.id):null;
    const p=project3D(...island.pt,group||isArchipelago?0:16,camera,width,height),area=mapScreenArea,blocked=visibleUI();
    if(mapCompass)blocked.push(rect(mapCompass.x,mapCompass.y+10,86,110));
    blocked.push(...countryLabels.map(label=>label.box));
    const radius=isArchipelago?75*Math.max(.3,p[3]):15;
    if(p[0]+radius<area.left||p[0]-radius>area.right||p[1]+radius<area.top||p[1]-radius>area.bottom){if(isArchipelago)window.GoiVietArchipelagoArt?.positionButton(island.id,null);return true;}
    const lines=isArchipelago?['QUẦN ĐẢO',island.id==='hoang-sa'?'HOÀNG SA':'TRƯỜNG SA']:[island.short];
    const size=isArchipelago?Math.round(clamp(13*Math.sqrt(p[3]/.828),11.5,17)*4)/4:12;
    context.save();context.font=canvasFont(size,isArchipelago?600:500,'heading');
    const textWidth=Math.max(isArchipelago?94:0,Math.max(...lines.map(line=>measureText(context,line)))+14);
    const lineHeight=size*1.35,labelHeight=lines.length*lineHeight+6,buttonHeight=isArchipelago?(width<=768?44:30):0,boxHeight=labelHeight+(isArchipelago?buttonHeight+5:0);
    // Keep Con Dao's caption beside its real shoreline, in screen pixels.
    // A world-space offset made Con Dao's caption drift far south when zoomed in.
    const shore=group?.islands?.flatMap(item=>{const b=item.bounds;return [[b.left,b.top],[b.right,b.top],[b.right,b.bottom],[b.left,b.bottom]].map(point=>project3D(...point,0,camera,width,height)[1]);});
    const y=shore?.length?Math.max(...shore)+7:p[1]+(isArchipelago?54*Math.max(.45,p[3]):18*Math.max(.6,p[3]));
    const bounds=archipelago?.bounds,coast=bounds&&[[bounds.left,bounds.top],[bounds.right,bounds.top],[bounds.right,bounds.bottom],[bounds.left,bounds.bottom]].map(point=>project3D(...point,0,camera,width,height)[1]);
    // Archipelago captions stay on the same projected meridian as the source
    // island cluster. Resolve crowding vertically, never by sliding onto land.
    const below=coast?Math.max(...coast)+9:y,above=coast?Math.min(...coast)-9:p[1]-radius;
    const candidates=isArchipelago?[[p[0],below+boxHeight/2],[p[0],p[1]+18+boxHeight/2],[p[0],above-boxHeight/2],[p[0],p[1]-18-boxHeight/2],[p[0],p[1]-radius-boxHeight/2-5],[p[0],below+boxHeight/2+18]]:[[p[0],y+boxHeight/2],[p[0]-textWidth*.6,y+boxHeight/2],[p[0]+textWidth*.6,y+boxHeight/2],[p[0],p[1]-radius-boxHeight/2-5]];
    let placement=null;
    for(const[x,cy]of candidates){const box=rect(x,cy,textWidth,boxHeight);if(insideScreen(box,width,height)&&!blocked.some(b=>overlaps(box,b))&&!objectBoxes.some(b=>overlaps(box,b))&&!islandLabels.some(b=>overlaps(box,b.box))){placement={x,y:cy,box};break;}}
    if(placement){
      context.textAlign='center';context.textBaseline='middle';context.lineJoin='round';context.lineWidth=3.4;
      context.strokeStyle=state.theme==='dark'?'rgba(19,49,49,.8)':'rgba(38,99,101,.65)';context.fillStyle=state.theme==='dark'?'#E9DEB4':'#F8EBC8';
      const labelY=placement.box.top+labelHeight/2;
      lines.forEach((line,i)=>{const y=labelY+(i-(lines.length-1)/2)*lineHeight;context.strokeText(line,placement.x,y);context.fillText(line,placement.x,y);});
      if(isArchipelago)window.GoiVietArchipelagoArt?.positionButton(island.id,{left:placement.x-47,top:placement.box.top+labelHeight+4});
      islandLabels.push({id:island.id,text:lines.join(' '),point:[p[0],p[1]],box:placement.box,sourceBounds:bounds&&{...bounds}});
    }else if(isArchipelago)window.GoiVietArchipelagoArt?.positionButton(island.id,null);
    context.restore();return true;
  }
  function mountCrane() {
    const frame=scene.querySelector('.gv-map-frame:not(.preview-decorative-underlay)');if(!frame)return;
    const existing=frame.querySelector('.regional-crane');
    if(existing){const r=existing.getBoundingClientRect(),box={left:r.left,right:r.right,top:r.top,bottom:r.bottom};const probes=[[box.left,box.top],[box.right,box.top],[box.right,box.bottom],[box.left,box.bottom],[(box.left+box.right)/2,(box.top+box.bottom)/2]];const obstructed=renderedHitProvinces.some(e=>e.topProjectedRings.some(ring=>probes.some(p=>pointInRing2D(...p,ring))||ring.some(p=>p[0]>box.left&&p[0]<box.right&&p[1]>box.top&&p[1]<box.bottom)))||visibleUI().some(b=>overlaps(box,b))||countryLabels.some(b=>overlaps(box,b.box));if(existing.hasAttribute('data-obstructed')!==obstructed)existing.toggleAttribute('data-obstructed',obstructed);return;}
    const crane=document.createElement('img');crane.className='regional-crane';crane.alt='';crane.setAttribute('aria-hidden','true');crane.draggable=false;
    crane.src=new URL('../map-art/crane-flight.png',scriptURL).href;frame.append(crane);
  }
  function isAnimating() {return active()&&waveMotion&&!state.reducedMotion&&!document.hidden&&!getTopOpenModalElement();}
  function mountOptions() {
    if(mounted)return;const menu=document.querySelector('#mapViewOptions .control-options');if(!menu)return;mounted=true;
    const label=document.createElement('label');label.className='regional-wave-option';waveCheckbox=document.createElement('input');waveCheckbox.type='checkbox';waveCheckbox.id='regionalWaveMotion';
    waveCheckbox.title='Tự dừng khi bật giảm chuyển động hoặc mở cửa sổ nội dung';
    const text=document.createElement('span');text.textContent='Sóng chuyển động nhẹ';label.append(waveCheckbox,text);menu.append(label);
    waveCheckbox.addEventListener('change',()=>{waveMotion=waveCheckbox.checked;lastWaveKey='';requestMapRender(3);});
    const note=document.createElement('p');note.className='island-helper-note';note.dataset.regionalSource='true';
    note.innerHTML='Nền địa lý: <a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener noreferrer">Natural Earth</a>. Đất và biển được minh họa; địa giới các tỉnh Việt Nam giữ dữ liệu gốc.';
    document.querySelector('#mapSourcesContent')?.append(note);
  }
  function sync() {
    host.hidden=!active();lastKey='';lastWaveKey='';cancelBackdrop();if(!active()){if(rasterRefineTimer)clearTimeout(rasterRefineTimer);rasterRefineTimer=0;coverageCanvas.hidden=true;}
    if(active()){if(tileState==='running'){window.GoiVietRasterTasks?.cancel('backdrop-tiles');tileState='idle';}ensureGeometry();loadArt();mountOptions();mountCrane();requestMapRender(3);}
  }
  new MutationObserver(sync).observe(intro,{attributes:true,attributeFilter:['class']});
  window.addEventListener('resize',()=>{minimumKey='';minimumValues.clear();lastKey='';lastWaveKey='';cancelBackdrop();requestMapRender(3);},{passive:true});
  mainCanvas.tabIndex=0;
  const help=document.createElement('p');help.id='regionalMapHelp';help.className='regional-map-help';help.textContent='Kéo để khám phá bản đồ. Dùng phím mũi tên để di chuyển, dấu cộng hoặc trừ để thu phóng, R hoặc Home để về giữa. Giữ Shift khi kéo để xoay.';
  scene.append(help);mainCanvas.setAttribute('aria-describedby',help.id);
  window.addEventListener('keydown',event=>{
    if(!active()||getTopOpenModalElement()||event.altKey||event.ctrlKey||event.metaKey)return;
    const focused=document.activeElement;
    if(focused!==mainCanvas&&focused!==scene&&focused!==document.body)return;
    const deltas={ArrowLeft:[42,0],ArrowRight:[-42,0],ArrowUp:[0,42],ArrowDown:[0,-42]};
    if(deltas[event.key]){
      event.preventDefault();const area=mapScreenArea,x=(area.left+area.right)/2,y=(area.top+area.bottom)/2,[dx,dy]=deltas[event.key],camera=targetCamera();
      const from=inverse(x,y,camera),to=inverse(x+dx,y+dy,camera);
      if(from&&to){state.cam.targetPanX+=to[0]-from[0];state.cam.targetPanY+=to[1]-from[1];constrainCamera();requestMapRender(24);}
    }else if(['+','=','-','_'].includes(event.key)){
      event.preventDefault();stepZoom(event.key==='+'||event.key==='='?1.22:.82);
    }
  });
  document.fonts.ready.then(()=>{lastKey='';requestMapRender(2);});
  window.GoiVietRegionalPreview=Object.freeze({active,prepareTiles,paintBackdrop,paintLandmarks,paintIslandLabel,clampPan,constrainCamera,panBy,zoomAt,beginPinch,pinch,endPinch:()=>{pinchAnchor=null;},minimumZoom,panRanges,inverse,viewportWorld,isAnimating,
    waterAtScreen:(x,y)=>{if(!cachedCamera||!lastWater||!screenToBuffer)return false;const p=matrixPoint(screenToBuffer,x,y),ratio=back.getTransform().a;return back.isPointInPath(lastWater,p[0]*ratio,p[1]*ratio,'evenodd');},
    waterAtBuffer:(x,y)=>Boolean(lastWater&&back.isPointInPath(lastWater,x,y,'evenodd')),
    backgroundPoint:(x,y)=>{if(!cachedCamera||!bufferToScreen)return null;const v=window.GoiVietPixelBudget&&cachedViewport||{width:cw,height:ch,pad:rasterGuard},p=window.GoiVietPixelBudget?matrixPoint(cachedHomography,x,y):project3D(x,y,0,cachedCamera,v.width,v.height);return matrixPoint(bufferToScreen,p[0]+v.pad,p[1]+v.pad);},
    labelObstacles:()=>active()?[...objectBoxes,...countryLabels.map(l=>l.box),...islandLabels.map(l=>l.box)]:[],
    inspect:()=>({active:active(),minimumZoom:minimumZoom(),panRanges:panRanges(),geometryLoaded:!!geometry(),geometryError,geometryStats:geometry()?.stats,projectionPoints,detailLevel,countryLabels:countryLabels.map(l=>({...l})),islandLabels:islandLabels.map(l=>({...l})),landmarks:objectBoxes.map(l=>({...l})),waveCount,waveMotion,backdropDraws,waveDraws,cameraConstraints,art:[...images].map(([id,item])=>({id,ready:item.ready,failed:item.failed})),stack:{background:0,mountains:1,mapCanvas:2,decorativeFrame:3},backgroundSize:[background.width,background.height],backdropPending:!!backdropJob,backdropDirty:rasterDirty,backdropCancels,backdropCommits:backdropDraws,backdropError,coverageFallback:!coverageCanvas.hidden,overviewZoom:underlay?.zoom??null,overviewVisible:!overviewCanvas.hidden,backdropBytes:background.width*background.height*4+((stagingCanvas||backdropJob?.canvas)?.width||0)*((stagingCanvas||backdropJob?.canvas)?.height||0)*4,refinePending:!!rasterRefineTimer})
  });
  window.GoiVietRasterTasks?.onUpdate(()=>{rasterDirty=true;textureRevision++;});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelBackdrop();});
  sync();
  if(new URL(location.href).searchParams.get('view')==='map'){
    const enter=()=>{closeIntroModal();recenterMapBestView();if(cw<=768&&!document.body.classList.contains('mobile-map-focus'))toggleMobileMapFocus();};
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enter,{once:true});else queueMicrotask(enter);
  }
})();
