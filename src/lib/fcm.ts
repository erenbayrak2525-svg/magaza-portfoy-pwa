"use client";

import { doc, setDoc } from "firebase/firestore";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import { db, firebaseApp, firebaseYapilandirildi } from "@/lib/firebaseClient";

const VAPID_KEY =
  process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY ||
  process.env.NEXT_PUBLIC_FIREBASE_VAPID_PUBLIC_KEY ||
  process.env.NEXT_PUBLIC_VAPID_KEY ||
  "";
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  `https://erenbayrak2525-svg.github.io${BASE_PATH || "/magaza-portfoy-pwa"}`;

export const webPushVapidAyarlanmisMi = Boolean(VAPID_KEY.trim());

export type WebPushDurumu =
  | "hazir"
  | "firebase_yapilandirilmamis"
  | "vapid_eksik"
  | "tarayici_desteklemiyor";

export function webPushDurumu(): WebPushDurumu {
  if (!firebaseYapilandirildi) return "firebase_yapilandirilmamis";
  if (!webPushVapidAyarlanmisMi) return "vapid_eksik";
  if (
    typeof window === "undefined" ||
    !window.isSecureContext ||
    !("Notification" in window) ||
    !("serviceWorker" in navigator) ||
    !("PushManager" in window)
  ) {
    return "tarayici_desteklemiyor";
  }
  return "hazir";
}

function fcmServiceWorkerParametreleri(): string {
  return new URLSearchParams({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
    baseUrl: BASE_URL
  }).toString();
}

async function fcmServiceWorkerKaydiniHazirla(): Promise<ServiceWorkerRegistration> {
  const url = `${BASE_PATH}/sw.js?${fcmServiceWorkerParametreleri()}`;
  const kayit = await navigator.serviceWorker.register(url, { scope: `${BASE_PATH}/` });
  await navigator.serviceWorker.ready;
  return kayit;
}

function tokenBelgeIdsi(token: string): string {
  return encodeURIComponent(token).slice(0, 1500);
}

async function destekleniyorMu(): Promise<boolean> {
  if (webPushDurumu() !== "hazir") return false;
  try {
    return await isSupported();
  } catch {
    return false;
  }
}

export async function fcmTokeniniKaydet(kullaniciId: string): Promise<boolean> {
  if (!(await destekleniyorMu()) || Notification.permission !== "granted") return false;

  const serviceWorkerRegistration = await fcmServiceWorkerKaydiniHazirla();
  const messaging = getMessaging(firebaseApp);
  let token: string;
  try {
    token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration
    });
  } catch (error) {
    const ayrinti = error instanceof Error ? error.message : "Bilinmeyen FCM hatası";
    throw new Error(`Bildirim cihazı kaydedilemedi: ${ayrinti}`);
  }
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

/** Uygulama açıkken gelen FCM mesajını da sistem bildirimine çevirir. */
export async function fcmOnMesajDinleyicisiniKur(): Promise<() => void> {
  if (!(await destekleniyorMu()) || Notification.permission !== "granted") return () => {};

  const messaging = getMessaging(firebaseApp);
  const unsubscribe = onMessage(messaging, (payload) => {
    const data = payload.data || {};
    const baslik = data.title || "Wasmoda bildirimi";
    const mesaj = data.body || "Yeni bir bildirimin var.";
    const link = data.link || `${BASE_URL}/bildirimler`;

    if (document.visibilityState !== "visible") return;
    const bildirim = new Notification(baslik, {
      body: mesaj,
      icon: `${BASE_URL}/icons/icon-192.png`,
      badge: `${BASE_URL}/icons/icon-192.png`,
      data: { link }
    });
    bildirim.onclick = () => {
      window.focus();
      window.location.href = link;
      bildirim.close();
    };
  });
  return unsubscribe;
}

export async function bildirimIzniniAc(kullaniciId: string): Promise<NotificationPermission> {
  const durum = webPushDurumu();
  if (durum === "firebase_yapilandirilmamis") {
    throw new Error("Firebase bağlantı ayarları eksik. GitHub Actions Secrets bölümünü kontrol edin.");
  }
  if (durum === "vapid_eksik") {
    throw new Error("VAPID anahtarı derlemeye eklenmemiş. GitHub Actions secret adı NEXT_PUBLIC_FIREBASE_VAPID_KEY olmalı ve yeni build alınmalı.");
  }
  if (durum === "tarayici_desteklemiyor" || !(await destekleniyorMu())) {
    throw new Error("Bu cihaz/tarayıcı web push bildirimini desteklemiyor. HTTPS adresinde Chrome, Edge veya Android PWA ile deneyin.");
  }

  const izin = await Notification.requestPermission();
  if (izin !== "granted") return izin;

  const kaydedildi = await fcmTokeniniKaydet(kullaniciId);
  if (!kaydedildi) throw new Error("Bildirim cihazı kaydedilemedi.");
  return izin;
}
