"use client";

import { useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MOCK_GOREVLER } from "@/data/mockData";
import { kuyrugaEkle } from "@/lib/outbox";
import { kuyruguSenkronEt } from "@/lib/senkron";
import { useCevrimici } from "@/lib/useCevrimici";
import Kart from "@/components/ui/Kart";
import Buton from "@/components/ui/Buton";
import DurumRozeti, { stripRengi } from "@/components/ui/DurumRozeti";

export default function GorevDetaySayfasi() {
  return (
    <Suspense fallback={null}>
      <GorevDetayIcerik />
    </Suspense>
  );
}

function GorevDetayIcerik() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get("id");
  const cevrimici = useCevrimici();

  const gorev = MOCK_GOREVLER.find((g) => g.id === id);
  const dosyaInputRef = useRef<HTMLInputElement>(null);

  const [fotoOnizleme, setFotoOnizleme] = useState<string | null>(null);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [tamamlandi, setTamamlandi] = useState(false);
  const [kuyrugaAlindi, setKuyrugaAlindi] = useState(false);

  if (!gorev) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-gray-500">Görev bulunamadı.</p>
        <button onClick={() => router.push("/gorevler")} className="text-brand-500 text-sm mt-2 underline">
          Görevlere dön
        </button>
      </div>
    );
  }

  function fotoSecildi(e: React.ChangeEvent<HTMLInputElement>) {
    const dosya = e.target.files?.[0];
    if (!dosya) return;
    const okuyucu = new FileReader();
    okuyucu.onload = () => setFotoOnizleme(okuyucu.result as string);
    okuyucu.readAsDataURL(dosya);
  }

  async function tamamla() {
    if (!gorev) return;
    setGonderiliyor(true);
    try {
      // TODO: Firebase Storage'a foto yükleme ve 'gorevler' koleksiyonunda durum güncelleme burada yapılacak.
      await kuyrugaEkle({
        tip: "gorev_tamamla",
        payload: { id: gorev.id, durum: "tamamlandi", kanitFoto: fotoOnizleme, tamamlanmaZamani: new Date().toISOString() }
      });

      if (cevrimici) {
        const sonuc = await kuyruguSenkronEt();
        if (sonuc.basarili > 0) setTamamlandi(true);
        else setKuyrugaAlindi(true);
      } else {
        setKuyrugaAlindi(true);
      }
    } finally {
      setGonderiliyor(false);
    }
  }

  const gosterilenDurum = tamamlandi ? "tamamlandi" : gorev.durum;

  return (
    <div className="space-y-4">
      <Kart stripRengi={stripRengi(gosterilenDurum)}>
        <div className="flex items-start justify-between gap-2 mb-2">
          <h2 className="font-semibold">{gorev.baslik}</h2>
          <DurumRozeti durum={gosterilenDurum} />
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{gorev.aciklama}</p>
        <div className="mt-3 pt-3 border-t border-line text-xs text-gray-500 space-y-1">
          <p>Mağaza: <span className="text-ink font-medium">{gorev.magazaAdi}</span></p>
          <p>Son tarih: <span className="text-ink font-medium">{gorev.sonTarih}</span></p>
          <p>Öncelik: <span className="text-ink font-medium capitalize">{gorev.oncelik}</span></p>
        </div>
      </Kart>

      {gosterilenDurum !== "tamamlandi" && (
        <Kart>
          <p className="text-sm font-medium mb-3">Görsel kanıt</p>
          {fotoOnizleme ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fotoOnizleme} alt="Kanıt fotoğrafı" className="w-full rounded-xl mb-3 object-cover max-h-64" />
          ) : (
            <div className="w-full h-32 rounded-xl bg-canvas border border-dashed border-line flex items-center justify-center text-sm text-gray-400 mb-3">
              Henüz fotoğraf yok
            </div>
          )}
          <input
            ref={dosyaInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={fotoSecildi}
          />
          <Buton varyant="ikincil" tamGenislik onClick={() => dosyaInputRef.current?.click()}>
            📷 Fotoğraf Çek
          </Buton>
        </Kart>
      )}

      {kuyrugaAlindi && (
        <Kart stripRengi="#6B7280">
          <p className="text-sm font-medium">Kaydedildi, senkron bekleniyor</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {cevrimici
              ? "Sunucuya ulaşılamadı, bağlantı geri geldiğinde otomatik gönderilecek."
              : "Çevrimdışısın, bağlantı geldiğinde otomatik gönderilecek."}
          </p>
        </Kart>
      )}

      {tamamlandi && (
        <Kart stripRengi="#0F7A4C">
          <p className="text-sm font-medium">Görev tamamlandı ve gönderildi</p>
        </Kart>
      )}

      {gosterilenDurum !== "tamamlandi" && !kuyrugaAlindi && (
        <Buton tamGenislik onClick={tamamla} disabled={gonderiliyor}>
          {gonderiliyor ? "Gönderiliyor…" : "Tamamla"}
        </Buton>
      )}
    </div>
  );
}
