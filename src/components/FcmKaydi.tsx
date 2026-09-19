"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { fcmTokeniniKaydet } from "@/lib/fcm";

/** Daha önce bildirim izni verilmiş cihazlarda tokenı sessizce yeniler. */
export default function FcmKaydi() {
  const kullanici = useAuthStore((s) => s.kullanici);

  useEffect(() => {
    if (!kullanici || typeof Notification === "undefined" || Notification.permission !== "granted") return;
    fcmTokeniniKaydet(kullanici.id).catch(() => {});
  }, [kullanici]);

  return null;
}
