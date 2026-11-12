/* Preview-5 copy of homepage-music-3.js (P5-03 slice 2): interface text follows the VI/EN choice (GoiVietI18n).
   Other pages keep homepage-music-3.js. */
// Optional opening music stays on this browser. No file upload or external song is required.
// Preview 3 copy: sync() runs on every opening frame, so it writes the DOM only when a value changes.
(() => {
  const clamp = (n, min, max) => Math.max(min, Math.min(max, Number(n) || 0));
  window.GoiVietHomeMusic = { create(getState) {
    const $ = id => document.getElementById(id), config = window.GoiVietHomeOpeningConfig;
    const picker = $('homeMusicFile'), name = $('homeMusicName'), volume = $('homeMusicVolume');
    const offset = $('homeMusicOffset'), keep = $('homeMusicContinue'), preview = $('btnHomeMusicPreview');
    const remove = $('btnHomeMusicRemove'), note = $('homeMusicStorageNote');
    const T = (key, fallback, vars) => { const I = window.GoiVietI18n; if (!I) return fallback; const value = I.t(key, vars); return value === key ? fallback : value; };
    // The built-in track's name is shown in the current language; a chosen file keeps its own name.
    const shown = value => (value && config && value === config.defaultMusicName ? T('music.default', value) : value);
    let audio = null, objectURL = null, label = '', previewing = false, userPaused = false;
    let blocked = false, playPending = false, failed = false, ended = false, revision = 0;
    const prefsKey = 'goi-viet-opening-music-prefs-v1';
    let preferences = { volume: config.volume, offset: config.musicOffset, keep: config.continueMusic };
    try { preferences = { ...preferences, ...JSON.parse(localStorage.getItem(prefsKey) || '{}') }; } catch (_) {}
    volume.value = clamp(preferences.volume, 0, 1); offset.value = Math.max(0, Number(preferences.offset) || 0); keep.checked = !!preferences.keep;
    const displayVolume = () => $('homeMusicVolumeValue').textContent = Math.round(Number(volume.value) * 100) + '%';
    displayVolume();
    const savePrefs = () => {
      displayVolume();
      try { localStorage.setItem(prefsKey, JSON.stringify({ volume: Number(volume.value), offset: Math.max(0, Number(offset.value) || 0), keep: keep.checked })); } catch (_) {}
    };
    const openDB = () => new Promise((resolve, reject) => {
      try {
        const request = indexedDB.open('goi-viet-opening-music-v1', 1);
        request.onupgradeneeded = () => request.result.createObjectStore('tracks');
        request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
        request.onblocked = () => reject(new Error('Music storage is busy'));
      } catch (error) { reject(error); }
    });
    const storage = async (operation, value) => {
      const db = await openDB();
      try {
        return await new Promise((resolve, reject) => {
          const tx = db.transaction('tracks', operation === 'get' ? 'readonly' : 'readwrite'), store = tx.objectStore('tracks');
          const request = operation === 'get' ? store.get('opening') : operation === 'put' ? store.put(value, 'opening') : store.delete('opening');
          let result; request.onsuccess = () => { result = request.result; };
          tx.oncomplete = () => resolve(result); tx.onerror = tx.onabort = () => reject(tx.error);
        });
      } finally { db.close(); }
    };
    const disposeAudio = () => {
      if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load(); }
      audio = null; if (objectURL) URL.revokeObjectURL(objectURL); objectURL = null; playPending = false;
    };
    const updateButtons = () => {
      // Rewriting an unchanged attribute or label still restyles the whole page.
      const off = !audio, pressed = String(!!audio && !audio.paused);
      const text = audio && !audio.paused ? T('music.stop', 'Tắt nhạc') : getState().phase === 'playing' ? T('music.play', 'Bật nhạc') : T('music.preview', 'Nghe thử');
      if (preview.disabled !== off) preview.disabled = off;
      if (remove.disabled !== off) remove.disabled = off;
      if (preview.textContent !== text) preview.textContent = text;
      if (preview.getAttribute('aria-pressed') !== pressed) preview.setAttribute('aria-pressed', pressed);
    };
    function sync(force = false, gesture = false) {
      if (!audio) { updateButtons(); return; }
      const state = getState(), start = Math.max(0, Number(offset.value) || 0);
      const outOfRange = Number.isFinite(audio.duration) && start >= audio.duration;
      // A status region: write the per-frame warning once; event messages below always rewrite.
      const rangeNote = shown(label) + T('music.rangeNote', ' · điểm bắt đầu vượt thời lượng bản nhạc');
      if (outOfRange && name.textContent !== rangeNote) name.textContent = rangeNote;
      const active = state.visible && (previewing || state.phase === 'fading' || state.phase === 'playing' || (state.phase === 'complete' && keep.checked));
      const wants = active && !userPaused && !failed && !ended && !outOfRange;
      const target = start + (previewing ? 0 : state.time);
      if (force && Number.isFinite(audio.duration) && !outOfRange) {
        try { audio.currentTime = Math.min(target, Math.max(0, audio.duration - .05)); } catch (_) {}
      }
      const fade = previewing || keep.checked ? 1 : clamp((config.duration - state.time) / config.musicFadeOut, 0, 1);
      audio.volume = state.phase === 'fading' ? 0 : clamp(volume.value, 0, 1) * fade;
      if (!wants || fade === 0) { audio.pause(); updateButtons(); return; }
      if (gesture) blocked = false;
      if (audio.paused && !playPending && !blocked) {
        const track = audio; playPending = true;
        track.play().then(() => {
          if (audio !== track) return;
          playPending = false; name.textContent = label; updateButtons();
          if (!getState().visible) track.pause();
        }).catch(error => {
          if (audio !== track) return;
          playPending = false;
          // Pausing/seeking can interrupt a pending play request; it is not an autoplay refusal.
          if (error.name === 'AbortError') { blocked = false; updateButtons(); return; }
          blocked = true;
          name.textContent = shown(label) + T('music.blockedNote', ' · nhấn Bật nhạc hoặc Nghe thử để phát'); updateButtons();
        });
      } else updateButtons();
    }
    function setTrack(blob, fileName) {
      disposeAudio(); objectURL = URL.createObjectURL(blob); audio = new Audio(objectURL); audio.preload = 'auto';
      label = fileName; failed = ended = blocked = userPaused = previewing = false;
      const track = audio; name.textContent = shown(label); updateButtons();
      track.addEventListener('loadedmetadata', () => { if (audio === track) sync(true); });
      track.addEventListener('error', () => { if (audio !== track) return; failed = true; name.textContent = T('music.unreadable', 'Không đọc được bản nhạc này. Hãy chọn MP3, WAV hoặc M4A khác.'); updateButtons(); });
      track.addEventListener('ended', () => { if (audio !== track) return; ended = true; previewing = false; name.textContent = shown(label) + T('music.endedNote', ' · bản nhạc đã kết thúc'); updateButtons(); });
      sync(true, true);
    }
    $('btnHomeMusicChoose').addEventListener('click', () => picker.click());
    picker.addEventListener('change', () => {
      const file = picker.files[0]; if (!file) return;
      if (!file.type.startsWith('audio/') && !/\.(mp3|wav|m4a|ogg|flac|aac|webm)$/i.test(file.name)) { name.textContent = T('music.notAudio', 'Hãy chọn một tệp âm thanh.'); picker.value = ''; return; }
      revision++; setTrack(file, file.name);
      storage('put', { blob: file, name: file.name }).then(() => { note.textContent = T('music.saved', 'Đã lưu bản nhạc trên trình duyệt này.'); }).catch(() => { note.textContent = T('music.notSaved', 'Trình duyệt chưa lưu được tệp. Bản nhạc vẫn dùng trong phiên này.'); });
    });
    remove.addEventListener('click', () => {
      revision++; disposeAudio(); label = ''; previewing = userPaused = failed = ended = blocked = false; picker.value = '';
      name.textContent = T('music.none', 'Chưa chọn nhạc'); updateButtons();
      storage('delete').then(() => { note.textContent = T('music.removed', 'Đã bỏ bản nhạc đã lưu.'); }).catch(() => { note.textContent = T('music.removedSession', 'Đã bỏ nhạc trong phiên này; chưa cập nhật được bộ nhớ trình duyệt.'); });
    });
    preview.addEventListener('click', () => {
      if (!audio) return;
      if (!audio.paused) { previewing = false; userPaused = true; audio.pause(); updateButtons(); }
      else { ended = blocked = userPaused = false; previewing = !['playing', 'complete'].includes(getState().phase) || (getState().phase === 'complete' && !keep.checked); sync(true, true); }
    });
    volume.addEventListener('input', () => { savePrefs(); sync(); });
    offset.addEventListener('input', () => { savePrefs(); ended = false; sync(true); });
    keep.addEventListener('change', () => { savePrefs(); sync(false, true); });
    const details = $('homeMusicSettings');
    // Labels this script writes, in the current language (also run once now: the page may open in English).
    const relabel = () => {
      updateButtons();
      if (!audio) name.textContent = T('music.none', 'Chưa chọn nhạc');
      else if (!failed && !ended && !blocked) name.textContent = shown(label);
    };
    document.addEventListener('goiviet:langchange', relabel);
    if (!audio) name.textContent = T('music.none', 'Chưa chọn nhạc');
    document.addEventListener('click', event => { if (details.open && !details.contains(event.target)) details.open = false; });
    const ready = storage('get').then(value => { if (revision === 0 && value?.blob instanceof Blob) setTrack(value.blob, value.name || config.defaultMusicName); }).catch(() => {}).then(() => {
      if (revision === 0 && !audio && config.defaultMusic) {
        audio = new Audio(new URL(config.defaultMusic, document.baseURI).href); audio.preload = 'auto'; label = config.defaultMusicName; name.textContent = shown(label); updateButtons();
        const track = audio;
        track.addEventListener('loadedmetadata', () => { if (audio === track) sync(true); });
        track.addEventListener('error', () => { if (audio === track) { failed = true; name.textContent = T('music.defaultFailed', 'Chưa tải được nhạc mặc định. Bạn có thể chọn nhạc từ máy.'); } });
        track.addEventListener('ended', () => { if (audio === track) { ended = true; updateButtons(); } });
      }
    });
    return {
      ready, sync,
      begin() { previewing = userPaused = blocked = ended = false; sync(true, true); },
      pause() { if (audio) audio.pause(); previewing = false; updateButtons(); },
      dispose: disposeAudio,
      getState: () => ({ name: label, paused: !audio || audio.paused, time: audio?.currentTime ?? null, duration: audio?.duration ?? null, volume: audio?.volume ?? null, configuredVolume: Number(volume.value), offset: Math.max(0, Number(offset.value) || 0), keep: keep.checked, blocked, failed })
    };
  }};
})();
