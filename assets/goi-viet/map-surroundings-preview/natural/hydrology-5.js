/* Preview-5 copy of hydrology-3.js (P5-03 slice 2): interface text follows the VI/EN choice (GoiVietI18n).
   Other pages keep hydrology-3.js. */
/* Sourced rivers above the terrain, below boundaries, railway and labels. Preview only. */
(() => {
  'use strict';
  const C = window.GoiVietNaturalCore;
  // Also active while the home screen prepares the map (map-prewarm-3.js): textures need the rivers.
  const active = () => Boolean(document.getElementById('introScreen')?.classList.contains('intro-hidden') || window.GoiVietMapPrewarm3?.preparing());
  const paths = new Map();
  const ringBounds = new WeakMap();
  // Ring/source membership is independent of the camera. Reuse exact candidates
  // instead of scanning and allocating bounds for every river on every frame.
  const ringFeatures = new WeakMap();
  let source = null, promise = null, error = null, cameraKey = '', builds = 0;

  function attribution() {
    const parent = document.getElementById('mapSourcesContent');
    if (!parent || parent.querySelector('[data-hydrology]')) return;
    const note = document.createElement('p');
    note.dataset.hydrology = 'true';
    note.innerHTML = 'Sông và hồ trong toàn vùng bản đồ: <a href="https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-rivers-lake-centerlines/" target="_blank" rel="noopener">Natural Earth 1:10 triệu, v5.0.0</a>, dữ liệu công cộng. Giữ các điểm nối của nguồn; đường nối trong hồ không được vẽ như sông trên mặt hồ. Dữ liệu tổng quát, chưa bao gồm toàn bộ suối và kênh rạch; độ dày nét là ký hiệu, không phải bề rộng đo đạc.';
    note.dataset.i18n = 'src.hydro.1|src.hydro.2'; note.querySelector('a').dataset.i18n = 'src.hydro.link';
    parent.append(note); window.GoiVietI18nDom?.apply(note);
  }

  function ensure() {
    if (promise) return promise;
    promise = C.load('hydrology-data.js', 'GoiVietHydrologyData').then(data => {
      source = data;
      attribution();
      requestMapRender(3);
      return true;
    }).catch(e => { error = e.message; return false; });
    return promise;
  }

  function* projectedSteps(camera, w, h, z, ring = null, styleZoom = camera.zoom) {
    const key = JSON.stringify([styleZoom,camera.zoom, camera.yaw, camera.pitch, camera.panX, camera.panY, w, h, ...getMapScreenOrigin(w, h)]);
    if (key !== cameraKey) { cameraKey = key; paths.clear(); }
    if (!paths.has(z)) paths.set(z, {all: null, rings: new WeakMap(), shapes: new WeakMap(), rivers: 0, lakeCount: 0, networks: new Set()});
    const plane = paths.get(z), cached = ring ? plane.rings.get(ring) : plane.all;
    if (cached) return cached;
    if (ring && !ringBounds.has(ring)) ringBounds.set(ring, C.box(ring));
    const project = C.projector(camera, w, h, z), extent = ring ? ringBounds.get(ring) : window.GoiVietRegionalPreview.viewportWorld(camera, w, h, 160);
    const maximumRank = styleZoom < .6 ? 7 : styleZoom < 1.15 ? 8 : 12;
    const result = { major: new Path2D(), minor: new Path2D(), lakes: new Path2D(), rivers: 0, lakeCount: 0 };
    const visible = item => !extent || item.bounds[0]<extent.right&&item.bounds[2]>extent.left&&item.bounds[1]<extent.bottom&&item.bounds[3]>extent.top;
    if(ring&&!ringFeatures.has(ring))ringFeatures.set(ring,{rivers:source.rivers.filter(visible),lakes:source.lakes.filter(visible)});
    const candidates=ring?ringFeatures.get(ring):{rivers:source.rivers.filter(visible),lakes:source.lakes.filter(visible)};
    // The static membership above is reused; reject invisible features before
    // allocating their projected paths (also on raised province planes).
    const inView = item => {
      const b=item.bounds,pts=[[b[0],b[1]],[b[2],b[1]],[b[2],b[3]],[b[0],b[3]]].map(p=>project(...p));
      const pad=ring?8:200;
      return !pts.every(p=>p[0]<-pad)&&!pts.every(p=>p[0]>w+pad)&&!pts.every(p=>p[1]<-pad)&&!pts.every(p=>p[1]>h+pad);
    };
    for (const river of candidates.rivers) {
      if (river.kind === 'Lake Centerline' || river.rank > maximumRank || !inView(river)) continue;
      const path = river.rank <= 6 ? result.major : result.minor;
      let shape=plane.shapes.get(river);
      if(!shape){shape=new Path2D();river.points.forEach((point,i)=>{const p=project(...point);if(i)shape.lineTo(p[0],p[1]);else shape.moveTo(p[0],p[1]);});plane.shapes.set(river,shape);}
      path.addPath(shape);
      if(Number.isFinite(river.network))plane.networks.add(river.network);
      result.rivers++;
      yield;
    }
    for (const lake of candidates.lakes) {
      if (lake.rank > maximumRank || !inView(lake)) continue;
      let shape=plane.shapes.get(lake);
      if(!shape){shape=new Path2D();for(const ring of lake.rings){ring.forEach((point,i)=>{const p=project(...point);if(i)shape.lineTo(p[0],p[1]);else shape.moveTo(p[0],p[1]);});shape.closePath();}plane.shapes.set(lake,shape);}
      result.lakes.addPath(shape);
      result.lakeCount++;
      yield;
    }
    if (ring) plane.rings.set(ring, result); else plane.all = result;
    plane.rivers = Math.max(plane.rivers, result.rivers); plane.lakeCount = Math.max(plane.lakeCount, result.lakeCount);
    builds++;
    return result;
  }

  function* paintSteps(context, camera, w, h, dark, z = 0, clip = null, ring = null, exclusion = null, styleZoom = camera.zoom, pixelScale = 1) {
    if (!active()) return;
    ensure();
    if (!source) return;
    const p = yield* projectedSteps(camera, w, h, z, ring, styleZoom);
    const scale = C.clamp(Math.sqrt(styleZoom), .65, 1.7);
    if (!p.rivers && !p.lakeCount) return;
    context.save();
    if (clip) context.clip(clip, 'evenodd');
    if (exclusion) context.clip(exclusion, 'evenodd');
    context.lineCap = 'round'; context.lineJoin = 'round';
    // A narrow dark bank separates water from the mottled green land cover.
    for (const [path, width] of [[p.minor, .85 * scale], [p.major, 1.65 * scale]]) {
      context.strokeStyle = dark ? 'rgba(14,49,59,.75)' : 'rgba(31,79,80,.8)';
      context.lineWidth = (width + .9)*pixelScale; context.stroke(path);
      context.strokeStyle = dark ? '#75B4C5' : '#8ABFCB';
      context.lineWidth = width*pixelScale; context.stroke(path);
    }
    context.fillStyle = dark ? '#427F8B' : '#71ADBA';
    context.fill(p.lakes, 'evenodd');
    context.restore();
  }

  function paint(...args) { for (const step of paintSteps(...args)) {} }

  function paintTop(context, ring, z, camera, w, h, dark, points) {
    const clip = new Path2D();
    points ||= window.GoiVietRenderPerformance?.projectRing?.(ring,z,camera,w,h)||ring.map(p=>project3D(p[0],p[1],z,camera,w,h));
    points.forEach((p, i) => { if (i) clip.lineTo(p[0], p[1]); else clip.moveTo(p[0], p[1]); });
    clip.closePath();
    paint(context, camera, w, h, dark, z, clip, ring);
  }

  function paintWorld(context,ring,box,density,dark,styleZoom){
    const w=context.canvas.width,h=context.canvas.height,[ox,oy]=getMapScreenOrigin(w,h);
    const camera={yaw:0,pitch:0,zoom:density,panX:MAP_CENTER_X-box.left-ox/density,panY:MAP_CENTER_Y-box.top-oy/density};
    const clip=new Path2D();ring.forEach(([x,y],i)=>{const px=(x-box.left)*density,py=(y-box.top)*density;i?clip.lineTo(px,py):clip.moveTo(px,py);});clip.closePath();
    for(const step of paintSteps(context,camera,w,h,dark,0,clip,ring,null,styleZoom,density/styleZoom)){}
  }
  window.GoiVietHydrology = Object.freeze({ paintWorld, ensure, paint, paintSteps, paintTop, inspect: () => ({ready: !!source, error, builds, cachePlanes: paths.size, rivers: source?.rivers.length, lakes: source?.lakes.length, visible: [...paths].map(([z, p]) => ({z, rivers: p.rivers, lakes: p.lakeCount,networks:[...p.networks]}))}) });
  if (active()) ensure();
  else new MutationObserver(() => { if (active()) ensure(); }).observe(document.getElementById('introScreen'), {attributes: true, attributeFilter: ['class']});
})();
