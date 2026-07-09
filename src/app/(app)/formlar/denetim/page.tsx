"use client";

import { useState } from "react";
import { kuyrugaEkle } from "@/lib/outbox";
import { kuyruguSenkronEt } from "@/lib/senkron";
import { useCevrimici } from "@/lib/useCevrimici";
import { useAuthStore } from "@/store/authStore";
import Kart from "@/components/ui/Kart";
import Buton from "@/components/ui/Buton";

const KRITERLER = [
  "Vitrin Düzeni",
  "Mağaza Temizliği",
  "Ürün Yerleşimi (Görsel Standart)",
  "Personel Kılık Kıyafeti",
  "Kasa ve Ödeme Süreci",
  "Depo Düzeni"
];

export default function DenetimFormuSayfasi() {
  const cevrimici = useCevrimici();
  const kullanici = useAuthStore((s) => s.kullanici);
  const [puanlar, setPuanlar] = useState<Record<string, number>>({});
  const [genelNot, setGenelNot] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [durumMesaji, setDurumMesaji] = useState<string | null>(null);

  function puanVer(kriter: string, puan: number) {
    setPuanlar((p) => ({ ...p, [kriter]: puan }));
  }

  const tumKriterlerPuanlandi = KRITERLER.every((k) => puanlar[k]);

  async function gonder() {
    setGonderiliyor(true);
    setDurumMesaji(null);
    try {
      await kuyrugaEkle({
        tip: "denetim_formu",
        payload: {
          tarih: new Date().toISOString().slice(0, 10),
          denetciAdi: kullanici?.adSoyad ?? "Bilinmiyor",
          puanlar,
          genelNot
        }
      });
      if (cevrimici) {
        const sonuc = await kuyruguSenkronEt();
        setDurumMesaji(sonuc.basarili > 0 ? "Denetim formu gönderildi." : "Kaydedildi, senkron bekleniyor.");
      } else {
        setDurumMesaji("Çevrimdışısın: kaydedildi, bağlantı gelince gönderilecek.");
      }
      setPuanlar({});
      setGenelNot("");
    } finally {
      setGonderiliyor(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {KRITERLER.map((kriter) => (
          <Kart key={kriter}>
            <p className="text-sm font-medium mb-2">{kriter}</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((p) => (
                <button
                  key={p}
                  onClick={() => puanVer(kriter, p)}
                  className={`focus-ring flex-1 rounded-lg py-2 text-sm font-medium border ${
                    puanlar[kriter] === p
                      ? "bg-brand-500 text-white border-brand-500"
                      : "bg-surface border-line text-gray-500"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </Kart>
        ))}
      </div>

      <Kart>
        <label className="block text-sm font-medium mb-1.5">Genel Not (opsiyonel)</label>
        <textarea
          value={genelNot}
          onChange={(e) => setGenelNot(e.target.value)}
          rows={3}
          className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-sm"
        />
      </Kart>

      {durumMesaji && (
        <Kart stripRengi={durumMesaji.includes("gönderildi") ? "#0F7A4C" : "#6B7280"}>
          <p className="text-sm">{durumMesaji}</p>
        </Kart>
      )}

      <Buton tamGenislik onClick={gonder} disabled={gonderiliyor || !tumKriterlerPuanlandi}>
        {gonderiliyor ? "Gönderiliyor…" : "Denetimi Tamamla"}
      </Buton>
    </div>
  );
}
