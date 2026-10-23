/* Official-reference chapter v2. Button-only entry; native registered source layers. The existing map close path owns map setup. */
(() => {
  'use strict';
  const intro = document.getElementById('introScreen');
  const chapter = document.getElementById('memoryChapter');
  if (!intro || !chapter || document.body.dataset.previewVersion !== '3') return;
  const $ = id => document.getElementById(id);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const motion = () => !reduced.matches && !document.body.classList.contains('reduced-motion');
  const isOpen = () => !intro.classList.contains('intro-hidden');
  const next = $('memoryNextCard'), card = $('memoryCard'), cardStack = card.closest('.mc-card-stack'), curtain = $('memoryMapTransition');
  const timers = new Set();
  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); return id; };
  const questions = [
    ['Vị nhà', 'Nếu được về nhà ăn một bữa, bạn muốn ăn món gì?'],
    ['Chuyện cũ', 'Có câu chuyện nào của ông bà mà bạn muốn nghe thêm một lần?'],
    ['Nếp quen', 'Nhà mình còn giữ thói quen nào từ những ngày bạn còn bé?'],
    ['Vị nhà', 'Mùi thơm nào khiến bạn nhớ ngay đến gian bếp ở nhà?'],
    ['Chuyện cũ', 'Con đường về quê gợi cho bạn kỷ niệm nào đầu tiên?'],
    ['Nếp quen', 'Ngày Tết, cả nhà thường cùng nhau làm việc gì?'],
    ['Vị nhà', 'Ai là người nấu món bạn nhớ nhất, và bạn nhớ điều gì ở họ?'],
    ['Chuyện cũ', 'Nếu kể cho con cháu một chuyện tuổi thơ, bạn sẽ kể chuyện gì?'],
    ['Nếp quen', 'Có câu nói quen nào trong nhà mà bạn vẫn nhớ đến hôm nay?']
  ];
  const icons = [
    'M10 25 Q50 5 90 25 Q50 43 10 25ZM12 27 Q20 52 50 53 Q80 52 88 27M29 54H71M23 25q27-12 54 0M35 15q-9-9 0-14M51 13q-8-7 0-12M65 15q-7-7 0-13',
    'M17 54V20H83V54M30 54V29H70V54M9 20L50 4 91 20ZM39 54V37Q50 25 61 37V54M12 24H88M23 13L50 0 77 13',
    'M14 50Q50 2 86 50M14 50H86M22 50L50 11 78 50M35 50L50 11 65 50M17 41H83M24 32H76M33 23H67'
  ];
  let questionIndex = 0, flipping = false, exiting = false, frame = 0, wasOpen = isOpen(), artworkVisible;
  let flipRevision = 0, pendingQuestionIndex = null, exitRevision = 0;
  const allReveals = [...chapter.querySelectorAll('[data-mc-reveal]')];
  const applyQuestion = index => {
    questionIndex = index;
    $('memoryCardCategory').textContent = questions[index][0];
    $('memoryCardQuestion').textContent = questions[index][1];
    fitQuestion();
  };
  function unlockCard() { flipping = false; pendingQuestionIndex = null; card.classList.remove('is-flipping'); cardStack.classList.remove('is-card-flipping'); next.removeAttribute('aria-disabled'); }
  function changeCard() {
    if (flipping || exiting) return;
    const index = (questionIndex + 1) % questions.length;
    flipping = true; pendingQuestionIndex = index; next.setAttribute('aria-disabled', 'true');
    const revision = ++flipRevision;
    const change = () => { if (revision !== flipRevision) return; applyQuestion(index); pendingQuestionIndex = null; $('memoryCardAnnouncement').textContent = `${questions[index][0]}. ${questions[index][1]}`; };
    if (!motion()) { change(); unlockCard(); return; }
    cardStack.classList.add('is-card-flipping');
    card.classList.add('is-flipping');
    later(change, 360);
    later(() => { if (revision === flipRevision) unlockCard(); }, 740);
  }
  function completeOpening() {
    const home = window.GoiVietHomeIntro;
    if (home && home.getState().phase !== 'complete') home.skip();
  }
  function begin() {
    completeOpening();
    intro.dataset.memoryUnlocked = "true";
    chapter.inert = false; chapter.removeAttribute("aria-hidden");
    fitQuestion(); drawSeam();
    chapter.focus({ preventScroll: true });
    const top = chapter.getBoundingClientRect().top - intro.getBoundingClientRect().top + intro.scrollTop;
    intro.scrollTo({ top, behavior: motion() ? 'smooth' : 'instant' });
  }
  // Shown on the curtain while the map is still being prepared; the status line announces the same text.
  const curtainNote = Object.assign(document.createElement('p'), { className: 'mc-transition-note', textContent: 'Đang chuẩn bị bản đồ…' });
  curtain.append(curtainNote);
  function clearCurtain() { curtain.classList.remove('is-covering', 'is-revealing', 'is-waiting'); }
  function enterMap(event) {
    event?.preventDefault(); event?.stopImmediatePropagation();
    if (exiting || !isOpen()) return;
    exiting = true;
    const revision = ++exitRevision;
    const status = $('memoryMapStatus');
    $('memoryOpenMap').setAttribute('aria-disabled', 'true');
    $('memoryMapShortcut')?.setAttribute('aria-disabled', 'true');
    status.textContent = 'Đang mở bản đồ ký ức…';
    const done = () => later(() => { if (revision !== exitRevision) return; clearCurtain(); exiting = false; $('memoryOpenMap').removeAttribute('aria-disabled'); $('memoryMapShortcut')?.removeAttribute('aria-disabled'); }, motion() ? 470 : 0);
    const finish = () => {
      if (revision !== exitRevision) return;
      try {
        if (typeof window.closeIntroModal !== 'function') throw new Error('Map entry is unavailable');
        // closeIntroModal configures the overview and paints renderMainScene synchronously
        // before hiding the intro. Its existing renderer fallback remains authoritative.
        window.closeIntroModal();
        if (isOpen()) throw new Error('Map entry did not finish');
        const reveal = () => { if (revision !== exitRevision) return; curtain.classList.remove('is-waiting'); curtain.classList.add('is-revealing'); status.textContent = ''; done(); };
        // The curtain stays until the map is complete (map-prewarm-3.js), and says so if that takes a while.
        const prewarm = window.GoiVietMapPrewarm3;
        if (prewarm) prewarm.hold(reveal, () => { if (revision !== exitRevision) return; curtain.classList.add('is-waiting'); status.textContent = 'Đang chuẩn bị bản đồ…'; });
        else reveal();
      } catch (error) {
        status.textContent = 'Bản đồ chưa mở được. Bạn hãy thử lại.';
        console.error('[Miền ký ức] Không thể mở bản đồ:', error);
        clearCurtain(); done();
      }
    };
    // Without motion the curtain appears at once, so the map is still shown only when complete.
    if (!motion()) { curtain.classList.add('is-covering'); finish(); return; }
    curtain.classList.remove('is-revealing'); curtain.classList.add('is-covering');
    later(finish, 440);
    // A failed transition may never leave a visual screen over the application; a curtain waiting
    // for the map is released by map-prewarm-3.js.
    later(() => { if (revision === exitRevision && !window.GoiVietMapPrewarm3?.holding() && !curtain.classList.contains('is-revealing')) clearCurtain(); }, 2000);
  }
  function updateSceneVisibility() {
    frame = 0;
    const pageVisible = isOpen() && !document.hidden;
    const active = pageVisible && intro.scrollTop + intro.clientHeight > chapter.offsetTop && intro.scrollTop < chapter.offsetTop + chapter.offsetHeight;
    chapter.classList.toggle('is-active', active);
    const heroVisible = pageVisible && intro.scrollTop < $('introWelcomeStage').offsetHeight - 40;
    if (artworkVisible !== heroVisible) {
      artworkVisible = heroVisible;
      window.GoiVietHomeIntro?.setArtworkVisible?.(heroVisible);
    }
  }
  function scheduleScene() { if (!frame) frame = requestAnimationFrame(updateSceneVisibility); }
  function onScroll() {
    if (intro.dataset.memoryUnlocked !== 'true' && intro.scrollTop) intro.scrollTop = 0;
    scheduleScene();
  }
  function lock() {
    intro.dataset.memoryUnlocked = 'false'; chapter.inert = true;
    chapter.setAttribute('aria-hidden','true');
    intro.scrollTo({top:0,behavior:'instant'});
  }
  function fitQuestion() {
    const q=$('memoryCardQuestion'), box=q.parentElement;
    q.style.removeProperty('font-size');
    let size=parseFloat(getComputedStyle(q).fontSize), minimum=size*.68;
    while(q.offsetHeight>box.clientHeight+1 && size>minimum){size-=.5;q.style.fontSize=size+'px';}
  }
  // The upper edge uses actual current homepage pixels, including its responsive crop.
  // The reference panorama takes over gradually, rather than meeting at a hard boundary.
  function drawSeam() {
    const canvas=$('memorySeamCanvas'), hero=$('introWelcomeStage');
    if(!canvas || getComputedStyle(canvas).display==='none')return;
    const source=hero.querySelector('.gv-home-film canvas');
    if(!source || !source.width || !source.height)return;
    const w=intro.clientWidth,h=w<=700?100:w*.1442,rect=source.getBoundingClientRect();
    const density=Math.min(2,window.devicePixelRatio||1);
    canvas.width=Math.round(w*density);canvas.height=Math.round(h*density);
    const ctx=canvas.getContext('2d');
    ctx.setTransform(density,0,0,density,0,0);
    const sy=Math.max(0,(hero.getBoundingClientRect().bottom-h-rect.top)/rect.height*source.height);
    ctx.clearRect(0,0,w,h);
    ctx.drawImage(source,0,sy,source.width,Math.min(source.height-sy,h/rect.height*source.height),0,0,w,h);
  }
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    for (const entry of entries) {
      entry.target.classList.toggle('in-view', entry.isIntersecting);
      if (entry.isIntersecting) entry.target.classList.add('is-visible');
    }
  }, { root:intro, threshold:0, rootMargin:'0px 0px -30px 0px' }) : null;
  allReveals.forEach(node => { if (observer) observer.observe(node); else node.classList.add('is-visible', 'in-view'); });
  if (observer) chapter.classList.add('mc-motion');
  function preferenceChanged() {
    chapter.classList.toggle('mc-motion', !!observer && motion());
    if (!motion() && flipping) {
      ++flipRevision; if (pendingQuestionIndex !== null) applyQuestion(pendingQuestionIndex);
      unlockCard();
      $('memoryCardAnnouncement').textContent = questions[questionIndex][1];
    }
    scheduleScene();
  }
  const stateObserver = new MutationObserver(() => {
    const open = isOpen();
    if (open && !wasOpen) {
      ++exitRevision; exiting = false; clearCurtain();
      $('memoryOpenMap').removeAttribute('aria-disabled'); $('memoryMapShortcut')?.removeAttribute('aria-disabled');
      lock();
    }
    wasOpen = open; scheduleScene();
  });
  stateObserver.observe(intro, { attributes:true, attributeFilter:['class'] });
  let previousPhase=intro.dataset.homeOpening;
  new MutationObserver(()=>{
    const phase=intro.dataset.homeOpening;
    if(phase!==previousPhase && ['waiting','preparing','playing'].includes(phase) && intro.dataset.memoryUnlocked==='true')lock();
    previousPhase=phase;
  }).observe(intro,{attributes:true,attributeFilter:['data-home-opening']});
  intro.addEventListener('wheel',event=>{if(intro.dataset.memoryUnlocked!=='true'&&!event.target.closest('.gv-home-music-settings'))event.preventDefault();},{passive:false});
  intro.addEventListener('touchmove',event=>{if(intro.dataset.memoryUnlocked!=='true'&&!event.target.closest('.gv-home-music-settings'))event.preventDefault();},{passive:false});
  intro.addEventListener('keydown',event=>{
    if(intro.dataset.memoryUnlocked==='true'||event.target.closest('input,textarea,select,button,summary'))return;
    if(['PageDown','PageUp','ArrowDown','ArrowUp','End','Home',' '].includes(event.key))event.preventDefault();
  });
  if(observer)chapter.querySelectorAll('[data-mc-train]').forEach(node=>observer.observe(node));
  document.fonts.ready.then(fitQuestion);
  new MutationObserver(preferenceChanged).observe(document.body, { attributes:true, attributeFilter:['class'] });
  reduced.addEventListener('change', preferenceChanged);
  intro.addEventListener('scroll', onScroll, { passive:true });
  window.addEventListener('resize', () => {fitQuestion();drawSeam();scheduleScene();}); document.addEventListener('visibilitychange', scheduleScene);
  window.addEventListener('pageshow', scheduleScene);
  next.addEventListener('click', changeCard);
  $('btnProceedToGuide')?.addEventListener('click',event=>{event.preventDefault();event.stopImmediatePropagation();begin();},true);
  $('memoryOpenMap').addEventListener('click', enterMap, true);

  window.GoiVietMemoryChapter = { begin, enterMap, getState:() => ({ questionIndex, flipping, exiting, unlocked:intro.dataset.memoryUnlocked==='true', layerCount:chapter.querySelectorAll('[data-ref-layer]').length, heroVisible:artworkVisible, questionCount:questions.length }) };
  lock(); fitQuestion(); preferenceChanged();
})();
