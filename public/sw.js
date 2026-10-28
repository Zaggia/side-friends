// Side Friends service worker: shows push notifications and, when one is tapped,
// opens the app on the group and tab the notification is about.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', e => {
  let msg = {};
  try { msg = e.data ? e.data.json() : {}; } catch { msg = { body: e.data && e.data.text() }; }
  const data = msg.data || {};
  e.waitUntil(self.registration.showNotification(msg.title || 'Side Friends', {
    body: msg.body || '',
    icon: '/icon-192.png',
    badge: '/badge-96.png',
    tag: `${data.groupId || ''}:${data.tab || ''}:${Date.now()}`,
    data
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const { groupId, tab } = e.notification.data || {};
  e.waitUntil((async () => {
    const open = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const win = open.find(c => new URL(c.url).origin === self.location.origin);
    if (win) {
      await win.focus();
      if (groupId) win.postMessage({ type: 'open', groupId, tab });
      return;
    }
    const q = groupId ? `?g=${encodeURIComponent(groupId)}&tab=${encodeURIComponent(tab || 'quest')}` : '';
    await self.clients.openWindow('/' + q);
  })());
});
