"use client";

import { useCallback, useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db, firebaseYapilandirildi } from "@/lib/firebaseClient";

// ÖNEMLİ MALİYET NOTU: Bu dosya bilerek "canlı dinleyici" (onSnapshot) yerine TEK SEFERLİK
// okuma (getDocs/getDoc) kullanıyor. onSnapshot bir sayfa açık kaldığı sürece bağlantıyı
// canlı tutar ve başka biri veri değiştirdikçe ek okuma ücreti oluşturur; küçük bir ekip ve
// yüzlerce ürünlük bir katalog için bu hızla Firestore'un ücretsiz günlük kotasını
// (Spark planında 50.000 okuma/gün) tüketebilir. Tek seferlik okuma + elle "Yenile" butonu,
// çok daha öngörülebilir ve düşük maliyetli bir model.
export function useFirestoreListesi<T>(koleksiyonAdi: string) {
  const [veri, setVeri] = useState<(T & { id: string })[]>([]);
  const [yukleniyor, setYukleniyor] = useState(firebaseYapilandirildi);
  const [hata, setHata] = useState<string | null>(null);

  const yenile = useCallback(async () => {
    if (!firebaseYapilandirildi) {
      setYukleniyor(false);
      return;
    }
    setYukleniyor(true);
    try {
      const anlik = await getDocs(collection(db, koleksiyonAdi));
      setVeri(anlik.docs.map((d) => ({ id: d.id, ...(d.data() as T) })));
      setHata(null);
    } catch (err) {
      setHata(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setYukleniyor(false);
    }
  }, [koleksiyonAdi]);

  useEffect(() => {
    yenile();
  }, [yenile]);

  return { veri, yukleniyor, hata, yenile };
}

// Tek bir belgeyi tek seferlik okur (ör. stok ürün detayı).
export function useFirestoreBelge<T>(koleksiyonAdi: string, belgeId: string | null) {
  const [veri, setVeri] = useState<(T & { id: string }) | null>(null);
  const [yukleniyor, setYukleniyor] = useState(firebaseYapilandirildi);
  const [hata, setHata] = useState<string | null>(null);

  const yenile = useCallback(async () => {
    if (!firebaseYapilandirildi || !belgeId) {
      setYukleniyor(false);
      return;
    }
    setYukleniyor(true);
    try {
      const anlik = await getDoc(doc(db, koleksiyonAdi, belgeId));
      setVeri(anlik.exists() ? ({ id: anlik.id, ...(anlik.data() as T) }) : null);
      setHata(null);
    } catch (err) {
      setHata(err instanceof Error ? err.message : "Bilinmeyen hata");
    } finally {
      setYukleniyor(false);
    }
  }, [koleksiyonAdi, belgeId]);

  useEffect(() => {
    yenile();
  }, [yenile]);

  return { veri, yukleniyor, hata, yenile };
}
