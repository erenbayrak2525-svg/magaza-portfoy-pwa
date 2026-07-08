"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth, firebaseYapilandirildi } from "@/lib/firebaseClient";
import { useAuthStore } from "@/store/authStore";
import Kart from "@/components/ui/Kart";
import Buton from "@/components/ui/Buton";

const ROL_ETIKET: Record<string, string> = {
  personel: "Personel",
  bolge_muduru: "Müdür",
  admin: "Yönetici (Admin)"
};

export default function ProfilSayfasi() {
  const router = useRouter();
  const kullanici = useAuthStore((s) => s.kullanici);
  const cikisYap = useAuthStore((s) => s.cikisYap);
  const [cikisYapiliyor, setCikisYapiliyor] = useState(false);

  if (!kullanici) return null;

  async function cikisYapButonu() {
    setCikisYapiliyor(true);
    try {
      if (firebaseYapilandirildi) {
        await signOut(auth);
      }
    } finally {
      cikisYap();
      router.replace("/giris");
    }
  }

  return (
    <div className="space-y-4">
      <Kart>
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-brand-500 text-white flex items-center justify-center text-xl font-semibold shrink-0">
            {kullanici.adSoyad.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold truncate">{kullanici.adSoyad}</p>
            <p className="text-sm text-gray-500 truncate">{kullanici.eposta}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-line flex items-center justify-between text-sm">
          <span className="text-gray-500">Rol</span>
          <span className="font-medium">{ROL_ETIKET[kullanici.rol] || kullanici.rol}</span>
        </div>
      </Kart>

      <Link href="/iletisim">
        <Kart>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">📞</span>
              <span className="text-sm font-medium">İletişim Dizini</span>
            </div>
            <span className="text-gray-300">›</span>
          </div>
        </Kart>
      </Link>

      <Link href="/bildirimler">
        <Kart>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">🔔</span>
              <span className="text-sm font-medium">Bildirimler</span>
            </div>
            <span className="text-gray-300">›</span>
          </div>
        </Kart>
      </Link>

      <Buton varyant="tehlike" tamGenislik onClick={cikisYapButonu} disabled={cikisYapiliyor}>
        {cikisYapiliyor ? "Çıkış yapılıyor…" : "Çıkış Yap"}
      </Buton>
    </div>
  );
}
