"use client";

import { useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MOCK_STOK_URUNLERI } from "@/data/mockData";
import { kuyrugaEkle } from "@/lib/outbox";
import { kuyruguSenkronEt } from "@/lib/senkron";
import { useCevrimici } from "@/lib/useCevrimici";
import Kart from "@/components/ui/Kart";
import Buton from "@/components/ui/Buton";

export default function StokDetaySayfasi() {
  return (
    <Suspense fallback={null}>
      <StokDetayIcerik />
    </Suspense>
  );
}

function StokDetayIcerik() {
  const params = useSearchParams();
  const router = useRouter();
  const cevrimici = useCevrimici();
  const urun = MOCK_STOK_URUNLERI.find((u) => u.id === params.get("id"));
  const dosyaInputRef = useRef<HTMLInputElement>(null);

  const [gorselOnizleme, setGorselOnizleme] = useState<string | null>(urun?.gorselUrl ?? null);
  const [etiketler, setEtiketler] = useState<string[]>(urun?.etiketler ?? []);
  const [yeniEtiket, setYeniEtiket] = useState("");
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [durumMesaji, setDurumMesaji] = useState<string | null>(null);

  if (!urun) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-gray-500">Ürün bulunamadı.</p>
        <button onClick={() => router.push("/stok")} className="text-brand-500 text-sm mt-2 underline">
          Stok kataloğuna dön
        </button>
      </div>
    );
  }

  function gorselSecildi(e: React.ChangeEvent<HTMLInputElement>) {
    const dosya = e.target.files?.[0];
    if (!dosya) return;
    const okuyucu = new FileReader();
    okuyucu.onload = () => setGorselOnizleme(okuyucu.result as string);
    okuyucu.readAsDataURL(dosya);
  }

  function etiketEkle() {
    const temiz = yeniEtiket.trim().toLowerCase();
    if (!temiz || etiketler.includes(temiz)) return;
    setEtiketler((e) => [...e, temiz]);
    setYeniEtiket("");
  }

  function etiketSil(etiket: string) {
    setEtiketler((e) => e.filter((x) => x !== etiket));
  }

  async function kaydet() {
    if (!urun) return;
    setKaydediliyor(true);
    setDurumMesaji(null);
    try {
      // TODO: gorselOnizleme şu an base64 olarak saklanıyor; Firebase Storage bağlanınca
      // burada önce Storage'a yükleyip dönen URL'i payload'a koymalısın (Firestore belge
      // boyutu ~1MB ile sınırlı, çok sayıda/yüksek çözünürlüklü görselde bu sınıra takılır).
      await kuyrugaEkle({
        tip: "stok_urun_guncelle",
        payload: { id: urun.id, gorselUrl: gorselOnizleme, etiketler }
      });
      if (cevrimici) {
        const sonuc = await kuyruguSenkronEt();
        setDurumMesaji(sonuc.basarili > 0 ? "Kaydedildi." : "Kaydedildi, senkron bekleniyor.");
      } else {
        setDurumMesaji("Çevrimdışısın: kaydedildi, bağlantı gelince gönderilecek.");
      }
    } finally {
      setKaydediliyor(false);
    }
  }

  return (
    <div className="space-y-4">
      <Kart>
        <p className="font-semibold text-sm">{urun.urunAdi}</p>
        <p className="text-xs text-gray-500 font-mono mt-0.5">{urun.urunKodu}</p>
        <p className="text-sm font-semibold mt-2">{urun.adet} adet stokta</p>
      </Kart>

      <Kart>
        <p className="text-sm font-medium mb-3">Ürün Görseli</p>
        {gorselOnizleme ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={gorselOnizleme} alt={urun.urunAdi} className="w-full rounded-xl mb-3 object-cover max-h-64" />
        ) : (
          <div className="w-full h-32 rounded-xl bg-canvas border border-dashed border-line flex items-center justify-center text-sm text-gray-400 mb-3">
            Henüz görsel yok
          </div>
        )}
        <input
          ref={dosyaInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={gorselSecildi}
        />
        <Buton varyant="ikincil" tamGenislik onClick={() => dosyaInputRef.current?.click()}>
          📷 Görsel Ekle / Değiştir
        </Buton>
      </Kart>

      <Kart>
        <p className="text-sm font-medium mb-3">Etiketler</p>
        {etiketler.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {etiketler.map((e) => (
              <span key={e} className="inline-flex items-center gap-1.5 text-xs bg-canvas text-gray-700 rounded-full pl-2.5 pr-1.5 py-1">
                {e}
                <button onClick={() => etiketSil(e)} className="text-gray-400 hover:text-signal-late" aria-label={`${e} etiketini sil`}>
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            value={yeniEtiket}
            onChange={(ev) => setYeniEtiket(ev.target.value)}
            onKeyDown={(ev) => ev.key === "Enter" && (ev.preventDefault(), etiketEkle())}
            placeholder="Yeni etiket (ör. yeni sezon)"
            className="focus-ring flex-1 rounded-xl border border-line px-3.5 py-2.5 text-sm"
          />
          <Buton varyant="ikincil" type="button" onClick={etiketEkle}>
            Ekle
          </Buton>
        </div>
      </Kart>

      {durumMesaji && (
        <Kart stripRengi="#0F7A4C">
          <p className="text-sm">{durumMesaji}</p>
        </Kart>
      )}

      <Buton tamGenislik onClick={kaydet} disabled={kaydediliyor}>
        {kaydediliyor ? "Kaydediliyor…" : "Kaydet"}
      </Buton>
    </div>
  );
}
