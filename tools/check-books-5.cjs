// Preview-5 culture books: check book content before it is published (P5-01).
//   node tools/check-books-5.cjs                      every book in catalog-5.js plus the _mau template
//   node tools/check-books-5.cjs --book <path/book.js> [--status draft|published]   one book outside the catalog
//   add --render to also lay out every page in the browser and report text that overflows (needs tools/perf/server.cjs)
// Rules: a "published" book must pass everything in Vietnamese AND English; for a "draft" the same findings are
// warnings, except structural errors (bad ids, unknown layout, missing art file, wrong image size) which always fail.
// Exit code 1 when any error is found. Reads files only.
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const BOOKS = path.join(ROOT, 'assets/goi-viet/books-5');
const L = require(path.join(BOOKS, 'layouts-5.js'));
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const RENDER = process.argv.includes('--render');

// ---------- loading
function loadCatalog() {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(BOOKS, 'catalog-5.js'), 'utf8'), sandbox, { filename: 'catalog-5.js' });
  return sandbox.window.GoiVietBookCatalog || {};
}
function loadBook(file) {
  let book = null;
  const sandbox = { GoiVietBooks: { register: b => { book = b; } } };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file });
  return book;
}
function cardIds() {
  const html = fs.readFileSync(path.join(ROOT, 'map-surroundings-preview-5.html'), 'utf8');
  const line = html.split('\n').find(l => l.startsWith('const ALL_DECKS_MAP = '));
  if (!line) return null;
  const decks = JSON.parse(line.slice('const ALL_DECKS_MAP = '.length).replace(/;\s*$/, ''));
  return new Set(Object.values(decks).flatMap(p => (p.cards || []).map(c => c.id)));
}
// Width/height from the file header (WebP, PNG, JPEG).
function imageSize(file) {
  const b = fs.readFileSync(file);
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const kind = b.toString('ascii', 12, 16);
    if (kind === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
    if (kind === 'VP8L') { const v = b.readUInt32LE(21); return { w: (v & 0x3fff) + 1, h: ((v >> 14) & 0x3fff) + 1 }; }
    if (kind === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
  }
  if (b.readUInt32BE(0) === 0x89504e47) return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const m = b[i + 1], len = b.readUInt16BE(i + 2);
      if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5) };
      i += 2 + len;
    }
  }
  return null;
}

// ---------- checking one book
const len = v => [].concat(v || []).join(' ').length;
const has = v => v != null && v !== '' && !(Array.isArray(v) && !v.some(Boolean));

