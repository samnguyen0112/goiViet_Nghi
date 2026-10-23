/* A self-contained chapter for Preview 3. The existing map close path owns map setup. */
(() => {
  'use strict';
  const intro = document.getElementById('introScreen');
  const chapter = document.getElementById('memoryChapter');
  if (!intro || !chapter || document.body.dataset.previewVersion !== '3') return;
  const $ = id => document.getElementById(id);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const motion = () => !reduced.matches && !document.body.classList.contains('reduced-motion');
  const isOpen = () => !intro.classList.contains('intro-hidden');
  const next = $('memoryNextCard'), card = $('memoryCard'), curtain = $('memoryMapTransition');
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
    $('memoryCardIcon').replaceChildren();
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', icons[index % 3]); $('memoryCardIcon').append(path);
  };
  function unlockCard() { flipping = false; pendingQuestionIndex = null; card.classList.remove('is-flipping'); next.removeAttribute('aria-disabled'); }
  function changeCard() {
    if (flipping || exiting) return;
    const index = (questionIndex + 1) % questions.length;
    flipping = true; pendingQuestionIndex = index; next.setAttribute('aria-disabled', 'true');
    const revision = ++flipRevision;
    const change = () => { if (revision !== flipRevision) return; applyQuestion(index); pendingQuestionIndex = null; $('memoryCardAnnouncement').textContent = `${questions[index][0]}. ${questions[index][1]}`; };
    if (!motion()) { change(); unlockCard(); return; }
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
    chapter.focus({ preventScroll: true });
    const top = chapter.getBoundingClientRect().top - intro.getBoundingClientRect().top + intro.scrollTop;
    intro.scrollTo({ top, behavior: motion() ? 'smooth' : 'instant' });
  }
  function clearCurtain() { curtain.classList.remove('is-covering', 'is-revealing'); }
  function enterMap(event) {
    event?.preventDefault(); event?.stopImmediatePropagation();
    if (exiting || !isOpen()) return;
    exiting = true;
    const revision = ++exitRevision;
    const status = $('memoryMapStatus');
    $('memoryOpenMap').setAttribute('aria-disabled', 'true');
    $('memoryMapShortcut').setAttribute('aria-disabled', 'true');
    status.textContent = 'Đang mở bản đồ ký ức…';
    const finish = () => {
      if (revision !== exitRevision) return;
      try {
        if (typeof window.closeIntroModal !== 'function') throw new Error('Map entry is unavailable');
        // closeIntroModal configures the overview and paints renderMainScene synchronously
        // before hiding the intro. Its existing renderer fallback remains authoritative.
        window.closeIntroModal();
        if (isOpen()) throw new Error('Map entry did not finish');
        curtain.classList.add('is-revealing');
        status.textContent = '';
      } catch (error) {
        status.textContent = 'Bản đồ chưa mở được. Bạn hãy thử lại.';
        console.error('[Miền ký ức] Không thể mở bản đồ:', error);
        clearCurtain();
      } finally {
        later(() => { if (revision !== exitRevision) return; clearCurtain(); exiting = false; $('memoryOpenMap').removeAttribute('aria-disabled'); $('memoryMapShortcut').removeAttribute('aria-disabled'); }, motion() ? 470 : 0);
      }
    };
    if (!motion()) { finish(); return; }
    curtain.classList.remove('is-revealing'); curtain.classList.add('is-covering');
    later(finish, 440);
    // A failed transition may never leave a visual screen over the application.
    later(() => { if (revision === exitRevision) clearCurtain(); }, 2000);
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
    const ratio = Math.min(1, Math.max(0, intro.scrollTop / Math.max(1, $('introWelcomeStage').offsetHeight)));
    if (motion()) chapter.style.setProperty('--mc-parallax', `${Math.round(ratio * 22)}px`);
    else chapter.style.setProperty('--mc-parallax', '0px');
  }
  function scheduleScene() { if (!frame) frame = requestAnimationFrame(updateSceneVisibility); }
  function onScroll() {
    const phase = window.GoiVietHomeIntro?.getState().phase;
    if (intro.scrollTop > 80 && phase && phase !== 'complete') {
      completeOpening(); chapter.focus({ preventScroll:true });
    }
    scheduleScene();
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
      $('memoryOpenMap').removeAttribute('aria-disabled'); $('memoryMapShortcut').removeAttribute('aria-disabled');
      intro.scrollTo({ top:0, behavior:'instant' });
    }
    wasOpen = open; scheduleScene();
  });
  stateObserver.observe(intro, { attributes:true, attributeFilter:['class'] });
  new MutationObserver(preferenceChanged).observe(document.body, { attributes:true, attributeFilter:['class'] });
  reduced.addEventListener('change', preferenceChanged);
  intro.addEventListener('scroll', onScroll, { passive:true });
  window.addEventListener('resize', scheduleScene); document.addEventListener('visibilitychange', scheduleScene);
  window.addEventListener('pageshow', scheduleScene);
  next.addEventListener('click', changeCard);
  for (const id of ['memoryOpenMap', 'memoryMapShortcut']) $(id).addEventListener('click', enterMap, true);
  document.querySelector('.mc-scroll-cue').addEventListener('click', event => { event.preventDefault(); begin(); });
  window.GoiVietMemoryChapter = { begin, enterMap, getState:() => ({ questionIndex, flipping, exiting, heroVisible:artworkVisible, questionCount:questions.length }) };
  preferenceChanged();
})();
