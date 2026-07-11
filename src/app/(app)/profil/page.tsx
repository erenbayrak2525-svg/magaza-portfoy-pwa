"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth, firebaseYapilandirildi } from "@/lib/firebaseClient";
import { useAuthStore } from "@/store/authStore";
import { useFirestoreListesi } from "@/lib/firestoreOkuma";
import type { Kullanici } from "@/types";
import Kart from "@/components/ui/Kart";
import Buton from "@/components/ui/Buton";

const ROL_ETIKET: Record<string, string> = {
  personel: "Personel",
  bolge_muduru: "Müdür",
  admin: "Yönetici (Admin)"
};

const CEVRIMICI_ESIGI_DK = 5;

function durumHesapla(sonGorulme?: string): { metin: string; renk: string } {
  if (!sonGorulme) return { metin: "Hiç görülmedi", renk: "text-gray-400" };
  const farkDk = (Date.now() - new Date(sonGorulme).getTime()) / 60000;
  if (farkDk < CEVRIMICI_ESIGI_DK) return { metin: "● Çevrimiçi", renk: "text-signal-done" };
  if (farkDk < 60) return { metin: `${Math.round(farkDk)} dk önce görüldü`, renk: "text-gray-500" };
  if (farkDk < 60 * 24) return { metin: `${Math.round(farkDk / 60)} saat önce görüldü`, renk: "text-gray-500" };
  return { metin: `${Math.round(farkDk / (60 * 24))} gün önce görüldü`, renk: "text-gray-400" };
}

export default function ProfilSayfasi() {
  const router = useRouter();
  const kullanici = useAuthStore((s) => s.kullanici);
  const cikisYap = useAuthStore((s) => s.cikisYap);
  const [cikisYapiliyor, setCikisYapiliyor] = useState(false);
  const { veri: tumUyeler, yukleniyor: uyelerYukleniyor, yenile: uyeleriYenile } = useFirestoreListesi<Kullanici>("profiles");

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

      {kullanici.rol === "admin" && (
        <section>
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-sm font-semibold">Kayıtlı Üyeler</h3>
            <button onClick={uyeleriYenile} className="text-gray-500 text-lg focus-ring" aria-label="Yenile">↻</button>
          </div>
          {uyelerYukleniyor ? (
            <p className="text-sm text-gray-500 text-center py-6">Yükleniyor…</p>
          ) : tumUyeler.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">Henüz kayıtlı üye yok.</p>
          ) : (
            <div className="space-y-2">
              {tumUyeler.map((uye) => {
                const durum = durumHesapla(uye.sonGorulme);
                return (
                  <Kart key={uye.id}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{uye.adSoyad || uye.id}</p>
                        <p className="text-xs text-gray-500">{ROL_ETIKET[uye.rol] || uye.rol}</p>
                      </div>
                      <span className={`text-xs shrink-0 ${durum.renk}`}>{durum.metin}</span>
                    </div>
                  </Kart>
                );
              })}
            </div>
          )}
        </section>
      )}

      <Buton varyant="tehlike" tamGenislik onClick={cikisYapButonu} disabled={cikisYapiliyor}>
        {cikisYapiliyor ? "Çıkış yapılıyor…" : "Çıkış Yap"}
      </Buton>
    </div>
  );
}
