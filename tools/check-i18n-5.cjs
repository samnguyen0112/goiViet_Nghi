// Preview-5 interface language checker (P5-03).
//   node tools/check-i18n-5.cjs          static: dictionary keys (VI/EN), markup keys, keys used in code
//   node tools/check-i18n-5.cjs --walk [--list]   (--list prints every content/geo leftover with its step) also opens preview-5 from disk with ?lang=en, walks the main flows and lists
//                                        every Vietnamese string still visible (text, aria-label/title/placeholder/alt,
//                                        canvas), and checks that VI→EN→VI leaves the Vietnamese page unchanged.
// Leftovers are grouped by source: "own" (preview-5 HTML or its -5 files: must be empty), "shared" (files preview 1–4
// also load: P5-03 slice 2), "content" (card/place data, slice 3: must be empty), "verse" (kept Vietnamese), "book" (P5-04). Proper names, the brand and user text are
// allowed. Exit code 1 when a static check fails, an own leftover remains or the VI round trip changes the page.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const ROOT = path.resolve(__dirname, '..');
const PAGE = 'map-surroundings-preview-5.html';
const VI = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/;
const html = fs.readFileSync(path.join(ROOT, PAGE), 'utf8');
const assets = [...new Set([...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))(?:\?[^"]*)?"/g)].map(m => m[1]).filter(u => !/^https?:/.test(u)))];
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const problems = [];
let walkBrowser = null;   // closed on failure too: an open browser would keep the process alive after an error
const fail = msg => { problems.push(msg); console.log('✗ ' + msg); };
const ok = msg => console.log('✓ ' + msg);

