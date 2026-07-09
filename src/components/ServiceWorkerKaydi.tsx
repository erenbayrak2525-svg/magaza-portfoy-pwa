"use client";

import { useEffect } from "react";
import { senkronDinleyicileriKur, kuyruguSenkronEt } from "@/lib/senkron";

// "./sw.js" nokta-göreli yolu, sayfanın kendi URL'ine göre çözülüyordu — /panel/ gibi bir
// sayfadan .../panel/sw.js aranıp 404 alınıyor, kayıt tamamen başarısız oluyordu. BASE_PATH
// ile her zaman site köküne göre sabit bir yol ve scope kullanıyoruz.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function ServiceWorkerKaydi() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register(`${BASE_PATH}/sw.js`, { scope: `${BASE_PATH}/` })
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
