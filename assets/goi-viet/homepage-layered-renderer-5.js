// Preview 3 copy: every layer is decoded once into an ImageBitmap, so playback never re-decodes it.
// Continuous terrain entrance; independent alpha sprites provide ambient motion.
// No WebGL, UV displacement or landscape warp.
(() => {
  const makeCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
  const load=(url,name)=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error('Không tải được '+name));i.src=url;});
  window.LandscapeLab={async create(canvas,manifest,bundle,options={}){
    const managed=!!options.managed;
    const W=manifest.width,H=manifest.height,ctx=canvas.getContext('2d',{alpha:false});
    if(!ctx)throw new Error('Không có Canvas 2D.');
    const images=new Map();await Promise.all(manifest.layers.map(async l=>images.set(l.id,await load(bundle[l.file]||l.file,l.label))));
    // A displayed bird layer must keep the manifest's draw order.
    const birdLayers=manifest.layers.filter(l=>l.kind==='bird');
    const birdsOnTop=birdLayers.length&&manifest.layers.every(l=>l.kind==='bird'||l.z<=Math.min(...birdLayers.map(b=>b.z)));
    const craneFlight=window.GoiVietCraneFlight?await window.GoiVietCraneFlight.create({sceneCanvas:birdsOnTop?canvas:null}).catch(()=>null):null;
    const portraitFlight=matchMedia('(max-width: 600px) and (orientation: portrait)');
    const portraitSky=document.body.dataset.previewVersion==='3'?{y:.39,scale:.72}:{y:.67,scale:.60};
    canvas.dataset.craneAnimation=craneFlight?'approved-ivory-gold':'legacy';
    // The palace cutout includes a fragment of the train from the source painting.
    // Remove that overlap using the train's own alpha, before either layer enters.
    const palace=manifest.layers.find(l=>l.id==='hue'),trainLayer=manifest.layers.find(l=>l.id==='train');
    if(palace&&trainLayer&&!manifest.palaceTrainOverlapCleaned){
      const im=images.get(palace.id),clean=makeCanvas(im.width,im.height),g=clean.getContext('2d');
      g.drawImage(im,0,0);g.globalCompositeOperation='destination-out';
      const sx=im.width/palace.rect[2],sy=im.height/palace.rect[3];
      g.drawImage(images.get('train'),(trainLayer.rect[0]-palace.rect[0])*sx,(trainLayer.rect[1]-palace.rect[1])*sy,trainLayer.rect[2]*sx,trainLayer.rect[3]*sy);
      images.set(palace.id,clean);
    }
    // Chrome may discard the decoded pixels of large <img> layers and decode them again on the main thread
    // mid-intro (0.7–0.8 s each on slow CPUs). createImageBitmap decodes off the main thread and keeps them.
    await Promise.all([...images].map(async([id,im])=>{if(im instanceof HTMLImageElement&&window.createImageBitmap){try{images.set(id,await createImageBitmap(im));}catch(_){}}}));
    let reference=!managed&&manifest.reference?await load(bundle[manifest.reference]||manifest.reference,'ảnh tham chiếu'):null;
    let outline=!managed&&manifest.outline?await load(bundle[manifest.outline]||manifest.outline,'đường viền núi'):null;
    const referenceLoads={};
    function loadOptional(kind){
      if(!managed||!manifest[kind]||referenceLoads[kind])return;
      referenceLoads[kind]=load(bundle[manifest[kind]]||manifest[kind],kind).then(im=>{if(kind==='reference')reference=im;else outline=im;}).catch(()=>{});
    }
    const enabled=new Set(manifest.layers.map(l=>l.id));let wind=manifest.motionDefaults?.wind??.85,checker=false,showOutline=false,showReference=false;
    const motion=['cloud','tree','bird','leaf','smoke'];
    const ordered=manifest.layers.slice().sort((a,b)=>a.z-b.z),layerById=new Map(manifest.layers.map(l=>[l.id,l]));
    const paperLayers=ordered.filter(l=>l.kind==='sky'),objectLayers=ordered.filter(l=>l.kind!=='sky');
    let occlusion=true;
    const smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
    // Keep all terrain registered, but reveal its visible depth regions at
    // different times. A mist transition hides contacts between those regions;
    // these runtime masks never replace the original object-contour assets.
    function terrainPose(introTime){
      const travel=introTime===null?0:1-smooth((introTime-.2)/3.15);
      return {a:1,x:0,y:0,s:1+.018*travel,ax:W/2,ay:H};
    }
    const terrainLayers=ordered.filter(l=>l.kind==='mountain'||l.kind==='terrain');
    let atmosphere=null,revealField=null,projectedField=null,revealWeights=null,revealPixels=null;
    function* prepareRevealSteps(){
      const rw=managed?480:Math.min(480,canvas.width),rh=Math.max(1,Math.round(rw*(managed?H/W:canvas.height/canvas.width)));
      revealField=makeCanvas(rw,rh);projectedField=makeCanvas(rw,rh);revealPixels=revealField.getContext('2d').createImageData(rw,rh);const masks=[];
      const rect=l=>[l.rect[0]*rw/W,l.rect[1]*rh/H,l.rect[2]*rw/W,l.rect[3]*rh/H];
      // Visible ownership comes from true object alpha and draw order. Hidden
      // foothill paint must not accidentally reveal a later mountain early.
      for(let i=-1;i<terrainLayers.length;i++){
        const mask=makeCanvas(rw,rh),g=mask.getContext('2d');
        if(i<0){g.fillStyle='white';g.fillRect(0,0,rw,rh);}
        else{const l=terrainLayers[i];g.drawImage(images.get(l.id),...rect(l));g.globalCompositeOperation='source-in';g.fillStyle='white';g.fillRect(0,0,rw,rh);}
        g.globalCompositeOperation='destination-out';
        for(let j=i+1;j<terrainLayers.length;j++){const l=terrainLayers[j];g.drawImage(images.get(l.id),...rect(l));}
        const soft=makeCanvas(rw,rh),s=soft.getContext('2d');s.filter=`blur(${rw/1594*52}px)`;s.drawImage(mask,0,0);
        masks.push({id:i<0?'sky':terrainLayers[i].id,pixels:s.getImageData(0,0,rw,rh).data});
        yield;
      }
      // Normalize the feathered ownership: neighbouring depths add up to one,
      // so fully revealed areas cannot retain a pale seam between mountains.
      const n=rw*rh;revealWeights=masks.map(m=>({id:m.id,weights:new Float32Array(n)}));
      for(let p=0;p<n;p++){let total=0;for(const m of masks)total+=m.pixels[p*4+3];
        if(!total)revealWeights[0].weights[p]=1;
        else masks.forEach((m,i)=>revealWeights[i].weights[p]=m.pixels[p*4+3]/total);
        if(p%2048===0)yield;
      }
    }
    function prepareReveal(){for(const step of prepareRevealSteps()){} }
    let preparation=null;
    function prepare(){
      if(preparation)return preparation;
      preparation=new Promise((resolve,reject)=>{
        const steps=prepareRevealSteps();
        const schedule=()=>window.requestIdleCallback?requestIdleCallback(tick,{timeout:250}):setTimeout(()=>tick({didTimeout:true,timeRemaining:()=>3}),0);
        function tick(deadline){
          if(document.hidden){document.addEventListener('visibilitychange',schedule,{once:true});return;}
          const start=performance.now();
          try{do{if(steps.next().done){
            // Upload the cold art before exposing a ready scene. Both paints
            // occur in one task, so the waiting screen remains blank paper.
            render(24);render(0,{introDuration:10});resolve();return;
          }}while(performance.now()-start<3&&(deadline.didTimeout||deadline.timeRemaining()>1));schedule();}catch(error){reject(error);}
        }
        schedule();
      });return preparation;
    }
    let atmosphereLightKey='',atmospherePixels=null,atmosphereAcc=null,atmosphereTmp=null,atmosphereSource=null,atmospherePrefix=[];
    function drawAtmosphere(introTime){
      if(introTime===null||introTime>=6.1)return;
      const cw=canvas.width,ch=canvas.height;
      if(!atmosphere||atmosphere.width!==cw||atmosphere.height!==ch){release(atmosphere);atmosphere=makeCanvas(cw,ch);if(!managed||!revealWeights)prepareReveal();}
      const light=revealWeights.map(({id})=>{const timing=id==='sky'?[.05,1.1]:layerById.get(id).entrance;return smooth((introTime-timing[0])/(timing[1]-timing[0]));});
      const f=revealField.getContext('2d'),field=revealPixels;
      const lightKey=light.join(',');
      if(lightKey!==atmosphereLightKey||field!==atmospherePixels){
        atmosphereLightKey=lightKey;atmospherePixels=field;
        const weights=[],gains=[],ids=[];
        for(let i=0;i<revealWeights.length;i++)if(light[i]!==0){weights.push(revealWeights[i].weights);gains.push(light[i]);ids.push(i);}
        // Layers are revealed in list order, so the fully revealed ones (gain exactly 1) form a prefix of this list. Their running sum is
        // cached and only the remaining layers are added per frame. Additions happen in the same order as the original per-pixel loop,
        // so every alpha byte is identical (verified bit-for-bit); the cache is rebuilt whenever its layers are no longer that prefix.
        const n=field.data.length/4;let m=0;while(m<gains.length&&gains[m]===1)m++;
        if(atmosphereSource!==revealWeights||!atmosphereAcc||atmosphereAcc.length!==n){atmosphereSource=revealWeights;atmosphereAcc=new Float64Array(n);atmospherePrefix=[];}
        let k=0;while(k<atmospherePrefix.length&&k<m&&atmospherePrefix[k]===ids[k])k++;
        if(k!==atmospherePrefix.length){atmosphereAcc.fill(0);atmospherePrefix=[];k=0;}
        for(let i=k;i<m;i++){const w=weights[i],a=atmosphereAcc;for(let p=0;p<n;p++)a[p]+=w[p]*1;atmospherePrefix.push(ids[i]);}
        // The layers still changing are added, in the same order, onto a copy of the cached sum. Math.round was the slowest part of this loop:
        // (x+0.5)|0 equals it except when x+0.5 was itself rounded up to an integer (y===r); only then Math.round is called, so the bytes are identical
        // (checked on 3.6M values incl. every k+0.5 +-3 ulp, and live against the original loop on the real weights).
        {const t=atmosphereTmp&&atmosphereTmp.length===n?atmosphereTmp:(atmosphereTmp=new Float64Array(n)),count=weights.length,d=field.data;t.set(atmosphereAcc);
          for(let j=m;j<count;j++){const w=weights[j],g=gains[j];for(let p=0;p<n;p++)t[p]+=w[p]*g;}
          for(let p=0;p<n;p++){const x=255*(1-t[p]),y=x+0.5,r=y|0;d[p*4+3]=y===r?Math.round(x):r;}}
        f.putImageData(field,0,0);
      }
      const g=atmosphere.getContext('2d');g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.globalCompositeOperation='source-over';g.imageSmoothingQuality='high';g.clearRect(0,0,cw,ch);
      g.drawImage(images.get('sky'),0,0,cw,ch);
      const state=terrainPose(introTime),r=projectedField.getContext('2d'),rw=projectedField.width,rh=projectedField.height;
      r.setTransform(1,0,0,1,0,0);r.clearRect(0,0,rw,rh);r.setTransform(state.s,0,0,state.s,rw*.5*(1-state.s),rh*(1-state.s));r.drawImage(revealField,0,0);
      g.globalCompositeOperation='destination-in';g.drawImage(projectedField,0,0,cw,ch);
      if(craneFlight?.layered){
        // The original mist stays above scenery AND birds during the entrance.
        // Display its existing canvas directly, without an extra image copy.
        if(!atmosphere.isConnected){atmosphere.className='gv-home-scene-overlay';atmosphere.dataset.homeSceneLayer='mist';atmosphere.setAttribute('aria-hidden','true');canvas.parentElement.append(atmosphere);}
        atmosphere.hidden=false;
      }else{
        atmosphere.remove();ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.drawImage(atmosphere,0,0);ctx.restore();
      }
    }
    function arrival(l,introTime){
      if(introTime===null)return {a:1,x:0,y:0,s:1,ax:0,ay:0};
      if(l.kind==='mountain'||l.kind==='terrain')return terrainPose(introTime);
      let timing=l.entrance;
      if(!timing){
        if(l.kind==='sky')timing=[.05,1.05,0];
        else if(l.kind==='fixed')timing=l.id==='bridge'?[3.9,5.85,0]:l.id==='train'?[4.15,5.7,0]:l.id==='hanoi'?[2.8,4.9,0]:l.id==='hue'?[3.05,5.25,0]:[3.2,5.4,0];
        else if(l.kind==='tree')timing=l.id.includes('left')?[3.15,5.4,0]:[3.65,5.9,0];
        else if(l.kind==='bird')timing=l.id==='bird-one'?[1.8,3.4,0]:[2.45,4.1,0];
        else if(l.kind==='leaf')timing=[3.6,5.1,0];
        else timing=[3.8,5.5,0];
      }
      const p=Math.max(0,Math.min(1,(introTime-timing[0])/(timing[1]-timing[0]))),travel=1-smooth(p);
      // Architecture dissolves at its final coordinates. Moving sprites become
      // visible early in their lateral approach, then continue into ambient motion.
      const a=l.kind==='sky'||l.kind==='fixed'||l.kind==='bird'?smooth(p):smooth(p/.28);
      const side=l.id.includes('left')?-1:l.id.includes('right')?1:(l.rect[0]+l.rect[2]/2<W/2?-1:1);
      let x=0,y=timing[2]*(1-smooth(p))*H/987,s=1,ax=0,ay=0;
      if(l.kind==='cloud'){
        const edges=l.clippedEdges||[],left=edges.includes('left'),right=edges.includes('right');
        const distance=l.cloudType==='sky'?.19:l.cloudType==='ridge'?.10:.035;
        x=left&&right?0:(left?-1:right?1:side)*W*distance*travel;
      }else if(l.kind==='leaf')x=side*W*.065*travel;
      else if(l.kind==='tree'){
        const parent=layerById.get(l.id.includes('valley')?'river-valley':'mountains-mid-'+(side<0?'left':'right'));
        const state=parent&&arrival(parent,introTime);
        if(state){x=state.x;y=state.y;s=state.s;ax=state.ax;ay=state.ay;}
      }else if(l.kind==='fixed'&&!['bridge','train'].includes(l.id)){
        x=0;y=0;s=1;ax=0;ay=0;
      }else if(['bridge','train','smoke'].includes(l.id)){
        x=0;y=0;s=1;ax=0;ay=0;
        if(l.kind==='smoke')return {...arrival(layerById.get('train'),introTime)};
      }
      if(l.kind==='leaf'){s=.82+.18*smooth(p);ax=W/2;ay=H*.25;}
      if(l.kind==='cloud'){
        const left=l.rect[0]===0,right=l.rect[0]+l.rect[2]===W;
        if(left&&!right)x=Math.min(x,0);else if(right&&!left)x=Math.max(x,0);
      }
      return {a,x,y,s,ax,ay};
    }
    function pose(state){ctx.transform(state.s,0,0,state.s,state.x+state.ax*(1-state.s),state.y+state.ay*(1-state.s));}
    function contourPath(contour,state){
      const [dw,dh]=manifest.occlusionDesign||[1594,987];
      for(const [op,...v]of contour.commands){
        const x=i=>(v[i]*W/dw-state.ax)*state.s+state.ax+state.x,y=i=>(v[i]*H/dh-state.ay)*state.s+state.ay+state.y;
        if(op==='M')ctx.moveTo(x(0),y(1));else if(op==='L')ctx.lineTo(x(0),y(1));
        else if(op==='Q')ctx.quadraticCurveTo(x(0),y(1),x(2),y(3));else if(op==='Z')ctx.closePath();
      }
    }
    function clipOccluders(l,introTime){
      const partial=[];if(!occlusion)return partial;
      for(const id of l.occlusion||[]){
        const contour=manifest.occlusionContours?.[id],parent=contour&&layerById.get(contour.parent);
        if(!parent||!enabled.has(parent.id))continue;
        const state=arrival(parent,introTime);if(!state.a)continue;
        ctx.beginPath();ctx.rect(0,0,W,H);
        contourPath(contour,state);
        // Follow the rigid foreground mountain during entry, then remain in
        // world coordinates during ambient cloud motion.
        ctx.clip('evenodd');
        if(state.a<1)partial.push({contour,state});
      }
      return partial;
    }
    const birdCaches=new Map(),treeCaches=new Map(),spriteSources=new Map();
    const cacheLimit=32*1024*1024,lru=new Map(),jobs=new Map();
    let cacheBytes=0,idle=0,suspended=false,built=0,drawMisses=0,maxBuildMS=0;
    const release=c=>{if(c instanceof HTMLCanvasElement){c.width=1;c.height=1;if(c.dataset.homeSceneLayer)c.remove();}};
    function clearMotion(){
      craneFlight?.clear();
      for(const entry of lru.values())release(entry.frame.canvas);
      lru.clear();cacheBytes=0;treeCaches.clear();birdCaches.clear();
      for(const im of spriteSources.values())if(![...images.values()].includes(im))release(im);
      spriteSources.clear();
    }
    function cancelWarm(){if(idle){if(window.requestIdleCallback)cancelIdleCallback(idle);else clearTimeout(idle);}idle=0;jobs.clear();}
    function scheduleWarm(){
      if(!managed||idle||suspended||document.hidden||!jobs.size)return;
      const run=deadline=>{
        idle=0;if(suspended||document.hidden)return;
        if(!deadline.didTimeout&&deadline.timeRemaining()<3){scheduleWarm();return;}
        const [id,job]=jobs.entries().next().value;jobs.delete(id);
        const start=performance.now();job();built++;maxBuildMS=Math.max(maxBuildMS,performance.now()-start);
        scheduleWarm();
      };
      // One indivisible mesh frame per idle slice; never drain the whole queue.
      idle=window.requestIdleCallback?requestIdleCallback(run,{timeout:250}):setTimeout(()=>run({didTimeout:true}),50);
    }
    function cached(cache,id,key,build,source,period=0){
      const tag=id+':'+key;
      if(cache.has(key)){const entry=lru.get(tag);if(entry){lru.delete(tag);lru.set(tag,entry);}return cache.get(key);}
      drawMisses++;
      if(!jobs.has(tag)&&jobs.size<96){jobs.set(tag,()=>{
        const frame=build(),bytes=frame.canvas.width*frame.canvas.height*4;
        if(bytes>cacheLimit){release(frame.canvas);return;}
        while(cacheBytes+bytes>cacheLimit&&lru.size){const [old,entry]=lru.entries().next().value;lru.delete(old);entry.cache.delete(entry.key);cacheBytes-=entry.bytes;release(entry.frame.canvas);}
        cache.set(key,frame);lru.set(tag,{cache,key,frame,bytes});cacheBytes+=bytes;
      });scheduleWarm();}
      // Existing neighbouring poses keep motion live while a missing pose is
      // prepared. A cold sprite can always draw its original alpha image.
      let nearest=null,distance=Infinity;
      for(const [k,frame]of cache){let d=Math.abs(k-key);if(period)d=Math.min(d,period-d);if(d<distance){nearest=frame;distance=d;}}
      return nearest||{canvas:source,padding:0};
    }
    function spriteImage(l){
      if(spriteSources.has(l.id))return spriteSources.get(l.id);
      const source=images.get(l.id),width=Math.min(source.width,Math.max(1,Math.ceil(l.rect[2]*canvas.width/W)));
      if(width===source.width){spriteSources.set(l.id,source);return source;}
      const scaled=makeCanvas(width,Math.max(1,Math.round(source.height*width/source.width))),g=scaled.getContext('2d');
      g.imageSmoothingQuality='high';g.drawImage(source,0,0,scaled.width,scaled.height);spriteSources.set(l.id,scaled);return scaled;
    }
    function triangle(g,im,s,d){
      const [p0,p1,p2]=s,[q0,q1,q2]=d,det=(p1.x-p0.x)*(p2.y-p0.y)-(p2.x-p0.x)*(p1.y-p0.y);
      const a=((q1.x-q0.x)*(p2.y-p0.y)-(q2.x-q0.x)*(p1.y-p0.y))/det;
      const c=((q2.x-q0.x)*(p1.x-p0.x)-(q1.x-q0.x)*(p2.x-p0.x))/det;
      const b=((q1.y-q0.y)*(p2.y-p0.y)-(q2.y-q0.y)*(p1.y-p0.y))/det;
      const e=((q2.y-q0.y)*(p1.x-p0.x)-(q1.y-q0.y)*(p2.x-p0.x))/det;
      g.save();g.beginPath();const cx=(q0.x+q1.x+q2.x)/3,cy=(q0.y+q1.y+q2.y)/3;
      d.forEach((q,i)=>{const x=q.x+(q.x-cx)*.008,y=q.y+(q.y-cy)*.008;i?g.lineTo(x,y):g.moveTo(x,y);});g.closePath();g.clip();
      g.transform(a,b,c,e,q0.x-a*p0.x-c*p0.y,q0.y-b*p0.x-e*p0.y);g.drawImage(im,0,0);g.restore();
    }
    function deformSprite(im,vertex,cols=6,rows=12,padding=20){
      const c=makeCanvas(im.width+padding*2,im.height+padding*2),g=c.getContext('2d');g.translate(padding,padding);
      for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
        const a={x:x*im.width/cols,y:y*im.height/rows},b={x:(x+1)*im.width/cols,y:a.y},e={x:a.x,y:(y+1)*im.height/rows},d={x:b.x,y:e.y};
        triangle(g,im,[a,b,e],[vertex(a.x,a.y),vertex(b.x,b.y),vertex(e.x,e.y)]);
        triangle(g,im,[b,d,e],[vertex(b.x,b.y),vertex(d.x,d.y),vertex(e.x,e.y)]);
      }
      return {canvas:c,padding};
    }
    function treePoint(l,x,y,amount){
      const im=spriteImage(l),h=Math.max(0,(im.height*.78-y)/(im.height*.78)),bend=h*h;
      const smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
      const edgeWidth=Math.max(30,im.width*.24),edges=l.clippedEdges||[];
      // The cut source border stays at the frame border. Only the intact
      // canopy moves; both cropped sides and the lower 22% stay anchored.
      const edge=(edges.includes('left')?smooth(x/edgeWidth):1)*(edges.includes('right')?smooth((im.width-x)/edgeWidth):1);
      return {x:x+(l.amplitude||5)*im.width/l.rect[2]*amount*bend*edge,y};
    }
    function tree(l,t){
      const im=spriteImage(l),phase=t*Math.PI*2/(l.period||7)+(l.phase||0),amount=Math.sin(phase)*wind;
      const steps=managed?16:8,key=Math.round(amount*steps),cache=treeCaches.get(l.id)||new Map();treeCaches.set(l.id,cache);
      if(managed)return cached(cache,l.id,key,()=>deformSprite(im,(x,y)=>treePoint(l,x,y,key/steps),6,12,Math.ceil((l.amplitude||5)*im.width/l.rect[2]*1.5)+6),im);
      if(cache.has(key))return cache.get(key);
      const frame=deformSprite(im,(x,y)=>treePoint(l,x,y,key/8),6,12,Math.ceil((l.amplitude||5)*im.width/l.rect[2]*1.5)+6);
      cache.set(key,frame);if(cache.size>25)cache.delete(cache.keys().next().value);return frame;
    }
    function birdWingBeat(l,t){
      if(craneFlight)return craneFlight.beat(l,t);
      // Continuous strokes: a quicker downstroke and a slower recovery, without
      // the old multi-second hold. Slow modulation keeps the pair out of sync.
      const trailing=l.direction===-1,offset=trailing?1.9:0;
      const phase=t*Math.PI*2/(trailing?1.72:1.58)+offset+.18*Math.sin(t*.53+offset);
      const amplitude=.94+.06*Math.sin(t*.71+offset);
      return Math.sin(phase+.20*Math.sin(phase))*amplitude;
    }
    function bird(l,t){
      const count=managed?48:24,im=spriteImage(l),k=Math.round(birdWingBeat(l,t)*count/2),cache=birdCaches.get(l.id)||new Map();birdCaches.set(l.id,cache);
      if(!managed&&cache.has(k))return cache.get(k);
      const flap=k/(count/2);
      const build=()=>deformSprite(im,(x,y)=>{
        const h=Math.max(0,Math.min(1,(im.height*.64-y)/(im.height*.58))),body=Math.max(0,Math.min(1,(im.width*.74-x)/(im.width*.16))),weight=h*(y>im.height*.48?body:1);
        return {x:x+(x-im.width*.5)*.18*flap*weight,y:y+(im.height*.66-y)*.68*flap*weight};
      },8,8,Math.ceil(Math.max(im.height*.48,im.width*.10))+8);
      if(managed)return cached(cache,l.id,k,build,im);
      const frame=build();
      cache.set(k,frame);return frame;
    }
    function birdTravelTime(l,t){
      const duration=l.entryMotion?.rampSeconds??4.5,initial=l.entryMotion?.initialSpeed??.65;
      // Integrate a smooth speed ramp. Keep the accumulated time offset during
      // ambient motion so finishing the intro never jumps position or velocity.
      if(t>=duration)return t-(1-initial)*duration*.5;
      const u=Math.max(0,t/duration);
      return initial*t+(1-initial)*duration*(u*u*u-.5*u*u*u*u);
    }
    function birdPose(l,t){
      const p=((birdTravelTime(l,t)/((l.period||25)*(craneFlight?1.12:1))+(l.phase||0))%1+1)%1;
      const trailing=l.direction===-1,phase=p*Math.PI*2+(trailing?1.15:-.65);
      const portrait=!!craneFlight&&portraitFlight.matches;
      const distance=W+1000,amplitude=H*(craneFlight?(trailing ? .055 : .045):(trailing ? .082 : .07)),ripple=H*(craneFlight ? .006 : .014);
      const flap=birdWingBeat(l,t);
      // The portrait cover crop has its own open sky below the station links.
      const y=portrait?H*(portraitSky.y+.012*Math.sin(phase)+(trailing ? .014 : 0))-l.rect[3]/2:
        l.rect[1]+H*.065+amplitude*Math.sin(phase)+ripple*Math.sin(phase*2-.4)+H*(craneFlight ? .0008 : .003)*flap;
      const dy=portrait?H*.012*Math.PI*2*Math.cos(phase):amplitude*Math.PI*2*Math.cos(phase)+ripple*Math.PI*4*Math.cos(phase*2-.4);
      return {
        x:trailing?W+500-distance*p:-500+distance*p,
        y,
        // Follow the path tangent; a small bank and slow depth change soften the turn.
        angle:Math.atan2(dy,distance)+(craneFlight ? .012 : .035)*Math.sin(phase-.6),
        scale:((trailing?.88:.98)+.10*Math.sin(phase-.8))*(portrait ? portraitSky.scale : 1),
        flap
      };
    }
    function draw(l,t,introTime){
      if(!enabled.has(l.id))return;const im=l.kind==='tree'||(l.kind==='bird'&&!craneFlight)?spriteImage(l):images.get(l.id),[x,y,w,h]=l.rect;
      const enter=arrival(l,introTime);if(!enter.a)return;
      ctx.save();
      ctx.globalAlpha=enter.a;
      if(l.kind==='cloud'){
        ctx.globalAlpha*=l.opacity??1;
        const p=t*Math.PI*2/(l.period||54),a=(l.amplitude||25)*wind,phase=l.phase||0;
        const edges=l.clippedEdges||[],left=edges.includes('left'),right=edges.includes('right');
        // A cloud clipped in the source must never expose its flat cut inside
        // the scene. The cosine drift has zero velocity at both turnarounds.
        const dx=(left&&right?0:left?-a*(1-Math.cos(p)):right?a*(1-Math.cos(p)):a*(Math.sin(p+phase)-Math.sin(phase)))+enter.x;
        ctx.save();const partial=clipOccluders(l,introTime);ctx.translate(dx,enter.y);ctx.drawImage(im,x,y,w,h);ctx.restore();
        // A mountain fading into view occludes proportionally. This avoids a
        // sudden cloud cut when its stationary foreground ridge first appears.
        for(const {contour,state}of partial){ctx.save();ctx.beginPath();contourPath(contour,state);ctx.clip();ctx.globalAlpha*=1-state.a;ctx.translate(dx,enter.y);ctx.drawImage(im,x,y,w,h);ctx.restore();}
      }else if(l.kind==='tree'){
        pose(enter);
        const f=tree(l,t),scale=w/im.width;
        ctx.drawImage(f.canvas,x-f.padding*scale,y-f.padding*scale,f.canvas.width*scale,f.canvas.height*scale);
      }else if(l.kind==='bird'){
        pose(enter);
        const f=craneFlight?null:bird(l,t),flight=birdPose(l,t),px=flight.x,py=flight.y;
        // The unframed preview-3 invitation needs quiet sky behind its lettering.
        // Keep each flight and wingbeat; fade only while its sprite crosses copy.
        if(options.copySafeArea&&l.copySafeArea!==false){
          const pad=(f?.padding||0)*w/im.width;
          const cover=smooth((px+w+pad-W*.23)/(W*.07))*smooth((W*.77-px+pad)/(W*.07));
          ctx.globalAlpha*=1-cover;
        }
        ctx.translate(px+w/2,py+h/2);
        if(l.direction===-1)ctx.scale(-1,1);
        ctx.rotate(flight.angle);ctx.scale(flight.scale,flight.scale);
        if(craneFlight)craneFlight.draw(ctx,l,t,w);
        else{const s=w/im.width;ctx.drawImage(f.canvas,-w/2-f.padding*s,-h/2-f.padding*s,f.canvas.width*s,f.canvas.height*s);}
      }else if(l.kind==='leaf'){
        pose(enter);
        const p=((t/(l.period||28)+(l.phase||0))%1+1)%1,fade=Math.min(1,p*10,(1-p)*10);
        const phase=l.phase||0,bob=Math.sin(p*Math.PI*4+phase*5);
        ctx.globalAlpha*=fade*(l.opacity??.8);ctx.translate(x+(l.direction||1)*(l.travelX||150)*wind*p+24*bob,y+p*(l.travelY||520)+16*Math.sin(p*Math.PI*2+phase*4));
        ctx.rotate(phase*4+p*Math.PI*1.6+.18*Math.sin(t*1.2+phase*5));ctx.drawImage(im,-w/2,-h/2,w,h);
      }else if(l.kind==='smoke'){
        pose(enter);
        for(let i=0;i<9;i++){
          const p=((t/6+i/9)%1+1)%1,size=.35+p*2.0;
          ctx.save();ctx.globalAlpha*=Math.sin(p*Math.PI)*.5;ctx.translate(x+p*150*wind,y-p*115);ctx.drawImage(im,-w*size/2,-h*size/2,w*size,h*size);ctx.restore();
        }
      }else if(l.id==='train'&&l.spriteParts){
        // Keep original painted volume. Register each carriage on the same rail
        // through placement alone, without warping the generated artwork.
        ctx.save();pose(enter);
        for(const [left,right,down]of l.spriteParts){
          const part=right-left;
          ctx.drawImage(im,left*im.width,0,part*im.width,im.height,x+left*w,y+down*h,part*w,h);
        }
        ctx.restore();
      }else{
        // The terrain shares a subtle uniform approach and stays fixed afterwards.
        ctx.save();const partial=clipOccluders(l,introTime);pose(enter);ctx.drawImage(im,x,y,w,h);ctx.restore();
        for(const {contour,state}of partial){ctx.save();ctx.beginPath();contourPath(contour,state);ctx.clip();ctx.globalAlpha*=1-state.a;pose(enter);ctx.drawImage(im,x,y,w,h);ctx.restore();}
      }
      ctx.restore();
    }
    function render(t=0,options={}){
      if(managed&&suspended)return;
      const introTime=options.introDuration&&t<options.introDuration?t*12/options.introDuration:null;
      craneFlight?.beginFrame();
      if(atmosphere&&(introTime===null||introTime<=.05||introTime>=6.1||showReference))atmosphere.hidden=true;
      ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);ctx.imageSmoothingQuality='high';
      if(introTime!==null){const paper=ctx.createLinearGradient(0,0,W,H);paper.addColorStop(0,'#fae1c6');paper.addColorStop(.45,'#fff1cf');paper.addColorStop(1,'#f5e6c8');ctx.fillStyle=paper;}
      else ctx.fillStyle=checker?'#c5cbc1':'#f8ebd1';
      ctx.fillRect(0,0,W,H);
      if(introTime!==null&&introTime<=.05)return;
      if(checker){ctx.fillStyle='#edf0e8';const s=36;for(let y=0;y<H;y+=s)for(let x=0;x<W;x+=s)if((Math.floor(x/s)+Math.floor(y/s))%2===0)ctx.fillRect(x,y,s,s);}
      if(showReference&&reference){ctx.drawImage(reference,0,0,W,H);return;}
      // The paper remains still, with no full-image zoom or vertical wipe.
      for(const l of paperLayers)draw(l,t,introTime);
      for(const l of objectLayers)draw(l,t,introTime);
      drawAtmosphere(introTime);
      if(managed&&(introTime===null||introTime>=6.1)&&atmosphere){
        release(atmosphere);atmosphere=null;
      }
      if(showOutline&&outline){ctx.save();pose(terrainPose(introTime));ctx.drawImage(outline,0,0,W,H);ctx.restore();}
    }
    function resolution(w){w=Math.min(W,Math.max(320,Math.round(w)));const h=Math.round(w*H/W);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;if(managed){cancelWarm();clearMotion();}else{spriteSources.clear();treeCaches.clear();birdCaches.clear();}release(atmosphere);atmosphere=null;}}
    const lifecycle=managed?{
      prepare,
      suspend(){if(suspended)return;suspended=true;cancelWarm();clearMotion();release(atmosphere);atmosphere=null;},
      resume(){if(!suspended)return false;suspended=false;scheduleWarm();return true;},
      inspect:()=>({suspended,cacheBytes,cacheLimit,revealBytes:(revealWeights||[]).reduce((n,c)=>n+c.weights.byteLength,0)+(revealPixels?.data.byteLength||0)+(revealField?.width||0)*(revealField?.height||0)*8,pending:jobs.size,built,drawMisses,maxBuildMS,referenceDecoded:!!reference,outlineDecoded:!!outline,spritePixels:[...spriteSources.values()].reduce((n,c)=>n+c.width*c.height,0),cranes:craneFlight?.inspect()??null})
    }:{};
    return {render,resolution,enabled,manifest,images,treePoint,...lifecycle,setOcclusion:v=>occlusion=v,setWind:v=>{wind=v;if(managed){cancelWarm();clearMotion();}else treeCaches.clear();},setChecker:v=>checker=v,setOutline:v=>{showOutline=v;if(v)loadOptional('outline');},setReference:v=>{showReference=v;if(v)loadOptional('reference');},isMoving:l=>motion.includes(l.kind),get cachedFrames(){return [...treeCaches.values(),...birdCaches.values()].reduce((n,c)=>n+c.size,0);}};
  }};
})();
