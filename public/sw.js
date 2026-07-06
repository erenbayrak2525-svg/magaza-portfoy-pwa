// Basit ama işlevsel bir service worker:
// - App shell'i (statik export çıktısı) önbelleğe alır
// - Ağ yoksa önbellekten servis eder, sayfa hiç görülmemişse offline.html gösterir
// - navigator.serviceWorker ile src/lib/swKaydet.ts üzerinden kaydedilir

const SURUM = "magaza-portfoy-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./offline.html"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SURUM).then((cache) => cache.addAll(APP_SHELL)).catch(() => {
      // Statik export dosya yolları build sonrası değişebilir; ilk kurulumda
      // bazı dosyalar bulunamazsa sessizce devam et, runtime cache zaten çalışacak.
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== SURUM).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const kopya = response.clone();
        caches.open(SURUM).then((cache) => cache.put(request, kopya));
        return response;
      })
      .catch(async () => {
        const onbellek = await caches.match(request);
        if (onbellek) return onbellek;
        if (request.mode === "navigate") {
          const offline = await caches.match("./offline.html");
          if (offline) return offline;
        }
        return new Response("Çevrimdışısınız ve bu içerik önbellekte yok.", { status: 503 });
      })
  );
});

// Background Sync desteği olan tarayıcılarda: bağlantı geri gelince
// sayfa açık olmasa bile senkronu tetiklemeye çalışır.
self.addEventListener("sync", (event) => {
  if (event.tag === "outbox-sync") {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => client.postMessage({ tip: "OUTBOX_SENKRON_TETIKLE" }));
      })
    );
  }
});
