"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db, firebaseYapilandirildi } from "@/lib/firebaseClient";
import { useAuthStore } from "@/store/authStore";
import { MOCK_KULLANICILAR } from "@/data/mockData";
import Buton from "@/components/ui/Buton";
import type { Rol } from "@/types";

export default function GirisSayfasi() {
  const router = useRouter();
  const girisYap = useAuthStore((s) => s.girisYap);

  const [eposta, setEposta] = useState("");
  const [sifre, setSifre] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    setHata(null);
    setYukleniyor(true);

    try {
      if (firebaseYapilandirildi) {
        const sonuc = await signInWithEmailAndPassword(auth, eposta, sifre);

        // "profiles" koleksiyonunda bu kullanıcının uid'si ile eşleşen belgeyi ara.
        // Belge yoksa (henüz Firestore'da profil oluşturulmadıysa) güvenli varsayılan
        // olarak 'personel' rolüyle devam et.
        const profilBelgesi = await getDoc(doc(db, "profiles", sonuc.user.uid));
        const profil = profilBelgesi.exists() ? profilBelgesi.data() : null;

        girisYap({
          id: sonuc.user.uid,
          adSoyad: (profil?.adSoyad as string) || sonuc.user.email?.split("@")[0] || "Kullanıcı",
          eposta: sonuc.user.email || eposta,
          rol: (profil?.rol as Rol) || "personel",
          bolgeId: profil?.bolgeId as string | undefined
        });
      } else {
        // Firebase henüz bağlanmadı: demo modu, mock kullanıcılardan e-postaya göre eşle.
        const bulunan = MOCK_KULLANICILAR.find((k) => k.eposta === eposta);
        if (!bulunan) throw new Error("Demo modda kayıtlı değil. mockData.ts içindeki e-postalardan birini dene.");
        girisYap(bulunan);
      }
      router.replace("/panel");
    } catch (err) {
      setHata(err instanceof Error ? err.message : "Giriş başarısız");
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-brand-500 text-white flex items-center justify-center text-2xl font-semibold mx-auto mb-3">
            M
          </div>
          <h1 className="text-lg font-semibold">Wasmoda Mağaza Portföyü</h1>
          <p className="text-sm text-gray-500 mt-1">Personel ve saha yönetim uygulaması</p>
        </div>

        <form onSubmit={gonder} className="bg-surface border border-line rounded-card shadow-card p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Personel ID / E-posta</label>
            <input
              type="text"
              required
              value={eposta}
              onChange={(e) => setEposta(e.target.value)}
              className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-sm"
              placeholder="ornek@wasmoda.com.tr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Şifre</label>
            <input
              type="password"
              required
              value={sifre}
              onChange={(e) => setSifre(e.target.value)}
              className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-sm"
              placeholder="••••••••"
            />
          </div>

          {hata && (
            <p className="text-sm text-signal-late bg-signal-lateBg rounded-lg px-3 py-2">{hata}</p>
          )}

          {!firebaseYapilandirildi && (
            <p className="text-xs text-signal-pending bg-signal-pendingBg rounded-lg px-3 py-2">
              Demo modu: Firebase henüz bağlanmadı. Deneme için elif@wasmoda.com.tr, deniz@wasmoda.com.tr
              veya admin@wasmoda.com.tr kullan (şifre önemli değil).
            </p>
          )}

          <Buton type="submit" tamGenislik disabled={yukleniyor}>
            {yukleniyor ? "Giriş yapılıyor…" : "Giriş Yap"}
          </Buton>
        </form>
      </div>
    </div>
  );
}
