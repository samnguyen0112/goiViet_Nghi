/* Offline preparation is opt-in; reading an existing registration does not download a bundle. */
(() => {
  'use strict';
  const scope = new URL('map-surroundings-preview-5.html', document.baseURI).href;
  const workerURL = new URL('preview-5-offline-worker.js', document.baseURI).href;
  const supported = 'serviceWorker' in navigator && window.isSecureContext && /^https?:$/.test(location.protocol);
  const status = { supported, ready: false, phase: supported ? 'idle' : 'unavailable', version: null,
    resources: 0, expectedResources: 0, bytes: 164000000, error: null };
  const button = document.getElementById('btnPrepareOffline');
  let inFlight = null, pending = null, initialized;
  const t = (key, vars) => window.GoiVietI18n.t('offline.' + key, vars);
  function render() {
    if (!button) return;
    button.disabled = !supported || status.phase === 'preparing';
    document.getElementById('offlinePrepareLabel').textContent = t(status.ready ? 'again' : 'prepare');
    document.getElementById('offlinePrepareSize').textContent = t('size', { mb: Math.ceil(status.bytes / 1e6) });
    const progress = document.getElementById('offlinePrepareProgress');
    progress.max = status.expectedResources || 1;
    progress.value = status.resources;
    progress.hidden = !status.expectedResources;
    document.getElementById('offlinePrepareStatus').textContent = t(status.phase, {
      done: status.resources, total: status.expectedResources
    });
    button.setAttribute('aria-busy', String(status.phase === 'preparing'));
  }
  function update(values) {
    Object.assign(status, values);
    render();
    document.dispatchEvent(new CustomEvent('goiviet:offline-progress', { detail: { ...status } }));
    if (status.ready) document.dispatchEvent(new CustomEvent('goiviet:offline-ready', { detail: { ...status } }));
    return { ...status };
  }
  const ours = registration => [registration.active, registration.waiting, registration.installing]
    .some(worker => worker?.scriptURL.split('?')[0] === workerURL);
  function ask(worker) {
    return new Promise((resolve, reject) => {
      const channel = new MessageChannel();
      const timer = setTimeout(() => { channel.port1.close(); reject(new Error('status-timeout')); }, 10000);
      channel.port1.onmessage = event => { clearTimeout(timer); channel.port1.close(); resolve(event.data); };
      worker.postMessage({ type: 'GOIVIET_OFFLINE_STATUS' }, [channel.port2]);
    });
  }
  async function activated(registration) {
    const worker = registration.installing || registration.waiting || registration.active;
    if (!worker) throw new Error('worker-unavailable');
    if (worker.state === 'activated') return worker;
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => finish(new Error('install-timeout')), 180000);
      const changed = () => {
        if (worker.state === 'activated') finish();
        else if (worker.state === 'redundant') finish(new Error('install-failed'));
      };
      function finish(error) { clearTimeout(timer); worker.removeEventListener('statechange', changed); error ? reject(error) : resolve(); }
      worker.addEventListener('statechange', changed); changed();
    });
    return registration.active || worker;
  }
  function startPreparation() {
    if (!supported) return Promise.resolve({ ...status });
    if (inFlight) return inFlight;
    update({ ready: false, phase: 'preparing', resources: 0, expectedResources: 0, error: null });
    inFlight = (async () => {
      try {
        const registration = await navigator.serviceWorker.register(workerURL, { scope, updateViaCache: 'none' });
        const worker = await activated(registration);
        const report = await ask(worker);
        if (!report.ready) throw new Error('bundle-incomplete');
        // Remove only our earlier root-scoped registration after the narrow one is usable.
        for (const old of await navigator.serviceWorker.getRegistrations()) {
          if (old.scope !== scope && ours(old)) await old.unregister();
        }
        return update({ ...report, phase: 'ready', error: null });
      } catch (error) { return update({ ready: false, phase: 'error', error: error.message }); }
      finally { inFlight = null; }
    })();
    pending = inFlight;
    return inFlight;
  }
  async function initialize() {
    render();
    if (!supported) return { ...status };
    try {
      const registrations = (await navigator.serviceWorker.getRegistrations()).filter(ours);
      const exact = registrations.find(registration => registration.scope === scope);
      if (exact?.active) {
        const report = await ask(exact.active);
        return update({ ...report, phase: report.ready ? 'ready' : 'idle' });
      }
      // Existing installations retain their prior offline preparation. Migration copies
      // verified unchanged resources from the old cache instead of downloading them again.
      if (registrations.length) {
        if (navigator.onLine) return startPreparation();
        const old = registrations.find(registration => registration.active);
        if (old) {
          window.addEventListener('online', startPreparation, { once: true });
          const report = await ask(old.active);
          return update({ ...report, phase: report.ready ? 'ready' : 'idle' });
        }
      }
      return { ...status };
    } catch (error) { return update({ phase: 'error', error: error.message }); }
  }
  window.GoiVietOffline = Object.freeze({
    get ready() { return pending || initialized; },
    inspect: () => ({ ...status }),
    async prepare() { await initialized; return startPreparation(); }
  });
  if (supported) navigator.serviceWorker.addEventListener('message', event => {
    if (event.data?.type !== 'GOIVIET_OFFLINE_PROGRESS' || event.source?.scriptURL.split('?')[0] !== workerURL) return;
    const { resources, expectedResources, bytes, error } = event.data;
    update({ resources, expectedResources, bytes, ...(error ? { phase: 'error', error } : {}) });
  });
  button?.addEventListener('click', () => { void window.GoiVietOffline.prepare(); });
  document.addEventListener('goiviet:langchange', render);
  initialized = initialize();
})();
