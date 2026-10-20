// Blog service worker. It caches nothing and handles no requests: it only exists so the
// newsletter popup (src/assets/newsletter.js) can tell a hard refresh from a normal one,
// because browsers bypass the service worker on a hard refresh.
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
