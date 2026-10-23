/* Main preview: shared, bounded text metrics and event-invalidated UI geometry. */
(() => {
  'use strict';
  const selector='.top-header,.left-helper,#stationPanel,.bottom-dock,.mobile-view-switcher,.journey-route-bar';
  const metrics=new Map(), transitions=new Map(),observed=new Set();
  let dirty=true, boxes=[], revision=0, fontRevision=0, reads=0, hits=0, misses=0;
  const repaint=()=>{if(!document.hidden&&typeof requestMapRender==='function')requestMapRender();};
  function invalidate(){dirty=true;repaint();}
  const resize=new ResizeObserver(invalidate);
  function relevant(node){return node instanceof Element&&(node.matches('body,#mapScene,#introScreen')||node.closest(selector));}
  function changed(records){
    const touchesUI=records.some(r=>{
      const target=r.type==='characterData'?r.target.parentElement:r.target;
      // The progress fill transforms inside a fixed bar; it never moves its
      // UI obstacle. Keep the static map reusable while vehicles are moving.
      if(r.attributeName==='style'&&target.matches?.('.journey-progress-fill'))return false;
      if(relevant(target))return true;
      return r.type==='childList'&&[...r.addedNodes,...r.removedNodes].some(n=>n instanceof Element&&(n.matches(selector)||n.querySelector(selector)));
    });
    if(touchesUI)invalidate();
  }
  const mutations=new MutationObserver(changed);
  mutations.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class','style','hidden','inert','aria-hidden','open']});
  // CSS transforms do not trigger ResizeObserver. Sample only while a relevant
  // transition is active, including its final position and cancellation.
  for(const type of ['transitionrun','transitionend','transitioncancel'])document.addEventListener(type,e=>{
    if(!e.target.matches(selector+',body,#mapScene'))return;
    let properties=transitions.get(e.target);
    if(type==='transitionrun'){if(!properties)transitions.set(e.target,properties=new Set());properties.add(e.propertyName);}
    else if(properties){properties.delete(e.propertyName);if(!properties.size)transitions.delete(e.target);}
    invalidate();
  },true);
  window.addEventListener('resize',invalidate,{passive:true});
  window.addEventListener('scroll',invalidate,{passive:true,capture:true});
  window.visualViewport?.addEventListener('resize',invalidate,{passive:true});
  document.addEventListener('visibilitychange',invalidate);
  function clearText(){metrics.clear();fontRevision++;invalidate();}
  document.fonts.addEventListener('loadingdone',clearText);
  document.fonts.addEventListener('loadingerror',clearText);
  document.fonts.ready.then(clearText);
  function ui(padding=0,opaque=false){
    changed(mutations.takeRecords());
    for(const [el]of transitions)if(!el.isConnected)transitions.delete(el);
    if(dirty||transitions.size){
      dirty=false;
      const elements=[...document.querySelectorAll(selector)];
      for(const el of observed)if(!elements.includes(el)){resize.unobserve(el);observed.delete(el);}
      const nextBoxes=elements.map(el=>{
        if(!observed.has(el)){observed.add(el);resize.observe(el);}const s=getComputedStyle(el);reads++;
        if(el.inert||el.getAttribute('aria-hidden')==='true'||s.display==='none'||s.visibility==='hidden')return null;
        const r=el.getBoundingClientRect();
        return r.width&&r.height?{left:r.left,right:r.right,top:r.top,bottom:r.bottom,opacity:Number(s.opacity)}:null;
      }).filter(Boolean);
      if(JSON.stringify(nextBoxes)!==JSON.stringify(boxes))revision++;
      boxes=nextBoxes;
      if(transitions.size)repaint();
    }
    return boxes.filter(b=>!opaque||b.opacity>.1).map(b=>({left:b.left-padding,right:b.right+padding,top:b.top-padding,bottom:b.bottom+padding}));
  }
  function measure(context,text){
    const key=JSON.stringify([context.font,context.fontKerning,context.fontStretch,context.fontVariantCaps,context.letterSpacing,context.wordSpacing,context.textRendering,context.direction,String(text)]);
    if(metrics.has(key)){hits++;return metrics.get(key);}
    const width=context.measureText(text).width;misses++;
    if(metrics.size>=2048)metrics.delete(metrics.keys().next().value);
    metrics.set(key,width);return width;
  }
  const needsPaint=()=>{changed(mutations.takeRecords());return dirty||transitions.size>0;};
  window.GoiVietLabelPerformance=Object.freeze({ui,measure,invalidate,clearText,needsPaint,revision:()=>revision,fontRevision:()=>fontRevision,inspect:()=>({revision,fontRevision,reads,hits,misses,metrics:metrics.size,transitions:transitions.size,dirty})});
})();
