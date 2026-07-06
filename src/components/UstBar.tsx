"use client";

import Link from "next/link";
import { useCevrimici } from "@/lib/useCevrimici";

export default function UstBar({ baslik }: { baslik: string }) {
  const cevrimici = useCevrimici();

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
          className="focus-ring w-9 h-9 flex items-center justify-center rounded-full hover:bg-canvas"
        >
          🔔
        </Link>
      </div>
    </header>
  );
}
