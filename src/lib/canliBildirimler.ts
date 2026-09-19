"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db, firebaseYapilandirildi } from "@/lib/firebaseClient";
import type { Bildirim } from "@/types";

export function useCanliBildirimler(kullaniciId?: string) {
  const [veri, setVeri] = useState<(Bildirim & { kullaniciId: string })[]>([]);
  const [yukleniyor, setYukleniyor] = useState(Boolean(kullaniciId && firebaseYapilandirildi));
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    if (!kullaniciId || !firebaseYapilandirildi) {
      setVeri([]);
      setYukleniyor(false);
      return;
    }

    setYukleniyor(true);
    const q = query(collection(db, "bildirimler"), where("kullaniciId", "==", kullaniciId));
    return onSnapshot(
      q,
      (snap) => {
        setVeri(
          snap.docs
            .map((belge) => ({ id: belge.id, ...(belge.data() as Omit<Bildirim, "id"> & { kullaniciId: string }) }))
            .sort((a, b) => (a.tarih < b.tarih ? 1 : -1))
        );
        setHata(null);
        setYukleniyor(false);
      },
      (err) => {
        setHata(err.message || "Bildirimler okunamadı");
        setYukleniyor(false);
      }
    );
  }, [kullaniciId]);

  return {
    veri,
    yukleniyor,
    hata,
    okunmamis: veri.filter((bildirim) => !bildirim.okundu).length
  };
}

export function useCanliOkunmamisBildirimSayisi(kullaniciId?: string) {
  const { okunmamis } = useCanliBildirimler(kullaniciId);
  return okunmamis;
}
