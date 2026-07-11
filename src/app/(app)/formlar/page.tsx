"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import Kart from "@/components/ui/Kart";

const FORMLAR = [
  { href: "/formlar/ciro", ikon: "💰", baslik: "Ciro Girişi", aciklama: "Günlük ciro ve fiş adedi", roller: ["bolge_muduru", "admin"] },
  { href: "/formlar/stok-sayimi", ikon: "📦", baslik: "Stok Sayımı", aciklama: "Ürün bazlı sayım kaydı", roller: ["personel", "bolge_muduru", "admin"] },
  { href: "/formlar/denetim", ikon: "🧾", baslik: "Periyodik Denetim", aciklama: "Mağaza denetim formu", roller: ["personel", "bolge_muduru", "admin"] },
  { href: "/stok", ikon: "🏷️", baslik: "Stok Kataloğu", aciklama: "Ürün görseli ve etiket ekle", roller: ["personel", "bolge_muduru", "admin"] },
  { href: "/formlar/calisma-saatleri", ikon: "🗓️", baslik: "Çalışma Saatleri", aciklama: "Haftalık program", roller: ["personel", "bolge_muduru", "admin"] }
];

export default function FormlarSayfasi() {
  const kullanici = useAuthStore((s) => s.kullanici);
  const gorulebilenler = FORMLAR.filter((f) => !kullanici || f.roller.includes(kullanici.rol));

  return (
    <div className="space-y-2">
      {gorulebilenler.map((f) => (
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
