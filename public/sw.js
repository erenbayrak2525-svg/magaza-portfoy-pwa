// Basit ama işlevsel bir service worker:
// - App shell'i (statik export çıktısı) önbelleğe alır
// - Ağ yoksa önbellekten servis eder, sayfa hiç görülmemişse offline.html gösterir
// - navigator.serviceWorker ile src/lib/swKaydet.ts üzerinden kaydedilir

// Firebase Cloud Messaging arka plan bildirimleri. Firebase web config'i,
// service worker kaydı sırasında URL parametresi olarak verilir; bu değerler
// zaten web uygulamalarında gizli kabul edilmez.
const SW_PARAMETRELERI = new URL(self.location.href).searchParams;
const FCM_FIREBASE_CONFIG = {
  apiKey: SW_PARAMETRELERI.get("apiKey") || "",
  authDomain: SW_PARAMETRELERI.get("authDomain") || "",
  projectId: SW_PARAMETRELERI.get("projectId") || "",
  storageBucket: SW_PARAMETRELERI.get("storageBucket") || "",
  messagingSenderId: SW_PARAMETRELERI.get("messagingSenderId") || "",
  appId: SW_PARAMETRELERI.get("appId") || ""
};
const FCM_BASE_URL = SW_PARAMETRELERI.get("baseUrl") || self.location.origin;

// Bildirime dokununca uygulamayı GitHub Pages alt yolunda aç.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = event.notification?.data?.link;
  if (!link) return;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      const mevcut = clientList.find((client) => "focus" in client);
      if (mevcut) {
        mevcut.navigate(link);
        return mevcut.focus();
      }
      return self.clients.openWindow(link);
    })
  );
});

try {
  if (FCM_FIREBASE_CONFIG.apiKey) {
    importScripts("https://www.gstatic.com/firebasejs/12.15.0/firebase-app-compat.js");
    importScripts("https://www.gstatic.com/firebasejs/12.15.0/firebase-messaging-compat.js");
    firebase.initializeApp(FCM_FIREBASE_CONFIG);
    const fcmMessaging = firebase.messaging();
    fcmMessaging.onBackgroundMessage((payload) => {
      const data = payload.data || {};
      const title = data.title || "Wasmoda bildirimi";
      const link = data.link || `${FCM_BASE_URL}/bildirimler`;
      self.registration.showNotification(title, {
        body: data.body || "Yeni bir bildirimin var.",
        icon: `${FCM_BASE_URL}/icons/icon-192.png`,
        badge: `${FCM_BASE_URL}/icons/icon-192.png`,
        data: { link }
      });
    });
  }
} catch (hata) {
  console.warn("Firebase Cloud Messaging service worker başlatılamadı:", hata);
}

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
