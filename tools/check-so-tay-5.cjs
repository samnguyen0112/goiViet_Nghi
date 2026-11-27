// P5-07: checks the passenger handbook (Sổ tay hành khách) of map-surroundings-preview-5.html in real Chrome.
//   node tools/check-so-tay-5.cjs            serves the project from a local port of its own (read-only)
// Report: verification/so-tay-5/checks.json (+ screenshots). Exit code 1 when a check fails.
// Covers: opening from the end of the memory chapter, the five stops with the page's real data, the list of things to
// do with its gold ring on the next control, the map drawn from DATA and the map's own regional geography, rivers and
// landmark art, text sizes for a projector (no text under 14 px on 1366 × 768), keyboard (← → Esc, Tab stays inside), the map kept preparing underneath, nothing written to the journey or storage,
// "Lên tàu" / "Vào thẳng bản đồ" / the chapter shortcut into the map, VI ↔ EN, dark theme, reduced motion and
// three window sizes (1366 × 768, 1920 × 1080, 390 × 844) without horizontal overflow.
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const { launch } = require('./perf/lib.cjs');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'verification/so-tay-5');
const PAGE = 'map-surroundings-preview-5.html';
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff': 'font/woff', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.ico': 'image/x-icon' };
const report = { started: new Date().toISOString(), checks: [], errors: [], failed: [] };
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function serve() {
  const server = http.createServer((req, res) => {
    const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (!file.startsWith(ROOT)) { res.writeHead(403); res.end(); return; }
    fs.readFile(file, (error, body) => {
      if (error) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(body);
    });
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

async function check(name, fn) {
  const started = Date.now();
  try {
    const detail = await fn();
    report.checks.push({ name, ok: true, ms: Date.now() - started, detail: detail === undefined ? null : detail });
    console.log('✓ ' + name);
  } catch (error) {
    report.checks.push({ name, ok: false, ms: Date.now() - started, error: String(error && error.stack || error).slice(0, 1600) });
    report.failed.push(name);
    console.log('✗ ' + name + '\n  ' + String(error && error.message || error).split('\n')[0]);
  }
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const server = await serve();
  const BASE = `http://127.0.0.1:${server.address().port}/`;
  const browser = await launch('real');
  const pages = [];
  async function open({ width = 1366, height = 768, lang = 'vi', reduced = false, theme = 'light', tag }) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
    const page = await context.newPage();
    page.setDefaultTimeout(20000);
    page.on('pageerror', error => report.errors.push({ tag, type: 'pageerror', message: error.message }));
    page.on('console', message => { if (message.type() === 'error') report.errors.push({ tag, type: 'console', message: message.text().slice(0, 300) }); });
    page.on('response', response => { if (response.status() >= 400) report.errors.push({ tag, type: 'http', status: response.status(), url: response.url() }); });
    // Local only: the page must not need the network.
    await page.route(/^https?:/, route => (route.request().url().startsWith(BASE) ? route.continue() : route.abort('blockedbyclient')));
    await page.goto(BASE + PAGE + '?lang=' + lang, { waitUntil: 'domcontentloaded', timeout: 180000 });
    await page.waitForFunction(() => window.GoiVietHomeIntro && window.GoiVietMemoryChapter && window.GoiVietSoTay && typeof closeIntroModal === 'function', null, { timeout: 180000 });
    if (theme === 'dark') await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await page.evaluate(() => window.GoiVietHomeIntro.skip());
    await page.click('#btnHomeExploreMemory');
    await page.locator('#memoryOpenGuide').scrollIntoViewIfNeeded();
    pages.push(context);
    return page;
  }
  const sotay = page => page.evaluate(() => window.GoiVietSoTay.inspect());
  const journey = page => page.evaluate(() => JSON.stringify({
    drawn: state.drawnCardIdsByPlace, explored: state.exploredPlaceIds, stamps: state.completedStamps.length,
    total: state.totalCardsCompleted, mentioned: state.mentionedPlaces, drafts: state.memoryDraftsByCard.size,
    activity: state.activityCompletedPlaceIds, story: state.storyOpenedPlaceIds, used: state.usedActivityTexts,
    deck: state.deckPlaceId, active: state.activeCard && state.activeCard.id,
    local: Object.keys(localStorage).sort(), session: Object.keys(sessionStorage).sort()
  }));
  // Every visible box of the sheet stays inside the window horizontally.
  const overflow = page => page.evaluate(() => {
    const dialog = document.getElementById('soTayDialog');
    const width = document.documentElement.clientWidth;
    const out = [];
    for (const el of dialog.querySelectorAll('.st-sheet *')) {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height || getComputedStyle(el).visibility === 'hidden') continue;
      // The map clips its own pins, labels and art; the fan and the rail engine move on purpose.
      if (el.closest('.st-fan, .st-backdrop, .st-rail-train, .st-map-wrap')) continue;
      if (r.left < -1 || r.right > width + 1) out.push(`${el.className || el.tagName} ${Math.round(r.left)}..${Math.round(r.right)}`);
    }
    // The column of things to do and the station board scroll only as a last resort: on a desktop window they fit.
    const clipped = [...dialog.querySelectorAll('.st-step:not([hidden]) .st-copy, .st-board:not([hidden])')]
      .filter(el => el.scrollHeight > el.clientHeight + 2).map(el => el.className.split(' ')[0] + ' ' + el.scrollHeight + '>' + el.clientHeight);
    return { width, scroll: dialog.scrollWidth, client: dialog.clientWidth, out: out.slice(0, 8), clipped };
  });
  // Text sizes on the sheet (the drawing's own labels and the card cover artwork aside).
  const textSizes = page => page.evaluate(() => {
    const dialog = document.getElementById('soTayDialog');
    const sizes = [];
    const walker = document.createTreeWalker(dialog.querySelector('.st-sheet'), NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const el = node.parentElement;
      if (!node.nodeValue.trim() || !el || el.closest('svg, .st-sr, .gv-cover, [hidden]')) continue;
      const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
      if (!r.width || !r.height || cs.visibility === 'hidden' || cs.display === 'none') continue;
      sizes.push([Math.round(parseFloat(cs.fontSize) * 10) / 10, (el.className || el.tagName) + ': ' + node.nodeValue.trim().slice(0, 24)]);
    }
    sizes.sort((a, b) => a[0] - b[0]);
    const size = sel => { const el = dialog.querySelector(sel); return el ? Math.round(parseFloat(getComputedStyle(el).fontSize) * 10) / 10 : null; };
    return { base: size('.st-sheet'), smallest: sizes.slice(0, 3), title: size('.st-step:not([hidden]) .st-step-title'), lead: size('.st-step:not([hidden]) .st-step-lead') };
  });
  const tasks = page => page.evaluate(() => window.GoiVietSoTay.inspect().tasks);
  // Measures wait until the stop has finished sliding in (a busy page can hold the first frames of that animation).
  const settled = page => page.waitForFunction(() => {
    const step = document.querySelector('#soTayDialog .st-step:not([hidden])');
    return Boolean(step) && [step.querySelector('.st-copy'), step.querySelector('.st-stage')].every(el => !el || el.getAnimations().every(a => a.playState !== 'running'));
  }, null, { timeout: 5000 });
  const ringed = (page, sel) => page.evaluate(s => [...document.querySelectorAll(s)].every(el => el.classList.contains('st-target')), sel);

  try {
    // ------------------------------------------------------------ main walk, 1366 × 768, Vietnamese
    const page = await open({ tag: '1366-vi' });
    const before = await journey(page);

    await check('Cuối chương: nút sổ tay và liên kết vào thẳng bản đồ', async () => {
      const info = await page.evaluate(() => ({
        guide: document.querySelector('#memoryOpenGuide .mc-ticket-title').textContent,
        guideLabel: document.getElementById('memoryOpenGuide').getAttribute('aria-label'),
        popup: document.getElementById('memoryOpenGuide').getAttribute('aria-haspopup'),
        map: document.getElementById('memoryOpenMap').textContent.replace(/\s+/g, ' ').trim(),
        dialogHidden: document.getElementById('soTayDialog').hidden
      }));
      assert.equal(info.guide, 'Xem sổ tay hành khách');
      assert.ok(info.guideLabel.startsWith(info.guide), 'accessible name starts with the visible label');
      assert.equal(info.popup, 'dialog');
      assert.match(info.map, /^Vào thẳng bản đồ\s*→$/);
      assert.equal(info.dialogHidden, true);
      return info;
    });

    await check('Mở sổ tay: hộp thoại, focus, trang dưới bị khóa nhưng vẫn mở', async () => {
      await page.click('#memoryOpenGuide');
      await page.waitForFunction(() => document.getElementById('soTayDialog').classList.contains('is-open'));
      await wait(500);
      const info = await page.evaluate(() => ({
        hidden: document.getElementById('soTayDialog').hidden,
        modal: document.getElementById('soTayDialog').getAttribute('aria-modal'),
        focus: document.activeElement.id,
        introInert: document.getElementById('introScreen').inert,
        introOpen: !document.getElementById('introScreen').classList.contains('intro-hidden'),
        covering: document.body.classList.contains('st-covering'),
        mapInert: document.getElementById('mapScene').inert,
        prewarm: window.GoiVietMapPrewarm3 ? window.GoiVietMapPrewarm3.inspect() : null
      }));
      assert.equal(info.hidden, false);
      assert.equal(info.modal, 'true');
      assert.equal(info.focus, 'soTayS1Title');
      assert.equal(info.introInert, true);
      assert.equal(info.introOpen, true, 'home screen stays open under the sheet');
      assert.equal(info.covering, true);
      assert.equal(info.mapInert, true);
      if (info.prewarm) assert.equal(info.prewarm.preparing || info.prewarm.preparedMs != null, true, 'map keeps being prepared');
      await page.screenshot({ path: path.join(OUT, '1366-01-open.png') });
      return info;
    });

    await check('Tab không ra khỏi sổ tay', async () => {
      const seen = new Set();
      for (let i = 0; i < 40; i++) {
        await page.keyboard.press('Tab');
        seen.add(await page.evaluate(() => Boolean(document.activeElement && document.activeElement.closest('#soTayDialog'))));
      }
      assert.deepEqual([...seen], [true]);
    });

    await check('Ga 1: bản đồ từ dữ liệu trang (34 tỉnh, Hoàng Sa, Trường Sa), địa lý vùng, sông, danh thắng và 3 ga mẫu', async () => {
      await page.waitForFunction(() => window.GoiVietSoTay.inspect().geography && window.GoiVietSoTay.inspect().rivers, null, { timeout: 30000 });
      const info = await page.evaluate(() => ({
        neighbors: document.querySelector('#soTayDialog .st-neighbor').getAttribute('d').length,
        borders: document.querySelector('#soTayDialog .st-border').getAttribute('d').length,
        outline: Boolean(document.querySelector('#soTayDialog .st-outline')),
        rivers: document.querySelectorAll('#soTayDialog .st-river').length,
        lakes: Boolean(document.querySelector('#soTayDialog .st-lake')),
        countries: [...document.querySelectorAll('#soTayDialog .st-country')].map(t => t.textContent),
        art: [...document.querySelectorAll('#soTayDialog .st-art')].map(i => i.dataset.art),
        rose: document.querySelector('#soTayDialog .st-rose-letter').textContent,
        tasks: window.GoiVietSoTay.inspect().tasks,
        pinsRinged: [...document.querySelectorAll('#soTayDialog .st-pin')].every(p => p.classList.contains('st-target')),
        viewBox: document.querySelector('#soTayDialog .st-map').getAttribute('viewBox'),
        provinces: document.querySelectorAll('#soTayDialog .st-prov').length,
        data: DATA.provinces34.length,
        archipelagos: document.querySelectorAll('#soTayDialog .st-archipelago').length,
        islands: document.querySelectorAll('#soTayDialog .st-isle').length,
        labels: [...document.querySelectorAll('#soTayDialog .st-isle-label')].map(t => t.textContent),
        pins: [...document.querySelectorAll('#soTayDialog .st-pin')].map(p => p.dataset.station + ':' + p.textContent.trim()),
        rail: Boolean(document.querySelector('#soTayDialog .st-rail-line'))
      }));
      assert.equal(info.provinces, info.data);
      assert.equal(info.provinces, 34);
      assert.equal(info.archipelagos, 2);
      assert.ok(info.islands >= 10, 'islands drawn');
      assert.deepEqual(info.labels, ['Quần đảoHoàng Sa', 'Quần đảoTrường Sa']);
      assert.deepEqual(info.pins, ['hn:Ga Hà Nội', 'hue:Ga Huế', 'hcm:Ga TP.HCM']);
      assert.ok(info.rail);
      assert.ok(info.neighbors > 5000 && info.borders > 500 && info.outline, 'regional geography drawn');
      assert.ok(info.rivers >= 2 && info.lakes, 'rivers and lakes drawn');
      assert.deepEqual(info.countries, ['LÀO', 'CAMPUCHIA', 'THÁI LAN']);
      assert.deepEqual(info.art, ['hn', 'hue', 'hcm', 'sailboat']);
      assert.equal(info.rose, 'B');
      assert.deepEqual(info.tasks, ['pick:now', 'explore:todo', 'cards:todo']);
      assert.equal(info.pinsRinged, true, 'the three stations are ringed first');
      delete info.neighbors; delete info.borders;
      return info;
    });

    await check('Ga 1: chọn Hà Nội, Khám phá, tàu tới và bảng ga đúng dữ liệu', async () => {
      await page.click('.st-pin[data-station="hn"]');
      assert.equal(await page.locator('.st-here-place').textContent(), 'Hà Nội');
      assert.equal(await page.locator('.st-here-kicker').textContent(), 'Điểm đến đã chọn');
      assert.deepEqual(await tasks(page), ['pick:done', 'explore:now', 'cards:todo']);
      assert.equal(await ringed(page, '[data-st-explore]'), true);
      await page.click('[data-st-explore]');
      await page.waitForFunction(() => !document.querySelector('#soTayDialog .st-board').hidden, null, { timeout: 8000 });
      const info = await page.evaluate(() => ({
        name: document.querySelector('.st-board-name').textContent,
        region: document.querySelector('.st-board-region').textContent,
        summary: document.querySelector('.st-board-summary').textContent,
        facts: [...document.querySelectorAll('[data-st-fact]')].map(d => d.textContent),
        expected: [ALL_DECKS_MAP.hn.region, ALL_DECKS_MAP.hn.summary, ALL_DECKS_MAP.hn.highlights.landmark, ALL_DECKS_MAP.hn.highlights.heritage, ALL_DECKS_MAP.hn.highlights.cuisine],
        railDone: document.querySelector('.st-stop[data-st-goto="0"]').classList.contains('is-done'),
        railState: document.querySelector('.st-stop[data-st-goto="0"] .st-stop-state').textContent,
        tasks: window.GoiVietSoTay.inspect().tasks,
        cardsRinged: document.querySelector('.st-mode-cards').classList.contains('st-target')
      }));
      assert.equal(info.name, 'Hà Nội');
      assert.deepEqual([info.region, info.summary, ...info.facts], info.expected);
      assert.equal(info.railDone, true);
      assert.equal(info.railState, ', đã thử');
      assert.deepEqual(info.tasks, ['pick:done', 'explore:done', 'cards:now']);
      assert.equal(info.cardsRinged, true);
      assert.deepEqual((await sotay(page)).tried, [true, false, false, false]);
      await page.screenshot({ path: path.join(OUT, '1366-02-board.png') });
      return info;
    });

    await check('Ga 1: Rút vé gợi ý một ga khác, Đọc sách mở ghi chú không ép sập tóm tắt và không cuộn bảng ga', async () => {
      await page.click('[data-st-ticket]');
      await page.waitForFunction(() => window.GoiVietSoTay.inspect().picked !== 'hn', null, { timeout: 3000 });
      const kicker = await page.locator('.st-here-kicker').textContent();
      assert.equal(kicker, 'Quẻ vé gợi ý');
      await page.click('.st-pin[data-station="hn"]');
      await page.click('[data-st-book]');
      assert.equal(await page.locator('#soTayBookNote').isVisible(), true);
      assert.equal(await page.getAttribute('[data-st-book]', 'aria-expanded'), 'true');
      const boardState = await page.evaluate(() => {
        const board = document.querySelector('#soTayDialog .st-board');
        const summary = board.querySelector('.st-board-summary').getBoundingClientRect();
        const note = document.getElementById('soTayBookNote').getBoundingClientRect();
        return { summaryH: Math.round(summary.height), noteH: Math.round(note.height), scrollH: board.scrollHeight, clientH: board.clientHeight };
      });
      assert.ok(boardState.summaryH >= 32, 'summary must not collapse: ' + JSON.stringify(boardState));
      assert.ok(boardState.scrollH <= boardState.clientH + 2, 'board must not scroll at 1366: ' + JSON.stringify(boardState));
      await page.screenshot({ path: path.join(OUT, '1366-02b-booknote.png') });
      return { kicker, boardState };
    });

    await check('Ga 2: bốn lá thật của ga với bìa Canva; xáo và rút', async () => {
      await page.click('.st-mode-cards');
      await page.waitForFunction(() => window.GoiVietSoTay.inspect().step === 1);
      const fan = await page.evaluate(() => ({
        cards: [...document.querySelectorAll('.st-fan-card')].map(c => c.getAttribute('aria-label')),
        covers: document.querySelectorAll('.st-fan-card .gv-cover').length,
        topics: ALL_DECKS_MAP.hn.cards.map(c => c.topic)
      }));
      assert.deepEqual(fan.cards, fan.topics.map(t => 'Lá ' + t));
      assert.equal(fan.covers, 4);
      assert.deepEqual(await tasks(page), ['draw:now', 'answer:todo', 'check:todo']);
      assert.equal(await ringed(page, '[data-st-shuffle]'), true);
      await page.click('[data-st-shuffle]');
      await page.waitForFunction(() => window.GoiVietSoTay.inspect().cardDrawn, null, { timeout: 5000 });
      const drawn = await page.evaluate(() => {
        const s = window.GoiVietSoTay.inspect();
        const card = ALL_DECKS_MAP.hn.cards.find(c => c.id === s.card);
        const open = window.GoiVietCanvaCards && window.GoiVietCanvaCards.has(card);
        return { id: s.card, open, shown: document.querySelector('.st-question').textContent, question: open ? window.GoiVietCanvaCards.question(card) : card.question, options: document.querySelectorAll('.st-option').length };
      });
      assert.ok(drawn.id.startsWith('hn-c'));
      assert.equal(drawn.shown, drawn.question);
      assert.equal(drawn.options, drawn.open ? 0 : 3);
      assert.equal((await sotay(page)).tried[1], true);
      return { fan, drawn };
    });

    await check('Ga 2: câu hỏi Món ăn, báo khi chưa chọn, đáp án sai và lời giải thích thật', async () => {
      await page.click('[data-st-again]');
      await page.click('.st-fan-card >> nth=0');
      await page.waitForFunction(() => window.GoiVietSoTay.inspect().card === 'hn-c1' && window.GoiVietSoTay.inspect().cardDrawn, null, { timeout: 5000 });
      await page.click('[data-st-check]');
      assert.equal(await page.locator('.st-front-error').textContent(), 'Chọn một đáp án trước đã.');
      await page.click('.st-option >> nth=1');
      // Arrow keys inside the answers move the answer, not the stop.
      await page.keyboard.press('ArrowDown');
      assert.equal((await sotay(page)).step, 1);
      assert.equal((await sotay(page)).answer, 2);
      await page.keyboard.press('ArrowUp');
      await page.click('[data-st-check]');
      const info = await page.evaluate(() => ({
        head: document.querySelector('.st-result-head').textContent,
        text: document.querySelector('.st-result-text').textContent,
        explanation: ALL_DECKS_MAP.hn.cards[0].explanation,
        correct: [...document.querySelectorAll('.st-option')].findIndex(o => o.classList.contains('is-correct')),
        wrong: [...document.querySelectorAll('.st-option')].findIndex(o => o.classList.contains('is-wrong')),
        expectedHead: GoiVietI18n.t('js.deck.wrong')
      }));
      assert.equal(info.head, info.expectedHead);
      assert.equal(info.text, info.explanation);
      assert.equal(info.correct, 0);
      assert.equal(info.wrong, 1);
      assert.deepEqual(await tasks(page), ['draw:done', 'answer:done', 'check:done']);
      assert.equal(await ringed(page, '.st-front [data-st-goto="2"]'), true, 'the ring moves to the way to the seal');
      await page.screenshot({ path: path.join(OUT, '1366-03-card.png') });
      return info;
    });

    await check('Ga 3: dấu Hoa Sen mở hoạt động thật, nút Ghi kỷ niệm, không đè dấu kỷ niệm, đổi hoạt động, hẹn giờ', async () => {
      await page.click('.st-front [data-st-goto="2"]');
      assert.equal(await page.locator('.st-wax').isVisible(), true);
      assert.deepEqual(await tasks(page), ['seal:now', 'finish:todo']);
      assert.equal(await ringed(page, '.st-wax'), true);
      await page.click('[data-st-unseal]');
      await page.waitForFunction(() => window.GoiVietSoTay.inspect().unsealed, null, { timeout: 3000 });
      const first = await page.evaluate(() => {
        const post = document.querySelector('.st-postmark').getBoundingClientRect();
        const top = document.querySelector('.st-activity-top').getBoundingClientRect();
        const badge = document.querySelector('.st-face-badge-back').getBoundingClientRect();
        const kind = document.querySelector('.st-activity-kind').getBoundingClientRect();
        const overlap = (a, b) => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
        return {
          kind: document.querySelector('.st-activity-kind').textContent,
          text: document.querySelector('.st-activity-text').textContent,
          raw: ALL_DECKS_MAP.hn.cards[0].activities,
          recordBtn: document.querySelector('.st-record-btn')?.innerText.trim(),
          postOverlapBadge: overlap(post, badge),
          postOverlapKind: overlap(post, kind),
          topRight: Math.round(top.right)
        };
      });
      assert.equal(`【${first.kind}】 ${first.text}`, first.raw[0]);
      assert.ok(first.recordBtn.includes('Ghi kỷ niệm'), 'real Ghi kỷ niệm button on card back');
      assert.equal(first.postOverlapBadge, false, 'postmark must not overlap face badge');
      assert.equal(first.postOverlapKind, false, 'postmark must not overlap kind badge');
      await page.click('[data-st-swap]');
      const second = await page.locator('.st-activity-text').textContent();
      assert.equal(first.raw[1].endsWith(second), true);
      await page.click('[data-st-timer]');
      await wait(1300);
      const timer = await page.evaluate(() => ({ pressed: document.querySelector('[data-st-timer]').getAttribute('aria-pressed'), label: document.querySelector('.st-timer-label').textContent }));
      assert.equal(timer.pressed, 'true');
      assert.match(timer.label, /^Còn (59|58) giây$/);
      assert.equal((await sotay(page)).tried[2], false, 'ticket punches on finishCard, not unseal');
      await page.screenshot({ path: path.join(OUT, '1366-03b-back.png') });
      return { first, second, timer };
    });

    await check('Ga 3 → 4: Xong lá này đóng dấu tại chỗ, khớp tiến độ mốc, nút Ghi kỷ niệm dẫn sang Ga 4', async () => {
      await page.click('[data-st-finish="done"]');
      await wait(300);
      const atS3 = await page.evaluate(() => ({
        sotay: window.GoiVietSoTay.inspect(),
        stamped: document.querySelector('.st-back').classList.contains('is-stamped'),
        doneHidden: document.querySelector('[data-st-finish="done"]').hidden,
        skipHidden: document.querySelector('[data-st-finish="skipped"]').hidden,
        doneBadge: document.querySelector('.st-activity-done').textContent.trim(),
        nextRinged: document.querySelector('.st-next').classList.contains('st-target')
      }));
      assert.equal(atS3.sotay.step, 2, 'stays on stop 3 so the stamp is seen');
      assert.equal(atS3.sotay.finished, 'done');
      assert.equal(atS3.sotay.timer, false);
      assert.equal(atS3.sotay.tried[2], true);
      assert.equal(atS3.stamped, true);
      assert.equal(atS3.doneHidden, true, 'no dead finish button after done');
      assert.equal(atS3.skipHidden, true, 'no dead skip button after done');
      assert.equal(atS3.doneBadge, '✓ Đã xong lá này');
      assert.equal(atS3.nextRinged, true);
      await page.click('.st-record-btn');
      await page.waitForFunction(() => window.GoiVietSoTay.inspect().step === 3, null, { timeout: 3000 });
      assert.equal(await page.locator('#soTayPlace').inputValue(), 'Hà Nội');
      assert.deepEqual(await tasks(page), ['place:done', 'note:now', 'save:todo']);
      return atS3;
    });

    await check('Ga 4: kiểm tra địa danh trống, lưu kỷ niệm ngắn và dài (60+120 ký tự) không cắt chân bưu thiếp', async () => {
      await page.fill('#soTayPlace', '');
      await page.click('.st-memory [type="submit"]');
      assert.equal(await page.locator('#soTayPlaceError').isVisible(), true);
      assert.equal(await page.getAttribute('#soTayPlace', 'aria-invalid'), 'true');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'soTayPlace');
      await page.fill('#soTayPlace', 'Nam Định');
      await page.fill('#soTayNote', 'Bát phở sáng chủ nhật cùng bà');
      await page.click('.st-memory [type="submit"]');
      const info = await page.evaluate(() => ({
        note: document.querySelector('.st-postcard-note').textContent,
        place: document.querySelector('.st-postcard-place').textContent,
        milestone: document.querySelector('.st-milestone-text').textContent,
        count: document.querySelector('.st-postcard-count').textContent,
        error: document.getElementById('soTayPlaceError').hidden,
        handwritingDisplay: getComputedStyle(document.querySelector('.st-handwriting')).display
      }));
      assert.equal(info.note, 'Nam Định · Bát phở sáng chủ nhật cùng bà');
      assert.equal(info.place, 'Hà Nội');
      assert.equal(info.milestone, 'Tiến độ mốc 1 / 3');
      assert.equal(info.count, 'Kỷ niệm đã ghi: 1');
      assert.equal(info.error, true);
      assert.equal(info.handwritingDisplay, 'inline', 'no dangling dot before handwriting');
      assert.deepEqual((await sotay(page)).tried, [true, true, true, true]);
      assert.deepEqual(await tasks(page), ['place:done', 'note:done', 'save:done']);
      assert.equal(await ringed(page, '.st-next'), true);
      // Max-length memory (60 + 120 chars) must keep the postcard footer completely visible.
      await page.fill('#soTayPlace', 'Thành phố Nam Định – phố cổ Hàng Thao bên dòng sông Đào xưa');
      await page.fill('#soTayNote', 'Mùa thu năm ấy cả nhà dậy từ năm giờ sáng đi ăn phở bò tái lăn rồi ghé mua bánh gai bà Thi mang về làm quà cho ông ngoại.');
      await page.click('.st-memory [type="submit"]');
      const longCard = await page.evaluate(() => {
        const card = document.querySelector('.st-postcard').getBoundingClientRect();
        const foot = document.querySelector('.st-postcard-foot').getBoundingClientRect();
        return { cardBottom: Math.round(card.bottom), footTop: Math.round(foot.top), footBottom: Math.round(foot.bottom), count: document.querySelector('.st-postcard-count').textContent };
      });
      assert.ok(longCard.footBottom <= longCard.cardBottom + 1 && longCard.footTop >= 0, 'postcard footer clipped: ' + JSON.stringify(longCard));
      await page.screenshot({ path: path.join(OUT, '1366-03c-postcard-long.png') });
      return { info, longCard };
    });

    await check('Ga cuối: 7 nút có hỗ trợ bàn phím/chạm, màu khớp bản thật, Bưu điện biển đảo và gợi ý nút "?"', async () => {
      await page.click('.st-next');
      const info = await page.evaluate(() => ({
        items: document.querySelectorAll('.st-kit li').length,
        buttons: document.querySelectorAll('.st-kit .st-kit-btn').length,
        marks: document.querySelectorAll('.st-screen [data-st-mark]').length,
        ready: document.querySelector('.st-ready').textContent,
        next: document.querySelector('.st-next-label').textContent,
        done: document.querySelectorAll('.st-stop.is-done').length,
        keys: document.querySelector('.st-keys').hidden,
        f6: document.querySelector('.st-kit li[data-st-mark="6"] span').textContent,
        again: document.querySelector('.st-stage-note').textContent,
        logoSrc: document.querySelector('.st-screen-logo').getAttribute('src'),
        logoLoaded: document.querySelector('.st-screen-logo').naturalWidth > 0,
        postcardBg: getComputedStyle(document.querySelector('.st-screen-green')).backgroundColor
      }));
      assert.equal(info.items, 7);
      assert.equal(info.buttons, 7);
      assert.equal(info.marks, 7);
      assert.equal(info.ready, 'Vé đã soát đủ bốn ga. Mời lên tàu!');
      assert.equal(info.next, 'Lên tàu');
      assert.equal(info.done, 4);
      assert.equal(info.keys, true, 'the ready line takes the keys hint place');
      assert.match(info.f6, /Bưu điện biển đảo.*hải đồ/);
      assert.match(info.again, /“\?”/);
      assert.ok(info.logoSrc.includes('goi-viet-logo-512.webp') && info.logoLoaded, 'real Gói Việt logo');
      assert.equal(info.postcardBg, 'rgb(246, 232, 223)', 'warm blush-paper postcard pill');
      // Keyboard & click highlight on item 6.
      await page.locator('.st-kit li[data-st-mark="6"] .st-kit-btn').focus();
      await page.keyboard.press('Enter');
      const hot6 = await page.evaluate(() => ({
        liHot: document.querySelector('.st-kit li[data-st-mark="6"]').classList.contains('is-hot'),
        markHot: document.querySelector('.st-screen [data-st-mark="6"]').classList.contains('is-hot'),
        pressed: document.querySelector('.st-kit li[data-st-mark="6"] .st-kit-btn').getAttribute('aria-pressed')
      }));
      assert.deepEqual(hot6, { liHot: true, markHot: true, pressed: 'true' });
      await page.locator('#soTayS5Title').focus();
      await page.keyboard.press('ArrowLeft');
      assert.equal((await sotay(page)).step, 3);
      await page.keyboard.press('ArrowRight');
      assert.equal((await sotay(page)).step, 4);
      await wait(650);
      await settled(page);
      await page.screenshot({ path: path.join(OUT, '1366-04-last.png') });
      return { info, hot6 };
    });

    await check('Ga 2 (Canva Huế hue-c1): tab vai địa phương/người nơi khác, xem bìa, danh sách bí mật, không ghi đè vai thật', async () => {
      await page.evaluate(() => window.GoiVietSoTay.goTo(0));
      await page.click('.st-pin[data-station="hue"]');
      await page.click('[data-st-explore]');
      await page.waitForFunction(() => window.GoiVietSoTay.inspect().at === 'hue' && !document.querySelector('#soTayDialog .st-board').hidden, null, { timeout: 8000 });
      await page.click('.st-mode-cards');
      await page.waitForFunction(() => window.GoiVietSoTay.inspect().step === 1);
      // Draw Huế card 0 (hue-c1, Canva).
      await page.click('.st-fan-card >> nth=0');
      await page.waitForFunction(() => window.GoiVietSoTay.inspect().card === 'hue-c1' && window.GoiVietSoTay.inspect().cardDrawn, null, { timeout: 5000 });
      const localInfo = await page.evaluate(() => ({
        tabs: [...document.querySelectorAll('.st-canva-role')].map(b => b.textContent),
        qLocal: document.querySelector('.st-question').textContent,
        expectedLocal: GoiVietCanvaCards.questionFor(ALL_DECKS_MAP.hue.cards[0], 'local')
      }));
      assert.deepEqual(localInfo.tabs, ['Người địa phương', 'Người nơi khác']);
      assert.equal(localInfo.qLocal, localInfo.expectedLocal);
      // Open cover peek, verify cover art, Escape closes only cover peek.
      await page.click('[data-st-cover]');
      assert.equal(await page.locator('.st-cover-overlay').isVisible(), true);
      assert.equal(await page.locator('.st-cover-card .gv-cover').count(), 1);
      await page.screenshot({ path: path.join(OUT, '1366-canva-hue-cover.png') });
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('.st-cover-overlay').isVisible(), false);
      assert.equal((await sotay(page)).open, true, 'Escape on cover peek keeps handbook open');
      // Switch to visitor role -> secret list appears; real GoiVietCanvaCards.role stays local.
      await page.click('.st-canva-role[data-st-role="visitor"]');
      await page.click('[data-st-secret]');
      const visitorInfo = await page.evaluate(() => ({
        qVisitor: document.querySelector('.st-question').textContent,
        expectedVisitor: GoiVietCanvaCards.questionFor(ALL_DECKS_MAP.hue.cards[0], 'visitor'),
        secrets: [...document.querySelectorAll('.st-canva-secret-list li')].map(li => li.textContent),
        realRole: GoiVietCanvaCards.role(ALL_DECKS_MAP.hue.cards[0])
      }));
      assert.equal(visitorInfo.qVisitor, visitorInfo.expectedVisitor);
      assert.deepEqual(visitorInfo.secrets, ['Bánh bột lọc', 'Cơm hến', 'Bánh ép']);
      assert.equal(visitorInfo.realRole, 'local', 'handbook must never mutate real Canva session role');
      await page.screenshot({ path: path.join(OUT, '1366-canva-hue-visitor.png') });
      // Return to stop 4 so subsequent checks stay on last stop.
      await page.evaluate(() => window.GoiVietSoTay.goTo(4));
      return { localInfo, visitorInfo };
    });

    await check('Hủy timer khi chuyển ga nhanh trong lúc xáo bài', async () => {
      await page.evaluate(() => window.GoiVietSoTay.goTo(1));
      await page.click('[data-st-again]');
      await page.click('[data-st-shuffle]');
      await wait(120);
      await page.evaluate(() => window.GoiVietSoTay.goTo(2));
      await wait(1900);
      const after = await sotay(page);
      assert.equal(after.step, 2);
      assert.equal(after.cardDrawn, false, 'cancelled shuffle must not fire showFront on stop 3');
      assert.equal(await page.locator('.st-front').isVisible(), false);
      await page.evaluate(() => window.GoiVietSoTay.goTo(4));
      return after;
    });

    await check('Không tràn ngang, không cột nào phải cuộn ở cả 5 ga (1366 × 768)', async () => {
      const result = [];
      for (let n = 0; n <= 4; n++) {
        await page.evaluate(i => window.GoiVietSoTay.goTo(i), n);
        await wait(650);
        await settled(page);
        const o = await overflow(page);
        assert.deepEqual(o.out, [], `stop ${n + 1}`);
        assert.ok(o.scroll <= o.client + 1, `stop ${n + 1} scrolls sideways`);
        assert.deepEqual(o.clipped, [], `stop ${n + 1} needs scrolling`);
        result.push(o);
      }
      return result;
    });

    await check('Cỡ chữ cho máy chiếu: 1366 × 768 không chữ nào dưới 14 px, chữ dẫn ≥ 19 px, tiêu đề ≥ 40 px', async () => {
      const result = [];
      for (let n = 0; n <= 4; n++) {
        await page.evaluate(i => window.GoiVietSoTay.goTo(i), n);
        await wait(500);
        const t = await textSizes(page);
        assert.ok(t.smallest[0][0] >= 14, `stop ${n + 1}: ${JSON.stringify(t.smallest[0])}`);
        // The last stop has a longer list; its title and lead are a little smaller.
        assert.ok(t.lead >= (n === 4 ? 17 : 19), `stop ${n + 1} lead ${t.lead}`);
        assert.ok(t.title >= (n === 4 ? 31 : 40), `stop ${n + 1} title ${t.title}`);
        result.push(t);
      }
      return result;
    });

    await check('Esc đóng sổ tay, trả focus, mở lại vẫn giữ vé', async () => {
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => document.getElementById('soTayDialog').hidden, null, { timeout: 3000 });
      await page.waitForFunction(() => document.activeElement && document.activeElement.id === 'memoryOpenGuide', null, { timeout: 2000 }).catch(() => {});
      const info = await page.evaluate(() => ({
        focus: document.activeElement.id,
        introInert: document.getElementById('introScreen').inert,
        mapInert: document.getElementById('mapScene').inert,
        body: [...document.body.classList].filter(c => c.startsWith('st-'))
      }));
      assert.equal(info.focus, 'memoryOpenGuide');
      assert.equal(info.introInert, false);
      assert.deepEqual(info.body, []);
      await page.click('#memoryOpenGuide');
      await page.waitForFunction(() => window.GoiVietSoTay.inspect().open);
      const again = await sotay(page);
      assert.equal(again.step, 4);
      assert.deepEqual(again.tried, [true, true, true, true]);
      return { info, again };
    });

    await check('Sổ tay không ghi vào hành trình, bộ thẻ, kỷ niệm hay bộ nhớ trình duyệt', async () => {
      const after = await journey(page);
      assert.equal(after, before);
      return JSON.parse(after);
    });

    await check('Lên tàu: đầu máy rời ga, màn che, vào bản đồ một lần', async () => {
      await page.evaluate(() => { window.__entries = 0; const original = window.closeIntroModal; window.closeIntroModal = (...args) => { window.__entries++; return original(...args); }; });
      const started = Date.now();
      await page.click('.st-next');
      await page.waitForFunction(() => document.getElementById('soTayDialog').classList.contains('is-boarding'));
      await page.waitForFunction(() => document.getElementById('introScreen').classList.contains('intro-hidden') && document.getElementById('soTayDialog').hidden, null, { timeout: 15000 });
      await page.waitForFunction(() => !document.getElementById('memoryMapTransition').classList.contains('is-covering'), null, { timeout: 60000 });
      const info = await page.evaluate(() => ({ entries: window.__entries, body: [...document.body.classList].filter(c => c.startsWith('st-')), mapInert: document.getElementById('mapScene').inert, open: window.GoiVietSoTay.inspect().open }));
      assert.equal(info.entries, 1);
      assert.deepEqual(info.body, []);
      assert.equal(info.mapInert, false);
      assert.equal(info.open, false);
      await page.screenshot({ path: path.join(OUT, '1366-05-map.png') });
      return { ...info, ms: Date.now() - started };
    });

    await check('Mở lại sổ tay từ nút "?" trên bản đồ: khóa bản đồ, không đụng trang chủ, 3 lối đóng trả focus về "?" và không ghi dữ liệu', async () => {
      const beforeMap = await journey(page);
      const btnInfo = await page.evaluate(() => {
        const btn = document.getElementById('btnMapGuide');
        const header = document.querySelector('#mapScene .top-header');
        const hr = header.getBoundingClientRect();
        const items = [...header.querySelectorAll('.brand-group, .session-strip, .header-actions > button, .header-actions > .gv-lang-toggle-header, .header-actions > #headerSettings')].filter(el => el.checkVisibility());
        const overlap = (a, b) => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
        const hits = [];
        for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
          if (overlap(items[i].getBoundingClientRect(), items[j].getBoundingClientRect())) hits.push([items[i].id || items[i].className, items[j].id || items[j].className]);
        }
        const br = btn.getBoundingClientRect();
        return {
          visible: btn.checkVisibility(),
          label: btn.getAttribute('aria-label'),
          title: btn.getAttribute('title'),
          inside: br.left >= hr.left - 1 && br.right <= hr.right + 1 && br.top >= hr.top - 1 && br.bottom <= hr.bottom + 1,
          hits
        };
      });
      assert.equal(btnInfo.visible, true);
      assert.equal(btnInfo.label, 'Mở sổ tay hành khách');
      assert.equal(btnInfo.title, 'Mở sổ tay hành khách');
      assert.equal(btnInfo.inside, true, 'map "?" button stays inside top-header');
      assert.deepEqual(btnInfo.hits, [], 'header controls must not overlap at 1366');
      // Tab reaches #btnMapGuide with visible focus ring.
      await page.locator('.gv-lang-toggle-header [data-set-lang="en"]').focus();
      await page.keyboard.press('Tab');
      const focusInfo = await page.evaluate(() => ({
        id: document.activeElement.id,
        outline: getComputedStyle(document.activeElement).outlineWidth
      }));
      assert.equal(focusInfo.id, 'btnMapGuide');
      assert.notEqual(focusInfo.outline, '0px');
      // 1) Open from "?" and close with Esc.
      const introBefore = await page.evaluate(() => ({
        hidden: document.getElementById('introScreen').classList.contains('intro-hidden'),
        inert: document.getElementById('introScreen').inert,
        cls: document.getElementById('introScreen').className
      }));
      await page.click('#btnMapGuide');
      await page.waitForFunction(() => window.GoiVietSoTay.inspect().open);
      await wait(450);
      const openState = await page.evaluate(() => ({
        sotay: window.GoiVietSoTay.inspect(),
        introHidden: document.getElementById('introScreen').classList.contains('intro-hidden'),
        introInert: document.getElementById('introScreen').inert,
        introCls: document.getElementById('introScreen').className,
        mapInert: document.getElementById('mapScene').inert,
        covering: document.body.classList.contains('st-covering')
      }));
      assert.equal(openState.sotay.fromMap, true);
      assert.equal(openState.introHidden, true, 'home screen stays hidden');
      assert.equal(openState.introInert, introBefore.inert, 'home screen inert state unchanged');
      assert.equal(openState.introCls, introBefore.cls, 'home screen classes untouched');
      assert.equal(openState.mapInert, true, 'map underneath is inert');
      assert.equal(openState.covering, false, 'no st-covering in fromMap mode');
      await page.screenshot({ path: path.join(OUT, '1366-from-map-open.png') });
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => document.getElementById('soTayDialog').hidden, null, { timeout: 3000 });
      assert.equal(await page.evaluate(() => document.activeElement.id), 'btnMapGuide');
      assert.equal(await page.evaluate(() => document.getElementById('mapScene').inert), false);
      // 2) Open from "?" and close with "Vào thẳng bản đồ".
      await page.click('#btnMapGuide');
      await page.waitForFunction(() => window.GoiVietSoTay.inspect().open);
      await page.click('.st-skip');
      await page.waitForFunction(() => document.getElementById('soTayDialog').hidden, null, { timeout: 3000 });
      assert.equal(await page.evaluate(() => document.activeElement.id), 'btnMapGuide');
      assert.equal(await page.evaluate(() => document.getElementById('introScreen').classList.contains('intro-hidden')), true);
      // 3) Open from "?", go to Ga 5 and close with "Lên tàu".
      await page.click('#btnMapGuide');
      await page.waitForFunction(() => window.GoiVietSoTay.inspect().open);
      await page.evaluate(() => window.GoiVietSoTay.goTo(4));
      await page.click('.st-next');
      await page.waitForFunction(() => document.getElementById('soTayDialog').hidden, null, { timeout: 3000 });
      assert.equal(await page.evaluate(() => document.activeElement.id), 'btnMapGuide');
      assert.equal(await page.evaluate(() => document.getElementById('mapScene').inert), false);
      assert.equal(await page.evaluate(() => document.getElementById('introScreen').classList.contains('intro-hidden')), true);
      assert.equal(await journey(page), beforeMap, 'reopening from map must write nothing to journey or storage');
      return { btnInfo, focusInfo, openState };
    });

    await check('Về trang chủ rồi mở lại chương: sổ tay đóng, nút chương hoạt động', async () => {
      await page.evaluate(() => openIntroModal('welcome'));
      await page.waitForFunction(() => !document.getElementById('introScreen').classList.contains('intro-hidden'));
      await page.click('#btnHomeExploreMemory');
      await page.locator('#memoryOpenGuide').scrollIntoViewIfNeeded();
      await page.click('#memoryOpenGuide');
      await page.waitForFunction(() => window.GoiVietSoTay.inspect().open);
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => document.getElementById('soTayDialog').hidden);
    });

    // ------------------------------------------------------------ the two direct ways into the map
    await check('Vào thẳng bản đồ (trong sổ tay)', async () => {
      const p = await open({ tag: '1366-skip' });
      await p.click('#memoryOpenGuide');
      await p.waitForFunction(() => window.GoiVietSoTay.inspect().open);
      await p.click('.st-skip');
      await p.waitForFunction(() => document.getElementById('introScreen').classList.contains('intro-hidden') && document.getElementById('soTayDialog').hidden, null, { timeout: 15000 });
      assert.equal(await p.evaluate(() => document.getElementById('soTayDialog').classList.contains('is-boarding')), false);
    });
    await check('Vào thẳng bản đồ (liên kết cuối chương, không mở sổ tay)', async () => {
      const p = await open({ tag: '1366-chapter' });
      await p.click('#memoryOpenMap');
      await p.waitForFunction(() => document.getElementById('introScreen').classList.contains('intro-hidden'), null, { timeout: 15000 });
      assert.equal(await p.evaluate(() => document.getElementById('soTayDialog').hidden), true);
    });

    // ------------------------------------------------------------ English, then VI inside the sheet
    await check('Tiếng Anh và đổi VI ↔ EN ngay trong sổ tay', async () => {
      const p = await open({ tag: '1920-en', width: 1920, height: 1080, lang: 'en' });
      assert.equal(await p.locator('#memoryOpenGuide .mc-ticket-title').textContent(), 'Read the passenger handbook');
      await p.click('#memoryOpenGuide');
      await p.waitForFunction(() => window.GoiVietSoTay.inspect().open);
      await p.click('.st-pin[data-station="hue"]');
      await p.click('[data-st-explore]');
      await p.waitForFunction(() => !document.querySelector('#soTayDialog .st-board').hidden, null, { timeout: 8000 });
      const en = await p.evaluate(() => ({ title: document.getElementById('soTayTitle').textContent, step: document.getElementById('soTayS1Title').textContent, region: document.querySelector('.st-board-region').textContent, hs: document.querySelector('.st-isle-label').textContent, next: document.querySelector('.st-next-label').textContent, keys: document.querySelector('.st-keys').textContent }));
      assert.equal(en.title, 'Passenger handbook');
      assert.equal(en.step, 'Pick a station');
      assert.equal(en.next, 'Next');
      assert.equal(en.hs, 'Hoàng Sa(Paracel Islands)');
      assert.ok(en.keys.includes('← →'));
      const enPins = await p.evaluate(() => {
        const hcmPin = document.querySelector('.st-pin[data-station="hcm"] .st-pin-label');
        const ts = document.querySelector('.st-isle-label[data-key="ts"]');
        const a = hcmPin.getBoundingClientRect(), b = ts.getBoundingClientRect();
        return { hcm: hcmPin.textContent, overlapTs: a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1 };
      });
      assert.equal(enPins.hcm, 'HCMC station');
      assert.equal(enPins.overlapTs, false, 'EN HCMC pin must not overlap Trường Sa');
      await p.screenshot({ path: path.join(OUT, '1920-en-board.png') });
      const o = await overflow(p);
      assert.deepEqual(o.out, []);
      assert.deepEqual(o.clipped, []);
      const sizes = await textSizes(p);
      assert.ok(sizes.base >= 25 && sizes.lead >= 27 && sizes.smallest[0][0] >= 19.5, JSON.stringify(sizes));
      const countries = await p.evaluate(() => [...document.querySelectorAll('#soTayDialog .st-country')].map(t => t.textContent));
      assert.deepEqual(countries, ['LAOS', 'CAMBODIA', 'THAILAND']);
      // No Vietnamese interface string of the handbook is left on any stop in English (place names and card
      // content keep their Vietnamese names by design, so only the sotay.* interface strings are compared).
      const source = fs.readFileSync(path.join(ROOT, 'assets/goi-viet/map-surroundings-preview/i18n-ui-5.js'), 'utf8');
      const vietnamese = [...source.matchAll(/'(sotay\.[\w.]+)': \['((?:[^'\\]|\\.)*)', '((?:[^'\\]|\\.)*)'\]/g)]
        .map(m => [m[1], m[2].replace(/\\n/g, '\n'), m[3].replace(/\\n/g, '\n')])
        .filter(([, vi, en]) => vi && vi !== en && !en.includes(vi))
        .flatMap(([key, vi]) => vi.split('\n').filter(line => line.length >= 4 && !/^(Hoàng Sa|Trường Sa|Biển Đông)$/.test(line)).map(line => [key, line]));
      assert.ok(vietnamese.length > 80, 'read the sotay.* dictionary');
      const leftovers = new Set();
      for (let n = 0; n <= 4; n++) {
        await p.evaluate(i => window.GoiVietSoTay.goTo(i), n);
        await wait(400);
        const text = await p.evaluate(() => {
          const dialog = document.getElementById('soTayDialog');
          const attrs = [...dialog.querySelectorAll('[aria-label], [title], [placeholder]')].map(el => ['aria-label', 'title', 'placeholder'].map(a => el.getAttribute(a) || '').join('\n'));
          return dialog.innerText + '\n' + attrs.join('\n') + '\n' + document.getElementById('memoryOpenGuide').innerText;
        });
        for (const [key, line] of vietnamese) if (text.includes(line)) leftovers.add(`${key}: ${line}`);
      }
      assert.deepEqual([...leftovers], [], 'Vietnamese interface text left in English');
      await p.evaluate(() => window.GoiVietSoTay.goTo(0));
      await p.click('.st-lang [data-set-lang="vi"]');
      await wait(300);
      const vi = await p.evaluate(() => ({ title: document.getElementById('soTayTitle').textContent, region: document.querySelector('.st-board-region').textContent, place: document.querySelector('.st-board-name').textContent, expected: ALL_DECKS_MAP.hue.region, next: document.querySelector('.st-next-label').textContent }));
      assert.equal(vi.title, 'Sổ tay hành khách');
      assert.equal(vi.region, vi.expected);
      assert.equal(vi.next, 'Tiếp');
      assert.notEqual(en.region, vi.region, 'board follows the language');
      // Check map top-header with "?" button at 1920×1080 in English too.
      await p.click('.st-lang [data-set-lang="en"]');
      await wait(200);
      await p.click('.st-skip');
      await p.waitForFunction(() => document.getElementById('introScreen').classList.contains('intro-hidden') && !document.getElementById('memoryMapTransition').classList.contains('is-covering'), null, { timeout: 60000 });
      await wait(400);
      const hdr1920 = await p.evaluate(() => {
        const hEl = document.querySelector('#mapScene .top-header'), hr = hEl.getBoundingClientRect();
        const btn = document.getElementById('btnMapGuide'), br = btn.getBoundingClientRect();
        const items = [...hEl.querySelectorAll('.brand-group, .session-strip, .header-actions > button, .header-actions > .gv-lang-toggle-header, .header-actions > #headerSettings')].filter(el => el.checkVisibility());
        const ov = (a, b) => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
        const hits = [];
        for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) if (ov(items[i].getBoundingClientRect(), items[j].getBoundingClientRect())) hits.push([items[i].id || items[i].className, items[j].id || items[j].className]);
        return { label: btn.getAttribute('aria-label'), title: btn.getAttribute('title'), inside: br.left >= hr.left - 1 && br.right <= hr.right + 1, hits, overflowX: document.documentElement.scrollWidth > innerWidth };
      });
      assert.equal(hdr1920.label, 'Open the passenger handbook');
      assert.equal(hdr1920.title, 'Open the passenger handbook');
      assert.equal(hdr1920.inside, true);
      assert.deepEqual(hdr1920.hits, []);
      assert.equal(hdr1920.overflowX, false);
      await p.screenshot({ path: path.join(OUT, '1920-en-map-header.png') });
      return { en, vi, hdr1920 };
    });

    // ------------------------------------------------------------ dark theme, reduced motion, phone width
    await check('Theme tối: giấy và chữ đổi theo token tối', async () => {
      const p = await open({ tag: '1366-dark', theme: 'dark' });
      await p.click('#memoryOpenGuide');
      await p.waitForFunction(() => window.GoiVietSoTay.inspect().open);
      await wait(500);
      const info = await p.evaluate(() => { const s = getComputedStyle(document.querySelector('#soTayDialog .st-sheet')); return { bg: s.backgroundColor, color: s.color }; });
      assert.equal(info.bg, 'rgb(32, 54, 44)');
      assert.equal(info.color, 'rgb(247, 240, 222)');
      await p.screenshot({ path: path.join(OUT, '1366-dark.png') });
      return info;
    });
    await check('Giảm chuyển động: không hoạt cảnh, mọi bước tức thì', async () => {
      const p = await open({ tag: '1366-reduced', reduced: true });
      await p.click('#memoryOpenGuide');
      const opened = await p.evaluate(() => window.GoiVietSoTay.inspect().open);
      assert.equal(opened, true);
      await p.click('.st-pin[data-station="hcm"]');
      await p.click('[data-st-explore]');
      assert.equal(await p.evaluate(() => !document.querySelector('#soTayDialog .st-board').hidden), true, 'board at once');
      await p.click('.st-mode-cards');
      await p.click('[data-st-shuffle]');
      assert.equal(await p.evaluate(() => window.GoiVietSoTay.inspect().cardDrawn), true, 'card at once');
      const animated = await p.evaluate(() => [...document.querySelectorAll('#soTayDialog *')].filter(el => getComputedStyle(el).animationName !== 'none').length);
      assert.equal(animated, 0);
      await p.evaluate(() => window.GoiVietSoTay.goTo(4));
      await p.click('.st-next');
      await p.waitForFunction(() => document.getElementById('introScreen').classList.contains('intro-hidden'), null, { timeout: 15000 });
      return { animated };
    });
    await check('Khổ 4:3 (1024 × 768), 1280 × 720 và 1536 × 864: không mất tên nút bỏ qua, Hoàng Sa/Trường Sa rõ, không cuộn cột chữ hay bảng ga', async () => {
      const results = {};
      for (const [w, h] of [[1024, 768], [1280, 720], [1536, 864]]) {
        const p = await open({ tag: `${w}x${h}`, width: w, height: h });
        await p.click('#memoryOpenGuide');
        await p.waitForFunction(() => window.GoiVietSoTay.inspect().open);
        await p.waitForFunction(() => window.GoiVietSoTay.inspect().geography, null, { timeout: 20000 });
        await p.click('.st-pin[data-station="hn"]');
        await p.click('[data-st-explore]');
        await p.waitForFunction(() => !document.querySelector('#soTayDialog .st-board').hidden, null, { timeout: 8000 });
        if (w >= 1280) {
          await p.click('[data-st-book]');
        }
        const s1 = await p.evaluate(() => {
          const skip = document.querySelector('#soTayDialog .st-skip');
          const board = document.querySelector('#soTayDialog .st-board').getBoundingClientRect();
          const wrap = document.querySelector('#soTayDialog .st-map-wrap').getBoundingClientRect();
          const overlap = (a, b) => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
          const isles = [...document.querySelectorAll('#soTayDialog .st-isle-label')].map(el => ({
            key: el.dataset.key,
            text: el.textContent,
            r: el.getBoundingClientRect().toJSON(),
            overBoard: overlap(el.getBoundingClientRect(), board),
            inWrap: el.getBoundingClientRect().left >= wrap.left - 2 && el.getBoundingClientRect().right <= wrap.right + 2
          }));
          return { skipText: skip.innerText.trim(), isles };
        });
        assert.ok(s1.skipText.includes('Vào thẳng bản đồ'), `${w}x${h} skip button must keep visible text: ${s1.skipText}`);
        for (const isle of s1.isles) {
          assert.equal(isle.inWrap, true, `${w}x${h} ${isle.key} outside map wrap`);
          assert.equal(isle.overBoard, false, `${w}x${h} ${isle.key} covered by station board: ${JSON.stringify(isle)}`);
        }
        if (w === 1024) await p.screenshot({ path: path.join(OUT, '1024-s1-board.png') });
        if (w === 1280) await p.screenshot({ path: path.join(OUT, '1280-s1-board.png') });
        const clipped = [];
        if (w >= 1280) {
          for (let n = 0; n <= 4; n++) {
            await p.evaluate(i => window.GoiVietSoTay.goTo(i), n);
            await wait(550);
            await settled(p);
            const o = await overflow(p);
            assert.deepEqual(o.out, [], `${w}x${h} stop ${n + 1} horizontal overflow`);
            if (o.clipped.length) clipped.push(`stop ${n + 1}: ${o.clipped.join(', ')}`);
          }
          assert.deepEqual(clipped, [], `${w}x${h} copy/board must not scroll`);
        }
        // Check top header on map at 1280×720 too (no overflow/overlap with "?").
        if (w === 1280) {
          await p.click('.st-skip');
          await p.waitForFunction(() => document.getElementById('introScreen').classList.contains('intro-hidden') && !document.getElementById('memoryMapTransition').classList.contains('is-covering'), null, { timeout: 60000 });
          await wait(400);
          const hdr1280 = await p.evaluate(() => {
            const hEl = document.querySelector('#mapScene .top-header'), hr = hEl.getBoundingClientRect();
            const items = [...hEl.querySelectorAll('.brand-group, .session-strip, .header-actions > button, .header-actions > .gv-lang-toggle-header, .header-actions > #headerSettings')].filter(el => el.checkVisibility());
            const ov = (a, b) => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
            const hits = [];
            for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) if (ov(items[i].getBoundingClientRect(), items[j].getBoundingClientRect())) hits.push([items[i].id || items[i].className, items[j].id || items[j].className]);
            const br = document.getElementById('btnMapGuide').getBoundingClientRect();
            return { inside: br.left >= hr.left - 1 && br.right <= hr.right + 1, hits, overflowX: document.documentElement.scrollWidth > innerWidth };
          });
          assert.equal(hdr1280.inside, true);
          assert.deepEqual(hdr1280.hits, []);
          assert.equal(hdr1280.overflowX, false);
          await p.screenshot({ path: path.join(OUT, '1280-map-header.png') });
        }
        results[`${w}x${h}`] = { s1, clipped };
      }
      return results;
    });

    await check('Màn hẹp 390 × 844: một cột, không tràn ngang, không cắt 4 lá, không đè dấu/số và nút "?" trên bản đồ gọn', async () => {
      const p = await open({ tag: '390', width: 390, height: 844 });
      await p.click('#memoryOpenGuide');
      await p.waitForFunction(() => window.GoiVietSoTay.inspect().open);
      await wait(400);
      // Ga 1: HCM pin label must not overlap Trường Sa label.
      const s1Mob = await p.evaluate(() => {
        const pin = document.querySelector('.st-pin[data-station="hcm"] .st-pin-label').getBoundingClientRect();
        const ts = document.querySelector('.st-isle-label[data-key="ts"]').getBoundingClientRect();
        const ov = pin.left < ts.right - 1 && pin.right > ts.left + 1 && pin.top < ts.bottom - 1 && pin.bottom > ts.top + 1;
        return { ov };
      });
      assert.equal(s1Mob.ov, false, 'Ga TP.HCM label must not overlap Trường Sa on 390px');
      const result = [];
      for (let n = 0; n <= 4; n++) {
        await p.evaluate(i => window.GoiVietSoTay.goTo(i), n);
        await wait(650);
        await settled(p);
        const o = await overflow(p);
        assert.deepEqual(o.out, [], `stop ${n + 1}`);
        if (n === 1) {
          const fanClip = await p.evaluate(() => {
            const stage = document.querySelector('.st-stage-deck').getBoundingClientRect();
            return [...document.querySelectorAll('.st-fan-card')].map((c, i) => {
              const r = c.getBoundingClientRect();
              return { i, ok: r.left >= stage.left - 2 && r.right <= stage.right + 2, left: Math.round(r.left), right: Math.round(r.right), sL: Math.round(stage.left), sR: Math.round(stage.right) };
            }).filter(x => !x.ok);
          });
          assert.deepEqual(fanClip, [], 'all 4 fan cards must fit inside stage on 390px');
          await p.screenshot({ path: path.join(OUT, '390-s2-fan.png') });
        }
        if (n === 2) {
          await p.click('[data-st-unseal]');
          await p.waitForFunction(() => window.GoiVietSoTay.inspect().unsealed, null, { timeout: 3000 });
          await wait(650);
          const pmOv = await p.evaluate(() => {
            const pm = document.querySelector('.st-postmark').getBoundingClientRect();
            const top = document.querySelector('.st-activity-top').getBoundingClientRect();
            return pm.left < top.right - 1 && pm.right > top.left + 1 && pm.top < top.bottom - 1 && pm.bottom > top.top + 1;
          });
          assert.equal(pmOv, false, 'postmark must not overlap activity top on 390px');
          await p.screenshot({ path: path.join(OUT, '390-s3-open.png') });
        }
        if (n === 4) {
          const kitCheck = await p.evaluate(() => {
            const sc = document.querySelector('.st-screen'), sr = sc.getBoundingClientRect();
            const badges = [...sc.querySelectorAll('.st-screen-bar [data-st-mark] b')].map(b => ({ t: b.textContent, r: b.getBoundingClientRect() }));
            const ov = (a, b) => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
            const hits = [];
            for (let i = 0; i < badges.length; i++) for (let j = i + 1; j < badges.length; j++) if (ov(badges[i].r, badges[j].r)) hits.push([badges[i].t, badges[j].t]);
            return { scrollX: sc.scrollWidth > sc.clientWidth + 1, hits, outRight: badges.filter(b => b.r.right > sr.right + 1).map(b => b.t) };
          });
          assert.equal(kitCheck.scrollX, false, 'Ga 5 screen diagram must not overflow sideways on 390px');
          assert.deepEqual(kitCheck.hits, [], 'Ga 5 header badges 1-5 must not overlap on 390px');
          assert.deepEqual(kitCheck.outRight, [], 'Ga 5 header badges must stay inside screen frame on 390px');
        }
        result.push(o);
      }
      assert.equal(await p.locator('.st-next').isVisible(), true);
      await p.screenshot({ path: path.join(OUT, '390-last.png'), fullPage: false });
      // Also check map top-header with "?" button on 390×844.
      await p.click('.st-skip');
      await p.waitForFunction(() => document.getElementById('introScreen').classList.contains('intro-hidden') && !document.getElementById('memoryMapTransition').classList.contains('is-covering'), null, { timeout: 60000 });
      await wait(400);
      const mobHdr = await p.evaluate(() => {
        const hEl = document.querySelector('#mapScene .top-header'), hr = hEl.getBoundingClientRect();
        const items = [...hEl.querySelectorAll('.brand-group, .session-strip, .header-actions > button, .header-actions > .gv-lang-toggle-header, .header-actions > #headerSettings')].filter(el => el.checkVisibility());
        const ov = (a, b) => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
        const hits = [];
        for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) if (ov(items[i].getBoundingClientRect(), items[j].getBoundingClientRect())) hits.push([items[i].id || items[i].className, items[j].id || items[j].className]);
        const br = document.getElementById('btnMapGuide').getBoundingClientRect();
        return { inside: br.left >= hr.left - 1 && br.right <= hr.right + 1 && br.top >= hr.top - 1 && br.bottom <= hr.bottom + 1, hits, overflowX: document.documentElement.scrollWidth > innerWidth };
      });
      assert.equal(mobHdr.inside, true, 'mobile "?" button must stay inside top-header');
      assert.deepEqual(mobHdr.hits, [], 'mobile top-header controls must not overlap');
      assert.equal(mobHdr.overflowX, false, 'mobile map must not overflow horizontally');
      await p.screenshot({ path: path.join(OUT, '390-map-header.png') });
      return { s1Mob, result, mobHdr };
    });

    await check('Không có lỗi trang, console hay HTTP', async () => {
      assert.deepEqual(report.errors, []);
    });
  } finally {
    for (const context of pages) await context.close().catch(() => {});
    await browser.close();
    server.close();
    report.finished = new Date().toISOString();
    fs.writeFileSync(path.join(OUT, 'checks.json'), JSON.stringify(report, null, 2));
    const ok = report.checks.filter(c => c.ok).length;
    console.log(`\n${ok}/${report.checks.length} checks passed${report.failed.length ? '; failed: ' + report.failed.join(' | ') : ''}`);
    if (report.failed.length) process.exitCode = 1;
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
