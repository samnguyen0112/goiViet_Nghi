/* Reference-based mountain painting, displayed whole below the map canvas.
   No existing map geometry, camera, input handler, render loop, image or homepage code is changed. */
(() => {
  'use strict';
  const intro=document.getElementById('introScreen'),map=document.getElementById('mapScene');
  if(!intro||!map)return;
  const active=()=>intro.classList.contains('intro-hidden');
  let frame=null,layoutObserver=null,uiObserver=null;
  const artURL=new URL('map-frame-mountains-natural-v2.png',document.currentScript.src).href;
  const mistURL=new URL('map-frame-upper-mist-v1.png',document.currentScript.src).href;
  let artImage=null,artLoaded=false,artError=false;
  // Keep the full natural outline: no upper crop, erased peaks, or artificial edge mask.
  const mountains=`<svg class="gv-frame-mountains" viewBox="0 0 300 164.0625" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="gv5-compass-feather" filterUnits="userSpaceOnUse" x="-100" y="-100" width="500" height="400"><feGaussianBlur data-compass-blur stdDeviation="6"/></filter>
      <mask id="gv5-mountain-safe-area" maskUnits="userSpaceOnUse" x="0" y="0" width="300" height="164.0625"><rect width="300" height="164.0625" fill="white"/><rect data-compass-soft width="0" height="0" fill="black" filter="url(#gv5-compass-feather)"/><rect data-compass-cutout width="0" height="0" rx="45" fill="black"/></mask>
    </defs>
    <g mask="url(#gv5-mountain-safe-area)"><image href="${artURL}" x="0" y="14.0625" width="300" height="150" preserveAspectRatio="xMinYMax meet"/><image class="gv-frame-upper-mist" href="${mistURL}" x="0" y="8" width="300" height="150" preserveAspectRatio="xMinYMin meet"/></g>
  </svg>`;
  const flourish=corner=>`<svg class="gv-frame-flourish" data-corner="${corner}" viewBox="0 0 32 32" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="currentColor" stroke-linecap="round"><path d="M1 23V11C1 5 5 1 11 1H23M5 22V12C5 8 8 5 12 5H22" stroke-width=".9"/><path d="m12 12 4-4 4 4-4 4Z" stroke-width=".85"/><path d="M16 16v7M16 23l-2-2m2 2 2-2M20 12h7" stroke-width=".7"/></g></svg>`;
  function visibleBounds(selector) {
    const el=map.querySelector(selector);
    if(!el||el.inert||el.getAttribute('aria-hidden')==='true')return null;
    const style=getComputedStyle(el),bounds=el.getBoundingClientRect();
    return style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)>0&&bounds.width&&bounds.height?bounds:null;
  }
  function fitPainting() {
    const width=map.clientWidth,height=map.clientHeight;
    const header=visibleBounds('.top-header'),helper=visibleBounds('.left-helper'),panel=visibleBounds('#stationPanel'),dock=visibleBounds('.bottom-dock'),switcher=visibleBounds('.mobile-view-switcher');
    let upper=(header?.bottom||0)+18,bottom=height,span=width;
    if(width>1080){
      upper=Math.max(upper,(helper?.bottom||0)+18);
      if(dock)span=Math.min(span,dock.left-24);
      if(panel)span=Math.min(span,panel.left-24);
    }else if(width>768){
      upper=Math.max(upper,(dock?.bottom||0)+18);
      if(typeof mapCompass!=='undefined'&&mapCompass)upper=Math.max(upper,mapCompass.y+76);
      if(panel)span=Math.min(span,panel.left-24);
    }else{
      if(dock)bottom=Math.min(bottom,dock.top-16);
      if(switcher)bottom=Math.min(bottom,switcher.top-16);
      if(panel)upper=Math.max(upper,panel.bottom+18);
    }
    const room=Math.max(0,bottom-upper);
    span=Math.max(0,Math.min(span,room*300/164.0625));
    frame.style.setProperty('--gv5-art-limit',`${span}px`);
    frame.style.setProperty('--gv5-art-bottom',`${Math.max(0,height-bottom)}px`);
    frame.dataset.artRoom=room<64||span<100?'tight':'available';
  }
  function syncSafeArea() {
    if(!frame||!active())return;
    fitPainting();
    const svg=frame.querySelector('.gv-frame-mountains'),cutout=svg.querySelector('[data-compass-cutout]'),soft=svg.querySelector('[data-compass-soft]'),bounds=svg.getBoundingClientRect();
    if(typeof mapCompass==='undefined'||!mapCompass||!bounds.width){for(const el of[cutout,soft]){el.setAttribute('width','0');el.setAttribute('height','0');}return;}
    const scale=bounds.width/300,x=(mapCompass.x-60-bounds.left)/scale,y=(mapCompass.y-50-bounds.top)/scale;
    cutout.setAttribute('x',String(x));cutout.setAttribute('y',String(y));cutout.setAttribute('width',String(120/scale));cutout.setAttribute('height',String(118/scale));cutout.setAttribute('rx',String(43/scale));
    soft.setAttribute('x',String(x-18/scale));soft.setAttribute('y',String(y-18/scale));soft.setAttribute('width',String(156/scale));soft.setAttribute('height',String(154/scale));soft.setAttribute('rx',String(61/scale));svg.querySelector('[data-compass-blur]').setAttribute('stdDeviation',String(8/scale));
  }
  function sync() {
    if(!active()){layoutObserver?.disconnect();layoutObserver=null;uiObserver?.disconnect();uiObserver=null;frame?.remove();frame=null;return;}
    if(frame?.isConnected)return;
    frame=document.createElement('div');frame.className='gv-map-frame';frame.setAttribute('aria-hidden','true');frame.inert=true;
    if(!artImage){artImage=new Image();artImage.decoding='async';artImage.onload=()=>{artLoaded=true;};artImage.onerror=()=>{artError=true;};artImage.src=artURL;}
    frame.innerHTML=mountains+['tl','tr','br','bl'].map(flourish).join('');map.prepend(frame);
    syncSafeArea();layoutObserver=new ResizeObserver(syncSafeArea);uiObserver=new MutationObserver(syncSafeArea);
    for(const el of map.querySelectorAll('.bottom-dock,.top-header,.left-helper,#stationPanel,.mobile-view-switcher')){
      layoutObserver.observe(el);uiObserver.observe(el,{attributes:true,attributeFilter:['class','inert','aria-hidden']});
    }
  }
  window.addEventListener('resize',syncSafeArea,{passive:true});
  map.addEventListener('transitionend',syncSafeArea,{passive:true});
  new MutationObserver(sync).observe(intro,{attributes:true,attributeFilter:['class']});
  window.GoiVietMapFrame=Object.freeze({active,syncSafeArea,inspect:()=>({active:active(),mounted:Boolean(frame?.isConnected),artLoaded,artError,room:frame?.dataset.artRoom||null,sourceRegion:{x:0,y:0,width:1774,height:887},mountainBounds:frame?.querySelector('.gv-frame-mountains')?.getBoundingClientRect().toJSON()||null})});
  sync();
})();
