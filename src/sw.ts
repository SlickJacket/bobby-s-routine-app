/// <reference lib="webworker" />
export {};
declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = "bobby-life-os-v1";
// Resolve relative to this SW's own scope, so this works whether the app is
// served from a domain root or a GitHub Pages-style subpath.
const SCOPE = self.registration.scope;
const INDEX_URL = new URL("index.html", SCOPE).href;
const APP_SHELL = [SCOPE, INDEX_URL];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(
        () => caches.match(INDEX_URL).then((r) => r ?? Response.error())
      )
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(req);
      if (cached) {
        fetch(req)
          .then((res) => {
            if (res.ok) cache.put(req, res.clone());
          })
          .catch(() => {});
        return cached;
      }
      try {
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      } catch {
        return cached ?? Response.error();
      }
    })
  );
});
