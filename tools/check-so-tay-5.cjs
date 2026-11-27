// P5-07: checks the passenger handbook (Sổ tay hành khách) of map-surroundings-preview-5.html in real Chrome.
//   node tools/check-so-tay-5.cjs            serves the project from a local port of its own (read-only)
// Report: verification/so-tay-5/checks.json (+ screenshots). Exit code 1 when a check fails.
// Covers: opening from the end of the memory chapter, the five stops with the page's real data, the boarding ticket,
// keyboard (← → Esc, Tab stays inside), the map kept preparing underneath, nothing written to the journey or storage,
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
      if (el.closest('.st-fan, .st-backdrop, .st-rail-train, .st-map-train')) continue;
      if (r.left < -1 || r.right > width + 1) out.push(`${el.className || el.tagName} ${Math.round(r.left)}..${Math.round(r.right)}`);
    }
    return { width, scroll: dialog.scrollWidth, client: dialog.clientWidth, out: out.slice(0, 8) };
  });

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

    await check('Ga 1: bản đồ từ dữ liệu trang (34 tỉnh, Hoàng Sa, Trường Sa) và 3 ga mẫu', async () => {
      const info = await page.evaluate(() => ({
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
      assert.deepEqual(info.pins, ['hn:Hà Nội', 'hue:Huế', 'hcm:TP.HCM']);
      assert.ok(info.rail);
      return info;
    });

    await check('Ga 1: chọn Hà Nội, Khám phá, tàu tới và bảng ga đúng dữ liệu', async () => {
      await page.click('.st-pin[data-station="hn"]');
      assert.equal(await page.locator('.st-here-place').textContent(), 'Hà Nội');
      assert.equal(await page.locator('.st-here-kicker').textContent(), 'Bạn đang ở đây');
      await page.click('[data-st-explore]');
      await page.waitForFunction(() => !document.querySelector('#soTayDialog .st-board').hidden, null, { timeout: 8000 });
      const info = await page.evaluate(() => ({
        name: document.querySelector('.st-board-name').textContent,
        region: document.querySelector('.st-board-region').textContent,
        summary: document.querySelector('.st-board-summary').textContent,
        facts: [...document.querySelectorAll('[data-st-fact]')].map(d => d.textContent),
        expected: [ALL_DECKS_MAP.hn.region, ALL_DECKS_MAP.hn.summary, ALL_DECKS_MAP.hn.highlights.landmark, ALL_DECKS_MAP.hn.highlights.heritage, ALL_DECKS_MAP.hn.highlights.cuisine],
        ticket: document.querySelector('.st-ticket-count').textContent,
        stamp: Boolean(document.querySelector('.st-step[data-st-step="0"] .st-tried'))
      }));
      assert.equal(info.name, 'Hà Nội');
      assert.deepEqual([info.region, info.summary, ...info.facts], info.expected);
      assert.equal(info.ticket, 'Đã soát 1/4');
      assert.ok(info.stamp);
      assert.deepEqual((await sotay(page)).tried, [true, false, false, false]);
      await page.screenshot({ path: path.join(OUT, '1366-02-board.png') });
      return info;
    });

    await check('Ga 1: Rút vé gợi ý một ga khác, Đọc sách mở ghi chú', async () => {
      await page.click('[data-st-ticket]');
      await page.waitForFunction(() => window.GoiVietSoTay.inspect().picked !== 'hn', null, { timeout: 3000 });
      const kicker = await page.locator('.st-here-kicker').textContent();
      assert.equal(kicker, 'Điểm dừng gợi ý');
      await page.click('.st-pin[data-station="hn"]');
      await page.click('[data-st-book]');
      assert.equal(await page.locator('#soTayBookNote').isVisible(), true);
      assert.equal(await page.getAttribute('[data-st-book]', 'aria-expanded'), 'true');
      return { kicker };
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
      await page.screenshot({ path: path.join(OUT, '1366-03-card.png') });
      return info;
    });

    await check('Ga 3: dấu Hoa Sen mở hoạt động thật, đổi hoạt động, hẹn giờ', async () => {
      await page.click('.st-front [data-st-goto="2"]');
      assert.equal(await page.locator('.st-wax').isVisible(), true);
      await page.click('[data-st-unseal]');
      await page.waitForFunction(() => window.GoiVietSoTay.inspect().unsealed, null, { timeout: 3000 });
      const first = await page.evaluate(() => ({ kind: document.querySelector('.st-activity-kind').textContent, text: document.querySelector('.st-activity-text').textContent, raw: ALL_DECKS_MAP.hn.cards[0].activities }));
      assert.equal(`【${first.kind}】 ${first.text}`, first.raw[0]);
      await page.click('[data-st-swap]');
      const second = await page.locator('.st-activity-text').textContent();
      assert.equal(first.raw[1].endsWith(second), true);
      await page.click('[data-st-timer]');
      await wait(1300);
      const timer = await page.evaluate(() => ({ pressed: document.querySelector('[data-st-timer]').getAttribute('aria-pressed'), label: document.querySelector('.st-timer-label').textContent }));
      assert.equal(timer.pressed, 'true');
      assert.match(timer.label, /^Còn (59|58) giây$/);
      assert.equal((await sotay(page)).tried[2], true);
      return { first, second, timer };
    });

    await check('Ga 3 → 4: Xong lá này đóng dấu, sang ga 4, dừng hẹn giờ', async () => {
      await page.click('[data-st-finish="done"]');
      await page.waitForFunction(() => window.GoiVietSoTay.inspect().step === 3, null, { timeout: 3000 });
      const info = await sotay(page);
      assert.equal(info.finished, 'done');
      assert.equal(info.timer, false);
      assert.equal(await page.locator('#soTayPlace').inputValue(), 'Hà Nội');
      return info;
    });

    await check('Ga 4: kiểm tra địa danh trống, lưu kỷ niệm lên bưu thiếp chơi thử', async () => {
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
        error: document.getElementById('soTayPlaceError').hidden
      }));
      assert.equal(info.note, 'Nam Định · Bát phở sáng chủ nhật cùng bà');
      assert.equal(info.place, 'Hà Nội');
      assert.equal(info.milestone, 'Tiến độ mốc 1 / 3');
      assert.equal(info.count, 'Kỷ niệm đã ghi: 1');
      assert.equal(info.error, true);
      assert.deepEqual((await sotay(page)).tried, [true, true, true, true]);
      return info;
    });

    await check('Ga cuối: 7 nút của bản đồ, vé đủ 4 dấu, phím ← →', async () => {
      await page.click('.st-next');
      const info = await page.evaluate(() => ({
        items: document.querySelectorAll('.st-kit li').length,
        marks: document.querySelectorAll('.st-screen [data-st-mark]').length,
        ready: document.querySelector('.st-ready').textContent,
        next: document.querySelector('.st-next-label').textContent,
        ticket: document.querySelector('.st-ticket-count').textContent
      }));
      assert.equal(info.items, 7);
      assert.equal(info.marks, 7);
      assert.equal(info.ready, 'Vé đã soát đủ bốn ga. Mời lên tàu!');
      assert.equal(info.next, 'Lên tàu');
      assert.equal(info.ticket, 'Đã soát 4/4');
      await page.locator('#soTayS5Title').focus();
      await page.keyboard.press('ArrowLeft');
      assert.equal((await sotay(page)).step, 3);
      await page.keyboard.press('ArrowRight');
      assert.equal((await sotay(page)).step, 4);
      await page.screenshot({ path: path.join(OUT, '1366-04-last.png') });
      return info;
    });

    await check('Không bố cục tràn ngang ở cả 5 ga (1366 × 768)', async () => {
      const result = [];
      for (let n = 0; n <= 4; n++) {
        await page.evaluate(i => window.GoiVietSoTay.goTo(i), n);
        await wait(650);
        const o = await overflow(page);
        assert.deepEqual(o.out, [], `stop ${n + 1}`);
        assert.ok(o.scroll <= o.client + 1, `stop ${n + 1} scrolls sideways`);
        result.push(o);
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

    await check('Lên tàu: dấu soát vé, màn che, vào bản đồ một lần', async () => {
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
      await p.screenshot({ path: path.join(OUT, '1920-en-board.png') });
      const o = await overflow(p);
      assert.deepEqual(o.out, []);
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
      return { en, vi };
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
    await check('Màn hẹp 390 × 844: một cột, cuộn dọc, không tràn ngang', async () => {
      const p = await open({ tag: '390', width: 390, height: 844 });
      await p.click('#memoryOpenGuide');
      await p.waitForFunction(() => window.GoiVietSoTay.inspect().open);
      const result = [];
      for (let n = 0; n <= 4; n++) {
        await p.evaluate(i => window.GoiVietSoTay.goTo(i), n);
        await wait(650);
        const o = await overflow(p);
        assert.deepEqual(o.out, [], `stop ${n + 1}`);
        result.push(o);
      }
      assert.equal(await p.locator('.st-next').isVisible(), true);
      await p.screenshot({ path: path.join(OUT, '390-last.png'), fullPage: false });
      return result;
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
