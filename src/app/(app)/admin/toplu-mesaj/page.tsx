"use client";

import { useState } from "react";
import { topluBildirimGonder } from "@/lib/bildirimGonder";
import Kart from "@/components/ui/Kart";
import Buton from "@/components/ui/Buton";
import YoneticiKorumasi from "@/components/YoneticiKorumasi";

export default function TopluMesajSayfasi() {
  return (
    <YoneticiKorumasi>
      <TopluMesajIcerik />
    </YoneticiKorumasi>
  );
}

function TopluMesajIcerik() {
  const [baslik, setBaslik] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [durumMesaji, setDurumMesaji] = useState<string | null>(null);

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    setGonderiliyor(true);
    setDurumMesaji(null);
    try {
      await topluBildirimGonder(baslik.trim(), mesaj.trim());
      setDurumMesaji("Duyuru tüm kullanıcılara gönderildi. Uygulama bildirim çanlarında görünecek.");
      setBaslik("");
      setMesaj("");
    } catch (err) {
      setDurumMesaji(err instanceof Error ? `Hata: ${err.message}` : "Gönderilemedi");
    } finally {
      setGonderiliyor(false);
    }
  }

  return (
    <form onSubmit={gonder} className="space-y-4">
      <Kart>
        <p className="text-sm text-gray-600 mb-3">
          Yazdığın duyuru tüm kayıtlı kullanıcıların bildirim kutusuna düşer. Uygulama üst
          barındaki 🔔 ikonunda sayı olarak görünür.
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Başlık</label>
            <input value={baslik} onChange={(e) => setBaslik(e.target.value)}
              placeholder="ör. Haftalık Toplantı" required
              className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Mesaj</label>
            <textarea value={mesaj} onChange={(e) => setMesaj(e.target.value)}
              rows={4} placeholder="Duyuru içeriği…" required
              className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-sm" />
          </div>
        </div>
      </Kart>

      {durumMesaji && (
        <Kart stripRengi={durumMesaji.startsWith("Hata") ? "#C4341E" : "#0F7A4C"}>
          <p className="text-sm">{durumMesaji}</p>
        </Kart>
      )}

      <Buton type="submit" tamGenislik disabled={gonderiliyor || !baslik || !mesaj}>
        {gonderiliyor ? "Gönderiliyor…" : "📣 Tüm Personele Gönder"}
      </Buton>
    </form>
  );
}
