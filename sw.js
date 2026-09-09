/* セレモニープレビュー ｜ Service Worker
   会場の電波が不安定でも動くように、一度開いた画面は端末に残す。
   モックを差し替えたら CACHE の版を上げること。上げないと古い画面が出続ける。 */

const CACHE = 'ceremony-preview-v5';

/* 入れた瞬間に確保しておくもの。軽いものだけ。
   demo.html / pair.html は 10MB を超えるため、ここには入れず、
   最初に開いたときに保存する（下の fetch を参照）。 */
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* 保存してあればそれを返し、裏で新しいものを取りに行く。
   会場では速さが要る。古い画面が一瞬出るより、待たされるほうが困る。 */
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
