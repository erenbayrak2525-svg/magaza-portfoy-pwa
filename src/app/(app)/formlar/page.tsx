"use client";

import Link from "next/link";
import Kart from "@/components/ui/Kart";

const FORMLAR = [
  { href: "/formlar/ciro", ikon: "💰", baslik: "Ciro Girişi", aciklama: "Günlük ciro ve fiş adedi" },
  { href: "/formlar/stok-sayimi", ikon: "📦", baslik: "Stok Sayımı", aciklama: "Ürün bazlı sayım kaydı" },
  { href: "/formlar/denetim", ikon: "🧾", baslik: "Periyodik Denetim", aciklama: "Mağaza denetim formu" },
  { href: "/stok", ikon: "🏷️", baslik: "Stok Kataloğu", aciklama: "Ürün görseli ve etiket ekle" }
];

export default function FormlarSayfasi() {
  return (
    <div className="space-y-2">
      {FORMLAR.map((f) => (
        <Link key={f.href} href={f.href}>
          <Kart>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{f.ikon}</span>
              <div>
                <p className="font-medium text-sm">{f.baslik}</p>
                <p className="text-xs text-gray-500">{f.aciklama}</p>
              </div>
            </div>
          </Kart>
        </Link>
      ))}
    </div>
  );
}
