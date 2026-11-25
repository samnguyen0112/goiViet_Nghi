const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const { chromium } = require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'verification/conversation-cards-5');
(async () => {
  await fs.mkdir(path.join(out, 'browser-temp'), { recursive: true });
  process.env.TEMP = process.env.TMP = path.join(out, 'browser-temp');
  const html = await fs.readFile(path.join(root, 'map-surroundings-preview-5.html'), 'utf8');
  for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) if (match[1].trim()) new vm.Script(match[1]);
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const errors = [], reports = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    page.on('pageerror', e => errors.push(e.message));
    async function loadMap() {
      await page.goto(pathToFileURL(path.join(root, 'map-surroundings-preview-5.html')).href, { waitUntil: 'load' });
      await page.waitForFunction(() => window.GoiVietConversationCards && window.GoiVietHomeIntro && window.GoiVietArrivalDemo);
      await page.evaluate(async () => {
        window.GoiVietHomeIntro.skip();
        closeIntroModal();
        await document.fonts.ready;
      });
    }
    await loadMap();
    const openStationDeck = id => page.locator('#deck-open-' + id).evaluate(button => button.click());
    async function arriveAt(id) {
      await page.evaluate(id => {
        state.reducedMotion = true;
        selectDemoPlace(id);
        GoiVietJourneyPreview.start(id);
      }, id);
      await page.waitForFunction(id => GoiVietArrivalDemo.isSheetOpen() &&
        document.getElementById('arrivalSheet').dataset.place === id, id);
    }
    await arriveAt('hn');
    await openStationDeck('hn');
    await page.locator('#deckModal.open').waitFor();
    const geometry = () => page.evaluate(async () => {
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const rect = id => { const r = document.getElementById(id).getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, right: r.right, bottom: r.bottom }; };
      const body = document.getElementById('deckScrollBody');
      return { front: rect('cardFrontState'), back: rect('cardBackState'), body: rect(body.id), overflow: body.scrollWidth > body.clientWidth + 1, verticalOverflow: body.scrollHeight - body.clientHeight };
    });
    const beforeHover = await page.locator('.fanned-card').first().evaluate(el => el.getBoundingClientRect().x);
    await page.locator('#fannedDeckBox').hover();
    await page.waitForTimeout(500);
    const afterHover = await page.locator('.fanned-card').first().evaluate(el => el.getBoundingClientRect().x);
    assert(afterHover < beforeHover - 30, 'Hover must expand the fan');
    await page.screenshot({ path: path.join(out, 'hover-expanded.png') });
    await page.mouse.move(0, 0);
    for (const [width, height] of [[1440, 900], [1366, 768], [1024, 768], [820, 1180], [390, 844], [320, 568]]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => {
        closeDeckModal(); state.activeCard = null; state.activeCardPlaceId = null;
        state.drawnCardIdsByPlace.hn = [];
      });
      await openStationDeck('hn');
      await page.waitForTimeout(80);
      assert.equal(await page.locator('#deckScrollBody').evaluate(el => el.scrollWidth > el.clientWidth + 1), false, `${width}: deck overflow`);
      await page.screenshot({ path: path.join(out, `deck-${width}.png`) });
      const chosen = await page.locator('.fanned-card').last().getAttribute('data-card-id');
      // Keyboard selection must draw the actual labelled card, even under overlap.
      await page.locator('.fanned-card').last().focus();
      await page.keyboard.press('Enter');
      assert.equal(await page.evaluate(() => state.activeCard.id), chosen);
      assert(await page.locator('#cardFrontState').isVisible());
      assert(await page.locator('#cardCoverPeek').isHidden(), 'The cover is hidden until explicitly opened');
      assert.equal(await page.locator('#conversationConnectionContent').evaluate(el => el.inert), true);
      let info = await geometry();
      assert(!info.overflow, `${width}: horizontal overflow`);
      assert(info.verticalOverflow <= 1, `${width}: the question needs scrolling`);
      if (width > 860) {
        assert(info.back.x > info.front.x + info.front.width, `${width}: faces not side by side`);
        assert(await page.locator('#conversationSeal').isVisible());
      } else {
        assert(await page.locator('#cardBackState').isHidden());
        await page.locator('.card-face-nav [aria-controls="cardBackState"]').click();
        assert(await page.locator('#conversationSeal').isVisible());
        assert(await page.locator('#cardFrontState').isHidden());
        await page.locator('.card-face-nav [aria-controls="cardFrontState"]').click();
      }
      await page.screenshot({ path: path.join(out, `sealed-${width}.png`) });
      await page.locator('#btnDontKnowReveal').click();
      await page.waitForTimeout(100);
      assert(await page.locator('#conversationSeal').isHidden());
      assert(await page.locator('#answerExplanationBox').isVisible());
      assert(await page.locator('#cardFrontState').isVisible());
      assert.equal(await page.locator('#conversationConnectionContent').evaluate(el => el.inert), false);
      await page.locator('#memoryDetailsDrawer').evaluate(el => el.open = false);
      assert((await geometry()).verticalOverflow <= 1, `${width}: the explanation needs scrolling`);
      await page.getByRole('button', { name: 'Xem lại câu hỏi' }).click();
      assert(await page.locator('#cardQuestionText').isVisible());
      await page.locator('#cardExplanationOpen').click();
      if (width <= 860) await page.locator('#btnFlipToBack').click();
      await page.locator('#memoryDetailsDrawer').evaluate(el => el.open = false);
      assert((await geometry()).verticalOverflow <= 1, `${width}: the connection needs scrolling`);
      const activityPrompt = page.locator('#cardBackState .activity-prompt-box');
      assert.equal(await page.locator('#btnCardQuestion').count(), 0, `${width}: the activity has a duplicate question action`);
      if (width <= 860) {
        await page.locator('button[aria-controls="cardFrontState"]').click();
        assert(await page.locator('#cardFrontState').isVisible());
        await page.locator('button[aria-controls="cardBackState"]').click();
        assert(await page.locator('#cardBackState').isVisible());
      } else {
        assert(await page.locator('#cardFrontState').isVisible());
      }
      const memoryToggle = page.locator('#memoryDetailsDrawer summary');
      if (width === 320) {
        const timer = page.locator('#btnListeningTimer');
        assert(Math.abs((await timer.boundingBox()).y - (await memoryToggle.boundingBox()).y) < 2);
        await timer.click();
        assert(await page.evaluate(() => Boolean(state.listeningTimerId)));
        assert.match(await page.locator('#listeningTimerDisplay').innerText(), /^(1:00|0:59)$/);
        await timer.click();
        assert.equal(await page.evaluate(() => state.listeningTimerId), null);
        assert(await page.locator('#listeningTimerDisplay').isHidden());
      }
      await memoryToggle.click();
      assert(await activityPrompt.isHidden(), `${width}: the memory form replaces the prompt`);
      assert((await geometry()).verticalOverflow <= 1, `${width}: the blank memory form needs scrolling`);
      await page.locator('#memoryPlaceInput').fill('Đà Lạt');
      await page.locator('#memoryNoteInput').fill('Chuyến đi cùng cả nhà');
      if (width <= 860) await page.locator('button[aria-controls="cardFrontState"]').click();
      await page.evaluate(() => closeDeckModal());
      await openStationDeck('hn');
      assert.equal(await page.locator('#memoryPlaceInput').inputValue(), 'Đà Lạt');
      assert.equal(await page.locator('#memoryNoteInput').inputValue(), 'Chuyến đi cùng cả nhà');
      assert(await page.locator('#conversationSeal').isHidden());
      info = await geometry();
      assert(!info.overflow, `${width}: open card overflow`);
      await page.evaluate(() => { document.getElementById('memoryDetailsDrawer').open = false; document.getElementById('deckScrollBody').scrollTop = 0; });
      await page.screenshot({ path: path.join(out, `opened-${width}.png`) });
      reports.push({ width, ...info });
    }
    // Real animation: all phases, rapid-click lock, and cancellation before consumption.
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.evaluate(() => {
      closeDeckModal(); state.activeCard = null; state.activeCardPlaceId = null;
      state.memoryDraftsByCard.clear();
      state.drawnCardIdsByPlace.hn = []; state.reducedMotion = false;
      document.body.classList.remove('reduced-motion');
    });
    await openStationDeck('hn');
    await page.clock.install({ time: new Date('2026-10-28T00:00:00Z') });
    await page.clock.pauseAt(new Date('2026-10-28T00:00:01Z'));
    await page.locator('#btnDrawCard').evaluate(el => el.click());
    assert(await page.locator('#fannedDeckBox').evaluate(el => el.classList.contains('phase-gather')));
    await page.evaluate(() => { for (let i = 0; i < 10; i++) triggerDrawCardWithAnim(); });
    await page.clock.runFor(400);
    assert(await page.locator('#fannedDeckBox').evaluate(el => el.classList.contains('phase-shuffle')));
    await page.screenshot({ path: path.join(out, 'shuffle.png') });
    await page.evaluate(() => closeDeckModal());
    await page.clock.runFor(3000);
    assert.equal(await page.evaluate(() => state.drawnCardIdsByPlace.hn.length), 0);
    assert.equal(await page.evaluate(() => state.isDrawingCardLock), false);
    await openStationDeck('hn');
    await page.locator('#btnDrawCard').evaluate(el => el.click());
    await page.clock.runFor(1600);
    assert.equal(await page.locator('.fanned-card.is-picked').count(), 1);
    const pickedId = await page.locator('.fanned-card.is-picked').getAttribute('data-card-id');
    await page.screenshot({ path: path.join(out, 'picked.png') });
    await page.clock.runFor(600);
    assert(await page.locator('#fannedDeckBox').evaluate(el => el.classList.contains('phase-draw')));
    await page.clock.runFor(800);
    assert.equal(await page.evaluate(() => state.activeCard.id), pickedId);
    assert.equal(await page.evaluate(() => state.drawnCardIdsByPlace.hn.length), 1);
    await page.clock.resume();
    // Exhaust the station through normal turn completion; no repeats, then replay.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => { state.reducedMotion = true; clearMemoryDraft(); });
    const ids = [pickedId];
    const count = await page.evaluate(() => CULTURAL_PLACE_MAP.hn.cards.length);
    for (let i = 1; i < count; i++) {
      await page.evaluate(() => { flipCardToBack(); completeCardTurn('skipped'); });
      if (i === 3) {
        assert.match(await page.locator('#cardProgressLabel').textContent(), /Tiến độ mốc\s*3\s*\/\s*3/);
        assert.match(await page.locator('#milestoneHeading').innerText(), /3 lá bài/);
        assert.deepEqual(await page.evaluate(() => GoiVietArrivalDemo.inspect().sealed), ['hn']);
      }
      await page.evaluate(() => closeMilestoneAndContinue());
      await page.waitForTimeout(200);
      await openStationDeck('hn');
      await page.evaluate(() => triggerDrawCardWithAnim());
      ids.push(await page.evaluate(() => state.activeCard.id));
    }
    assert.equal(new Set(ids).size, count);
    await page.evaluate(() => { flipCardToBack(); completeCardTurn('skipped'); closeMilestoneAndContinue(); });
    await page.waitForTimeout(200);
    await openStationDeck('hn');
    assert(await page.locator('#deckExhaustedBox').isVisible());
    assert.equal(await page.locator('.fanned-card:enabled').count(), 0);
    await page.locator('#btnReshuffleDeck').click();
    assert.equal(await page.evaluate(() => state.drawnCardIdsByPlace.hn.length), 1);
    assert(await page.locator('#conversationSeal').isVisible());
    await page.locator('.conversation-wax-seal').click();
    assert(await page.locator('#conversationSeal').isHidden());
    assert.equal(await page.evaluate(() => state.answerRevealed), false);
    await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; document.getElementById('deckScrollBody').scrollTop = 0; });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(out, 'dark.png') });
    await page.locator('#memoryDetailsDrawer').evaluate(el => el.open = true);
    assert(await page.locator('#memoryPlaceInput').evaluate(el => el.getBoundingClientRect().height < 70), 'Memory input must keep its normal height');
    await page.locator('#memoryNoteInput').fill('Một kỷ niệm chưa ghi tên');
    await page.locator('#btnSkipCardActivity').click();
    await page.locator('#deckModal.open').waitFor({state:'hidden'});
    await page.evaluate(() => closeMilestoneAndContinue());
    await openStationDeck('hn');
    await page.locator('#deckMemoryDraftsLabel').click();
    await page.locator('#deckMemoryDraftsList button').click();
    assert.equal(await page.locator('#memoryNoteInput').inputValue(), 'Một kỷ niệm chưa ghi tên');
    await page.locator('#btnSaveMemoryPlace').click();
    assert.equal(await page.evaluate(() => document.activeElement.id), 'memoryPlaceInput');
    await page.locator('#memoryPlaceInput').fill('Huế');
    await page.locator('#btnSaveMemoryPlace').click();
    assert.equal(await page.evaluate(() => state.mentionedPlaces.at(-1).author), '');
    assert.equal(await page.evaluate(() => state.mentionedPlaces.at(-1).note), 'Một kỷ niệm chưa ghi tên');
    assert(await page.locator('#memoryPlaceInput').isHidden());
    for (let number = 2; number <= 6; number++) {
      await page.locator('#btnRecordAnotherMemory').click();
      await page.locator('#memoryPlaceInput').fill('Huế');
      await page.locator('#memoryAuthorInput').fill('Người kể ' + number);
      await page.locator('#btnSaveMemoryPlace').click();
    }
    await page.keyboard.press('Escape');
    await page.locator('#mapScene .top-header .craft-btn-green').click();
    const memories = page.locator('#postcardMentionedContainer input');
    assert.equal(await memories.count(), 6);
    for (let index = 0; index < 5; index++) await memories.nth(index).check();
    assert(await memories.nth(5).isDisabled());
    assert.match(await page.locator('#postcardMemoryCount').textContent(), /5\/5.*Bỏ chọn/);
    await page.evaluate(() => {
      const ctx = document.getElementById('postcardExportCanvas').getContext('2d');
      const fillText = ctx.fillText.bind(ctx);
      window.paintText = [];
      ctx.fillText = (text, ...args) => { window.paintText.push(text); fillText(text, ...args); };
    });
    await memories.first().uncheck();
    await memories.nth(5).check();
    assert(await memories.first().isDisabled());
    assert(await page.evaluate(() => window.paintText.some(text => text.includes('Người kể 6'))));
    await page.keyboard.press('Escape');
    // Answer feedback and changing the destination while shuffling.
    await page.evaluate(() => { closeDeckModal(); state.activeCard = null; state.drawnCardIdsByPlace.hue = []; });
    await arriveAt('hue');
    await openStationDeck('hue');
    await page.evaluate(() => {
      triggerDrawCardWithAnim();
      selectCardOption((state.activeCard.correctIndex + 1) % state.activeCard.options.length);
      revealCardAnswer(false);
    });
    await page.waitForTimeout(100);
    assert.equal(await page.locator('.option-btn.wrong-reveal').count(), 1);
    assert.equal(await page.locator('.option-btn.correct-reveal').count(), 1);
    assert(await page.locator('#conversationSeal').isHidden());
    await page.evaluate(() => { closeDeckModal(); state.activeCard = null; state.drawnCardIdsByPlace.hn = []; });
    await arriveAt('hn');
    await openStationDeck('hn');
    await page.evaluate(() => { state.reducedMotion = false; });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.locator('#btnDrawCard').click();
    await page.evaluate(() => closeDeckModal());
    await arriveAt('hue');
    await openStationDeck('hue');
    await page.waitForTimeout(3000);
    assert.equal(await page.evaluate(() => state.drawnCardIdsByPlace.hn.length), 0);
    assert.equal(await page.evaluate(() => state.isDrawingCardLock), false);

    await page.emulateMedia({ reducedMotion: 'reduce' });
    const drawExact = async id => {
      await page.locator(`.fanned-card[data-card-id="${id}"]`).press('Enter');
      assert.equal(await page.evaluate(() => state.activeCard.id), id);
    };
    const leaveDeck = () => page.locator('#deckModal .deck-header button[onclick="closeDeckModal()"]').click();
    const peelSeal = () => page.locator('.conversation-wax-seal').click();
    const activity = page.locator('#activityMainText');
    for (const useOriginalActivity of [false, true]) {
      await loadMap();
      await arriveAt('th');
      await openStationDeck('th');
      await drawExact('th-c2');
      await page.locator('[data-canva-role="visitor"]').click();
      assert.match(await page.locator('#conversationSealHint').textContent(), /Trả lời câu hỏi/);
      await page.locator('#deckModal [data-set-lang="en"]').click();
      assert.match(await page.locator('#conversationSealHint').textContent(), /Answer the question/);
      await page.locator('#deckModal [data-set-lang="vi"]').click();
      await peelSeal();
      const expected = await page.evaluate(original => original
        ? state.activeCard.activities[0]
        : GoiVietCanvaCards.activityFor(state.activeCard, 'visitor').vi, useOriginalActivity);
      if (useOriginalActivity) await page.locator('button[onclick="swapCardActivity()"]').click();
      else assert.match(expected, /đặc sản quê bạn/);
      assert.equal(await activity.textContent(), expected);
      await leaveDeck();
      await arriveAt('hue');
      await openStationDeck('hue');
      // Use the opposite activity mode at Huế to catch either value leaking from the last card.
      await drawExact(useOriginalActivity ? 'hue-c1' : 'hue-c2');
      if (!useOriginalActivity) assert.match(await page.locator('#conversationSealHint').textContent(), /Chọn đáp án/);
      assert.equal(await page.evaluate(() => state.canvaActivityOn), useOriginalActivity);
      await leaveDeck();
      await arriveAt('th');
      await openStationDeck('th');
      assert(await page.locator('#conversationSeal').isHidden());
      assert.equal(await activity.textContent(), expected);
      await page.locator('#btnCompleteCardTurn').click();
      const stamp = await page.evaluate(() => state.completedStamps.at(-1));
      assert.equal(stamp.cardId, 'th-c2');
      assert.equal(stamp.canvaRole, useOriginalActivity ? undefined : 'visitor');
      assert.equal(stamp.activityIdx, useOriginalActivity ? 0 : null);
      assert.equal(stamp.activity, expected);
    }

    await arriveAt('hue');
    await openStationDeck('hue');
    const cover = page.locator('#cardCoverPeek');
    const coverOpener = page.locator('#cardCoverOpen');
    const descriptions = page.locator('#cardCoverDescriptions');
    for (const [width, height] of [[1366, 768], [1024, 768], [390, 844], [320, 568]]) {
      await page.setViewportSize({ width, height });
      await coverOpener.press('Enter');
      assert.equal(await cover.getAttribute('aria-pressed'), 'true');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'cardCoverPeek');
      assert.equal(await page.locator('#cardFrontState').evaluate(el => el.inert), true);
      assert(await descriptions.isVisible());
      assert.equal(await descriptions.locator('li').count(), 8);
      const fullyVisible = await cover.evaluate(el => {
        const box = el.getBoundingClientRect();
        return ['#deckScrollBody', '#drawnCardViewport'].every(selector => {
          const viewport = document.querySelector(selector).getBoundingClientRect();
          return box.top >= viewport.top && box.bottom <= viewport.bottom &&
            box.left >= viewport.left && box.right <= viewport.right;
        });
      });
      assert(fullyVisible, `${width}: the raised cover is clipped`);
      await page.screenshot({ path: path.join(out, `hue-cover-${width}-after.png`) });
      if (width === 390) await cover.click();
      else await page.keyboard.press('Escape');
      assert(await descriptions.isHidden());
      assert.equal(await page.locator('#cardFrontState').evaluate(el => el.inert), false);
      assert.equal(await page.evaluate(() => document.activeElement.id), 'cardCoverOpen');
    }
    await page.locator('#deckModal [data-set-lang="en"]').click();
    assert.equal(await coverOpener.textContent(), 'Show the card’s cover');
    await coverOpener.press('Enter');
    assert.match(await descriptions.locator('li').first().textContent(), /^Top left:/);
    await page.keyboard.press('Escape');
    await page.locator('[data-canva-role="visitor"]').click();
    await coverOpener.press('Enter');
    assert(await descriptions.isHidden());
    await page.keyboard.press('Escape');

    assert.deepEqual(errors, []);
    await fs.writeFile(path.join(out, 'checks.json'), JSON.stringify({ reports, errors, uniqueDraws: ids, checks: ['keyboard direct draw','dual faces','seal and answer reveal','memory preservation','responsive layout','four animation phases','rapid click lock','cancel without consuming','no repeated draws','exhaustion and replay','dark mode','Canva and original activities resume across stations and stamp the right text','raised cover fits four viewports and restores focus','bilingual Huế cover descriptions and seal hint'] }, null, 2));
    console.log(`PASS: conversation cards on preview-5, ${reports.length} viewport sizes, animation and complete play cycle. Screenshots: ${out}`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