function checkBook({ key, file, status, decks }) {
  const errors = [], warnings = [], info = [];
  const strict = status === 'published';
  const E = m => errors.push(m), W = m => (strict ? errors : warnings).push(m);
  let book;
  try { book = loadBook(file); } catch (e) { E(`không đọc được tệp: ${e.message}`); return { errors, warnings, info }; }
  if (!book) { E('tệp không gọi GoiVietBooks.register(...)'); return { errors, warnings, info }; }
  const dir = path.dirname(file);
  if (key && book.placeId !== key) E(`placeId "${book.placeId}" khác mã trong danh mục "${key}"`);
  for (const [field, need] of [['title', true], ['subtitle', false], ['runningHead', false]]) {
    const v = book[field] || {};
    if (!has(v.vi)) (need ? E : W)(`${field}.vi đang trống`);
    if (!has(v.en)) W(`${field}.en đang trống`);
  }
  if (book.title && len(book.title.vi) > L.LAYOUTS.cover.fields.title) W(`title.vi dài ${len(book.title.vi)} > ${L.LAYOUTS.cover.fields.title} ký tự`);
  if (!['fiction', 'documentary', 'community'].includes(book.kind)) W(`kind "${book.kind}" không thuộc fiction | documentary | community`);
  const back = (book.back && book.back.text) || {};
  for (const lang of ['vi', 'en']) {
    if (!has(back[lang])) W(`back.text.${lang} đang trống`);
    else if (len(back[lang]) > L.LAYOUTS.back.fields.text) W(`back.text.${lang} dài ${len(back[lang])} > ${L.LAYOUTS.back.fields.text} ký tự`);
  }

  // art dictionary
  const art = book.art || {};
  const usedArt = new Set();
  for (const [id, a] of Object.entries(art)) {
    if (!a || !a.file) { E(`art.${id}: thiếu file`); continue; }
    const f = path.join(dir, a.file);
    if (!fs.existsSync(f)) { E(`art.${id}: không có tệp ${a.file}`); continue; }
    const size = imageSize(f);
    if (!size) E(`art.${id}: không đọc được kích thước ảnh ${a.file} (dùng WebP, PNG hoặc JPEG)`);
    else if (size.w !== a.w || size.h !== a.h) E(`art.${id}: khai báo ${a.w}×${a.h} nhưng tệp là ${size.w}×${size.h}`);
    if (a.hi) {
      const fh = path.join(dir, a.hi);
      if (!fs.existsSync(fh)) E(`art.${id}: không có bản nét ${a.hi}`);
      else { const s2 = imageSize(fh); if (s2 && size && Math.abs(s2.w / s2.h - size.w / size.h) > 0.01) E(`art.${id}: bản nét ${a.hi} khác tỉ lệ bản thường`); }
    } else W(`art.${id}: chưa có bản nét (hi) cho màn hình lớn và phóng to`);
    if (size && Math.max(size.w, size.h) < 1200) W(`art.${id}: cạnh dài ${Math.max(size.w, size.h)} px < 1200 px, sẽ mờ trên máy chiếu lớn`);
    for (const lang of ['vi', 'en']) if (!has(a.alt && a.alt[lang])) W(`art.${id}: thiếu mô tả ảnh alt.${lang}`);
  }
  const needArt = (where, id, spec) => {
    if (!id) { W(`${where}: chưa có tranh (khung ${spec.art.ratioLabel})`); return; }
    usedArt.add(id);
    const a = art[id];
    if (!a) { E(`${where}: art "${id}" không có trong book.art`); return; }
    if (spec.art.fit === 'cover' && a.w && a.h) {
      const r = a.w / a.h, want = spec.art.ratio, dev = Math.abs(Math.log(r / want));
      if (dev > 0.25) W(`${where}: tranh "${id}" tỉ lệ ${r.toFixed(2)} lệch nhiều so với khung ${spec.art.ratioLabel} (${want}); phần ngoài khung sẽ bị cắt`);
    }
  };
  needArt('bìa trước', book.cover && book.cover.art, L.spec('cover'));

  // sections and pages
  const pageIds = new Set(), sectionIds = new Set(), sourceIds = new Set((book.sources || []).map(s => s.id));
  if (!Array.isArray(book.sections) || !book.sections.length) E('chưa có phần (sections) nào');
  let pages = 0;
  for (const [si, s] of (book.sections || []).entries()) {
    const sw = `phần ${si + 1}${s.id ? ' (' + s.id + ')' : ''}`;
    if (!s.id) E(`${sw}: thiếu id`); else if (sectionIds.has(s.id)) E(`${sw}: id trùng`); else sectionIds.add(s.id);
    for (const f of ['label', 'title']) { if (!has(s[f] && s[f].vi)) E(`${sw}: ${f}.vi trống`); if (!has(s[f] && s[f].en)) W(`${sw}: ${f}.en trống`); }
    for (const c of s.cardIds || []) if (decks && !decks.has(c)) E(`${sw}: cardIds có "${c}" không tồn tại trong bộ thẻ`);
    if (!(s.pages || []).length) E(`${sw}: chưa có trang nào`);
    for (const p of s.pages || []) {
      pages++;
      const pw = `trang ${p.id || '(không id)'}`;
      if (!p.id) E(`${pw}: thiếu id`); else if (pageIds.has(p.id)) E(`${pw}: id trùng`); else pageIds.add(p.id);
      if (!L.PAGE_LAYOUTS.includes(p.layout)) { E(`${pw}: bố cục "${p.layout}" không thuộc ${L.PAGE_LAYOUTS.join(', ')}`); continue; }
      const base = L.LAYOUTS[p.layout];
      if (base.variants && p.variant && !base.variants[p.variant]) { E(`${pw}: variant "${p.variant}" không thuộc ${Object.keys(base.variants).join(', ')}`); continue; }
      const spec = L.spec(p.layout, p.variant);
      if (spec.art) needArt(pw, p.art, spec);
      else if (p.art) W(`${pw}: bố cục ${p.layout} không có ô tranh, art "${p.art}" bị bỏ qua`);
      const required = { opener: ['body'], 'art-text': ['body'], 'text-quote': ['body'], 'full-art': ['caption'], notes: ['body'] }[p.layout];
      for (const lang of ['vi', 'en']) {
        const t = (p.text || {})[lang];
        if (!t) { (lang === 'vi' ? W : W)(`${pw}: chưa có chữ ${lang.toUpperCase()}`); continue; }
        for (const k of Object.keys(t)) if (!(k in spec.fields)) W(`${pw}: ô "${k}" không có trong bố cục ${p.layout}`);
        for (const r of required) if (!has(t[r])) W(`${pw}: ô ${r} (${lang}) trống`);
        if (t.body != null && !Array.isArray(t.body)) E(`${pw}: body (${lang}) phải là danh sách đoạn ["…", "…"]`);
        for (const [k, max] of Object.entries(spec.fields)) if (has(t[k]) && len(t[k]) > max) W(`${pw}: ${k} (${lang}) dài ${len(t[k])} > ${max} ký tự`);
      }
      for (const id of p.sources || []) if (!sourceIds.has(id)) E(`${pw}: nguồn "${id}" không có trong sources`);
    }
  }
  for (const s of book.sources || []) {
    if (!s.id) E('sources: có nguồn thiếu id');
    if (!has(s.title && (s.title.vi || s.title))) E(`sources.${s.id}: thiếu title`);
    try { const u = new URL(s.url); if (!/^https?:$/.test(u.protocol)) E(`sources.${s.id}: url phải bắt đầu bằng http(s)`); if (/example\.(org|com)/.test(u.host)) W(`sources.${s.id}: url còn là ví dụ ${u.host}`); } catch (e) { W(`sources.${s.id}: thiếu hoặc sai url`); }
  }
  for (const [lang, edition] of Object.entries(book.editions || {})) {
    if (!['vi', 'en'].includes(lang) || !Array.isArray(edition?.spreads)) {
      E(`editions.${lang}: mã ngôn ngữ hoặc danh sách trang đôi không hợp lệ`);
      continue;
    }
    if (edition.spreads.length > Math.ceil(pages / 2)) E(`editions.${lang}: có nhiều trang đôi hơn bản văn`);
    const entries = edition.spreads.map((file, index) => [`trang đôi ${index + 1}`, file]);
    if (edition.cover != null) entries.unshift(['bìa', edition.cover]);
    for (const [label, file] of entries) {
      const where = `editions.${lang} · ${label}`;
      if (typeof file !== 'string' || !file || !fs.existsSync(path.join(dir, file))) { E(`${where}: thiếu tệp ảnh ${file || ''}`); continue; }
      const size = imageSize(path.join(dir, file));
      if (!size || (label !== 'bìa' && Math.abs(size.w / size.h - 1.5) > .01)) E(`${where}: ảnh trang đôi phải có tỷ lệ 3:2`);
    }
  }
  for (const id of Object.keys(art)) if (!usedArt.has(id)) info.push(`art.${id} khai báo nhưng không trang nào dùng`);
  info.push(`${book.sections ? book.sections.length : 0} phần, ${pages} trang${pages % 2 ? ' (lẻ: trình đọc thêm 1 trang trắng cuối)' : ''}, ${Object.keys(art).length} tranh`);
  return { errors, warnings, info, book };
}

