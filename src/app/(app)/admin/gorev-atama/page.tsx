"use client";

import { useState } from "react";
import { MOCK_MAGAZALAR, MOCK_KULLANICILAR } from "@/data/mockData";
import { kuyrugaEkle } from "@/lib/outbox";
import { kuyruguSenkronEt } from "@/lib/senkron";
import { useCevrimici } from "@/lib/useCevrimici";
import Kart from "@/components/ui/Kart";
import Buton from "@/components/ui/Buton";

const PERSONEL_LISTESI = MOCK_KULLANICILAR.filter((k) => k.rol === "personel");

export default function GorevAtamaSayfasi() {
  const cevrimici = useCevrimici();
  const [magazaId, setMagazaId] = useState(MOCK_MAGAZALAR[0]?.id ?? "");
  const [personelId, setPersonelId] = useState(PERSONEL_LISTESI[0]?.id ?? "");
  const [baslik, setBaslik] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [sonTarih, setSonTarih] = useState("");
  const [oncelik, setOncelik] = useState<"dusuk" | "normal" | "yuksek">("normal");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [durumMesaji, setDurumMesaji] = useState<string | null>(null);

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    setGonderiliyor(true);
    setDurumMesaji(null);
    try {
      await kuyrugaEkle({
        tip: "gorev_ata",
        payload: {
          magazaId,
          atananKullaniciId: personelId,
          baslik,
          aciklama,
          sonTarih,
          oncelik,
          durum: "bekliyor",
          olusturmaTarihi: new Date().toISOString()
        }
      });
      // TODO: Görev ataması yapıldığında ilgili personele push bildirimi tetiklenmeli
      // (Firebase Cloud Messaging + Cloud Function, bkz. README "Push Bildirimler" bölümü).
      if (cevrimici) {
        const sonuc = await kuyruguSenkronEt();
        setDurumMesaji(sonuc.basarili > 0 ? "Görev atandı ve personele iletildi." : "Kaydedildi, senkron bekleniyor.");
      } else {
        setDurumMesaji("Çevrimdışısın: görev kaydedildi, bağlantı gelince atanacak.");
      }
      setBaslik("");
      setAciklama("");
      setSonTarih("");
    } finally {
      setGonderiliyor(false);
    }
  }

  return (
    <form onSubmit={gonder} className="space-y-4">
      <Kart>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Mağaza</label>
            <select
              value={magazaId}
              onChange={(e) => setMagazaId(e.target.value)}
              className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-sm bg-surface"
            >
              {MOCK_MAGAZALAR.map((m) => (
                <option key={m.id} value={m.id}>{m.ad}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Personel</label>
            <select
              value={personelId}
              onChange={(e) => setPersonelId(e.target.value)}
              className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-sm bg-surface"
            >
              {PERSONEL_LISTESI.map((p) => (
                <option key={p.id} value={p.id}>{p.adSoyad}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Görev Başlığı</label>
            <input
              value={baslik}
              onChange={(e) => setBaslik(e.target.value)}
              className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-sm"
              placeholder="Örn. Vitrin Değişimi"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Açıklama</label>
            <textarea
              value={aciklama}
              onChange={(e) => setAciklama(e.target.value)}
              rows={3}
              className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-sm"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Son Tarih</label>
              <input
                type="date"
                value={sonTarih}
                onChange={(e) => setSonTarih(e.target.value)}
                className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Öncelik</label>
              <select
                value={oncelik}
                onChange={(e) => setOncelik(e.target.value as typeof oncelik)}
                className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-sm bg-surface"
              >
                <option value="dusuk">Düşük</option>
                <option value="normal">Normal</option>
                <option value="yuksek">Yüksek</option>
              </select>
            </div>
          </div>
        </div>
      </Kart>

      {durumMesaji && (
        <Kart stripRengi={durumMesaji.includes("atandı") ? "#0F7A4C" : "#6B7280"}>
          <p className="text-sm">{durumMesaji}</p>
        </Kart>
      )}

      <Buton type="submit" tamGenislik disabled={gonderiliyor || !baslik || !sonTarih}>
        {gonderiliyor ? "Atanıyor…" : "Görevi Ata"}
      </Buton>
    </form>
  );
}
