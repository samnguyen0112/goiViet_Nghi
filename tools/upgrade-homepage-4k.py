"""Scoped code migration: 4K raster assets, common coordinates, same motion."""
from pathlib import Path
import hashlib

root = Path(__file__).resolve().parents[1]
evidence = root / 'verification/homepage-4k-20261012'

# This is a one-time migration. Validate every input before the first write.
for name, snapshot in [
    ('index.html', 'index.before.html'),
    ('assets/goi-viet/homepage-scene.js', 'homepage-scene.js.before'),
    ('assets/goi-viet/homepage-native.js', 'homepage-native.js.before'),
    ('assets/goi-viet/homepage-native.css', 'homepage-native.css.before'),
]:
    assert hashlib.sha256((root / name).read_bytes()).digest() == hashlib.sha256((evidence / snapshot).read_bytes()).digest(), f'{name} changed since initial snapshot; migration stopped without writing'

def read(name): return (root / name).read_text(encoding='utf-8')
def replace(source, old, new):
    assert source.count(old) == 1, old[:100]
    return source.replace(old, new)
def write(name, source):
    data = (root / name).read_bytes()
    ending = '\r\n' if b'\r\n' in data else '\n'
    (root / name).write_bytes(source.replace('\n', ending).encode('utf-8'))

scene = read('assets/goi-viet/homepage-scene.js')
scene = replace(scene, 'const logoRect=[565,40,480,220];', '''const layout=window.GoiVietHomeLayout;
 const SX=layout.width/layout.designWidth,SY=layout.height/layout.designHeight;
 const logoRect=layout.hotspots.homeLogoEffect;''')
