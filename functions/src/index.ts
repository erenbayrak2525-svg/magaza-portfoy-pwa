import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging, type MulticastMessage } from "firebase-admin/messaging";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

initializeApp();

const firestore = getFirestore();
const WEB_APP_URL = process.env.WEB_APP_URL || "https://erenbayrak2525-svg.github.io/magaza-portfoy-pwa";

interface BildirimKaydi {
  kullaniciId?: string;
  baslik?: string;
  mesaj?: string;
  link?: string | null;
}

function tamUygulamaLinki(link?: string | null): string {
  if (link?.startsWith("https://") || link?.startsWith("http://")) return link;
  const yol = link?.startsWith("/") ? link : `/${link || "bildirimler"}`;
  return `${WEB_APP_URL.replace(/\/$/, "")}${yol}`;
}

function parcalaraAyir<T>(liste: T[], boyut: number): T[][] {
  const parcalar: T[][] = [];
  for (let i = 0; i < liste.length; i += boyut) parcalar.push(liste.slice(i, i + boyut));
  return parcalar;
}

export const bildirimPushGonder = onDocumentCreated(
  { document: "bildirimler/{bildirimId}", region: "europe-west1" },
  async (event) => {
    const bildirim = event.data?.data() as BildirimKaydi | undefined;
    const kullaniciId = bildirim?.kullaniciId;
    if (!bildirim || !kullaniciId || kullaniciId === "all") return;

    const tokenSnap = await firestore
      .collection("fcm_tokens")
      .where("kullaniciId", "==", kullaniciId)
      .get();
    if (tokenSnap.empty) return;

    const link = tamUygulamaLinki(bildirim.link);
    const tokenBelgeleri = tokenSnap.docs.filter((belge) => typeof belge.data().token === "string");

    for (const parca of parcalaraAyir(tokenBelgeleri, 500)) {
      const mesaj: MulticastMessage = {
        tokens: parca.map((belge) => belge.data().token as string),
        data: {
          title: bildirim.baslik || "Wasmoda bildirimi",
          body: bildirim.mesaj || "Yeni bir bildirimin var.",
          link,
          bildirimId: event.params.bildirimId
        },
        webpush: {
          headers: { Urgency: "high" }
        }
      };

      const sonuc = await getMessaging().sendEachForMulticast(mesaj);
      const silinecekler = sonuc.responses
        .map((cevap, index) => ({ cevap, belge: parca[index] }))
        .filter(({ cevap }) => {
          const kod = cevap.error?.code;
          return kod === "messaging/registration-token-not-registered" || kod === "messaging/invalid-registration-token";
        });

      await Promise.all(silinecekler.map(({ belge }) => belge.ref.delete()));
    }
  }
);
