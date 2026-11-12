/* Preview-5: minimal bilingual core (P5-01). New interfaces read their labels through GoiVietI18n.t();
   the existing interface keeps its Vietnamese text until P5-03 moves it onto this dictionary.
   Language order at load: valid ?lang=vi|en in the URL, then the remembered choice, then Vietnamese. */
(() => {
  'use strict';
  const LANGS = ['vi', 'en'];
  const STORE_KEY = 'goiviet-lang';
  const DICT = { vi: {}, en: {} };

  const fromUrl = () => { try { const v = new URLSearchParams(location.search).get('lang'); return LANGS.includes(v) ? v : null; } catch (e) { return null; } };
  const fromStore = () => { try { const v = localStorage.getItem(STORE_KEY); return LANGS.includes(v) ? v : null; } catch (e) { return null; } };
  let current = fromUrl() || fromStore() || 'vi';

  function format(text, vars) {
    return vars ? String(text).replace(/\{(\w+)\}/g, (m, k) => (vars[k] == null ? m : String(vars[k]))) : String(text);
  }
  // Interface string by key; falls back to Vietnamese, then to the key itself so a missing entry stays visible.
  function t(key, vars) {
    const own = DICT[current][key];
    return format(own != null ? own : (DICT.vi[key] != null ? DICT.vi[key] : key), vars);
  }
  // Content value: a plain string, or { vi, en }. Returns the current language, falling back to Vietnamese.
  function pick(value) {
    if (value == null) return '';
    if (typeof value !== 'object' || Array.isArray(value)) return value;
    return value[current] != null && value[current] !== '' ? value[current] : (value.vi != null ? value.vi : '');
  }
  // True when a { vi, en } value has text in the current language (used to label Vietnamese fallbacks).
  function has(value) {
    if (value == null || typeof value !== 'object' || Array.isArray(value)) return value != null && value !== '';
    const v = value[current];
    return v != null && v !== '' && !(Array.isArray(v) && !v.length);
  }
  function setLang(next, { remember = true } = {}) {
    if (!LANGS.includes(next) || next === current) return current;
    current = next;
    if (remember) { try { localStorage.setItem(STORE_KEY, next); } catch (e) { /* storage blocked: still switch for this session */ } }
    document.dispatchEvent(new CustomEvent('goiviet:langchange', { detail: { lang: current } }));
    return current;
  }
  function add(dict) {
    for (const lang of LANGS) if (dict && dict[lang]) Object.assign(DICT[lang], dict[lang]);
  }
  function missing() {
    return Object.keys(DICT.vi).filter(k => DICT.en[k] == null).concat(Object.keys(DICT.en).filter(k => DICT.vi[k] == null));
  }

  add({
    vi: {
      'book.kicker': 'Gói Việt · Sách văn hóa',
      'book.close': 'Về bản đồ',
      'book.closeLabel': 'Đóng sách và về bản đồ',
      'book.toc': 'Mục lục',
      'book.largeText': 'Đọc chữ lớn',
      'book.prev': 'Trang trước',
      'book.next': 'Trang sau',
      'book.prevLabel': 'Lật về trang trước',
      'book.nextLabel': 'Lật sang trang sau',
      'book.open': 'Mở sách',
      'book.cover': 'Bìa sách',
      'book.backCover': 'Bìa sau',
      'book.pages': 'Trang {a}–{b} / {total}',
      'book.page': 'Trang {a} / {total}',
      'book.pageShort': 'Trang {a}',
      'book.library': 'Thư viện ký ức',
      'book.hint': 'Dùng nút điều hướng hoặc phím ← → để lật trang · Vị trí đọc được ghi nhớ',
      'book.choosePage': 'Chọn trang sách',
      'book.closeCover': 'Đóng sách',
      'book.draft': 'Bản nháp',
      'book.draftNote': 'Bản nháp nội bộ · nội dung đang soạn',
      'book.viOnly': 'Bản tiếng Anh đang soạn · đang hiện tiếng Việt',
      'book.viEdition': 'Bản tiếng Việt',
      'book.loading': 'Đang mở sách…',
      'book.loadError': 'Chưa mở được cuốn sách này. Bạn vẫn có thể chơi bộ thẻ của ga.',
      'book.playCards': 'Chơi thẻ {place}',
      'book.playCardsShort': 'Chơi thẻ',
      'book.back': 'Quay lại',
      'book.tocTitle': 'Mục lục cuốn sách',
      'book.tocKicker': 'Mỗi phần, một miền ký ức',
      'book.tocCover': 'Bìa sách',
      'book.textKicker': 'Nội dung câu chuyện',
      'book.textTitle': 'Đọc chữ lớn',
      'book.fontSize': 'Cỡ chữ',
      'book.fontDown': 'Giảm cỡ chữ',
      'book.fontUp': 'Tăng cỡ chữ',
      'book.sectionPrev': '← Phần trước',
      'book.sectionNext': 'Phần sau →',
      'book.closePanel': 'Đóng',
      'book.notesTitle': 'Ghi chú và nguồn',
      'book.endTitle': 'Lời cuối',
      'book.sources': 'Nguồn tham khảo',
      'book.credits': 'Ghi công',
      'book.artPending': 'Tranh đang soạn · tỉ lệ {ratio}',
      'book.artMissing': 'Tranh chưa tải được',
      'book.textPending': 'Nội dung đang soạn · tối đa khoảng {max} ký tự',
      'book.kind.fiction': 'Truyện hư cấu',
      'book.kind.documentary': 'Tư liệu văn hóa',
      'book.kind.community': 'Câu chuyện cộng đồng',
      'book.soon.kicker': 'Tủ sách Gói Việt',
      'book.soon.title': 'Sắp có',
      'book.soon.stamp': 'Sắp có',
      'book.soon.text': 'Câu chuyện về {place} đang chờ được kể. Trong lúc chờ, cả nhà có thể chơi bộ thẻ của ga này.',
      'book.announceOpen': 'Đang mở sách {title}',
      'book.announceSoon': 'Sách về {place} sắp có',
      // P5-02
      'book.soon.inviteTitle': 'Gửi câu chuyện quê bạn',
      'book.soon.community': 'Tủ sách cộng đồng',
      'book.soon.openCallIdeas': 'Kể về một món ăn, một phong tục hay một kỷ niệm gắn với {place}. Bạn có thể gửi kèm ảnh do mình chụp.',
      'book.soon.send': 'Gửi qua fanpage',
      'book.soon.scan': 'Quét để mở fanpage',
      'book.soon.playHint': 'Trong lúc chờ sách, mời cả nhà ghé chơi thẻ.',
      'book.soon.ideas': 'Một món ăn, một tiếng gọi, một phong tục, một tấm ảnh bạn tự chụp hay tên tỉnh cũ trước khi sáp nhập: những mẩu chuyện nhỏ như thế sẽ góp nên tập sách về {place}.',
      'book.soon.fanpage': 'Gửi qua fanpage Gói Việt',
      'book.soon.qrAlt': 'Mã QR mở fanpage Gói Việt',
      'book.soon.qrCaption': 'Quét bằng điện thoại để mở fanpage',
      'book.soon.consent': 'Nhóm sẽ hỏi ý bạn trước khi đăng và ghi tên theo cách bạn chọn.',
      'book.fromCard': 'Đọc sách về {place}',
      'book.fromCardHint': 'Câu chuyện của vùng đất này trong sách văn hóa. Đóng sách là quay lại đúng lá bài này.',
      'book.fromCardOpen': 'Mở sách',
      'journey.playCards': 'Chơi thẻ',
      'journey.readBook': 'Đọc sách',
      'journey.modesLabel': 'Chọn cách khám phá {place}',
      'journey.stationHint': 'Chơi thẻ hoặc đọc sách tại ga',
      'journey.arrivalHint': 'Chơi thẻ hoặc đọc sách để tìm hiểu vùng đất này.',
      'journey.noteAtStation': 'Chơi thẻ hoặc đọc sách để khám phá ga.'
    },
    en: {
      'book.kicker': 'Gói Việt · Culture books',
      'book.close': 'Back to map',
      'book.closeLabel': 'Close the book and return to the map',
      'book.toc': 'Contents',
      'book.largeText': 'Large text',
      'book.prev': 'Previous',
      'book.next': 'Next',
      'book.prevLabel': 'Turn to the previous page',
      'book.nextLabel': 'Turn to the next page',
      'book.open': 'Open the book',
      'book.cover': 'Cover',
      'book.backCover': 'Back cover',
      'book.pages': 'Pages {a}–{b} of {total}',
      'book.page': 'Page {a} of {total}',
      'book.pageShort': 'Page {a}',
      'book.library': 'Memory library',
      'book.hint': 'Use the navigation buttons or the ← → keys to turn pages · Your reading position is saved',
      'book.choosePage': 'Choose a page',
      'book.closeCover': 'Close book',
      'book.draft': 'Draft',
      'book.draftNote': 'Internal draft · content in progress',
      'book.viOnly': 'English version in progress · showing Vietnamese',
      'book.viEdition': 'Vietnamese edition',
      'book.loading': 'Opening the book…',
      'book.loadError': 'This book could not be opened. You can still play this station’s card deck.',
      'book.playCards': 'Play the {place} cards',
      'book.playCardsShort': 'Play cards',
      'book.back': 'Go back',
      'book.tocTitle': 'Table of contents',
      'book.tocKicker': 'Every part, a place in memory',
      'book.tocCover': 'Cover',
      'book.textKicker': 'Story text',
      'book.textTitle': 'Large text',
      'book.fontSize': 'Text size',
      'book.fontDown': 'Smaller text',
      'book.fontUp': 'Larger text',
      'book.sectionPrev': '← Previous part',
      'book.sectionNext': 'Next part →',
      'book.closePanel': 'Close',
      'book.notesTitle': 'Notes and sources',
      'book.endTitle': 'A final word',
      'book.sources': 'Sources',
      'book.credits': 'Credits',
      'book.artPending': 'Illustration in progress · ratio {ratio}',
      'book.artMissing': 'Illustration could not be loaded',
      'book.textPending': 'Text in progress · up to about {max} characters',
      'book.kind.fiction': 'Fiction',
      'book.kind.documentary': 'Cultural notes',
      'book.kind.community': 'Community story',
      'book.soon.kicker': 'Gói Việt library',
      'book.soon.title': 'Coming soon',
      'book.soon.stamp': 'Coming soon',
      'book.soon.text': 'The story of {place} is waiting to be told. Meanwhile, the family can play this station’s card deck.',
      'book.announceOpen': 'Opening the book {title}',
      'book.announceSoon': 'The {place} book is coming soon',
      // P5-02
      'book.soon.inviteTitle': 'Share your hometown story',
      'book.soon.community': 'Community library',
      'book.soon.openCallIdeas': 'Tell us about a dish, a custom or a memory from {place}. You can send a photo you took, too.',
      'book.soon.send': 'Send via Facebook',
      'book.soon.scan': 'Scan to open Facebook',
      'book.soon.playHint': 'While the book is in the making, try the station’s cards together.',
      'book.soon.ideas': 'A dish, a way of calling out, a custom, a photo you took, or the old province name from before the merger: small stories like these will build the book about {place}.',
      'book.soon.fanpage': 'Send it via the Gói Việt Facebook page',
      'book.soon.qrAlt': 'QR code that opens the Gói Việt Facebook page',
      'book.soon.qrCaption': 'Scan with your phone to open the page',
      'book.soon.consent': 'We will ask you before publishing and credit you the way you choose.',
      'book.fromCard': 'Read the {place} book',
      'book.fromCardHint': 'This place’s stories in the culture book. Closing the book brings you back to this card.',
      'book.fromCardOpen': 'Open the book',
      'journey.playCards': 'Play cards',
      'journey.readBook': 'Read the book',
      'journey.modesLabel': 'Choose how to explore {place}',
      'journey.stationHint': 'Play cards or read the book at this station',
      'journey.arrivalHint': 'Play cards or read the book to get to know this place.',
      'journey.noteAtStation': 'Play cards or read the book to explore the station.'
    }
  });

  // The raw entry of one language (no fallback, no formatting); null when that language has none.
  function get(lang, key) { return DICT[lang] && DICT[lang][key] != null ? DICT[lang][key] : null; }

  window.GoiVietI18n = Object.freeze({ t, pick, has, get, setLang, add, missing, lang: () => current, langs: () => LANGS.slice() });
})();
