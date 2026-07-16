"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCevrimici } from "@/lib/useCevrimici";
import { okunmamisSayisiGetir } from "@/lib/bildirimGonder";
import { useAuthStore } from "@/store/authStore";

export default function UstBar({ baslik }: { baslik: string }) {
  const cevrimici = useCevrimici();
  const kullanici = useAuthStore((s) => s.kullanici);
  const [okunmamisSayisi, setOkunmamisSayisi] = useState(0);

  useEffect(() => {
    if (!kullanici) return;
    okunmamisSayisiGetir(kullanici.id).then(setOkunmamisSayisi);
    // Her 30 saniyede bir güncelle (canlı dinleyici yerine düşük maliyetli polling)
    const aralik = setInterval(() => {
      okunmamisSayisiGetir(kullanici.id).then(setOkunmamisSayisi);
    }, 30_000);
    return () => clearInterval(aralik);
  }, [kullanici]);

  return (
    <header
      className="sticky top-0 z-20 bg-surface/95 backdrop-blur border-b border-line px-4 py-3 flex items-center justify-between"
      style={{ paddingTop: "calc(var(--safe-top) + 0.75rem)" }}
    >
      <h1 className="font-semibold text-base truncate">{baslik}</h1>
      <div className="flex items-center gap-2">
        <span
          className={`text-xs px-2 py-1 rounded-full font-medium ${
            cevrimici ? "bg-signal-doneBg text-signal-done" : "bg-gray-100 text-signal-offline"
          }`}
          title={cevrimici ? "Bağlantı var" : "Çevrimdışı — işlemler kuyrukta bekleyecek"}
        >
          {cevrimici ? "● Çevrimiçi" : "○ Çevrimdışı"}
        </span>
        <Link
          href="/bildirimler"
          aria-label="Bildirimler"
          className="focus-ring relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-canvas"
        >
          🔔
          {okunmamisSayisi > 0 && (
            <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-signal-late text-white text-[9px] flex items-center justify-center font-bold">
              {okunmamisSayisi > 9 ? "9+" : okunmamisSayisi}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
