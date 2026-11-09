// GD6: differential functional check. Drives the same user-level script against two pages and diffs everything observable.
// node tools/perf/verify-gd6-functional.cjs [--a map-surroundings-preview-4.html] [--b map-surroundings-preview-5.html] [--cpu 1]
// Covers: place scope tabs, accent-less search, empty search, topic filters when present, place selection, memory save (place + note), 'R' recenter,
// Escape (deck modal, journey clear), music file choose, page errors. Observes only; nothing in the site is edited.
const { fs, path, launch, BASE, ROOT, os } = require('./lib.cjs');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const A = arg('a', 'map-surroundings-preview-4.html'), B = arg('b', 'map-surroundings-preview-5.html'), cpu = +arg('cpu', 1);
const outFile = path.join(ROOT, 'tools/perf/results/gd6', arg('out', 'functional.json'));

// 0.1 s of 8-bit mono 8 kHz silence as a WAV, enough for the file picker path
function wav() { const n = 800, b = Buffer.alloc(44 + n); b.write('RIFF', 0); b.writeUInt32LE(36 + n, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(8000, 24); b.writeUInt32LE(8000, 28); b.writeUInt16LE(1, 32); b.writeUInt16LE(8, 34); b.write('data', 36); b.writeUInt32LE(n, 40); b.fill(128, 44); return b; }

async function run(target) {
  const R = { target, steps: {}, errors: [] };
  const b = await launch('real'); const ctx = await b.newContext({ viewport: { width: 1707, height: 1067 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
  if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  page.on('pageerror', e => R.errors.push('pageerror: ' + String(e.message).slice(0, 200)));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|restoreContext/.test(m.text())) R.errors.push('console: ' + m.text().slice(0, 200)); });
  const ids = () => page.evaluate(() => Array.from(document.querySelectorAll('#demoPlaceList [id^="placeCard-"]')).map(e => e.id.replace('placeCard-', '')));
  const listText = () => page.evaluate(() => (document.getElementById('demoPlaceList').innerText || '').replace(/\s+/g, ' ').trim().slice(0, 400));
  const wait = ms => page.waitForTimeout(ms);

  await page.goto(BASE + target, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.GoiVietHomeIntro && document.getElementById('btnHomeOpeningStart') && !document.getElementById('btnHomeOpeningStart').disabled, null, { timeout: 600000 });
  await wait(800);

  // ---- music (home settings): choose a file and read the visible result
  const tmp = path.join(os.tmpdir(), 'gd6-silence.wav'); fs.writeFileSync(tmp, wav());
  try {
    await page.setInputFiles('#homeMusicFile', tmp); await wait(1500);
    R.steps.music = await page.evaluate(() => ({ name: document.getElementById('homeMusicName')?.textContent?.trim(), note: document.getElementById('homeMusicStorageNote')?.textContent?.trim().slice(0, 160), removeDisabled: document.getElementById('btnHomeMusicRemove')?.disabled, previewDisabled: document.getElementById('btnHomeMusicPreview')?.disabled, volume: document.getElementById('homeMusicVolume')?.value }));
  } catch (e) { R.steps.music = { error: String(e.message).slice(0, 160) }; }

  // ---- enter the map (same path as the perf flow)
  await page.click('#btnHomeOpeningStart');
  await page.waitForFunction(() => document.getElementById('introScreen').dataset.homeOpening === 'complete', null, { timeout: 180000 }); await wait(800);
  await page.evaluate(() => window.GoiVietMemoryChapter.begin()); await wait(1200);
  for (let i = 0; i < 8; i++) { await page.mouse.move(800, 600); await page.mouse.wheel(0, 200); await wait(100); }
  await page.evaluate(() => { document.getElementById('memoryOpenMap').scrollIntoView(); document.getElementById('memoryOpenMap').click(); });
  await page.waitForFunction(() => { const i = document.getElementById('introScreen'), c = document.getElementById('memoryMapTransition'); return i.classList.contains('intro-hidden') && c && !/is-(covering|waiting|revealing)/.test(c.className); }, null, { timeout: 240000 });
  await wait(1500);

  // ---- scope tabs
  R.steps.featured = { ids: await ids(), pressed: await page.evaluate(() => [document.getElementById('tabScopeFeatured').getAttribute('aria-pressed'), document.getElementById('tabScopeAll').getAttribute('aria-pressed')]) };
  await page.click('#tabScopeAll'); await wait(300);
  R.steps.all = { ids: await ids(), pressed: await page.evaluate(() => [document.getElementById('tabScopeFeatured').getAttribute('aria-pressed'), document.getElementById('tabScopeAll').getAttribute('aria-pressed')]) };

  // ---- search: accent-less, mixed case, 2-word, no result, then clear
  R.steps.search = {};
  for (const q of ['hue', 'HA NOI', 'ho chi minh', 'pho', 'banh', 'da lat', 'zzzzqq']) {
    await page.fill('#provSearchInput', q); await wait(250);
    R.steps.search[q] = { ids: await ids(), text: (await ids()).length ? undefined : await listText() };
  }
  await page.fill('#provSearchInput', ''); await wait(250);
  R.steps.search.cleared = { ids: await ids() };

  // ---- older previews still expose topic filters
  if (await page.locator('.topic-btn').count()) {
    R.steps.topics = {};
    for (const t of ['Ẩm thực', 'Nghệ thuật', 'Lễ hội', 'Nghề truyền thống', 'all']) {
      await page.click(`.topic-btn[data-topic="${t}"]`); await wait(250);
      R.steps.topics[t] = { ids: await ids(), pressed: await page.evaluate(() => Array.from(document.querySelectorAll('.topic-btn')).filter(b => b.getAttribute('aria-pressed') === 'true').map(b => b.dataset.topic)) };
    }
    await page.fill('#provSearchInput', 'hue'); await page.click('.topic-btn[data-topic="Lễ hội"]'); await wait(250);
    R.steps.searchPlusTopic = { ids: await ids() };
    await page.fill('#provSearchInput', ''); await page.click('.topic-btn[data-topic="all"]'); await wait(250);
  } else {
    R.steps.topics = { available: false };
  }

  // ---- select places by real clicks (first, a middle one, last), read selection + visible panel text
  R.steps.select = {};
  const allIds = await ids();
  for (const id of [allIds[0], allIds[Math.floor(allIds.length / 2)], allIds[allIds.length - 1], 'hue']) {
    const card = page.locator(`#placeCard-${id}`);
    await card.scrollIntoViewIfNeeded().catch(() => { });
    const row = card.locator('.place-compact-row');
    if (await row.count()) await row.click();
    else if (!(await card.evaluate(element => element.classList.contains('selected')))) await card.click();
    await wait(1800);
    R.steps.select[id] = await page.evaluate(id => {
      const c = document.getElementById('placeCard-' + id), list = document.getElementById('demoPlaceList');
      const sel = Array.from(list.querySelectorAll('.selected')).map(e => e.id);
      const cr = c.getBoundingClientRect();
      // the card must be reachable: inside the visible area of its scrollable ancestor
      let p = c.parentElement; while (p && p.scrollHeight <= p.clientHeight + 1) p = p.parentElement;
      const pr = p ? p.getBoundingClientRect() : { top: 0, bottom: innerHeight };
      return { openModals: Array.from(document.querySelectorAll('.modal-backdrop.open')).map(m => m.id), selectedState: state.selectedPlaceId, selectedCards: sel, pressed: c.getAttribute('aria-pressed'), cardInView: cr.top >= pr.top - 2 && cr.bottom <= pr.bottom + 2, hasDetail: !!document.querySelector('#demoPlaceList .place-detail, #placeDetail, .place-detail-card') };
    }, id);
    for (let k = 0; k < 3 && await page.evaluate(() => !!document.querySelector('.modal-backdrop.open')); k++) { await page.keyboard.press('Escape'); await wait(500); }
    R.steps.select[id].modalsAfterEscape = await page.evaluate(() => document.querySelectorAll('.modal-backdrop.open').length);
  }

  // ---- memory: save a place + note, read tracker and feedback
  // the memory form lives on the back face of a drawn conversation card: open the deck, draw (random card), flip, open the drawer
  await page.evaluate(() => { openDeckModal('hue'); }); await wait(600);
  await page.evaluate(() => triggerDrawCardWithAnim()); await wait(4500);
  R.steps.cardDrawn = await page.evaluate(() => ({ hasActive: !!state.activeCard, place: state.activeCardPlaceId, front: !!(document.getElementById('cardFrontState').style.display !== 'none'), remainingText: (document.getElementById('deckRemainingText') || {}).textContent }));
  await page.evaluate(() => flipCardToBack()); await wait(900);
  await page.evaluate(() => { let d = document.querySelector('#memoryBridgeBox'); while (d) { if (d.tagName === 'DETAILS') d.open = true; d = d.parentElement; } });
  await page.fill('#memoryPlaceInput', 'Đà Lạt'); await page.fill('#memoryNoteInput', 'Ly cà phê sáng sớm'); await wait(200);
  R.steps.memoryDraft = await page.evaluate(() => ({ draft: { ...state.memoryDraft, lastRecordedSig: undefined } }));
  await page.click('#btnSaveMemoryPlace'); await wait(900);
  R.steps.memorySaved = await page.evaluate(() => ({ list: state.mentionedPlaces.map(m => ({ name: m.name, note: m.note, status: m.status, hasContent: m.hasContent, demoPlaceId: m.demoPlaceId })), feedback: document.getElementById('memoryFeedbackBox').innerText.replace(/\s+/g, ' ').trim().slice(0, 300), placeInput: document.getElementById('memoryPlaceInput').value, noteInput: document.getElementById('memoryNoteInput').value }));
  // chip prefill + empty save message
  await page.click('.memory-chip-btn >> text=Huế'); await wait(150);
  R.steps.memoryChip = await page.evaluate(() => document.getElementById('memoryPlaceInput').value);
  await page.fill('#memoryPlaceInput', ''); await page.fill('#memoryNoteInput', ''); await page.click('#btnSaveMemoryPlace'); await wait(300);
  R.steps.memoryEmpty = await page.evaluate(() => ({ n: state.mentionedPlaces.length, feedback: document.getElementById('memoryFeedbackBox').innerText.trim().slice(0, 200) }));

  await page.keyboard.press('Escape'); await wait(500);
  // ---- 'R' recenter (focus outside inputs)
  await page.evaluate(() => { document.activeElement && document.activeElement.blur && document.activeElement.blur(); state.cam.targetPanX = 140; state.cam.targetPanY = -90; state.cam.targetZoom = 2.1; });
  await page.keyboard.press('r'); await wait(600);
  R.steps.recenter = await page.evaluate(() => ({ x: +state.cam.targetPanX.toFixed(2), y: +state.cam.targetPanY.toFixed(2), z: +state.cam.targetZoom.toFixed(3) }));
  // R while typing in an input must NOT recenter
  await page.evaluate(() => { state.cam.targetPanX = 77; });
  await page.focus('#provSearchInput'); await page.keyboard.type('r'); await wait(200);
  R.steps.rInInput = await page.evaluate(() => ({ panX: state.cam.targetPanX, value: document.getElementById('provSearchInput').value })); await page.fill('#provSearchInput', '');

  // ---- Escape: deck modal closes; journey clears when nothing is open
  await page.evaluate(() => { document.activeElement && document.activeElement.blur && document.activeElement.blur(); });
  const deckOk = await page.evaluate(() => { try { openDeckModal('hue'); return true; } catch (e) { return String(e.message); } }); await wait(500);
  const deckOpen = await page.evaluate(() => document.getElementById('deckModal').classList.contains('open'));
  await page.keyboard.press('Escape'); await wait(500);
  R.steps.escapeDeck = { opened: deckOk, openBefore: deckOpen, openAfter: await page.evaluate(() => document.getElementById('deckModal').classList.contains('open')) };
  await page.evaluate(() => selectDemoPlace('hue')); await wait(800);
  const jBefore = await page.evaluate(() => state.selectedPlaceId);
  await page.keyboard.press('Escape'); await wait(600);
  R.steps.escapeJourney = { before: jBefore, after: await page.evaluate(() => state.selectedPlaceId), journeyBar: await page.evaluate(() => { const b = document.querySelector('.journey-bar, #journeyBar, [data-journey-bar]'); return b ? getComputedStyle(b).display + '/' + (b.hidden ? 'hidden' : 'shown') : 'n/a'; }) };

  // ---- keyboard focus trap sanity inside a modal (Tab does not escape)
  await page.evaluate(() => { openDeckModal('hue'); }); await wait(500);
  for (let i = 0; i < 12; i++) await page.keyboard.press('Tab');
  R.steps.focusTrap = await page.evaluate(() => { const m = document.getElementById('deckModal'); return { open: m.classList.contains('open'), focusInside: m.contains(document.activeElement) }; });
  await page.keyboard.press('Escape'); await wait(300);

  await b.close(); return R;
}

function diff(a, b, p = '') {
  const out = [];
  if (JSON.stringify(a) === JSON.stringify(b)) return out;
  if (a && b && typeof a === 'object' && typeof b === 'object') { for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) out.push(...diff(a[k], b[k], p + '/' + k)); return out; }
  out.push(`${p}: ${JSON.stringify(a)} -> ${JSON.stringify(b)}`); return out;
}

(async () => {
  const ra = await run(A), rb = await run(B);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const d = diff(ra.steps, rb.steps);
  fs.writeFileSync(outFile, JSON.stringify({ a: ra, b: rb, diffs: d }, null, 1));
  console.log(`A=${A} errors=${ra.errors.length}  B=${B} errors=${rb.errors.length}`);
  console.log('steps compared: ' + Object.keys(ra.steps).join(', '));
  console.log(d.length ? 'DIFFERENCES:\n' + d.join('\n') : 'NO DIFFERENCES in observable behaviour');
  if (ra.errors.length || rb.errors.length) console.log('errors A:', ra.errors, '\nerrors B:', rb.errors);
})();
