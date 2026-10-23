/* Sourced reef geometry with clear depth/material hierarchy, private preview. */
(() => {
  'use strict';
  const C=window.GoiVietNaturalCore,cache=new Map(),catalogs=new WeakMap(),buttons=new Map(),positions=new Map();
  const ids=new Set(['hoang-sa','truong-sa']);
  let builds=0,cacheBytes=0,lastFrame=[],buttonFrame=0;
  const palette={
    footprint:{color:[105,167,155],alpha:.16,order:0},
    slope:{color:[48,126,137],alpha:.48,order:1},
    plateau:{color:[91,157,148],alpha:.48,order:2},
    outer:{color:[123,183,164],alpha:.68,order:3},
    inner:{color:[134,192,166],alpha:.7,order:4},
    shallow:{color:[80,155,151],alpha:.67,order:5},
    deep:{color:[40,106,128],alpha:.82,order:6},
    crest:{color:[198,210,169],alpha:.78,order:7}
  };
  function type(item){
    const name=String(item.habitat||item.className||item.name).toLowerCase();
    if(name.includes('footprint'))return 'footprint';if(name.includes('deep lagoon'))return 'deep';if(name.includes('lagoon'))return 'shallow';
    if(name.includes('crest'))return 'crest';if(name.includes('outer')||name.includes('terrestrial'))return 'outer';if(name.includes('flat'))return 'inner';if(name.includes('plateau'))return 'plateau';return 'slope';
  }
  function rgba(rgb,alpha,dark){return 'rgba('+rgb.map(v=>Math.round(v*(dark?.68:1))).join(',')+','+alpha+')';}
  function catalog(group){
    if(catalogs.has(group))return catalogs.get(group);
    const features=group.reefs.map(item=>({item,type:type(item)})).sort((a,b)=>palette[a.type].order-palette[b.type].order);
    const footprints=features.filter(f=>f.type==='footprint').map(f=>f.item).sort((a,b)=>(b.areaWorld||0)-(a.areaWorld||0));
    const result={features,footprints};catalogs.set(group,result);return result;
  }
  function sourcePath(context,item,project,level){C.path(context,item.rings,project,level);}
  function drawReefs(context,group,project,dark,extent,detail,zoom,refined){
    const source=refined?{features:[...catalog(group).features.filter(f=>f.type==='footprint'),...(refined.fallbackGroup?catalog(refined.fallbackGroup).features:[]),...catalog(refined).features]}:catalog(group);
    let count=0;
    for(const {item,type:kind}of source.features){
      if(extent&&!C.overlaps(item.bounds,extent))continue;
      if((item.areaWorld||0)*zoom*zoom<(detail?.025:.05)&&kind!=='footprint')continue;
      // Fine rings are already topology-preserving source geometry. A second
      // simplification turns narrow crest patches into conspicuous triangles.
      sourcePath(context,item,project,refined?-1:detail?2:1);
      const material=palette[kind],alpha=kind==='footprint'&&refined ? .055 : material.alpha;
      context.fillStyle=rgba(material.color,alpha,dark);context.fill('evenodd');
      // A narrow, sharp edge expresses a real reef footprint; never a glow.
      if(kind==='footprint'){
        if(!refined){context.strokeStyle=rgba([135,190,171],.4,dark);context.lineWidth=detail?.5:.65;context.stroke();}
      }
      count++;
    }
    return count;
  }
  function tile(group,tx,ty,density,dark){
    const key=[group.id,tx,ty,density,dark].join(':');
    if(cache.has(key)){const value=cache.get(key);cache.delete(key);cache.set(key,value);return value;}
    const image=document.createElement('canvas');image.width=image.height=64*density+4;
    const context=image.getContext('2d'),box={left:tx*64-2/density,top:ty*64-2/density,right:(tx+1)*64+2/density,bottom:(ty+1)*64+2/density};
    const project=(x,y)=>[(x-box.left)*density,(y-box.top)*density,density];
    drawReefs(context,group,project,dark,box,false,density,null);
    cache.set(key,image);cacheBytes+=image.width*image.height*4;builds++;
    while(cacheBytes>24*1024*1024&&cache.size>1){const first=cache.keys().next().value,value=cache.get(first);cacheBytes-=value.width*value.height*4;cache.delete(first);}
    return image;
  }
  function paint(context,group,camera,w,h,dark,extent,options={}){
    if(!ids.has(group.id))return null;
    const detail=Boolean(options.detail),project=C.projector(camera,w,h),zoom=camera.zoom;
    // The fine atlas covers sourced connected reefs near the islands. Remote
    // reefs outside that coverage retain the overview instead of disappearing.
    const refined=detail&&zoom>12&&options.fine?.fallbackGroup&&catalog(options.fine).features.some(f=>!extent||C.overlaps(f.item.bounds,extent))?options.fine:null;
    context.save();context.lineJoin='round';context.lineCap='round';
    if(detail)drawReefs(context,group,project,dark,extent,true,zoom,refined);
    else{
      const density=zoom>1.5?3:1.5,b={left:Math.max(group.bounds.left,extent.left),top:Math.max(group.bounds.top,extent.top),right:Math.min(group.bounds.right,extent.right),bottom:Math.min(group.bounds.bottom,extent.bottom)};
      for(let ty=Math.floor(b.top/64);ty<=Math.floor(b.bottom/64);ty++)for(let tx=Math.floor(b.left/64);tx<=Math.floor(b.right/64);tx++){const image=tile(group,tx,ty,density,dark),box={left:tx*64-2/density,top:ty*64-2/density,right:(tx+1)*64+2/density,bottom:(ty+1)*64+2/density};if(!window.GoiVietWebGLTerrain3?.paintIslandTile(context,image,box))C.tile(context,image,box,project,w,h);}
    }
    // Habitat boundaries are sourced contours. Dashed animated rims implied
    // breaking surf around every reef, including submerged features; omit them.
    let count=0;
    for(const item of group.islands){
      if(extent&&!C.overlaps(item.bounds,extent))continue;
      sourcePath(context,item,project,detail?2:1);
      context.fillStyle=dark?'#AAA47E':'#E5D5AC';context.fill('evenodd');
      context.strokeStyle=dark?'#A6B993':'#B5C6A4';context.lineWidth=detail?1.8:1;context.stroke();
      // Existing sourced WorldCover/DEM texture is clipped to the actual coast.
      if(detail||zoom>1.5){context.save();context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';window.GoiVietNaturalTerrainRenderer.paintOffshore(context,item,camera,w,h);context.restore();}
      sourcePath(context,item,project,detail?2:1);
      context.strokeStyle=dark?'#D7CCAA':'#F6E9CB';context.lineWidth=detail?.85:.6;context.stroke();
      // Small dry islands keep a sand edge; no enlarged invented land mass.
      count++;
    }
    context.restore();
    lastFrame.push({id:group.id,detail,zoom,fine:!!refined,islands:count,reefClasses:[...new Set(catalog(refined||group).features.map(f=>f.type))]});
    if(lastFrame.length>12)lastFrame.shift();
    return count;
  }
  // Any [hidden] change restyles the whole page (the stylesheets pair :has([hidden]) with body:has() rules);
  // an inline display change restyles only this element.
  const show=(button,on)=>{const display=on?'':'none';if(button.style.display!==display)button.style.display=display;};
  function positionButton(id,box){
    if(!ids.has(id))return;
    let button=buttons.get(id);
    if(!button){
      button=document.createElement('button');button.type='button';button.className='archipelago-detail-button';button.id='detailButton-'+id;button.style.display='none';button.style.left=button.style.top='0px';
      button.setAttribute('aria-label','Xem gần quần đảo '+(id==='hoang-sa'?'Hoàng Sa':'Trường Sa'));button.setAttribute('aria-haspopup','dialog');
      button.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6M7 10h6m-3-3v6"/></svg><span>Xem gần</span>';
      button.addEventListener('click',()=>window.GoiVietNaturalLandscape.openDetail(id,button));
      document.getElementById('mapScene').append(button);buttons.set(id,button);
    }
    const hide=!box||!document.getElementById('introScreen').classList.contains('intro-hidden');
    show(button,!hide);
    if(hide)return;
    // A transform moves the button without a layout pass; whole pixels keep its text crisp, as before.
    const left=Math.round(box.left),top=Math.round(box.top),key=left+':'+top;
    if(positions.get(id)!==key){positions.set(id,key);button.style.transform='translate('+left+'px,'+top+'px)';}
    buttonFrame++;
  }
  new MutationObserver(()=>{if(!document.getElementById('introScreen').classList.contains('intro-hidden'))for(const button of buttons.values())show(button,false);}).observe(document.getElementById('introScreen'),{attributes:true,attributeFilter:['class']});
  window.GoiVietArchipelagoArt=Object.freeze({paint,positionButton,inspect:()=>({builds,cacheTiles:cache.size,cacheBytes,lastFrame:lastFrame.map(v=>({...v})),buttons:[...buttons].map(([id,b])=>({id,hidden:b.style.display==='none',position:b.getBoundingClientRect().toJSON()})),buttonFrame})});
})();
