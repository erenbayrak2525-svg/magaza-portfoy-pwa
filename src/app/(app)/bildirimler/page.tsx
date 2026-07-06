"use client";

import Link from "next/link";
import { MOCK_BILDIRIMLER } from "@/data/mockData";
import Kart from "@/components/ui/Kart";

export default function BildirimlerSayfasi() {
  return (
    <div className="space-y-2">
      {MOCK_BILDIRIMLER.map((b) => {
        const icerik = (
          <Kart stripRengi={b.okundu ? "#E3E6EA" : "#3B4CE0"}>
            <p className="text-sm font-medium">{b.baslik}</p>
            <p className="text-xs text-gray-500 mt-1">{b.mesaj}</p>
            <p className="text-[11px] text-gray-400 mt-2">
              {new Date(b.tarih).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
            </p>
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
