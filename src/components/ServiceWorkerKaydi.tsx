"use client";

import { useEffect } from "react";
import { senkronDinleyicileriKur, kuyruguSenkronEt } from "@/lib/senkron";

export default function ServiceWorkerKaydi() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      // basePath ile uyumlu olsun diye göreli yol kullanılıyor.
      navigator.serviceWorker
        .register("./sw.js")
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
