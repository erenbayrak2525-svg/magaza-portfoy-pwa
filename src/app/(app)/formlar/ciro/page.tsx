"use client";

import { useState } from "react";
import { MOCK_MAGAZALAR } from "@/data/mockData";
import { kuyrugaEkle } from "@/lib/outbox";
import { kuyruguSenkronEt } from "@/lib/senkron";
import { useCevrimici } from "@/lib/useCevrimici";
import Kart from "@/components/ui/Kart";
import Buton from "@/components/ui/Buton";

export default function CiroGirisiSayfasi() {
  const cevrimici = useCevrimici();
  const [magazaId, setMagazaId] = useState(MOCK_MAGAZALAR[0]?.id ?? "");
  const [tarih, setTarih] = useState(new Date().toISOString().slice(0, 10));
  const [tutar, setTutar] = useState("");
  const [fisAdedi, setFisAdedi] = useState("");
  const [notlar, setNotlar] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [durumMesaji, setDurumMesaji] = useState<string | null>(null);

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    setGonderiliyor(true);
    setDurumMesaji(null);
    try {
      // TODO: Firestore 'ciro_kayitlari' koleksiyonu oluşturulunca burada doğrudan yazma denenebilir;
      // aşağıdaki outbox yaklaşımı zaten hem online hem offline'da aynı akışı garanti eder.
      await kuyrugaEkle({
        tip: "ciro_girisi",
        payload: { magazaId, tarih, tutar: Number(tutar), fisAdedi: Number(fisAdedi) || null, notlar }
      });
      if (cevrimici) {
        const sonuc = await kuyruguSenkronEt();
        setDurumMesaji(sonuc.basarili > 0 ? "Kaydedildi ve gönderildi." : "Kaydedildi, senkron bekleniyor.");
      } else {
        setDurumMesaji("Çevrimdışısın: kaydedildi, bağlantı gelince gönderilecek.");
      }
      setTutar("");
      setFisAdedi("");
      setNotlar("");
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
            <label className="block text-sm font-medium mb-1.5">Tarih</label>
            <input
              type="date"
              value={tarih}
              onChange={(e) => setTarih(e.target.value)}
              className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Ciro Tutarı (₺)</label>
            <input
              type="number"
              inputMode="decimal"
              value={tutar}
              onChange={(e) => setTutar(e.target.value)}
              className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-sm"
              placeholder="0"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Fiş Adedi</label>
            <input
              type="number"
              inputMode="numeric"
              value={fisAdedi}
              onChange={(e) => setFisAdedi(e.target.value)}
              className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-sm"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Notlar (opsiyonel)</label>
            <textarea
              value={notlar}
              onChange={(e) => setNotlar(e.target.value)}
              className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-sm"
              rows={2}
            />
          </div>
        </div>
      </Kart>

      {durumMesaji && (
        <Kart stripRengi={durumMesaji.includes("gönderildi") ? "#0F7A4C" : "#6B7280"}>
          <p className="text-sm">{durumMesaji}</p>
        </Kart>
      )}

      <Buton type="submit" tamGenislik disabled={gonderiliyor || !tutar}>
        {gonderiliyor ? "Kaydediliyor…" : "Kaydet"}
      </Buton>
    </form>
  );
}
