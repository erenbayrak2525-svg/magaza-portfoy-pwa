"use client";

import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  updateDoc,
  where
} from "firebase/firestore";
import { db, firebaseYapilandirildi } from "@/lib/firebaseClient";
import { bildirimGonder } from "@/lib/bildirimGonder";
import type { Mesaj, MesajKonusmasi } from "@/types";

export function mesajKonusmaIdsi(ilki: string, ikincisi: string): string {
  return [ilki, ikincisi].sort().join("__");
}

export function useCanliMesajKonusmalari(kullaniciId?: string) {
  const [veri, setVeri] = useState<MesajKonusmasi[]>([]);
  const [yukleniyor, setYukleniyor] = useState(Boolean(kullaniciId && firebaseYapilandirildi));
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    if (!kullaniciId || !firebaseYapilandirildi) {
      setVeri([]);
      setYukleniyor(false);
      return;
    }

    setYukleniyor(true);
    const q = query(
      collection(db, "mesaj_konusmalari"),
      where("katilimcilar", "array-contains", kullaniciId)
    );

    return onSnapshot(
      q,
      (snap) => {
        setVeri(
          snap.docs
            .map((belge) => ({ id: belge.id, ...(belge.data() as Omit<MesajKonusmasi, "id">) }))
            .sort((a, b) => {
              const aTarihi = a.sonMesajTarihi ?? a.olusturmaTarihi;
              const bTarihi = b.sonMesajTarihi ?? b.olusturmaTarihi;
              return aTarihi < bTarihi ? 1 : -1;
            })
        );
        setHata(null);
        setYukleniyor(false);
      },
      (err) => {
        setHata(err.message || "Mesajlar okunamadı");
        setYukleniyor(false);
      }
    );
  }, [kullaniciId]);

  const okunmamis = veri.reduce(
    (toplam, konusma) => toplam + (konusma.okunmamisSayilari?.[kullaniciId ?? ""] ?? 0),
    0
  );

  return { veri, okunmamis, yukleniyor, hata };
}

export function useCanliMesajlar(konusmaId?: string) {
  const [veri, setVeri] = useState<Mesaj[]>([]);
  const [yukleniyor, setYukleniyor] = useState(Boolean(konusmaId && firebaseYapilandirildi));
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    if (!konusmaId || !firebaseYapilandirildi) {
      setVeri([]);
      setYukleniyor(false);
      return;
    }

    setYukleniyor(true);
    const mesajRef = collection(db, "mesaj_konusmalari", konusmaId, "mesajlar");
    return onSnapshot(
      query(mesajRef),
      (snap) => {
        setVeri(
          snap.docs
            .map((belge) => ({ id: belge.id, ...(belge.data() as Omit<Mesaj, "id">) }))
            .sort((a, b) => (a.tarih > b.tarih ? 1 : -1))
        );
        setHata(null);
        setYukleniyor(false);
      },
      (err) => {
        setHata(err.message || "Konuşma okunamadı");
        setYukleniyor(false);
      }
    );
  }, [konusmaId]);

  return { veri, yukleniyor, hata };
}

export async function mesajGonder({
  konusmaId,
  gonderenId,
  gonderenAdi,
  aliciId,
  aliciAdi,
  icerik,
  mevcutKonusma
}: {
  konusmaId: string;
  gonderenId: string;
  gonderenAdi: string;
  aliciId: string;
  aliciAdi: string;
  icerik: string;
  mevcutKonusma?: MesajKonusmasi;
}) {
  if (!firebaseYapilandirildi) throw new Error("Mesajlaşma için Firebase bağlantısı gerekli.");

  const temizIcerik = icerik.trim();
  if (!temizIcerik) throw new Error("Mesaj boş olamaz.");
  if (temizIcerik.length > 2000) throw new Error("Mesaj en fazla 2000 karakter olabilir.");

  const zaman = new Date().toISOString();
  const konusmaRef = doc(db, "mesaj_konusmalari", konusmaId);
  const mesajRef = doc(collection(konusmaRef, "mesajlar"));

  await runTransaction(db, async (transaction) => {
    const mevcutBelge = await transaction.get(konusmaRef);
    const mevcut = mevcutBelge.exists()
      ? (mevcutBelge.data() as Omit<MesajKonusmasi, "id">)
      : mevcutKonusma;
    const okunmamisSayilari = { ...(mevcut?.okunmamisSayilari ?? {}) };
    okunmamisSayilari[gonderenId] = 0;
    okunmamisSayilari[aliciId] = (okunmamisSayilari[aliciId] ?? 0) + 1;

    transaction.set(
      konusmaRef,
      {
        katilimcilar: [gonderenId, aliciId].sort(),
        katilimciAdlari: {
          ...(mevcut?.katilimciAdlari ?? {}),
          [gonderenId]: gonderenAdi,
          [aliciId]: aliciAdi
        },
        sonMesaj: temizIcerik,
        sonMesajTarihi: zaman,
        olusturmaTarihi: mevcut?.olusturmaTarihi ?? zaman,
        okunmamisSayilari
      },
      { merge: true }
    );
    transaction.set(mesajRef, {
      gonderenId,
      gonderenAdi,
      icerik: temizIcerik,
      tarih: zaman
    });
  });

  await bildirimGonder(
    aliciId,
    `Yeni mesaj: ${gonderenAdi}`,
    temizIcerik.slice(0, 140),
    `/mesajlar?konusma=${encodeURIComponent(konusmaId)}`
  );
}

export async function mesajlariOkunduIsaretle(konusmaId: string, kullaniciId: string) {
  if (!firebaseYapilandirildi) return;
  await updateDoc(doc(db, "mesaj_konusmalari", konusmaId), {
    [`okunmamisSayilari.${kullaniciId}`]: 0
  });
}
