/* Main preview only. Surface pixels, separate from the bounded world tile caches. */
(() => {
  'use strict';
  const M=1024*1024,limit=64*M;
  function ratio(role,w,h,pad=0){
    const area=Math.max(1,w*h),dpr=Math.min(devicePixelRatio||1,2);
    // Reserve two 4M backdrops, 2M waves, 2M coverage, 4M intro and 1M postcard
    // pixels, plus at most 6M vehicle pixels. Share 41M between text surfaces.
    // Tile/sprite caches have separate byte limits.
    const text=Math.min(dpr,Math.sqrt((41*M-16384)/(area*2)));
    if(role==='backdrop')return Math.min(dpr,w>1080?1:1.25,Math.sqrt((4*M-4096)/((w+2*pad)*(h+2*pad))));
    if(role==='waves')return Math.min(dpr,1.25,Math.sqrt((2*M-4096)/((w+2*pad)*(h+2*pad))));
    if(role==='coverage')return Math.min(1,Math.sqrt((2*M-4096)/area));
    return role==='vehicle'?Math.min(1.5,text,Math.sqrt((6*M-4096)/area)):text;
  }
  const introSize=(width,height)=>{
    const scale=Math.min(1,Math.sqrt((4*M-4096)/Math.max(1,width*height)));
    return {width:Math.max(320,Math.floor(width*scale)),height:Math.max(1,Math.floor(height*scale))};
  };
  let query,lastDPR=devicePixelRatio||1;
  function watchDPR(){
    query?.removeEventListener('change',changed);
    query=matchMedia(`(resolution: ${devicePixelRatio||1}dppx)`);
    query.addEventListener('change',changed);
  }
  function changed(){
    lastDPR=devicePixelRatio||1;
    watchDPR();
    // The existing resize path owns geometry and a single map RAF. The main
    // backing store is resized inside that paint, so no blank frame is exposed.
    window.dispatchEvent(new Event('resize'));
  }
  watchDPR();
  // Some Chromium display/emulation changes defer the media-query event until
  // another paint. This scalar check wakes the existing renderer only on change.
  setInterval(()=>{if(!document.hidden&&(devicePixelRatio||1)!==lastDPR)changed();},1000);
  window.GoiVietPixelBudget=Object.freeze({ratio,introSize,introFPS:60,limitPixels:limit,introLimitPixels:4*M,
    inspect:()=>({limitPixels:limit,introLimitPixels:4*M,dpr:devicePixelRatio||1,mainRatio:ratio('main',innerWidth,innerHeight)})});
})();
