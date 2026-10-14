// A deterministic opening, followed by the existing scene's continuous 24s loop.
// Landscape only: logo, text, panel and actions remain independent HTML.
(() => {
  const scriptURL = document.currentScript.src;
  const W = 1594, H = 987, INTRO = window.GoiVietHomeOpeningConfig.duration, LOOP = 24;
  const clamp = v => Math.max(0, Math.min(1, v));
  const smooth = v => { v = clamp(v); return v*v*(3-2*v); };
  const progress = (t,start,end) => smooth((t-start)/(end-start));
  const surface = (w,h) => { const c=document.createElement('canvas'); c.width=w;c.height=h;return c; };
  const image = name => new Promise((resolve,reject) => {
    const im=new Image(),timer=setTimeout(()=>reject(new Error('Tải phong cảnh quá lâu.')),45000);
    im.onload=()=>{clearTimeout(timer);resolve(im);};
    im.onerror=()=>{clearTimeout(timer);reject(new Error('Không tải được lớp '+name));};
    im.src=new URL(name,scriptURL).href;
  });
  window.GoiVietHomeOpening = {progress, async create(canvas) {
    const ctx=canvas.getContext('2d',{alpha:false,willReadFrequently:true});
    if(!ctx)throw new Error('Trình duyệt chưa hỗ trợ canvas.');
    const nativeCanvas=surface(canvas.width,canvas.height);
    const [native,cloud]=await Promise.all([
      window.GoiVietHomeScene.create(nativeCanvas), image('cloud-long.svg')
    ]);
    const {landscape,crane,leaf,petal}=native.assets;
    const layout=window.GoiVietHomeLayout;
    // Partition one landscape with complementary soft masks. The central
    // architecture and train use one shared layer, so no building or carriage
    // is divided between pieces arriving from opposing directions.
    const layers=[],panorama=surface(canvas.width,canvas.height),panoramaCtx=panorama.getContext('2d');
    const maskW=1064,maskH=Math.round(maskW*H/W);
    for(let depth=0;depth<3;depth++)for(let side=0;side<2;side++){
      const c=surface(maskW,maskH),g=c.getContext('2d'),mask=g.createImageData(maskW,maskH);
      for(let y=0;y<maskH;y++)for(let x=0;x<maskW;x++){
        const px=x*W/maskW,py=y*H/maskH;
        const middle=smooth((py-275)/170),near=smooth((py-600)/170);
        const sideTrees=smooth((py-335)/165)*(1-smooth((Math.min(px,W-px)-75)/175));
        const foreground=Math.max(near,sideTrees);
        const landmarks=smooth((px-200)/90)*(1-smooth((px-1320)/100))*smooth((py-365)/35)*(1-smooth((py-590)/45));
        const weights=[(1-middle)*(1-foreground)*(1-landmarks),middle*(1-foreground)*(1-landmarks),foreground*(1-landmarks)];
        const right=smooth((px-650)/294);
        const p=(y*maskW+x)*4;mask.data[p]=mask.data[p+1]=mask.data[p+2]=255;
        mask.data[p+3]=Math.round(weights[depth]*(side?right:1-right)*255);
      }
      g.putImageData(mask,0,0);g.globalCompositeOperation='source-in';
      g.drawImage(landscape,0,0,maskW,maskH);
      layers.push({canvas:c,depth,side});
    }
    const landmarkLayer=surface(maskW,maskH),landmarkCtx=landmarkLayer.getContext('2d'),landmarkMask=landmarkCtx.createImageData(maskW,maskH);
    for(let y=0;y<maskH;y++)for(let x=0;x<maskW;x++){
      const px=x*W/maskW,py=y*H/maskH;
      const a=smooth((px-200)/90)*(1-smooth((px-1320)/100))*smooth((py-365)/35)*(1-smooth((py-590)/45));
      const p=(y*maskW+x)*4;landmarkMask.data[p]=landmarkMask.data[p+1]=landmarkMask.data[p+2]=255;landmarkMask.data[p+3]=Math.round(a*255);
    }
    landmarkCtx.putImageData(landmarkMask,0,0);landmarkCtx.globalCompositeOperation='source-in';landmarkCtx.drawImage(landscape,0,0,maskW,maskH);
    const birdCache=new Map(),birdSource=surface(280,230),birdSourceCtx=birdSource.getContext('2d');
    const birdFit=Math.min(280/crane.width,230/crane.height),birdWidth=crane.width*birdFit,birdHeight=crane.height*birdFit;
    birdSourceCtx.drawImage(crane,(280-birdWidth)/2,(230-birdHeight)/2,birdWidth,birdHeight);
    function triangle(g,s,d){
      const [p0,p1,p2]=s,[q0,q1,q2]=d,det=(p1.x-p0.x)*(p2.y-p0.y)-(p2.x-p0.x)*(p1.y-p0.y);
      const a=((q1.x-q0.x)*(p2.y-p0.y)-(q2.x-q0.x)*(p1.y-p0.y))/det;
      const c=((q2.x-q0.x)*(p1.x-p0.x)-(q1.x-q0.x)*(p2.x-p0.x))/det;
      const b=((q1.y-q0.y)*(p2.y-p0.y)-(q2.y-q0.y)*(p1.y-p0.y))/det;
      const e=((q2.y-q0.y)*(p1.x-p0.x)-(q1.y-q0.y)*(p2.x-p0.x))/det;
      g.save();g.beginPath();const cx=(q0.x+q1.x+q2.x)/3,cy=(q0.y+q1.y+q2.y)/3;
      d.forEach((q,i)=>{const x=q.x+(q.x-cx)*.012,y=q.y+(q.y-cy)*.012;i?g.lineTo(x,y):g.moveTo(x,y);});g.closePath();g.clip();
      g.transform(a,b,c,e,q0.x-a*p0.x-c*p0.y,q0.y-b*p0.x-e*p0.y);g.drawImage(birdSource,0,0);g.restore();
    }
    function birdFrame(k){
      if(birdCache.has(k))return birdCache.get(k);
      const c=surface(336,278),g=c.getContext('2d');g.translate(28,24);
      const flap=Math.sin(k/48*Math.PI*2),cols=8,rows=8;
      const vertex=(x,y)=>{
        const tip=clamp((155-y)/115),avoidHead=y>105?clamp((195-x)/42):1,weight=tip*avoidHead;
        return {x:x+(x-137)*.13*flap*weight,y:y+(160-y)*.34*flap*weight};
      };
      // Shared-edge triangles keep the original feathers connected as they flap.
      for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
        const a={x:col*280/cols,y:row*230/rows},b={x:(col+1)*280/cols,y:a.y},e={x:a.x,y:(row+1)*230/rows},d={x:b.x,y:e.y};
        triangle(g,[a,b,e],[vertex(a.x,a.y),vertex(b.x,b.y),vertex(e.x,e.y)]);
        triangle(g,[b,d,e],[vertex(b.x,b.y),vertex(d.x,d.y),vertex(e.x,e.y)]);
      }
      birdCache.set(k,c);if(birdCache.size>8)birdCache.delete(birdCache.keys().next().value);return c;
    }
    function birds(t){
      const a=progress(t,3.6,4.8)*(1-progress(t,10,11.3));
      if(!a)return;
      for(let i=0;i<2;i++){
        const p=clamp((t-(i?4.3:3.6))/(i?8:7));
        const x=i?W+220-(W+450)*p:-220+(W+450)*p;
        const y=(i?114:60)-62*Math.sin(p*Math.PI)+8*Math.sin(t*1.5+i);
        const size=i?.65:.73,k=Math.floor((((t+i*.35)/1.3)%1)*48);
        ctx.save();ctx.globalAlpha=a;ctx.translate(x,y);ctx.rotate(.035*Math.sin(t+i));
        if(i)ctx.scale(-1,1);ctx.drawImage(birdFrame(k),-168*size,-90*size,336*size,278*size);ctx.restore();
      }
    }
    function particles(t){
      const alpha=progress(t,4.1,5.5)*(1-progress(t,10.2,11.4));
      if(!alpha)return;
      const items=[[leaf,90,170,1,32],[petal,W-80,210,-1,25],[leaf,200,540,1,30],[petal,W-140,630,-1,23]];
      items.forEach(([im,x,y,dir,size],i)=>{
        const p=clamp((t-4.1-i*.25)/8);ctx.save();ctx.globalAlpha=alpha*.78;
        ctx.translate(x+dir*(95*p+12*Math.sin(t+i)),y+p*220);ctx.rotate(i+t*.5*dir);
        ctx.drawImage(im,-size/2,-size/2,size,size*im.height/im.width);ctx.restore();
      });
    }
    function phase(t){
      if(t<.8)return 'Nền giấy · chờ cảnh mở ra';
      if(t<3.2)return 'Núi xa và mây dần vào tầm mắt';
      if(t<5.3)return 'Cây, cò và lá mang sức sống vào cảnh';
      if(t<7.8)return 'Gói Việt và câu chuyện hành trình';
      if(t<INTRO)return 'Ba miền và lời mời cùng khám phá';
      return 'Cảnh hoàn chỉnh · chuyển động tiếp tục';
    }
    let paperCanvas=null;
    function drawPaper(){
      if(!paperCanvas||paperCanvas.width!==canvas.width||paperCanvas.height!==canvas.height){
        paperCanvas=surface(canvas.width,canvas.height);const p=paperCanvas.getContext('2d');p.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);
        const paper=p.createLinearGradient(0,0,W,H);
        paper.addColorStop(0,'#fae1c6');paper.addColorStop(.45,'#fff1cf');paper.addColorStop(1,'#f5e6c8');
        p.fillStyle=paper;p.fillRect(0,0,W,H);
      }
      ctx.drawImage(paperCanvas,0,0,W,H);
    }
    let frames=0;
    function renderFrame(t){
      frames++;
      t=Math.max(0,Number(t)||0);
      ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);ctx.imageSmoothingQuality='high';
      if(t>=INTRO){native.renderFrame(t);ctx.drawImage(nativeCanvas,0,0,W,H);return;}
      drawPaper();
      // Depth gets progressively smaller offsets: the panorama settles into
      // place, while elements arrive from beyond the edge of the viewer's eye.
      panoramaCtx.setTransform(1,0,0,1,0,0);panoramaCtx.clearRect(0,0,panorama.width,panorama.height);
      panoramaCtx.setTransform(panorama.width/W,0,0,panorama.height/H,0,0);panoramaCtx.globalCompositeOperation='lighter';
      for(const layer of layers){
        const starts=[.8,1.9,3.0],ends=[3.5,4.8,6.0];
        const a=progress(t,starts[layer.depth]+layer.side*.15,ends[layer.depth]+layer.side*.15);
        if(!a)continue;
        const direction=layer.side?1:-1,offset=[62,92,124][layer.depth]*(1-a);
        panoramaCtx.globalAlpha=a;panoramaCtx.drawImage(layer.canvas,direction*offset,[12,25,40][layer.depth]*(1-a),W,H);
      }
      const landmarkAlpha=progress(t,2.7,5.2);
      panoramaCtx.globalAlpha=landmarkAlpha;panoramaCtx.drawImage(landmarkLayer,0,18*(1-landmarkAlpha),W,H);
      ctx.drawImage(panorama,0,0,W,H);
      // Passing cloud veils add a distinct cloud entrance and dissolve before
      // text takes focus; they never obscure the eventual completed scene.
      const ca=progress(t,1.2,2.4)*(1-progress(t,5.1,7.0));
      if(ca){ctx.save();ctx.globalAlpha=ca*.75;ctx.drawImage(cloud,-225+t*36,240,450,111);ctx.drawImage(cloud,W-190-t*28,325,405,100);ctx.restore();}
      birds(t);particles(t);
      const settle=progress(t,10.8,INTRO);
      if(settle){native.renderFrame(t);ctx.save();ctx.globalAlpha=settle;ctx.drawImage(nativeCanvas,0,0,W,H);ctx.restore();}
    }
    const metadata={...native.metadata,designWidth:W,designHeight:H,introDuration:INTRO,loopDuration:LOOP,duration:INTRO+LOOP,fps:30};
    const setResolution=(width,height)=>{
      native.setResolution(width,height);width=native.metadata.width;height=native.metadata.height;
      if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;panorama.width=width;panorama.height=height;}
      metadata.width=width;metadata.height=height;
    };
    setResolution(canvas.width,canvas.height);
    renderFrame(0);
    return {renderFrame,setResolution,metadata,phase,native,get frames(){return frames;},get mode(){return native.mode;},get cachedBirdFrames(){return native.cachedBirdFrames+birdCache.size;}};
  }};
})();
