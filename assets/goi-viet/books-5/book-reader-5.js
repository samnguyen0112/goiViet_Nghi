/* Preview-5 culture-book reader (P5-01).
   One reader for every station book. A book is data (books-5/<placeId>/book.js → GoiVietBooks.register(...)) loaded
   on demand the first time it is opened; nothing under books-5/<placeId>/ is requested before that.
   Books can supply finished spreads per language alongside their editable, accessible page content.
   The catalog (catalog-5.js) decides what a visitor sees: published → the book; draft → coming soon, unless the URL
   has ?sach=nhap (team preview); not listed → coming soon. Layout sizes and text limits: layouts-5.js. */
(() => {
  'use strict';
  const I = window.GoiVietI18n, L = window.GoiVietBookLayouts;
  if (!I || !L) return;
  const t = I.t;
  const DRAFT = (() => { try { return new URLSearchParams(location.search).get('sach') === 'nhap'; } catch (e) { return false; } })();
  const LOGO = 'assets/goi-viet/brand/goi-viet-logo-512.webp';
  const LOGO_IVORY = 'assets/goi-viet/brand/goi-viet-logo-ivory-ribbon-v2-512.webp';
  const TURN_MS = 680;
  const ORN = '<svg class="gvb-orn-dots" viewBox="0 0 46 10" aria-hidden="true" focusable="false"><path d="M0 5h46"/><circle cx="5" cy="5" r="3.2"/><circle cx="23" cy="5" r="3.2"/><circle cx="41" cy="5" r="3.2"/></svg>';

  const catalog = () => window.GoiVietBookCatalog || {};
  const reduced = () => (typeof state !== 'undefined' && state.reducedMotion) || document.body.classList.contains('reduced-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const placeName = id => { try { const p = CULTURAL_PLACE_MAP[id]; return p ? (p.short || p.name) : id; } catch (e) { return id; } };
  const say = msg => { try { announceSR(msg); } catch (e) { /* announcer not ready */ } };

  function h(tag, cls, text) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text != null) el.textContent = text;
    return el;
  }
  // { vi, en } (or plain) value in a given language, with Vietnamese fallback.
  function inLang(value, lang) {
    if (value == null) return '';
    if (typeof value !== 'object' || Array.isArray(value)) return value;
    return value[lang] != null && value[lang] !== '' ? value[lang] : (value.vi != null ? value.vi : '');
  }

  // ---------------------------------------------------------------- books: catalog, loading, registration
  const books = new Map(), pending = new Map();

  function statusOf(placeId) {
    const e = catalog()[placeId];
    return !e ? 'none' : e.status === 'published' ? 'published' : 'draft';
  }
  function canRead(placeId) {
    const s = statusOf(placeId);
    return s === 'published' || (s === 'draft' && DRAFT);
  }
  function prepare(book) {
    const pages = [];
    (book.sections || []).forEach((section, si) => (section.pages || []).forEach(page => pages.push({ page, section, si })));
    if (pages.length % 2) pages.push({ blank: true });
    book._pages = pages;
    book._base = book._base || '';
    return book;
  }
  function register(book) {
    if (!book || typeof book.placeId !== 'string') return;
    const entry = catalog()[book.placeId];
    if (entry && entry.src && !book._base) book._base = entry.src.replace(/[^/]*$/, '');
    books.set(book.placeId, prepare(book));
    const waiting = pending.get(book.placeId);
    if (waiting) { pending.delete(book.placeId); waiting.resolve(books.get(book.placeId)); }
  }
  function load(placeId) {
    if (books.has(placeId)) return Promise.resolve(books.get(placeId));
    const entry = catalog()[placeId];
    if (!entry || !entry.src) return Promise.resolve(null);
    if (pending.has(placeId)) return pending.get(placeId).promise;
    let resolve;
    const promise = new Promise(r => { resolve = r; });
    pending.set(placeId, { promise, resolve });
    const finish = book => { if (pending.get(placeId)?.promise === promise) { pending.delete(placeId); resolve(book); } };
    const script = document.createElement('script');
    script.src = entry.src + (entry.v ? '?v=' + encodeURIComponent(entry.v) : '');
    script.async = true;
    script.onerror = () => finish(null);
    document.head.append(script);
    setTimeout(() => finish(books.get(placeId) || null), 15000);
    return promise;
  }

  // ---------------------------------------------------------------- page building (pure: book + index + language)
  function textOf(page, lang) {
    const tx = page.text || {};
    const own = tx[lang];
    if (own && Object.keys(own).length) return { data: own, lang, fallback: false };
    if (tx.vi && Object.keys(tx.vi).length) return { data: tx.vi, lang: 'vi', fallback: lang !== 'vi' };
    return { data: null, lang, fallback: false };
  }
  function paragraphs(box, list) {
    for (const text of [].concat(list || [])) {
      if (typeof text !== 'string' || !text.trim()) continue;
      const p = h('p', /^—\s/.test(text) ? 'gvb-dialogue' : /^[“"]/.test(text) ? 'gvb-said' : '', text);
      box.append(p);
    }
  }
  function pendingText(box, max) { box.append(h('p', 'gvb-ph-text', t('book.textPending', { max }))); }
  function ornament(cls) {
    const el = h('span', 'gvb-orn ' + (cls || ''));
    el.innerHTML = '<i></i>' + ORN;
    return el;
  }
  function figure(book, artId, spec, lang) {
    const fig = h('figure', 'gvb-art ' + (spec.fit === 'contain' ? 'gvb-contain' : 'gvb-fill'));
    if (spec.ratio) fig.style.setProperty('--ratio', spec.ratio);
    const art = artId && book.art && book.art[artId];
    if (!art) {
      fig.classList.add('gvb-ph');
      fig.append(h('span', 'gvb-ph-label', t('book.artPending', { ratio: spec.ratioLabel || '' })));
      return fig;
    }
    const img = document.createElement('img');
    img.decoding = 'async';
    img.draggable = false;
    img.alt = inLang(art.alt, lang) || '';
    img.src = book._base + art.file;
    if (art.hi) img.srcset = `${book._base + art.file} 1x, ${book._base + art.hi} 2x`;
    if (art.focus) img.style.objectPosition = art.focus;
    img.addEventListener('error', () => {
      fig.classList.add('gvb-ph', 'gvb-missing');
      img.remove();
      fig.append(h('span', 'gvb-ph-label', t('book.artMissing')));
    }, { once: true });
    fig.append(img);
    return fig;
  }
  function runningHead(book, lang) {
    const head = h('header', 'gvb-run');
    const logo = h('img', 'gvb-run-logo'); logo.src = LOGO; logo.alt = ''; logo.decoding = 'async';
    head.append(logo, h('span', 'gvb-run-sep'), h('span', 'gvb-run-title', inLang(book.runningHead, lang) || inLang(book.title, lang)), ornament('gvb-orn-run'));
    head.setAttribute('aria-hidden', 'true');
    return head;
  }
  function footer(number) {
    const foot = h('footer', 'gvb-foot');
    foot.append(h('span', 'gvb-num', String(number).padStart(2, '0')), ornament());
    return foot;
  }
  function stampFor(book, lang) { return inLang(book.stamp, lang) || placeName(book.placeId); }

  function buildPage(book, index, lang) {
    const entry = book._pages[index];
    const side = index % 2 ? 'gvb-pr' : 'gvb-pl';
    if (!entry || entry.blank) { const blank = h('article', 'gvb-page gvb-paper gvb-blank ' + side); blank.setAttribute('aria-hidden', 'true'); return blank; }
    const { page, section } = entry;
    const spec = L.spec(page.layout, page.variant) || L.spec('text-quote');
    const tx = textOf(page, lang), d = tx.data || {}, f = spec.fields || {};
    const el = h('article', `gvb-page gvb-paper gvb-l-${page.layout}${spec.variant ? ' gvb-v-' + spec.variant : ''} ${side}`);
    if (section.style === 'colophon') el.classList.add('gvb-end-paper', 'gvb-bound-leaf');
    el.dataset.pageId = page.id || '';
    el.dataset.index = index;
    el.lang = tx.lang;
    el.setAttribute('aria-label', t('book.page', { a: index + 1, total: book._pages.length }));
    el.append(runningHead(book, lang));
    const body = h('div', 'gvb-body');
    el.append(body);

    const textBox = (fields, extraCls) => {
      const box = h('div', 'gvb-text gvb-fit ' + (extraCls || ''));
      if (d.heading) box.append(h('h4', 'gvb-lead', d.heading));
      if (d.body && [].concat(d.body).some(Boolean)) paragraphs(box, d.body);
      else pendingText(box, fields.body || 600);
      return box;
    };

    if (page.layout === 'opener') {
      body.append(h('span', 'gvb-label', inLang(section.label, lang)), h('h3', 'gvb-title', inLang(section.title, lang)), h('span', 'gvb-stamp', stampFor(book, lang)));
      const split = h('div', 'gvb-split');
      split.append(figure(book, page.art, spec.art, lang), textBox(f));
      body.append(split);
    } else if (page.layout === 'art-text') {
      body.append(figure(book, page.art, spec.art, lang), textBox(f));
    } else if (page.layout === 'text-quote') {
      body.append(textBox(f));
      if (d.quote) { const q = h('blockquote', 'gvb-quote gvb-fit'); q.append(h('p', '', d.quote)); body.append(q); }
    } else if (page.layout === 'full-art') {
      if (section.style === 'colophon') body.append(h('h4', 'gvb-end-title', t('book.endTitle')));
      body.append(figure(book, page.art, spec.art, lang));
      const cap = h('p', 'gvb-caption gvb-fit');
      cap.textContent = d.caption || '';
      if (!d.caption) { cap.classList.add('gvb-ph-text'); cap.textContent = t('book.textPending', { max: f.caption }); }
      body.append(cap);
    } else if (page.layout === 'notes') {
      const box = h('div', 'gvb-text gvb-fit gvb-notes');
      box.append(h('h4', 'gvb-notes-title', d.heading || t('book.notesTitle')));
      if (d.body && [].concat(d.body).some(Boolean)) paragraphs(box, d.body); else pendingText(box, f.body);
      const ids = page.sources || (book.sources || []).map(s => s.id);
      const list = (book.sources || []).filter(s => ids.includes(s.id));
      if (list.length) {
        box.append(h('h5', 'gvb-notes-sub', t('book.sources')));
        const ul = h('ul', 'gvb-sources');
        for (const s of list) {
          const li = h('li');
          let safe = null; try { const u = new URL(s.url); safe = /^https?:$/.test(u.protocol) ? u.href : null; } catch (e) { safe = null; }
          const label = h(safe ? 'a' : 'span', '', inLang(s.title, lang));
          if (safe) { label.href = safe; label.target = '_blank'; label.rel = 'noopener noreferrer'; }
          li.append(label);
          if (s.publisher) li.append(h('span', 'gvb-src-pub', ' · ' + inLang(s.publisher, lang)));
          ul.append(li);
        }
        box.append(ul);
      }
      if (page.credits !== false && (book.credits || []).length) {
        box.append(h('h5', 'gvb-notes-sub', t('book.credits')));
        const ul = h('ul', 'gvb-sources');
        for (const c of book.credits) ul.append(h('li', '', `${inLang(c.role, lang)}: ${c.name}${c.license ? ' · ' + c.license : ''}`));
        box.append(ul);
      }
      body.append(box);
    }
    if (tx.fallback) body.append(h('p', 'gvb-fallback', t('book.viOnly')));
    el.append(footer(index + 1));
    return el;
  }

  function buildCover(book, lang) {
    const spec = L.spec('cover');
    const el = h('article', 'gvb-page gvb-cover gvb-pr');
    if (book.cover?.style === 'linen') el.classList.add('gvb-cover-linen');
    el.lang = lang;
    el.setAttribute('aria-label', t('book.cover'));
    const frame = h('div', 'gvb-cover-frame');
    const logo = h('img', 'gvb-cover-logo'); logo.src = LOGO; logo.alt = 'Gói Việt'; logo.decoding = 'async';
    const title = inLang(book.title, lang) || '';
    const [main, ...rest] = title.split(/\s+[–-]\s+/);
    const h3 = h('h3', 'gvb-cover-title gvb-fit');
    h3.append(h('span', 'gvb-cover-main', main));
    if (rest.length) h3.append(h('span', 'gvb-cover-rest', rest.join(' – ')));
    frame.append(logo, ornament('gvb-orn-center'), h3, h('span', 'gvb-stamp gvb-stamp-cover', stampFor(book, lang)), ornament('gvb-orn-center'));
    const sub = inLang(book.subtitle, lang);
    if (sub) frame.append(h('p', 'gvb-cover-sub', sub));
    frame.append(figure(book, book.cover && book.cover.art, spec.art, lang));
    if (book.kind) frame.append(h('span', 'gvb-cover-kind', t('book.kind.' + book.kind)));
    el.append(frame);
    return el;
  }

  function buildBack(book, lang) {
    const el = h('article', 'gvb-page gvb-back gvb-pl');
    const linen = book.cover?.style === 'linen';
    if (linen) el.classList.add('gvb-back-linen');
    el.lang = lang;
    el.setAttribute('aria-label', t('book.backCover'));
    const frame = h('div', 'gvb-back-frame');
    const chip = h('span', 'gvb-back-logo');
    const logo = h('img'); logo.src = linen ? LOGO : LOGO_IVORY; logo.alt = 'Gói Việt'; logo.decoding = 'async';
    chip.append(logo);
    const text = h('p', 'gvb-back-text gvb-fit');
    const lines = [].concat(inLang(book.back && book.back.text, lang) || []);
    lines.forEach((line, i) => { if (i) text.append(document.createElement('br')); text.append(line); });
    const small = h('small', 'gvb-back-small');
    small.append(inLang(book.title, lang) || '', document.createElement('br'), 'Gói Việt · ' + t('book.library'));
    const play = h('button', 'gvb-play', t('book.playCards', { place: placeName(book.placeId) }));
    play.type = 'button';
    play.dataset.act = 'play';
    frame.append(chip, h('span', 'gvb-rule'), text, h('span', 'gvb-rule'), small, play);
    if (book.back?.art) frame.insertBefore(figure(book, book.back.art, { ratio: 2.3 }, lang), small);
    el.append(frame);
    return el;
  }

  function editionFile(book, item, lang) {
    const edition = book.editions?.[lang];
    if (!edition) return null;
    const file = item.kind === 'cover' ? edition.cover
      : item.kind === 'page' && book._pages[item.index]?.page ? edition.spreads?.[Math.floor(item.index / 2)] : null;
    return file ? book._base + file : null;
  }

  function buildEditionPage(book, item, lang, file) {
    const cover = item.kind === 'cover';
    const right = item.index % 2 === 1;
    const page = h('article', 'gvb-page gvb-plate ' + (cover ? 'gvb-plate-cover' : right ? 'gvb-plate-right' : ''));
    if (!cover && book.editions[lang].trimMatte) page.classList.add('gvb-plate-trim', 'gvb-bound-leaf');
    page.lang = lang;
    page.setAttribute('aria-label', cover ? t('book.cover') : t('book.page', { a: item.index + 1, total: book._pages.length }));
    const copy = h('div', 'gvb-plate-copy');
    if (cover) {
      copy.append(h('h3', '', inLang(book.title, lang)), h('p', '', inLang(book.subtitle, lang)));
      const alt = inLang(book.art?.[book.cover?.art]?.alt, lang);
      if (alt) copy.append(h('p', '', alt));
    } else {
      const { page: content, section } = book._pages[item.index];
      const tx = textOf(content, lang);
      page.dataset.pageId = content.id || '';
      page.dataset.index = item.index;
      copy.lang = tx.lang;
      copy.append(h('h3', '', inLang(section.title, lang)));
      const alt = inLang(book.art?.[content.art]?.alt, lang);
      if (alt) copy.append(h('p', '', alt));
      if (tx.data?.heading) copy.append(h('h4', '', tx.data.heading));
      paragraphs(copy, tx.data?.body);
      if (tx.data?.quote) copy.append(h('blockquote', '', tx.data.quote));
      if (tx.data?.caption) copy.append(h('p', '', tx.data.caption));
    }
    const image = h('img', 'gvb-plate-art');
    image.alt = '';
    image.decoding = 'async';
    image.draggable = false;
    image.addEventListener('error', () => {
      if (!page.isConnected) return;
      const fallback = cover ? buildCover(book, lang) : buildPage(book, item.index, lang);
      page.replaceWith(fallback);
      fit(fallback, null);
    }, { once: true });
    page.append(image, copy);
    image.src = file;
    return page;
  }

  // Shrink a page's text (down to MIN_FIT) until every .gvb-fit box fits; remember the result per page and language.
  const fitCache = new Map();
  function fit(el, key) {
    if (!el || !el.isConnected) return null;
    const boxes = el.querySelectorAll('.gvb-fit');
    if (!boxes.length) return 1;
    // 2 px tolerance: stacked Vietnamese marks can poke a little above the line box without hiding any text.
    const over = () => Array.from(boxes).some(b => b.scrollHeight > b.clientHeight + 2 || b.scrollWidth > b.clientWidth + 2);
    let f = key && fitCache.has(key) ? fitCache.get(key) : 1;
    el.style.setProperty('--fit', f);
    // Sizes scale with the page, so a remembered value usually fits; rounding at other page sizes can differ, so re-check.
    if (!key || !fitCache.has(key) || over()) {
      while (over() && f > L.MIN_FIT + 1e-6) { f = Math.max(L.MIN_FIT, +(f - 0.035).toFixed(3)); el.style.setProperty('--fit', f); }
      if (key) fitCache.set(key, f);
    }
    const overflow = over();
    if (overflow) { el.dataset.overflow = 'true'; if (DRAFT) console.warn('[sách] Chữ tràn ô:', el.dataset.pageId || el.className, 'cỡ', f); }
    else delete el.dataset.overflow;
    return { fit: f, overflow };
  }

  // ---------------------------------------------------------------- reader state and modal
  const R = { el: null, placeId: null, book: null, kind: null, mode: 'two', view: 0, busy: null, panel: null, fontPx: 21, trigger: null, ro: null };
  const positions = new Map();
  function savePosition() {
    const page = firstPageOfView(R.view);
    positions.set(R.placeId, page);
    try { localStorage.setItem('goiviet-book-page:' + R.placeId, String(page)); } catch {}
  }
  function savedPosition(placeId) {
    if (positions.has(placeId)) return positions.get(placeId);
    try {
      const value = localStorage.getItem('goiviet-book-page:' + placeId);
      if (value === 'Infinity') return Infinity;
      if (value !== null && Number.isInteger(Number(value))) return Number(value);
    } catch {}
    return -1;
  }

  function pageCount() { return R.book._pages.length - Number(Boolean(R.book._pages.at(-1)?.blank)); }
  function lastView() {
    if (!R.book) return 0;
    const P = R.book._pages.length;
    return R.mode === 'two' ? P / 2 + 1 : pageCount() + 1;
  }
  // What occupies the slots for a view: {kind:'cover'|'back'|'page', index}.
  function contents(view) {
    const P = R.book._pages.length;
    if (R.mode === 'two') {
      if (view <= 0) return { left: null, right: { kind: 'cover' } };
      if (view >= P / 2 + 1) return { left: { kind: 'back' }, right: null };
      return { left: { kind: 'page', index: 2 * view - 2 }, right: { kind: 'page', index: 2 * view - 1 } };
    }
    if (view <= 0) return { single: { kind: 'cover' } };
    if (view >= lastView()) return { single: { kind: 'back' } };
    return { single: { kind: 'page', index: view - 1 } };
  }
  function firstPageOfView(view) {
    const c = contents(view);
    const item = R.mode === 'two' ? (c.left || c.right) : c.single;
    return item.kind === 'cover' ? -1 : item.kind === 'back' ? Infinity : item.index;
  }
  function viewOfPage(index) {
    if (index < 0) return 0;
    if (index === Infinity) return lastView();
    return R.mode === 'two' ? Math.floor(index / 2) + 1 : index + 1;
  }
  function buildItem(item) {
    const lang = I.lang();
    if (!item) return null;
    const file = editionFile(R.book, item, lang);
    if (file) return buildEditionPage(R.book, item, lang, file);
    if (item.kind === 'cover') return buildCover(R.book, lang);
    if (item.kind === 'back') return buildBack(R.book, lang);
    return buildPage(R.book, item.index, lang);
  }
  function fill(slot, item) {
    const el = buildItem(item);
    slot.replaceChildren(...(el ? [el] : []));
    slot.classList.toggle('gvb-has', Boolean(el));
    if (el) fit(el, item.kind === 'page' ? `${R.book.placeId}:${item.index}:${I.lang()}` : `${R.book.placeId}:${item.kind}:${I.lang()}`);
  }

  function ensureModal() {
    if (R.el) return R.el;
    const el = h('div', 'modal-backdrop gvb-modal');
    el.id = 'bookModal';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'gvbTitle');
    el.innerHTML = `
      <svg aria-hidden="true" width="0" height="0" style="position:absolute">
        <filter id="gvb-paper-tone" color-interpolation-filters="sRGB">
          <feComponentTransfer>
            <feFuncG type="table" tableValues="0 .25 .51 .82 1"/>
            <feFuncB type="table" tableValues="0 .25 .63 .89 1"/>
          </feComponentTransfer>
        </filter>
      </svg>
      <div class="gvb-shell">
        <header class="gvb-bar">
          <div class="gvb-bar-copy"><span class="gvb-bar-kicker"></span><h2 id="gvbTitle"></h2></div>
          <span class="gvb-badge" hidden></span>
          <div class="gvb-bar-actions">
            <button type="button" class="gvb-btn" data-act="toc"></button>
            <button type="button" class="gvb-btn" data-act="text"></button>
            <button type="button" class="gvb-btn gvb-btn-close" data-act="close"></button>
          </div>
        </header>
        <div class="gvb-stage">
          <div class="gvb-book">
            <div class="gvb-slot gvb-slot-l"></div><div class="gvb-slot gvb-slot-r"></div>
            <div class="gvb-turner" aria-hidden="true" inert hidden><div class="gvb-face gvb-face-front"></div><div class="gvb-face gvb-face-back"></div></div>
            <button type="button" class="gvb-edge gvb-edge-prev" data-act="prev" tabindex="-1"><span aria-hidden="true">←</span></button>
            <button type="button" class="gvb-edge gvb-edge-next" data-act="next" tabindex="-1"><span aria-hidden="true">→</span></button>
          </div>
          <div class="gvb-soon" hidden></div>
          <p class="gvb-status" role="status" hidden></p>
        </div>
        <nav class="gvb-nav">
          <button type="button" class="gvb-btn gvb-nav-btn" data-act="prev"></button>
          <div class="gvb-position">
            <output class="gvb-pos" aria-live="polite" aria-atomic="true"></output>
            <input type="range" class="gvb-page-range" min="0" step="1" value="0">
          </div>
          <button type="button" class="gvb-btn gvb-nav-btn" data-act="next"></button>
        </nav>
        <p class="gvb-hint"></p>
        <nav class="gvb-chapters" hidden></nav>
        <section class="gvb-panel" data-panel="toc" hidden aria-labelledby="gvbTocTitle">
          <div class="gvb-panel-sheet">
            <header class="gvb-panel-top"><div><span class="gvb-panel-kicker"></span><h3 id="gvbTocTitle"></h3></div><button type="button" class="gvb-btn" data-act="panel-close"></button></header>
            <div class="gvb-toc-grid"></div>
          </div>
        </section>
        <section class="gvb-panel" data-panel="text" hidden aria-labelledby="gvbTextTitle">
          <div class="gvb-panel-sheet gvb-text-sheet">
            <header class="gvb-panel-top"><div><span class="gvb-panel-kicker"></span><h3 id="gvbTextTitle"></h3></div><button type="button" class="gvb-btn" data-act="panel-close"></button></header>
            <div class="gvb-text-tools"><span class="gvb-text-size-label"></span><button type="button" class="gvb-btn" data-act="font-down">A−</button><output class="gvb-font-val"></output><button type="button" class="gvb-btn" data-act="font-up">A+</button></div>
            <article class="gvb-large"></article>
            <nav class="gvb-text-nav"><button type="button" class="gvb-btn" data-act="sec-prev"></button><button type="button" class="gvb-btn" data-act="sec-next"></button></nav>
          </div>
        </section>
      </div>`;
    document.body.append(el);
    R.el = el;
    R.stage = el.querySelector('.gvb-stage');
    R.bookEl = el.querySelector('.gvb-book');
    R.left = el.querySelector('.gvb-slot-l');
    R.right = el.querySelector('.gvb-slot-r');
    R.turner = el.querySelector('.gvb-turner');
    R.front = el.querySelector('.gvb-face-front');
    R.backFace = el.querySelector('.gvb-face-back');
    R.turner.addEventListener('transitionend', event => {
      if (event.target === R.turner && event.propertyName === 'transform') finishTurn();
    });
    el.addEventListener('click', onClick);
    el.addEventListener('keydown', onKey);
    el.querySelector('.gvb-page-range').addEventListener('change', event => jumpToView(event.target.valueAsNumber));
    R.ro = new ResizeObserver(() => { if (R.el.classList.contains('open') && R.kind === 'book') relayout(); });
    R.ro.observe(R.stage);
    return el;
  }

  function syncChrome() {
    const el = R.el;
    el.lang = I.lang();
    const openCall = R.kind === 'soon' && statusOf(R.placeId) === 'none';
    el.classList.toggle('gvb-open-call', openCall);
    el.classList.toggle('gvb-illustrated-edition', R.kind === 'book' && Boolean(R.book?.editions?.[I.lang()]));
    el.querySelector('.gvb-bar-kicker').textContent = t('book.kicker');
    const title = R.kind === 'book' && R.book ? inLang(R.book.title, I.lang()) : R.kind === 'soon' || R.kind === 'error' ? t('book.soon.title') + ' · ' + placeName(R.placeId) : t('book.loading');
    el.querySelector('#gvbTitle').textContent = openCall ? t('book.soon.kicker') : title;
    const badge = el.querySelector('.gvb-badge');
    badge.hidden = !(R.kind === 'book' && statusOf(R.placeId) !== 'published');
    badge.textContent = t('book.draft');
    badge.title = t('book.draftNote');
    const isBook = R.kind === 'book';
    const toc = el.querySelector('[data-act="toc"]'), txt = el.querySelector('[data-act="text"]'), close = el.querySelector('[data-act="close"]');
    toc.textContent = t('book.toc'); toc.hidden = !isBook;
    txt.textContent = t('book.largeText'); txt.hidden = !isBook;
    close.textContent = '← ' + t('book.close'); close.setAttribute('aria-label', t('book.closeLabel'));
    el.querySelector('.gvb-nav').hidden = !isBook;
    el.querySelector('.gvb-page-range').setAttribute('aria-label', t('book.choosePage'));
    const chapters = el.querySelector('.gvb-chapters');
    chapters.hidden = !isBook;
    chapters.setAttribute('aria-label', t('book.toc'));
    if (isBook) chapters.replaceChildren(...sectionStarts().map(({ section, index }) => {
      const button = h('button', 'gvb-chapter', inLang(section.label, I.lang()));
      button.type = 'button';
      button.dataset.act = 'goto';
      button.dataset.target = index;
      return button;
    }));
    el.querySelector('.gvb-hint').hidden = !isBook;
    el.querySelector('.gvb-hint').textContent = t('book.hint');
    el.querySelector('.gvb-book').hidden = !isBook;
    const [np, nn] = el.querySelectorAll('.gvb-nav-btn');
    np.textContent = '← ' + t('book.prev'); np.setAttribute('aria-label', t('book.prevLabel'));
    nn.textContent = t('book.next') + ' →'; nn.setAttribute('aria-label', t('book.nextLabel'));
    el.querySelector('.gvb-edge-prev').setAttribute('aria-label', t('book.prevLabel'));
    el.querySelector('.gvb-edge-next').setAttribute('aria-label', t('book.nextLabel'));
    for (const panel of el.querySelectorAll('.gvb-panel')) panel.querySelector('[data-act="panel-close"]').textContent = '× ' + t('book.closePanel');
    const toch = el.querySelector('[data-panel="toc"]');
    toch.querySelector('.gvb-panel-kicker').textContent = t('book.tocKicker');
    toch.querySelector('h3').textContent = t('book.tocTitle');
    const texth = el.querySelector('[data-panel="text"]');
    texth.querySelector('.gvb-panel-kicker').textContent = t('book.textKicker');
    texth.querySelector('h3').textContent = t('book.textTitle');
    texth.querySelector('.gvb-text-size-label').textContent = t('book.fontSize');
    texth.querySelector('[data-act="font-down"]').setAttribute('aria-label', t('book.fontDown'));
    texth.querySelector('[data-act="font-up"]').setAttribute('aria-label', t('book.fontUp'));
    texth.querySelector('[data-act="sec-prev"]').textContent = t('book.sectionPrev');
    texth.querySelector('[data-act="sec-next"]').textContent = t('book.sectionNext');
  }

  // ---------------------------------------------------------------- geometry and views
  function relayout() {
    const r = R.stage.getBoundingClientRect();
    const W = Math.max(200, r.width - 24), H = Math.max(200, r.height - 26);
    const two = W / H >= 1.2;
    const pageW = two ? Math.min((r.width - 112) / 2, H * 0.75) : Math.min(W, H * 0.75);
    const prevMode = R.mode, keepPage = R.book ? firstPageOfView(R.view) : -1;
    R.mode = two ? 'two' : 'single';
    R.bookEl.style.setProperty('--u', (pageW / 100).toFixed(3) + 'px');
    R.bookEl.style.width = (two ? pageW * 2 : pageW) + 'px';
    R.bookEl.style.height = (pageW * 4 / 3) + 'px';
    R.bookEl.dataset.mode = R.mode;
    if (R.book && prevMode !== R.mode) { finishTurn(); setView(viewOfPage(keepPage)); }
  }
  function setBookPosition(view) {
    const two = R.mode === 'two';
    R.bookEl.classList.toggle('gvb-closed', two && view === 0);
    R.bookEl.classList.toggle('gvb-ended', two && view === lastView());
  }
  function setView(view) {
    view = clamp(view, 0, lastView());
    R.view = view;
    const c = contents(view);
    if (R.mode === 'two') { fill(R.left, c.left); fill(R.right, c.right); }
    else { fill(R.left, null); fill(R.right, c.single); }
    setBookPosition(view);
    syncNav();
    preload(view);
  }
  function finishTurn() {
    if (!R.busy) return;
    const b = R.busy;
    R.busy = null;
    clearTimeout(b.timer);
    const slot = b.fwd ? R.left : R.right;
    const page = R.backFace.firstElementChild;
    slot.replaceChildren(...(page ? [page] : []));
    slot.classList.toggle('gvb-has', Boolean(page));
    R.turner.hidden = true;
    R.turner.className = 'gvb-turner';
    R.front.replaceChildren(); R.backFace.replaceChildren();
    setBookPosition(R.view);
  }
  function turn(target) {
    const fwd = target > R.view, cur = contents(R.view), next = contents(target);
    R.turner.className = 'gvb-turner ' + (fwd ? 'gvb-turn-fwd' : 'gvb-turn-bwd');
    R.turner.classList.toggle('gvb-turn-from-cover', R.view === 0 || R.view === lastView());
    R.turner.classList.toggle('gvb-turn-to-cover', target === 0 || target === lastView());
    R.turner.hidden = false;
    const put = (face, item) => { const el = buildItem(item); face.replaceChildren(...(el ? [el] : [])); face.classList.toggle('gvb-has', Boolean(el)); if (el) fit(el, item.kind === 'page' ? `${R.book.placeId}:${item.index}:${I.lang()}` : `${R.book.placeId}:${item.kind}:${I.lang()}`); };
    put(R.front, fwd ? cur.right : cur.left);
    put(R.backFace, fwd ? next.left : next.right);
    if (fwd) fill(R.right, next.right); else fill(R.left, next.left);
    void R.turner.offsetWidth;
    R.view = target;
    syncNav();
    const motion = R.busy = { fwd, timer: setTimeout(finishTurn, TURN_MS + 60) };
    requestAnimationFrame(() => {
      if (R.busy !== motion) return;
      R.turner.classList.add('gvb-turning');
      setBookPosition(target);
    });
    preload(target);
  }
  function go(delta) {
    if (R.kind !== 'book' || !R.book) return;
    const target = clamp(R.view + delta, 0, lastView());
    if (target === R.view && !R.busy) return;
    finishTurn();
    if (target === R.view) return;
    if (R.mode === 'two' && !reduced() && Math.abs(target - R.view) === 1) turn(target);
    else setView(target);
    savePosition();
  }
  function jumpToView(view) {
    finishTurn();
    setView(view);
    savePosition();
  }
  function syncNav() {
    const out = R.el.querySelector('.gvb-pos');
    const P = pageCount(), last = lastView();
    let label;
    if (R.view === 0) label = t('book.cover');
    else if (R.view === last) label = t('book.backCover');
    else if (R.mode === 'two' && 2 * R.view <= P) label = t('book.pages', { a: 2 * R.view - 1, b: 2 * R.view, total: P });
    else if (R.mode === 'two') label = t('book.page', { a: P, total: P });
    else label = t('book.page', { a: R.view, total: P });
    out.textContent = label;
    const range = R.el.querySelector('.gvb-page-range');
    range.max = last;
    range.value = R.view;
    range.setAttribute('aria-valuetext', label);
    const activeSection = R.book._pages[firstPageOfView(R.view)]?.si;
    R.el.querySelectorAll('.gvb-chapter').forEach((button, index) => {
      if (index === activeSection) button.setAttribute('aria-current', 'true');
      else button.removeAttribute('aria-current');
    });
    const atCover = R.view === 0;
    const nav = R.el.querySelector('.gvb-nav');
    const [np, nn] = nav.querySelectorAll('.gvb-nav-btn');
    nav.toggleAttribute('data-cover', atCover);
    np.disabled = atCover;
    nn.disabled = R.view === last;
    const prevLabel = R.view === 1 ? t('book.closeCover') : t('book.prevLabel');
    np.textContent = '← ' + (R.view === 1 ? prevLabel : t('book.prev'));
    np.setAttribute('aria-label', prevLabel);
    nn.textContent = (atCover ? t('book.open') : t('book.next')) + ' →';
    nn.setAttribute('aria-label', atCover ? t('book.open') : t('book.nextLabel'));
    const atSpread = !atCover && R.view !== last && R.mode === 'two';
    const prevEdge = R.el.querySelector('.gvb-edge-prev');
    prevEdge.hidden = !atSpread;
    prevEdge.setAttribute('aria-label', prevLabel);
    R.el.querySelector('.gvb-edge-next').hidden = !atSpread;
  }
  // Warm only the neighboring views, sharing a single file for both halves of a finished spread.
  function preload(view) {
    const files = new Set();
    const lang = I.lang();
    for (const v of [view + 1, view - 1]) {
      if (v < 0 || v > lastView()) continue;
      const c = contents(v);
      for (const item of [c.left, c.right, c.single]) {
        if (!item) continue;
        const edition = editionFile(R.book, item, lang);
        if (edition) { files.add(edition); continue; }
        const id = item.kind === 'cover' ? R.book.cover?.art
          : item.kind === 'page' ? R.book._pages[item.index]?.page?.art : null;
        const art = R.book.art?.[id];
        if (art) files.add(R.book._base + art.file);
      }
    }
    for (const file of files) {
      const image = new Image();
      image.decoding = 'async';
      image.fetchPriority = 'low';
      image.src = file;
    }
  }

  // ---------------------------------------------------------------- panels: contents and large text
  function sectionStarts() {
    const starts = [];
    R.book._pages.forEach((e, i) => { if (e.page && (!starts.length || starts[starts.length - 1].si !== e.si)) starts.push({ si: e.si, index: i, section: e.section }); });
    return starts;
  }
  function openPanel(name) {
    finishTurn();
    R.panel = name;
    const lang = I.lang();
    for (const p of R.el.querySelectorAll('.gvb-panel')) p.hidden = p.dataset.panel !== name;
    const panel = R.el.querySelector(`[data-panel="${name}"]`);
    if (name === 'toc') {
      const grid = panel.querySelector('.gvb-toc-grid');
      grid.replaceChildren();
      const cur = firstPageOfView(R.view);
      const item = (label, title, artId, target, active) => {
        const b = h('button', 'gvb-toc-item' + (active ? ' gvb-active' : ''));
        b.type = 'button'; b.dataset.act = 'goto'; b.dataset.target = String(target);
        const a = artId && R.book.art && R.book.art[artId];
        const thumb = h('span', 'gvb-toc-thumb');
        if (a) { const img = h('img'); img.src = R.book._base + a.file; img.alt = ''; img.loading = 'lazy'; if (a.focus) img.style.objectPosition = a.focus; thumb.append(img); }
        b.append(thumb, h('small', '', label), h('strong', '', title));
        grid.append(b);
      };
      item(t('book.tocCover'), inLang(R.book.title, lang), R.book.cover && R.book.cover.art, -1, R.view === 0);
      const starts = sectionStarts();
      starts.forEach((s, k) => {
        const end = k + 1 < starts.length ? starts[k + 1].index : R.book._pages.length;
        const firstArt = R.book._pages.slice(s.index, end).map(e => e.page && e.page.art).find(Boolean);
        item(`${inLang(s.section.label, lang)} · ${t('book.pageShort', { a: s.index + 1 })}`, inLang(s.section.title, lang), firstArt, s.index, cur >= s.index && cur < end);
      });
    } else {
      renderLarge();
      const cur = firstPageOfView(R.view);
      const starts = sectionStarts();
      const at = starts.filter(s => s.index <= Math.max(0, cur)).pop() || starts[0];
      R.textSection = at ? at.si : 0;
      scrollLargeTo(cur >= 0 ? panel.querySelector(`[data-si="${R.textSection}"]`) : null);
    }
    setTimeout(() => panel.querySelector('[data-act="panel-close"]').focus(), 0);
  }
  function closePanel() {
    const name = R.panel;
    R.panel = null;
    for (const p of R.el.querySelectorAll('.gvb-panel')) p.hidden = true;
    const back = R.el.querySelector(`.gvb-bar [data-act="${name}"]`);
    if (back) back.focus();
  }
  function renderLarge() {
    const lang = I.lang();
    const art = R.el.querySelector('.gvb-large');
    art.style.fontSize = R.fontPx + 'px';
    R.el.querySelector('.gvb-font-val').textContent = R.fontPx;
    art.replaceChildren();
    let currentSi = -1, sec = null;
    for (const e of R.book._pages) {
      if (!e.page) continue;
      if (e.si !== currentSi) {
        currentSi = e.si;
        sec = h('section', 'gvb-large-sec');
        sec.dataset.si = e.si;
        sec.append(h('p', 'gvb-large-kicker', inLang(e.section.label, lang)), h('h3', '', inLang(e.section.title, lang)));
        art.append(sec);
      }
      const tx = textOf(e.page, lang), d = tx.data;
      if (!d) continue;
      const block = h('div', 'gvb-large-page');
      block.lang = tx.lang;
      if (d.heading) block.append(h('h4', '', d.heading));
      paragraphs(block, d.body);
      if (d.quote) { const q = h('blockquote'); q.append(h('p', '', d.quote)); block.append(q); }
      if (d.caption) block.append(h('p', 'gvb-large-caption', d.caption));
      if (tx.fallback && !sec.querySelector('.gvb-fallback')) sec.append(h('p', 'gvb-fallback', t('book.viOnly')));
      sec.append(block);
    }
  }
  // Scroll the large-text article so a section heading sits at the top (positions measured inside the scroller).
  function scrollLargeTo(section) {
    const scroller = R.el.querySelector('.gvb-large');
    scroller.scrollTop = section ? Math.max(0, section.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 12) : 0;
  }
  function moveTextSection(delta) {
    const secs = Array.from(R.el.querySelectorAll('.gvb-large-sec'));
    const idx = clamp(secs.findIndex(s => +s.dataset.si === R.textSection) + delta, 0, secs.length - 1);
    if (!secs[idx]) return;
    R.textSection = +secs[idx].dataset.si;
    scrollLargeTo(secs[idx]);
  }

  // ---------------------------------------------------------------- coming soon / loading / error
  function renderSoonInvite(name, openCall = false) {
    const contribute = window.GoiVietBookContribute;
    if (!contribute?.url) return null;
    let url;
    try { url = new URL(contribute.url); } catch { return null; }
    if (url.protocol !== 'https:') return null;

    const invite = h('section', 'gvb-soon-invite');
    invite.setAttribute('aria-labelledby', 'gvbSoonInviteTitle');
    const heading = h('h3', 'gvb-soon-invite-title', t('book.soon.inviteTitle'));
    heading.id = 'gvbSoonInviteTitle';
    const ideas = h('p', 'gvb-soon-ideas', t(openCall ? 'book.soon.openCallIdeas' : 'book.soon.ideas', { place: name }));
    const row = h('div', 'gvb-soon-contrib');
    if (contribute.qr) {
      const fig = h('figure', 'gvb-soon-qr');
      const img = h('img');
      img.src = contribute.qr;
      img.alt = t('book.soon.qrAlt');
      img.width = img.height = 128;
      img.decoding = 'async';
      fig.append(img, h('figcaption', '', t(openCall ? 'book.soon.scan' : 'book.soon.qrCaption')));
      row.append(fig);
    }
    const side = h('div', 'gvb-soon-contrib-copy');
    const link = h('a', 'gvb-btn gvb-soon-fanpage', t(openCall ? 'book.soon.send' : 'book.soon.fanpage') + ' ↗');
    link.href = url.href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    side.append(link, h('p', 'gvb-soon-consent', t('book.soon.consent')));
    if (openCall) row.prepend(side); else row.append(side);
    invite.append(heading, ideas, row);
    return invite;
  }

  function renderCommunityPostcard(name) {
    const feature = h('div', 'gvb-call-postcard');
    const caption = h('div', 'gvb-call-caption');
    const place = h('h3', 'gvb-call-place', name.replace(/^TP\.\s*/u, ''));
    const signature = h('div', 'gvb-call-signature');
    const logo = h('img', 'gvb-call-logo');
    logo.src = LOGO;
    logo.alt = 'Gói Việt';
    logo.width = 512;
    logo.height = 235;
    logo.decoding = 'async';
    signature.append(logo);
    caption.append(place);

    const postcards = window.GoiVietCommunityPostcards;
    const id = R.placeId;
    if (postcards && Object.hasOwn(postcards, id)) {
      const landmark = h('p', 'gvb-call-landmark', inLang(postcards[id], I.lang()));
      const art = h('img', 'gvb-call-art');
      art.alt = '';
      art.width = 1200;
      art.height = 800;
      art.decoding = 'async';
      art.addEventListener('error', () => art.remove(), { once: true });
      art.src = 'assets/goi-viet/books-5/postcards/' + id + '.webp';
      feature.append(art);
      caption.append(landmark);
    }
    signature.append(h('span', 'gvb-call-status', t('book.soon.stamp')));
    caption.append(signature);
    feature.append(caption);
    return feature;
  }

  function renderOpenCall(soon, name, play) {
    const copy = h('div', 'gvb-call-copy');
    copy.append(h('p', 'gvb-call-eyebrow', t('book.soon.community')));
    const invitation = renderSoonInvite(name, true);
    if (invitation) copy.append(invitation);
    else copy.append(h('h3', 'gvb-soon-invite-title', t('book.soon.title')),
      h('p', 'gvb-soon-ideas', t('book.soon.text', { place: name })));
    const actions = h('div', 'gvb-call-actions');
    play.classList.remove('gvb-btn-primary');
    actions.append(h('p', '', t('book.soon.playHint')), play);
    copy.append(actions);
    soon.append(renderCommunityPostcard(name), copy);
  }

  function renderSoon(kind) {
    const soon = R.el.querySelector('.gvb-soon');
    soon.hidden = false;
    soon.replaceChildren();
    const name = placeName(R.placeId);
    const play = h('button', 'gvb-btn gvb-btn-primary', t('book.playCards', { place: name }));
    play.type = 'button';
    play.dataset.act = 'play';
    if (R.el.classList.contains('gvb-open-call')) {
      renderOpenCall(soon, name, play);
      return;
    }
    const card = h('div', 'gvb-soon-book');
    const frame = h('div', 'gvb-soon-frame');
    const logo = h('img', 'gvb-soon-logo'); logo.src = LOGO_IVORY; logo.alt = 'Gói Việt'; logo.decoding = 'async';
    frame.append(logo, h('span', 'gvb-rule'), h('span', 'gvb-soon-kicker', t('book.soon.kicker')), h('strong', 'gvb-soon-place', name), h('span', 'gvb-stamp gvb-stamp-soon', t('book.soon.stamp')), h('span', 'gvb-rule'));
    card.append(frame);
    const copy = h('div', 'gvb-soon-copy');
    copy.append(h('p', '', kind === 'error' ? t('book.loadError') : t('book.soon.text', { place: name })));
    if (kind !== 'error') {
      const invite = renderSoonInvite(name);
      if (invite) copy.append(invite);
    }
    const actions = h('div', 'gvb-soon-actions');
    const back = h('button', 'gvb-btn', '← ' + t('book.back')); back.type = 'button'; back.dataset.act = 'close';
    actions.append(play, back);
    copy.append(actions);
    soon.append(card, copy);
  }

  // ---------------------------------------------------------------- open / close / events
  async function open(placeId, opts = {}) {
    if (!placeId) return;
    ensureModal();
    finishTurn();
    R.placeId = placeId;
    R.book = null;
    R.panel = null;
    const wasOpen = R.el.classList.contains('open');
    R.trigger = opts.source || document.activeElement;
    for (const p of R.el.querySelectorAll('.gvb-panel')) p.hidden = true;
    R.el.querySelector('.gvb-soon').hidden = true;
    const status = R.el.querySelector('.gvb-status');
    status.hidden = true;
    if (!canRead(placeId)) {
      R.kind = 'soon';
      syncChrome(); renderSoon('soon');
      show(wasOpen);
      say(t('book.announceSoon', { place: placeName(placeId) }));
      return R.kind;
    }
    R.kind = 'loading';
    syncChrome();
    status.hidden = false; status.textContent = t('book.loading');
    show(wasOpen);
    const book = await load(placeId);
    if (R.placeId !== placeId || !R.el.classList.contains('open')) return null;
    status.hidden = true;
    if (!book) { R.kind = 'error'; syncChrome(); renderSoon('error'); return R.kind; }
    R.book = book;
    R.kind = 'book';
    syncChrome();
    relayout();
    // P5-02: from a card, open at the section whose cardIds name that card (content-matched link); else where it was left.
    const cardPage = opts.cardId ? book._pages.findIndex(e => e.section && (e.section.cardIds || []).includes(opts.cardId)) : -1;
    setView(viewOfPage(opts.page ?? (cardPage >= 0 ? cardPage : savedPosition(placeId))));
    say(t('book.announceOpen', { title: inLang(book.title, I.lang()) }));
    // Only real book content counts as "read" (the coming-soon page does not).
    document.dispatchEvent(new CustomEvent('goiviet:bookshown', { detail: { placeId, status: statusOf(placeId) } }));
    return R.kind;
  }
  function show(wasOpen) {
    if (wasOpen) return;
    R.el.classList.add('open');
    try { pushModalFocus('bookModal', R.trigger); } catch (e) { setTimeout(() => R.el.querySelector('[data-act="close"]').focus(), 30); }
  }
  function close() {
    if (!R.el || !R.el.classList.contains('open')) return;
    finishTurn();
    if (R.kind === 'book' && R.book) savePosition();
    R.el.classList.remove('open');
    R.panel = null;
    try { popModalFocus('bookModal'); } catch (e) { /* page without the modal stack */ }
  }
  function playCards() {
    const id = R.placeId;
    close();
    if (typeof openDeckModal === 'function') openDeckModal(id);
  }
  function onClick(e) {
    const btn = e.target.closest('[data-act]');
    if (!btn || !R.el.contains(btn)) return;
    const act = btn.dataset.act;
    if (act === 'close') close();
    else if (act === 'prev') go(-1);
    else if (act === 'next') go(1);
    else if (act === 'toc' || act === 'text') openPanel(act);
    else if (act === 'panel-close') closePanel();
    else if (act === 'goto') { if (R.panel) closePanel(); jumpToView(viewOfPage(+btn.dataset.target)); }
    else if (act === 'font-down' || act === 'font-up') { R.fontPx = clamp(R.fontPx + (act === 'font-up' ? 2 : -2), 17, 31); renderLarge(); moveTextSection(0); }
    else if (act === 'sec-prev') moveTextSection(-1);
    else if (act === 'sec-next') moveTextSection(1);
    else if (act === 'play') playCards();
  }
  function onKey(e) {
    if (e.key === 'Escape') {
      e.preventDefault(); e.stopPropagation();
      if (R.panel) closePanel(); else close();
      return;
    }
    if (R.panel || R.kind !== 'book') return;
    const tag = (e.target.tagName || '').toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); go(1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(-1); }
  }
  document.addEventListener('goiviet:langchange', () => {
    if (!R.el || !R.el.classList.contains('open')) return;
    syncChrome();
    if (R.kind === 'book') { finishTurn(); setView(R.view); if (R.panel) openPanel(R.panel); }
    else if (R.kind === 'soon' || R.kind === 'error') renderSoon(R.kind);
  });

  // ---------------------------------------------------------------- measuring (content checker and limit study)
  // Renders every page of a book off-screen at a fixed page width and reports text fit, without opening the modal.
  async function measure(bookOrId, lang = I.lang(), pageW = 600) {
    const book = typeof bookOrId === 'string' ? await load(bookOrId) : prepare(Object.assign({}, bookOrId));
    if (!book) return null;
    const host = h('div', 'gvb-measure');
    host.style.setProperty('--u', (pageW / 100) + 'px');
    host.style.width = pageW + 'px';
    host.style.height = (pageW * 4 / 3) + 'px';
    document.body.append(host);
    const out = [];
    const run = (el, info) => { host.replaceChildren(el); const r = fit(el, null); out.push(Object.assign(info, { fit: r.fit, overflow: r.overflow })); };
    try {
      run(buildCover(book, lang), { index: -1, id: 'cover', layout: 'cover' });
      book._pages.forEach((e, i) => { if (e.page) run(buildPage(book, i, lang), { index: i, id: e.page.id, layout: e.page.layout, variant: e.page.variant || null }); });
      run(buildBack(book, lang), { index: Infinity, id: 'back', layout: 'back' });
    } finally { host.remove(); }
    return out;
  }
  function inspect() {
    return { open: Boolean(R.el && R.el.classList.contains('open')), placeId: R.placeId, kind: R.kind, view: R.view, lastView: R.book ? lastView() : null, mode: R.mode, lang: I.lang(), panel: R.panel, busy: Boolean(R.busy), status: R.placeId ? statusOf(R.placeId) : null, overflow: R.el ? Array.from(R.el.querySelectorAll('.gvb-slot [data-overflow]')).map(e => e.dataset.pageId) : [] };
  }

  window.GoiVietBooks = Object.freeze({ register, open, close, load, statusOf, canRead, measure, inspect, isOpen: () => Boolean(R.el && R.el.classList.contains('open')), draftMode: () => DRAFT });
})();
