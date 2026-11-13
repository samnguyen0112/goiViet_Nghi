/* Sao từ fortune-ritual-5.js; nhãn lên tàu VI/EN, cả hai nhánh chờ đến ga; giữ nguyên nghi thức và dữ liệu. */
/* Preview-5 copy of fortune-ritual.js (P5-02, P5-03): the reading button says "Đọc sách văn hóa" because it opens the
   culture book, and the interface text follows the VI/EN choice. Other previews keep fortune-ritual.js.
   The preview's bamboo ritual. The existing place data, focus stack and destination actions remain authoritative. */
(() => {
  'use strict';
  const modal = document.getElementById('bambooRollModal');
  const sheet = modal?.querySelector('.modal-sheet');
  if (!sheet || typeof openBambooRollModal !== 'function') return;
  const originalOpen = openBambooRollModal;
  const originalClose = closeBambooRollModal;
  const timers = new Set();
  let scope = 'all';
  let busy = false;
  let generation = 0;
  let lastPick = null;
  const T = (key, vars) => window.GoiVietI18n ? window.GoiVietI18n.t(key, vars) : key;
  const reduced = () => Boolean(state.reducedMotion || document.body.classList.contains('reduced-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches);
  const icon = (name) => {
    const paths = {
      close: '<path d="m6 6 12 12M18 6 6 18"/>',
      arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
      repeat: '<path d="M20 8a8 8 0 0 0-14-3L3 8m0-5v5h5M4 16a8 8 0 0 0 14 3l3-3m0 5v-5h-5"/>',
      book: '<path d="M12 5q-5-3-9 0v14q4-3 9 0 5-3 9 0V5q-4-3-9 0Zm0 0v14M6 8h3m-3 4h3m6-4h3m-3 4h3"/>',
      train: '<rect x="6" y="3" width="12" height="14" rx="3"/><path d="M6 9h12M12 3v6m-4 8-3 4m11-4 3 4M7 20h10"/><circle cx="9" cy="13" r=".8"/><circle cx="15" cy="13" r=".8"/>'
    };
    return `<svg class="ritual-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.arrow}</svg>`;
  };
  // Small carved signatures share one stroke weight and the map's muted palette.
  const bambooMotifs = [
    ['song-nuoc','M0 2q2-2 4 0t4 0M0 6q2-2 4 0t4 0'],
    ['la-tre','M1 7Q0 1 7 0Q9 6 1 7Zm0 0 5-5'],
    ['canh-sen','M4 8Q0 4 4 0q4 4 0 8ZM4 8Q-1 8 0 3q3 1 4 5Zm0 0q5 0 4-5-3 1-4 5Z'],
    ['day-nui','M0 7 3 1l2 4 1-2 2 4ZM2 3l1 1 1-1'],
    ['may','M1 6Q-1 3 2 3q0-4 4-2 3-1 2 3 2 3-2 3H2'],
    ['thuyen-buom','M4 0v6M3 1 0 5h3Zm2 0v4h3ZM0 6q4 4 8 0Z'],
    ['mat-troi','M4 0v1m0 6v1M0 4h1m6 0h1M1 1l1 1m4 4 1 1M7 1 6 2M2 6 1 7M4 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z'],
    ['anh-sao','M4 0q1 3 4 4-3 1-4 4-1-3-4-4 3-1 4-4Z'],
    ['bong-lua','M4 8V1M4 3Q0 3 1 0q3 0 3 3Zm0 3Q0 6 1 3q3 0 3 3Zm0-2q4 0 3-3-3 0-3 3Zm0 3q4 0 3-3-3 0-3 3Z'],
    ['chim','M0 3q3-1 4 3 1-4 4-6M3 5l1 1 2-1M4 6l-1 2'],
    ['den-long','M3 0h2M2 2h4q3 2 0 4H2q-3-2 0-4ZM3 2v4m2-4v4M3 7h2M4 7v1'],
    ['non-la','M0 6 4 0l4 6ZM1 6q3 2 6 0M2 5h4'],
    ['dot-tre','M3 8V0m2 8V0M2 3h4M3 5Q0 5 0 2q3 0 3 3Zm2 1q3 0 3-3-3 0-3 3Z'],
    ['nhip-cau','M0 7V4q4-6 8 0v3M0 5q4-5 8 0M2 3v3m2-4v4m2-3v3M0 7h8'],
    ['mai-dinh','M0 3q2 1 4-3 2 4 4 3M1 4h6M2 5v3m4-3v3M1 8h6M4 5v2'],
    ['hoa','M4 3Q0-2 2 3q-5 1 0 2-1 5 2 1 3 4 2-1 5-2 0-2 2-5-2 0ZM4 3v2'],
    ['quat-giay','M4 8 0 3q4-5 8 0ZM4 8V1M4 8 2 2m2 6 2-6'],
    ['ca','M1 4q3-5 5-1l2-2v6L6 5Q3 9 1 4ZM3 3v.1'],
    ['dieu','M4 0 8 3 4 6 0 3ZM4 0v6m0 0q-3 1 0 2'],
    ['mua','M1 0 0 3M5 0 4 3m4-2L7 4M3 4 2 7m4-2L5 8'],
    ['vo-so','M4 8 0 4q-1-5 3-3 1-3 2 0 4-2 3 3ZM4 8 2 2m2 6V1m0 7 2-6'],
    ['nut-ket','M4 4Q-2-1 1 0q4-1 3 4Zm0 0Q3-2 7 0q4 1-3 4Zm0 0q7 4 3 4-4 1-3-4Zm0 0q1 5-3 4-4-1 3-4Z']
  ];
  const motifColors = ['#9e4934','#486b55','#a27d3d'];
  const carveMotif = (index,x,y) => `<g class="ritual-stick-motif" data-motif="${bambooMotifs[index][0]}" transform="translate(${x} ${y}) scale(.82)" stroke="${motifColors[index%3]}" stroke-width=".85" stroke-linecap="round" stroke-linejoin="round" opacity=".86"><path d="${bambooMotifs[index][1]}"/></g>`;

  // Closely packed slats, with their lower ends clipped inside the opening.
  const stickRows = [
    [[104,98,-2],[117,88,-1],[130,93,0],[143,79,-1],[156,91,1],[169,84,0],[182,96,1],[195,87,2],[208,101,2]],
    [[103,116,-1],[116,106,1],[129,114,-1],[142,101,0],[155,108,1],[168,100,-1],[181,112,0],[194,105,-1],[207,118,1]],
    [[118,129,0],[144,122,-1],[170,126,1],[196,124,0]]
  ];
  const sticks = stickRows.map((row,layer) => `<g opacity="${layer === 0 ? '.9' : '1'}">${row.map(([x,y,a],i) => {
    const index = layer < 2 ? layer*9+i : 18+i;
    const width = 11+(index%3)*.45;
    const wood = ['ritual-stick-wood','ritual-stick-ivory','ritual-stick-honey'][index%3];
    return `<g transform="rotate(${a} ${x+width/2} 280)"><g class="ritual-bamboo-stick" style="--stick-delay:${index * -83}ms">
      <rect x="${x+.7}" y="${y+1}" width="${width}" height="210" rx="2" fill="#735633" opacity=".14"/>
      <rect x="${x}" y="${y}" width="${width}" height="210" rx="2" fill="url(#${wood})" stroke="#a17e4c" stroke-width=".65"/>
      <path d="M${x+2} ${y+4}v192" stroke="#fff0cc" stroke-width=".8" opacity=".6"/>
      <path d="M${x+3} ${y+3}h${width-6}" stroke="#fff2d4" stroke-width=".7" opacity=".8"/>
      ${carveMotif(index,x+(width-6.56)/2,y+8)}
      <path d="M${x+width/2} ${y+23}v${12+index%4*3}" stroke="${motifColors[index%3]}" stroke-width=".55" opacity=".32"/>
      <path d="M${x+width-3} ${y+43}q${index%2 ? '-1.2' : '1.2'} 24 0 48t0 42" stroke="#ab8751" stroke-width=".55" opacity=".25"/>
    </g></g>`;
  }).join('')}</g>`).join('');
  const cylinder = `<svg class="ritual-cylinder-art" viewBox="0 0 320 360" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="ritual-stick-wood"><stop stop-color="#c7a36a"/><stop offset=".35" stop-color="#f3dfb5"/><stop offset=".75" stop-color="#ead1a0"/><stop offset="1" stop-color="#d1ad72"/></linearGradient>
      <linearGradient id="ritual-stick-ivory"><stop stop-color="#d0b483"/><stop offset=".35" stop-color="#f7e8c7"/><stop offset=".75" stop-color="#efdbb3"/><stop offset="1" stop-color="#d4b884"/></linearGradient>
      <linearGradient id="ritual-stick-honey"><stop stop-color="#be9b62"/><stop offset=".35" stop-color="#e9cfa0"/><stop offset=".75" stop-color="#dfc08c"/><stop offset="1" stop-color="#c7a267"/></linearGradient>
      <linearGradient id="ritual-rim-wood"><stop stop-color="#a57a49"/><stop offset=".2" stop-color="#d8b27b"/><stop offset=".44" stop-color="#f0d5a0"/><stop offset=".73" stop-color="#ddba81"/><stop offset="1" stop-color="#a67b49"/></linearGradient>
      <linearGradient id="ritual-lacquer"><stop stop-color="#71282d"/><stop offset=".14" stop-color="#a43137"/><stop offset=".36" stop-color="#c04445"/><stop offset=".62" stop-color="#b6383e"/><stop offset=".86" stop-color="#972d34"/><stop offset="1" stop-color="#70262c"/></linearGradient>
      <linearGradient id="ritual-band-gold"><stop stop-color="#a58149"/><stop offset=".18" stop-color="#dfbd79"/><stop offset=".38" stop-color="#f7df9f"/><stop offset=".72" stop-color="#e5c682"/><stop offset="1" stop-color="#ac8750"/></linearGradient>
      <linearGradient id="ritual-gold-ink"><stop stop-color="#bc945d"/><stop offset=".45" stop-color="#f1d59e"/><stop offset="1" stop-color="#caab72"/></linearGradient>
      <linearGradient id="ritual-mouth" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#60442b"/><stop offset="1" stop-color="#8b653b"/></linearGradient>
      <clipPath id="ritual-holder-body"><path d="M84 182a76 28 0 0 0 152 0c4 42 4 97 0 139a76 23 0 0 1-152 0c-4-42-4-97 0-139Z"/></clipPath>
      <clipPath id="ritual-sticks-in-mouth"><path d="M91-120h138v285a69 22 0 0 1-138 0Z"/></clipPath>
    </defs>
    <ellipse cx="160" cy="352" rx="78" ry="6" fill="#092d27" opacity=".26"/>
    <g transform="translate(16 0) scale(.9 1)">
    <ellipse cx="160" cy="165" rx="80" ry="30" fill="url(#ritual-rim-wood)" stroke="#967247" stroke-width="1.3"/>
    <ellipse cx="160" cy="165" rx="69" ry="22" fill="url(#ritual-mouth)" stroke="#a17d4d" stroke-width=".9"/>
    <path d="M92 163a68 21 0 0 1 136 0" stroke="#fae7bf" stroke-width="1.1" opacity=".75"/>
    <g clip-path="url(#ritual-sticks-in-mouth)">
      ${sticks}
      <g class="ritual-drawn-stick" opacity="0"><rect x="155" y="115" width="11" height="210" rx="2" fill="url(#ritual-stick-ivory)" stroke="#a17e4c" stroke-width=".65"/><path d="M157 119v192" stroke="#fff0cc" stroke-width=".8" opacity=".6"/>${carveMotif(2,157.22,123)}<path d="M160.5 138v21" stroke="#a27d3d" stroke-width=".55" opacity=".32"/></g>
    </g>
    <path d="M84 182a76 28 0 0 0 152 0c4 42 4 97 0 139a76 23 0 0 1-152 0c-4-42-4-97 0-139Z" fill="url(#ritual-lacquer)" stroke="#803332" stroke-width="1.3"/>
    <g clip-path="url(#ritual-holder-body)">
      <path d="M105 221q-2 40 0 84" stroke="#ffd5bc" stroke-width="12" stroke-linecap="round" opacity=".065"/>
      <path d="M101 228v10m0 13q-1 15 0 31" stroke="#ffd5bc" stroke-width="3.8" stroke-linecap="round" opacity=".3"/>
      <path d="M225 220q2 40 0 83" stroke="#55252a" stroke-width="5" stroke-linecap="round" opacity=".12"/>
    </g>
    <path d="M80 300a80 30 0 0 0 160 0v18a80 30 0 0 1-160 0Z" fill="url(#ritual-lacquer)" stroke="#803332" stroke-width="1.3"/>
    <path d="M89 325a71 19 0 0 0 142 0" stroke="#d98778" stroke-width="1.2" opacity=".35"/>
    <path d="M80 165a80 30 0 0 0 160 0v19a80 30 0 0 1-160 0Z" fill="url(#ritual-lacquer)" stroke="#803332" stroke-width="1.2"/>
    <path d="M80 165a80 30 0 0 0 160 0" stroke="#fae3ad" stroke-width="1.4"/>
    <path d="M99 186v8" stroke="#f8c6b3" stroke-width="3.2" stroke-linecap="round" opacity=".25"/>
    <g fill="url(#ritual-band-gold)" stroke="#a5824b" stroke-width="1.1">
      <path d="M80 185a80 30 0 0 0 160 0q3 0 3 4t-3 4a80 30 0 0 1-160 0q-3-1-3-4t3-4Z"/>
      <path d="M80 292a80 30 0 0 0 160 0q3 0 3 4t-3 4a80 30 0 0 1-160 0q-3-1-3-4t3-4Z"/>
    </g>
    <path d="M82 186a78 29 0 0 0 156 0M82 293a78 29 0 0 0 156 0" stroke="#fff0bd" stroke-width="1.15" opacity=".8"/>
    <g transform="translate(160 275) scale(1.12) translate(-160 -248)" stroke="url(#ritual-gold-ink)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M160 257q-15-8 0-27 15 19 0 27Z"/>
      <path d="M160 257q-20 1-20-18 15 0 20 18Zm0 0q20 1 20-18-15 0-20 18Z"/>
      <path d="M160 257q-14 8-24-3 7-4 13-2m11 5q14 8 24-3-7-4-13-2"/>
    </g>
    </g>
  </svg>`;

  modal.classList.add('fortune-ritual');
  modal.setAttribute('aria-describedby', 'ritualAccessibleDescription');
  sheet.innerHTML = `
    <header class="modal-header ritual-header">
      <img class="ritual-brand" src="assets/goi-viet/brand/goi-viet-logo-512.webp" width="1850" height="850" alt="Gói Việt">
      <div class="ritual-heading-copy"><span class="ritual-overline" data-i18n="ritual.overline">NGHI THỨC KHỞI HÀNH</span><h2 id="bambooModalHeading" data-i18n="ritual.title">Rút xăm hành trình</h2></div>
      <button type="button" class="ritual-close" aria-label="Đóng hộp rút xăm" title="Đóng" data-i18n-label="ritual.closeLabel" data-i18n-title="ritual.close">${icon('close')}</button>
    </header>
    <div class="modal-body ritual-body">
      <div class="ritual-composition">
        <section class="ritual-stage" aria-label="Ống xăm tre hành trình" data-i18n-label="ritual.stageLabel">
          <span class="ritual-stage-label" data-i18n="ritual.stageKicker">MỘT QUẺ TRE · MỘT ĐIỂM HẸN</span>
          <span class="ritual-halo" aria-hidden="true"></span>
          <span class="ritual-orbit" aria-hidden="true"></span>
          <span class="ritual-spark ritual-spark-one" aria-hidden="true">✦</span><span class="ritual-spark ritual-spark-two" aria-hidden="true">✧</span><span class="ritual-spark ritual-spark-three" aria-hidden="true">✦</span>
          <button type="button" id="bambooCylinderGraphic" class="ritual-cylinder" aria-label="${T('ritual.cylinderLabel')}">${cylinder}</button>
          <p id="ritualStageCaption" class="ritual-stage-caption">${T('ritual.caption.idle')}</p>
          <span class="ritual-stage-signature" aria-hidden="true" data-i18n="ritual.signature">DỌC MIỀN DI SẢN</span>
        </section>
        <section class="ritual-content">
          <p id="bambooTurnKicker" class="ritual-player"></p>
          <div id="ritualIdlePanel" class="ritual-invitation">
            <span class="ritual-overline" data-i18n="ritual.inviteKicker">ĐỂ MỘT CÂU THƠ DẪN LỐI</span>
            <h3 data-i18n="ritual.ask1|ritual.ask2">Hôm nay, mình<br> ghé miền nào?</h3>
            <p id="ritualAccessibleDescription" class="ritual-description" data-i18n="ritual.desc1|ritual.desc2">Lắc nhẹ ống tre, đón một quẻ xăm.<br> Mỗi điểm dừng mở ra một câu chuyện quê hương.</p>
            <div class="ritual-scope" role="group" aria-label="Chọn phạm vi rút xăm" data-i18n-label="ritual.scopeLabel">
              <button type="button" data-ritual-scope="all" aria-pressed="true"><strong>${ALL_PLAYABLE_PLACES.length}</strong><span data-i18n="ritual.scopeAll">Ga tỉnh &amp; đảo<small data-i18n="ritual.scopeAllHint">Dọc khắp Việt Nam</small></span></button>
              <button type="button" data-ritual-scope="featured" aria-pressed="false"><strong>${CULTURAL_PLACES.length}</strong><span data-i18n="ritual.scopeFeatured">Ga khởi đầu<small>Hà Nội · Huế · Sài Gòn</small></span></button>
            </div>
            <button type="button" id="ritualDrawButton" class="ritual-primary"><span class="ritual-draw-glyph" aria-hidden="true">✦</span><span id="ritualDrawLabel">${T('ritual.draw')}</span>${icon('arrow')}</button>
            <p class="ritual-invitation-note" data-i18n="ritual.note">Một chút bất ngờ, một miền thương nhớ.</p>
          </div>
          <div id="bambooResultContainer" hidden></div>
        </section>
      </div>
    </div>
    <footer class="ritual-footer">
      <ol class="ritual-steps" aria-label="Các bước rút xăm" data-i18n-label="ritual.stepsLabel"><li data-i18n="ritual.step1"><span>01</span>Lắc ống</li><li data-i18n="ritual.step2"><span>02</span>Rút quẻ</li><li data-i18n="ritual.step3"><span>03</span>Mở vé</li></ol>
      <span class="ritual-footer-note" data-i18n="ritual.footer">Một câu thơ · Một chuyến đi</span>
    </footer>
    <p id="ritualLiveStatus" class="ritual-sr-only" role="status" aria-live="polite" aria-atomic="true"></p>`;
  window.GoiVietI18nDom?.apply(sheet);

  const result = document.getElementById('bambooResultContainer');
  const invitation = document.getElementById('ritualIdlePanel');
  const cylinderButton = document.getElementById('bambooCylinderGraphic');
  const drawButton = document.getElementById('ritualDrawButton');
  const drawLabel = document.getElementById('ritualDrawLabel');
  const status = document.getElementById('ritualLiveStatus');
  const caption = document.getElementById('ritualStageCaption');
  const scopes = [...modal.querySelectorAll('[data-ritual-scope]')];
  const steps = [...modal.querySelectorAll('.ritual-steps li')];
  const composition = modal.querySelector('.ritual-composition');

  function cancel() {
    generation++;
    timers.forEach(clearTimeout);
    timers.clear();
    busy = false;
    composition.removeAttribute('aria-busy');
  }
  function later(fn, delay) {
    const token = generation;
    const id = setTimeout(() => {
      timers.delete(id);
      if (token === generation && modal.classList.contains('open')) fn();
    }, delay);
    timers.add(id);
  }
  function setPhase(phase) {
    modal.dataset.ritualPhase = phase;
    const current = phase === 'drawing' ? 1 : phase === 'revealed' ? 2 : 0;
    steps.forEach((el, i) => {
      el.classList.toggle('is-active', i === current);
      el.classList.toggle('is-complete', i < current);
      if (i === current) el.setAttribute('aria-current', 'step'); else el.removeAttribute('aria-current');
    });
  }
  function setScope(mode) {
    if (busy) return;
    scope = mode === 'featured' ? 'featured' : 'all';
    scopes.forEach(el => el.setAttribute('aria-pressed', String(el.dataset.ritualScope === scope)));
  }
  function setBusy(value) {
    busy = value;
    composition.setAttribute('aria-busy', String(value));
    cylinderButton.disabled = value;
    drawButton.disabled = value;
    drawLabel.textContent = T(value ? 'ritual.drawBusy' : 'ritual.draw');
    scopes.forEach(el => { el.disabled = value; });
  }
  function resetView() {
    cancel();
    setBusy(false);
    setPhase('idle');
    invitation.hidden = false;
    result.hidden = true;
    result.style.display = 'none';
    result.replaceChildren();
    caption.textContent = T('ritual.caption.idle');
    cylinderButton.setAttribute('aria-label', T('ritual.cylinderLabel'));
    status.textContent = '';
    setScope(scope);
    modal.classList.toggle('ritual-reduced-motion', reduced());
  }
  function open() {
    resetView();
    originalOpen();
    document.getElementById('bambooTurnKicker').textContent = T('ritual.turnOf', { name: getCurrentPlayerName() });
    modal.querySelector('.ritual-body').scrollTop = 0;
  }
  function close() {
    cancel();
    originalClose();
  }
  function reveal(picked) {
    state.lastRolledPlaceId = picked.id;
    lastPick = picked;
    const hl = picked.highlights || {};
    const short = picked.name.replace(/^(Thành phố|Tỉnh)\s+/i, '');
    const verse = getFolkVerseForPlace(picked).split('\n').map(line => `<span>${escapeHTML(line)}</span>`).join('');
    const glossText = typeof getFolkVerseGloss === 'function' ? getFolkVerseGloss(picked) : '';
    const gloss = glossText ? `<small class="gv-verse-gloss">${escapeHTML(glossText)}</small>` : '';
    result.innerHTML = `
      <article class="ritual-result-card">
        <div class="ritual-ticket-top"><span>${T('ritual.ticketTop')}</span><span>${T('ritual.ticketType')}</span></div>
        <div class="ritual-ticket-body">
          <span class="ritual-result-kicker">${T('ritual.resultKicker')}</span>
          <h3 id="ritualDestinationHeading" tabindex="-1">${escapeHTML(short)}</h3>
          <p class="ritual-result-region">${escapeHTML(picked.region || T('ritual.regionFallback'))}</p>
          <blockquote class="ritual-verse">${verse}${gloss}</blockquote>
          <div class="ritual-ticket-details"><div><span>${T('ritual.landmark')}</span><strong>${escapeHTML(hl.landmark || picked.name)}</strong></div><div><span>${T('ritual.flavor')}</span><strong>${escapeHTML(hl.cuisine || T('ritual.flavorFallback'))}</strong></div></div>
          <span class="ritual-ticket-seal" aria-hidden="true">GÓI<br>VIỆT</span>
        </div>
        <div class="ritual-ticket-stub"><span>${T('ritual.stub')}</span><span class="ritual-ticket-barcode" aria-hidden="true"></span></div>
      </article>
      <div class="ritual-result-actions"><button type="button" class="ritual-primary" data-ritual-action="destination"><span>${GoiVietI18n.t('arrival.ticketCards', {place:picked.short || picked.name})}</span></button><button type="button" class="ritual-secondary" data-ritual-action="story">${icon('book')}<span>${GoiVietI18n.t('arrival.ticketBook')}</span></button></div>
      <button type="button" class="ritual-reroll" data-ritual-action="reroll">${icon('repeat')}<span>${T('ritual.reroll')}</span></button>`;
    result.querySelector('[data-ritual-action="destination"]').addEventListener('click', () => acceptBambooRollDestination(picked.id));
    result.querySelector('[data-ritual-action="story"]').addEventListener('click', () => acceptBambooRollStory(picked.id));
    result.querySelector('[data-ritual-action="reroll"]').addEventListener('click', draw);
    invitation.hidden = true;
    result.hidden = false;
    result.style.display = 'block';
    setBusy(false);
    setPhase('revealed');
    caption.textContent = T('ritual.caption.picked', { place: short });
    cylinderButton.setAttribute('aria-label', T('ritual.reroll'));
    status.textContent = T('ritual.status.picked', { place: picked.name });
    FolkAudio.playPentatonicChime();
    document.getElementById('ritualDestinationHeading').focus({preventScroll: true});
  }
  function draw() {
    if (busy || !modal.classList.contains('open')) return;
    const pool = scope === 'featured' ? CULTURAL_PLACES : ALL_PLAYABLE_PLACES;
    const unvisited = pool.filter(p => !state.exploredPlaceIds.includes(p.id) && p.id !== state.selectedPlaceId && p.id !== window.GoiVietJourneyPreview?.inspect().currentId);
    const eligible = unvisited.length ? unvisited : pool;
    const different = eligible.filter(p => p.id !== lastPick?.id);
    const candidates = different.length ? different : eligible;
    const picked = candidates[Math.floor(Math.random() * candidates.length)] || CULTURAL_PLACES[0];
    if (!picked) return;
    cancel();
    result.hidden = true;
    result.style.display = 'none';
    invitation.hidden = false;
    setBusy(true);
    setPhase('shaking');
    modal.classList.toggle('ritual-reduced-motion', reduced());
    modal.querySelector('.ritual-body').scrollTo({top: 0, behavior: reduced() ? 'auto' : 'smooth'});
    caption.textContent = T('ritual.caption.shaking');
    status.textContent = T('ritual.status.shaking');
    FolkAudio.playBambooClack();
    if (reduced()) { reveal(picked); return; }
    for (const delay of [170, 370, 610, 850]) later(() => FolkAudio.playBambooClack(), delay);
    later(() => {
      setPhase('drawing');
      drawLabel.textContent = T('ritual.drawing');
      caption.textContent = T('ritual.caption.drawing');
      status.textContent = T('ritual.status.drawing');
      FolkAudio.playDrum(110);
    }, 1100);
    later(() => reveal(picked), 1900);
  }

  modal.querySelector('.ritual-close').addEventListener('click', close);
  drawButton.addEventListener('click', draw);
  cylinderButton.addEventListener('click', draw);
  scopes.forEach(el => el.addEventListener('click', () => setScope(el.dataset.ritualScope)));
  new MutationObserver(() => { if (!modal.classList.contains('open')) cancel(); }).observe(modal, {attributes: true, attributeFilter: ['class']});
  window.openBambooRollModal = open;
  window.closeBambooRollModal = close;
  window.shakeBambooCylinder = mode => { if (!busy) { setScope(mode || scope); draw(); } };
  document.addEventListener('goiviet:langchange', () => {
    if (!lastPick || result.hidden) return;
    const go = result.querySelector('[data-ritual-action="destination"] span');
    const read = result.querySelector('[data-ritual-action="story"] span');
    if (go) go.textContent = GoiVietI18n.t('arrival.ticketCards', {place:lastPick.short || lastPick.name});
    if (read) read.textContent = GoiVietI18n.t('arrival.ticketBook');
  });
  resetView();
})();
