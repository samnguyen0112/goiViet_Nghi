// Production adapter for the same alpha-layer renderer used in the Canvas lab.
(() => {
  const scriptBase=new URL('.',document.currentScript.src);
  let data=null,pending=null;
  function loadData(canvas){
    if(data)return Promise.resolve(data);if(pending)return pending;
    pending=new Promise((resolve,reject)=>{
      const script=document.createElement('script');let settled=false;
      const finish=error=>{
        if(settled)return;settled=true;clearTimeout(timer);script.onload=script.onerror=null;script.remove();pending=null;
        const loaded=window.GoiVietHomeLayeredData;delete window.GoiVietHomeLayeredData;
        if(error){reject(error);return;}
        if(!loaded?.manifest?.layers?.length||!loaded.sources){reject(new Error('Thiếu lớp phong cảnh.'));return;}
        // Preview 3 uses one repainted masonry sprite at both quality levels.
        if(document.body.dataset.previewVersion==='3'&&document.body.dataset.homeTheme!=='classic'){
          const bridge=loaded.manifest.layers.find(layer=>layer.id==='bridge');
          if(bridge)loaded.sources[bridge.file]=new URL('homepage-layered/bridge-unified-3'+(loaded.quality==='2k'?'-2k':'')+'.webp?v=20261018-1',scriptBase).href;
        }
        data=loaded;resolve(data);
      };
      const timer=setTimeout(()=>finish(new Error('Tải phong cảnh quá lâu.')),45000);
      // layout() has already sized the backing store, including the cover crop.
      // A high-DPR screen alone does not justify decoding the 4K bundle.
      const high=window.GoiVietPixelBudget ? canvas.width>1920*1.1 : matchMedia('(min-resolution: 1.5dppx) and (min-width: 1000px), (min-width: 2200px)').matches;
      script.async=true;script.onload=()=>finish();script.onerror=()=>finish(new Error('Không tải được phong cảnh.'));
      const preview3=document.body.dataset.previewVersion==='3',balanced=document.body.dataset.homeTheme!=='classic';
      const reference=preview3&&document.body.dataset.homeArt==='reference-v8';
      const bundle=reference?'homepage-reference-v8/assets-'+(high?'4k':'2k')+'.js':preview3?'homepage-'+(balanced?'balanced':'classic')+'-3/assets-'+(high?'4k':'2k')+'.js':(high?'homepage-layered-assets-4k.js':'homepage-layered-assets.js');
      script.src=new URL(bundle+'?v='+(reference?'reference-layers-v8-20261021-1':'painted-train-20261019-1'),scriptBase).href;
      document.head.append(script);
    });return pending;
  }
  window.GoiVietHomeScene={async create(canvas){
    const pack=await loadData(canvas),engine=await window.LandscapeLab.create(canvas,pack.manifest,pack.sources,{managed:!!window.GoiVietPixelBudget,copySafeArea:document.body.dataset.previewVersion==='3'&&document.body.dataset.homeTheme!=='classic'});
    const metadata={width:canvas.width,height:canvas.height,designWidth:1594,designHeight:987,sourceWidth:pack.sourceWidth,sourceHeight:Math.round(pack.sourceWidth*2378/3840),fps:window.GoiVietPixelBudget?.introFPS??30,duration:24,continuous:true,renderer:'layered-canvas',layerCount:pack.manifest.layers.length};
    canvas.dataset.renderer='layered-canvas';canvas.dataset.assetQuality=pack.quality;canvas.dataset.layerCount=String(metadata.layerCount);
    const setResolution=width=>{engine.resolution(width);metadata.width=canvas.width;metadata.height=canvas.height;};
    const renderFrame=(time,options)=>engine.render(Math.max(0,Number(time)||0),options);
    setResolution(canvas.width);
    await engine.prepare?.();
    return {renderFrame,setResolution,metadata,layerRenderer:engine,get mode(){return 'canvas2d';},get cachedBirdFrames(){return engine.cachedFrames;}};
  }};
})();
