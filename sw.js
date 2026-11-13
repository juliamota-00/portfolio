// Deixa o painel abrir mesmo sem internet (mostra a última versão salva das páginas).
// Os dados continuam vindo do banco: sem internet, o painel avisa que não conseguiu salvar.
const CACHE = 'painel-v1';
const BASE = ['/painel/', '/painel/supa.js', '/entrar/', '/painel/manifest.webmanifest', '/painel/icon-192.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api/')) return;
  // Rede primeiro (sempre a versão mais nova); sem internet, usa a cópia guardada.
  e.respondWith(fetch(e.request).then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); } return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('/painel/'))));
});
