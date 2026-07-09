"use client";

import { useEffect, useState } from "react";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { db, firebaseYapilandirildi } from "@/lib/firebaseClient";

// Bir Firestore koleksiyonunu gerçek zamanlı dinler. Firebase henüz bağlanmadıysa
// (demo modu) hiç deneme yapmaz, çağıran taraf mock veriye düşebilir.
export function useFirestoreListesi<T>(koleksiyonAdi: string) {
  const [veri, setVeri] = useState<(T & { id: string })[]>([]);
  const [yukleniyor, setYukleniyor] = useState(firebaseYapilandirildi);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseYapilandirildi) {
      setYukleniyor(false);
      return;
    }
    setYukleniyor(true);
    const kaldir = onSnapshot(
      collection(db, koleksiyonAdi),
      (anlik) => {
        setVeri(anlik.docs.map((d) => ({ id: d.id, ...(d.data() as T) })));
        setYukleniyor(false);
        setHata(null);
      },
      (err) => {
        setHata(err.message);
        setYukleniyor(false);
      }
    );
    return () => kaldir();
  }, [koleksiyonAdi]);

  return { veri, yukleniyor, hata };
}

// Tek bir belgeyi gerçek zamanlı dinler (ör. stok ürün detayı).
export function useFirestoreBelge<T>(koleksiyonAdi: string, belgeId: string | null) {
  const [veri, setVeri] = useState<(T & { id: string }) | null>(null);
  const [yukleniyor, setYukleniyor] = useState(firebaseYapilandirildi);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseYapilandirildi || !belgeId) {
      setYukleniyor(false);
      return;
    }
    setYukleniyor(true);
    const kaldir = onSnapshot(
      doc(db, koleksiyonAdi, belgeId),
      (anlik) => {
        setVeri(anlik.exists() ? ({ id: anlik.id, ...(anlik.data() as T) }) : null);
        setYukleniyor(false);
        setHata(null);
      },
      (err) => {
        setHata(err.message);
        setYukleniyor(false);
      }
    );
    return () => kaldir();
  }, [koleksiyonAdi, belgeId]);

  return { veri, yukleniyor, hata };
}
