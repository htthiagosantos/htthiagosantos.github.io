// Service Worker do Vibe Music Player
// Ao alterar qualquer arquivo estático, suba a versão do cache abaixo.
const CACHE_NAME = 'vibe-player-v3';

// Arquivos locais essenciais para o app abrir offline.
const LOCAL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './sw.js'
];

// Recursos externos (fontes/ícones/estilos) usados na primeira renderização.
// Ficam em cache para que o app abra corretamente mesmo sem internet.
const EXTERNAL_ASSETS = [
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest',
  'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Space+Grotesk:wght@400;600;700&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Importante: cache.addAll() é atômico (se 1 arquivo falhar, NADA é salvo).
      // Por isso cacheamos cada recurso individualmente: uma falha pontual
      // (ex.: sem internet no primeiro acesso a um CDN) não derruba o resto.
      const allAssets = [...LOCAL_ASSETS, ...EXTERNAL_ASSETS];
      await Promise.allSettled(
        allAssets.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[SW] Falha ao cachear:', url, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          // Apaga caches de versões antigas (ex.: v1, v2)
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
  // Só tratamos requisições GET (POST/PUT etc. não são cacheáveis).
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Estratégia: cache-first, com atualização em segundo plano quando online.
      const networkFetch = fetch(event.request)
        .then((networkResponse) => {
          // Só guardamos respostas válidas (status ok ou opacas de CDN externo).
          if (networkResponse && (networkResponse.ok || networkResponse.type === 'opaque')) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse); // sem internet: usa o que já está em cache

      // Se já existe em cache, devolve na hora (rápido) e atualiza em segundo plano.
      // Caso contrário, espera a rede (ou o fallback do cache, se falhar).
      return cachedResponse || networkFetch;
    })
  );
});
