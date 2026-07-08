"use client";

import { useRef, useState } from "react";
import {
  nebimStokAyristir,
  satirlariUrunlereGrupla,
  urunKoduBelgeId,
  type GruplanmisUrun
} from "@/lib/htmlStokParse";
import { kuyrugaEkle } from "@/lib/outbox";
import { kuyruguSenkronEt } from "@/lib/senkron";
import { useCevrimici } from "@/lib/useCevrimici";
import { firebaseYapilandirildi } from "@/lib/firebaseClient";
import Kart from "@/components/ui/Kart";
import Buton from "@/components/ui/Buton";
import AdminKorumasi from "@/components/AdminKorumasi";

export default function StokYukleSayfasi() {
  return (
    <AdminKorumasi>
      <StokYukleIcerik />
    </AdminKorumasi>
  );
}

function StokYukleIcerik() {
  const cevrimici = useCevrimici();
  // Not: HTML metnini React state'inde tutmuyoruz (bazı Nebim raporları 10+ MB olabiliyor,
  // her tuş vuruşunda/renderda bu kadar büyük bir stringi state'te tutmak tarayıcıyı yavaşlatır).
  // Sadece ayrıştırma sonucu (ürün listesi) state'te tutuluyor.
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dosyaInputRef = useRef<HTMLInputElement>(null);

  const [urunler, setUrunler] = useState<GruplanmisUrun[]>([]);
  const [toplamSatir, setToplamSatir] = useState(0);
  const [hata, setHata] = useState<string | null>(null);
  const [dosyaOkunuyor, setDosyaOkunuyor] = useState(false);
  const [aktariliyor, setAktariliyor] = useState(false);
  const [ilerleme, setIlerleme] = useState({ yapilan: 0, toplam: 0 });
  const [durumMesaji, setDurumMesaji] = useState<string | null>(null);

  function htmlIsle(html: string) {
    setHata(null);
    setDurumMesaji(null);
    const satirlar = nebimStokAyristir(html);
    if (satirlar.length === 0) {
      setHata(
        "Ayrıştırılabilir veri satırı bulunamadı. Nebim V3'ten aldığın HTML raporunun tamamını seçtiğinden/yapıştırdığından emin ol."
      );
      setUrunler([]);
      return;
    }
    setToplamSatir(satirlar.length);
    setUrunler(satirlariUrunlereGrupla(satirlar));
  }

  function dosyaSecildi(e: React.ChangeEvent<HTMLInputElement>) {
    const dosya = e.target.files?.[0];
    if (!dosya) return;
    setDosyaOkunuyor(true);
    const okuyucu = new FileReader();
    okuyucu.onload = () => {
      htmlIsle((okuyucu.result as string) || "");
      setDosyaOkunuyor(false);
    };
    okuyucu.onerror = () => {
      setHata("Dosya okunamadı.");
      setDosyaOkunuyor(false);
    };
    okuyucu.readAsText(dosya, "utf-8");
  }

  function textareaOnizle() {
    htmlIsle(textareaRef.current?.value || "");
  }

  async function iceAktar() {
    if (urunler.length === 0) return;
    setAktariliyor(true);
    setDurumMesaji(null);
    setIlerleme({ yapilan: 0, toplam: urunler.length });
    try {
      const tarih = new Date().toISOString().slice(0, 10);
      let i = 0;
      for (const urun of urunler) {
        await kuyrugaEkle({
          tip: "stok_urun_ice_aktar",
          payload: {
            id: urunKoduBelgeId(urun.kod),
            urunKodu: urun.kod,
            urunAdi: urun.ad,
            varyantlar: urun.varyantlar,
            guncellemeTarihi: tarih
          }
        });
        i += 1;
        if (i % 20 === 0 || i === urunler.length) setIlerleme({ yapilan: i, toplam: urunler.length });
      }

      if (cevrimici) {
        const sonuc = await kuyruguSenkronEt();
        setDurumMesaji(
          sonuc.basarili > 0
            ? `${sonuc.basarili} ürün içe aktarıldı.`
            : `${urunler.length} ürün kaydedildi, senkron bekleniyor.`
        );
      } else {
        setDurumMesaji(`Çevrimdışısın: ${urunler.length} ürün kaydedildi, bağlantı gelince gönderilecek.`);
      }
      setUrunler([]);
      setToplamSatir(0);
      if (textareaRef.current) textareaRef.current.value = "";
      if (dosyaInputRef.current) dosyaInputRef.current.value = "";
    } finally {
      setAktariliyor(false);
    }
  }

  const toplamAdet = urunler.reduce((t, u) => t + u.varyantlar.reduce((a, v) => a + v.adet, 0), 0);

  return (
    <div className="space-y-4">
      {!firebaseYapilandirildi && (
        <Kart stripRengi="#B4740E">
          <p className="text-sm">
            Demo modu: Firebase bağlı değil, içe aktarma denemesi kuyrukta kalır. Önizleme yine de çalışır.
          </p>
        </Kart>
      )}

      <Kart>
        <p className="text-sm font-medium mb-2">Nebim V3 Rapor Dosyası (önerilen)</p>
        <p className="text-xs text-gray-500 mb-3">
          Nebim'den "HTML olarak kaydet" ile aldığın raporu doğrudan seç — büyük dosyalarda
          (birkaç MB) bu, yapıştırmaktan çok daha hızlı ve güvenilirdir.
        </p>
        <input
          ref={dosyaInputRef}
          type="file"
          accept=".html,.htm,text/html"
          onChange={dosyaSecildi}
          className="text-sm w-full"
        />
        {dosyaOkunuyor && <p className="text-xs text-gray-500 mt-2">Dosya okunuyor…</p>}
      </Kart>

      <Kart>
        <p className="text-sm font-medium mb-2">Veya HTML Kaynağı Yapıştır</p>
        <p className="text-xs text-gray-500 mb-3">Küçük/kısa bir rapor parçası için kullanışlıdır.</p>
        <textarea
          ref={textareaRef}
          rows={6}
          placeholder="<table>...</table>"
          className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-xs font-mono"
        />
        <Buton varyant="ikincil" tamGenislik className="mt-3" onClick={textareaOnizle}>
          Önizle
        </Buton>
      </Kart>

      {hata && (
        <Kart stripRengi="#C4341E">
          <p className="text-sm text-signal-late">{hata}</p>
        </Kart>
      )}

      {urunler.length > 0 && (
        <>
          <Kart>
            <p className="text-sm font-medium">
              {urunler.length} ürün · {toplamSatir} varyant satırı · {toplamAdet} adet toplam
            </p>
          </Kart>

          <Kart className="overflow-x-auto">
            <p className="text-sm font-medium mb-3">Önizleme (ilk 15 ürün)</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-line text-left text-gray-500">
                  <th className="pb-2 pr-3">Kod</th>
                  <th className="pb-2 pr-3">Ad</th>
                  <th className="pb-2 pr-3">Varyant</th>
                  <th className="pb-2">Toplam Adet</th>
                </tr>
              </thead>
              <tbody>
                {urunler.slice(0, 15).map((u) => (
                  <tr key={u.kod} className="border-b border-line last:border-0">
                    <td className="py-1.5 pr-3 font-mono">{u.kod}</td>
                    <td className="py-1.5 pr-3">{u.ad}</td>
                    <td className="py-1.5 pr-3">{u.varyantlar.length}</td>
                    <td className="py-1.5">{u.varyantlar.reduce((a, v) => a + v.adet, 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Kart>

          {durumMesaji && (
            <Kart stripRengi="#0F7A4C">
              <p className="text-sm">{durumMesaji}</p>
            </Kart>
          )}

          {aktariliyor && ilerleme.toplam > 0 && (
            <Kart>
              <p className="text-sm">
                İçe aktarılıyor… {ilerleme.yapilan}/{ilerleme.toplam}
              </p>
            </Kart>
          )}

          <Buton tamGenislik onClick={iceAktar} disabled={aktariliyor}>
            {aktariliyor ? "İçe aktarılıyor…" : `${urunler.length} Ürünü İçe Aktar`}
          </Buton>
        </>
      )}
    </div>
  );
}
