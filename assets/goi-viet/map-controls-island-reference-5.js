/* Preview-5 copy of map-controls-island-reference.js (P5-03 slice 2): interface text follows the VI/EN choice (GoiVietI18n).
   Other pages keep map-controls-island-reference.js. */
/* Map-only placement and decorative island helper nodes.
   No changes to map input handlers, geometry, rail, or homepage markup. */
(() => {
  'use strict';
  const intro=document.getElementById('introScreen'),helper=document.querySelector('#mapScene .left-helper');
  if(!intro||!helper)return;
  const active=()=>intro.classList.contains('intro-hidden');
  const T = (key, fallback, vars) => { const I = window.GoiVietI18n; if (!I) return fallback; const value = I.t(key, vars); return value === key ? fallback : value; };
  const iconURL=new URL('map-source-layers/island-heading.png',document.currentScript.src).href;
  const dock=document.querySelector('#mapScene .bottom-dock'),hadStyle=dock.hasAttribute('style');
  const priorMenuHeight=dock.style.getPropertyValue('--gv-camera-menu-height'),priorMenuPriority=dock.style.getPropertyPriority('--gv-camera-menu-height');
  let icon=null,divider=null;
  const legend=helper.querySelector('.map-legend-content'),settings=document.querySelector('#headerSettings .control-options');
  if(legend&&settings){
    // Keep the cloned preview compatible when its HTML is regenerated.
    helper.querySelector(':scope > .island-helper-note')?.remove();
    const summary=helper.querySelector('.map-legend > summary');
    const title=[...summary.childNodes].find(node=>node.nodeType===3);
    // This script owns the legend title and row labels: their data-i18n keys are dropped and it re-labels them.
    summary.removeAttribute('data-i18n');
    const labelLegend=()=>{
      if(title)title.textContent=T('legend.title','Chú giải')+' ';
      const labels=[T('legend.featured','Ba ga mẫu'),T('legend.explored','Đã khám phá'),T('legend.memory','Có kỷ niệm')];
      legend.querySelectorAll('.legend-row').forEach((row,i)=>{if(labels[i]){row.lastElementChild.removeAttribute('data-i18n');row.lastElementChild.textContent=labels[i];}});
    };
    labelLegend();document.addEventListener('goiviet:langchange',labelLegend);
    let sources=document.getElementById('mapSourcesContent');
    if(!sources){
      const disclosure=document.createElement('details');disclosure.id='mapSources';disclosure.className='map-data-sources';
      disclosure.innerHTML='<summary>Nguồn bản đồ <span class="map-source-chevron" aria-hidden="true">⌄</span></summary><div id="mapSourcesContent" class="map-sources-content"><p>Các chặng ra quần đảo là hải trình minh họa.</p></div>';
      settings.append(disclosure);sources=disclosure.querySelector('.map-sources-content');
    }
    function moveSourceNotes(){
      for(const note of [...legend.querySelectorAll('p')]){
        if(/^Tàu dừng/.test(note.textContent.trim())){note.remove();continue;}
        // Preserve the actual credit nodes and links from async data modules.
        sources.append(note);
      }
    }
    moveSourceNotes();new MutationObserver(moveSourceNotes).observe(legend,{childList:true});
    const settingsDisclosure=document.getElementById('headerSettings');
    settingsDisclosure.addEventListener('toggle',()=>{if(!settingsDisclosure.open)document.getElementById('mapSources').open=false;});
  }
  function sync(canvasRect,dockRect) {
    if(!active()||!dockRect||!mapScreenArea)return;
    const center=(dockRect.left+dockRect.right)/2-canvasRect.left;
    const header=document.querySelector('.top-header').getBoundingClientRect();
    const tablet=cw>768&&cw<=1080;
    // The arrival flow keeps the dock at the bottom on tablets: follow where the dock actually is.
    const dockOnTop=tablet&&dockRect.top-canvasRect.top<ch/2;
    const menuSpace=dockOnTop?ch-(dockRect.bottom-canvasRect.top)-20:dockRect.top-header.bottom-20;
    dock.style.setProperty('--gv-camera-menu-height',Math.max(60,menuSpace)+'px');
    if(dockOnTop){
      mapScreenArea.top=Math.max(header.bottom-canvasRect.top+16,dockRect.bottom-canvasRect.top+16);
      mapScreenArea.bottom=Math.max(mapScreenArea.top+80,ch-16);
    }
    if(cw>900){
      const x=tablet?Math.max(54,center-dockRect.width/2-52):center;
      const y=tablet?dockRect.top-canvasRect.top+24:dockRect.top-canvasRect.top-72;
      mapCompass=y-34>=header.bottom-canvasRect.top+2?{x,y,radius:36}:null;
    }else mapCompass=null;
  }
  function mount() {
    if(!active()){
      icon?.remove();divider?.remove();icon=divider=null;
      if(priorMenuHeight)dock.style.setProperty('--gv-camera-menu-height',priorMenuHeight,priorMenuPriority);else dock.style.removeProperty('--gv-camera-menu-height');
      if(!hadStyle&&!dock.getAttribute('style'))dock.removeAttribute('style');
      syncHeaderOffset();return;
    }
    const entering=!icon;
    if(entering){
      icon=document.createElement('img');icon.className='gv-island-heading-art';icon.alt='';icon.setAttribute('aria-hidden','true');icon.width=37;icon.height=27;icon.src=iconURL;
      helper.querySelector('.island-helper-heading').prepend(icon);
      divider=document.createElement('div');divider.className='gv-island-divider';divider.setAttribute('aria-hidden','true');
      divider.innerHTML='<svg viewBox="0 0 24 18" focusable="false" aria-hidden="true"><g fill="currentColor"><path d="m12 3 4 4-4 4-4-4Zm-7 4 3 3-3 3-3-3Zm14 0 3 3-3 3-3-3Zm-7 5 3 3-3 3-3-3Z"/></g></svg>';
      helper.querySelector('.map-legend').before(divider);
    }
    syncHeaderOffset();
    // Preserve the native home exit's angle/selection; only fit zoom to the new UI bounds.
    if(entering){state.cam.zoom=state.cam.targetZoom=getBestOverviewZoom(cw,ch);requestMapRender(2);}
  }
  window.GoiVietMapControlPlacement=Object.freeze({sync,active});
  new MutationObserver(mount).observe(intro,{attributes:true,attributeFilter:['class']});
  document.fonts.ready.then(()=>{if(active())syncHeaderOffset();});
  mount();
})();
