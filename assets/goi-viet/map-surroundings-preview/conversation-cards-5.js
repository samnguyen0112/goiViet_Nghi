/* Preview-5 copy of conversation-cards-3.js (adaptation of the official card-testing.html design reference). Identical apart from this line. */
(() => {
  'use strict';
  const byId = id => document.getElementById(id);
  const deck = byId('fannedDeckBox');
  const modal = byId('deckModal');
  if (!deck || !modal) return;
  const timers = new Set();
  let generation = 0;
  let openedConnection = null;
  const reduced = () => state.reducedMotion || document.body.classList.contains('reduced-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const currentPlace = () => CULTURAL_PLACE_MAP[state.selectedPlaceId] || CULTURAL_PLACES[0];
  const remaining = place => place.cards.filter(card => !(state.drawnCardIdsByPlace[place.id] || []).includes(card.id));
  const later = (fn, delay) => {
    const token = generation;
    const timer = setTimeout(() => {
      timers.delete(timer);
      if (token === generation && modal.classList.contains('open')) fn();
    }, delay);
    timers.add(timer);
  };
  const topicEmblem = topic => /ẩm thực|món ăn/i.test(topic) ? '🍲' : /lễ hội|truyền thống/i.test(topic) ? '🌾' : /địa|kiến trúc|di sản/i.test(topic) ? '🏛️' : '🪷';
  const label = (className, text) => {
    const el = document.createElement('span');
    el.className = className;
    el.textContent = text;
    return el;
  };

  function renderDeck(place = currentPlace(), order = remaining(place)) {
    if (state.isDrawingCardLock) return;
    deck.replaceChildren();
    const visible = order.slice(0, 4);
    // Empty decks retain their silhouette while the explicit replay choice is shown.
    const cards = visible.length ? visible : place.cards.slice(0, 4);
    cards.forEach((card, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'fanned-card';
      button.dataset.cardId = card.id;
      const offset = index - (cards.length - 1) / 2;
      button.style.setProperty('--fan-x', `${offset * 50}px`);
      button.style.setProperty('--fan-expanded-x', `${offset * 100}px`);
      button.style.setProperty('--fan-y', `${Math.abs(offset) * 8}px`);
      button.style.setProperty('--fan-angle', `${offset * 9.3}deg`);
      button.style.setProperty('--fan-expanded-angle', `${offset * 12}deg`);
      button.style.setProperty('--fan-order', index + 1);
      button.disabled = !visible.length;
      button.setAttribute('aria-label', `Rút lá ${card.topic} • ${place.short || place.name}`);
      button.append(label('conversation-card-badge', card.topic));
      const core = document.createElement('span');
      core.className = 'conversation-card-core';
      const emblem = label('conversation-card-emblem', topicEmblem(card.topic));
      emblem.setAttribute('aria-hidden', 'true');
      core.append(emblem, label('conversation-card-title', 'KÝ ỨC QUÊ HƯƠNG'), label('conversation-card-sub', place.short || place.name));
      button.append(core, label('conversation-card-footer', visible.length ? 'Bấm để rút lá' : 'Đã rút hết bài'));
      button.addEventListener('click', () => draw(button));
      deck.append(button);
    });
  }

  function cancelDraw() {
    generation++;
    timers.forEach(clearTimeout);
    timers.clear();
    state.isDrawingCardLock = false;
    deck.classList.remove('is-shuffling', 'phase-gather', 'phase-shuffle', 'phase-pick', 'phase-draw');
    deck.removeAttribute('aria-busy');
    deck.querySelectorAll('.fanned-card').forEach(card => card.classList.remove('is-picked'));
    byId('btnDrawCard').disabled = false;
    byId('btnDrawCard').firstElementChild.textContent = '🎲 Xáo & Rút ngẫu nhiên một lá bài';
    byId('conversationShuffleStatus').textContent = '';
    renderDeck();
  }

  function draw(clickedCard) {
    if (state.isDrawingCardLock || state.activeCard || !modal.classList.contains('open')) return;
    const place = currentPlace();
    const pool = remaining(place);
    if (!pool.length) { updateDeckRemainingUI(place); return; }
    const direct = clickedCard && pool.find(card => card.id === clickedCard.dataset.cardId);
    // Fisher–Yates changes the actual order, independently of stories already read.
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const chosen = direct || shuffled[0];
    if (!direct) renderDeck(place, shuffled);
    const target = [...deck.children].find(card => card.dataset.cardId === chosen.id);
    state.isDrawingCardLock = true;
    deck.setAttribute('aria-busy', 'true');
    byId('btnDrawCard').disabled = true;
    const status = text => { byId('conversationShuffleStatus').textContent = text; };
    const commit = () => {
      if (state.selectedPlaceId !== place.id) { cancelDraw(); return; }
      // Consume only on completion, so closing during a shuffle never loses a card.
      drawOneCard(chosen.id);
      cancelDraw();
      updateDeckRemainingUI(place);
      byId('deckScrollBody').scrollTop = 0;
      focusFace('front');
    };
    if (reduced()) { commit(); return; }
    deck.classList.add('is-shuffling');
    if (direct) {
      target?.classList.add('is-picked');
      deck.classList.add('phase-pick');
      status(`Đã chọn lá ${chosen.topic}. Đang mở câu chuyện…`);
      later(() => deck.classList.add('phase-draw'), 240);
      later(commit, 850);
      return;
    }
    byId('btnDrawCard').firstElementChild.textContent = '✨ Đang xáo bài…';
    status(`Đang gom và xáo ${pool.length} lá bài…`);
    deck.classList.add('phase-gather');
    FolkAudio.playBambooClack();
    later(() => {
      deck.classList.remove('phase-gather');
      deck.classList.add('phase-shuffle');
      status('Đang xáo bài — câu chuyện nào sẽ được mở?');
    }, 340);
    later(() => {
      deck.classList.remove('phase-shuffle');
      deck.classList.add('phase-pick');
      target?.classList.add('is-picked');
      status(`Đã chọn lá ${chosen.topic}!`);
      FolkAudio.playPentatonicChime();
    }, 1500);
    later(() => {
      deck.classList.add('phase-draw');
      status('Đang rút lá bài dành cho cả nhà…');
    }, 2100);
    later(commit, 2850);
  }

  function prepareConnection() {
    openedConnection = null;
    const card = state.activeCard;
    if (!card) return;
    byId('cardBackTurnTag').textContent = `Lượt của ${getCurrentPlayerName()}`;
    byId('activityCategoryTag').textContent = card.activityCategories?.[state.activeActivityIdx] || card.activityCategory || 'Hoạt động gắn kết';
    byId('activityMainText').textContent = card.activities[state.activeActivityIdx] || card.activities[0];
    restoreMemoryInputsFromDraft();
  }

  function syncFaces() {
    if (!state.activeCard) return;
    if (state.activeCardSide === 'back' || state.answerRevealed) openedConnection = state.activeCard.id;
    const unlocked = openedConnection === state.activeCard.id;
    const flipper = byId('card3DFlipper');
    flipper.classList.remove('is-flipped', 'flipped');
    flipper.classList.toggle('connection-open', unlocked);
    byId('cardFrontState').style.display = 'block';
    byId('cardBackState').style.display = 'block';
    byId('conversationSeal').hidden = unlocked;
    byId('conversationConnectionContent').inert = !unlocked;
    byId('conversationConnectionContent').setAttribute('aria-hidden', String(!unlocked));
    byId('answerExplanationBox').classList.toggle('visible', state.answerRevealed);
  }

  function focusFace(side) {
    const el = side === 'back' ? modal.querySelector('.activity-prompt-box') : byId('cardQuestionText');
    el.tabIndex = -1;
    el.focus({ preventScroll: true });
    if (matchMedia('(max-width: 860px)').matches) el.scrollIntoView({ behavior: reduced() ? 'instant' : 'smooth', block: 'start' });
  }

  // Both faces remain visible, with the answer explanation next to its question.
  byId('cardFrontState').append(byId('answerExplanationBox'));
  byId('btnFlipToBack').firstElementChild.textContent = 'Xem hoạt động gắn kết →';
  window.GoiVietConversationCards = { renderDeck, draw, cancelDraw, prepareConnection, syncFaces, focusFace };
})();