scene = replace(scene, "const hc=hat.getContext('2d');hc.translate(-x,-y);hc.fillStyle='#fff';", "const hc=hat.getContext('2d');hc.setTransform(SX,0,0,SY,-x,-y);hc.fillStyle='#fff';")
scene = replace(scene, 'const px=x+(i/4)%w,py=y+Math.floor(i/4/w);', 'const px=x+(i/4)%w,py=y+Math.floor(i/4/w),bounds=layout.logoInkBounds;')
scene = replace(scene, 'if(px<593||px>=1030||py<54||py>=257)', 'if(px<bounds[0]||px>=bounds[0]+bounds[2]||py<bounds[1]||py>=bounds[1]+bounds[3])')
scene = replace(scene, 'if(px===593-x||px===1029-x||py===54-y||py===256-y)touchesBoundary=true;', 'const bounds=layout.logoInkBounds;\n    if(px===bounds[0]-x||px===bounds[0]+bounds[2]-1-x||py===bounds[1]-y||py===bounds[1]+bounds[3]-1-y)touchesBoundary=true;')
scene = replace(scene, "new URL('./homepage-scene-assets.js'", "new URL('./homepage-scene-assets-4k.js'")
scene = scene.replace("['source-with-text.jpg','scenery-clean.png','crane-clean.png']", "['source-with-text.webp','scenery-clean.webp','crane.webp','leaf.webp','petal.webp']")
scene = scene.replace("},15000);", "},45000);")
scene = replace(scene, "const ctx=canvas.getContext('2d',{willReadFrequently:true});", "const ctx=canvas.getContext('2d',{alpha:false});")
start, end = scene.index('const protectedRects=['), scene.index('const loadImage=')
scene = scene[:start] + 'const sourceRects=layout.protectedRects;\nlet protectedRects=[],originalPatches=[];\n' + scene[end:]
scene = replace(scene, 'const [source,plate,crane]=await Promise.all([', 'const [source,plate,crane,leafTexture,petalTexture]=await Promise.all([')
scene = replace(scene, "loadImage(assetSources['source-with-text.jpg'],'source-with-text.jpg'),loadImage(assetSources['scenery-clean.png'],'scenery-clean.png'),\n  loadImage(assetSources['crane-clean.png'],'crane-clean.png')", "loadImage(assetSources['source-with-text.webp'],'source-with-text.webp'),loadImage(assetSources['scenery-clean.webp'],'scenery-clean.webp'),\n  loadImage(assetSources['crane.webp'],'crane.webp'),loadImage(assetSources['leaf.webp'],'leaf.webp'),loadImage(assetSources['petal.webp'],'petal.webp')")
start, end = scene.index(' function botanical('), scene.index(" let mode='canvas2d';")
scene = scene[:start] + ''' function particle(texture){
  const c=surface(Math.round(40*SX),Math.round(60*SY));c.getContext('2d').drawImage(texture,0,0,c.width,c.height);return c;
 }
 const leaf=particle(leafTexture),petal=particle(petalTexture);
 const originalCanvas=surface(canvas.width,canvas.height),originalCtx=originalCanvas.getContext('2d',{willReadFrequently:true});
 const logo=createLogoLayer(source);
 if(!logo)throw new Error('Không tách được lớp logo 4K');
 const logoBackdrop=createLogoBackdrop(plate,logo);logo.eraseAlpha=logoBackdrop.domain;
 let outputLogo=null,outputLogoRect=null,resizeBackdrop=()=>{};
''' + scene[end:]
scene = scene.replace('ctx.drawImage(plate,0,0)', 'ctx.drawImage(plate,0,0,W,H)')
scene = replace(scene, 'const bg=surface(W,H),gl=', 'const bg=surface(canvas.width,canvas.height),gl=')
scene = replace(scene, "if(!gl)throw new Error('WebGL unavailable');", "if(!gl||gl.getParameter(gl.MAX_TEXTURE_SIZE)<layout.width)throw new Error('WebGL unavailable for 4K');")
scene = replace(scene, 'gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,plate);', "gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,plate);\n if(gl.getError()!==gl.NO_ERROR)throw new Error('4K texture unavailable');")
scene = replace(scene, "mode='webgl';", "mode='webgl';\n resizeBackdrop=(w,h)=>{bg.width=w;bg.height=h;gl.viewport(0,0,w,h);};\n resizeBackdrop(canvas.width,canvas.height);")
scene = replace(scene, 'ctx.drawImage(bg,0,0);', 'ctx.drawImage(bg,0,0,W,H);')
start, end = scene.index(' function birdFrames('), scene.index(' function drawBird(')
scene = scene[:start] + ''' let birds=[],birdRasterScale=1;
 function birdFrames(im,facing){
  const cache=new Map(),nx=8,ny=8;
  return {get(k){
   if(cache.has(k)){const frame=cache.get(k);cache.delete(k);cache.set(k,frame);return frame;}
   const s=birdRasterScale,frame=surface(Math.round(340*s),Math.round(290*s)),c=frame.getContext('2d');c.translate(30*s,30*s);
   const flap=Math.sin(k/60*Math.PI*2);
   function vertex(px,py){
    const x=px/s,y=py/s,tip=Math.max(0,Math.min(1,(155-y)/115));
    const avoidHead=y>105?Math.max(0,Math.min(1,(facing===1?195-x:x-85)/42)):1;
    const weight=tip*avoidHead,rootX=facing===1?137:143;
    return {x:(x+(x-rootX)*.13*flap*weight)*s,y:(y+(160-y)*.34*flap*weight)*s};
   }
   for(let iy=0;iy<ny;iy++)for(let ix=0;ix<nx;ix++){
    const a={x:ix*im.width/nx,y:iy*im.height/ny},b={x:(ix+1)*im.width/nx,y:a.y},e={x:a.x,y:(iy+1)*im.height/ny},d={x:b.x,y:e.y};
    triangle(c,im,[a,b,e],[vertex(a.x,a.y),vertex(b.x,b.y),vertex(e.x,e.y)]);
    triangle(c,im,[b,d,e],[vertex(b.x,b.y),vertex(d.x,d.y),vertex(e.x,e.y)]);
   }
   cache.set(k,frame);if(cache.size>6)cache.delete(cache.keys().next().value);return frame;
  },get cachedFrames(){return cache.size;}};
 }
 function prepareBirds(scale){
  birdRasterScale=Math.max(1,Math.min(SX,scale));
  const left=surface(Math.round(280*birdRasterScale),Math.round(230*birdRasterScale)),right=surface(left.width,left.height);
  const fit=Math.min(left.width/crane.width,left.height/crane.height),w=crane.width*fit,h=crane.height*fit;
  left.getContext('2d').drawImage(crane,(left.width-w)/2,(left.height-h)/2,w,h);
  const mirror=right.getContext('2d');mirror.translate(right.width,0);mirror.scale(-1,1);mirror.drawImage(left,0,0);
  birds=[birdFrames(left,1),birdFrames(right,-1)];
 }
''' + scene[end:]
scene = replace(scene, 'const frame=birds[which][k];', 'const frame=birds[which].get(k);')
scene = replace(scene, 'frame.width*scale,frame.height*scale', 'frame.width/birdRasterScale*scale,frame.height/birdRasterScale*scale')
start, end = scene.index(' let frames=0,logoRaised=false,lastTime=0;'), scene.index('\n})();\n\n }};')
scene = scene[:start] + ''' let frames=0,logoRaised=false,lastTime=0;
 const metadata={width:canvas.width,height:canvas.height,sourceWidth:layout.width,sourceHeight:layout.height,designWidth:W,designHeight:H,duration:DURATION,fps:FPS,protectedRects};
 const renderFrame=t=>{
  t=((t%DURATION)+DURATION)%DURATION;lastTime=t;
  ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);ctx.imageSmoothingQuality='high';
  drawBackdrop(t);
  ctx.drawImage(logoBackdrop.canvas,logo.rect[0]/SX,logo.rect[1]/SY,logo.rect[2]/SX,logo.rect[3]/SY);
  drawTrainSmoke(t);floating(t);drawBird(t,0);drawBird(t,1);
  ctx.setTransform(1,0,0,1,0,0);
  protectedRects.slice(1).forEach(([x,y],i)=>ctx.putImageData(originalPatches[i+1],x,y));
  if(!logoRaised)ctx.drawImage(outputLogo.canvas,0,0);
  frames++;
 };
 const setResolution=(width,height)=>{
  width=Math.max(1,Math.min(layout.width,Math.round(width)));height=Math.max(1,Math.min(layout.height,Math.round(height)));
  if(originalPatches.length&&canvas.width===width&&canvas.height===height)return;
  canvas.width=width;canvas.height=height;originalCanvas.width=width;originalCanvas.height=height;
  originalCtx.imageSmoothingQuality='high';originalCtx.drawImage(source,0,0,width,height);
  const xScale=width/layout.width,yScale=height/layout.height;
  protectedRects=sourceRects.map(([x,y,w,h])=>[Math.round(x*xScale),Math.round(y*yScale),Math.round((x+w)*xScale)-Math.round(x*xScale),Math.round((y+h)*yScale)-Math.round(y*yScale)]);
  originalPatches=protectedRects.map(([x,y,w,h])=>originalCtx.getImageData(x,y,w,h));
  const l=surface(width,height),lc=l.getContext('2d',{willReadFrequently:true});lc.imageSmoothingQuality='high';
  outputLogoRect=logo.rect.map((v,i)=>v*(i%2===0?xScale:yScale));
  lc.drawImage(logo.canvas,...outputLogoRect);outputLogo={canvas:l,alpha:lc.getImageData(0,0,width,height).data};
  resizeBackdrop(width,height);prepareBirds(width/W);
  metadata.width=width;metadata.height=height;metadata.protectedRects=protectedRects;
  renderFrame(lastTime);
 };
 const checkProtected=()=>protectedRects.map(([x,y,w,h],patch)=>{
  const expected=originalPatches[patch].data,actual=ctx.getImageData(x,y,w,h).data;let changed=0,max=0,checkedPixels=0,first=null;
  for(let i=0;i<actual.length;i+=4){
   const px=x+(i/4)%w,py=y+Math.floor(i/4/w);
   if(patch===0&&outputLogo.alpha[(py*canvas.width+px)*4+3]!==255)continue;
   checkedPixels++;
   for(let k=0;k<3;k++){const d=Math.abs(actual[i+k]-expected[i+k]);if(d){changed++;if(!first)first={x:px,y:py,channel:k,expected:expected[i+k],actual:actual[i+k]};}max=Math.max(max,d);}
  }
  return {rect:[x,y,w,h],shape:patch===0?'logo':'rectangle',checkedPixels,changedChannels:changed,maxDelta:max,firstDifference:first,pass:changed===0};
 });
 const setLogoRaised=raised=>{if(logoRaised===raised)return;logoRaised=raised;renderFrame(lastTime);};
 setResolution(canvas.width,canvas.height);
 return {renderFrame,checkProtected,metadata,logo,setLogoRaised,setResolution,actionSource:source,get frames(){return frames;},get mode(){return mode;},get cachedBirdFrames(){return birds.reduce((n,b)=>n+b.cachedFrames,0);}};
''' + scene[end:]
write('assets/goi-viet/homepage-scene.js', scene)

