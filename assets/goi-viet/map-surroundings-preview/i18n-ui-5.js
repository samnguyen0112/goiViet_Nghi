/* Preview-5 interface language (P5-03 slice 1). Loaded right after i18n-5.js, before the page's main script.
   - Static markup keeps its Vietnamese text in the HTML and carries data-i18n keys: data-i18n="k1|k2" names the
     element's non-empty direct text nodes in order ('' leaves one as is); data-i18n-label / -title / -placeholder /
     -alt name the aria-label, title, placeholder and alt attributes. The Vietnamese is read from the page itself;
     this file holds the English. A node that other code has rewritten since it was last set is left alone.
   - Strings built in JavaScript use GoiVietI18n.t(key, vars) with both languages registered below.
   - Keeps <html lang> and the page title in step, and wires the VI/EN switches ([data-set-lang]). */
(() => {
  'use strict';
  const I = window.GoiVietI18n;
  if (!I) return;

  const ATTRS = [['i18nLabel', 'aria-label'], ['i18nTitle', 'title'], ['i18nPlaceholder', 'placeholder'], ['i18nAlt', 'alt']];
  const SELECTOR = '[data-i18n],[data-i18n-label],[data-i18n-title],[data-i18n-placeholder],[data-i18n-alt]';
  const records = new WeakMap();
  const learned = { vi: {} };

  // English (or a registered Vietnamese override) for a key; null keeps the page's own Vietnamese.
  function lookup(key) {
    if (!key) return null;
    const value = I.t(key);
    return value === key ? null : value;
  }
  // A text node is lead + core + trail: leading symbols and spaces ("⌖ ", "← ", "+ "), the words, trailing spaces.
  // Decorating scripts may swap a leading symbol for an icon; comparing cores keeps such nodes translatable, and the
  // live lead/trail is kept when writing.
  const LEAD = /^[^\p{L}\p{N}]*/u;
  function split(value) {
    const lead = value.match(LEAD)[0], rest = value.slice(lead.length), trail = rest.match(/\s*$/)[0];
    return { lead, core: rest.slice(0, rest.length - trail.length), trail };
  }
  const coreOf = value => split(value).core.replace(/\s+/g, ' ');

  function applyElement(el, lang) {
    let rec = records.get(el);
    if (!rec) { rec = { nodes: null, attrs: {} }; records.set(el, rec); }
    if (el.dataset.i18n) {
      const keys = el.dataset.i18n.split('|');
      const live = Array.from(el.childNodes).filter(n => n.nodeType === 3 && n.nodeValue.trim());
      if (!rec.nodes || rec.nodes.length !== live.length || rec.nodes.some((entry, i) => entry.node !== live[i])) {
        // First sight, or another script replaced the nodes: the Vietnamese read first stays the reference.
        const old = rec.nodes || [];
        rec.nodes = live.map((node, i) => old[i] ? { ...old[i], node } : { node, vi: coreOf(node.nodeValue), viRaw: split(node.nodeValue).core });
      }
      rec.nodes.forEach((entry, i) => {
        const key = keys[i];
        if (!key) return;
        if (!learned.vi[key]) learned.vi[key] = entry.vi;
        const en = I.get('en', key);
        const enCore = en == null ? null : coreOf(en);
        const live = split(entry.node.nodeValue), current = live.core.replace(/\s+/g, ' ');
        // Text that is neither this key's Vietnamese nor its English was written by other code: leave it.
        if (current !== entry.vi && current !== enCore) return;
        const wantVi = lang === 'vi' || enCore == null;
        if (current === (wantVi ? entry.vi : enCore)) return;
        entry.node.nodeValue = live.lead + (wantVi ? entry.viRaw : enCore) + live.trail;
      });
    }
    for (const [prop, attr] of ATTRS) {
      const key = el.dataset[prop];
      if (!key) continue;
      let a = rec.attrs[attr];
      const current = el.getAttribute(attr);
      if (!a) a = rec.attrs[attr] = { vi: current, last: current };
      if (current !== a.last) { a.vi = current; a.last = current; continue; }
      if (!learned.vi[key] && a.vi) learned.vi[key] = a.vi;
      const en = lang === 'vi' ? null : lookup(key);
      const next = en == null ? a.vi : en;
      if (next != null && current !== next) el.setAttribute(attr, next);
      a.last = next;
    }
  }

  function applyDom(root = document) {
    const lang = I.lang();
    const scope = root.nodeType === 1 && root.matches(SELECTOR) ? [root, ...root.querySelectorAll(SELECTOR)] : root.querySelectorAll(SELECTOR);
    scope.forEach(el => applyElement(el, lang));
    // Make the page's Vietnamese known to t() and to the key checker (English entries stay authoritative).
    const fresh = {};
    for (const [k, v] of Object.entries(learned.vi)) if (I.t(k) === k || I.lang() === 'vi') fresh[k] = v;
    if (Object.keys(fresh).length) I.add({ vi: fresh });
  }

  function syncDocument() {
    const lang = I.lang();
    document.documentElement.lang = lang;
    document.title = I.t('page.title');
    document.querySelectorAll('[data-set-lang]').forEach(button => {
      const on = button.dataset.setLang === lang;
      button.setAttribute('aria-pressed', String(on));
      button.classList.toggle('is-active', on);
    });
    document.querySelectorAll('[data-lang-group]').forEach(group => group.setAttribute('aria-label', I.t('lang.group')));
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-set-lang]');
    if (!button) return;
    event.preventDefault();
    I.setLang(button.dataset.setLang);
  });
  document.addEventListener('goiviet:langchange', () => { applyDom(document); syncDocument(); });

  I.add({
    vi: {
      'page.title': 'Gói Việt — Hành trình văn hóa cùng gia đình',
      'lang.group': 'Ngôn ngữ · Language',
      'lang.vi': 'Tiếng Việt',
      'lang.en': 'English',
      'settings.subtitle': 'Âm thanh, giao diện và hiệu ứng.',
      'settings.sound': 'Âm thanh', 'settings.dark': 'Nền tối', 'settings.motion': 'Giảm chuyển động',
      'settings.soundHint': 'Tiếng tàu và giai điệu dân gian.',
      'settings.darkHint': 'Sắc trầm dịu mắt khi khám phá.',
      'settings.motionHint': 'Tiết chế hiệu ứng và chuyển cảnh.',
      'settings.motionDevice': 'Đang theo cài đặt của thiết bị.'
      , 'offline.prepare': 'Chuẩn bị chạy không mạng',
      'offline.again': 'Chuẩn bị lại bộ không mạng',
      'offline.size': 'Khoảng {mb} MB · chỉ tải khi bạn bấm nút.',
      'offline.idle': 'Chưa tải bộ chạy không mạng.',
      'offline.preparing': 'Đang chuẩn bị: {done}/{total} tệp.',
      'offline.ready': 'Đã sẵn sàng chạy không mạng.',
      'offline.error': 'Chưa chuẩn bị xong. Kiểm tra kết nối và bấm để thử lại.',
      'offline.unavailable': 'Bản mở từ tệp dùng tài nguyên cục bộ; không cần tải bộ không mạng.',
      'offline.progress': 'Tiến độ chuẩn bị chạy không mạng'
    },
    en: {
      'page.title': 'Gói Việt — A family journey through Vietnamese culture',
      'lang.group': 'Ngôn ngữ · Language',
      'lang.vi': 'Tiếng Việt',
      'lang.en': 'English',
      'settings.subtitle': 'Sound, appearance and motion.',
      'settings.sound': 'Sound', 'settings.dark': 'Dark theme', 'settings.motion': 'Reduced motion',
      'settings.soundHint': 'Train sounds and folk melodies.',
      'settings.darkHint': 'Softer colours for your journey.',
      'settings.motionHint': 'Gentler effects and transitions.',
      'settings.motionDevice': 'Following your device preference.',
      'offline.prepare': 'Prepare for offline use',
      'offline.again': 'Prepare offline bundle again',
      'offline.size': 'About {mb} MB · downloads only when you press the button.',
      'offline.idle': 'The offline bundle has not been downloaded.',
      'offline.preparing': 'Preparing: {done}/{total} files.',
      'offline.ready': 'Ready for offline use.',
      'offline.error': 'Preparation did not finish. Check your connection and press to retry.',
      'offline.unavailable': 'The file version uses local assets; no offline download is needed.',
      'offline.progress': 'Offline preparation progress',

      // ---- markup: veil and home
      'ui.home.mot-doan-tau-ba-mien': 'One train • Three heritage regions',
      'ui.home.mot-doan-tau-di-doc': '“One train runs the length of the country’s three regions',
      'ui.home.moi-tinh-thanh-la-mot': 'Every province is a station where the family stops to hear old stories and share memories.”',
      'ui.home.hanh-trinh-minh-hoa-qua': 'Illustrated journey across three regions',
      'ui.home.ga-mien-bac': 'NORTHERN STATION •',
      'ui.home.ga-mien-trung': 'CENTRAL STATION •',
      'ui.home.co-do-hue': 'Huế, the old capital',
      'ui.home.ga-mien-nam': 'SOUTHERN STATION •',
      'ui.home.goi-tinh-hoa': 'Wrapping the essence',
      'ui.home.mo-ket-noi': 'Opening connections',
      'ui.home.cham-de-bat-dau-hanh': 'Tap to begin the Gói Việt journey',
      'ui.home.cham-de-bat-dau': 'Tap to begin',
      'ui.home.dang-chuan-bi': 'Getting ready…',
      'ui.home.bo-qua-mo-dau': 'Skip intro',
      'ui.home.xem-lai-mo-dau': 'Replay intro',
      'ui.home.mo-chuyen-nha-minh': 'Open your family’s stories.',
      'ui.home.mot-la-bai-nho-mot': 'One small card, a moment closer together.',
      'ui.home.chon-mot-ga-de-bat': 'Choose a station to begin the journey',
      'ui.home.kham-pha-ba-mien': 'Explore the three regions',
      'ui.home.ga-mien-bac-2': 'Northern station',
      'ui.home.ga-mien-trung-2': 'Central station',
      'ui.home.ga-mien-nam-2': 'Southern station',
      'ui.home.goi-tinh-hoa-mo-ket': 'Wrapping the essence · Opening connections',
      'ui.home.moi-mien-que-mot-chuyen': 'Every hometown, a family story',
      'ui.home.lat-mot-la-bai-cung': 'Turn over a card and tell your hometown’s stories together.',
      'ui.home.trai-nghiem-goi-viet': 'The Gói Việt experience',
      'ui.home.chon-mien-than-quen': 'Pick a place you know',
      'ui.home.bat-dau-tu-mot-noi': 'Start from somewhere you remember',
      'ui.home.lat-mot-la-bai-nho': 'Turn over a small card',
      'ui.home.goi-mot-mon-an-mot': 'Recall a dish, an old story',
      'ui.home.ke-chuyen-nha-minh': 'Tell your family’s story',
      'ui.home.cung-se-chia-cung-lang': 'Share together, listen together',
      'ui.home.mo-ban-do-ky-uc': 'Open the memory map',
      'ui.home.xem-cach-choi': 'How to play',
      'ui.home.thu-tai-lai-chuyen-dong': 'Try loading the animation again',
      'ui.home.tu-nhung-dieu-than-quen': 'From familiar things',
      'ui.home.co-nhung-dieu': 'Some memories',
      'ui.home.chi-can-goi': 'need',
      'ui.home.la-nho': 'only a hint.',
      'ui.home.mot-tieng-goi-than-quen': 'A familiar voice. A piece of home.',
      'ui.home.mot-vi-nha': 'A taste of home',
      'ui.home.mon-gi-khien-ban-nho': 'Which dish makes you miss home cooking the most?',
      'ui.home.mot-chuyen-cu': 'An old story',
      'ui.home.co-chuyen-nao-ong-ba': 'Is there a story your grandparents still tell?',
      'ui.home.mot-nep-quen': 'A family habit',
      'ui.home.nha-minh-con-giu-dieu': 'What does your family still keep from the old days?',
      'ui.home.mot-la-bai-mo': 'A card opens.',
      'ui.home.mot-cau-chuyen-duoc-noi': 'A story connects.',
      'ui.home.khong-can-tra-loi-dung': 'No need to answer correctly.',
      'ui.home.chi-can-lang-nghe-nhau': 'Just listen to each other.',
      'ui.home.doi-loi-goi': 'Another prompt',
      'ui.home.vi-nha': 'Taste of home',
      'ui.home.neu-duoc-ve-nha-an': 'If you could go home for one meal, what would you eat?',
      'ui.home.cach-trai-nghiem-hanh-trinh': 'How the journey works',
      'ui.home.chon-mot-mien-ky-uc': 'Choose a place of memory',
      'ui.home.mo-mot-la-bai': 'Open a card',
      'ui.home.cung-ke-cung-nghe': 'Tell and listen together',
      'ui.home.chuyen-nha-minh': 'Your family’s stories,',
      'ui.home.noi-thanh-chuyen-que-huong': 'woven into the story of a homeland.',
      'ui.home.bat-dau-tu-mot-mien': 'Start from a place you know.',
      'ui.home.chuyen-di-bat-dau': 'The journey begins',

      // ---- markup: home music settings
      'ui.music.am-thanh': 'Sound',
      'ui.music.chon-ban-nhac-cua-ban': 'Choose your own music',
      'ui.music.chon-nhac-tu-may': 'Choose music from this device',
      'ui.music.am-luong': 'Volume',
      'ui.music.bat-dau-nhac-tai': 'Start music at',
      'ui.music.diem-bat-dau-trong-ban': 'Start point in the track, in seconds',
      'ui.music.giay': 'seconds',
      'ui.music.tiep-tuc-nhac-sau-mo': 'Keep the music playing after the intro',
      'ui.music.nghe-thu': 'Preview',
      'ui.music.bo-nhac': 'Remove music',
      'ui.music.nhac-duoc-luu-tren-trinh': 'The music is saved in this browser. The intro can also run without music.',

      // ---- markup: map, header and controls
      'ui.map.ban-do-tuong-tac-3d': 'Interactive 3D map of Vietnam with the Hoàng Sa and Trường Sa archipelagos',
      'ui.map.ngam-danh-thang-san-ga': 'Admire the station’s landmark',
      'ui.map.choi-the-tro-chuyen': 'Play the conversation cards',
      'ui.map.hoac': 'or',
      'ui.map.doc-sach-van-hoa': 'Read the culture book',
      'ui.map.goi-viet-mo-trang-chu': 'Gói Việt — open the home page',
      'ui.map.chuyen-tau-di-san-viet': 'Vietnam Heritage Train',
      'ui.map.hanh-trinh-gia-dinh-doc': 'A family journey through 3 regions • 36 culture and island stations',
      'ui.map.hanh-trinh-di-san': 'Heritage journey',
      'ui.map.gia-dinh-ba-mien-bien': 'Family • Three regions • Islands',
      'ui.map.chuyen-luot-cho-thanh-vien': 'Pass the turn to the next family member',
      'ui.map.doi-luot': 'Next turn ↻',
      'ui.map.dong-du-3-an-ga': 'Collect 3 station stamps to unlock the Family Reunion milestone',
      'ui.map.rut-ve-tau-ngau-nhien': 'Draw a random train ticket with a lục bát verse that leads to a new station',
      'ui.map.rut-ve': 'Draw a ticket',
      'ui.map.xem-so-ve-buu-thiep': 'See the ticket book and journey postcard',
      'ui.map.buu-thiep': 'Postcard',
      'ui.map.di-toi-quan-dao': 'Go to the archipelagos',
      'ui.map.chon-quan-dao': 'Choose an archipelago',
      'ui.map.den-quan-dao-hoang-sa': 'Go to the Hoàng Sa archipelago',
      'ui.map.den-quan-dao-truong-sa': 'Go to the Trường Sa archipelago',
      'ui.map.chu-giai': 'Legend',
      'ui.map.ba-ga-mau': 'Three starter stations',
      'ui.map.da-kham-pha': 'Explored',
      'ui.map.co-ky-niem': 'Has a memory',
      'ui.map.dieu-khien-goc-nhin-ban': 'Map view controls',
      'ui.map.dua-toan-bo-ban-do': 'Re-centre the whole map of Vietnam in the clearest 3D view (shortcut: R)',
      'ui.map.ve-giua': '⌖ Re-centre',
      'ui.map.phong-to-ban-do': 'Zoom in on the map',
      'ui.map.phong-to': 'Zoom in',
      'ui.map.thu-nho-ban-do': 'Zoom out of the map',
      'ui.map.thu-nho': 'Zoom out',
      'ui.map.goc-nhin': 'View',
      'ui.map.chuyen-doi-giua-goc-nhin': 'Switch between the tilted 3D view and the flat 2D view',
      'ui.map.dieu-khien-goc-nhin-nang': 'Advanced view controls',
      'ui.map.dua-camera-ve-dung-ga': 'Bring the camera to the selected station',
      'ui.map.ve-ga-dang-chon': '🎯 Go to selected station',
      'ui.map.keo-chuot-trai-de-di': 'Drag with the left mouse button to move the map (hold the right button to rotate in 3D)',
      'ui.map.keo-di-chuyen': 'Drag: Move',
      'ui.map.keo-chuot-trai-de-xoay': 'Drag with the left mouse button to rotate the 3D view',
      'ui.map.keo-xoay-3d': 'Drag: Rotate 3D',
      'ui.map.xoay-ban-do-sang-trai': 'Rotate the map to the left',
      'ui.map.xoay-trai': '↺ Rotate left',
      'ui.map.xoay-ban-do-sang-phai': 'Rotate the map to the right',
      'ui.map.xoay-phai': '↻ Rotate right',

      // ---- markup: settings
      'ui.settings.tuy-chon': 'Options',
      'ui.settings.thiet-lap-va-huong-dan': 'Settings and guide',
      'ui.settings.bat-tat-tieng-coi-tau': 'Turn the train whistle, festival drum and zither sounds on or off',
      'ui.settings.bat-tat-che-do-giam': 'Turn reduced motion on or off',
      'ui.settings.nguon-ban-do': 'Map sources',
      'ui.settings.cac-chang-ra-quan-dao': 'The sea legs to the archipelagos are illustrative routes.',

      // ---- markup: card deck
      'ui.deck.ban-do': '← Map',
      'ui.deck.mot-la-bai-mot-cau': 'ONE CARD · ONE STORY',
      'ui.deck.chon-mot-la-bai-theo': 'Choose a card by topic',
      'ui.deck.moi': 'Invite',
      'ui.deck.chon-mot-la-bai-tren': 'to pick a card from the table. Right answer or not, the whole family opens the connection part to talk together!',
      'ui.deck.xao-rut-ngau-nhien-mot': '🎲 Shuffle & draw a random card',
      'ui.deck.ca-nha-da-rut-het': 'The family has drawn every card at this station!',
      'ui.deck.ban-muon-chon-mot-cau': 'Would you like to pick another place on the map, or reshuffle this station’s deck and keep playing?',
      'ui.deck.chon-dia-danh-cau-chuyen': '← Choose another place',
      'ui.deck.xao-lai-bo-bai-ga': '↻ Reshuffle this station’s deck',
      'ui.deck.mat-truoc-cau-hoi-van': 'Front • Culture question',
      'ui.deck.cac-lua-chon-tra-loi': 'Answer choices',
      'ui.deck.hoi-nguoi-than': '★ Ask a family member',
      'ui.deck.nho-nguoi-ngoi-canh-goi': 'Ask the person next to you for a hint and remove one option',
      'ui.deck.xem-loi-giai-thich-va': 'See the explanation and open the connection activity',
      'ui.deck.chua-biet-xem-giai-thich': 'Not sure, show the explanation',
      'ui.deck.kiem-tra-mo-ket-noi': 'Check & open the connection →',
      'ui.deck.cham-dau-hoa-sen-de': 'Tap the lotus seal to open the connection challenge',
      'ui.deck.thu-thach-gan-ket-dang': 'A connection challenge is waiting',
      'ui.deck.chon-dap-an-o-mat': 'Pick an answer on the front, or tap the lotus seal to open the connection activity with the whole family.',
      'ui.deck.mo-xem-thu-thach-ngay': 'Open the challenge now →',
      'ui.deck.dau-ky-niem-gia-dinh': 'FAMILY MEMORY STAMP',
      'ui.deck.mat-sau-hoat-dong-gan': 'Back • Family connection activity',
      'ui.deck.tro-lai-cau-hoi-giu': 'Back to the question, keeping the memory you are typing',
      'ui.deck.xem-cau-hoi': '↑ See the question',
      'ui.deck.hoat-dong-hoan-toan-tu': 'Activities are entirely optional and never scored. You can press “Change activity” or “Skip” at any time.',
      'ui.deck.doi-hoat-dong': '↻ Change activity',
      'ui.deck.bo-qua': 'Skip',
      'ui.deck.xong-den-luot-tiep-theo': 'Done, next turn →',
      'ui.deck.hen-gio-lang-nghe-60': '⏱ 60-second listening timer (optional)',
      'ui.deck.khi-mot-nguoi-muon-ke': 'When someone wants to tell a longer story, the family can start the timer and listen all the way through',
      'ui.deck.bat-dau-60s': '▶ Start 60s',
      'ui.deck.du-tra-loi-dung-hay': 'Right answer or not sure yet, the family can always turn the card over!',
      'ui.deck.xem-hoat-dong-gan-ket': 'See the connection activity →',

      // ---- markup: memory drawer
      'ui.memory.ghi-lai-mot-ky-niem': '✦ Note a memory linked to the map (optional)',
      'ui.memory.neu-cuoc-tro-chuyen-goi': 'If the conversation brings back a place you remember, the family can note it down. What you type is kept when you look at the question again or close and reopen the card.',
      'ui.memory.ky-niem-chi-duoc-giu': 'Memories are kept only while this page is open; download the postcard to keep them. Reloading or closing the page clears this session.',
      'ui.memory.dia-danh-ky-niem': 'Place of the memory',
      'ui.memory.vd-nam-dinh-da-lat': 'E.g. Nam Định, Đà Lạt, Vũ Đại village...',
      'ui.memory.ky-niem-ngan-tuy-chon': 'Short memory (optional)',
      'ui.memory.vd-mon-an-hoac-chuyen': 'E.g. a dish or a memorable trip',
      'ui.memory.luu-ky-niem': '+ Save memory',
      'ui.memory.xoa-noi-dung-nhap-dang': 'Clear the draft you are typing',
      'ui.memory.xoa-nhap': 'Clear draft',
      'ui.memory.goi-y-nhanh': 'Quick picks:',

      // ---- markup: bamboo draw, milestone, postcard, reset
      'ui.bamboo.rut-ve-tau-ngau-nhien': 'Draw a Random Train Ticket — Cast a Lot to Choose the Next Stop',
      'ui.bamboo.dong': '← Close',
      'ui.bamboo.nhap-vao-ong-xam-de': 'Click the bamboo cylinder to shake the sticks!',
      'ui.bamboo.chua-biet-di-dau-tiep': 'Not sure where to go next? Shake the',
      'ui.bamboo.ong-xam-tre': 'Bamboo Fortune Cylinder',
      'ui.bamboo.de-rut-mot-que-tho': 'to draw a lục bát verse that leads the family to a new stop!',
      'ui.bamboo.rut-ve-ngau-nhien-khap': '✦ Draw from all 36 stations',
      'ui.bamboo.gieo-trong-3-diem-mau': '★ Draw from the 3 starter stations',
      'ui.milestone.cot-moc-hanh-trinh-gia': 'FAMILY JOURNEY MILESTONE',
      'ui.milestone.ca-nha-da-cung-trai': 'The family has played',
      'ui.milestone.la-bai': 'cards together!',
      'ui.milestone.ba-la-bai-vua-qua': 'These three cards opened up cultural stories and warm memories among the family. Would you like to travel on to other provinces, or stop here and look at your',
      'ui.milestone.buu-thiep-hanh-trinh': 'journey postcard',
      'ui.milestone.kham-pha-tiep-tren-ban': 'Keep exploring the map',
      'ui.milestone.xem-buu-thiep-ket-thuc': 'See the postcard & end the session',
      'ui.postcard.goi-viet-ky-niem-gia': 'Gói Việt · Family memories',
      'ui.postcard.buu-thiep-hanh-trinh': 'Journey postcard',
      'ui.postcard.ban-do': '← Map',
      'ui.postcard.mot-chuyen-di-nhieu-dieu': 'One trip, so much to cherish',
      'ui.postcard.nhung-mien-dat-da-ghe': 'The places we visited, the stories we heard together.',
      'ui.postcard.dau-an-doan-vien': 'REUNION STAMPS',
      'ui.postcard.cac-ga-gia-dinh-da': 'Stations the family has explored',
      'ui.postcard.buu-thiep-cua-ca-nha': 'The family’s postcard',
      'ui.postcard.tai-png-ve-may-khong': 'Download as PNG · Nothing is sent to a server',
      'ui.postcard.ban-xem-truoc-hinh-anh': 'Preview of the family journey postcard image',
      'ui.postcard.luu-but-chuyen-di': 'Trip guestbook',
      'ui.postcard.ky-niem-chi-luu-trong': 'Memories are kept only in this session. Tick what you want in the image and download the PNG to keep it.',
      'ui.postcard.nhung-ga-da-ghe': 'Stations visited',
      'ui.postcard.sach-van-hoa-da-doc': 'Culture books read and card turns completed.',
      'ui.postcard.chuyen-nha-minh': 'Our family’s stories',
      'ui.postcard.chi-ky-niem-duoc-tich': 'Only ticked memories appear in the image.',
      'ui.postcard.anh-luu-toi-da-6': 'The image holds up to 6 stations, 5 stamps and 5 memories; long text is shortened.',
      'ui.postcard.bat-dau-hanh-trinh-moi': 'Start a new journey',
      'ui.postcard.luu-buu-thiep-png': '↓ Save postcard PNG',
      'ui.postcard.ve-ban-do': 'Back to map',
      'ui.reset.bat-dau-hanh-trinh-moi': 'Start a new journey?',
      'ui.reset.hanh-trinh-hien-tai-cac': 'The current journey, the cards drawn and the memories saved or being typed will be cleared. Download the postcard first if you want to keep them; a memory still being typed must be saved before it can go on the postcard.',
      'ui.reset.huy-giu-hanh-trinh': 'Cancel, keep the journey',
      'ui.reset.xoa-va-bat-dau-lai': 'Clear and start over'
    }
  });

  // ---- strings built by the page's main script (uiT / uiLabel). Vietnamese here must match the original wording.
  I.add({
    vi: {
      'js.on': 'Bật', 'js.off': 'Tắt',
      'js.sound': 'Âm thanh: {state}',
      'js.station.default': 'GA VIỆT NAM',
      'js.station.name': 'GA {name}',
      'js.station.island': 'TRẠM BIỂN ĐẢO {name}',
      'js.arrival.kicker': 'CHUYẾN TÀU DI SẢN 3 MIỀN',
      'js.arrival.kickerIsland': 'ĐƯỜNG SẮT ĐẾN GA VEN BIỂN • TIẾP NỐI HẢI TRÌNH',
      'js.arrival.turnOf': 'LƯỢT CỦA {name}',
      'js.turn.player': 'Người chơi {n}',
      'js.turn.playerWithPawn': 'Người chơi {n} ({pawn})',
      'js.turn.label': 'Lượt: {name} ({pawn})',
      'js.turn.progress': 'Ấn ga: {done} / 3',
      'js.turn.toast': 'Đến lượt <strong>{name}</strong> — Mời chọn Ga dừng nghỉ hoặc Rút Vé Tàu!',
      'js.turn.switched': 'Đã chuyển sang lượt của {name}',
      'js.turn.pawnChip': 'Quân cờ {pawn} — Nhấp để chọn lượt của {name}',
      'js.turn.sideRole': '{subtitle} • Chọn ga dừng hoặc Rút vé ga',
      'js.naming': 'Tên lượt: {mode}', 'js.naming.roles': 'Vai gia đình', 'js.naming.numbers': 'Số thứ tự',
      'js.drum.idle': '✦ Nhịp Trống Lắng Nghe: 60 giây',
      'js.drum.start': '▶ Bắt đầu 60s Lắng Nghe',
      'js.drum.stop': '⏹ Dừng nhịp trống',
      'js.drum.done': '✓ Đã trọn 60 giây lắng nghe ấm áp!',
      'js.drum.left': '✦ Đang lắng nghe người thân kể: còn {s} giây...',
      'js.sea.continue': 'Tàu dừng tại ga ven biển. Hành trình đến {place} tiếp tục bằng tàu biển trên bản đồ minh họa.',
      'js.memory.cleared': 'Đã xóa nội dung nháp.',
      'js.memory.clearedSR': 'Đã xóa nội dung kỷ niệm nháp.',
      'js.memory.linked': '✓ Đã gắn kỷ niệm “{memory}” với ga {place} trên bản đồ.',
      'js.memory.needPlace': 'Bạn hãy nhập tên một địa danh kỷ niệm (hoặc bấm nút gợi ý nhanh) trước khi lưu nhé.',
      'js.memory.defaultNote': 'Được nhắc đến trong lượt của {name}',
      'js.memory.savedAmbiguous': '✦ Đã lưu kỷ niệm “{memory}” (Đang giữ nguyên tên riêng bạn nhập).',
      'js.memory.ambiguousHint': 'Tên ngắn này trùng với một vài tỉnh thành. Nếu muốn gắn vị trí lên bản đồ, bạn có thể chọn:',
      'js.memory.linkTo': 'Gắn với {place}',
      'js.memory.savedMapped': '✓ Đã lưu kỷ niệm về “{memory}” vào danh sách Nơi được nhắc đến!',
      'js.memory.jump': 'Xong lượt này & Đi tới ga {place} →',
      'js.memory.savedOwn': '✦ Đã lưu địa danh kỷ niệm riêng “{memory}” vào mục Nơi được nhắc đến!',
      'js.memory.savedSR': 'Đã lưu địa danh kỷ niệm {memory}',
      'js.deck.remaining': 'Còn {left} / {total} lá',
      'js.deck.empty': 'Đã rút hết {total} lá',
      'js.deck.reshuffled': 'Đã xào lại bộ bài {place}. Bạn có thể rút lá bài mới.',
      'js.deck.turnOf': 'Lượt của {name}',
      'js.deck.heading': 'Thẻ trò chuyện · {place}',
      'js.deck.title': 'Bộ Thẻ Ký Ức Quê Hương • {place}',
      'js.deck.allDrawnSR': 'Đã rút hết các lá bài tại ga này. Hãy chọn địa danh khác hoặc bấm Xào lại bộ bài.',
      'js.deck.selectHint': 'Chọn đáp án, hỏi người thân, hoặc bấm “Chưa biết, xem giải thích”',
      'js.deck.drawnSR': 'Đã rút lá bài câu hỏi: {question}',
      'js.deck.chosen': 'Đã chọn phương án — Nhấn “Kiểm tra & Mở kết nối”',
      'js.deck.learn': 'Cùng tìm hiểu nhé! Giải thích ngắn:',
      'js.deck.correct': 'Chính xác! Giải thích ngắn:',
      'js.deck.wrong': 'Cùng tìm hiểu nhé! Cả nhà vẫn được mở hoạt động gắn kết — Giải thích ngắn:',
      'js.deck.activityFallback': 'Hoạt động gắn kết',
      'js.deck.activityOpenedSR': 'Đã mở hoạt động gắn kết: {activity}',
      'js.deck.activitySwappedSR': 'Đã đổi sang hoạt động: {activity}',
      'js.stamp.skipped': 'Đã xem câu hỏi (Bỏ qua hoạt động)',
      'js.stamp.done': 'Đã thực hiện hoạt động',
      'js.milestone.sr': 'Cả nhà đã hoàn thành {n} lá bài!',
      'js.png.preparing': 'Đang chuẩn bị ảnh bưu thiếp…',
      'js.png.done': 'Đã tạo PNG. Bạn có thể mở ảnh trong mục tải xuống.',
      'js.png.fallback': 'Đã tạo PNG bằng tài nguyên thay thế; font hoặc tranh chưa tải đủ. Bạn có thể thử tải lại.',
      'js.png.doneSR': 'Đã tạo ảnh bưu thiếp Gói Việt dưới dạng PNG.',
      'js.png.error': 'Không thể xuất ảnh PNG. Hãy bấm Tải ảnh để thử lại; nội dung phiên vẫn được giữ.',
      'js.png.errorSR': 'Không thể xuất ảnh PNG trên trình duyệt này.',
      'js.postcard.stamps': '{n} Dấu kỷ niệm',
      'js.postcard.noStations': 'Chưa có ga đã khám phá. Chọn một điểm trên bản đồ để bắt đầu.',
      'js.postcard.visited': 'GA ĐÃ GHÉ:',
      'js.postcard.stop': 'Ga #{n}: {place}',
      'js.postcard.filename': 'goi-viet-buu-thiep-gia-dinh.png',
      'js.postcard.emptyExplored': 'Chơi thẻ hoặc đọc sách để lưu ga đầu tiên.',
      'js.postcard.played': '{name} (Đã chơi bài)',
      'js.postcard.read': '{name} (Đã đọc sách)',
      'js.postcard.stops': 'Điểm dừng chân: {list}',
      'js.postcard.exploring': 'Đang khám phá',
      'js.postcard.readNoTurn': 'Đã đọc sách văn hóa, chưa hoàn thành lượt thẻ bài.',
      'js.postcard.stampLine': 'Dấu kỷ niệm #{n}: {place} ({topic}) — {player}',
      'js.postcard.noMemories': 'Chưa có kỷ niệm. Mở phần gắn kết của thẻ bài và chọn “Ghi lại một kỷ niệm”.',
      'js.postcard.hasContent': '(Có bài văn hóa trên bản đồ)',
      'js.postcard.ownPlace': '(Địa danh ký ức riêng)',
      'js.postcard.include': 'Lưu kỷ niệm này vào bưu thiếp',
      'js.reset.done': 'Đã đặt lại toàn bộ phiên chơi để bắt đầu hành trình mới.',
      'js.motion.byDeviceOff': 'Hiệu ứng tắt theo thiết bị',
      'js.motion.enable': 'Bật hiệu ứng',
      'js.motion.disable': 'Tắt hiệu ứng',
      'js.motion.label': 'Giảm chuyển động: {state}{device}',
      'js.motion.byDevice': ' (theo thiết bị)',
      'js.theme.toDark': 'Nền Tối', 'js.theme.toLight': 'Nền Sáng',
      'js.theme.toDarkHome': 'Nền tối', 'js.theme.toLightHome': 'Nền sáng',
      'js.canvas.memory': '✦ {name} (Ký ức)',
      'js.canvas.visited': '(Đã ghé)',
      'js.canvas.recenter': 'Về giữa', 'js.canvas.north': 'B',
      'js.pitch.2d': 'Góc 2D', 'js.pitch.3d': 'Góc 3D',
      'js.map.recentered': 'Đã đưa bản đồ về vị trí chính giữa dễ nhìn nhất.',
      'js.map.focused': 'Đã đưa camera về giữa ga {place}.',
      'js.mobile.list': '📜 Xem danh sách ga', 'js.mobile.map': '🗺 Xem bản đồ',
      'js.hint.title': '★ Trợ giúp Đồng đội Gia đình: Mời hỏi ý kiến {name}!',
      'js.hint.removed': 'Bàn cờ đã giúp cả nhà <strong>lược bớt phương án {letter}</strong>.',
      'js.hint.tipLabel': 'Mẹo dân gian:',
      'js.hint.tip': 'Hãy đọc to 2 phương án còn lại để người lớn tuổi nhất hoặc nhỏ tuổi nhất trong nhà cùng chọn!'
    },
    en: {
      'js.on': 'On', 'js.off': 'Off',
      'js.sound': 'Sound: {state}',
      'js.station.default': 'VIETNAM STATION',
      'js.station.name': '{name} STATION',
      'js.station.island': '{name} ISLAND POST',
      'js.arrival.kicker': 'THREE-REGION HERITAGE TRAIN',
      'js.arrival.kickerIsland': 'BY RAIL TO THE COASTAL STATION • ON BY SEA',
      'js.arrival.turnOf': 'TURN: {name}',
      'js.turn.player': 'Player {n}',
      'js.turn.playerWithPawn': 'Player {n} ({pawn})',
      'js.turn.label': 'Turn: {name} ({pawn})',
      'js.turn.progress': 'Stamps: {done} / 3',
      'js.turn.toast': 'Next up: <strong>{name}</strong> — choose a stop or draw a train ticket!',
      'js.turn.switched': 'It is now the turn of {name}',
      'js.turn.pawnChip': '{pawn} token — click to give the turn to {name}',
      'js.turn.sideRole': '{subtitle} • Choose a stop or draw a station ticket',
      'js.naming': 'Turn names: {mode}', 'js.naming.roles': 'Family roles', 'js.naming.numbers': 'Numbers',
      'js.drum.idle': '✦ Listening drum: 60 seconds',
      'js.drum.start': '▶ Start 60s of listening',
      'js.drum.stop': '⏹ Stop the drum',
      'js.drum.done': '✓ 60 warm seconds of listening!',
      'js.drum.left': '✦ Listening to a family member: {s} seconds left...',
      'js.sea.continue': 'The train stops at the coastal station. The journey to {place} continues by ship on the illustrated map.',
      'js.memory.cleared': 'Draft cleared.',
      'js.memory.clearedSR': 'The memory draft was cleared.',
      'js.memory.linked': '✓ Linked the memory “{memory}” to {place} station on the map.',
      'js.memory.needPlace': 'Please type a place for the memory (or tap a quick pick) before saving.',
      'js.memory.defaultNote': 'Mentioned during the turn of {name}',
      'js.memory.savedAmbiguous': '✦ Saved the memory “{memory}” (kept exactly as you typed it).',
      'js.memory.ambiguousHint': 'This short name matches several provinces. To pin it on the map, you can choose:',
      'js.memory.linkTo': 'Link to {place}',
      'js.memory.savedMapped': '✓ Saved the memory of “{memory}” to Places mentioned!',
      'js.memory.jump': 'Finish this turn & go to {place} station →',
      'js.memory.savedOwn': '✦ Saved your own place of memory “{memory}” to Places mentioned!',
      'js.memory.savedSR': 'Saved the place of memory {memory}',
      'js.deck.remaining': '{left} / {total} cards left',
      'js.deck.empty': 'All {total} cards drawn',
      'js.deck.reshuffled': 'The {place} deck has been reshuffled. You can draw a new card.',
      'js.deck.turnOf': 'Turn: {name}',
      'js.deck.heading': 'Conversation cards · {place}',
      'js.deck.title': 'Hometown Memory Cards • {place}',
      'js.deck.allDrawnSR': 'Every card at this station has been drawn. Choose another place or press Reshuffle.',
      'js.deck.selectHint': 'Pick an answer, ask a family member, or press “Not sure, show the explanation”',
      'js.deck.drawnSR': 'Card drawn: {question}',
      'js.deck.chosen': 'Answer chosen — press “Check & open the connection”',
      'js.deck.learn': 'Let’s find out! Short explanation:',
      'js.deck.correct': 'Correct! Short explanation:',
      'js.deck.wrong': 'Let’s find out! The family still opens the connection activity — Short explanation:',
      'js.deck.activityFallback': 'Connection activity',
      'js.deck.activityOpenedSR': 'Connection activity opened: {activity}',
      'js.deck.activitySwappedSR': 'Switched to the activity: {activity}',
      'js.stamp.skipped': 'Looked at the question (activity skipped)',
      'js.stamp.done': 'Did the activity',
      'js.milestone.sr': 'The family has completed {n} cards!',
      'js.png.preparing': 'Preparing the postcard image…',
      'js.png.done': 'PNG created. You can open it from your downloads.',
      'js.png.fallback': 'PNG created with fallback resources; some fonts or artwork had not finished loading. You can try again.',
      'js.png.doneSR': 'The Gói Việt postcard was saved as a PNG.',
      'js.png.error': 'The PNG could not be created. Press save again to retry; your session is kept.',
      'js.png.errorSR': 'This browser could not create the PNG.',
      'js.postcard.stamps': 'Memory stamps: {n}',
      'js.postcard.noStations': 'No stations explored yet. Choose a stop on the map to begin.',
      'js.postcard.visited': 'STATIONS VISITED:',
      'js.postcard.stop': 'Stop {n}: {place}',
      'js.postcard.filename': 'goi-viet-family-postcard.png',
      'js.postcard.emptyExplored': 'Play cards or read a book to save your first station.',
      'js.postcard.played': '{name} (cards played)',
      'js.postcard.read': '{name} (book read)',
      'js.postcard.stops': 'Stops: {list}',
      'js.postcard.exploring': 'Exploring',
      'js.postcard.readNoTurn': 'Culture book read; no card turn completed yet.',
      'js.postcard.stampLine': 'Memory stamp #{n}: {place} ({topic}) — {player}',
      'js.postcard.noMemories': 'No memories yet. Open a card’s connection side and choose “Note a memory”.',
      'js.postcard.hasContent': '(has a culture station on the map)',
      'js.postcard.ownPlace': '(your own place of memory)',
      'js.postcard.include': 'Put this memory on the postcard',
      'js.reset.done': 'The whole session has been reset for a new journey.',
      'js.motion.byDeviceOff': 'Effects off (device setting)',
      'js.motion.enable': 'Turn effects on',
      'js.motion.disable': 'Turn effects off',
      'js.motion.label': 'Reduced motion: {state}{device}',
      'js.motion.byDevice': ' (device setting)',
      'js.theme.toDark': 'Dark theme', 'js.theme.toLight': 'Light theme',
      'js.theme.toDarkHome': 'Dark theme', 'js.theme.toLightHome': 'Light theme',
      'js.canvas.memory': '✦ {name} (Memory)',
      'js.canvas.visited': '(Visited)',
      'js.canvas.recenter': 'Re-centre', 'js.canvas.north': 'N',
      'js.pitch.2d': '2D view', 'js.pitch.3d': '3D view',
      'js.map.recentered': 'The map is back in its clearest centred view.',
      'js.map.focused': 'The camera is centred on {place} station.',
      'js.mobile.list': '📜 Station list', 'js.mobile.map': '🗺 Show map',
      'js.hint.title': '★ Family teamwork: ask {name} what they think!',
      'js.hint.removed': 'The board has <strong>removed option {letter}</strong> for the family.',
      'js.hint.tipLabel': 'Folk tip:',
      'js.hint.tip': 'Read the two remaining options aloud and let the oldest or the youngest in the family choose together!',

      // Fixed labels attached to data: card topics, activity kinds and the family pawns (uiLabel).
      'topic.Ẩm thực': 'Food', 'topic.Nghệ thuật': 'Arts', 'topic.Lễ hội': 'Festivals', 'topic.Nghề truyền thống': 'Traditional crafts', 'topic.Văn hóa': 'Culture', 'topic.Danh thắng': 'Landmarks',
      'activityKind.Kể chuyện': 'Storytelling', 'activityKind.Đố vui': 'Quiz', 'activityKind.Chăm sóc tự nguyện': 'Caring (optional)',
      'activityKind.Quan sát': 'Observation', 'activityKind.Đoán': 'Guessing', 'activityKind.Phối hợp': 'Teamwork',
      'activityKind.Sáng tạo đơn giản': 'Simple creativity', 'activityKind.Sáng tạo': 'Creativity',
      'pawn.roleLabel.Ông / Bà': 'Grandparents', 'pawn.roleLabel.Bố / Chú': 'Dad / Uncle', 'pawn.roleLabel.Mẹ / Cô': 'Mom / Aunt',
      'pawn.roleLabel.Con / Cháu': 'Child / Grandchild', 'pawn.roleLabel.Em Út': 'The youngest', 'pawn.roleLabel.Người Thân': 'Relative',
      'pawn.pawnName.Ấm Trà Sen': 'Lotus Teapot', 'pawn.pawnName.Trống Đồng': 'Bronze Drum', 'pawn.pawnName.Nón Bài Thơ': 'Poem Hat',
      'pawn.pawnName.Chong Chóng Tre': 'Bamboo Pinwheel', 'pawn.pawnName.Đầu Lân Hội': 'Festival Lion', 'pawn.pawnName.Tò He Xuân La': 'Xuân La Dough Figure',
      'pawn.subtitle.Người giữ kho báu ký ức': 'Keeper of the memory treasure', 'pawn.subtitle.Người dẫn đường bản đồ': 'Map guide',
      'pawn.subtitle.Người kể chuyện bếp ấm': 'Storyteller of the warm kitchen', 'pawn.subtitle.Nhà thám hiểm nhỏ': 'Little explorer',
      'pawn.subtitle.Người gieo tiếng cười': 'Bringer of laughter', 'pawn.subtitle.Nhịp cầu sum họp': 'Bridge that brings us together'
    }
  });

  // ---- journey bar (journey-system-5.js; the mode buttons and hints are in i18n-5.js)
  I.add({
    vi: {
      'journey.sr.arrived': 'Đã đến {place}. Thông tin điểm đến đã hiện trên bản đồ.',
      'journey.sr.selectedDuringTrip': 'Đã chọn {place}. Chuyến đang chạy tiếp tục đến {dest}.',
      'journey.sr.selected': 'Đã chọn {place}. Nhấn Khởi hành để bắt đầu.',
      'journey.sr.busy': 'Tàu đang đến {dest}. Có thể khởi hành chuyến mới sau khi đến ga.',
      'journey.sr.depart': 'Khởi hành từ {from} đến {to}.',
      'journey.sr.clearedTrip': 'Đã bỏ chọn. Tàu tiếp tục đến {dest}.',
      'journey.sr.cleared': 'Đã bỏ chọn và ẩn tuyến hành trình.',
      'journey.btn.wait': 'Chờ đến ga', 'journey.btn.paused': 'Tạm dừng', 'journey.btn.transfer': 'Chuyển chặng',
      'journey.btn.sea': 'Đang đi biển', 'journey.btn.running': 'Đang chạy', 'journey.btn.atIsland': 'Đã đến đảo',
      'journey.btn.atStation': 'Đang ở ga', 'journey.btn.instant': 'Đến ngay', 'journey.btn.depart': 'Khởi hành', 'journey.btn.explore': 'Khám phá',
      'journey.status.arrived': 'Đã đến ga', 'journey.status.atStation': 'Bạn đang ở ga', 'journey.status.trip': 'Hành trình di sản', 'journey.status.ready': 'Sẵn sàng khởi hành',
      'journey.caption.next': 'Tiếp theo: {place} · Chờ đến ga',
      'journey.caption.paused': 'Tạm dừng hành trình',
      'journey.caption.continueSea': 'Tiếp nối hải trình', 'journey.caption.continueRail': 'Tiếp nối đường sắt',
      'journey.caption.seaTo': 'Hải trình đến {place}', 'journey.caption.goingTo': 'Đang đến {place}',
      'journey.caption.illustrative': 'Tuyến hành trình minh họa', 'journey.caption.reducedSuffix': ' · Giảm chuyển động',
      'journey.heading.atStation': 'Dừng chân và khám phá', 'journey.heading.arrived': 'Đã đến {place}',
      'journey.note.running': 'Chuyến đang chạy đến {place}.', 'journey.note.arrived': 'Đã đến {place}.',
      'journey.note.preview': 'Xem tuyến và khởi hành trên bản đồ.',
      'journey.barLabel': 'Hành trình di sản', 'journey.detailLabel': 'Thông tin điểm đến',
      'journey.closeLabel': 'Đóng thông tin đến ga', 'journey.progressLabel': 'Tiến độ hành trình',
      'journey.clearTitle': 'Bỏ chọn và ẩn tuyến (Esc)', 'journey.clearLabel': 'Bỏ chọn tỉnh và ẩn tuyến',
      'journey.networkNote': 'Mạng ga di sản và các chặng đi là minh họa để khám phá văn hóa; không biểu thị tuyến vận tải đang khai thác.'
    },
    en: {
      'journey.sr.arrived': 'Arrived at {place}. The destination details are shown on the map.',
      'journey.sr.selectedDuringTrip': '{place} selected. The current trip continues to {dest}.',
      'journey.sr.selected': '{place} selected. Press Depart to begin.',
      'journey.sr.busy': 'The train is on its way to {dest}. A new trip can start once it arrives.',
      'journey.sr.depart': 'Departing from {from} to {to}.',
      'journey.sr.clearedTrip': 'Selection cleared. The train continues to {dest}.',
      'journey.sr.cleared': 'Selection cleared and route hidden.',
      'journey.btn.wait': 'Wait for arrival', 'journey.btn.paused': 'Paused', 'journey.btn.transfer': 'Changing legs',
      'journey.btn.sea': 'At sea', 'journey.btn.running': 'On the way', 'journey.btn.atIsland': 'Arrived at the islands',
      'journey.btn.atStation': 'At the station', 'journey.btn.instant': 'Arrive now', 'journey.btn.depart': 'Depart', 'journey.btn.explore': 'Explore',
      'journey.status.arrived': 'Arrived', 'journey.status.atStation': 'You are at the station', 'journey.status.trip': 'Heritage journey', 'journey.status.ready': 'Ready to depart',
      'journey.caption.next': 'Next: {place} · Waiting to arrive',
      'journey.caption.paused': 'Journey paused',
      'journey.caption.continueSea': 'Continuing by sea', 'journey.caption.continueRail': 'Continuing by rail',
      'journey.caption.seaTo': 'Sailing to {place}', 'journey.caption.goingTo': 'On the way to {place}',
      'journey.caption.illustrative': 'Illustrative journey route', 'journey.caption.reducedSuffix': ' · Reduced motion',
      'journey.heading.atStation': 'Stop and explore', 'journey.heading.arrived': 'Arrived at {place}',
      'journey.note.running': 'The train is on its way to {place}.', 'journey.note.arrived': 'Arrived at {place}.',
      'journey.note.preview': 'See the route and depart on the map.',
      'journey.barLabel': 'Heritage journey', 'journey.detailLabel': 'Destination details',
      'journey.closeLabel': 'Close the arrival details', 'journey.progressLabel': 'Journey progress',
      'journey.clearTitle': 'Clear the selection and hide the route (Esc)', 'journey.clearLabel': 'Clear the selected province and hide the route',
      'journey.networkNote': 'The heritage station network and its legs are illustrations for exploring culture; they do not show transport routes in service.'
    }
  });

  // ---- card fan and shuffle (conversation-cards-5.js)
  I.add({
    vi: {
      'cards.drawLabel': 'Rút lá {topic} • {place}',
      'cards.title': 'KÝ ỨC QUÊ HƯƠNG',
      'cards.tap': 'Bấm để rút lá', 'cards.empty': 'Đã rút hết bài',
      'cards.shuffleButton': '🎲 Xáo & Rút ngẫu nhiên một lá bài',
      'cards.shuffling': '✨ Đang xáo bài…',
      'cards.status.pickedOpening': 'Đã chọn lá {topic}. Đang mở câu chuyện…',
      'cards.status.gathering': 'Đang gom và xáo {n} lá bài…',
      'cards.status.shuffling': 'Đang xáo bài — câu chuyện nào sẽ được mở?',
      'cards.status.picked': 'Đã chọn lá {topic}!',
      'cards.status.drawing': 'Đang rút lá bài dành cho cả nhà…',
      'cards.seeActivity': 'Xem hoạt động gắn kết →'
    },
    en: {
      'cards.drawLabel': 'Draw the {topic} card • {place}',
      'cards.title': 'HOMETOWN MEMORIES',
      'cards.tap': 'Tap to draw', 'cards.empty': 'All cards drawn',
      'cards.shuffleButton': '🎲 Shuffle & draw a random card',
      'cards.shuffling': '✨ Shuffling…',
      'cards.status.pickedOpening': '{topic} card chosen. Opening it…',
      'cards.status.gathering': 'Gathering and shuffling the cards ({n})…',
      'cards.status.shuffling': 'Shuffling — which story will open?',
      'cards.status.picked': '{topic} card chosen!',
      'cards.status.drawing': 'Drawing a card for the whole family…',
      'cards.seeActivity': 'See the connection activity →'
    }
  });

  // ---- bamboo ritual (fortune-ritual-5.js). Text written while it runs has both languages; its static frame carries
  // data-i18n keys, so only the English of those is listed.
  I.add({
    vi: {
      'ritual.read': 'Đọc sách văn hóa',
      'ritual.cylinderLabel': 'Lắc ống xăm và rút một quẻ tre',
      'ritual.caption.idle': 'Chạm vào ống xăm để gieo quẻ',
      'ritual.draw': 'Lắc ống xăm', 'ritual.drawBusy': 'Đang lắc ống…', 'ritual.drawing': 'Đang rút quẻ…',
      'ritual.turnOf': 'Lượt của {name}',
      'ritual.ticketTop': 'VÉ HẸN MIỀN DI SẢN', 'ritual.ticketType': 'QUẺ HÀNH TRÌNH',
      'ritual.resultKicker': 'ĐIỂM DỪNG DÀNH CHO CẢ NHÀ',
      'ritual.regionFallback': 'Dọc miền di sản',
      'ritual.landmark': 'DANH THẮNG', 'ritual.flavor': 'HƯƠNG VỊ', 'ritual.flavorFallback': 'Hương vị địa phương',
      'ritual.stub': '36 ga · Ba miền · Vạn câu chuyện',
      'ritual.go': 'Khám phá ga này', 'ritual.reroll': 'Gieo một quẻ khác',
      'ritual.caption.picked': 'Điểm hẹn · {place}',
      'ritual.status.picked': 'Quẻ tre đã chọn {place}. Vé hành trình đã sẵn sàng.',
      'ritual.caption.shaking': 'Lắc nhẹ ống tre, gọi một miền thương nhớ…',
      'ritual.status.shaking': 'Đang lắc ống xăm.',
      'ritual.caption.drawing': 'Một quẻ tre đã được chọn…',
      'ritual.status.drawing': 'Đang rút một quẻ tre và mở vé hành trình.'
    },
    en: {
      'ritual.read': 'Read the culture book',
      'ritual.cylinderLabel': 'Shake the bamboo cylinder and draw a stick',
      'ritual.caption.idle': 'Tap the cylinder to cast a lot',
      'ritual.draw': 'Shake the cylinder', 'ritual.drawBusy': 'Shaking…', 'ritual.drawing': 'Drawing a stick…',
      'ritual.turnOf': 'Turn: {name}',
      'ritual.ticketTop': 'HERITAGE MEETING TICKET', 'ritual.ticketType': 'JOURNEY LOT',
      'ritual.resultKicker': 'A STOP FOR THE WHOLE FAMILY',
      'ritual.regionFallback': 'Along the heritage regions',
      'ritual.landmark': 'LANDMARK', 'ritual.flavor': 'FLAVOUR', 'ritual.flavorFallback': 'Local flavours',
      'ritual.stub': '36 stations · Three regions · Countless stories',
      'ritual.go': 'Explore this station', 'ritual.reroll': 'Cast another lot',
      'ritual.caption.picked': 'Meeting point · {place}',
      'ritual.status.picked': 'The bamboo lot chose {place}. Your journey ticket is ready.',
      'ritual.caption.shaking': 'Gently shake the bamboo, call up a place you miss…',
      'ritual.status.shaking': 'Shaking the cylinder.',
      'ritual.caption.drawing': 'A bamboo stick has been chosen…',
      'ritual.status.drawing': 'Drawing a bamboo stick and opening the journey ticket.',
      'ritual.overline': 'DEPARTURE RITUAL',
      'ritual.title': 'Draw a journey lot',
      'ritual.closeLabel': 'Close the lot drawing', 'ritual.close': 'Close',
      'ritual.stageLabel': 'Bamboo journey cylinder',
      'ritual.stageKicker': 'ONE BAMBOO LOT · ONE MEETING POINT',
      'ritual.signature': 'ALONG THE HERITAGE REGIONS',
      'ritual.inviteKicker': 'LET A VERSE LEAD THE WAY',
      'ritual.ask1': 'Where shall we', 'ritual.ask2': 'go today?',
      'ritual.desc1': 'Gently shake the bamboo cylinder and receive a lot.',
      'ritual.desc2': 'Every stop opens a story of home.',
      'ritual.scopeLabel': 'Choose where to draw from',
      'ritual.scopeAll': 'Province & island stations', 'ritual.scopeAllHint': 'All across Vietnam',
      'ritual.scopeFeatured': 'Starter stations',
      'ritual.note': 'A little surprise, a place to miss.',
      'ritual.stepsLabel': 'Steps of the lot drawing',
      'ritual.step1': 'Shake', 'ritual.step2': 'Draw', 'ritual.step3': 'Open the ticket',
      'ritual.footer': 'One verse · One journey'
    }
  });

  // ---- P5-03 slice 2: preview-5 copies of shared files (…-5.js). T(key, viFallback) keeps the Vietnamese in the code,
  // so only English is listed for those; the few keys without a fallback have both languages.
  I.add({
    vi: {
      'polish.mobileList': 'Xem danh sách ga', 'polish.mobileMap': 'Xem bản đồ',
      'home.stationChosen': 'Ga đã chọn: {place}'
    },
    en: {
      'polish.mobileList': 'Station list', 'polish.mobileMap': 'Show map',
      'home.stationChosen': 'Station chosen: {place}',
      // header (map-reference-ui-5, heritage-command-bar-5), legend, settings menu
      'ref.changeTurn': 'Next turn', 'ref.ticketShort': 'Ticket', 'ref.ticketFull': 'Random ticket', 'ref.postcard': 'Postcard',
      'bar.postcard': 'Postcard', 'bar.options': 'Options',
      'legend.title': 'Legend', 'legend.featured': 'Three starter stations', 'legend.explored': 'Explored', 'legend.memory': 'Has a memory',
      'overlay.title': 'Journey options', 'overlay.lead': 'The map and routes are illustrations for a cultural journey.', 'overlay.details': 'Source and licence details',
      // home page (homepage-opening-controller-5, homepage-layered-opening-5, homepage-music-5, memory-reference-5)
      'home.preparing': 'Getting the scenery ready…', 'home.hint': 'One tap opens the stories of home.',
      'home.statusWaiting': 'Tap to open the Gói Việt journey.', 'home.statusPreparing': 'Getting the scenery ready.', 'home.statusReady': 'The home page is ready.',
      'home.motionFailed': 'The animation could not load. The content, background images and buttons still work.',
      'opening.1': 'Blank paper · waiting for the scene to open', 'opening.2': 'Mountains and clouds come in from both sides',
      'opening.3': 'Trees, storks and leaves bring the scene to life', 'opening.4': 'Gói Việt and the story of the journey',
      'opening.5': 'Three regions and an invitation to explore', 'opening.6': 'Scene complete · motion continues',
      'music.default': 'Intro music', 'music.stop': 'Stop music', 'music.play': 'Play music', 'music.preview': 'Preview',
      'music.rangeNote': ' · the start point is past the end of the track', 'music.blockedNote': ' · press Play music or Preview to play',
      'music.unreadable': 'This track cannot be read. Please choose another MP3, WAV or M4A file.',
      'music.endedNote': ' · the track has ended', 'music.notAudio': 'Please choose an audio file.',
      'music.saved': 'The track is saved in this browser.', 'music.notSaved': 'The browser could not save the file. The track still works in this session.',
      'music.none': 'No music chosen', 'music.removed': 'The saved track was removed.',
      'music.removedSession': 'Music removed for this session; the browser storage could not be updated.',
      'music.defaultFailed': 'The default music could not load. You can choose music from this device.',
      'homeq.0.cat': 'Taste of home', 'homeq.0.text': 'If you could go home for one meal, what would you eat?',
      'homeq.1.cat': 'Old stories', 'homeq.1.text': 'Is there a story from your grandparents you would love to hear once more?',
      'homeq.2.cat': 'Family habits', 'homeq.2.text': 'What habit from your childhood does your family still keep?',
      'homeq.3.cat': 'Taste of home', 'homeq.3.text': 'Which smell takes you straight back to the kitchen at home?',
      'homeq.4.cat': 'Old stories', 'homeq.4.text': 'What is the first memory the road to your hometown brings back?',
      'homeq.5.cat': 'Family habits', 'homeq.5.text': 'At Tết, what does the whole family usually do together?',
      'homeq.6.cat': 'Taste of home', 'homeq.6.text': 'Who cooks the dish you miss most, and what do you remember about them?',
      'homeq.7.cat': 'Old stories', 'homeq.7.text': 'If you told your grandchildren one childhood story, which would it be?',
      'homeq.8.cat': 'Family habits', 'homeq.8.text': 'Is there a family saying you still remember today?',
      'homeq.preparingMap': 'Getting the map ready…', 'homeq.openingMap': 'Opening the memory map…', 'homeq.mapFailed': 'The map could not open. Please try again.',
      // postcard PNG (postcard-design-5)
      'png.kicker': 'GÓI VIỆT · FAMILY MEMORIES', 'png.title': 'A journey guestbook', 'png.players': 'Players: {n}   ·   {date}', 'png.stamps': 'Memory stamps: {n}',
      'png.visited': 'Stations visited', 'png.family': 'Our family’s stories', 'png.noStations': 'The trip is waiting for its first stamp.',
      'png.emptyTitle': 'Every stop, a place to miss.', 'png.emptyHint': 'Play cards or read a book to stamp the journey.',
      'png.memoryTitle1': 'Something to remember,', 'png.memoryTitle2': 'a story to keep.',
      'png.memoryHint': 'Choose memories in the guestbook to put them on the postcard.',
      'png.footer': 'Travelling through the regions together. Keeping what we cherish together.',
      'png.note': 'Illustrated cultural journey · Memories chosen by the family',
      // archipelagos, island detail and chart (archipelago-renderer-5, landscape-5, island-chart-5)
      'arch.closer': 'Take a closer look at the {place} archipelago', 'arch.closerShort': 'Zoom',
      'isl.explore': 'Explore the islands', 'isl.closeLabel': 'Close the island map', 'isl.close': 'Close ×',
      'isl.tabsLabel': 'Choose an island or archipelago', 'isl.selectLabel': 'Choose an island to see up close',
      'isl.zoomOut': 'Zoom out', 'isl.zoomIn': 'Zoom in', 'isl.fit': 'Fit to frame',
      'isl.canvasLabel': 'Detailed island map. Drag to move; scroll or use the buttons to zoom.', 'isl.legendLabel': 'Island legend',
      'isl.overview': 'All of {place}', 'isl.groupLand': 'Islands and land', 'isl.groupReef': 'Banks and reefs', 'isl.heading': 'Explore {place}',
      'isl.captionArch': 'Choose a place, or tap a marker on the map to see it up close.',
      'isl.caption': 'Coastlines, terrain and reefs are illustrated from geographic data.',
      'isl.legend.landArch': 'Land along the coastline', 'isl.legend.reefArch': 'Reef flat', 'isl.legend.lagoonArch': 'Water inside the reef', 'isl.legend.marker': 'Marker',
      'isl.legend.land': 'Island / sand', 'isl.legend.reef': 'Coral reef', 'isl.legend.lagoon': 'Lagoon',
      'isl.infoArch': ' · Reef colours show the geomorphology layer, not measured depth.',
      'isl.info': ' · Drag and zoom to look closer. Shapes follow geographic data; colours are illustrative.',
      'chart.directory': 'Islands & reefs', 'chart.search': 'Find a place', 'chart.searchHint': 'Island, bank or coordinates…',
      'chart.listLabel': 'Choose a place on the map', 'chart.north': 'North', 'chart.northLetter': 'N',
      'chart.minimap': 'Locator map. Click or use the arrow keys to move; Enter shows the whole archipelago.',
      'chart.minimapTitle': 'Where the current view sits in the whole archipelago', 'chart.overview': 'Whole archipelago',
      'chart.reef': 'Bank / reef', 'chart.land': 'Land', 'chart.empty': 'No place matches the search.',
      'chart.lat': '°N', 'chart.lon': '°E',
      // map options and sources (preview-5, hydrology-5, terrain-renderer-5, landscape-5, island-chart-5)
      'map.wave': 'Gentle wave motion', 'map.waveTitle': 'Stops by itself when reduced motion is on or a content window is open',
      'map.help': 'Drag to explore the map. Use the arrow keys to move, plus or minus to zoom, R or Home to re-centre. Hold Shift while dragging to rotate.',
      'src.base.1': 'Base geography:', 'src.base.2': 'Land and sea are illustrated; Vietnam’s provincial boundaries keep the original data.',
      'src.hydro.1': 'Rivers and lakes across the whole map:', 'src.hydro.link': 'Natural Earth 1:10 million, v5.0.0',
      'src.hydro.2': 'public domain. The source’s connecting points are kept; connectors inside lakes are not drawn as rivers on the lake surface. The data is generalised and leaves out many streams and canals; line width is a symbol, not a measured width.',
      'src.terrain.1': 'Terrain:', 'src.terrain.2': 'Land cover:',
      'src.terrain.3': '2021, CC BY 4.0. The data has been resampled and coloured. © ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021). Copernicus WorldDEM-30 © DLR e.V. 2010–2014, © Airbus Defence and Space GmbH 2014–2018, provided under COPERNICUS by the European Union and ESA; all rights reserved.',
      'src.sea.1': 'Sea and terrain of the wider backdrop:', 'src.sea.2': 'Coastline: ©',
      'src.sea.3': 'Reefs: © 2018–2022 Allen Coral Atlas Partnership & Arizona State University,',
      'src.sea.5': 'Colours, coastlines and reefs are simplified for illustration.',
      'src.chart.1': 'The names', 'src.chart.2': 'and',
      'src.chart.3': 'are checked against the coordinates and the CSIS/AMTI records. Other names follow the source data. The 2026 OSM coastline may include reclaimed land; the ACA reef geomorphology layer uses 2018–2020 imagery, so the two layers are not from the same time.'
    }
  });

  window.GoiVietI18nDom = Object.freeze({ apply: applyDom, sync: syncDocument });
  // The markup above this script is already parsed: localize it now so ?lang=en never shows Vietnamese first.
  applyDom(document);
  syncDocument();
})();
