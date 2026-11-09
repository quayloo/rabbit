/* Bé Học Mỗi Ngày – service worker
   - Trang (.html): lấy bản mới trên mạng trước, mất mạng thì dùng bản đã lưu → luôn thấy bản mới nhất khi có mạng.
   - Hình, thư viện: dùng bản đã lưu, đồng thời cập nhật ngầm.
   - Không đụng tới models/: app tự lưu và tự kiểm tra mã SHA-256 của mô hình.
   - Chỉ xử lý yêu cầu cùng trang (same-origin), không tải gì từ nơi khác. */
const CACHE = 'be-hoc-v1';
const CORE = ['./', 'index.html', 'on-tieng-anh.html', 'toan.html', 'co-vua.html', 'the-luat.html', 'manifest.webmanifest', 'img/icon-192.png', 'img/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(CORE.map(u => fetch(u, { cache: 'reload' }).then(r => r.ok && c.put(u, r)).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('be-hoc-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const path = url.pathname;
  if (path.includes('/models/')) return;
  const isPage = req.mode === 'navigate' || /\.html$|\/$|\.webmanifest$/.test(path);
  if (isPage) {
    e.respondWith(fetch(req, { cache: 'no-cache' }).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); } return r; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
    return;
  }
  if (/\/(img|vendor)\//.test(path)) {
    e.respondWith(caches.open(CACHE).then(c => c.match(req).then(hit => {
      const net = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    })));
  }
});
