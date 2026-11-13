/* Desktop-only family voyages for preview-5. No persistence, network, or mutations of source decks.
   Uses the existing geographic canvas and modal focus trap. Mobile keeps the original chart DOM/layout. */
(() => {
  'use strict';
  const D = window.GoiVietFamilyVoyageData;
  const P = window.GoiVietSeaPostOffice;
  if (!D || !P) return;
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
  const seaButton = (action, label, symbol, {primary = false, attributes = ''} = {}) => `
    <button type="button" class="voyage-btn sea-btn${primary ? ' voyage-primary' : ''}" data-voyage-action="${action}" ${attributes}>
      ${icon(symbol)}<span>${E(label)}</span>
    </button>`;
  const landscape = () => window.GoiVietNaturalLandscape;
  const shuffle = input => { const a = [...input]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
  let dialog, body, root, bar, map, nativeLayout, scene, dock, workbench, album, live;
  let enabled = false, currentId = null, groupData = null, mode = 'play', activeArchive = -1, targetEntries = [];
  let drawLock = false, drawTimers = [], timer = null, seconds = 60, exporting = false;
  let viewTicket = 0, original = null, completingUntil = 0, returnToPostmark = false;
  const getSession = () => sessions.get(currentId);
  const getRoute = () => D.routes[currentId];
  const getStop = () => getSession()?.stops[getSession().index];
  const getStep = () => getRoute()?.stops[getSession().index];
  const getLetter = index => P.routes[currentId]?.letters[index ?? getSession()?.index];
  const letterStarters = () => getLetter()?.starters || getStep().starters;
  // A letter may tell its story through another stop (its postmark); the card deck keeps its own stop order.
  const storyStep = () => { const i = Math.min(getSession().index, 2); return getRoute().stops[getLetter(i)?.postmark?.story ?? i]; };
  const focus = selector => queueMicrotask(() => {
    const element = $(selector);
    if (!enabled || !dialog.classList.contains('open') || !element?.getClientRects().length || element.closest('[hidden],[inert]')) return;
    element.focus({preventScroll:true});
    if (body.contains(element)) {
      const target = element.getBoundingClientRect();
      const viewport = body.getBoundingClientRect();
      if (target.top < viewport.top || target.bottom > viewport.bottom) {
        element.scrollIntoView({block:'nearest', inline:'nearest'});
      }
    }
  });
  const announce = message => { if(live) live.textContent = message; };
  const person = index => typeof getPlayerDisplayName === 'function' ? getPlayerDisplayName(index) : say('turn',{name:String(index+1)});
  const authorOf = stop => stop.author ? person(stop.playerIdx) : '';
  const readerIndex = () => { const s=getSession(),n=Math.max(2,state.playerCount||2);return ((s?.turnIndex??state.currentPlayerIndex??0)+(s?.roleOffset||0))%n; };
  const roles = () => { const s=getSession(),n=Math.max(2,state.playerCount||2),i=(s?.turnIndex??state.currentPlayerIndex??0)%n;return s?.roleOffset?[person((i+1)%n),person(i)]:[person(i),person((i+1)%n)]; };
  const reduced = () => state.reducedMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;
  function fresh(id) {
    return { id, title:'', date:new Date().toISOString(), index:0, phase:'map', turnIndex:state.currentPlayerIndex||0,roleOffset:0, view:null, albumEdit:false, albumOptionsOpen:false,
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
    bar=document.createElement('nav');bar.className='voyage-modebar voyage-only';body.before(bar);
    root=document.createElement('div');root.className='voyage-root voyage-only';
    root.innerHTML='<div class="sea-scene"></div><div class="voyage-dock"></div><div class="voyage-workbench"></div><section class="voyage-album"></section><p class="voyage-status" role="status" aria-live="polite" aria-atomic="true"></p>';
    body.append(root);dock=$('.voyage-dock');workbench=$('.voyage-workbench');album=$('.voyage-album');live=$('.voyage-status');
    scene=$('.sea-scene');
    const kicker=document.createElement('div');kicker.className='voyage-kicker voyage-only';$('#naturalIslandHeading').before(kicker);
    dialog.addEventListener('click',handleClick);
    dialog.addEventListener('focusin', event => {
      const more = $('.sea-more');
      if (more?.open && !more.contains(event.target)) more.open = false;
    });
    dialog.addEventListener('input',handleInput);
    dialog.addEventListener('change',handleChange);
    dialog.addEventListener('toggle', event => {
      if (event.target.matches('.sea-keepsake') && getStop()) getStop().noteOpen = event.target.open;
      if (event.target.matches('.sea-album-options') && getSession()) getSession().albumOptionsOpen = event.target.open;
      if (event.target.matches('.voyage-card-reading') && getStop()) getStop().readingOpen = event.target.open;
    }, true);
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
    body.scrollTop = 0;
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
    const choosingDestination = dialog.classList.contains('voyage-destinations-open');
    dialog.classList.remove('voyage-destinations-open');
    const entries=currentEntries();targetEntries=D.routes[currentId]?.stops.map(step=>entries.find(e=>e.type==='land'&&e.label===step.target))||[];
    original={heading:$('#naturalIslandHeading').textContent,caption:$('.natural-detail-caption').textContent};
    if(!D.routes[currentId] || !desktop.matches){disable();return;}
    if(!sessions.has(currentId))sessions.set(currentId,fresh(currentId));
    enable();render();refreshMap();
    if (choosingDestination) focus('.voyage-modebar [data-voyage-action="play"]');
    markPlaceExplored(currentId);
  }
  function onClose() {
    if (!enabled) return;
    snapshot();cancelDraw();stopTimer();++viewTicket;
    $('.sea-more').open = false;
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
    if (found) getStop().found = true;
    snapshot();
  }
  function render() {
    if(!enabled)return;
    const s=getSession(),route=getRoute();if(!s||!route)return;
    const card=mode==='play'&&s.phase==='card'&&!!getStop()?.cardId;
    const deck=mode==='play'&&s.phase==='deck';
    const showAlbum=mode==='album'||(mode==='play'&&s.index>=3&&s.phase!=='sent');
    const phase = mode==='atlas'||mode==='story' ? mode : showAlbum ? 'album' : card ? 'card' : deck ? 'deck' : s.phase;
    if (dialog.dataset.voyagePhase !== phase) body.scrollTop = 0;
    announce('');
    dialog.classList.toggle('voyage-atlas',mode==='atlas');dialog.classList.toggle('voyage-card-open',card);
    dialog.classList.toggle('voyage-deck-open',deck);dialog.classList.toggle('voyage-album-open',showAlbum);
    dialog.dataset.voyagePhase = phase;
    if(map.parentElement!==nativeLayout)nativeLayout.append(map);
    $('.voyage-kicker').textContent=say('brand');$('#naturalIslandHeading').textContent=route.name;
    $('.natural-detail-caption').textContent=L(P.routes[currentId].subtitle);
    $('#naturalClose').innerHTML = `${icon('close')}<span>${E(say('pause'))}</span>`;
    $('#naturalClose').setAttribute('aria-label',say('pause'));
    renderNavigation(showAlbum);
    renderScene();renderDock();renderCards();renderAlbum();
    refreshMap();
  }
  function renderNavigation(showAlbum) {
    const hasLetter = getSession().index < 3;
    const active = showAlbum ? 'album' : mode;
    const destinationsOpen = dialog.classList.contains('voyage-destinations-open');
    bar.setAttribute('aria-label', say('brand'));
    bar.innerHTML = `
      <div class="sea-quiet-nav">
        ${seaButton('play', say('play'), 'letter', {attributes:`aria-pressed="${active === 'play'}"`})}
        ${seaButton('atlas', say('atlas'), 'map', {attributes:`aria-pressed="${active === 'atlas'}"`})}
        ${seaButton('album', say('album'), 'book', {attributes:`aria-pressed="${active === 'album'}"`})}
      </div>
      <details class="sea-more">
        <summary>${icon('more')}<span>${E(say('more'))}</span>${icon('chevron')}</summary>
        <div class="sea-more-content">
          ${hasLetter ? seaButton('deck', say('deck'), 'cards') : ''}
          ${seaButton('story', say('source'), 'book')}
          ${seaButton('originals', say('originals'), 'lotus')}
          <div class="sea-menu-group">
            ${seaButton('destinations', say('switch'), 'map', {attributes:`aria-expanded="${destinationsOpen}" aria-controls="seaDestinations"`})}
            ${hasLetter ? seaButton('roles', say('swapRoles'), 'swap') : ''}
          </div>
          <div class="sea-menu-language">
            <span>${E(say('language'))}</span>
            <div class="voyage-language" role="group" aria-label="${E(say('language'))}">
              ${btn('vi', 'VI', `aria-pressed="${!isEnglish()}"`)}
              ${btn('en', 'EN', `aria-pressed="${isEnglish()}"`)}
            </div>
          </div>
        </div>
      </details>`;
    $('.natural-island-tabs').id = 'seaDestinations';
  }
  function icon(name) {
    if (name === 'lotus') return lotus;
    const paths={
      close:'<path d="m17 17 30 30m0-30L17 47"/>',
      chevron:'<path d="m19 26 13 13 13-13"/>',
      arrow:'<path d="M11 32h40M36 17l15 15-15 15"/>',
      back:'<path d="M53 32H13m15-15L13 32l15 15"/>',
      more:'<circle cx="15" cy="32" r="2"/><circle cx="32" cy="32" r="2"/><circle cx="49" cy="32" r="2"/>',
      map:'<path d="m9 17 15-7 16 7 15-7v37l-15 7-16-7-15 7zm15-7v37m16-30v37"/>',
      book:'<path d="M32 15C24 9 13 9 7 13v36c10-4 18-3 25 2 7-5 15-6 25-2V13c-6-4-17-4-25 2Zm0 0v36"/>',
      cards:'<rect x="20" y="13" width="34" height="43" rx="4"/><path d="M14 47 7 12l33-7 1 4M28 27h18m-18 8h18m-18 8h12"/>',
      swap:'<path d="M9 21h45M44 11l10 10-10 10M55 43H10m10-10L10 43l10 10"/>',
      pen:'<path d="m11 43-3 13 13-3 32-32a7 7 0 0 0-10-10Zm26-26 10 10"/>',
      refresh:'<path d="M51 25a20 20 0 1 0 0 14m0-28v14H37"/>',
      timer:'<circle cx="32" cy="35" r="20"/><path d="M32 15V8m-8 0h16m-8 15v12l8 6"/>',
      download:'<path d="M32 8v32M20 29l12 12 12-12M10 45v9h44v-9"/>',
      check:'<path d="m13 32 12 12 26-27"/>',
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
    return '<img class="sea-sailboat" src="assets/goi-viet/memory-reference-v5/sailboat-single-640.webp" alt="" aria-hidden="true">';
  }
  function letterStatus(stop, active = false) {
    if (stop.status === 'done') return say('sent');
    if (stop.status === 'skipped') return say('skipped');
    if (active) return say('currentLetter');
    return say(stop.opened ? 'draftLetter' : 'pendingLetter');
  }
  function letterRail(session) {
    return `<aside class="sea-letter-rail" aria-label="${E(say('progress'))}">
      <div class="sea-rail-cover">
        <h3 class="sea-scene-heading">${E(L(P.routes[currentId].title))}</h3>
        ${boatMarkup()}
      </div>
      <ol>${P.routes[currentId].letters.map((letter, index) => {
        const stop = session.stops[index];
        const active = session.phase === 'sent' ? index === session.lastSent : index === session.index;
        const mark = stop.status === 'done' ? 'check' : letter.icon;
        return `<li data-status="${stop.status}" ${active ? 'aria-current="step"' : ''}>
          <span class="sea-step-icon">${icon(mark)}</span>
          <div><strong>${E(L(letter.title))}</strong><small>${E(letterStatus(stop, active))}</small></div>
        </li>`;
      }).join('')}</ol>
    </aside>`;
  }
  function choice(action, label, symbol, index, selected) {
    return `<button type="button" class="sea-choice sea-${action}-choice" data-voyage-action="${action}" data-item="${index}" aria-pressed="${selected}">
      <span class="sea-choice-icon">${icon(symbol)}</span>
      <strong>${E(label)}</strong>
      <span class="sea-choice-check">${icon('check')}</span>
    </button>`;
  }
  function renderInvitation(letter, stop) {
    if (letter.kind === 'words') {
      const symbols = currentId === 'hoang-sa' ? ['sun','home','sail','heart'] : ['rice','tree','home','heart'];
      return `<div class="sea-word-choices" role="group" aria-labelledby="seaInvitation">
        ${letter.words.map((word, index) => choice('word', L(word), symbols[index], index, stop.wordIndex === index)).join('')}
      </div><p class="sea-whisper">${E(say(stop.wordIndex >= 0 ? 'wordAfter' : 'wordHint'))}</p>`;
    }
    if (letter.kind === 'bag') {
      const symbols = ['bell','cup','photo','moon','rice','music'];
      const count = say('bagCount', {n: stop.bag.length});
      return `<div class="sea-bag-progress">
        <span>${E(count)}</span>
        <div class="sea-bag-slots" aria-hidden="true">${Array.from({length:3}, (_, i) => {
          const item = stop.bag[i];
          return `<span class="${item === undefined ? '' : 'is-filled'}">${item === undefined ? '·' : icon(symbols[item])}</span>`;
        }).join('')}</div>
      </div>
      <div class="sea-bag-choices" role="group" aria-labelledby="seaInvitation">
        ${D.bag.map((item, index) => choice('bag', L(item), symbols[index], index, stop.bag.includes(index))).join('')}
      </div><p class="sea-whisper">${E(say(stop.bag.length === 3 ? 'bagAfter' : 'bagHint'))}</p>`;
    }
    if (letter.kind === 'letter') {
      return `<div class="sea-starters" role="group" aria-labelledby="seaInvitation">
        ${letterStarters().map((text, index) => seaButton('starter', L(text), 'pen', {
          attributes: `data-item="${index}" aria-pressed="${stop.starter === index}"`
        })).join('')}
      </div><p class="sea-whisper">${E(say('letterHint'))}</p>`;
    }
    return `<div class="sea-listening-shell">
      <span class="sea-listening-icon">${icon('shell')}</span>
      <p>${E(say('listenHint'))}</p>
      ${seaButton('timer', say(timer ? 'stopTimer' : 'listen'), 'timer', {attributes:`aria-pressed="${Boolean(timer)}"`})}
      <span class="voyage-timer" aria-live="off" ${timer ? '' : 'hidden'}>${timer ? seconds + 's' : ''}</span>
    </div>`;
  }
  function postmarkMarkup(letter) {
    const mark = letter.postmark;
    if (!mark) return '';
    const place = L(mark.place), detail = L(mark.detail);
    return `<button type="button" class="sea-postmark" data-voyage-action="story" aria-label="${E(say('postmarkLabel', {place: place + ' · ' + detail}))}">
      <svg class="sea-postmark-waves" viewBox="0 0 40 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M2 6c4-3 5 3 9 0s5 3 9 0 5 3 9 0 5 3 9 0M2 12c4-3 5 3 9 0s5 3 9 0 5 3 9 0 5 3 9 0M2 18c4-3 5 3 9 0s5 3 9 0 5 3 9 0 5 3 9 0"/></svg>
      <span class="sea-postmark-stamp"><strong>${E(place)}</strong><small>${E(detail)}</small></span>
      <span class="sea-postmark-cue">${icon('book')}<span>${E(say('postmarkCue'))}</span></span>
    </button>`;
  }
  function writingDrawer(stop) {
    return `<details class="sea-keepsake" ${stop.noteOpen ? 'open' : ''}>
      <summary>${icon('pen')}<span>${E(say('keepLine'))}</span>${icon('chevron')}</summary>
      <div class="sea-writing-fields">
        <label for="voyageNote">${E(say('note'))}</label>
        <textarea id="voyageNote" maxlength="180" rows="2" placeholder="${E(say('noteHint'))}">${E(stop.note)}</textarea>
        <span class="voyage-note-counter">${stop.note.length}/180</span>
        <label for="voyageMemoryPlace">${E(say('mainland'))}</label>
        <input id="voyageMemoryPlace" maxlength="80" value="${E(stop.memoryPlace)}" placeholder="${E(say('mainlandHint'))}">
        <small class="sea-draft-notice">${E(say('draftOnly'))}</small>
      </div>
    </details>`;
  }
  function renderScene() {
    if (!enabled || !scene) return;
    const session = getSession();
    const route = getRoute();
    if (!session || !route) return;
    if (mode === 'story') {
      const step = storyStep();
      scene.innerHTML = `<article class="sea-story-sheet">
        <div class="sea-view-header">
          <h3 tabindex="-1">${E(say('source'))}</h3>
          ${seaButton('play', say('backMap'), 'back')}
        </div>
        <h4>${E(L(step.context))}</h4><p>${E(L(step.reading))}</p>${sourceMarkup(step)}
      </article>`;
      return;
    }
    if (mode !== 'play' || ['card','deck'].includes(session.phase) || (session.index >= 3 && session.phase !== 'sent')) {
      scene.replaceChildren();
      return;
    }
    const index = session.phase === 'sent' ? session.lastSent : session.index;
    const stop = session.stops[index];
    const letter = getLetter(index);
    const letterTitle = E(L(letter.title));
    let content;
    if (session.phase === 'sent') {
      const message = keptText(stop);
      content = `<article class="sea-sent-letter" data-status="${stop.status}">
        <div class="sea-ink-stamp">${icon(stop.status === 'done' ? 'lotus' : 'letter')}</div>
        <h3>${E(letterStatus(stop))}</h3><p>${letterTitle}</p>
        ${message ? `<p class="sea-kept">${E(message)}</p>` : ''}
        ${seaButton('next-letter', say(session.index < 3 ? 'nextLetter' : 'collect'), 'arrow', {primary:true})}
      </article>`;
    } else if (session.phase === 'letter') {
      content = `<article class="sea-open-letter">
        <header class="sea-letter-header">
          <span class="sea-letter-emblem">${icon(letter.icon)}</span>
          <div><p class="sea-letter-kicker">${letterTitle}</p>
          <h3 id="seaInvitation" tabindex="-1">${E(L(letter.prompts[stop.activity]))}</h3></div>
        </header>
        <div class="sea-letter-meta">
          <p class="sea-reader">${E(say('owner', {name: authorOf(stop) || roles()[0]}))}</p>
          ${postmarkMarkup(letter)}
        </div>
        ${renderInvitation(letter, stop)}
        ${writingDrawer(stop)}
        <footer class="sea-letter-bottom">
          <div class="sea-letter-links">
            ${seaButton('alternate', say('alternate'), 'refresh')}
            ${seaButton('skip', say('later'), 'arrow')}
          </div>
          ${seaButton('complete', say('send'), 'lotus', {primary:true})}
        </footer>
      </article>`;
    } else {
      content = `<article class="sea-sealed-letter">
        <h3>${E(say('sealedTitle'))}</h3>
        <button type="button" class="sea-envelope" data-voyage-action="open-letter" aria-label="${E(say('openLetter'))} · ${letterTitle}">
          <span class="sea-envelope-address"><small>${E(L(P.routes[currentId].envelope) || say('to'))}</small><strong>${E(route.name)}</strong></span>
          <span class="sea-envelope-seal">${lotus}</span>
          <span class="sea-envelope-caption">${E(say('openLetter'))}${icon('arrow')}</span>
        </button>
      </article>`;
    }
    scene.innerHTML = `<div class="sea-letter-desk">${letterRail(session)}${content}</div>`;
  }
  function openLetter() {
    const s=getSession(),stop=getStop();if(!stop||stop.status!=='pending'||drawLock)return;
    stop.opened=true;stop.found=true;
    if(!stop.author){stop.playerIdx=readerIndex();stop.helperIdx=((s.turnIndex||0)+(s.roleOffset?0:1))%Math.max(2,state.playerCount);stop.author=person(stop.playerIdx);}
    s.phase='letter';render();FolkAudio.playBambooClack();focus('#seaInvitation');
  }
  function sourceMarkup(step) {
    const source=D.sources[step.source];
    return `<details class="voyage-sources"><summary>${E(say('references'))}</summary><p>${E(say('sourceNote'))}</p><a href="${E(source.url)}" target="_blank" rel="noopener noreferrer">${E(L(source.title))} ↗</a><p>${E(say('geoSource'))}</p><a href="https://allencoralatlas.org/methods/" target="_blank" rel="noopener noreferrer">Allen Coral Atlas · CC BY 4.0 ↗</a><p>${E(say('originalNote'))}</p>${seaButton('originals',say('originals'),'cards')}</details>`;
  }
  function renderPanel() { renderScene(); }
  function renderDock() {
    if (!enabled) return;
    const s = getSession(), step = getStep(), stop = getStop();
    if (!step || !stop || s.phase !== 'deck' || mode !== 'play') {
      dock.replaceChildren();
      return;
    }
    const last=(archives.get(currentId)||[]).at(-1),lastCard=last?.stops[s.index]?.cardId;
    const available=step.cards.filter(c=>!stop.drawn.includes(c.id));
    dock.innerHTML=`<div class="voyage-dock-copy"><span class="voyage-eyebrow">${E(say('fanKicker'))}</span><h3>${E(geo(step.target))}</h3><p>${E(say('fanHint'))}</p></div>
      <div class="voyage-fan" role="group" aria-label="${E(say('fanKicker'))}">${step.cards.map((c,i)=>`<button type="button" class="voyage-fanned-card" data-voyage-action="draw" data-card="${E(c.id)}" style="--fan-x:${(i-1)*62}px;--fan-angle:${(i-1)*13}deg;--fan-open:${(i-1)*92}px" aria-label="${E(say('cardChoice',{n:i+1,topic:L(c.topic)}))}" ${drawLock?'disabled':''}><span class="voyage-card-topic">${E(L(c.topic))}</span><span class="voyage-card-lotus">${lotus}</span><strong>${E(getRoute().name)}</strong></button>`).join('')}</div>
      <div class="voyage-dock-action">
        ${seaButton('draw', say(stop.cardId ? 'resumeCard' : 'draw'), 'cards', {primary:true, attributes:drawLock ? 'disabled' : ''})}
        <span class="voyage-draw-status"></span>
        ${seaButton('map', say('backMap'), 'back')}
      </div>`;
    dock.dataset.previousCard=lastCard || '';dock.dataset.available=String(available.length);
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
    drawLock=true;dock.setAttribute('aria-busy','true');
    dock.querySelectorAll('[data-voyage-action="draw"]').forEach(el=>el.disabled=true);
    const commit=()=>{
      if(s!==getSession() || !enabled || !dialog.classList.contains('open'))return;
      drawTimers=[];drawLock=false;stop.cardId=picked.id;stop.drawn.push(picked.id);stop.order=shuffle([0,1,2]);
      stop.playerIdx=readerIndex();stop.helperIdx=((s.turnIndex||0)+(s.roleOffset?0:1))%Math.max(2,state.playerCount);stop.author=person(stop.playerIdx);s.phase='card';
      render();focus('#voyageQuestion');
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
    if (!enabled) return;
    const step = getStep(), stop = getStop(), card = activeCard();
    if (!card || getSession().phase !== 'card' || mode !== 'play') {
      workbench.replaceChildren();
      return;
    }
    const reader = authorOf(stop) || roles()[0];
    const helper = Number.isInteger(stop.helperIdx) ? person(stop.helperIdx) : roles()[1];
    const source = D.sources[step.source];
    workbench.innerHTML = `
      <div class="voyage-card-context">
        <strong>${E(geo(step.target))}</strong>
        ${seaButton('map', say('backMap'), 'back')}
      </div>
      <div class="voyage-diptych">
        <section class="voyage-card-front">
          <span class="voyage-eyebrow">${E(say('front'))} · ${E(L(card.topic))}</span>
          <details class="voyage-card-reading" ${stop.readingOpen ? 'open' : ''}>
            <summary>${E(L(step.context))}</summary>
            <p>${E(L(step.reading))}</p>
            <a href="${E(source.url)}" target="_blank" rel="noopener noreferrer">${E(L(source.title))} ↗</a>
          </details>
          <h3 id="voyageQuestion" tabindex="-1">${E(L(card.question))}</h3>
          <div class="voyage-options" role="group" aria-labelledby="voyageQuestion">
            ${stop.order.map((index, position) => {
              const selected = stop.selected === index;
              const correct = stop.revealed && index === card.correct;
              const incorrect = stop.revealed && selected && !correct;
              return `<button type="button" class="voyage-option ${selected ? 'is-selected' : ''} ${correct ? 'is-correct' : ''} ${incorrect ? 'is-incorrect' : ''}"
                data-voyage-action="option" data-option="${index}" aria-pressed="${selected}" ${stop.revealed ? 'disabled' : ''}>
                <span>${String.fromCharCode(65+position)}</span>${E(L(card.options[index]))}${correct ? ' ✓' : ''}
              </button>`;
            }).join('')}
          </div>
          ${stop.revealed ? `<div class="voyage-answer" role="status">
            <strong>${E(say(stop.selected === card.correct ? 'right' : 'learn'))}</strong>
            <p>${E(L(card.explanation))}</p>
          </div>` : `<div class="voyage-card-actions">
            ${seaButton('helper', say('helper'), 'heart', {attributes:`aria-expanded="${Boolean(stop.helperOpen)}" aria-controls="voyageHelper"`})}
            ${seaButton('explain', say('explain'), 'book')}
            ${seaButton('check', say('check'), 'check', {primary:true, attributes:stop.selected === null ? 'disabled' : ''})}
          </div>
          <p id="voyageHelper" class="voyage-helper" ${stop.helperOpen ? '' : 'hidden'}>${E(say('helperText', {name:helper}))}</p>`}
        </section>
        <section class="voyage-card-back">
          <div id="voyageSeal" class="voyage-seal" ${stop.unlocked ? 'hidden' : ''}>
            <h3>${E(say('back'))}</h3>
            <button type="button" class="voyage-wax-seal" data-voyage-action="unseal" aria-label="${E(say('seal'))}">
              ${lotus}<small>${E(say('seal'))}</small>
            </button>
          </div>
          <div id="voyageConnection" ${stop.unlocked ? '' : 'inert'} aria-hidden="${!stop.unlocked}">
            <span class="voyage-eyebrow">${E(say('back'))}</span>
            <p class="sea-reader">${E(say('owner', {name:reader}))}</p>
            <div class="voyage-activity">
              <h3 id="voyageActivity" tabindex="-1">${E(L(step.title))}</h3>
              <p>${E(L(step.activities[stop.activity]))}</p>
            </div>
            ${activityMarkup(step, stop)}
            ${writingDrawer(stop)}
            <div class="voyage-complete-actions">
              ${seaButton('alternate', L(D.ui.alternate), 'refresh')}
              ${seaButton('timer', say(timer ? 'stopTimer' : 'listen'), 'timer', {attributes:`aria-pressed="${Boolean(timer)}"`})}
              <span class="voyage-timer" aria-live="off">${timer ? seconds + 's' : ''}</span>
              ${seaButton('skip', say('later'), 'arrow')}
              ${seaButton('complete', say('complete'), 'lotus', {primary:true})}
            </div>
          </div>
        </section>
      </div>`;
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
    if (!enabled || dialog.dataset.voyagePhase !== 'album') {
      album.replaceChildren();
      return;
    }
    const s = selectedJournal();
    const session = getSession();
    const history = archives.get(currentId) || [];
    const editable = activeArchive < 0;
    const other = D.routes[currentId === 'hoang-sa' ? 'truong-sa' : 'hoang-sa'].name;
    album.innerHTML = `<div class="sea-album-content">
      <header class="sea-view-header"><h3>${E(say('albumTitle'))}</h3>
        ${session.index < 3 ? seaButton('play', say('continue'), 'back') : seaButton('replay', say('replay'), 'refresh')}
      </header>
      <article class="voyage-postcard">
        <div class="voyage-postcard-top"><span>${E(getRoute().name)}</span><span>${E(dateOf(s))}</span></div>
        <h4 class="voyage-postcard-title">${E(titleOf(s))}</h4>
        <div class="voyage-postcard-body">
          <div class="voyage-postcard-entries">${s.stops.map((stop, i) => {
            const letter = getLetter(i);
            return `<section class="voyage-postcard-entry" data-status="${stop.status}">
              <span class="sea-step-icon">${icon(stop.status === 'done' ? 'check' : letter.icon)}</span>
              <div><h4>${E(L(letter.title))}</h4>
                <span class="voyage-entry-status">${E(letterStatus(stop))}</span>
                <p class="voyage-kept-line" data-note-preview="${i}">${E(keptText(stop))}</p>
                ${editable && session.albumEdit ? `<label for="voyageAlbumNote${i}">${E(say('note'))}</label>
                  <textarea id="voyageAlbumNote${i}" rows="2" maxlength="180" data-album-note="${i}">${E(stop.note)}</textarea>` : ''}
              </div>
            </section>`;
          }).join('')}</div>
          <div class="voyage-postcard-aside">${sketch()}</div>
        </div>
        <footer><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">${E(say('exportCredit'))}</a></footer>
      </article>
      <div class="sea-album-bottom">
        ${seaButton('download', say(exporting ? 'exporting' : 'download'), 'download', {primary:true, attributes:exporting ? 'disabled' : ''})}
        <details class="sea-album-options" ${session.albumOptionsOpen ? 'open' : ''}>
          <summary>${icon('more')}<span>${E(say('options'))}</span>${icon('chevron')}</summary>
          <div>
            ${editable ? `<label for="voyageTitle">${E(say('title'))}</label>
              <input id="voyageTitle" maxlength="60" value="${E(s.title)}" placeholder="${E(L(P.routes[currentId].title))}">
              ${seaButton('edit-album', say('editPostcard'), 'pen', {attributes:`aria-pressed="${session.albumEdit}"`})}` : ''}
            ${seaButton('download-text', say('downloadText'), 'download')}
            ${seaButton('other', say('otherSea', {place:other}), 'map')}
            ${history.length ? `<label for="voyageArchiveSelect">${E(say('previous'))}</label>
              <select id="voyageArchiveSelect">
                <option value="-1" ${editable ? 'selected' : ''}>${E(say('current'))}</option>
                ${history.map((entry, i) => `<option value="${i}" ${activeArchive === i ? 'selected' : ''}>${E(titleOf(entry))}</option>`).join('')}
              </select>` : ''}
          </div>
        </details>
      </div>
      <p class="voyage-session-note">${E(say('session'))}</p>
    </div>`;
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
    if(event.target.id==='voyageArchiveSelect'){activeArchive=Number(event.target.value);renderAlbum();focus('#voyageArchiveSelect');}
    else if(event.target.hasAttribute('data-album-note'))renderSidebarTrackers();
  }
  function setMode(next) {
    const fromPostmark = returnToPostmark && mode === 'story' && next === 'play';
    if (next !== 'story') returnToPostmark = false;
    snapshot();cancelDraw();stopTimer();mode=next;activeArchive=-1;dialog.classList.remove('voyage-destinations-open');
    if(next==='play'&&['deck','card'].includes(getSession().phase))getSession().phase=getStop()?.opened?'letter':'map';
    render();
    if (next === 'atlas') focus('#islandChartSearch');
    else if (next === 'story') focus('.sea-story-sheet h3');
    else if (dialog.dataset.voyagePhase === 'album') focus('.sea-album-bottom [data-voyage-action="download"]');
    else if (fromPostmark && getSession().phase === 'letter') focus('.sea-postmark');
    else focusLetter();
  }
  function focusLetter() {
    const phase = getSession().phase;
    if (phase === 'letter') focus('#seaInvitation');
    else if (phase === 'sent') focus('.sea-sent-letter [data-voyage-action="next-letter"]');
    else focus('.sea-envelope');
  }
  function setDestinations(open) {
    dialog.classList.toggle('voyage-destinations-open', open);
    $('[data-voyage-action="destinations"]').setAttribute('aria-expanded', String(open));
    if (open) {
      $('.sea-more').open = false;
      body.scrollTop = 0;
      focus('.natural-island-tabs [aria-pressed="true"]');
    } else focus('.sea-more > summary');
  }
  function handleClick(event) {
    if (!enabled) return;
    const more = $('.sea-more');
    if (more.open && !more.contains(event.target)) more.open = false;
    const button=event.target.closest('[data-voyage-action]');
    if(!button || button.disabled)return;
    const action=button.dataset.voyageAction,s=getSession(),stop=getStop();
    if(action==='story')returnToPostmark=button.classList.contains('sea-postmark');
    if(action==='play'||action==='atlas'||action==='album'||action==='story'){setMode(action);return;}
    if(action==='open-letter'){openLetter();return;}
    if(action==='next-letter'){s.phase='map';if(s.index>=3)mode='album';render();focus(s.index<3?'[data-voyage-action="open-letter"]':'[data-voyage-action="download"]');return;}
    if(action==='deck'){if(!stop)return;stop.found=true;s.phase='deck';mode='play';render();focus('.voyage-fanned-card');return;}
    if(action==='destinations'){setDestinations(!dialog.classList.contains('voyage-destinations-open'));return;}
    if(action==='vi'||action==='en'){
      window.GoiVietI18n?.setLang(action);
      $('.sea-more').open = true;
      focus(`.sea-more [data-voyage-action="${action}"]`);
      return;
    }
    if(action==='other'){snapshot();landscape().switchDetailGroup(currentId==='hoang-sa'?'truong-sa':'hoang-sa');return;}
    if(action==='originals'){openDeckModal(currentId,button);return;}
    if(action==='download'){downloadPostcard();return;}
    if(action==='download-text'){downloadBlob(new Blob([journalText(selectedJournal())],{type:'text/plain;charset=utf-8'}),'txt');return;}
    if(action==='edit-album'){
      s.albumEdit = !s.albumEdit;
      s.albumOptionsOpen = true;
      renderAlbum();
      focus(s.albumEdit ? '#voyageAlbumNote0' : '.sea-album-options [data-voyage-action="edit-album"]');
      return;
    }
    if(action==='replay'){snapshot();const history=archives.get(currentId)||[];history.push(structuredClone(s));archives.set(currentId,history);sessions.set(currentId,fresh(currentId));mode='play';activeArchive=-1;render();focus('[data-voyage-action="open-letter"]');return;}
    if(!stop)return;
    if(action==='roles'){
      s.roleOffset = s.roleOffset ? 0 : 1;
      if (stop.opened || stop.cardId) {
        stop.playerIdx = readerIndex();
        stop.helperIdx = ((s.turnIndex || 0) + (s.roleOffset ? 0 : 1)) % Math.max(2, state.playerCount);
        stop.author = person(stop.playerIdx);
      }
      renderScene();renderCards();
      more.open = false;
      focus('.sea-more > summary');
      announce(say('owner', {name:person(readerIndex())}));
      return;
    }
    if(action==='draw'){draw(button.dataset.card);return;}
    if(action==='map'){setMode('play');return;}
    if(action==='option'&&!stop.revealed){stop.selected=Number(button.dataset.option);renderCards();focus(`[data-voyage-action="option"][data-option="${stop.selected}"]`);return;}
    if(action==='helper'){
      const helper = $('#voyageHelper');
      stop.helperOpen = helper.hidden;
      helper.hidden = !stop.helperOpen;
      button.setAttribute('aria-expanded', String(stop.helperOpen));
      announce(helper.hidden ? '' : helper.textContent);
      return;
    }
    if(action==='check'||action==='explain'){
      if (action === 'check' && stop.selected === null) return;
      stop.revealed = true;
      stop.unlocked = true;
      renderCards();
      focus('#voyageActivity');
      return;
    }
    if(action==='unseal'){stop.unlocked=true;renderCards();announce(say('back'));focus('#voyageActivity');return;}
    if(s.phase !== 'letter' && !stop.unlocked && action !== 'skip')return;
    if(action==='word'){const n=Number(button.dataset.item);if(!getLetter()?.words?.[n])return;stop.wordIndex=stop.wordIndex===n?-1:n;renderScene();focus(`[data-voyage-action="word"][data-item="${n}"]`);return;}
    if(action==='alternate'){stopTimer();stop.activity=(stop.activity+1)%getStep().activities.length;if(s.phase==='card'){renderCards();focus('#voyageActivity');}else{renderScene();focus('#seaInvitation');}return;}
    if(action==='bag'){const n=Number(button.dataset.item);if(!D.bag[n])return;if(stop.bag.includes(n))stop.bag=stop.bag.filter(x=>x!==n);else if(stop.bag.length<3)stop.bag.push(n);else {announce(say('bagFull'));return;}if(s.phase==='card')renderCards();else renderScene();focus(`[data-voyage-action="bag"][data-item="${n}"]`);return;}
    if(action==='starter'){
      const index = Number(button.dataset.item);
      const starters = s.phase === 'letter' ? letterStarters() : getStep().starters;
      const previous = starters[stop.starter];
      if (!stop.note.trim() || stop.note === previous?.vi || stop.note === previous?.en) stop.note = L(starters[index]);
      stop.starter = index;
      stop.noteOpen = true;
      if (s.phase === 'card') renderCards();
      else renderScene();
      focus('#voyageNote');
      return;
    }
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
    if(drawLock||performance.now()<completingUntil||!stop||stop.status!=='pending'||(status==='done'&&s.phase!=='letter'&&!stop.unlocked))return;
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
      if(seconds<=0){
        stopTimer();
        announce(say('timerDone'));
        const button = $('[data-voyage-action="timer"]');
        if (!button) return;
        const buttonLabel = button.querySelector('span') || button;
        buttonLabel.textContent = say('listen');
        if (button.hasAttribute('aria-pressed')) button.setAttribute('aria-pressed','false');
      }
    },1000);
  }
  function stopTimer() { if(timer)clearInterval(timer);timer=null; }
  function handleEscape() {
    if(!enabled)return false;
    const more=$('.sea-more');if(more?.open){more.open=false;focus('.sea-more > summary');return true;}
    if(dialog.classList.contains('voyage-destinations-open')){setDestinations(false);return true;}
    if(drawLock){cancelDraw();announce(say('fanHint'));focus('[data-voyage-action="draw"]');return true;}
    if(mode==='atlas'||mode==='story'){setMode('play');return true;}
    if(mode==='play'&&getSession().phase==='deck'){setMode('play');return true;}
    if(mode==='album'&&getSession().index<3){setMode('play');return true;}
    if(mode==='play'&&getSession().phase==='card'){setMode('play');return true;}
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
    sessions.clear();archives.clear();if(dialog)disable();currentId=null;groupData=null;targetEntries=[];mode='play';completingUntil=0;returnToPostmark=false;
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
  window.GoiVietFamilyVoyage=Object.freeze({mount,onGroup,onClose,onSelect,handleEscape,beforeGroup:snapshot,reset,
    entryLabel:(place,full=false)=>desktop.matches?say(full?'entryLabel':'entry',{place}):null,
    isOpenFor:id=>enabled&&currentId===id&&dialog?.classList.contains('open'),
    suppressesLabel:value=>enabled && mode==='play' && targets().some(e=>e?.value===value),
    inspect:()=>({enabled,currentId,mode,phase:getSession()?.phase,drawLock,timerRunning:!!timer,seconds,exporting,targets:targets().map(e=>e?{value:e.value,label:e.label,point:[...e.point]}:null),sessions:structuredClone(Object.fromEntries(sessions)),archives:structuredClone(Object.fromEntries(archives)),desktop:desktop.matches})});
})();
