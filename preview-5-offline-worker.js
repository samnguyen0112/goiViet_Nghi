/* Registered only for the exact preview-5 page; preparation is requested by its settings button. */
'use strict';
importScripts('assets/goi-viet/map-surroundings-preview/offline-manifest-5.js');
const bundle = self.GoiVietOfflineManifest;
const PREFIX = 'goiviet-preview-5-';
const CACHE = PREFIX + bundle.version;
const ROOT = new URL('./', self.location.href);
const PAGE = new URL('map-surroundings-preview-5.html', ROOT).href;
const urls = bundle.files.map(file => new URL(file, ROOT).href);
const allowed = new Set(urls);
let progress = { resources: 0, expectedResources: urls.length, bytes: bundle.bytes, error: null };
async function notify() {
  for (const client of await self.clients.matchAll({ type: 'window', includeUncontrolled: true })) {
    const url = new URL(client.url); url.search = ''; url.hash = '';
    if (url.href === PAGE) client.postMessage({ type: 'GOIVIET_OFFLINE_PROGRESS', ...progress });
  }
}
async function digest(response) {
  const hash = await crypto.subtle.digest('SHA-256', await response.clone().arrayBuffer());
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
}
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const previous = (await caches.keys()).filter(key => key.startsWith(PREFIX) && key !== CACHE);
    let index = 0, stopped = false;
    await notify();
    try {
      await Promise.all(Array.from({ length: 4 }, async () => {
        while (!stopped && index < urls.length) {
          const i = index++, url = urls[i], expectedHash = bundle.hashes[bundle.files[i]];
          let response = null;
          // Reuse unchanged bytes from earlier installations, including migration
          // from the former root scope, without downloading the entire bundle again.
          for (const key of [CACHE, ...previous]) {
            const saved = await (await caches.open(key)).match(url);
            if (saved && await digest(saved) === expectedHash) { response = saved; break; }
          }
          if (!response) response = await fetch(new Request(url, { cache: 'reload', credentials: 'same-origin' }));
          if (!response.ok || response.type === 'opaque') throw new Error('offline-resource-failed');
          await cache.put(url, response);
          progress.resources++;
          if (progress.resources % 8 === 0 || progress.resources === urls.length) await notify();
        }
      }));
    } catch (error) {
      stopped = true;
      progress.error = error.message;
      await notify();
      await caches.delete(CACHE);
      throw error;
    }
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // An old broad registration can update to this script during migration.
    // It must not claim any clients; the page creates the exact-scope replacement.
    if (self.registration.scope !== PAGE) return;
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  if (self.registration.scope !== PAGE || event.request.method !== 'GET') return;
  const request = event.request, url = new URL(request.url);
  if (url.origin !== ROOT.origin) return;
  const key = new URL(url); key.search = ''; key.hash = '';
  if (!allowed.has(key.href)) return;
  if (request.mode === 'navigate' && key.href !== PAGE) return;
  const freshFirst = request.mode === 'navigate' || /\.(?:html|js|css|json)$/i.test(url.pathname);
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (freshFirst) {
      try {
        // Preserve ?v= and bypass the browser HTTP cache. HTTP errors are still
        // genuine network responses; fall back only when the connection fails.
        const response = await fetch(new Request(request, { cache: 'no-store' }));
        if (response.ok) await cache.put(key.href, response.clone());
        return response;
      } catch (error) {
        const saved = await cache.match(key.href);
        if (saved) return saved;
        throw error;
      }
    }
    return (await cache.match(key.href)) || fetch(request);
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type !== 'GOIVIET_OFFLINE_STATUS' || !event.ports[0]) return;
  event.waitUntil((async () => {
    const count = (await (await caches.open(CACHE)).keys()).length;
    event.ports[0].postMessage({ ready: count === urls.length, version: bundle.version, resources: count,
      expectedResources: urls.length, bytes: bundle.bytes, error: null });
  })());
});
