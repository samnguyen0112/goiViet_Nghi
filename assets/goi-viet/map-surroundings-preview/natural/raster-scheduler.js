/* Main preview only. One worker, a bounded priority queue and a shared 3ms
   auxiliary-work budget. The legacy queue remains available to preview-2. */
(() => {
  'use strict';
  const definitions = new Map(), jobs = new Map(), pending = new Map();
  const work = new Map(), ready = [], listeners = new Set(), levels = new Map();
  const BUDGET_MS = 3, MAX_JOBS = 128, MAX_READY_BYTES = 4 * 1024 * 1024;
  let worker = null, failed = false, flight = null, fallbackFlight = null, timer = 0, notification = 0;
  let serial = 0, completed = 0, cancelled = 0, generation = 0, readyBytes = 0;
  let view = null, lastMotion = 0, maxSliceMs = 0, maxPending = 0, fallbackRows = 0, currentTask = null;
  const abort = () => Object.assign(new Error('Raster request superseded'), {name: 'AbortError'});
  const detailOpen = () => document.getElementById('naturalIslandModal')?.classList.contains('open');
  const paused = () => document.hidden || Boolean(typeof getTopOpenModalElement === 'function' && getTopOpenModalElement() && !detailOpen());
  function notify() {
    if (notification) return;
    notification = setTimeout(() => {
      notification = 0;
      for (const fn of listeners) fn();
      if (!paused()) requestMapRender();
    }, 120);
  }
  function workerMain() {
    const kernels = new Map();
    self.onmessage = ({data: m}) => {
      try {
        if (m.type === 'define') { kernels.set(m.name, new Function('data', m.factory)(m.data)); return; }
        const pixels = kernels.get(m.name)(m.args);
        self.postMessage({id: m.id, ...pixels}, [pixels.buffer]);
      } catch (e) { self.postMessage({id: m.id, error: e.message}); }
    };
  }
  function valid(job) {
    if (job.revision !== definitions.get(job.name)?.revision) return false;
    if (!view) return true;
    if (typeof job.args.dark === 'boolean' && job.args.dark !== view.dark) return false;
    const b = job.bounds, e = view.extent;
    return !b || !e || b.left <= e.right && b.right >= e.left && b.top <= e.bottom && b.bottom >= e.top;
  }
  function finish(job, error, image) {
    if (fallbackFlight === job) fallbackFlight = null;
    jobs.delete(job.id); pending.delete(job.key);
    if (error) { cancelled++; job.reject(error); }
    else { completed++; job.resolve(image); notify(); }
  }
  function priority(job) {
    if (!view || !job.bounds) return 0;
    const b = job.bounds, e = view.extent;
    if (!e) return 0;
    return Math.hypot((b.left+b.right-e.left-e.right)/2, (b.top+b.bottom-e.top-e.bottom)/2) / (job.size || 48);
  }
  function nextJob() {
    let best = null, score = Infinity;
    for (const job of jobs.values()) {
      if (job.status !== 'queued') continue;
      if (!valid(job)) { finish(job, abort()); continue; }
      const value = priority(job);
      if (value < score) { score = value; best = job; }
    }
    return best;
  }
  function failWorker() {
    failed = true;
    worker?.terminate(); worker = null;
    if (flight) { flight.status = 'queued'; flight = null; }
    wake();
  }
  function start() {
    if (worker || failed) return;
    try {
      const url = URL.createObjectURL(new Blob(['('+workerMain.toString()+')()'], {type: 'application/javascript'}));
      try { worker = new Worker(url); } finally { URL.revokeObjectURL(url); }
      worker.onerror = failWorker;
      worker.onmessageerror = failWorker;
      worker.onmessage = ({data: m}) => {
        const job = jobs.get(m.id);
        if (flight?.id === m.id) flight = null;
        if (!job) { pump(); return; }
        if (m.error) { finish(job, new Error(m.error)); failWorker(); return; }
        if (!valid(job)) finish(job, abort());
        else { job.status = 'ready'; ready.push({job, pixels: m}); readyBytes += m.buffer.byteLength; }
        wake(); pump();
      };
      for (const [name, d] of definitions) worker.postMessage({type: 'define', name, factory: d.factory, data: d.data});
    } catch (_) { failWorker(); }
  }
  function pump() {
    if (paused() || flight || ready.length >= 4 || readyBytes >= MAX_READY_BYTES) return;
    start();
    if (!worker) { if (jobs.size) wake(); return; }
    const job = nextJob();
    if (job) {
      flight = job; job.status = 'running';
      try { worker.postMessage({type: 'build', id: job.id, name: job.name, args: job.args}); }
      catch (_) { failWorker(); }
    }
  }
  function ingest(job, pixels) {
    if (!valid(job)) { finish(job, abort()); return; }
    const image = document.createElement('canvas'); image.width = pixels.width; image.height = pixels.height;
    image.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(pixels.buffer), pixels.width, pixels.height), 0, 0);
    finish(job, null, image);
  }
  function tick() {
    timer = 0;
    if (paused()) return;
    const started = performance.now();
    try {
      // Ingest at most two completions per slice, even when the worker is fast.
      for (let count = 0; ready.length && count < 2 && performance.now()-started < BUDGET_MS; count++) {
        const item = ready.shift(); readyBytes -= item.pixels.buffer.byteLength;
        if (jobs.has(item.job.id)) ingest(item.job, item.pixels);
      }
      const entry = detailOpen() ? null : work.entries().next().value;
      if (entry) {
        const [key, task] = entry;
        do {
          currentTask = task;
          const step = task.iterator.next();
          currentTask = null;
          if (step.done) { work.delete(key); task.done?.(step.value, task.missing); break; }
        } while (performance.now()-started < BUDGET_MS);
      }
      if (failed) {
        const job = fallbackFlight || nextJob();
        if (job) {
          fallbackFlight = job;
          try {
          const d = definitions.get(job.name);
          d.kernel ||= new Function('data', d.factory)(d.data);
          // The three pixel kernels accept row ranges. No full synchronous
          // pixel fallback is allowed on the main preview's interaction path.
          do {
            const pixels = d.kernel({...job.args, rowStart: job.row || 0, rowEnd: (job.row || 0)+1, buffer: job.buffer});
            job.buffer = pixels.buffer; job.row = (job.row || 0)+1; fallbackRows++;
            if (job.row >= pixels.height) { ingest(job, pixels); break; }
          } while (performance.now()-started < BUDGET_MS);
          } catch (error) { finish(job, error); }
        }
      }
    } catch (e) {
      currentTask = null;
      // A broken auxiliary task must not strand the scheduler or camera.
      const entry = work.entries().next().value;
      if (entry) { work.delete(entry[0]); entry[1].error?.(e); }
      else { const job = nextJob(); if (job) finish(job, e); }
    }
    maxSliceMs = Math.max(maxSliceMs, performance.now()-started);
    pump();
    if (work.size && !detailOpen() || ready.length || failed && jobs.size) wake();
  }
  function wake() {
    if (!timer && !paused() && (work.size && !detailOpen() || ready.length || failed && jobs.size)) timer = setTimeout(tick, 8);
  }
  function define(name, factory, data) {
    const revision = (definitions.get(name)?.revision || 0)+1;
    definitions.set(name, {factory, data, revision, kernel: null});
    for (const job of jobs.values()) if (job.name === name) finish(job, abort());
    if (worker) worker.postMessage({type: 'define', name, factory, data});
  }
  function build(name, key, args) {
    if (currentTask) currentTask.missing = true;
    const idKey = name+':'+key;
    if (pending.has(idKey)) return pending.get(idKey);
    if (!definitions.has(name)) return Promise.reject(new Error('Unknown raster kernel: '+name));
    if (jobs.size >= MAX_JOBS) return Promise.reject(new Error('Raster queue full; retry next draw'));
    const size = name === 'sea' || args.id === 'context' ? 192 : 48;
    const bounds = Number.isFinite(args.tx) ? {left: args.tx*size, top: args.ty*size, right: (args.tx+1)*size, bottom: (args.ty+1)*size} : null;
    const job = {id: ++serial, key: idKey, name, args, bounds, size, status: 'queued', revision: definitions.get(name).revision, generation};
    if (!valid(job)) return Promise.reject(abort());
    const promise = new Promise((resolve, reject) => Object.assign(job, {resolve, reject}));
    jobs.set(job.id, job); pending.set(idKey, promise); maxPending = Math.max(maxPending, jobs.size);
    pump(); return promise;
  }
  function setView(camera, width, height, dark, extent, moving) {
    const now = performance.now();
    if (moving) lastMotion = now;
    if (!view || view.dark !== dark) generation++;
    view = {extent, dark, zoom: camera.zoom, moving, width, height};
    for (const job of jobs.values()) if (!valid(job)) finish(job, abort());
    pump(); wake();
  }
  function lod(name, zoom, thresholds, values) {
    let index = thresholds.filter(t => zoom > t).length;
    const previous = levels.get(name);
    if (previous !== undefined && performance.now()-lastMotion < 180) {
      index = previous;
      while (index < thresholds.length && zoom > thresholds[index]*1.08) index++;
      while (index > 0 && zoom < thresholds[index-1]*.92) index--;
    }
    levels.set(name, index);
    if (previous !== undefined && previous !== index) {
      generation++;
      for (const job of jobs.values()) if (job.name === name && job.args.density !== undefined && job.args.id !== 'context' && job.args.density !== values[index]) finish(job, abort());
    }
    return values[index];
  }
  function cache(map, key, image, limit) {
    map.delete(key); map.set(key, image);
    let bytes = 0;
    for (const item of map.values()) bytes += item.width*item.height*4;
    while (bytes > limit && map.size > 1) {
      const oldest = map.keys().next().value, item = map.get(oldest);
      bytes -= item.width*item.height*4; map.delete(oldest);
      // Canvas references in an in-progress backdrop remain valid until it
      // commits. Let GC reclaim evicted surfaces; never clear a live surface.
    }
    return image;
  }
  function placeholder(map, key, create) {
    if (!map.has(key)) { map.set(key, create()); while (map.size > MAX_JOBS) map.delete(map.keys().next().value); }
    return map.get(key);
  }
  document.addEventListener('visibilitychange', () => { pump(); wake(); });
  new MutationObserver(() => { pump(); wake(); }).observe(document.body, {subtree: true, attributes: true, attributeFilter: ['class']});
  window.GoiVietRasterTasks = Object.freeze({
    managed: true, define, build, setView, lod, cache, placeholder,isMoving:()=>Boolean(view?.moving),
    run: (key, iterator, done, error) => { work.get(key)?.iterator.return?.(); work.set(key, {iterator, done, error, missing: false}); wake(); },
    cancel: key => { work.get(key)?.iterator.return?.(); work.delete(key); },
    onUpdate: fn => { listeners.add(fn); return () => listeners.delete(fn); },
    inspect: () => ({available: Boolean(worker) && !failed, failed, fallback: failed, pending: jobs.size, completed, cancelled,
      generation, maxPending, inFlight: flight ? 1 : 0, ready: ready.length, readyBytes, auxiliaryTasks: work.size,
      budgetMs: BUDGET_MS, maxSliceMs, fallbackRows, lastMotion})
  });
})();
