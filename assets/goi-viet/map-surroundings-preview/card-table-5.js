/* The drawn card shows the question and the connection on one table. Narrow screens show one face at a time. */
(function () {
  'use strict';
  const byId = id => document.getElementById(id);
  const T = (key, vars) => (window.GoiVietI18n ? window.GoiVietI18n.t(key, vars) : key);
  const front = byId('cardFrontState');
  const seal = byId('conversationSeal');
  const sealHint = byId('conversationSealHint');
  const scrollBody = byId('deckScrollBody');
  if (!front || !seal || !sealHint || !scrollBody) return;
  const viewport = byId('drawnCardViewport');
  const explanation = byId('answerExplanationBox');
  const narrow = matchMedia('(max-width: 860px)');
  const quizSealHintKey = sealHint.dataset.i18n;
  const canvaSealHint = {
    vi: 'Trả lời câu hỏi, rồi chạm dấu Hoa Sen để mở thử thách.',
    en: 'Answer the question, then tap the lotus seal to open the challenge.',
  };

  // The cover stays hidden until the player asks to see it.
  const wrap = document.createElement('div');
  wrap.className = 'card-table-front';
  front.before(wrap);
  const peek = document.createElement('button');
  peek.type = 'button';
  peek.id = 'cardCoverPeek';
  peek.className = 'card-cover-peek';
  const photoDescriptions = document.createElement('ol');
  photoDescriptions.id = 'cardCoverDescriptions';
  photoDescriptions.className = 'sr-only';
  photoDescriptions.hidden = true;
  wrap.append(peek, photoDescriptions, front);
  const coverButton = document.createElement('button');
  coverButton.type = 'button';
  coverButton.id = 'cardCoverOpen';
  coverButton.className = 'btn-lg btn-secondary card-cover-open';
  coverButton.setAttribute('aria-controls', peek.id);
  const tools = document.createElement('div');
  tools.className = 'card-face-tools';
  tools.append(coverButton, byId('cardLinkedStoryContext'));
  const activityNote = byId('activityGentleNote');
  activityNote.removeAttribute('data-i18n');
  const memoryDrawer = byId('memoryDetailsDrawer');
  const timerDisplay = byId('listeningTimerDisplay');
  memoryDrawer.addEventListener('toggle', () => {
    if (!memoryDrawer.open) resetMemoryFormFeedback();
  });

  const reviewButton = document.createElement('button');
  const explanationButton = document.createElement('button');
  for (const button of [reviewButton, explanationButton]) {
    button.type = 'button';
    button.className = 'btn-lg btn-secondary card-review-button';
  }
  explanationButton.id = 'cardExplanationOpen';
  tools.append(explanationButton);
  byId('btnFlipToBack').before(reviewButton);
  reviewButton.addEventListener('click', () => reviewQuestion(true));
  explanationButton.addEventListener('click', () => reviewQuestion(false));

  // "Câu hỏi dành cho / người địa phương" (Canva cards) or "Câu hỏi về / món ăn" (other cards).
  const title = document.createElement('div');
  title.id = 'cardFaceTitle';
  title.className = 'card-face-title';
  const kicker = document.createElement('span');
  kicker.className = 'card-face-kicker';
  const script = document.createElement('span');
  script.className = 'card-face-script';
  const ornament = document.createElement('span');
  ornament.className = 'card-face-orn';
  ornament.setAttribute('aria-hidden', 'true');
  title.append(kicker, script, ornament);
  front.querySelector('.card-kicker-row').after(tools, title);

  const faceNav = document.createElement('div');
  faceNav.className = 'card-face-nav';
  const faceLabels = {
    front: { vi: 'Câu hỏi', en: 'Question' },
    back: { vi: 'Gắn kết', en: 'Connect' },
  };
  const faceButtons = Object.fromEntries(Object.keys(faceLabels).map(side => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-controls', side === 'front' ? front.id : 'cardBackState');
    button.addEventListener('click', () => showFace(side));
    faceNav.append(button);
    return [side, button];
  }));
  viewport.prepend(faceNav);

  function showFace(side) {
    setRaised(false, { restoreFocus: false });
    viewport.dataset.face = side;
    for (const [name, button] of Object.entries(faceButtons)) {
      button.setAttribute('aria-pressed', String(name === side));
    }
  }

  function focusCardPart(node) {
    node.tabIndex = -1;
    node.focus({ preventScroll: true });
  }

  function reviewQuestion(showQuestion) {
    front.toggleAttribute('data-review-question', showQuestion);
    focusCardPart(showQuestion ? byId('cardQuestionText') : byId('answerStatusHeading'));
  }

  function focusFace(side) {
    showFace(side);
    if (side === 'front' && explanation.classList.contains('visible')) reviewQuestion(true);
    else if (side === 'back' && memoryDrawer.open) memoryDrawer.querySelector('summary').focus({ preventScroll: true });
    else focusCardPart(side === 'front' ? byId('cardQuestionText') : viewport.querySelector('.activity-prompt-box'));
    return true;
  }

  function focusExplanation() {
    front.removeAttribute('data-review-question');
    if (!narrow.matches) return false;
    window.GoiVietConversationCards?.syncFaces();
    showFace('front');
    focusCardPart(byId('answerStatusHeading'));
    return true;
  }

  let fitFrame = 0;
  function fitTable() {
    fitFrame = 0;
    if (!viewport.getClientRects().length) return;
    const setScale = value => viewport.style.setProperty('--card-table-scale', value);
    const fits = () => scrollBody.scrollHeight <= scrollBody.clientHeight;
    viewport.removeAttribute('data-reading-explanation');
    setScale(1);
    if (fits() && !narrow.matches && innerWidth >= 1500) {
      // P5-06 UI audit: on large screens (projector, 1920×1080) the two cards grow, up to 1.22×, while they still fit.
      let low = 1, high = 1.22;
      for (let step = 0; step < 5; step++) {
        const scale = (low + high) / 2;
        setScale(scale);
        if (fits()) low = scale;
        else high = scale;
      }
      setScale(low);
    } else if (!fits()) {
      // Prefer full-size text and leave a scroll fallback for long optional forms or extreme zoom.
      let low = 0.84, high = 1;
      if (narrow.matches && viewport.dataset.face === 'front' &&
          explanation.classList.contains('visible') && !front.hasAttribute('data-review-question')) {
        setScale(low);
        if (!fits()) viewport.setAttribute('data-reading-explanation', '');
      }
      for (let step = 0; step < 5; step++) {
        const scale = (low + high) / 2;
        setScale(scale);
        if (fits()) low = scale;
        else high = scale;
      }
      setScale(low);
    }
    fitRaisedCover();
  }
  function queueFit() {
    if (!fitFrame) fitFrame = requestAnimationFrame(fitTable);
  }
  new MutationObserver(records => {
    if (records.some(record => !timerDisplay.contains(record.target))) queueFit();
  }).observe(viewport, {
    subtree: true, childList: true, characterData: true, attributes: true,
    attributeFilter: ['open', 'class', 'data-face', 'data-review-question', 'data-running', 'aria-hidden'],
  });
  window.addEventListener('resize', queueFit);
  document.fonts.ready.then(queueFit);

  // The two figures of the Canva back stand beside the lotus seal.
  ['left', 'right'].forEach(side => {
    const img = document.createElement('img');
    img.src = `assets/goi-viet/card-covers-5/figure-${side}.webp`;
    img.alt = '';
    img.decoding = 'async';
    img.className = `card-table-figure is-${side}`;
    img.setAttribute('aria-hidden', 'true');
    seal.append(img);
  });

  let raised = false;
  function fitRaisedCover() {
    if (!raised) return;
    const available = scrollBody.getBoundingClientRect().bottom - wrap.getBoundingClientRect().top;
    const scale = Number(viewport.style.getPropertyValue('--card-table-scale')) || 1;
    const height = Math.min(available / scale, wrap.clientHeight);
    peek.style.setProperty('--cover-fit-width', `${Math.max(0, height - 16) * 630 / 880}px`);
  }

  function syncCoverLabels() {
    coverButton.textContent = T('table.coverShow');
    coverButton.setAttribute('aria-expanded', String(raised));
    peek.setAttribute('aria-pressed', String(raised));
    peek.setAttribute('aria-label', T(raised ? 'table.coverBack' : 'table.coverShow'));
    photoDescriptions.hidden = !raised || !photoDescriptions.childElementCount;
    if (photoDescriptions.hidden) peek.removeAttribute('aria-describedby');
    else peek.setAttribute('aria-describedby', photoDescriptions.id);
  }

  function setRaised(on, { restoreFocus = true } = {}) {
    if (raised === on) return;
    raised = on;
    wrap.classList.toggle('is-raised', raised);
    front.inert = raised;
    syncCoverLabels();
    if (raised) {
      fitRaisedCover();
      peek.focus({ preventScroll: true });
    } else if (restoreFocus) coverButton.focus({ preventScroll: true });
  }
  peek.addEventListener('click', () => setRaised(false));
  coverButton.addEventListener('click', () => setRaised(true));
  document.addEventListener('keydown', event => {
    if (!raised || event.key !== 'Escape' || !byId('deckModal').contains(document.activeElement)) return;
    event.preventDefault();
    event.stopPropagation();
    setRaised(false);
  }, true);
  const coverObserver = new ResizeObserver(fitRaisedCover);
  coverObserver.observe(scrollBody);
  coverObserver.observe(wrap);

  // Decks without Canva artwork open a plain red cover.
  function plainCover(label, place) {
    const box = document.createElement('span');
    box.className = 'card-cover-plain';
    const name = document.createElement('b');
    name.textContent = label;
    const sub = document.createElement('small');
    sub.textContent = place ? (place.short || place.name) : '';
    box.append(name, sub);
    return box;
  }

  function render(card, place = typeof getDeckPlace === 'function' ? getDeckPlace() : null) {
    if (!card) return;
    const label = typeof uiLabel === 'function' ? uiLabel('topic', card.topic) : card.topic;
    const canva = window.GoiVietCanvaCards;
    const isCanva = Boolean(canva && canva.has(card));
    const lang = window.GoiVietI18n ? window.GoiVietI18n.lang() : 'vi';
    activityNote.textContent = lang === 'vi' ? 'Hoạt động tự nguyện, không chấm điểm.' : 'Activities are optional and unscored.';
    reviewButton.textContent = lang === 'vi' ? 'Xem lại câu hỏi' : 'Review the question';
    explanationButton.textContent = lang === 'vi' ? 'Xem giải thích' : 'See explanation';
    for (const [side, button] of Object.entries(faceButtons)) button.textContent = faceLabels[side][lang];
    if (isCanva) {
      sealHint.removeAttribute('data-i18n');
      sealHint.textContent = canvaSealHint[lang] || canvaSealHint.vi;
    } else {
      sealHint.dataset.i18n = quizSealHintKey;
      sealHint.textContent = T(quizSealHintKey);
    }
    kicker.textContent = T(isCanva ? 'table.kickerFor' : 'table.kickerAbout');
    script.textContent = isCanva ? T(canva.role(card) === 'visitor' ? 'table.forVisitor' : 'table.forLocal') : label.toLocaleLowerCase(lang);
    const art = window.GoiVietCardCovers && place ? window.GoiVietCardCovers.art(place, label) : null;
    peek.classList.toggle('is-plain', !art);
    peek.replaceChildren(art || plainCover(label, place));
    if (peek.dataset.cardId !== card.id) {
      front.removeAttribute('data-review-question');
      showFace(state.activeCardSide);
    }
    peek.dataset.cardId = card.id;
    const descriptions = canva?.coverDescriptions(card) || [];
    photoDescriptions.replaceChildren(...descriptions.map(description => {
      const item = document.createElement('li');
      item.textContent = description;
      return item;
    }));
    syncCoverLabels();
    queueFit();
  }

  window.GoiVietCardTable = { render, focusFace, focusExplanation, closeCover: () => setRaised(false, { restoreFocus: false }) };
})();
