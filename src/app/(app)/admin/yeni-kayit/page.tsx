"use client";

import { useState } from "react";
import { yeniKullaniciOlustur } from "@/lib/kullaniciOlustur";
import Kart from "@/components/ui/Kart";
import Buton from "@/components/ui/Buton";
import AdminKorumasi from "@/components/AdminKorumasi";

export default function YeniKayitSayfasi() {
  return (
    <AdminKorumasi>
      <YeniKayitIcerik />
    </AdminKorumasi>
  );
}

function YeniKayitIcerik() {
  const [adSoyad, setAdSoyad] = useState("");
  const [eposta, setEposta] = useState("");
  const [sifre, setSifre] = useState("");
  const [rol, setRol] = useState<"personel" | "bolge_muduru" | "admin">("personel");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [sonuc, setSonuc] = useState<{ basarili: boolean; mesaj: string } | null>(null);

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    setGonderiliyor(true);
    setSonuc(null);
    try {
      const uid = await yeniKullaniciOlustur({ adSoyad, eposta, sifre, rol });
      setSonuc({ basarili: true, mesaj: `Kullanıcı oluşturuldu. UID: ${uid}` });
      setAdSoyad("");
      setEposta("");
      setSifre("");
      setRol("personel");
    } catch (err) {
      setSonuc({ basarili: false, mesaj: err instanceof Error ? err.message : "Oluşturulamadı" });
    } finally {
      setGonderiliyor(false);
    }
  }

  return (
    <form onSubmit={kaydet} className="space-y-4">
      <Kart>
        <p className="text-sm text-gray-600 mb-3">
          Girilen e-posta ve şifre ile Firebase Authentication'da yeni bir hesap açılır,
          Firestore'a profil belgesi yazılır. Kullanıcı bu bilgilerle siteye giriş yapabilir.
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Ad Soyad</label>
            <input value={adSoyad} onChange={(e) => setAdSoyad(e.target.value)}
              placeholder="Elif Kaya" required
              className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">E-posta</label>
            <input type="email" value={eposta} onChange={(e) => setEposta(e.target.value)}
              placeholder="elif@ornek.com" required
              className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Şifre (en az 6 karakter)</label>
            <input type="password" value={sifre} onChange={(e) => setSifre(e.target.value)}
              placeholder="••••••••" required
              className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Rol</label>
            <select value={rol} onChange={(e) => setRol(e.target.value as typeof rol)}
              className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-sm bg-surface">
              <option value="personel">Personel</option>
              <option value="bolge_muduru">Müdür</option>
              <option value="admin">Yönetici (Admin)</option>
            </select>
          </div>
        </div>
      </Kart>

      {sonuc && (
        <Kart stripRengi={sonuc.basarili ? "#0F7A4C" : "#C4341E"}>
          <p className={`text-sm ${sonuc.basarili ? "text-signal-done" : "text-signal-late"}`}>
            {sonuc.mesaj}
          </p>
        </Kart>
      )}

      <Buton type="submit" tamGenislik disabled={gonderiliyor || !adSoyad || !eposta || !sifre}>
        {gonderiliyor ? "Oluşturuluyor…" : "Kullanıcı Oluştur"}
      </Buton>
    </form>
  );
}
