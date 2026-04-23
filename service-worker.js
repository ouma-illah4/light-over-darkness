const CACHE_NAME = "my-app-cache-v3"; // increment when updating SW
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/main.js",
  "/style.css",
  "/icon-192.png",
  "/icon-512.png",
  "/manifest.json",
  "/posts.json"
];

// Install: cache static assets
self.addEventListener("install", (e) => {
  console.log("Service Worker installed");
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => key !== CACHE_NAME && caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: cache-first with network update for posts.json
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  // For posts.json, always try network first to get new posts
  if (e.request.url.endsWith("/posts.json")) {
    e.respondWith(
      fetch(e.request)
        .then(networkResponse => {
          if (networkResponse.status === 200) {
            const clonedResponse = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, clonedResponse));
          }
          return networkResponse;
        })
        .catch(() => caches.match(e.request)) // fallback to cache if offline
    );
    return;
  }

  // For all other requests: cache first
  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      return cachedResponse || fetch(e.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
          return networkResponse;
        }
        const clonedResponse = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clonedResponse));
        return networkResponse;
      }).catch(() => {
        // fallback to index.html for navigation requests
        if (e.request.destination === "document") return caches.match("/index.html");
      });
    })
  );
});