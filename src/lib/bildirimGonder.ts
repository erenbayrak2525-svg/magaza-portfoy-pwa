import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db, firebaseYapilandirildi } from "@/lib/firebaseClient";

export interface FirestoreBildirim {
  kullaniciId: string;  // hedef kullanıcının UID'si; "herkese" için "all"
  baslik: string;
  mesaj: string;
  tarih: string;
  okundu: boolean;
  link?: string;
}

// Belirli bir kullanıcıya bildirim yazar.
export async function bildirimGonder(
  kullaniciId: string,
  baslik: string,
  mesaj: string,
  link?: string
): Promise<void> {
  if (!firebaseYapilandirildi) return;
  await addDoc(collection(db, "bildirimler"), {
    kullaniciId,
    baslik,
    mesaj,
    tarih: new Date().toISOString(),
    okundu: false,
    link: link ?? null
  });
}

// Tüm kayıtlı kullanıcılara bildirim gönderir (her biri için ayrı belge).
export async function topluBildirimGonder(baslik: string, mesaj: string): Promise<void> {
  if (!firebaseYapilandirildi) return;
  const profilSnap = await getDocs(collection(db, "profiles"));
  const promises = profilSnap.docs.map((profil) =>
    addDoc(collection(db, "bildirimler"), {
      kullaniciId: profil.id,
      baslik,
      mesaj,
      tarih: new Date().toISOString(),
      okundu: false,
      link: null
    })
  );
  await Promise.all(promises);
}

// Bir kullanıcının okunmamış bildirim sayısını getirir.
export async function okunmamisSayisiGetir(kullaniciId: string): Promise<number> {
  if (!firebaseYapilandirildi) return 0;
  try {
    const snap = await getDocs(
      query(
        collection(db, "bildirimler"),
        where("kullaniciId", "==", kullaniciId),
        where("okundu", "==", false)
      )
    );
    return snap.size;
  } catch {
    return 0;
  }
}
