"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth, firebaseYapilandirildi } from "@/lib/firebaseClient";
import { useAuthStore } from "@/store/authStore";
import { useFirestoreListesi, belgeYaz, belgeSil } from "@/lib/firestoreOkuma";
import { adSoyadBul } from "@/lib/adSoyadBul";
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

  // Üye düzenleme durumu (admin, isim/rol düzeltmek ve duplicate kayıt silmek için)
  const [duzenlenenId, setDuzenlenenId] = useState<string | null>(null);
  const [duzenlenenAd, setDuzenlenenAd] = useState("");
  const [duzenlenenRol, setDuzenlenenRol] = useState("personel");
  const [uyeKaydediliyor, setUyeKaydediliyor] = useState(false);
  const [uyeSiliniyorId, setUyeSiliniyorId] = useState<string | null>(null);

  function duzenlemeyeBasla(uye: Kullanici) {
    setDuzenlenenId(uye.id);
    setDuzenlenenAd(adSoyadBul(uye) || "");
    setDuzenlenenRol(uye.rol || "personel");
  }

  async function uyeKaydet() {
    if (!duzenlenenId) return;
    setUyeKaydediliyor(true);
    try {
      await belgeYaz("profiles", duzenlenenId, { adSoyad: duzenlenenAd.trim(), rol: duzenlenenRol });
      setDuzenlenenId(null);
      uyeleriYenile();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Kaydedilemedi");
    } finally {
      setUyeKaydediliyor(false);
    }
  }

  async function uyeSil(id: string) {
    if (!confirm("Bu üye kaydını silmek istediğine emin misin? (Sadece Firestore'daki profil kaydı silinir, Authentication'daki giriş hesabını Firebase Console'dan ayrıca silmen gerekir.)")) return;
    setUyeSiliniyorId(id);
    try {
      await belgeSil("profiles", id);
      uyeleriYenile();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Silinemedi");
    } finally {
      setUyeSiliniyorId(null);
    }
  }

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
                const duzenleniyor = duzenlenenId === uye.id;
                return (
                  <Kart key={uye.id}>
                    {duzenleniyor ? (
                      <div className="space-y-2">
                        <input
                          value={duzenlenenAd}
                          onChange={(e) => setDuzenlenenAd(e.target.value)}
                          placeholder="Ad Soyad"
                          className="focus-ring w-full rounded-lg border border-line px-2.5 py-1.5 text-sm"
                        />
                        <select
                          value={duzenlenenRol}
                          onChange={(e) => setDuzenlenenRol(e.target.value)}
                          className="focus-ring w-full rounded-lg border border-line px-2.5 py-1.5 text-sm bg-surface"
                        >
                          <option value="personel">Personel</option>
                          <option value="bolge_muduru">Müdür</option>
                          <option value="admin">Yönetici (Admin)</option>
                        </select>
                        <p className="text-[10px] text-gray-400 font-mono break-all">ID: {uye.id}</p>
                        <div className="flex gap-2">
                          <Buton varyant="ikincil" className="flex-1" onClick={() => setDuzenlenenId(null)}>
                            Vazgeç
                          </Buton>
                          <Buton className="flex-1" onClick={uyeKaydet} disabled={uyeKaydediliyor || !duzenlenenAd.trim()}>
                            {uyeKaydediliyor ? "Kaydediliyor…" : "Kaydet"}
                          </Buton>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{adSoyadBul(uye) || uye.id}</p>
                          <p className="text-xs text-gray-500">{ROL_ETIKET[uye.rol] || uye.rol}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-xs ${durum.renk}`}>{durum.metin}</span>
                          <button
                            onClick={() => duzenlemeyeBasla(uye)}
                            className="focus-ring text-sm text-brand-500"
                            aria-label="Üyeyi düzenle"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => uyeSil(uye.id)}
                            disabled={uyeSiliniyorId === uye.id}
                            className="focus-ring text-sm text-gray-400 hover:text-signal-late"
                            aria-label="Üyeyi sil"
                          >
                            {uyeSiliniyorId === uye.id ? "…" : "🗑️"}
                          </button>
                        </div>
                      </div>
                    )}
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
