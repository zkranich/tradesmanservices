const CACHE_NAME = 'ts-portal-v2';
const SHELL_URLS = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Push notification handler ──
self.addEventListener('push', e => {
  let data = { title: 'Tradesmans Portal', body: 'A job has been updated.' };
  try { if (e.data) data = e.data.json(); } catch(_) {}
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: './icon-192.png',
      badge: './icon-192.png',
      tag: 'job-update',
      renotify: true,
      data: { url: self.location.origin + self.location.pathname.replace('sw.js','') }
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const target = e.notification.data?.url || self.location.origin;
  e.waitUntil(
    clients.matchAll({ type:'window', includeUncontrolled:true }).then(list => {
      const existing = list.find(c => c.url.startsWith(target));
      if (existing) return existing.focus();
      return clients.openWindow(target);
    })
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.hostname.includes('anthropic') || url.hostname.includes('smartsheet') || url.hostname.includes('googleapis')) {
    e.respondWith(fetch(e.request));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
