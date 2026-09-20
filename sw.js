// Altere de 'vibe-player-v1' para 'vibe-player-v2'
const CACHE_NAME = 'vibe-player-v2';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  // Adicione './sw.js' aqui também para garantir
  './sw.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Usamos addAll mas vamos garantir que ele não falhe se um arquivo falhar
      return cache.addAll(ASSETS_TO_CACHE).catch(err => console.warn('Falha no cache inicial:', err));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // ATENÇÃO AQUI: Este bloco apaga caches antigas
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          // Se a cache antiga (ex: v1) for diferente da nova (v2), apague
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Retorna do cache se encontrar, senão busca na rede
      return response || fetch(event.request);
    })
  );
});
