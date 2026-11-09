const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const { chromium } = require('C:/Users/Uy/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'verification/conversation-cards-3');
(async () => {
  await fs.mkdir(path.join(out, 'browser-temp'), { recursive: true });
  process.env.TEMP = process.env.TMP = path.join(out, 'browser-temp');
  const html = await fs.readFile(path.join(root, 'map-surroundings-preview-3.html'), 'utf8');
  for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) if (match[1].trim()) new vm.Script(match[1]);
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const errors = [], reports = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(pathToFileURL(path.join(root, 'map-surroundings-preview-3.html')).href, { waitUntil: 'load' });
    await page.waitForFunction(() => window.GoiVietConversationCards && window.GoiVietHomeIntro);
    await page.evaluate(async () => {
      window.GoiVietHomeIntro.skip();
      closeIntroModal();
      openDeckModal('hn');
      await document.fonts.ready;
    });
    const geometry = () => page.evaluate(() => {
      const rect = id => { const r = document.getElementById(id).getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, right: r.right, bottom: r.bottom }; };
      return { front: rect('cardFrontState'), back: rect('cardBackState'), body: rect('deckScrollBody'), overflow: document.getElementById('deckScrollBody').scrollWidth > document.getElementById('deckScrollBody').clientWidth + 1 };
    });
    const beforeHover = await page.locator('.fanned-card').first().evaluate(el => el.getBoundingClientRect().x);
    await page.mouse.move(240, 400);
    await page.waitForTimeout(500);
    const afterHover = await page.locator('.fanned-card').first().evaluate(el => el.getBoundingClientRect().x);
    assert(afterHover < beforeHover - 30, 'Hover must expand the fan');
    await page.screenshot({ path: path.join(out, 'hover-expanded.png') });
    await page.mouse.move(0, 0);
    for (const [width, height] of [[1440, 900], [1366, 768], [1024, 768], [820, 1180], [390, 844], [320, 568]]) {
      await page.setViewportSize({ width, height });
      await page.evaluate(() => {
        closeDeckModal(); state.activeCard = null; state.activeCardPlaceId = null;
        state.drawnCardIdsByPlace.hn = []; openDeckModal('hn');
      });
      await page.waitForTimeout(80);
      assert.equal(await page.locator('#deckScrollBody').evaluate(el => el.scrollWidth > el.clientWidth + 1), false, `${width}: deck overflow`);
      await page.screenshot({ path: path.join(out, `deck-${width}.png`) });
      const chosen = await page.locator('.fanned-card').last().getAttribute('data-card-id');
      // Keyboard selection must draw the actual labelled card, even under overlap.
      await page.locator('.fanned-card').last().focus();
      await page.keyboard.press('Enter');
      assert.equal(await page.evaluate(() => state.activeCard.id), chosen);
      assert(await page.locator('#cardFrontState').isVisible());
      assert(await page.locator('#cardBackState').isVisible());
      assert(await page.locator('#conversationSeal').isVisible());
      assert.equal(await page.locator('#conversationConnectionContent').evaluate(el => el.inert), true);
      let info = await geometry();
      assert(!info.overflow, `${width}: horizontal overflow`);
      if (width > 860) assert(info.back.x > info.front.x + info.front.width, `${width}: faces not side by side`);
      else assert(info.back.y >= info.front.bottom, `${width}: mobile faces overlap`);
      await page.screenshot({ path: path.join(out, `sealed-${width}.png`) });
      await page.locator('#btnDontKnowReveal').click();
      await page.waitForTimeout(100);
      assert(await page.locator('#conversationSeal').isHidden());
      assert(await page.locator('#answerExplanationBox').isVisible());
      assert(await page.locator('#cardFrontState').isVisible());
      assert.equal(await page.locator('#conversationConnectionContent').evaluate(el => el.inert), false);
      await page.locator('#memoryDetailsDrawer').evaluate(el => el.open = true);
      await page.locator('#memoryPlaceInput').fill('Đà Lạt');
      await page.locator('#memoryNoteInput').fill('Chuyến đi cùng cả nhà');
      await page.evaluate(() => { flipCardToFront(); closeDeckModal(); openDeckModal('hn'); });
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
      state.drawnCardIdsByPlace.hn = []; state.reducedMotion = false;
      document.body.classList.remove('reduced-motion'); openDeckModal('hn');
    });
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
    await page.evaluate(() => openDeckModal('hn'));
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
      await page.evaluate(() => { flipCardToBack(); completeCardTurn('skipped'); closeMilestoneAndContinue(); });
      await page.waitForTimeout(200);
      await page.evaluate(() => { openDeckModal('hn'); triggerDrawCardWithAnim(); });
      ids.push(await page.evaluate(() => state.activeCard.id));
    }
    assert.equal(new Set(ids).size, count);
    await page.evaluate(() => { flipCardToBack(); completeCardTurn('skipped'); closeMilestoneAndContinue(); });
    await page.waitForTimeout(200);
    await page.evaluate(() => openDeckModal('hn'));
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
    // Answer feedback and changing the destination while shuffling.
    await page.evaluate(() => {
      closeDeckModal(); state.activeCard = null; state.drawnCardIdsByPlace.hue = [];
      openDeckModal('hue'); triggerDrawCardWithAnim();
      selectCardOption((state.activeCard.correctIndex + 1) % state.activeCard.options.length);
      revealCardAnswer(false);
    });
    await page.waitForTimeout(100);
    assert.equal(await page.locator('.option-btn.wrong-reveal').count(), 1);
    assert.equal(await page.locator('.option-btn.correct-reveal').count(), 1);
    assert(await page.locator('#conversationSeal').isHidden());
    await page.evaluate(() => {
      closeDeckModal(); state.activeCard = null; state.drawnCardIdsByPlace.hn = [];
      state.reducedMotion = false; openDeckModal('hn');
    });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.locator('#btnDrawCard').click();
    await page.evaluate(() => openDeckModal('hue'));
    await page.waitForTimeout(3000);
    assert.equal(await page.evaluate(() => state.drawnCardIdsByPlace.hn.length), 0);
    assert.equal(await page.evaluate(() => state.isDrawingCardLock), false);
    assert.deepEqual(errors, []);
    await fs.writeFile(path.join(out, 'checks.json'), JSON.stringify({ reports, errors, uniqueDraws: ids, checks: ['keyboard direct draw','dual faces','seal and answer reveal','memory preservation','responsive layout','four animation phases','rapid click lock','cancel without consuming','no repeated draws','exhaustion and replay','dark mode'] }, null, 2));
    console.log(`PASS: conversation cards on preview-3, ${reports.length} viewport sizes, animation and complete play cycle. Screenshots: ${out}`);
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
