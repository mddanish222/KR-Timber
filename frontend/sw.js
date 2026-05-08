const CACHE_NAME = "kr-timbers-v1";

// Files to cache for offline use
const CACHE_FILES = [
  "/index.html",
  "/home.html",
  "/poles.html",
  "/silver.html",
  "/playwood.html",
  "/old-playwood.html",
  "/expenditure.html",
  "/script.js",
  "/style.css",
  "/manifest.json",
  "/image.png"
];

// ===== INSTALL =====
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHE_FILES);
    })
  );
  self.skipWaiting();
});

// ===== ACTIVATE =====
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// ===== FETCH =====
// Network first, fallback to cache
self.addEventListener("fetch", (event) => {
  // Skip non-GET and API requests (always fetch live)
  if (
    event.request.method !== "GET" ||
    event.request.url.includes("onrender.com")
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Save fresh copy to cache
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(() => {
        // Offline fallback — serve from cache
        return caches.match(event.request);
      })
  );
});