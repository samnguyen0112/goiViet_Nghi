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
const expectedHashes = new Map(bundle.files.map((file, i) => [urls[i], bundle.hashes[file]]));
let progress = { resources: 0, expectedResources: urls.length, bytes: bundle.bytes, error: null };
async function notify() {
  for (const client of await self.clients.matchAll({ type: 'window', includeUncontrolled: true })) {
    const url = new URL(client.url); url.search = ''; url.hash = '';
    if (url.href === PAGE) client.postMessage({ type: 'GOIVIET_OFFLINE_PROGRESS', ...progress });
  }
}
async function digestBuffer(buffer) {
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
}
async function digest(response) {
  return digestBuffer(await response.clone().arrayBuffer());
}
async function verifyFreshResponse(response, expectedHash) {
  if (!response.ok || response.type === 'opaque') throw new Error('offline-resource-failed');
  if (!expectedHash) throw new Error('offline-hash-missing');
  const buffer = await response.arrayBuffer();
  if (await digestBuffer(buffer) !== expectedHash) throw new Error('offline-hash-mismatch');
  const headers = new Headers(response.headers);
  headers.delete('content-encoding');
  headers.set('content-length', String(buffer.byteLength));
  return new Response(buffer, { status: response.status, statusText: response.statusText, headers });
}
async function inspectCacheStatus() {
  if (!bundle || typeof bundle.version !== 'string' || !urls.length) {
    return { ready: false, version: bundle?.version || null, resources: 0, expectedResources: urls.length, bytes: bundle?.bytes || 0, error: 'manifest-invalid' };
  }
  if (!(await caches.has(CACHE))) {
    return { ready: false, version: bundle.version, resources: 0, expectedResources: urls.length, bytes: bundle.bytes, error: null };
  }
  const cache = await caches.open(CACHE);
  const keys = await cache.keys();
  const present = new Set(keys.map(req => req.url));
  let matched = 0;
  for (const url of urls) {
    if (present.has(url) && expectedHashes.get(url)) matched++;
  }
  let pageValid = false;
  if (matched === urls.length) {
    const pageRes = await cache.match(PAGE);
    const pageExpected = expectedHashes.get(PAGE);
    pageValid = Boolean(pageRes && pageExpected && await digest(pageRes) === pageExpected);
  }
  const ready = matched === urls.length && present.size === urls.length && pageValid;
  return { ready, version: bundle.version, resources: matched, expectedResources: urls.length, bytes: bundle.bytes, error: null };
}
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const previous = (await caches.keys()).filter(key => key.startsWith(PREFIX) && key !== CACHE);
    const previousCaches = await Promise.all(previous.map(key => caches.open(key)));
    let index = 0, stopped = false, firstError = null;
    progress = { resources: 0, expectedResources: urls.length, bytes: bundle.bytes, error: null };
    await notify();
    await Promise.allSettled(Array.from({ length: 4 }, async () => {
      try {
        while (!stopped && index < urls.length) {
          const i = index++, url = urls[i], expectedHash = expectedHashes.get(url);
          if (!expectedHash) throw new Error('offline-hash-missing');
          let response = null, alreadyInTarget = false;
          // Reuse unchanged bytes from earlier installations, including migration
          // from the former root scope, without downloading the entire bundle again.
          const targetSaved = await cache.match(url);
          if (targetSaved && await digest(targetSaved) === expectedHash) {
            response = targetSaved;
            alreadyInTarget = true;
          } else {
            for (const prevCache of previousCaches) {
              const saved = await prevCache.match(url);
              if (saved && await digest(saved) === expectedHash) { response = saved; break; }
            }
          }
          if (!response) {
            const fresh = await fetch(new Request(url, { cache: 'reload', credentials: 'same-origin' }));
            response = await verifyFreshResponse(fresh, expectedHash);
          }
          if (stopped) return;
          if (!alreadyInTarget) await cache.put(url, response);
          progress.resources++;
          if (progress.resources % 8 === 0 || progress.resources === urls.length) await notify();
        }
      } catch (error) {
        if (!firstError) firstError = error;
        stopped = true;
      }
    }));
    if (firstError) {
      progress.error = firstError.message;
      await notify();
      await caches.delete(CACHE);
      throw firstError;
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
        // Preserve ?v= and bypass the browser HTTP cache. Only persist responses
        // whose SHA-256 matches this manifest version so wrong HTTP 200 content never poisons the cache.
        const response = await fetch(new Request(request, { cache: 'no-store' }));
        if (response.ok && response.type !== 'opaque') {
          const expectedHash = expectedHashes.get(key.href);
          if (expectedHash && await digest(response) === expectedHash) {
            await cache.put(key.href, response.clone());
          }
        }
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
    event.ports[0].postMessage(await inspectCacheStatus());
  })());
});
