"use client";

import { useState } from "react";
import { htmlTabloAyristir, sutunTahminEt, urunKoduBelgeId, type AyristirilmisTablo } from "@/lib/htmlStokParse";
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
  const [htmlMetni, setHtmlMetni] = useState("");
  const [tablo, setTablo] = useState<AyristirilmisTablo | null>(null);
  const [kodSutunu, setKodSutunu] = useState(-1);
  const [adSutunu, setAdSutunu] = useState(-1);
  const [adetSutunu, setAdetSutunu] = useState(-1);
  const [hata, setHata] = useState<string | null>(null);
  const [aktariliyor, setAktariliyor] = useState(false);
  const [durumMesaji, setDurumMesaji] = useState<string | null>(null);

  function onizle() {
    setHata(null);
    setDurumMesaji(null);
    const sonuc = htmlTabloAyristir(htmlMetni);
    if (!sonuc) {
      setHata("Yapıştırılan içerikte bir <table> bulunamadı. Nebim/ERP'den kopyaladığın HTML kaynağının tamamını yapıştırdığından emin ol.");
      setTablo(null);
      return;
    }
    const tahmin = sutunTahminEt(sonuc.basliklar);
    setKodSutunu(tahmin.kod);
    setAdSutunu(tahmin.ad);
    setAdetSutunu(tahmin.adet);
    setTablo(sonuc);
  }

  async function iceAktar() {
    if (!tablo || kodSutunu < 0) return;
    setAktariliyor(true);
    setDurumMesaji(null);
    try {
      const tarih = new Date().toISOString().slice(0, 10);
      let gecerliSatir = 0;
      for (const satir of tablo.satirlar) {
        const kod = satir[kodSutunu]?.trim();
        if (!kod) continue;
        const ad = adSutunu >= 0 ? satir[adSutunu]?.trim() || kod : kod;
        const adetHam = adetSutunu >= 0 ? satir[adetSutunu] : "0";
        const adet = Number((adetHam || "0").replace(/[^\d.-]/g, "")) || 0;

        await kuyrugaEkle({
          tip: "stok_urun_ice_aktar",
          payload: {
            id: urunKoduBelgeId(kod),
            urunKodu: kod,
            urunAdi: ad,
            adet,
            guncellemeTarihi: tarih
          }
        });
        gecerliSatir += 1;
      }

      if (cevrimici) {
        const sonuc = await kuyruguSenkronEt();
        setDurumMesaji(
          sonuc.basarili > 0
            ? `${sonuc.basarili} ürün içe aktarıldı.`
            : `${gecerliSatir} ürün kaydedildi, senkron bekleniyor.`
        );
      } else {
        setDurumMesaji(`Çevrimdışısın: ${gecerliSatir} ürün kaydedildi, bağlantı gelince gönderilecek.`);
      }
      setHtmlMetni("");
      setTablo(null);
    } finally {
      setAktariliyor(false);
    }
  }

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
        <p className="text-sm font-medium mb-2">HTML Kaynağı Yapıştır</p>
        <p className="text-xs text-gray-500 mb-3">
          Nebim/ERP'den aldığın stok raporunun HTML kaynağını (bir &lt;table&gt; içermeli) buraya olduğu gibi yapıştır.
        </p>
        <textarea
          value={htmlMetni}
          onChange={(e) => setHtmlMetni(e.target.value)}
          rows={8}
          placeholder="<table>...</table>"
          className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-xs font-mono"
        />
        <Buton varyant="ikincil" tamGenislik className="mt-3" onClick={onizle} disabled={!htmlMetni.trim()}>
          Önizle
        </Buton>
      </Kart>

      {hata && (
        <Kart stripRengi="#C4341E">
          <p className="text-sm text-signal-late">{hata}</p>
        </Kart>
      )}

      {tablo && (
        <>
          <Kart>
            <p className="text-sm font-medium mb-3">Sütun Eşleme ({tablo.satirlar.length} satır bulundu)</p>
            <div className="space-y-3">
              <SutunSecici etiket="Ürün Kodu sütunu" basliklar={tablo.basliklar} deger={kodSutunu} onDegisim={setKodSutunu} />
              <SutunSecici etiket="Ürün Adı sütunu" basliklar={tablo.basliklar} deger={adSutunu} onDegisim={setAdSutunu} />
              <SutunSecici etiket="Adet sütunu" basliklar={tablo.basliklar} deger={adetSutunu} onDegisim={setAdetSutunu} />
            </div>
            {kodSutunu < 0 && (
              <p className="text-xs text-signal-late mt-2">Devam etmek için en azından Ürün Kodu sütununu seçmelisin.</p>
            )}
          </Kart>

          <Kart className="overflow-x-auto">
            <p className="text-sm font-medium mb-3">Önizleme (ilk 8 satır)</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-line text-left text-gray-500">
                  <th className="pb-2 pr-3">Kod</th>
                  <th className="pb-2 pr-3">Ad</th>
                  <th className="pb-2">Adet</th>
                </tr>
              </thead>
              <tbody>
                {tablo.satirlar.slice(0, 8).map((satir, i) => (
                  <tr key={i} className="border-b border-line last:border-0">
                    <td className="py-1.5 pr-3 font-mono">{kodSutunu >= 0 ? satir[kodSutunu] : "—"}</td>
                    <td className="py-1.5 pr-3">{adSutunu >= 0 ? satir[adSutunu] : "—"}</td>
                    <td className="py-1.5">{adetSutunu >= 0 ? satir[adetSutunu] : "—"}</td>
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

          <Buton tamGenislik onClick={iceAktar} disabled={aktariliyor || kodSutunu < 0}>
            {aktariliyor ? "İçe aktarılıyor…" : `${tablo.satirlar.length} Ürünü İçe Aktar`}
          </Buton>
        </>
      )}
    </div>
  );
}

function SutunSecici({
  etiket,
  basliklar,
  deger,
  onDegisim
}: {
  etiket: string;
  basliklar: string[];
  deger: number;
  onDegisim: (v: number) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5 text-gray-600">{etiket}</label>
      <select
        value={deger}
        onChange={(e) => onDegisim(Number(e.target.value))}
        className="focus-ring w-full rounded-xl border border-line px-3.5 py-2 text-sm bg-surface"
      >
        <option value={-1}>— Seçilmedi —</option>
        {basliklar.map((b, i) => (
          <option key={i} value={i}>
            {b || `(sütun ${i + 1})`}
          </option>
        ))}
      </select>
    </div>
  );
}
