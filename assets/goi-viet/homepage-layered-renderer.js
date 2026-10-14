// Continuous terrain entrance; independent alpha sprites provide ambient motion.
// No WebGL, UV displacement or landscape warp.
(() => {
  const makeCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
  const load=(url,name)=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error('Không tải được '+name));i.src=url;});
  window.LandscapeLab={async create(canvas,manifest,bundle){
    const W=manifest.width,H=manifest.height,ctx=canvas.getContext('2d',{alpha:false});
    if(!ctx)throw new Error('Không có Canvas 2D.');
    const images=new Map();await Promise.all(manifest.layers.map(async l=>images.set(l.id,await load(bundle[l.file]||l.file,l.label))));
    const reference=manifest.reference?await load(bundle[manifest.reference]||manifest.reference,'ảnh tham chiếu'):null;
    const outline=manifest.outline?await load(bundle[manifest.outline]||manifest.outline,'đường viền núi'):null;
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
    function prepareReveal(){
      const rw=Math.min(480,canvas.width),rh=Math.max(1,Math.round(rw*canvas.height/canvas.width));
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
      }
      // Normalize the feathered ownership: neighbouring depths add up to one,
      // so fully revealed areas cannot retain a pale seam between mountains.
      const n=rw*rh;revealWeights=masks.map(m=>({id:m.id,weights:new Float32Array(n)}));
      for(let p=0;p<n;p++){let total=0;for(const m of masks)total+=m.pixels[p*4+3];
        if(!total){revealWeights[0].weights[p]=1;continue;}
        masks.forEach((m,i)=>revealWeights[i].weights[p]=m.pixels[p*4+3]/total);
      }
    }
    function drawAtmosphere(introTime){
      if(introTime===null||introTime>=6.1)return;
      const cw=canvas.width,ch=canvas.height;
      if(!atmosphere||atmosphere.width!==cw||atmosphere.height!==ch){atmosphere=makeCanvas(cw,ch);prepareReveal();}
      const light=revealWeights.map(({id})=>{const timing=id==='sky'?[.05,1.1]:layerById.get(id).entrance;return smooth((introTime-timing[0])/(timing[1]-timing[0]));});
      const f=revealField.getContext('2d'),field=revealPixels;
      for(let p=0;p<field.data.length/4;p++){let visible=0;for(let i=0;i<revealWeights.length;i++)visible+=revealWeights[i].weights[p]*light[i];field.data[p*4+3]=Math.round(255*(1-visible));}
      f.putImageData(field,0,0);
      const g=atmosphere.getContext('2d');g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.globalCompositeOperation='source-over';g.imageSmoothingQuality='high';g.clearRect(0,0,cw,ch);
      g.drawImage(images.get('sky'),0,0,cw,ch);
      const state=terrainPose(introTime),r=projectedField.getContext('2d'),rw=projectedField.width,rh=projectedField.height;
      r.setTransform(1,0,0,1,0,0);r.clearRect(0,0,rw,rh);r.setTransform(state.s,0,0,state.s,rw*.5*(1-state.s),rh*(1-state.s));r.drawImage(revealField,0,0);
      g.globalCompositeOperation='destination-in';g.drawImage(projectedField,0,0,cw,ch);
      ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.drawImage(atmosphere,0,0);ctx.restore();
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
    const birdCaches=new Map(),treeCaches=new Map();
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
      const im=images.get(l.id),h=Math.max(0,(im.height*.78-y)/(im.height*.78)),bend=h*h;
      const smooth=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
      const edgeWidth=Math.max(30,im.width*.24),edges=l.clippedEdges||[];
      // The cut source border stays at the frame border. Only the intact
      // canopy moves; both cropped sides and the lower 22% stay anchored.
      const edge=(edges.includes('left')?smooth(x/edgeWidth):1)*(edges.includes('right')?smooth((im.width-x)/edgeWidth):1);
      return {x:x+(l.amplitude||5)*im.width/l.rect[2]*amount*bend*edge,y};
    }
    function tree(l,t){
      const im=images.get(l.id),phase=t*Math.PI*2/(l.period||7)+(l.phase||0),amount=Math.sin(phase)*wind;
      const key=Math.round(amount*32),cache=treeCaches.get(l.id)||new Map();treeCaches.set(l.id,cache);
      if(cache.has(key))return cache.get(key);
      const frame=deformSprite(im,(x,y)=>treePoint(l,x,y,key/32),6,12,Math.ceil((l.amplitude||5)*im.width/l.rect[2]*1.5)+6);
      cache.set(key,frame);if(cache.size>5)cache.delete(cache.keys().next().value);return frame;
    }
    function bird(l,t){
      const im=images.get(l.id),k=Math.floor((((t/(l.flapPeriod||1.3))%1+1)%1)*48),cache=birdCaches.get(l.id)||new Map();birdCaches.set(l.id,cache);
      if(cache.has(k))return cache.get(k);
      const flap=Math.sin(k/48*Math.PI*2);
      const frame=deformSprite(im,(x,y)=>{
        const h=Math.max(0,Math.min(1,(im.height*.64-y)/(im.height*.58))),body=Math.max(0,Math.min(1,(im.width*.74-x)/(im.width*.16))),weight=h*(y>im.height*.48?body:1);
        return {x:x+(x-im.width*.5)*.1*flap*weight,y:y+(im.height*.66-y)*.32*flap*weight};
      },8,8,Math.ceil(Math.max(im.height*.24,im.width*.06))+8);
      cache.set(k,frame);if(cache.size>5)cache.delete(cache.keys().next().value);return frame;
    }
    function birdTravelTime(l,t){
      const duration=l.entryMotion?.rampSeconds??4.5,initial=l.entryMotion?.initialSpeed??.65;
      // Integrate a smooth speed ramp. Keep the accumulated time offset during
      // ambient motion so finishing the intro never jumps position or velocity.
      if(t>=duration)return t-(1-initial)*duration*.5;
      const u=Math.max(0,t/duration);
      return initial*t+(1-initial)*duration*(u*u*u-.5*u*u*u*u);
    }
    function draw(l,t,introTime){
      if(!enabled.has(l.id))return;const im=images.get(l.id),[x,y,w,h]=l.rect;
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
        const f=bird(l,t),p=((birdTravelTime(l,t)/(l.period||25)+(l.phase||0))%1+1)%1;
        const px=l.direction===-1?W+500-(W+1000)*p:-500+(W+1000)*p;
        const py=y+70*Math.sin(p*Math.PI*2);ctx.translate(px+w/2,py+h/2);
        if(l.direction===-1)ctx.scale(-1,1);ctx.rotate(.025*Math.sin(t*.7));
        const s=w/im.width;ctx.drawImage(f.canvas,-w/2-f.padding*s,-h/2-f.padding*s,f.canvas.width*s,f.canvas.height*s);
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
      }else{
        // The terrain shares a subtle uniform approach and stays fixed afterwards.
        ctx.save();const partial=clipOccluders(l,introTime);pose(enter);ctx.drawImage(im,x,y,w,h);ctx.restore();
        for(const {contour,state}of partial){ctx.save();ctx.beginPath();contourPath(contour,state);ctx.clip();ctx.globalAlpha*=1-state.a;pose(enter);ctx.drawImage(im,x,y,w,h);ctx.restore();}
      }
      ctx.restore();
    }
    function render(t=0,options={}){
      const introTime=options.introDuration&&t<options.introDuration?t*12/options.introDuration:null;
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
      if(showOutline&&outline){ctx.save();pose(terrainPose(introTime));ctx.drawImage(outline,0,0,W,H);ctx.restore();}
    }
    function resolution(w){w=Math.min(W,Math.max(320,Math.round(w)));const h=Math.round(w*H/W);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}}
    return {render,resolution,enabled,manifest,images,treePoint,setOcclusion:v=>occlusion=v,setWind:v=>{wind=v;treeCaches.clear();},setChecker:v=>checker=v,setOutline:v=>showOutline=v,setReference:v=>showReference=v,isMoving:l=>motion.includes(l.kind),get cachedFrames(){return [...treeCaches.values(),...birdCaches.values()].reduce((n,c)=>n+c.size,0);}};
  }};
})();
