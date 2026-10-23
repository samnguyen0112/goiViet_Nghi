// Preview 3 copy: the station panel writes its accessibility state only when it changes.
/* Presentation refinements scoped to the preview. Application state remains owned by the clone. */
(() => {
  'use strict';
  const intro=document.getElementById('introScreen');
  if(!intro)return;
  function mount(){
  const panel=document.getElementById('stationPanel'),scene=document.getElementById('mapScene');
  if(!panel||!scene)return;
  const paths={chevron:'<path d="m9 5 7 7-7 7"/>',list:'<path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',star:'<path d="m12 2 3 6.5 7 1-5 5 1.2 7L12 18l-6.2 3.5L7 14.5l-5-5 7-1z" fill="currentColor" stroke="none"/>',map:'<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2ZM9 3v16m6-14v16"/>',target:'<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 1v4m0 14v4M1 12h4m14 0h4"/>',check:'<path d="m4 12 5 5L20 6"/>',mountain:'<path d="m2 19 7-13 4 7 3-5 6 11ZM6 12l3 2 3-2"/>'};
  const icon=key=>`<svg class="preview-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[key]}</svg>`;
  const heading=document.createElement('div');heading.className='preview-panel-heading';
  const masthead=document.createElement('div');masthead.className='heritage-masthead';
  const brand=document.createElement('img');brand.className='heritage-brand-logo';brand.src=document.querySelector('#mapScene .map-brand-logo')?.getAttribute('src')||'assets/goi-viet/brand/goi-viet-logo-512.webp';brand.alt='Gói Việt';brand.width=1850;brand.height=850;brand.decoding='async';
  const title=document.createElement('h2');title.textContent='Các ga di sản';
  const note=document.createElement('span');note.className='heritage-heading-note';note.textContent='Mỗi điểm dừng, một miền thương nhớ.';
  masthead.append(brand,title,note);heading.append(masthead);
  const close=document.createElement('button');close.id='previewPanelClose';close.className='preview-panel-toggle';close.type='button';close.innerHTML='<span>Thu gọn</span>'+icon('chevron');close.setAttribute('aria-controls','stationPanel');close.setAttribute('aria-expanded','true');close.title='Thu gọn bảng thẻ để mở rộng bản đồ';heading.append(close);
  const scroll=document.createElement('div');scroll.className='preview-panel-scroll';scroll.id='previewPanelScroll';scroll.tabIndex=0;scroll.setAttribute('role','region');scroll.setAttribute('aria-label','Thẻ thông tin các ga và hành trình');
  const filter=panel.querySelector('.panel-filters');[...panel.children].filter(e=>e!==filter).forEach(e=>scroll.append(e));panel.prepend(heading);panel.append(scroll);
  const foot=document.createElement('div');foot.className='preview-panel-foot';foot.innerHTML='<span aria-hidden="true">✦</span> Dọc miền di sản <span class="heritage-foot-line" aria-hidden="true"></span><span>Cuộn để khám phá ↓</span>';panel.append(foot);
  const open=document.createElement('button');open.id='previewPanelOpen';open.className='preview-panel-toggle giay-do-surface';open.type='button';open.innerHTML=icon('list')+'<span>Mở thẻ ga</span>';open.setAttribute('aria-controls','stationPanel');open.setAttribute('aria-expanded','true');scene.append(open);
  let collapsed=false,frame=0,lastSelected='',applying=false;
  function syncAccessibility(){const hidden=innerWidth<=768?document.body.classList.contains('mobile-map-focus'):collapsed;if(panel.inert!==hidden)panel.inert=hidden;if(panel.getAttribute('aria-hidden')!==String(hidden))panel.setAttribute('aria-hidden',String(hidden));for(const toggle of [close,open])if(toggle.getAttribute('aria-expanded')!==String(!hidden))toggle.setAttribute('aria-expanded',String(!hidden));}
  function animateLayout(){syncHeaderOffset();cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{frame=0;syncHeaderOffset();window.GoiVietMapFrame?.syncSafeArea();});}
  panel.addEventListener('transitionend',event=>{if(event.target===panel&&event.propertyName==='transform')animateLayout();});
  function setCollapsed(value){if(innerWidth<=768)return;collapsed=Boolean(value);document.body.classList.toggle('preview-panel-collapsed',collapsed);syncAccessibility();(collapsed?open:close).focus({preventScroll:true});animateLayout();}
  close.addEventListener('click',()=>setCollapsed(true));open.addEventListener('click',()=>setCollapsed(false));
  function layout(){const compact=innerWidth<=768||panel.getBoundingClientRect().height<520;panel.classList.toggle('preview-panel-compact',compact);if(compact&&filter.parentElement!==scroll)scroll.prepend(filter);else if(!compact&&filter.parentElement!==panel)heading.after(filter);if(innerWidth<=768&&collapsed){collapsed=false;document.body.classList.remove('preview-panel-collapsed');}syncAccessibility();}
  function replaceLeadingSymbol(el,key){if(!el)return;const node=[...el.childNodes].find(n=>n.nodeType===3&&/^\s*[★✓✦🎯⌖🗺📜🏔]/u.test(n.textContent));if(!node)return;node.textContent=node.textContent.replace(/^\s*(?:🏔️|[★✓✦🎯⌖🗺📜🏔])\s*/u,'');el.insertAdjacentHTML('afterbegin',icon(key));}
  function heroFallback(){for(const id of ['hue','hcm']){const hero=document.getElementById('story-hero-'+id),image=hero?.querySelector('.place-hero-img');if(!hero||!image||image.dataset.previewChecked)continue;image.dataset.previewChecked='true';const sync=()=>{const failed=image.complete&&!image.naturalWidth;hero.classList.toggle('preview-hero-fallback',failed);if(failed&&!hero.querySelector('.preview-fallback-note')){const note=document.createElement('span');note.className='preview-fallback-note';note.textContent=id==='hue'?'Minh họa Ngọ Môn':'Minh họa chợ Bến Thành';hero.append(note);}else if(!failed)hero.querySelector('.preview-fallback-note')?.remove();};image.addEventListener('load',sync);image.addEventListener('error',sync);sync();}}
  function decorate(){if(applying||!intro.classList.contains('intro-hidden'))return;applying=true;
    panel.querySelectorAll('.place-card.selected').forEach(card=>{
      const title=card.querySelector('.place-hero-title');
      if(!title||!card.querySelector('.ui-ref-action-full')||title.querySelector('.heritage-place-name'))return;
      const id=card.id.replace('placeCard-',''),name=title.textContent.trim(),short=name.replace(/^(Thành phố|Tỉnh)\s+/i,''),prefix=name.slice(0,name.length-short.length).trim();
      const code=id==='hn'?'HAN':id==='hue'?'HUE':id==='hcm'?'SGN':id==='hoang-sa'?'HSA':id==='truong-sa'?'TSA':short.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'D').replace(/[^a-z]/gi,'').slice(0,3).toUpperCase();
      const board=card.querySelector('.station-board-name');
      const label=document.createElement('span');label.className='heritage-stop-label';label.textContent=id==='hoang-sa'||id==='truong-sa'?'HẢI TRÌNH DI SẢN':'GA DI SẢN';
      const number=document.createElement('span');number.className='heritage-stop-code';number.textContent=code;
      board.replaceChildren(number,label);
      const full=card.querySelector('.ui-ref-action-full');full.textContent=id==='hoang-sa'||id==='truong-sa'?'Xem hải trình':'Đưa tàu vào ga';
      title.replaceChildren();
      if(prefix){const p=document.createElement('span');p.className='heritage-place-prefix';p.textContent=prefix;title.append(p);}
      const strong=document.createElement('span');strong.className='heritage-place-name';strong.textContent=short;title.append(strong);
      const cue=document.createElement('span');cue.className='heritage-hero-cue';cue.setAttribute('aria-hidden','true');cue.textContent='↗';card.querySelector('.place-hero-banner').append(cue);
      const overview=card.querySelector('.place-overview');
      const overline=document.createElement('div');overline.className='heritage-section-label';overline.innerHTML='<span>DẤU ẤN VÙNG ĐẤT</span><span aria-hidden="true">✦</span>';overview.prepend(overline);
      card.querySelectorAll('.highlight-chip-box').forEach((box,i)=>{const n=document.createElement('span');n.className='heritage-highlight-number';n.setAttribute('aria-hidden','true');n.textContent=String(i+1).padStart(2,'0');box.prepend(n);});
    });
    document.querySelectorAll('#stationPanel .place-compact-title').forEach(el=>replaceLeadingSymbol(el,'star'));
    document.querySelectorAll('#stationPanel .tracker-box-title').forEach((el,i)=>replaceLeadingSymbol(el,i?'star':'check'));
    heroFallback();
    replaceLeadingSymbol(document.querySelector('.island-helper-heading h2'),'mountain');replaceLeadingSymbol(document.querySelector('#btnRecenterMap span'),'target');replaceLeadingSymbol(document.querySelector('#btnFocusStation'),'target');
    const mobile=document.getElementById('mobileTogglePanelLabel');if(mobile){const hidden=document.body.classList.contains('mobile-map-focus');const text=hidden?'Xem danh sách ga':'Xem bản đồ';if(mobile.dataset.face!==text||!mobile.querySelector('svg')){mobile.innerHTML=icon(hidden?'list':'map')+'<span>'+text+'</span>';mobile.dataset.face=text;}}
    const selected=panel.querySelector('.place-card.selected');if(selected&&selected.id!==lastSelected){lastSelected=selected.id;requestAnimationFrame(()=>{if(panel.inert)return;const a=selected.getBoundingClientRect(),b=scroll.getBoundingClientRect();scroll.scrollTop+=a.top-b.top-12;});}
    applying=false;
  }
  new MutationObserver(decorate).observe(panel,{childList:true,subtree:true});
  new MutationObserver(()=>{syncAccessibility();decorate();}).observe(document.body,{attributes:true,attributeFilter:['class']});
  new MutationObserver(()=>{layout();decorate();}).observe(intro,{attributes:true,attributeFilter:['class']});
  new MutationObserver(decorate).observe(document.getElementById('mobileTogglePanelLabel'),{childList:true});
  window.addEventListener('resize',layout,{passive:true});new ResizeObserver(layout).observe(panel);
  function paintPin(context,explored,x,y){context.save();context.translate(x,y);if(explored){context.beginPath();context.moveTo(-4,0);context.lineTo(-1,3);context.lineTo(5,-4);context.strokeStyle=context.fillStyle;context.lineWidth=1.7;context.lineCap='round';context.lineJoin='round';context.stroke();}else{context.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?2.3:5.5;const px=Math.cos(a)*r,py=Math.sin(a)*r;if(i)context.lineTo(px,py);else context.moveTo(px,py);}context.closePath();context.fill();}context.restore();}
  window.GoiVietPreviewPolish=Object.freeze({setCollapsed,paintPin,inspect:()=>({collapsed,compact:panel.classList.contains('preview-panel-compact'),scrollTop:scroll.scrollTop,scrollHeight:scroll.scrollHeight,clientHeight:scroll.clientHeight,inert:panel.inert,animating:Boolean(frame)})});
  layout();decorate();
  }
  if(intro.classList.contains('intro-hidden'))mount();
  else {const observer=new MutationObserver(()=>{if(!intro.classList.contains('intro-hidden'))return;observer.disconnect();mount();});observer.observe(intro,{attributes:true,attributeFilter:['class']});}
})();
