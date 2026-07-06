"use client";

import { useState } from "react";
import { MOCK_MAGAZALAR } from "@/data/mockData";
import { kuyrugaEkle } from "@/lib/outbox";
import { kuyruguSenkronEt } from "@/lib/senkron";
import { useCevrimici } from "@/lib/useCevrimici";
import Kart from "@/components/ui/Kart";
import Buton from "@/components/ui/Buton";

interface SayimSatiri {
  urunKodu: string;
  sayilanAdet: number;
}

export default function StokSayimiSayfasi() {
  const cevrimici = useCevrimici();
  const [magazaId, setMagazaId] = useState(MOCK_MAGAZALAR[0]?.id ?? "");
  const [urunKodu, setUrunKodu] = useState("");
  const [adet, setAdet] = useState("");
  const [satirlar, setSatirlar] = useState<SayimSatiri[]>([]);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [durumMesaji, setDurumMesaji] = useState<string | null>(null);

  function satirEkle() {
    if (!urunKodu || !adet) return;
    setSatirlar((s) => [...s, { urunKodu, sayilanAdet: Number(adet) }]);
    setUrunKodu("");
    setAdet("");
  }

  function satirSil(index: number) {
    setSatirlar((s) => s.filter((_, i) => i !== index));
  }

  async function tumunuKaydet() {
    if (satirlar.length === 0) return;
    setGonderiliyor(true);
    setDurumMesaji(null);
    try {
      const tarih = new Date().toISOString().slice(0, 10);
      for (const satir of satirlar) {
        await kuyrugaEkle({
          tip: "stok_sayimi",
          payload: { magazaId, tarih, urunKodu: satir.urunKodu, sayilanAdet: satir.sayilanAdet }
        });
      }
      if (cevrimici) {
        const sonuc = await kuyruguSenkronEt();
        setDurumMesaji(sonuc.basarili > 0 ? `${satirlar.length} kayıt gönderildi.` : "Kaydedildi, senkron bekleniyor.");
      } else {
        setDurumMesaji("Çevrimdışısın: kayıtlar tutuldu, bağlantı gelince gönderilecek.");
      }
      setSatirlar([]);
    } finally {
      setGonderiliyor(false);
    }
  }

  return (
    <div className="space-y-4">
      <Kart>
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
      </Kart>

      <Kart>
        <p className="text-sm font-medium mb-3">Ürün Ekle</p>
        <div className="flex gap-2">
          <input
            value={urunKodu}
            onChange={(e) => setUrunKodu(e.target.value)}
            placeholder="Ürün kodu"
            className="focus-ring flex-1 rounded-xl border border-line px-3.5 py-2.5 text-sm"
          />
          <input
            value={adet}
            onChange={(e) => setAdet(e.target.value)}
            type="number"
            inputMode="numeric"
            placeholder="Adet"
            className="focus-ring w-24 rounded-xl border border-line px-3.5 py-2.5 text-sm"
          />
        </div>
        <Buton varyant="ikincil" tamGenislik className="mt-3" onClick={satirEkle} type="button">
          + Listeye Ekle
        </Buton>
      </Kart>

      {satirlar.length > 0 && (
        <Kart>
          <p className="text-sm font-medium mb-3">Sayım Listesi ({satirlar.length})</p>
          <div className="space-y-2">
            {satirlar.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-sm border-b border-line last:border-0 pb-2 last:pb-0">
                <span className="font-mono">{s.urunKodu}</span>
                <div className="flex items-center gap-3">
                  <span className="font-medium">{s.sayilanAdet} adet</span>
                  <button onClick={() => satirSil(i)} className="text-signal-late text-xs">Sil</button>
                </div>
              </div>
            ))}
          </div>
        </Kart>
      )}

      {durumMesaji && (
        <Kart stripRengi={durumMesaji.includes("gönderildi") ? "#0F7A4C" : "#6B7280"}>
          <p className="text-sm">{durumMesaji}</p>
        </Kart>
      )}

      <Buton tamGenislik onClick={tumunuKaydet} disabled={gonderiliyor || satirlar.length === 0}>
        {gonderiliyor ? "Kaydediliyor…" : `Tümünü Kaydet (${satirlar.length})`}
      </Buton>
    </div>
  );
}
