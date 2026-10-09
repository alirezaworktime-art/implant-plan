/* App shell for the installed app: always try the network first (so updates show up at once), fall back to the last copy when offline. */
const C = 'implant-plan-v1';
const SHELL = ['./', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(C).then(c => c.addAll(SHELL)).catch(() => {})); });
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;                       // server, fonts: never touched
  const home = r.mode === 'navigate' && /\/implant-plan\/(index\.html)?$/.test(u.pathname);
  const asset = /\.(png|webmanifest)$/.test(u.pathname);
  if (!home && !asset) return;
  const key = home ? './' : r;
  e.respondWith(fetch(r, { cache: 'no-cache' }).then(res => {
    if (res.ok) { const cp = res.clone(); caches.open(C).then(c => c.put(key, cp)); }
    return res;
  }).catch(() => caches.match(key).then(m => m || Response.error())));
});
