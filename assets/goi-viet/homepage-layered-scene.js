// Production adapter for the same alpha-layer renderer used in the Canvas lab.
(() => {
  const scriptBase=new URL('.',document.currentScript.src);
  let data=null,pending=null;
  function loadData(){
    if(data)return Promise.resolve(data);if(pending)return pending;
    pending=new Promise((resolve,reject)=>{
      const script=document.createElement('script');let settled=false;
      const finish=error=>{
        if(settled)return;settled=true;clearTimeout(timer);script.onload=script.onerror=null;script.remove();pending=null;
        const loaded=window.GoiVietHomeLayeredData;delete window.GoiVietHomeLayeredData;
        if(error){reject(error);return;}
        if(!loaded?.manifest?.layers?.length||!loaded.sources){reject(new Error('Thiếu lớp phong cảnh.'));return;}
        data=loaded;resolve(data);
      };
      const timer=setTimeout(()=>finish(new Error('Tải phong cảnh quá lâu.')),45000);
      const high=matchMedia('(min-resolution: 1.5dppx) and (min-width: 1000px), (min-width: 2200px)').matches;
      script.async=true;script.onload=()=>finish();script.onerror=()=>finish(new Error('Không tải được phong cảnh.'));
      script.src=new URL((high?'homepage-layered-assets-4k.js':'homepage-layered-assets.js')+'?v=gentle-cranes-v13',scriptBase).href;
      document.head.append(script);
    });return pending;
  }
  window.GoiVietHomeScene={async create(canvas){
    const pack=await loadData(),engine=await window.LandscapeLab.create(canvas,pack.manifest,pack.sources);
    const metadata={width:canvas.width,height:canvas.height,designWidth:1594,designHeight:987,sourceWidth:pack.sourceWidth,sourceHeight:Math.round(pack.sourceWidth*2378/3840),fps:30,duration:24,continuous:true,renderer:'layered-canvas',layerCount:pack.manifest.layers.length};
    canvas.dataset.renderer='layered-canvas';canvas.dataset.assetQuality=pack.quality;canvas.dataset.layerCount=String(metadata.layerCount);
    const setResolution=width=>{engine.resolution(width);metadata.width=canvas.width;metadata.height=canvas.height;};
    const renderFrame=(time,options)=>engine.render(Math.max(0,Number(time)||0),options);
    setResolution(canvas.width);
    return {renderFrame,setResolution,metadata,layerRenderer:engine,get mode(){return 'canvas2d';},get cachedBirdFrames(){return engine.cachedFrames;}};
  }};
})();
