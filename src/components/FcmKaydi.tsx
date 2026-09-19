"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { fcmOnMesajDinleyicisiniKur, fcmTokeniniKaydet } from "@/lib/fcm";

/** Daha önce bildirim izni verilmiş cihazlarda tokenı sessizce yeniler. */
export default function FcmKaydi() {
  const kullanici = useAuthStore((s) => s.kullanici);

  useEffect(() => {
    if (!kullanici || typeof Notification === "undefined" || Notification.permission !== "granted") return;

    let iptal = false;
    let temizle = () => {};
    fcmTokeniniKaydet(kullanici.id).catch(() => {});
    fcmOnMesajDinleyicisiniKur().then((unsubscribe) => {
      if (iptal) unsubscribe();
      else temizle = unsubscribe;
    }).catch(() => {});

    return () => {
      iptal = true;
      temizle();
    };
  }, [kullanici]);

  return null;
}
