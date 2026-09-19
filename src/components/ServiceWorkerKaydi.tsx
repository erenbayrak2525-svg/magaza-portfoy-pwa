"use client";

import { useEffect } from "react";
import { senkronDinleyicileriKur, kuyruguSenkronEt } from "@/lib/senkron";

// "./sw.js" nokta-göreli yolu, sayfanın kendi URL'ine göre çözülüyordu — /panel/ gibi bir
// sayfadan .../panel/sw.js aranıp 404 alınıyor, kayıt tamamen başarısız oluyordu. BASE_PATH
// ile her zaman site köküne göre sabit bir yol ve scope kullanıyoruz.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  `https://erenbayrak2525-svg.github.io${BASE_PATH || "/magaza-portfoy-pwa"}`;

const FCM_SW_PARAMETRELERI = new URLSearchParams({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  baseUrl: BASE_URL
}).toString();

export default function ServiceWorkerKaydi() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register(`${BASE_PATH}/sw.js?${FCM_SW_PARAMETRELERI}`, { scope: `${BASE_PATH}/` })
        .catch((e) => console.warn("Service worker kaydı başarısız:", e));

      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data?.tip === "OUTBOX_SENKRON_TETIKLE") {
          kuyruguSenkronEt();
        }
      });
    }

    const temizle = senkronDinleyicileriKur();
    return temizle;
  }, []);

  return null;
}