// ---------------------------------------------------------------- static checks
const sandbox = { window: {}, document: { addEventListener() {}, dispatchEvent() {}, querySelectorAll: () => [], documentElement: {} }, location: { search: '' }, localStorage: { getItem: () => null, setItem() {} }, URLSearchParams, CustomEvent: function () {} };
sandbox.window = sandbox;
vm.createContext(sandbox);
for (const rel of ['assets/goi-viet/map-surroundings-preview/i18n-5.js', 'assets/goi-viet/map-surroundings-preview/i18n-ui-5.js']) vm.runInContext(read(rel), sandbox, { filename: rel });
const I = sandbox.GoiVietI18n;
const lookup = (lang, key) => { I.setLang(lang, { remember: false }); const v = I.t(key); return v === key ? null : v; };
const markupKeys = new Set();
for (const m of html.matchAll(/\sdata-i18n(?:-label|-title|-placeholder|-alt)?="([^"]+)"/g)) m[1].split('|').filter(Boolean).forEach(k => markupKeys.add(k));
const ownFiles = assets.filter(a => /-5\.(js|css)$/.test(a) || a.includes('/books-5/'));
const noComments = src => src.replace(/\/\*[\s\S]*?\*\//g, '');
for (const a of ownFiles.filter(a => a.endsWith('.js'))) for (const m of noComments(read(a)).matchAll(/\sdata-i18n(?:-label|-title|-placeholder|-alt)?="([^"]+)"/g)) m[1].split('|').filter(Boolean).forEach(k => markupKeys.add(k));
// Keys set from script on created nodes: el.dataset.i18n = 'k1|k2' (also -label, -title …).
for (const a of ownFiles.filter(a => a.endsWith('.js'))) for (const m of noComments(read(a)).matchAll(/\.dataset\.i18n(?:Label|Title|Placeholder|Alt)?\s*=\s*'([^']+)'/g)) m[1].split('|').filter(Boolean).forEach(k => markupKeys.add(k));
const noEn = [...markupKeys].filter(k => !lookup('en', k));
noEn.length ? fail(`${noEn.length} markup keys have no English: ${noEn.slice(0, 8).join(', ')}`) : ok(`${markupKeys.size} markup keys (data-i18n…) all have English`);

const codeSources = [html, ...ownFiles.filter(a => a.endsWith('.js')).map(read)].join('\n');
const used = new Set();
for (const m of codeSources.matchAll(/\b(?:uiT|tr|T|i18n\.t|I\.t|GoiVietI18n\.t)\(\s*'([a-z][\w.-]*\.[\w.-]+)'/g)) used.add(m[1]);
for (const m of codeSources.matchAll(/\?\s*'((?:js|journey|ritual|cards|book)\.[\w.]+)'\s*:\s*'((?:js|journey|ritual|cards|book)\.[\w.]+)'/g)) { used.add(m[1]); used.add(m[2]); }
// T('key', 'Vietnamese fallback', …) in the preview-5 copies of shared files carries its Vietnamese in the code.
const withFallback = new Set([...codeSources.matchAll(/\bT\(\s*'([\w.-]+)'\s*,/g)].map(m => m[1]));
const missingVi = [...used].filter(k => !markupKeys.has(k) && !withFallback.has(k) && !lookup('vi', k));
const missingEn = [...used].filter(k => !lookup('en', k));
missingVi.length ? fail(`${missingVi.length} keys used in code have no Vietnamese: ${missingVi.slice(0, 8).join(', ')}`) : ok(`${used.size} keys used in code have Vietnamese`);
missingEn.length ? fail(`${missingEn.length} keys used in code have no English: ${missingEn.slice(0, 8).join(', ')}`) : ok(`${used.size} keys used in code have English`);
// Labels attached to data (topic., activityKind., pawn.) are English-only by design: their Vietnamese is the data.
// …and so are keys read with T(key, fallback) (the Vietnamese fallback sits in the code) and the home prompts
// (homeq., registered from memory-reference-5.js at run time).
const mismatch = I.missing().filter(k => !markupKeys.has(k) && !withFallback.has(k) && !/^(topic|activityKind|pawn|homeq)\./.test(k));
mismatch.length ? fail(`${mismatch.length} dictionary keys exist in only one language: ${mismatch.slice(0, 8).join(', ')}`) : ok('every dictionary key that is not markup has both languages');

// ---------------------------------------------------------------- walk (browser)
async function walk() {
  const { launch } = require('./perf/lib.cjs');
  const target = pathToFileURL(path.join(ROOT, PAGE)).href;
  const b = walkBrowser = await launch('real');
  const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, reducedMotion: 'reduce' });
  await ctx.addInitScript(src => {
    const re = new RegExp(src); window.__canvasVi = new Set();
    for (const C of [window.CanvasRenderingContext2D, window.OffscreenCanvasRenderingContext2D].filter(Boolean)) for (const fn of ['fillText', 'strokeText']) {
      const orig = C.prototype[fn];
      C.prototype[fn] = function (text, ...rest) { if (typeof text === 'string' && re.test(text)) window.__canvasVi.add(text.trim()); return orig.call(this, text, ...rest); };
    }
  }, VI.source);
  const errors = [];
  const open = async query => {
    const p = await ctx.newPage();
    p.on('pageerror', e => errors.push(String(e.message).slice(0, 160)));
    await p.route(/^https?:/, r => r.abort());
    await p.goto(target + query, { waitUntil: 'load', timeout: 600000 });
    await p.waitForFunction(() => window.GoiVietHomeIntro && window.GoiVietBooks && document.querySelector('#station-pick-hn'), null, { timeout: 600000 });
    await p.waitForTimeout(1200);
    return p;
  };
  // Draw a card from the open deck with the keyboard. The page ignores a keypress while the deck is still settling
  // (draw() returns early), so press once more before failing; once a draw has started, wait for it however slow.
  const drawCard = async p => {
    for (let attempt = 0; attempt < 2; attempt++) {
      await p.locator('#fannedDeckBox .fanned-card:enabled').first().focus(); await p.keyboard.press('Enter');
      const started = await p.waitForFunction(() => state.activeCard || state.isDrawingCardLock, null, { timeout: 5000 }).then(() => true, () => false);
      if (started) { await p.waitForFunction(() => state.activeCard, null, { timeout: 120000 }); return; }
    }
    throw new Error('no card opened after pressing Enter twice on the fanned deck');
  };
  const collect =p => p.evaluate(src => {
    const re = new RegExp(src);
    const shown = el => { for (let e = el; e && e !== document.body; e = e.parentElement) { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false; } const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth && !el.closest('[aria-hidden="true"],[inert],[hidden]'); };
    const out = new Set();
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) { const t = n.nodeValue.replace(/\s+/g, ' ').trim(); const el = n.parentElement; if (t && re.test(t) && el && !el.closest('script,style,template,input,textarea') && shown(el)) out.add(t); }
    for (const el of document.querySelectorAll('[aria-label],[title],[placeholder],img[alt]')) if (shown(el)) for (const a of ['aria-label', 'title', 'placeholder', 'alt']) { const v = el.getAttribute(a); if (v && re.test(v)) out.add(v.replace(/\s+/g, ' ').trim()); }
    for (const t of window.__canvasVi) out.add(t); window.__canvasVi.clear();
    return [...out];
  }, VI.source);

  // VI round trip on the map with a card open.
  const p = await open('');
  await p.evaluate(() => { window.GoiVietHomeIntro.skip(); closeIntroModal(); }); await p.waitForTimeout(800);
  await p.click('#station-pick-hn'); await p.click('#deck-open-hn'); await p.waitForSelector('#deckModal.open');
  await drawCard(p); await p.waitForTimeout(800);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);
  const dump = () => p.evaluate(() => { const t = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); for (let n = w.nextNode(); n; n = w.nextNode()) if (!n.parentElement.closest('script,style')) t.push(n.nodeValue); return t.join('\u0001') + '\u0002' + Array.from(document.querySelectorAll('[aria-label],[title],[placeholder],[alt]')).map(e => ['aria-label', 'title', 'placeholder', 'alt'].map(a => e.getAttribute(a) || '').join('|')).join('\u0001'); });
  const before = await dump();
  await p.click('.gv-lang-toggle-header [data-set-lang="en"]'); await p.waitForTimeout(400);
  await p.click('.gv-lang-toggle-header [data-set-lang="vi"]'); await p.waitForTimeout(400);
  const after = await dump();
  before === after ? ok('VI → EN → VI leaves the Vietnamese page unchanged (card open in the background)') : fail('VI → EN → VI changed the Vietnamese page');
  // Switching while the page runs (decorating scripts have already touched the labels) must reach the same result.
  const seen = new Map();
  await p.click('.gv-lang-toggle-header [data-set-lang="en"]');
  // A screen-reader message announced before the switch is not read again: it is not a leftover.
  await p.evaluate(() => { window.__canvasVi.clear(); requestMapRender(4); document.getElementById('srAnnouncer').textContent = ''; }); await p.waitForTimeout(500);
  for (const s of await collect(p)) if (!seen.has(s)) seen.set(s, 'switched VI→EN on the map');
  await p.close();

  // English walk.
  const e = await open('?lang=en&sach=nhap');
  const step = async label => { for (const s of await collect(e)) if (!seen.has(s)) seen.set(s, label); };
  await step('home');
  await e.click('#homeMusicSettings > summary'); await e.waitForTimeout(300); await step('home music'); await e.click('#homeMusicSettings > summary');
  await e.click('#btnHomeExploreMemory').catch(() => {}); await e.waitForTimeout(1500); await step('memory chapter');
  await e.click('#memoryNextCard').catch(() => {}); await e.waitForTimeout(1500); await step('memory prompt');
  await e.evaluate(() => { window.GoiVietHomeIntro.skip(); closeIntroModal(); }); await e.waitForTimeout(800); await step('map');
  await e.click('#station-pick-hn'); await e.waitForTimeout(400); await step('station');
  await e.click('#headerSettings summary'); await e.waitForTimeout(300); await step('settings');
  await e.click('#mapSources > summary').catch(() => {}); await e.waitForTimeout(300);
  await e.click('#mapSources .settings-source-details > summary').catch(() => {}); await e.waitForTimeout(300); await step('map sources');
  await e.keyboard.press('Escape');
  await e.click('#stationJournalToggle'); await step('journal'); await e.click('#stationJournalToggle');
  await e.fill('#provSearchInput', 'hue'); await e.click('#station-pick-hue'); await e.click('#station-journey-hue');
  await e.waitForFunction(() => !window.GoiVietJourneyPreview.isMoving() && !document.querySelector('#journeyRouteBar .journey-arrival-detail')?.hidden, null, { timeout: 60000 }); await step('arrival');
  await e.click('#journeyRouteBar .journey-arrival-deck'); await e.waitForSelector('#deckModal.open'); await e.waitForTimeout(500); await step('deck');
  await drawCard(e); await e.waitForTimeout(800); await step('card front');
  await e.click('#btnAskFamilyHint'); await e.waitForTimeout(300); await step('family hint');
  await e.click('#btnDontKnowReveal'); await e.waitForTimeout(600); await step('card back');
  await e.click('#memoryDetailsDrawer summary'); await e.fill('#memoryPlaceInput', 'Huế'); await e.click('#btnSaveMemoryPlace'); await e.waitForTimeout(300); await step('memory saved');
  await e.click('#btnCompleteCardTurn'); await e.waitForSelector('#deckModal.open', { state: 'hidden' }); await e.waitForTimeout(500); await step('turn done');
  await e.keyboard.press('Escape');
  await e.click('button.craft-btn-red[onclick="openBambooRollModal()"]'); await e.waitForSelector('#bambooRollModal.open'); await step('bamboo');
  await e.click('#ritualDrawButton'); await e.waitForSelector('#bambooRollModal [data-ritual-action="story"]', { state: 'visible' }); await step('bamboo result');
  await e.keyboard.press('Escape'); await e.waitForTimeout(300);
  await e.evaluate(() => openPostcardModal()); await e.waitForTimeout(1200); await step('postcard'); await e.keyboard.press('Escape');
  await e.evaluate(() => window.GoiVietBooks.open('dn')); await e.waitForTimeout(600); await step('coming soon'); await e.evaluate(() => window.GoiVietBooks.close());
  await e.evaluate(() => window.GoiVietBooks.open('hn')); await e.waitForFunction(() => window.GoiVietBooks.inspect().kind === 'book'); await step('book'); await e.evaluate(() => window.GoiVietBooks.close());
  await e.click('#btnIslandHoangSa'); await e.waitForTimeout(800); await step('islands');
  await e.evaluate(() => window.GoiVietNaturalLandscape.openDetail('hoang-sa', document.body));
  await e.waitForSelector('#naturalIslandModal.open', { timeout: 20000 }).catch(() => {}); await e.waitForTimeout(1500); await step('island detail');
  await e.keyboard.press('Escape');
  // Proper names: the English names and highlights, and the Vietnamese names without "Tỉnh" / "Thành phố" / "TP.".
  const names = await e.evaluate(() => ALL_PLAYABLE_PLACES.flatMap(p => {
    const vi = f => (window.GoiVietContent ? window.GoiVietContent.vi(p, f) : p[f]) || '';
    return [p.name, p.short, ...Object.values(p.highlights || {}), vi('short').replace(/^TP\.\s*/, ''), vi('name').replace(/^(Thành phố|Tỉnh|Quần đảo)\s+/, '').replace(/\s*\([^()]*\)$/, '')];
  }).filter(Boolean));
  await b.close();

  // Classify by source.
  const norm = t => t.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ');
  const dataLine = norm(html.split(/\r?\n/).find(l => l.startsWith('const ALL_DECKS_MAP = ')) || '');
  const verses = norm((html.match(/const FOLK_VERSES_BY_ID[\s\S]*?function getFolkVerseForPlace[\s\S]*?\n}/) || [''])[0]);
  // Book texts are content too (their English arrives with each book, P5-04).
  const books = fs.readdirSync(path.join(ROOT, 'assets/goi-viet/books-5')).filter(d => fs.existsSync(path.join(ROOT, 'assets/goi-viet/books-5', d, 'book.js'))).map(d => norm(read(`assets/goi-viet/books-5/${d}/book.js`))).join(' ');
  const pages = fs.readdirSync(ROOT).filter(f => f.endsWith('.html') && f !== PAGE).map(f => fs.readFileSync(path.join(ROOT, f), 'utf8'));
  const shared = assets.filter(a => !ownFiles.includes(a) && fs.existsSync(path.join(ROOT, a)) && pages.some(pg => pg.includes(path.basename(a)))).map(a => [a.replace('assets/goi-viet/', ''), norm(read(a))]);
  // English content (content-en-5.js) keeps Vietnamese proper names with their diacritics: its texts are allowed whole,
  // and so is the start of one cut with "…" (postcard).
  const contentSrc = read('assets/goi-viet/map-surroundings-preview/content-en-5.js');
  const enTable = JSON.parse(contentSrc.match(/const EN = (\{[\s\S]*?\n {2}\});/)[1]);
  const glossTable = JSON.parse(contentSrc.match(/const GLOSS = (\{[\s\S]*?\n {2}\});/)[1]);
  const geoTable = JSON.parse(contentSrc.match(/const GEO = (\{[\s\S]*?\n {2}\});/)[1]);
  // The English captions of the community postcards keep Vietnamese names with their diacritics in the same way.
  const postcardEn = [...read('assets/goi-viet/books-5/community-postcards-5.js').matchAll(/"en": "([^"]+)"/g)].map(m => m[1]);
  const enValues = [...Object.values(enTable), ...Object.values(glossTable.byId), glossTable.none, ...Object.values(geoTable.exact), ...postcardEn].sort((x, y) => y.length - x.length);
  const allowed = [...enValues, ...names.sort((x, y) => y.length - x.length), 'Gói Việt', 'GÓI VIỆT', 'lục bát', 'Ngôn ngữ · Language', 'Tiếng Việt', 'Huế', 'Hà Nội', 'Sài Gòn', 'HÀ NỘI', 'HUẾ', 'SÀI GÒN', 'Hoàng Sa', 'Trường Sa', 'HOÀNG SA', 'TRƯỜNG SA', 'Vũ Đại', 'Nam Định', 'Đà Lạt', 'Xuân La'];
  // The map wraps long province names over two lines and draws each word apart ("Thanh" / "Hóa").
  const nameWords = new Set(names.flatMap(n => n.split(/\s+/)));
  const onlyAllowed = s => {
    if (!/\s/.test(s) && nameWords.has(s)) return true;
    const cut = s.replace(/…$/, '');
    if (cut !== s && cut.length > 12 && enValues.some(v => v.includes(cut))) return true;
    let r = s; for (const a of allowed) r = r.split(a).join(''); return !VI.test(r);
  };
  // Map geography (countries, seas, archipelagos, islands; plan point 7). A Vietnamese feature word or country name
  // left in English is a leftover (GEO); island names themselves keep their Vietnamese spelling, alone ("Tri Tôn") or
  // with an English feature word ("Phú Lâm – Đá Island", "HOÀNG SA (PARACEL) ISLANDS").
  const GEO = /^(QUẦN ĐẢO|Quần đảo|ĐẢO|Đảo|LÀO|Lào|THÁI LAN|CAMPUCHIA|TRUNG QUỐC|BIỂN ĐÔNG|Biển Đông|VỊNH|Cồn|Đá|Bãi|Rạn|Đất nổi)(\s|$)/u;
  const islandData = norm(read('assets/goi-viet/map-surroundings-preview/natural/islands-data.js') + read('assets/goi-viet/map-surroundings-preview/natural/island-chart-5.js'));
  const mapNames = islandData + ' ' + norm(html.split(/\r?\n/).find(l => l.startsWith('const DATA = ')) || '');
  const properMapName = s => s.split(/\s+[–&·-]\s+/).every(part => {
    const bare = part.replace(/\s+(Island|Islands|Reef|Cay|Bank|ISLAND|ISLANDS)$/u, '').replace(/\s*\((PARACEL|SPRATLY|EAST SEA|Paracel|Spratly|East Sea)\)/u, '').trim();
    // A lone word is the name itself ("Đảo Đá" → "Đá Island").
    return !VI.test(bare) || ((!GEO.test(bare) || !/\s/.test(bare)) && (mapNames.includes(bare) || mapNames.toLowerCase().includes(bare.toLowerCase()) || nameWords.has(bare)));
  });
  // The verse written for a station without its own verse (getFolkVerseForPlace): content, plan point 8.
  const VERSE = /^Ghé thăm .+ thân thương,$|^Nhớ .+, vấn vương .+\.$/u;
  const probe = s => [s, ...s.split(/\s*[·•:—–|]\s*|\(|\)|\d+/).map(x => x.trim()).filter(x => x.length > 3).sort((x, y) => y.length - x.length), s.split(' ').slice(0, 2).join(' ')].filter(x => x.length > 3);
  // Verses stay Vietnamese by design (an English gloss follows them); book texts get their English with each book (P5-04).
  const groups = { own: [], shared: {}, content: [], verse: [], book: [], geo: [] };
  for (const [s, where] of seen) {
    if (onlyAllowed(s)) continue;
    if (GEO.test(s)) { groups.geo.push(s); continue; }
    if (islandData.includes(s) || properMapName(s)) continue;
    if (VERSE.test(s) || probe(s).some(x => verses.includes(x))) { groups.verse.push(s); continue; }
    if (books.includes(s) || probe(s).some(x => books.includes(x)) && !probe(s).some(x => dataLine.includes(x))) { groups.book.push(s); continue; }
    if (probe(s).some(x => dataLine.includes(x))) { groups.content.push(`${s}  (${where})`); continue; }
    const hit = shared.find(([, t]) => probe(s).some(x => t.includes(x)));
    if (hit) { (groups.shared[hit[0]] = groups.shared[hit[0]] || []).push(s); continue; }
    groups.own.push(`${s}  (${where})`);
  }
  const sharedCount = Object.values(groups.shared).flat().length;
  groups.own.length ? fail(`${groups.own.length} Vietnamese strings from preview-5's own files on the English walk:\n    ` + groups.own.slice(0, 20).join('\n    ')) : ok('no Vietnamese left from preview-5\'s own files on the English walk');
  console.log(`· pending slice 2 (shared files): ${sharedCount} strings in ${Object.keys(groups.shared).length} files`);
  for (const [f, l] of Object.entries(groups.shared)) console.log(`    ${f}: ${l.slice(0, 3).join(' ‖ ').slice(0, 130)}`);
  groups.content.length ? fail(`${groups.content.length} station/card texts without English (tools/content-en-5/tables.cjs, then node tools/build-content-en-5.cjs):\n    ` + groups.content.slice(0, 20).join('\n    ')) : ok('station and card content all in English');
  console.log(`· verses kept in Vietnamese (with an English gloss): ${groups.verse.length} lines`);
  console.log(`· book texts (English with each book, P5-04): ${groups.book.length} strings`);
  groups.geo.length ? fail(`${groups.geo.length} map names with a Vietnamese feature word (GEO in tools/content-en-5/tables.cjs): ${groups.geo.slice(0, 8).join(' ‖ ')}`) : ok('map names: feature words in English, names in Vietnamese spelling');
  if (process.argv.includes('--list')) for (const [k, l] of [['verse', groups.verse], ['book', groups.book], ['geo', groups.geo]]) for (const x of l) console.log(`    [${k}] ${x}  (${seen.get(x)})`);
  errors.length ? fail(`page errors: ${errors.join(' | ')}`) : ok('no page errors');
}

(async () => {
  if (process.argv.includes('--walk')) await walk();
  console.log(problems.length ? `\nFAIL: ${problems.length} problem(s)` : '\nPASS');
  process.exitCode = problems.length ? 1 : 0;
})().catch(async e => { console.error(e); console.log('\nFAIL: the walk stopped with an error'); process.exitCode = 1; if (walkBrowser) await walkBrowser.close().catch(() => {}); });