native = read('assets/goi-viet/homepage-native.js')
native = replace(native, "const reduced = matchMedia('(prefers-reduced-motion: reduce)');", "const layoutConfig = window.GoiVietHomeLayout;\n  const reduced = matchMedia('(prefers-reduced-motion: reduce)');") if native.count("const reduced = matchMedia('(prefers-reduced-motion: reduce)');") == 1 else native.replace("const reduced = matchMedia('(prefers-reduced-motion: reduce)');", "const layoutConfig = window.GoiVietHomeLayout;\n  const reduced = matchMedia('(prefers-reduced-motion: reduce)');")
start, end = native.index('    const cover = Math.max('), native.index('\n  };', native.index('    const cover = Math.max('))
native = native[:start] + '''    const sw=layoutConfig.width,sh=layoutConfig.height,cover=Math.max(width/sw,height/sh);
    const left=(width-sw*cover)/2,top=(height-sh*cover)/2;
    const safe=layoutConfig.protectedRects.every(([x,y,w,h])=>left+x*cover>=8&&left+(x+w)*cover<=width-8&&top+y*cover>=8&&top+(y+h)*cover<=height-8);
    const scale=safe?cover:Math.min(width/sw,height/sh);
    film.style.setProperty('--home-scene-width',`${sw*scale}px`);film.style.setProperty('--home-scene-height',`${sh*scale}px`);
    film.dataset.sceneFit=safe?'cover':'contain';
    const rasterScale=Math.min(1,scale*(window.devicePixelRatio||1)),rw=Math.round(sw*rasterScale),rh=Math.round(sh*rasterScale);
    if(scene)scene.setResolution(rw,rh);else if(canvas.width!==rw||canvas.height!==rh){canvas.width=rw;canvas.height=rh;}
''' + native[end:]
start, end = native.index('  for (const [id, crop] of ['), native.index('    const button =', native.index('  for (const [id, crop] of ['))
native = native[:start] + "  for (const [id, crop] of Object.entries(layoutConfig.hotspots)) {\n" + native[end:]
native = replace(native, '    if (!button) continue;', '''    if (!button) continue;
    button.style.setProperty('--home-hotspot-x',`${(crop[0]+crop[2]/2)/layoutConfig.width*100}%`);
    button.style.setProperty('--home-hotspot-y',`${(crop[1]+crop[3]/2)/layoutConfig.height*100}%`);
    button.style.setProperty('--home-hotspot-width',`${crop[2]/layoutConfig.width*100}%`);
    button.style.setProperty('--home-hotspot-height',`${crop[3]/layoutConfig.height*100}%`);''')
