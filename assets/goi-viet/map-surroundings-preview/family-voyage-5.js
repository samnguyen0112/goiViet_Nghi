/* Desktop-only family voyages for preview-5. No persistence, network, or mutations of source decks.
   Uses the existing geographic canvas and modal focus trap. Mobile keeps the original chart DOM/layout. */
(() => {
  'use strict';
  const D = window.GoiVietFamilyVoyageData;
  const P = window.GoiVietSeaPostOffice;
  if (!D) return;
  const desktop = matchMedia('(min-width: 961px)');
  const sessions = new Map(), archives = new Map();
  const isEnglish = () => window.GoiVietI18n?.lang() === 'en';
  const L = value => typeof value === 'object' && value ? value[isEnglish() ? 'en' : 'vi'] || value.vi : value;
  const say = (key, vars = {}) => String(L(P?.ui[key] || D.ui[key]) || key).replace(/\{(\w+)\}/g, (m,k) => vars[k] ?? m);
  const E = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const geo = value => window.GoiVietContent?.geo(value) || value;
  const lotus = '<svg viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M32 48C15 37 19 20 32 9c13 11 17 28 0 39Z"/><path d="M32 48C16 49 7 35 9 22c15 1 23 11 23 26Zm0 0c16 1 25-13 23-26-15 1-23 11-23 26Z"/><path d="M32 48C17 56 5 45 4 34c13-1 22 3 28 14Zm0 0c15 8 27-3 28-14-13-1-22 3-28 14Z"/><path d="M19 54h26M32 26v22"/></g></svg>';
  const $ = selector => dialog?.querySelector(selector);
  const btn = (action, text, extra = '', primary = false) => `<button type="button" class="voyage-btn${primary ? ' voyage-primary' : ''}" data-voyage-action="${action}" ${extra}>${E(text)}</button>`;
  const landscape = () => window.GoiVietNaturalLandscape;
  const shuffle = input => { const a = [...input]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
  let dialog, body, root, bar, map, nativeLayout, mapSlot, panel, scene, dock, workbench, album, rail, layer, toolbar, live;
  let enabled = false, currentId = null, groupData = null, mode = 'play', activeArchive = -1, targetEntries = [];
  let drawLock = false, drawTimers = [], timer = null, seconds = 60, exporting = false;
  let viewTicket = 0, original = null, completingUntil = 0;
  const getSession = () => sessions.get(currentId);
  const getRoute = () => D.routes[currentId];
  const getStop = () => getSession()?.stops[getSession().index];
  const getStep = () => getRoute()?.stops[getSession().index];
  const getLetter = index => P?.routes[currentId]?.letters[index ?? getSession()?.index];
  const focus = selector => queueMicrotask(() => { const el = $(selector); if(enabled && dialog.classList.contains('open') && el && !el.closest('[hidden],[inert]')) el.focus({preventScroll:true}); });
  const announce = message => { if(live) live.textContent = message; };
  const person = index => typeof getPlayerDisplayName === 'function' ? getPlayerDisplayName(index) : say('turn',{name:String(index+1)});
  const authorOf = stop => stop.author ? person(stop.playerIdx) : '';
  const readerIndex = () => { const s=getSession(),n=Math.max(2,state.playerCount||2);return ((s?.turnIndex??state.currentPlayerIndex??0)+(s?.roleOffset||0))%n; };
  const roles = () => { const s=getSession(),n=Math.max(2,state.playerCount||2),i=(s?.turnIndex??state.currentPlayerIndex??0)%n;return s?.roleOffset?[person((i+1)%n),person(i)]:[person(i),person((i+1)%n)]; };
  const reduced = () => state.reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;
  function fresh(id) {
    return { id, title:'', date:new Date().toISOString(), index:0, phase:'map', turnIndex:state.currentPlayerIndex||0,roleOffset:0, view:null, albumEdit:false,
      stops:D.routes[id].stops.map((_,i) => ({routeId:id,letterIndex:i,found:false,status:'pending',opened:false,wordIndex:-1,noteOpen:false,drawn:[],cardId:null,order:[],selected:null,revealed:false,unlocked:false,activity:0,hint:0,clueOpen:false,note:'',memoryPlace:'',bag:[],starter:-1,author:'',playerIdx:0,helperIdx:null,memoryId:null,memorySig:''})) };
  }
  function currentEntries() { return window.GoiVietIslandChart?.inspect().entries || []; }
  function targets() { return targetEntries; }
  function snapshot() {
    if(!enabled || !getSession() || !map?.getBoundingClientRect().width)return;
    const view=landscape()?.getDetailView();
    if(view?.group===currentId)getSession().view=view;
  }
  function refreshMap({restore = true} = {}) {
    const ticket=++viewTicket, s=getSession();
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if(ticket!==viewTicket || !enabled || mode!=='atlas' || s!==getSession() || !dialog.classList.contains('open'))return;
      if(restore && s.view) landscape().restoreDetailView(s.view);
      else landscape().selectDetail('-1');
    }));
  }
  function mount(el) {
    if(dialog)return;
    dialog=el;body=$('.natural-detail-body');map=$('.natural-detail-map');nativeLayout=$('.island-chart-layout');
    bar=document.createElement('nav');bar.className='voyage-modebar voyage-only';bar.setAttribute('aria-label',say('brand'));body.prepend(bar);
    root=document.createElement('div');root.className='voyage-root voyage-only';
    root.innerHTML='<div class="sea-scene"></div><div class="voyage-grid"><div class="voyage-map-slot"></div><aside class="voyage-panel"></aside></div><div class="voyage-dock"></div><div class="voyage-workbench"></div><section class="voyage-album"></section><nav class="voyage-rail"></nav><p class="voyage-status" role="status" aria-live="polite" aria-atomic="true"></p>';
    body.append(root);mapSlot=$('.voyage-map-slot');panel=$('.voyage-panel');dock=$('.voyage-dock');workbench=$('.voyage-workbench');album=$('.voyage-album');rail=$('.voyage-rail');live=$('.voyage-status');
    scene=$('.sea-scene');
    layer=document.createElement('div');layer.className='voyage-map-layer voyage-only';map.append(layer);
    toolbar=document.createElement('div');toolbar.className='voyage-map-tools voyage-only';map.append(toolbar);
    const kicker=document.createElement('div');kicker.className='voyage-kicker voyage-only';$('#naturalIslandHeading').before(kicker);
    dialog.addEventListener('click',handleClick);
    dialog.addEventListener('input',handleInput);
    dialog.addEventListener('change',handleChange);
    dialog.addEventListener('toggle',e=>{if(e.target.classList?.contains('sea-keepsake')&&getStop())getStop().noteOpen=e.target.open;},true);
    desktop.addEventListener('change',() => {
      if(!currentId || !D.routes[currentId])return;
      if(!desktop.matches){snapshot();cancelDraw();stopTimer();disable();}
      else { enable();render();refreshMap(); }
    });
  }
  function enable() {
    if(enabled)return;
    enabled=true;dialog.classList.add('voyage-enabled','sea-postoffice');
    if(!original) original={heading:$('#naturalIslandHeading').textContent,caption:$('.natural-detail-caption').textContent};
    nativeLayout.append(map);
  }
  function disable() {
    ++viewTicket;enabled=false;dialog.classList.remove('voyage-enabled','sea-postoffice','voyage-atlas','voyage-card-open','voyage-deck-open','voyage-album-open','voyage-destinations-open');
    delete dialog.dataset.voyagePhase;
    if(nativeLayout && map)nativeLayout.append(map);
    if(original){
      const route=D.routes[currentId],heading=route&&window.GoiVietI18n?.t('isl.heading',{place:route.name}),caption=route&&window.GoiVietI18n?.t('isl.captionArch');
      $('#naturalIslandHeading').textContent=route?(heading&&heading!=='isl.heading'?heading:'Khám phá '+route.name):original.heading;
      $('.natural-detail-caption').textContent=route?(caption&&caption!=='isl.captionArch'?caption:'Chọn địa danh, hoặc bấm điểm định vị trên bản đồ để xem gần.'):original.caption;
    }
    $('#naturalClose').textContent=window.GoiVietI18n?.t('isl.close') || 'Đóng ×';
    $('#naturalClose').setAttribute('aria-label',window.GoiVietI18n?.t('isl.closeLabel') || 'Đóng bản đồ đảo');
  }
  function onGroup(group) {
    cancelDraw();stopTimer();
    groupData=group;currentId=group.id;mode='play';activeArchive=-1;
    const entries=currentEntries();targetEntries=D.routes[currentId]?.stops.map(step=>entries.find(e=>e.type==='land'&&e.label===step.target))||[];
    original={heading:$('#naturalIslandHeading').textContent,caption:$('.natural-detail-caption').textContent};
    if(!D.routes[currentId] || !desktop.matches){disable();return;}
    if(!sessions.has(currentId))sessions.set(currentId,fresh(currentId));
    enable();render();refreshMap();
    markPlaceExplored(currentId);
  }
  function onClose() {
    if (!enabled) return;
    snapshot();cancelDraw();stopTimer();++viewTicket;
    queueMicrotask(() => window.GoiVietArrivalDemo?.refresh());
  }
  function cancelDraw() {
    drawTimers.forEach(clearTimeout);drawTimers=[];drawLock=false;
    dock?.querySelector('.voyage-fan')?.classList.remove('is-shuffling','phase-gather','phase-shuffle','phase-pick','phase-draw');
    dock?.removeAttribute('aria-busy');
    if(enabled && getSession()){renderDock();renderPanel();}
  }
  function onSelect(value) {
    if(!enabled || getSession()?.index>=3)return;
    const entry=currentEntries().find(e=>e.value===String(value));if(!entry)return;
    const found=entry.label===getStep().target;
    if(found){getStop().found=true;renderPanel();renderDock();announce(say('found',{place:geo(entry.label)}));}
    else announce(say('looking',{place:geo(entry.label)}));
    snapshot();
  }
  function render() {
    if(!enabled)return;
    const s=getSession(),route=getRoute();if(!s||!route)return;
    const card=mode==='play'&&s.phase==='card'&&!!getStop()?.cardId;
    const deck=mode==='play'&&s.phase==='deck';
    const showAlbum=mode==='album'||(mode==='play'&&s.index>=3&&s.phase!=='sent');
    dialog.classList.toggle('voyage-atlas',mode==='atlas');dialog.classList.toggle('voyage-card-open',card);
    dialog.classList.toggle('voyage-deck-open',deck);dialog.classList.toggle('voyage-album-open',showAlbum);
    dialog.dataset.voyagePhase=mode==='atlas'?'atlas':showAlbum?'album':card?'card':deck?'deck':s.phase;
    if(map.parentElement!==nativeLayout)nativeLayout.append(map);
    $('.voyage-kicker').textContent=say('brand');$('#naturalIslandHeading').textContent=route.name;
    $('.natural-detail-caption').textContent=L(P.routes[currentId].subtitle);
    $('#naturalClose').textContent=say('pause');$('#naturalClose').setAttribute('aria-label',say('pause'));
    bar.innerHTML=`<div class="sea-quiet-nav">${btn('play',say('play'),`aria-pressed="${mode==='play'}"`)}${btn('atlas',say('atlas'),`aria-pressed="${mode==='atlas'}"`)}${btn('album',say('album'),`aria-pressed="${mode==='album'}"`)}</div><details class="sea-more"><summary>${E(say('more'))} <span aria-hidden="true">+</span></summary><div class="sea-more-content">${s.index<3?btn('deck',say('deck')):''}${btn('story',say('source'))}${btn('originals',say('originals'))}${btn('destinations',say('switch'))}${s.index<3?btn('roles',say('swapRoles')):''}<div class="voyage-language" role="group" aria-label="Language"><button type="button" data-voyage-action="vi" aria-pressed="${!isEnglish()}">VI</button><button type="button" data-voyage-action="en" aria-pressed="${isEnglish()}">EN</button></div></div></details>`;
    renderScene();renderDock();renderCards();renderAlbum();renderRail();
    refreshMap();
  }
  function icon(name) {
    const paths={
      letter:'<path d="M8 17h48v32H8z"/><path d="m8 17 24 19 24-19M8 49l16-18m32 18L40 31"/>',
      home:'<path d="m8 31 24-20 24 20M14 26v28h36V26M26 54V37h12v17"/>',
      heart:'<path d="M32 53 10 31C-2 13 20 3 32 18 44 3 66 13 54 31Z"/>',
      sun:'<circle cx="32" cy="32" r="12"/><path d="M32 5v8m0 38v8M5 32h8m38 0h8M13 13l6 6m26 26 6 6m0-38-6 6M19 45l-6 6"/>',
      sail:'<path d="M7 48h50L45 58H19Z M32 7v41M29 11 12 41h17Zm7 7 15 23H36Z"/>',
      tree:'<path d="M29 60V38h6v22M14 36C-1 31 5 16 17 17c-1-16 28-18 30 0 16 0 20 18 5 22H14Z"/>',
      rice:'<path d="M9 36h46c-3 27-43 27-46 0ZM12 30c6-20 34-20 40 0M23 19l5 6m6-10 2 8m6 0 3 5"/>',
      cup:'<path d="M13 23h31v24c0 15-31 15-31 0ZM44 27h7c14 0 13 19-7 18M21 16c-6-8 5-6 1-13m12 13c-6-8 5-6 1-13"/>',
      photo:'<path d="M8 10h48v44H8zM13 45l13-15 10 10 7-7 8 12"/><circle cx="41" cy="23" r="5"/>',
      bell:'<path d="M16 43V29c0-24 32-24 32 0v14l6 5H10ZM26 54c1 8 11 8 12 0M28 8V4h8v4"/>',
      moon:'<path d="M45 8C14-1-3 38 19 54c17 12 37-1 38-18C33 49 16 17 45 8Z"/><path d="m49 11 3 6 7 1-5 4 1 7-6-4-6 4 1-7-5-4 7-1Z"/>',
      music:'<path d="M25 47V15l28-7v32M25 24l28-7"/><ellipse cx="16" cy="49" rx="9" ry="7"/><ellipse cx="44" cy="42" rx="9" ry="7"/>',
      shell:'<path d="M29 55C-7 41 2 5 32 7c31-2 40 34 3 48ZM12 22l17 30M22 11l9 41M52 22 35 52M42 11l-9 41M32 8v44"/>',
      bag:'<path d="M14 22h36l6 35H8ZM23 24V13c0-14 18-14 18 0v11"/>',
    };
    return `<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.letter}</svg>`;
  }
  function boatMarkup() {
    return '<div class="sea-water" aria-hidden="true"><svg viewBox="0 0 1100 290" preserveAspectRatio="none"><path d="M0 80Q180 15 360 85T720 75T1100 80V290H0Z"/><path d="M0 160Q220 90 440 145T880 145T1100 155"/><path d="M0 228Q180 165 360 220T720 220T1100 225"/></svg></div><img class="sea-sailboat" src="assets/goi-viet/memory-reference-v5/sailboat-single-640.webp" alt="" aria-hidden="true">';
  }
  function renderScene() {
    if(!enabled||!scene)return;
    const s=getSession(),route=getRoute();if(!s||!route)return;
    if(mode==='story'){
      const step=route.stops[Math.min(s.index,2)];
      scene.innerHTML=`<article class="sea-story-sheet"><span class="sea-overline">${E(L(step.context))}</span><h3 tabindex="-1">${E(say('source'))}</h3><p>${E(L(step.reading))}</p>${sourceMarkup(step)}${btn('play',say('backMap'))}</article>`;return;
    }
    if(mode!=='play'||['card','deck'].includes(s.phase)||(s.index>=3&&s.phase!=='sent')){scene.innerHTML='';return;}
    if(s.phase==='sent'){
      const i=s.lastSent??Math.max(0,s.index-1),stop=s.stops[i],letter=getLetter(i);
      scene.innerHTML=`<div class="sea-tableau is-sent">${boatMarkup()}<div class="sea-sent-letter"><div class="sea-ink-stamp"><span>${lotus}</span><strong>${E(stop.status==='skipped'?say('skipped'):say('sent'))}</strong><small>${E(route.name)}</small></div><h3>${E(L(letter.title))}</h3><p class="sea-kept">${E(keptText(stop)||say('sentHint'))}</p>${btn('next-letter',s.index<3?say('nextLetter'):say('collect'),'',true)}</div></div>`;return;
    }
    const stop=getStop(),letter=getLetter();
    if(!stop||!letter){scene.innerHTML='';return;}
    const open=s.phase==='letter';
    if(!open){
      scene.innerHTML=`<div class="sea-tableau is-sealed"><div class="sea-scene-heading"><span class="sea-overline">${E(L(P.routes[currentId].title))}</span><h3>${E(say('sealedTitle'))}</h3><p>${E(say('sealedHint'))}</p></div>${boatMarkup()}<button type="button" class="sea-envelope" data-voyage-action="open-letter" aria-label="${E(say('openLetter'))}"><span class="sea-envelope-address"><small>${E(say('to'))}</small><strong>${E(route.name)}</strong></span><span class="sea-envelope-number">0${s.index+1}</span><span class="sea-envelope-flap"></span><span class="sea-envelope-seal">${lotus}</span><span class="sea-envelope-caption">${E(say('openLetter'))}</span></button><span class="sea-letter-name">${E(L(letter.title))}</span></div>`;
      return;
    }
    const prompt=L(letter.prompts[stop.activity%letter.prompts.length]);
    let interaction='';
    if(letter.kind==='words'){
      const names=currentId==='hoang-sa'?['sun','home','sail','heart']:['rice','tree','home','heart'];
      interaction=`<div class="sea-word-choices" role="group" aria-label="${E(prompt)}">${letter.words.map((word,i)=>`<button type="button" class="sea-word-choice" data-voyage-action="word" data-item="${i}" aria-pressed="${stop.wordIndex===i}"><span>${icon(names[i])}</span><strong>${E(L(word))}</strong><i aria-hidden="true">✓</i></button>`).join('')}</div><p class="sea-whisper">${E(stop.wordIndex>=0?say('wordAfter'):say('wordHint'))}</p>`;
    } else if(letter.kind==='bag'){
      const names=['bell','cup','photo','moon','rice','music'];
      interaction=`<div class="sea-bag-slots" aria-label="${E(say('bagCount',{n:stop.bag.length}))}">${[0,1,2].map(i=>`<span class="${stop.bag[i]!==undefined?'is-filled':''}">${stop.bag[i]!==undefined?icon(names[stop.bag[i]]):'<i>+</i>'}</span>`).join('')}</div><div class="sea-bag-choices" role="group" aria-label="${E(say('bagHint'))}">${D.bag.map((item,i)=>`<button type="button" class="sea-bag-choice" data-voyage-action="bag" data-item="${i}" aria-pressed="${stop.bag.includes(i)}"><span>${icon(names[i])}</span><strong>${E(L(item))}</strong><i aria-hidden="true">✓</i></button>`).join('')}</div><p class="sea-whisper">${E(stop.bag.length===3?say('bagAfter'):say('bagHint'))}</p>`;
    } else if(letter.kind==='letter'){
      interaction=`<div class="sea-starters">${getStep().starters.map((x,i)=>`<button type="button" data-voyage-action="starter" data-item="${i}" aria-pressed="${stop.starter===i}">${E(L(x))}</button>`).join('')}</div><p class="sea-whisper">${E(say('letterHint'))}</p>`;
    } else interaction=`<div class="sea-listening-shell" aria-hidden="true">${icon('shell')}<span></span><span></span><span></span></div><p class="sea-whisper">${E(say('listenHint'))}</p>`;
    scene.innerHTML=`<div class="sea-open-table">${boatMarkup()}<article class="sea-open-letter"><div class="sea-letter-top"><span>${E(say('letterNumber',{n:s.index+1}))}</span><span class="sea-postmark">${E(route.name)}</span></div><span class="sea-letter-kicker">${E(L(letter.title))}</span><h3 id="seaInvitation" tabindex="-1">${E(prompt)}</h3>${interaction}<details class="sea-keepsake" ${stop.noteOpen?'open':''}><summary>${E(say('keepLine'))} <span aria-hidden="true">✎</span></summary><div class="sea-writing-fields"><label class="sr-only" for="voyageNote">${E(say('note'))}</label><textarea id="voyageNote" maxlength="180" rows="2" placeholder="${E(say('noteHint'))}">${E(stop.note)}</textarea><label for="voyageMemoryPlace">${E(say('mainland'))}</label><input id="voyageMemoryPlace" maxlength="80" value="${E(stop.memoryPlace)}" placeholder="${E(D.ui.mainlandHint?L(D.ui.mainlandHint):'')}"><small class="sea-draft-notice">${E(say('draftOnly'))}</small></div></details><div class="sea-letter-bottom"><span>${E(say('owner',{name:authorOf(stop)||roles()[0]}))}</span>${btn('complete',say('send'),'',true)}</div><div class="sea-letter-links">${btn('alternate',say('alternate'))}${btn('skip',say('later'))}${letter.kind==='listen'?btn('timer',timer?say('stopTimer'):say('listen')):''}${timer?`<span class="voyage-timer" aria-live="off">${seconds}s</span>`:''}</div></article></div>`;
  }
  function openLetter() {
    const s=getSession(),stop=getStop();if(!stop||stop.status!=='pending'||drawLock)return;
    stop.opened=true;stop.unlocked=true;stop.found=true;
    if(!stop.author){stop.playerIdx=readerIndex();stop.helperIdx=((s.turnIndex||0)+(s.roleOffset?0:1))%Math.max(2,state.playerCount);stop.author=person(stop.playerIdx);}
    s.phase='letter';render();FolkAudio.playBambooClack();focus('#seaInvitation');
  }
  function sourceMarkup(step) {
    const source=D.sources[step.source];
    return `<details class="voyage-sources"><summary>${E(say('source'))}</summary><p>${E(say('sourceNote'))}</p><a href="${E(source.url)}" target="_blank" rel="noopener noreferrer">${E(L(source.title))} ↗</a><p>${E(say('geoSource'))}</p><a href="https://allencoralatlas.org/methods/" target="_blank" rel="noopener noreferrer">Allen Coral Atlas · CC BY 4.0 ↗</a><p>${E(say('originalNote'))}</p>${btn('originals',say('originals'))}</details>`;
  }
  function renderPanel() { renderScene(); }
  function renderDock() {
    if(!enabled)return;const s=getSession(),step=getStep(),stop=getStop();if(!step||!stop){dock.innerHTML='';return;}
    const last=(archives.get(currentId)||[]).at(-1),lastCard=last?.stops[s.index]?.cardId;
    const available=step.cards.filter(c=>!stop.drawn.includes(c.id));
    dock.innerHTML=`<div class="voyage-dock-copy"><span class="voyage-eyebrow">${E(say('fanKicker'))}</span><h3>${E(geo(step.target))}</h3><p>${E(stop.found?say('fanHint'):say('locate'))}</p></div><div class="voyage-fan" role="group" aria-label="${E(say('fanKicker'))}">${step.cards.map((c,i)=>`<button type="button" class="voyage-fanned-card" data-voyage-action="draw" data-card="${E(c.id)}" style="--fan-x:${(i-1)*62}px;--fan-angle:${(i-1)*13}deg;--fan-open:${(i-1)*92}px" aria-label="${E(say('cardChoice',{n:i+1,topic:L(c.topic)}))}" ${!stop.found||drawLock?'disabled':''}><span class="voyage-card-topic">${E(L(c.topic))}</span><span class="voyage-card-lotus">${lotus}</span><strong>${E(getRoute().name)}</strong><small>${E(say('brand'))}</small></button>`).join('')}</div><div class="voyage-dock-action">${btn('draw',stop.cardId?say('continue'):say('draw'),!stop.found||drawLock?'disabled':'',true)}<span class="voyage-draw-status"></span><p>${E(say('voluntary'))}</p>${btn('skip',say('later'))}</div>`;
    dock.dataset.previousCard=lastCard || '';dock.dataset.available=String(available.length);
  }
  function renderMapTools() {
    if(!enabled)return;
    toolbar.innerHTML=`${btn('zoom-out','−',`aria-label="${E(say('zoomOut'))}"`)}${btn('zoom-in','+',`aria-label="${E(say('zoomIn'))}"`)}${btn('overview',say('overview'))}`;
    const s=getSession();layer.innerHTML=`<svg class="voyage-route-line" aria-hidden="true"><path></path></svg>${getRoute().stops.map((step,i)=>`<button type="button" class="voyage-map-pin ${i===s.index?'is-current':''} ${s.stops[i].status==='done'?'is-done':''}" data-voyage-action="pin" data-stop="${i}" aria-label="${E(say('stopButton',{n:i+1,place:geo(step.target)}))}"><span>${s.stops[i].status==='done'?'✓':i+1}</span><strong>${E(geo(step.target).replace(/^Đảo\s+/,''))}</strong></button>`).join('')}`;
  }
  function paintMap(camera,w,h,group) {
    if(!enabled || group.id!==currentId || mode==='atlas' || !layer)return;
    const project=window.GoiVietNaturalCore.projector(camera,w,h),entries=targets(),points=[];
    layer.querySelectorAll('.voyage-map-pin').forEach((pin,i)=>{
      const e=entries[i];if(!e){pin.style.display='none';return;}
      const [x,y]=project(...e.point),visible=x>=24&&x<=w-24&&y>=30&&y<=h-30;
      pin.style.display=visible?'':'none';pin.style.left=`${x}px`;pin.style.top=`${y}px`;
      pin.classList.toggle('label-left',x>w*.7);if(visible)points.push([x,y]);
    });
    const svg=layer.querySelector('svg');svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
    // A story connector between actual sourced points; never a navigable sea route.
    svg.querySelector('path').setAttribute('d',points.length===3?points.map((p,i)=>(i?'L':'M')+p.join(',')).join(' '):'');
  }
  function renderRail() {
    if(!enabled)return;const s=getSession();
    rail.setAttribute('aria-label',say('album'));
    rail.innerHTML=P.routes[currentId].letters.map((letter,i)=>`<span class="sea-letter-stamp ${s.stops[i].status==='done'?'is-done':''} ${i===s.index?'is-current':''}" ${i===s.index?'aria-current="step"':''}><i>${s.stops[i].status==='done'?lotus:String(i+1).padStart(2,'0')}</i><span>${E(L(letter.title))}</span></span>`).join('');
  }
  function draw(id) {
    const s=getSession(),stop=getStop(),step=getStep();
    if(!enabled||mode!=='play'||s.index>=3||drawLock||!stop.found)return;
    if(stop.cardId){s.phase='card';render();focus('#voyageQuestion');return;}
    const pool=step.cards.filter(c=>!stop.drawn.includes(c.id));if(!pool.length)return;
    const previous=(archives.get(currentId)||[]).at(-1)?.stops[s.index]?.cardId;
    const nextPool=pool.filter(c=>c.id!==previous);
    const picked=pool.find(c=>c.id===id)||shuffle(nextPool.length?nextPool:pool)[0];snapshot();
    const fan=dock.querySelector('.voyage-fan'),chosen=fan.querySelector(`[data-card="${picked.id}"]`);
    drawLock=true;dock.setAttribute('aria-busy','true');dock.querySelectorAll('button').forEach(el=>el.disabled=true);
    panel.querySelectorAll('[data-voyage-action="draw"]').forEach(el=>el.disabled=true);
    const commit=()=>{
      if(s!==getSession() || !enabled || !dialog.classList.contains('open'))return;
      drawTimers=[];drawLock=false;stop.cardId=picked.id;stop.drawn.push(picked.id);stop.order=shuffle([0,1,2]);
      stop.playerIdx=readerIndex();stop.helperIdx=((s.turnIndex||0)+(s.roleOffset?0:1))%Math.max(2,state.playerCount);stop.author=person(stop.playerIdx);s.phase='card';
      render();announce(say('drawing'));focus('#voyageQuestion');
    };
    if(reduced()){commit();return;}
    const later=(fn,ms)=>drawTimers.push(setTimeout(fn,ms));
    const status=key=>{const el=dock.querySelector('.voyage-draw-status');if(el)el.textContent=say(key);announce(say(key));};
    fan.classList.add('is-shuffling','phase-gather');status('gathering');FolkAudio.playBambooClack();
    later(()=>{fan.classList.remove('phase-gather');fan.classList.add('phase-shuffle');status('shuffling');},300);
    later(()=>{fan.classList.remove('phase-shuffle');fan.classList.add('phase-pick');chosen.classList.add('is-picked');status('picking');FolkAudio.playPentatonicChime();},1050);
    later(()=>{fan.classList.add('phase-draw');status('drawing');},1500);later(commit,2100);
  }
  function activeCard() { return getStep()?.cards.find(c=>c.id===getStop()?.cardId); }
  function renderCards() {
    if(!enabled)return;const s=getSession(),step=getStep(),stop=getStop(),card=activeCard();
    if(!card||s.phase!=='card'||mode!=='play'){workbench.innerHTML='';return;}
    const names=[authorOf(stop)||roles()[0],Number.isInteger(stop.helperIdx)?person(stop.helperIdx):roles()[1]];
    workbench.innerHTML=`<div class="voyage-card-context"><span>${E(say('chapter',{n:s.index+1}))} · ${E(geo(step.target))}</span>${btn('map',say('backMap'))}</div><div class="voyage-diptych"><section class="voyage-card-front"><span class="voyage-eyebrow">${E(say('front'))} · ${E(L(card.topic))}</span><details class="voyage-card-reading"><summary>${E(L(step.context))}</summary><p>${E(L(step.reading))}</p><a href="${E(D.sources[step.source].url)}" target="_blank" rel="noopener noreferrer">${E(L(D.sources[step.source].title))} ↗</a></details><h3 id="voyageQuestion" tabindex="-1">${E(L(card.question))}</h3><div class="voyage-options" role="group" aria-labelledby="voyageQuestion">${stop.order.map((n,i)=>`<button type="button" data-voyage-action="option" data-option="${n}" class="voyage-option ${stop.selected===n?'is-selected':''} ${stop.revealed&&n===card.correct?'is-correct':''} ${stop.revealed&&stop.selected===n&&n!==card.correct?'is-incorrect':''}" aria-pressed="${stop.selected===n}" ${stop.revealed?'disabled':''}><span>${String.fromCharCode(65+i)}</span>${E(L(card.options[n]))}${stop.revealed&&n===card.correct?' ✓':''}</button>`).join('')}</div><div class="voyage-card-actions">${btn('helper',say('helper'))}${btn('explain',say('explain'))}${btn('check',say('check'),stop.selected===null?'disabled':'',true)}</div><p id="voyageHelper" class="voyage-helper" hidden>${E(say('helperText',{name:names[1]}))}</p>${stop.revealed?`<div class="voyage-answer" role="status"><strong>${E(stop.selected===card.correct?say('right'):say('learn'))}</strong><p>${E(L(card.explanation))}</p></div>`:''}</section>
      <section class="voyage-card-back"><div id="voyageSeal" class="voyage-seal" ${stop.unlocked?'hidden':''}><button type="button" class="voyage-wax-seal" data-voyage-action="unseal" aria-label="${E(say('seal'))}"><span>${lotus}</span><small>${E(say('lotus'))}</small></button><h3>${E(say('sealTitle'))}</h3><p>${E(say('sealHint'))}</p>${btn('unseal',say('seal'),'',true)}</div><div id="voyageConnection" ${stop.unlocked?'':'inert'} aria-hidden="${!stop.unlocked}"><span class="voyage-eyebrow">${E(say('back'))}</span><span class="voyage-context-label">${E(say('pen',{name:authorOf(stop)||names[0]}))}</span><div class="voyage-activity"><h3 id="voyageActivity" tabindex="-1">${E(L(step.title))}</h3><p>${E(L(step.activities[stop.activity]))}</p></div>${activityMarkup(step,stop)}<p class="voyage-gentle">${E(say('voluntary'))}</p><div class="voyage-inline">${btn('alternate',say('alternate'))}${btn('timer',timer?say('stopTimer'):say('listen'))}<span class="voyage-timer" aria-live="off">${timer?seconds+'s':''}</span></div><div class="voyage-note-field"><label for="voyageNote">${E(say('note'))}</label><textarea id="voyageNote" maxlength="180" rows="2" placeholder="${E(say('noteHint'))}">${E(stop.note)}</textarea><span class="voyage-note-counter">${stop.note.length}/180</span><label for="voyageMemoryPlace">${E(say('mainland'))}</label><input id="voyageMemoryPlace" maxlength="80" value="${E(stop.memoryPlace)}" placeholder="${E(say('mainlandHint'))}"><p class="voyage-session-note">${E(say('session'))}</p></div><div class="voyage-complete-actions">${btn('complete',say('complete'),'',true)}${btn('skip',say('later'))}</div></div></section></div>`;
  }
  function activityMarkup(step,stop) {
    if(step.kind==='bag')return `<fieldset class="voyage-bag"><legend>${E(say('bagTitle'))}</legend><p>${E(say('bagHint'))}</p><div>${D.bag.map((x,i)=>`<button type="button" class="voyage-bag-item" data-voyage-action="bag" data-item="${i}" aria-pressed="${stop.bag.includes(i)}">${E(L(x))}</button>`).join('')}</div><small>${E(say('bagCount',{n:stop.bag.length}))}</small></fieldset>`;
    if(step.kind==='letter')return `<fieldset class="voyage-letter"><legend>${E(say('letterTitle'))}</legend><p>${E(say('letterHint'))}</p><div>${step.starters.map((x,i)=>`<button type="button" data-voyage-action="starter" data-item="${i}" aria-pressed="${stop.starter===i}">${E(L(x))}</button>`).join('')}</div></fieldset>`;
    return '';
  }
  function selectedJournal() { return activeArchive>=0 ? (archives.get(currentId)||[])[activeArchive] || getSession() : getSession(); }
  const titleOf = s => s.title.trim() || L(P.routes[s.id].title)+' · '+D.routes[s.id].name;
  const dateOf = s => new Intl.DateTimeFormat(isEnglish()?'en-GB':'vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'Asia/Ho_Chi_Minh'}).format(new Date(s.date));
  function keptText(stop) {
    const word=P.routes[stop.routeId||currentId]?.letters[stop.letterIndex]?.words?.[stop.wordIndex];
    return [stop.note.trim(),word?L(word):'',stop.bag.length?say('packed',{items:stop.bag.map(i=>L(D.bag[i])).join(' · ')}):''].filter(Boolean).join('\n');
  }
  function sketch() {
    if(!groupData)return '';
    const b=groupData.bounds,w=240,h=270,scale=Math.min(210/(b.right-b.left),235/(b.bottom-b.top));
    const project=p=>[120+(p[0]-(b.left+b.right)/2)*scale,135+(p[1]-(b.top+b.bottom)/2)*scale];
    const paths=groupData.islands.map(item=>item.rings.map(ring=>ring.map((p,i)=>{const q=project(p);return (i?'L':'M')+q.map(n=>n.toFixed(2)).join(',');}).join(' ')+'Z').join(' ')).join(' ');
    return `<svg class="voyage-postcard-map" viewBox="0 0 ${w} ${h}" role="img" aria-label="${E(getRoute().name)}"><path d="${paths}" class="voyage-postcard-land"/>${targets().map((e,i)=>{if(!e)return '';const p=project(e.point);return `<circle cx="${p[0]}" cy="${p[1]}" r="6"/><text x="${p[0]+10}" y="${p[1]+4}">${i+1}</text>`;}).join('')}</svg>`;
  }
  function renderAlbum() {
    if(!enabled)return;const s=selectedJournal();if(!s)return;
    const route=getRoute(),history=archives.get(currentId)||[],editable=activeArchive<0;
    album.innerHTML=`<div class="sea-album-heading"><span class="sea-overline">${E(say('album'))}</span><h3>${E(getSession().index>=3?say('finish'):say('albumTitle'))}</h3><p>${E(say('albumHint'))}</p></div>
      <article class="voyage-postcard"><div class="voyage-postcard-top"><span>${E(route.name)}</span><span>${E(dateOf(s))}</span></div><h3 class="voyage-postcard-title">${E(titleOf(s))}</h3><div class="voyage-postcard-body"><div class="voyage-postcard-entries">${route.stops.map((step,i)=>`<section class="voyage-postcard-entry"><span class="voyage-entry-number">0${i+1}</span><div><h4>${E(L(P.routes[currentId].letters[i].title))}</h4><span class="voyage-entry-status">${E(s.stops[i].status==='done'?say('done'):s.stops[i].status==='skipped'?say('skipped'):s.stops[i].opened?say('visited'):say('upcoming'))}</span><p class="voyage-kept-line" data-note-preview="${i}">${E(keptText(s.stops[i])||say('emptyNote'))}</p>${editable&&getSession().albumEdit?`<label for="voyageAlbumNote${i}">${E(say('note'))}</label><textarea id="voyageAlbumNote${i}" rows="2" maxlength="180" data-album-note="${i}">${E(s.stops[i].note)}</textarea>`:''}</div></section>`).join('')}</div><div class="voyage-postcard-aside">${sketch()}<span class="voyage-postmark">${E(route.name)}<small>${E(say('stamp'))}</small></span></div></div><footer><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">${E(say('exportCredit'))}</a></footer></article>
      <div class="sea-album-bottom">${btn('download',exporting?say('exporting'):say('download'),exporting?'disabled':'',true)}${getSession().index<3?btn('play',say('continue')):btn('replay',say('replay'))}<details class="sea-album-options" ${getSession().albumEdit?'open':''}><summary>${E(say('options'))}</summary><div>${editable?`<label for="voyageTitle">${E(say('title'))}</label><input id="voyageTitle" maxlength="60" value="${E(s.title)}" placeholder="${E(L(P.routes[currentId].title))}">${btn('edit-album',say('editPostcard'))}`:''}${btn('download-text',say('downloadText'))}${btn('other',say('otherSea',{place:D.routes[currentId==='hoang-sa'?'truong-sa':'hoang-sa'].name}))}${history.length?`<label for="voyageArchiveSelect">${E(say('previous'))}</label><select id="voyageArchiveSelect"><option value="-1" ${editable?'selected':''}>${E(say('current'))}</option>${history.map((x,i)=>`<option value="${i}" ${activeArchive===i?'selected':''}>${E(titleOf(x))}</option>`).join('')}</select>`:''}</div></details></div><p class="voyage-session-note">${E(say('session'))}</p>`;
  }
  function handleInput(event) {
    if(!enabled)return;const el=event.target,s=getSession(),stop=getStop();
    if(el.id==='voyageNote'&&stop){stop.note=el.value;const counter=$('.voyage-note-counter');if(counter)counter.textContent=el.value.length+'/180';}
    else if(el.id==='voyageMemoryPlace'&&stop)stop.memoryPlace=el.value;
    else if(el.id==='voyageTitle'){s.title=el.value;$('.voyage-postcard-title').textContent=titleOf(s);}
    else if(el.hasAttribute('data-album-note')&&activeArchive<0){const i=Number(el.dataset.albumNote);if(!s.stops[i])return;s.stops[i].note=el.value;const memory=state.mentionedPlaces.find(m=>m.id===s.stops[i].memoryId);if(memory){memory.note=el.value.trim()||L(getRoute().stops[i].title);memory.voyageAutoNote=!el.value.trim();}const preview=$(`[data-note-preview="${i}"]`);if(preview)preview.textContent=keptText(s.stops[i])||say('emptyNote');}
  }
  function handleChange(event) {
    if(!enabled)return;
    if(event.target.id==='voyageArchiveSelect'){activeArchive=Number(event.target.value);renderAlbum();}
    else if(event.target.hasAttribute('data-album-note'))renderSidebarTrackers();
  }
  function setMode(next) {
    snapshot();cancelDraw();stopTimer();mode=next;activeArchive=-1;dialog.classList.remove('voyage-destinations-open');
    if(next==='play'&&['deck','card'].includes(getSession().phase))getSession().phase=getStop()?.opened?'letter':'map';
    render();focus(next==='atlas'?'#islandChartSearch':next==='album'?'[data-voyage-action="download"]':next==='story'?'.sea-story-sheet h3':getSession().phase==='letter'?'#seaInvitation':getSession().phase==='sent'?'[data-voyage-action="next-letter"]':'[data-voyage-action="open-letter"]');
  }
  function selectPin(index, {help=false}={}) {
    const e=targets()[index];if(!e){announce(say('noTarget'));return;}
    if(mode==='album')mode='play';
    if(getSession().phase==='card')getSession().phase='map';
    render();landscape().selectDetail(e.value);
    if(help && index===getSession().index){getStop().found=true;renderPanel();renderDock();}
    snapshot();refreshMap();focus('[data-voyage-action="draw"]');
  }
  function handleClick(event) {
    const button=event.target.closest('[data-voyage-action]');
    if(!button || !enabled || button.disabled)return;
    const action=button.dataset.voyageAction,s=getSession(),stop=getStop();
    if(action==='play'||action==='atlas'||action==='album'||action==='story'){setMode(action);return;}
    if(action==='open-letter'){openLetter();return;}
    if(action==='next-letter'){s.phase='map';render();focus(s.index<3?'[data-voyage-action="open-letter"]':'[data-voyage-action="download"]');return;}
    if(action==='deck'){if(!stop)return;stop.found=true;s.phase='deck';mode='play';render();focus('.voyage-fanned-card');return;}
    if(action==='destinations'){dialog.classList.toggle('voyage-destinations-open');button.setAttribute('aria-expanded',String(dialog.classList.contains('voyage-destinations-open')));if(dialog.classList.contains('voyage-destinations-open'))focus('.natural-island-tabs [aria-pressed="true"]');return;}
    if(action==='vi'||action==='en'){window.GoiVietI18n?.setLang(action);return;}
    if(action==='other'){snapshot();landscape().switchDetailGroup(currentId==='hoang-sa'?'truong-sa':'hoang-sa');return;}
    if(action==='originals'){openDeckModal(currentId,button);return;}
    if(action==='zoom-in'||action==='zoom-out'){document.getElementById(action==='zoom-in'?'naturalPlus':'naturalMinus').click();snapshot();return;}
    if(action==='overview'){landscape().selectDetail('-1');snapshot();return;}
    if(action==='pin'){selectPin(Number(button.dataset.stop));return;}
    if(action==='download'){downloadPostcard();return;}
    if(action==='download-text'){downloadBlob(new Blob([journalText(selectedJournal())],{type:'text/plain;charset=utf-8'}),'txt');return;}
    if(action==='edit-album'){s.albumEdit=!s.albumEdit;renderAlbum();if(s.albumEdit)focus('#voyageAlbumNote0');return;}
    if(action==='replay'){snapshot();const history=archives.get(currentId)||[];history.push(structuredClone(s));archives.set(currentId,history);sessions.set(currentId,fresh(currentId));mode='play';activeArchive=-1;render();focus('[data-voyage-action="open-letter"]');return;}
    if(!stop)return;
    if(action==='roles'){s.roleOffset=s.roleOffset?0:1;if(stop.opened){stop.playerIdx=readerIndex();stop.author=person(stop.playerIdx);}renderScene();renderCards();$('.sea-more')?.removeAttribute('open');focus('#seaInvitation');return;}
    if(action==='clue'){stop.clueOpen=true;stop.hint=Math.min(stop.hint+1,getStep().hints.length);renderPanel();announce(L(getStep().hints[stop.hint-1]));focus('[data-voyage-action="hide-clue"]');return;}
    if(action==='hide-clue'){stop.clueOpen=false;renderPanel();focus('[data-voyage-action="clue"]');return;}
    if(action==='locate'){const select=$('#voyageStopSelect');if(select.value===''){select.focus();return;}selectPin(Number(select.value));return;}
    if(action==='help-map'){selectPin(s.index,{help:true});return;}
    if(action==='draw'){draw(button.dataset.card);return;}
    if(action==='map'){stopTimer();s.phase=stop.opened?'letter':'map';render();focus(stop.opened?'#seaInvitation':'[data-voyage-action="open-letter"]');return;}
    if(action==='option'&&!stop.revealed){stop.selected=Number(button.dataset.option);renderCards();focus(`[data-voyage-action="option"][data-option="${stop.selected}"]`);return;}
    if(action==='helper'){const helper=$('#voyageHelper');helper.hidden=!helper.hidden;announce(helper.hidden?'':helper.textContent);return;}
    if(action==='check'||action==='explain'){if(action==='check'&&stop.selected===null)return;stop.revealed=true;stop.unlocked=true;renderCards();announce(L(activeCard().explanation));focus('#voyageActivity');return;}
    if(action==='unseal'){stop.unlocked=true;renderCards();announce(say('back'));focus('#voyageActivity');return;}
    if(!stop.unlocked && !['skip'].includes(action))return;
    if(action==='word'){const n=Number(button.dataset.item);if(!getLetter()?.words?.[n])return;stop.wordIndex=stop.wordIndex===n?-1:n;renderScene();focus(`[data-voyage-action="word"][data-item="${n}"]`);return;}
    if(action==='alternate'){stopTimer();stop.activity=(stop.activity+1)%getStep().activities.length;if(s.phase==='card'){renderCards();focus('#voyageActivity');}else{renderScene();focus('#seaInvitation');}return;}
    if(action==='bag'){const n=Number(button.dataset.item);if(!D.bag[n])return;if(stop.bag.includes(n))stop.bag=stop.bag.filter(x=>x!==n);else if(stop.bag.length<3)stop.bag.push(n);else {announce(say('bagFull'));return;}if(s.phase==='card')renderCards();else renderScene();focus(`[data-voyage-action="bag"][data-item="${n}"]`);return;}
    if(action==='starter'){const n=Number(button.dataset.item);stop.starter=n;if(!stop.note.trim())stop.note=L(getStep().starters[n]);stop.noteOpen=true;if(s.phase==='card')renderCards();else renderScene();focus('#voyageNote');return;}
    if(action==='timer'){if(timer)stopTimer();else startTimer();if(s.phase==='card')renderCards();else renderScene();focus('[data-voyage-action="timer"]');return;}
    if(action==='complete'||action==='skip')completeStop(action==='complete'?'done':'skipped');
  }
  function recordMemory(stop) {
    const place=stop.memoryPlace.trim();if(!place)return;
    const note=stop.note.trim()||L(getLetter()?.title||getStep().title),sig=place+'\n'+note;
    if(stop.memorySig===sig)return;
    const resolved=resolveMemoryPlaceToMap(place);
    const entry={id:`mem-voyage-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,name:resolved.name,note,autoNote:false,player:authorOf(stop)||roles()[0],playerIdx:stop.playerIdx,voyageId:currentId,voyageStop:getSession().index,voyageAutoNote:!stop.note.trim(),status:resolved.status,hasContent:Boolean(resolved.hasContent),hasDemoContent:Boolean(resolved.isVerifiedSample),demoPlaceId:resolved.demoPlaceId||null,center:resolved.center||null,includeInPostcard:false};
    state.mentionedPlaces.push(entry);stop.memoryId=entry.id;stop.memorySig=sig;renderSidebarTrackers();
  }
  function completeStop(status) {
    const s=getSession(),stop=getStop(),step=getStep();
    if(drawLock||performance.now()<completingUntil||!stop||stop.status!=='pending'||(status==='done'&&!stop.unlocked))return;
    completingUntil=performance.now()+300;
    stopTimer();stop.status=status;
    recordMemory(stop);
    if(status==='done'){stop.found=true;markPlaceActivityCompleted(currentId);}else markPlaceExplored(currentId);
    if(stop.cardId||stop.opened){
      const letterMode=s.phase==='letter',activity=L(letterMode?getLetter().prompts[stop.activity]:step.activities[stop.activity]);
      state.totalCardsCompleted+=1;state.completedStamps.push({placeId:currentId,placeName:getRoute().name,topic:letterMode?say('letterType'):L(activeCard().topic),activity,voyageId:currentId,voyageStop:s.index,voyageFormat:letterMode?'postoffice':'card',cardId:letterMode?null:stop.cardId,activityIdx:stop.activity,player:authorOf(stop)||roles()[0],playerIdx:stop.playerIdx,status:status==='done'?'Đã thực hiện hoạt động':'Để lần sau',statusKey:status==='done'?'js.stamp.done':'sea.stampSkipped'});
    }
    s.turnIndex=(((stop.cardId||stop.opened)?stop.playerIdx:readerIndex())+1)%Math.max(2,state.playerCount);state.currentPlayerIndex=s.turnIndex;updateSessionHeaderUI();renderSidebarTrackers();
    s.lastSent=s.index;s.index+=1;s.phase='sent';s.roleOffset=0;FolkAudio.playPentatonicChime();
    render();
    focus('[data-voyage-action="next-letter"]');
    announce(status==='done'?say('done'):say('skipped'));
  }
  function startTimer() {
    stopTimer();seconds=60;
    timer=setInterval(()=>{
      seconds--;const label=$('.voyage-timer');if(label)label.textContent=seconds+'s';
      if(seconds<=0){stopTimer();announce(say('timerDone'));const button=$('[data-voyage-action="timer"]');if(button)button.textContent=say('listen');}
    },1000);
  }
  function stopTimer() { if(timer)clearInterval(timer);timer=null; }
  function handleEscape() {
    if(!enabled)return false;
    const more=$('.sea-more');if(more?.open){more.open=false;focus('.sea-more > summary');return true;}
    if(drawLock){cancelDraw();announce(say('fanHint'));focus('[data-voyage-action="draw"]');return true;}
    if(mode==='atlas'||mode==='story'){setMode('play');return true;}
    if(mode==='play'&&getSession().phase==='deck'){getSession().phase=getStop()?.opened?'letter':'map';render();focus('[data-voyage-action="open-letter"]');return true;}
    if(mode==='album'&&getSession().index<3){setMode('play');return true;}
    if(mode==='play'&&getSession().phase==='card'){stopTimer();getSession().phase=getStop()?.opened?'letter':'map';render();focus('[data-voyage-action="open-letter"]');return true;}
    return false;
  }
  function journalText(s) {
    const route=D.routes[s.id];
    return [say('brand'),titleOf(s),dateOf(s),route.name,L(route.title),say('simulation'),' ',...route.stops.flatMap((step,i)=>{
      const stop=s.stops[i];return [`${i+1}. ${L(P.routes[s.id].letters[i].title)} · ${step.target}`,stop.status==='done'?say('done'):stop.status==='skipped'?say('skipped'):stop.found?say('visited'):say('upcoming'),keptText(stop),authorOf(stop),stop.memoryPlace.trim(),L(step.context),L(step.reading),L(D.sources[step.source].title),D.sources[step.source].url,' '];
    }),say('geoSource')].join('\n');
  }
  function downloadBlob(blob,ext) {
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=`${currentId}-hai-trinh-${new Date().toISOString().slice(0,10)}.${ext}`;
    document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
  }
  function wrap(ctx,text,x,y,width,lineHeight,maxLines=Infinity) {
    const words=String(text).split(/\s+/),lines=[];let line='';
    for(const word of words){
      if(ctx.measureText(word).width>width){
        if(line){lines.push(line);line='';}
        for(const glyph of Array.from(word)){if(ctx.measureText(line+glyph).width>width&&line){lines.push(line);line=glyph;}else line+=glyph;}
      } else {const next=line?line+' '+word:word;if(ctx.measureText(next).width>width&&line){lines.push(line);line=word;}else line=next;}
    }
    if(line)lines.push(line);
    lines.slice(0,maxLines).forEach((value,i)=>ctx.fillText(value,x,y+i*lineHeight));return y+Math.min(lines.length,maxLines)*lineHeight;
  }
  async function downloadPostcard() {
    if(exporting)return;exporting=true;renderAlbum();
    const s=structuredClone(selectedJournal()),id=currentId,route=D.routes[id],group=groupData,exportEntries=currentEntries();
    try {
      await document.fonts.ready;
      const canvas=document.createElement('canvas');canvas.width=1800;canvas.height=1200;const ctx=canvas.getContext('2d');
      ctx.fillStyle='#f7f0de';ctx.fillRect(0,0,1800,1200);ctx.strokeStyle='#b68643';ctx.lineWidth=3;ctx.strokeRect(32,32,1736,1136);ctx.strokeRect(44,44,1712,1112);
      ctx.fillStyle='#9e2835';ctx.font='600 20px "Be Vietnam Pro",sans-serif';ctx.fillText(say('brand'),85,100);
      ctx.textAlign='right';ctx.fillText(dateOf(s),1715,100);ctx.textAlign='left';ctx.fillStyle='#293b32';
      ctx.font='700 48px "Playfair Display",Georgia,serif';wrap(ctx,titleOf(s),85,180,1500,60,2);
      ctx.font='400 22px "Be Vietnam Pro",sans-serif';ctx.fillStyle='#4b5b4c';ctx.fillText(L(P.routes[id].title),85,285);
      route.stops.forEach((step,i)=>{
        const y=365+i*235,stop=s.stops[i];ctx.fillStyle='#9e2835';ctx.font='600 24px "Be Vietnam Pro",sans-serif';ctx.fillText('0'+(i+1),85,y);
        ctx.fillStyle='#293b32';ctx.font='600 27px "Be Vietnam Pro",sans-serif';ctx.fillText(L(P.routes[id].letters[i].title)+' · '+step.target,145,y);
        ctx.fillStyle='#596b5c';ctx.font='400 18px "Be Vietnam Pro",sans-serif';const status=stop.status==='done'?say('done'):stop.status==='skipped'?say('skipped'):stop.found?say('visited'):say('upcoming');wrap(ctx,status+(stop.author?' · '+authorOf(stop):''),145,y+35,920,24,1);
        ctx.fillStyle='#293b32';ctx.font='400 22px "Be Vietnam Pro",sans-serif';wrap(ctx,keptText(stop)||say('emptyNote'),145,y+80,920,28,6);
      });
      if(group){
        const b=group.bounds,scale=Math.min(470/(b.right-b.left),570/(b.bottom-b.top)),project=p=>[1420+(p[0]-(b.left+b.right)/2)*scale,650+(p[1]-(b.top+b.bottom)/2)*scale];
        ctx.fillStyle='#286973';ctx.beginPath();ctx.roundRect(1120,335,590,650,25);ctx.fill();
        ctx.fillStyle='#f0ddaa';ctx.strokeStyle='#efdfb8';ctx.lineWidth=1.3;
        group.islands.forEach(item=>{ctx.beginPath();item.rings.forEach(ring=>ring.forEach((p,i)=>{const q=project(p);if(i)ctx.lineTo(...q);else ctx.moveTo(...q);}));ctx.fill('evenodd');ctx.stroke();});
        route.stops.forEach((step,i)=>{const entry=exportEntries.find(e=>e.label===step.target);if(!entry)return;const p=project(entry.point);ctx.beginPath();ctx.arc(p[0],p[1],11,0,Math.PI*2);ctx.fillStyle='#ffdf8e';ctx.fill();ctx.font='600 22px "Be Vietnam Pro",sans-serif';ctx.fillText(String(i+1),p[0]+18,p[1]+8);});
        ctx.fillStyle='#ffefc8';ctx.font='700 34px "Playfair Display",Georgia,serif';ctx.fillText(route.name,1160,392);
      }
      ctx.fillStyle='#596b5c';ctx.font='400 17px "Be Vietnam Pro",sans-serif';wrap(ctx,say('simulation')+' · '+say('exportCredit'),85,1125,1600,24,2);
      const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Empty image')),'image/png'));
      // The captured voyage remains the download even if the user changes destinations while fonts resolve.
      const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`${id}-hai-trinh-${new Date().toISOString().slice(0,10)}.png`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
      announce(say('exported'));
    } catch(error){announce(say('exportError'));}
    finally{exporting=false;if(enabled)renderAlbum();}
  }
  function reset() {
    cancelDraw();stopTimer();if(dialog?.classList.contains('open'))landscape()?.closeDetail();
    sessions.clear();archives.clear();if(dialog)disable();currentId=null;groupData=null;targetEntries=[];mode='play';completingUntil=0;
  }
  document.addEventListener('goiviet:langchange',()=>{
    // The shared journal knows original card IDs. Relabel only our own generated content here;
    // the family's words remain exactly as entered in either language.
    for(const stamp of state.completedStamps){
      const step=D.routes[stamp.voyageId]?.stops[stamp.voyageStop],card=step?.cards.find(c=>c.id===stamp.cardId);
      if(stamp.voyageFormat==='postoffice'){stamp.topic=say('letterType');stamp.activity=L(P.routes[stamp.voyageId].letters[stamp.voyageStop].prompts[stamp.activityIdx]);}
      else if(card){stamp.topic=L(card.topic);stamp.activity=L(step.activities[stamp.activityIdx]);}
    }
    for(const memory of state.mentionedPlaces){const step=P.routes[memory.voyageId]?.letters[memory.voyageStop];if(step&&memory.voyageAutoNote)memory.note=L(step.title);}
    if(document.getElementById('postcardModal')?.classList.contains('open'))renderPostcardContent();
    if(enabled){snapshot();cancelDraw();render();}
  });
  window.addEventListener('pagehide',()=>{cancelDraw();stopTimer();});
  window.GoiVietFamilyVoyage=Object.freeze({mount,onGroup,onClose,onSelect,paintMap,handleEscape,beforeGroup:snapshot,reset,
    entryLabel:(place,full=false)=>desktop.matches?say(full?'entryLabel':'entry',{place}):null,
    isOpenFor:id=>enabled&&currentId===id&&dialog?.classList.contains('open'),
    suppressesLabel:value=>enabled && mode==='play' && targets().some(e=>e?.value===value),
    inspect:()=>({enabled,currentId,mode,phase:getSession()?.phase,drawLock,timerRunning:!!timer,seconds,exporting,targets:targets().map(e=>e?{value:e.value,label:e.label,point:[...e.point]}:null),sessions:structuredClone(Object.fromEntries(sessions)),archives:structuredClone(Object.fromEntries(archives)),desktop:desktop.matches})});
})();
