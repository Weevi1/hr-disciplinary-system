// Self-cleanup service worker — the caching SW was retired (2026-07-20).
// The old worker cached the app shell and assets with a never-bumped version,
// which could serve a stale app after deploys and fight the forced-update
// mechanism in useSessionGuard. This replacement deletes all caches,
// unregisters itself, and reloads controlled pages so clients fall back to
// plain network + HTTP caching. It must remain deployed until all previously
// installed workers have been replaced — do not delete this file.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach((client) => client.navigate(client.url));
    })()
  );
});
// No fetch handler — pages are never served from SW cache again.