native = replace(native, "const source = film.dataset.clipReady === 'true' ? scene : still;", "const source = film.dataset.clipReady === 'true' ? film.homeScene.actionSource : still;")
write('assets/goi-viet/homepage-native.js', native)

css = read('assets/goi-viet/homepage-native.css')
css = replace(css, 'aspect-ratio: 1594 / 988;', 'aspect-ratio: 3840 / 2378;')
css = replace(css, '  top: calc(891 / 988 * 100%);\n  height: calc(54 / 988 * 100%);', '''  top: var(--home-hotspot-y);
  left: var(--home-hotspot-x);
  width: var(--home-hotspot-width);
  height: var(--home-hotspot-height);''')
start, end = css.index('#introWelcomeStage #btnHomeStationNorth {'), css.index('#introWelcomeStage .gv-home-hotspot:focus-visible')
css = css[:start] + '#introWelcomeStage #homeLogoEffect { border-radius: 0; cursor: default; }\n' + css[end:]
write('assets/goi-viet/homepage-native.css', css)

html = read('index.html')
assert hashlib.sha256((root/'index.html').read_bytes()).digest() == hashlib.sha256((evidence/'index.before.html').read_bytes()).digest(), 'Homepage changed since initial snapshot'
html = replace(html, 'src="assets/goi-viet/scenery-clean-master.jpg" width="1920" height="1072"', 'src="assets/goi-viet/homepage-scene-4k/edge-landscape.webp" width="3840" height="2378"')
html = replace(html, 'src="assets/goi-viet/homepage-loop-poster.png" width="1594" height="988"', 'src="assets/goi-viet/homepage-scene-4k/poster.webp" width="3840" height="2378"')
html = replace(html, 'id="homeSceneCanvas" width="1594" height="988"', 'id="homeSceneCanvas" width="3840" height="2378"')
html = replace(html, '<script src="assets/goi-viet/homepage-scene.js"></script>', '<script src="assets/goi-viet/homepage-scene-layout.js"></script>\n<script src="assets/goi-viet/homepage-scene.js"></script>')
write('index.html', html)
print('Updated native 4K coordinates, adaptive raster resolution and image assets; preserved motion and UI flow')
