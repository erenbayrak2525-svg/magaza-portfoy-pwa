"use client";

import { doc, setDoc } from "firebase/firestore";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import { db, firebaseApp, firebaseYapilandirildi } from "@/lib/firebaseClient";

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "";

function tokenBelgeIdsi(token: string): string {
  return encodeURIComponent(token).slice(0, 1500);
}

async function destekleniyorMu(): Promise<boolean> {
  if (typeof window === "undefined" || !firebaseYapilandirildi || !VAPID_KEY) return false;
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return false;
  try {
    return await isSupported();
  } catch {
    return false;
  }
}

export async function fcmTokeniniKaydet(kullaniciId: string): Promise<boolean> {
  if (!(await destekleniyorMu()) || Notification.permission !== "granted") return false;

  const serviceWorkerRegistration = await navigator.serviceWorker.ready;
  const messaging = getMessaging(firebaseApp);
  const token = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration
  });
  if (!token) return false;

  await setDoc(
    doc(db, "fcm_tokens", tokenBelgeIdsi(token)),
    {
      kullaniciId,
      token,
      guncellemeTarihi: new Date().toISOString(),
      platform: "web"
    },
    { merge: true }
  );
  return true;
}

export async function bildirimIzniniAc(kullaniciId: string): Promise<NotificationPermission> {
  if (!(await destekleniyorMu())) {
    throw new Error("Bu tarayıcıda web push bildirimi desteklenmiyor veya VAPID anahtarı ayarlanmamış.");
  }

  const izin = await Notification.requestPermission();
  if (izin !== "granted") return izin;

  const kaydedildi = await fcmTokeniniKaydet(kullaniciId);
  if (!kaydedildi) throw new Error("Bildirim cihazı kaydedilemedi.");
  return izin;
}
