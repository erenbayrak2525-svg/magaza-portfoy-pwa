"use client";

import { useState } from "react";
import Link from "next/link";
import { doc, updateDoc } from "firebase/firestore";
import { db, firebaseYapilandirildi } from "@/lib/firebaseClient";
import { useFirestoreListesi } from "@/lib/firestoreOkuma";
import { useAuthStore } from "@/store/authStore";
import { MOCK_BILDIRIMLER } from "@/data/mockData";
import Kart from "@/components/ui/Kart";

interface FirestoreBildirim {
  id: string;
  kullaniciId: string;
  baslik: string;
  mesaj: string;
  tarih: string;
  okundu: boolean;
  link?: string;
}

export default function BildirimlerSayfasi() {
  const kullanici = useAuthStore((s) => s.kullanici);
  const { veri: tumBildirimler, yukleniyor, yenile } = useFirestoreListesi<FirestoreBildirim>("bildirimler");
  const [okunuyorId, setOkunuyorId] = useState<string | null>(null);

  const bildirimler = firebaseYapilandirildi
    ? tumBildirimler
        .filter((b) => b.kullaniciId === kullanici?.id)
        .sort((a, b) => (a.tarih < b.tarih ? 1 : -1))
    : MOCK_BILDIRIMLER;

  async function okunduIsaretle(id: string) {
    if (!firebaseYapilandirildi) return;
    setOkunuyorId(id);
    try {
      await updateDoc(doc(db, "bildirimler", id), { okundu: true });
      yenile();
    } finally {
      setOkunuyorId(null);
    }
  }

  if (yukleniyor) return <p className="text-sm text-gray-500 text-center py-16">Yükleniyor…</p>;

  if (bildirimler.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-16">Henüz bildirim yok.</p>;
  }

  return (
    <div className="space-y-2">
      {bildirimler.map((b) => {
        const icerik = (
          <Kart
            stripRengi={b.okundu ? "#E3E6EA" : "#3B4CE0"}
            onClick={!b.okundu ? () => okunduIsaretle(b.id) : undefined}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className={`text-sm truncate ${b.okundu ? "text-gray-500" : "font-medium"}`}>{b.baslik}</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{b.mesaj}</p>
                <p className="text-[11px] text-gray-400 mt-1.5">
                  {new Date(b.tarih).toLocaleString("tr-TR", {
                    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                  })}
                </p>
              </div>
              {!b.okundu && (
                <span className="shrink-0 text-[10px] text-brand-500 font-medium bg-brand-50 px-2 py-1 rounded-full">
                  {okunuyorId === b.id ? "…" : "Yeni"}
                </span>
              )}
            </div>
          </Kart>
        );

        return b.link ? (
          <Link key={b.id} href={b.link}>{icerik}</Link>
        ) : (
          <div key={b.id}>{icerik}</div>
        );
      })}
    </div>
  );
}
