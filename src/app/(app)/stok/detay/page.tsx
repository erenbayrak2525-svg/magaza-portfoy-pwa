"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useFirestoreBelge, belgeSil } from "@/lib/firestoreOkuma";
import { firebaseYapilandirildi } from "@/lib/firebaseClient";
import { MOCK_STOK_URUNLERI } from "@/data/mockData";
import { stokToplamAdet, type StokUrunu, type StokVaryanti } from "@/types";
import { kuyrugaEkle } from "@/lib/outbox";
import { kuyruguSenkronEt } from "@/lib/senkron";
import { useCevrimici } from "@/lib/useCevrimici";
import { gorselSikistir } from "@/lib/gorselSikistir";
import { stokPivotOlustur } from "@/lib/stokPivot";
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
  const id = params.get("id");

  const { veri: canliUrun, yukleniyor } = useFirestoreBelge<StokUrunu>("stok_urunleri", id);
  const urun = firebaseYapilandirildi ? canliUrun : MOCK_STOK_URUNLERI.find((u) => u.id === id) ?? null;

  const dosyaInputRef = useRef<HTMLInputElement>(null);

  const [gorselOnizleme, setGorselOnizleme] = useState<string | null>(null);
  const [etiketler, setEtiketler] = useState<string[]>([]);
  const [urunAdiDuzenle, setUrunAdiDuzenle] = useState("");
  const [urunKoduDuzenle, setUrunKoduDuzenle] = useState("");
  const [fiyatDuzenle, setFiyatDuzenle] = useState("");
  const [varyantlarDuzenle, setVaryantlarDuzenle] = useState<StokVaryanti[]>([]);
  const [duzenleModu, setDuzenleModu] = useState(false);
  const [ilkYuklemeYapildi, setIlkYuklemeYapildi] = useState(false);
  const [yeniEtiket, setYeniEtiket] = useState("");
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [siliniyor, setSiliniyor] = useState(false);
  const [durumMesaji, setDurumMesaji] = useState<string | null>(null);

  // Firestore'dan veri geldiğinde formu bir kez doldur; sonraki canlı güncellemeler
  // kullanıcının o an düzenlediği alanları ezmesin diye tekrar doldurmuyoruz.
  useEffect(() => {
    if (urun && !ilkYuklemeYapildi) {
      setGorselOnizleme(urun.gorselUrl ?? null);
      setEtiketler(urun.etiketler ?? []);
      setUrunAdiDuzenle(urun.urunAdi ?? "");
      setUrunKoduDuzenle(urun.urunKodu ?? "");
      setFiyatDuzenle(urun.fiyat != null ? String(urun.fiyat) : "");
      setVaryantlarDuzenle(urun.varyantlar ?? []);
      setIlkYuklemeYapildi(true);
    }
  }, [urun, ilkYuklemeYapildi]);

  if (yukleniyor) {
    return <p className="text-sm text-gray-500 text-center py-16">Yükleniyor…</p>;
  }

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
    gorselSikistir(dosya)
      .then(setGorselOnizleme)
      .catch(() => setDurumMesaji("Görsel işlenemedi, farklı bir dosya dene."));
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

  function varyantGuncelle(index: number, alan: keyof StokVaryanti, deger: string) {
    setVaryantlarDuzenle((liste) =>
      liste.map((v, i) => (i === index ? { ...v, [alan]: alan === "adet" ? Number(deger) || 0 : deger } : v))
    );
  }

  function varyantSil(index: number) {
    setVaryantlarDuzenle((liste) => liste.filter((_, i) => i !== index));
  }

  function varyantEkle() {
    setVaryantlarDuzenle((liste) => [...liste, { renk: "", beden: "", adet: 0 }]);
  }

  async function kaydet() {
    if (!urun) return;
    setKaydediliyor(true);
    setDurumMesaji(null);
    try {
      // TODO: gorselOnizleme şu an base64 (sıkıştırılmış) olarak saklanıyor; Firebase
      // Storage bağlanınca burada önce Storage'a yükleyip dönen URL'i payload'a koymak
      // daha doğru olur (Firestore belge boyutu ~1MB ile sınırlı).
      await kuyrugaEkle({
        tip: "stok_urun_guncelle",
        payload: {
          id: urun.id,
          gorselUrl: gorselOnizleme,
          etiketler,
          urunAdi: urunAdiDuzenle,
          urunKodu: urunKoduDuzenle,
          fiyat: fiyatDuzenle ? Number(fiyatDuzenle) : null,
          varyantlar: varyantlarDuzenle
        }
      });
      if (cevrimici) {
        const sonuc = await kuyruguSenkronEt();
        setDurumMesaji(sonuc.basarili > 0 ? "Kaydedildi." : "Kaydedildi, senkron bekleniyor.");
      } else {
        setDurumMesaji("Çevrimdışısın: kaydedildi, bağlantı gelince gönderilecek.");
      }
      setDuzenleModu(false);
    } finally {
      setKaydediliyor(false);
    }
  }

  async function urunuSil() {
    if (!urun) return;
    if (!confirm(`"${urun.urunAdi || urun.urunKodu}" ürününü silmek istediğine emin misin? Bu işlem geri alınamaz.`)) return;
    setSiliniyor(true);
    try {
      await belgeSil("stok_urunleri", urun.id);
      router.push("/stok");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Silinemedi");
      setSiliniyor(false);
    }
  }

  return (
    <div className="space-y-4">
      <Kart>
        <div className="flex items-start justify-between gap-2 mb-1">
          {duzenleModu ? (
            <div className="flex-1 space-y-2">
              <input
                value={urunAdiDuzenle}
                onChange={(e) => setUrunAdiDuzenle(e.target.value)}
                placeholder="Ürün adı"
                className="focus-ring w-full rounded-lg border border-line px-2.5 py-1.5 text-sm font-semibold"
              />
              <input
                value={urunKoduDuzenle}
                onChange={(e) => setUrunKoduDuzenle(e.target.value)}
                placeholder="Ürün kodu"
                className="focus-ring w-full rounded-lg border border-line px-2.5 py-1.5 text-xs font-mono"
              />
              <input
                type="number"
                inputMode="decimal"
                value={fiyatDuzenle}
                onChange={(e) => setFiyatDuzenle(e.target.value)}
                placeholder="Fiyat (₺)"
                className="focus-ring w-full rounded-lg border border-line px-2.5 py-1.5 text-xs"
              />
            </div>
          ) : (
            <div>
              <p className="font-semibold text-sm">{urun.urunAdi || "(isimsiz ürün)"}</p>
              <p className="text-xs text-gray-500 font-mono mt-0.5">{urun.urunKodu || "—"}</p>
              {urun.fiyat != null && (
                <p className="text-sm font-semibold text-brand-600 mt-1">
                  {urun.fiyat.toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}
                </p>
              )}
            </div>
          )}
          <button
            onClick={() => setDuzenleModu((v) => !v)}
            className="focus-ring text-xs text-brand-500 font-medium shrink-0"
          >
            {duzenleModu ? "Vazgeç" : "✏️ Düzenle"}
          </button>
        </div>
        <p className="text-sm font-semibold mt-2">
          {stokToplamAdet({ ...urun, varyantlar: duzenleModu ? varyantlarDuzenle : urun.varyantlar })} adet stokta
        </p>
      </Kart>

      <Kart className="overflow-x-auto">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium">Renk / Beden Dağılımı</p>
          {duzenleModu && (
            <button onClick={varyantEkle} className="text-xs text-brand-500 font-medium">+ Varyant Ekle</button>
          )}
        </div>

        {duzenleModu ? (
          <div className="space-y-2">
            {varyantlarDuzenle.map((v, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  value={v.renk}
                  onChange={(e) => varyantGuncelle(i, "renk", e.target.value)}
                  placeholder="Renk"
                  className="focus-ring flex-1 min-w-0 rounded-lg border border-line px-2 py-1.5 text-xs"
                />
                <input
                  value={v.beden}
                  onChange={(e) => varyantGuncelle(i, "beden", e.target.value)}
                  placeholder="Beden"
                  className="focus-ring w-16 shrink-0 rounded-lg border border-line px-2 py-1.5 text-xs"
                />
                <input
                  type="number"
                  value={v.adet}
                  onChange={(e) => varyantGuncelle(i, "adet", e.target.value)}
                  placeholder="Adet"
                  className="focus-ring w-16 shrink-0 rounded-lg border border-line px-2 py-1.5 text-xs"
                />
                <button onClick={() => varyantSil(i)} className="text-signal-late text-xs shrink-0" aria-label="Varyantı sil">
                  🗑️
                </button>
              </div>
            ))}
            {varyantlarDuzenle.length === 0 && (
              <p className="text-xs text-gray-400">Varyant yok. "+ Varyant Ekle" ile ekleyebilirsin.</p>
            )}
          </div>
        ) : (!urun.varyantlar || urun.varyantlar.length === 0) ? (
          <p className="text-sm text-gray-400">Veri yok</p>
        ) : (
          (() => {
            const pivot = stokPivotOlustur(urun.varyantlar);
            return (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-line text-left text-gray-500">
                    <th className="pb-2 pr-3">Beden \ Renk</th>
                    {pivot.renkler.map((renk) => (
                      <th key={renk} className="pb-2 pr-3 text-center">{renk}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pivot.bedenler.map((beden) => (
                    <tr key={beden} className="border-b border-line last:border-0">
                      <td className="py-1.5 pr-3 font-medium">{beden}</td>
                      {pivot.renkler.map((renk) => {
                        const adet = pivot.tablo[beden]?.[renk];
                        return (
                          <td key={renk} className="py-1.5 pr-3 text-center">
                            {adet ? (
                              <span className={adet === 0 ? "text-gray-300" : "text-ink"}>{adet}</span>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })()
        )}
        {!duzenleModu && (
          <p className="text-[11px] text-gray-400 mt-3">
            Genelde Admin'in Stok İçe Aktar (HTML) ile yüklediği Nebim raporundan gelir. Değiştirmek
            için "✏️ Düzenle"ye dokun.
          </p>
        )}
      </Kart>

      <Kart>
        <p className="text-sm font-medium mb-3">Ürün Görseli</p>
        {gorselOnizleme ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={gorselOnizleme} alt={urun.urunAdi ?? ""} className="w-full rounded-xl mb-3 object-cover max-h-64" />
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

      <Buton varyant="tehlike" tamGenislik onClick={urunuSil} disabled={siliniyor}>
        {siliniyor ? "Siliniyor…" : "🗑️ Ürünü Sil"}
      </Buton>
    </div>
  );
}