// ---------- render check (overflow) in the real page
async function renderCheck(targets) {
  const { launch, BASE } = require('./perf/lib.cjs');
  const b = await launch('real');
  const page = await (await b.newContext({ viewport: { width: 1600, height: 1000 } })).newPage();
  await page.goto(`${BASE}map-surroundings-preview-5.html?sach=nhap`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction(() => window.GoiVietBooks, null, { timeout: 600000 });
  await page.evaluate(() => document.fonts.ready);
  const out = {};
  for (const t of targets) {
    if (!t.result.book) continue;
    out[t.name] = {};
    for (const lang of ['vi', 'en']) {
      const book = JSON.parse(JSON.stringify(t.result.book));
      book._base = path.relative(ROOT, path.dirname(t.file)).split(path.sep).join('/') + '/';
      const rows = await page.evaluate(([bk, lg]) => window.GoiVietBooks.measure(bk, lg), [book, lang]);
      out[t.name][lang] = rows.filter(r => r.overflow || r.fit < 1);
    }
  }
  await b.close();
  return out;
}

(async () => {
  const decks = cardIds();
  const targets = [];
  const single = arg('book');
  if (single) targets.push({ name: path.relative(ROOT, path.resolve(single)), file: path.resolve(single), key: null, status: arg('status', 'draft') });
  else {
    const cat = loadCatalog();
    for (const [key, e] of Object.entries(cat)) targets.push({ name: key, file: path.join(ROOT, e.src), key, status: e.status === 'published' ? 'published' : 'draft' });
    targets.push({ name: '_mau (tập mẫu)', file: path.join(BOOKS, '_mau/book.js'), key: '_mau', status: 'draft' });
  }
  let errorCount = 0;
  for (const t of targets) {
    if (!fs.existsSync(t.file)) { console.log(`\n■ ${t.name}: KHÔNG CÓ TỆP ${path.relative(ROOT, t.file)}`); errorCount++; continue; }
    t.result = checkBook({ key: t.key, file: t.file, status: t.status, decks });
    const r = t.result;
    errorCount += r.errors.length;
    console.log(`\n■ ${t.name} [${t.status}] — ${r.errors.length} lỗi, ${r.warnings.length} cảnh báo · ${r.info[r.info.length - 1] || ''}`);
    for (const m of r.errors) console.log('  ✗ ' + m);
    const shown = r.warnings.slice(0, 12);
    for (const m of shown) console.log('  ! ' + m);
    if (r.warnings.length > shown.length) console.log(`  … và ${r.warnings.length - shown.length} cảnh báo khác`);
    for (const m of r.info.slice(0, -1)) console.log('  · ' + m);
  }
  if (RENDER) {
    console.log('\n— Dựng thử từng trang trong trình duyệt (khổ trang 600 px, cỡ chữ co tối đa ' + Math.round(L.MIN_FIT * 100) + ' %):');
    const res = await renderCheck(targets);
    for (const t of targets) {
      if (!res[t.name]) continue;
      for (const lang of ['vi', 'en']) {
        const rows = res[t.name][lang];
        const over = rows.filter(r => r.overflow), shrunk = rows.filter(r => !r.overflow);
        const msg = `${t.name} ${lang.toUpperCase()}: ${over.length} trang tràn chữ` + (shrunk.length ? `, ${shrunk.length} trang phải co chữ (${shrunk.map(r => r.id + ' ' + Math.round(r.fit * 100) + '%').join(', ')})` : '');
        if (over.length) {
          console.log('  ' + (t.status === 'published' ? '✗ ' : '! ') + msg + ' → ' + over.map(r => r.id).join(', '));
          if (t.status === 'published') errorCount += over.length;
        } else console.log('  ✓ ' + msg);
      }
    }
  }
  console.log(`\n${errorCount ? '✗ ' + errorCount + ' lỗi' : '✓ Không có lỗi'}${single ? '' : ' (tập nháp chỉ báo cảnh báo cho phần nội dung chưa đủ)'}`);
  process.exit(errorCount ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
