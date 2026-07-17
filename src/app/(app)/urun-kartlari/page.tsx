"use client";

import { useRef, useState } from "react";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db, firebaseYapilandirildi } from "@/lib/firebaseClient";
import { useFirestoreListesi } from "@/lib/firestoreOkuma";
import { kuyrugaEkle } from "@/lib/outbox";
import { kuyruguSenkronEt } from "@/lib/senkron";
import { useCevrimici } from "@/lib/useCevrimici";
import { gorselSikistir } from "@/lib/gorselSikistir";
import type { UrunKarti, UrunKartiVaryanti } from "@/types";
import Kart from "@/components/ui/Kart";
import Buton from "@/components/ui/Buton";
import YoneticiKorumasi from "@/components/YoneticiKorumasi";

export default function UrunKartlariSayfasi() {
  return (
    <YoneticiKorumasi>
      <UrunKartlariIcerik />
    </YoneticiKorumasi>
  );
}

// ---- Varyasyon tablosu bileşeni (hem yeni form hem düzenleme için) ----
function VaryasyonTablosu({
  varyantlar,
  onChange
}: {
  varyantlar: UrunKartiVaryanti[];
  onChange: (yeni: UrunKartiVaryanti[]) => void;
}) {
  function satirEkle() {
    onChange([...varyantlar, { renk: "", beden: "", adet: 0 }]);
  }

  function satirGuncelle(i: number, alan: keyof UrunKartiVaryanti, deger: string) {
    onChange(varyantlar.map((v, idx) =>
      idx === i ? { ...v, [alan]: alan === "adet" ? Number(deger) || 0 : deger } : v
    ));
  }

  function satirSil(i: number) {
    onChange(varyantlar.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-medium">Varyasyon Tablosu</label>
        <button type="button" onClick={satirEkle}
          className="text-xs text-brand-500 font-medium focus-ring">
          + Satır Ekle
        </button>
      </div>

      {varyantlar.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-3 border border-dashed border-line rounded-xl">
          Henüz varyasyon yok — "Satır Ekle" ile ekle
        </p>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_1fr_60px_24px] gap-1 text-[10px] text-gray-400 px-1">
            <span>Renk</span><span>Beden</span><span className="text-center">Adet</span><span />
          </div>
          {varyantlar.map((v, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_60px_24px] gap-1 items-center">
              <input value={v.renk} onChange={(e) => satirGuncelle(i, "renk", e.target.value)}
                placeholder="Siyah"
                className="focus-ring rounded-lg border border-line px-2 py-1.5 text-xs min-w-0" />
              <input value={v.beden} onChange={(e) => satirGuncelle(i, "beden", e.target.value)}
                placeholder="38"
                className="focus-ring rounded-lg border border-line px-2 py-1.5 text-xs min-w-0" />
              <input type="number" inputMode="numeric" value={v.adet}
                onChange={(e) => satirGuncelle(i, "adet", e.target.value)}
                className="focus-ring rounded-lg border border-line px-2 py-1.5 text-xs text-center min-w-0" />
              <button type="button" onClick={() => satirSil(i)}
                className="text-gray-400 hover:text-signal-late focus-ring text-sm leading-none">
                ✕
              </button>
            </div>
          ))}
          <div className="flex justify-end text-xs text-gray-500 pr-7 pt-1">
            Toplam: <span className="font-medium ml-1">
              {varyantlar.reduce((t, v) => t + (v.adet ?? 0), 0)} adet
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Salt okunur varyasyon pivot tablosu (liste görünümü) ----
function VaryasyonOzeti({ varyantlar }: { varyantlar: UrunKartiVaryanti[] }) {
  if (!varyantlar || varyantlar.length === 0) return null;

  const renkler = Array.from(new Set(varyantlar.map((v) => v.renk).filter(Boolean)));
  const bedenler = Array.from(new Set(varyantlar.map((v) => v.beden).filter(Boolean)));
  const toplamAdet = varyantlar.reduce((t, v) => t + (v.adet ?? 0), 0);

  if (renkler.length === 0 && bedenler.length === 0) return null;

  // Az varyant varsa düz liste, çok varsa pivot tablo
  if (varyantlar.length <= 4) {
    return (
      <div className="mt-2 pt-2 border-t border-line">
        <div className="flex flex-wrap gap-1.5">
          {varyantlar.map((v, i) => (
            <span key={i} className="text-[10px] bg-canvas border border-line rounded-full px-2 py-0.5">
              {v.renk && <span>{v.renk}</span>}
              {v.renk && v.beden && <span className="text-gray-400"> / </span>}
              {v.beden && <span>{v.beden}</span>}
              <span className="font-medium ml-1">{v.adet}</span>
            </span>
          ))}
        </div>
        <p className="text-[10px] text-gray-400 mt-1">Toplam: {toplamAdet} adet</p>
      </div>
    );
  }

  // Pivot tablo: sütun=renk, satır=beden
  const tablo: Record<string, Record<string, number>> = {};
  for (const v of varyantlar) {
    if (!tablo[v.beden]) tablo[v.beden] = {};
    tablo[v.beden][v.renk] = (tablo[v.beden][v.renk] ?? 0) + (v.adet ?? 0);
  }

  return (
    <div className="mt-2 pt-2 border-t border-line overflow-x-auto">
      <table className="w-full text-[10px]">
        <thead>
          <tr className="text-gray-400">
            <th className="pb-1 pr-2 text-left font-normal">Beden</th>
            {renkler.map((r) => <th key={r} className="pb-1 pr-2 font-normal text-center">{r}</th>)}
          </tr>
        </thead>
        <tbody>
          {bedenler.map((b) => (
            <tr key={b} className="border-t border-line/50">
              <td className="py-1 pr-2 font-medium">{b}</td>
              {renkler.map((r) => (
                <td key={r} className="py-1 pr-2 text-center">
                  {tablo[b]?.[r] ?? <span className="text-gray-300">—</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[10px] text-gray-400 mt-1">Toplam: {toplamAdet} adet</p>
    </div>
  );
}

// ---- Boş varyant listesi ----
const BOSLUK: UrunKartiVaryanti[] = [];

// ---- Ana içerik ----
function UrunKartlariIcerik() {
  const cevrimici = useCevrimici();
  const { veri: kartlar, yukleniyor, yenile } = useFirestoreListesi<UrunKarti>("urun_kartlari");

  // Yeni kart formu
  const [formAcik, setFormAcik] = useState(false);
  const [urunKodu, setUrunKodu] = useState("");
  const [urunAdi, setUrunAdi] = useState("");
  const [renk, setRenk] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [gelisTarihi, setGelisTarihi] = useState("");
  const [bitisTarihi, setBitisTarihi] = useState("");
  const [yeniGorsel, setYeniGorsel] = useState<string | null>(null);
  const [yeniVaryantlar, setYeniVaryantlar] = useState<UrunKartiVaryanti[]>(BOSLUK);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [durumMesaji, setDurumMesaji] = useState<string | null>(null);
  const yeniGorselRef = useRef<HTMLInputElement>(null);

  // Düzenleme durumu
  const [duzenlenenId, setDuzenlenenId] = useState<string | null>(null);
  const [duzAd, setDuzAd] = useState("");
  const [duzKod, setDuzKod] = useState("");
  const [duzRenk, setDuzRenk] = useState("");
  const [duzAciklama, setDuzAciklama] = useState("");
  const [duzGelis, setDuzGelis] = useState("");
  const [duzBitis, setDuzBitis] = useState("");
  const [duzGorsel, setDuzGorsel] = useState<string | null>(null);
  const [duzVaryantlar, setDuzVaryantlar] = useState<UrunKartiVaryanti[]>(BOSLUK);
  const [duzKaydediliyor, setDuzKaydediliyor] = useState(false);
  const [siliniyorId, setSiliniyorId] = useState<string | null>(null);
  const duzGorselRef = useRef<HTMLInputElement>(null);

  const [arama, setArama] = useState("");

  function gorselSec(e: React.ChangeEvent<HTMLInputElement>, onSonuc: (url: string) => void) {
    const dosya = e.target.files?.[0];
    if (!dosya) return;
    gorselSikistir(dosya).then(onSonuc).catch(() => alert("Görsel işlenemedi."));
  }

  const siraliKartlar = [...kartlar]
    .sort((a, b) => (a.olusturmaTarihi < b.olusturmaTarihi ? 1 : -1))
    .filter((k) => {
      const q = arama.trim().toLowerCase();
      if (!q) return true;
      return (
        (k.urunAdi ?? "").toLowerCase().includes(q) ||
        (k.urunKodu ?? "").toLowerCase().includes(q) ||
        (k.renk ?? "").toLowerCase().includes(q) ||
        (k.aciklama ?? "").toLowerCase().includes(q)
      );
    });

  async function kartEkle(e: React.FormEvent) {
    e.preventDefault();
    setGonderiliyor(true);
    setDurumMesaji(null);
    try {
      const toplamAdet = yeniVaryantlar.reduce((t, v) => t + (v.adet ?? 0), 0);
      await kuyrugaEkle({
        tip: "urun_karti_ekle",
        payload: {
          urunKodu: urunKodu.trim(),
          urunAdi: urunAdi.trim(),
          renk: renk.trim() || null,
          stokAdedi: toplamAdet > 0 ? toplamAdet : null,
          varyantlar: yeniVaryantlar.length > 0 ? yeniVaryantlar : null,
          aciklama: aciklama.trim() || null,
          gelisTarihi: gelisTarihi || null,
          bitisTarihi: bitisTarihi || null,
          gorselUrl: yeniGorsel || null,
          olusturmaTarihi: new Date().toISOString()
        }
      });
      if (cevrimici) {
        const sonuc = await kuyruguSenkronEt();
        setDurumMesaji(sonuc.basarili > 0 ? "Kart eklendi." : "Kaydedildi, senkron bekleniyor.");
        if (sonuc.basarili > 0) yenile();
      } else {
        setDurumMesaji("Çevrimdışısın: kaydedildi, bağlantı gelince gönderilecek.");
      }
      setUrunKodu(""); setUrunAdi(""); setRenk("");
      setAciklama(""); setGelisTarihi(""); setBitisTarihi("");
      setYeniGorsel(null); setYeniVaryantlar(BOSLUK);
      setFormAcik(false);
    } finally {
      setGonderiliyor(false);
    }
  }

  function duzenlemeyeBasla(k: UrunKarti) {
    setDuzenlenenId(k.id);
    setDuzAd(k.urunAdi ?? "");
    setDuzKod(k.urunKodu ?? "");
    setDuzRenk(k.renk ?? "");
    setDuzAciklama(k.aciklama ?? "");
    setDuzGelis(k.gelisTarihi ?? "");
    setDuzBitis(k.bitisTarihi ?? "");
    setDuzGorsel(k.gorselUrl ?? null);
    setDuzVaryantlar(k.varyantlar ? [...k.varyantlar] : BOSLUK);
  }

  async function duzenlemeyiKaydet() {
    if (!duzenlenenId || !firebaseYapilandirildi) return;
    setDuzKaydediliyor(true);
    const toplamAdet = duzVaryantlar.reduce((t, v) => t + (v.adet ?? 0), 0);
    try {
      await updateDoc(doc(db, "urun_kartlari", duzenlenenId), {
        urunAdi: duzAd.trim(),
        urunKodu: duzKod.trim(),
        renk: duzRenk.trim() || null,
        stokAdedi: toplamAdet > 0 ? toplamAdet : null,
        varyantlar: duzVaryantlar.length > 0 ? duzVaryantlar : null,
        aciklama: duzAciklama.trim() || null,
        gelisTarihi: duzGelis || null,
        bitisTarihi: duzBitis || null,
        gorselUrl: duzGorsel || null
      });
      setDuzenlenenId(null);
      yenile();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Düzenlenemedi");
    } finally {
      setDuzKaydediliyor(false);
    }
  }

  async function kartSil(id: string) {
    if (!confirm("Bu kartı silmek istediğine emin misin?")) return;
    if (!firebaseYapilandirildi) return;
    setSiliniyorId(id);
    try {
      await deleteDoc(doc(db, "urun_kartlari", id));
      yenile();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Silinemedi");
    } finally {
      setSiliniyorId(null);
    }
  }

  return (
    <div className="space-y-4">
      <Buton varyant={formAcik ? "ikincil" : "birincil"} tamGenislik onClick={() => setFormAcik((v) => !v)}>
        {formAcik ? "Vazgeç" : "+ Yeni Ürün Kartı"}
      </Buton>

      {/* ---- FORM ---- */}
      {formAcik && (
        <form onSubmit={kartEkle}>
          <Kart>
            <p className="text-sm font-medium mb-3">Yeni Ürün Kartı</p>
            <div className="space-y-3">
              {/* Görsel */}
              <div>
                <label className="block text-xs font-medium mb-1">Görsel</label>
                {yeniGorsel ? (
                  <div className="relative w-full mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={yeniGorsel} alt="Önizleme" className="w-full max-h-48 object-cover rounded-xl" />
                    <button type="button" onClick={() => setYeniGorsel(null)}
                      className="absolute top-2 right-2 bg-signal-lateBg text-signal-late text-xs rounded-full px-2 py-1">
                      Kaldır
                    </button>
                  </div>
                ) : (
                  <div onClick={() => yeniGorselRef.current?.click()}
                    className="w-full h-24 rounded-xl bg-canvas border border-dashed border-line flex items-center justify-center text-sm text-gray-400 cursor-pointer hover:bg-gray-50 mb-2">
                    📷 Görsel Ekle
                  </div>
                )}
                <input ref={yeniGorselRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => gorselSec(e, setYeniGorsel)} />
              </div>

              {/* Temel bilgiler */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-1">Ürün Kodu *</label>
                  <input value={urunKodu} onChange={(e) => setUrunKodu(e.target.value)} required
                    placeholder="24K31942"
                    className="focus-ring w-full rounded-xl border border-line px-3 py-2 text-sm font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Genel Renk</label>
                  <input value={renk} onChange={(e) => setRenk(e.target.value)}
                    placeholder="Çok renkli"
                    className="focus-ring w-full rounded-xl border border-line px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Ürün Adı *</label>
                <input value={urunAdi} onChange={(e) => setUrunAdi(e.target.value)} required
                  placeholder="Midi Elbise"
                  className="focus-ring w-full rounded-xl border border-line px-3 py-2 text-sm" />
              </div>

              {/* Varyasyon tablosu */}
              <VaryasyonTablosu varyantlar={yeniVaryantlar} onChange={setYeniVaryantlar} />

              {/* Açıklama */}
              <div>
                <label className="block text-xs font-medium mb-1">Açıklama</label>
                <textarea value={aciklama} onChange={(e) => setAciklama(e.target.value)}
                  rows={3} placeholder="Sezon sonu, iade edildi, vs."
                  className="focus-ring w-full rounded-xl border border-line px-3 py-2 text-sm" />
              </div>

              {/* Tarihler */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-1">Geliş Tarihi</label>
                  <input type="date" value={gelisTarihi} onChange={(e) => setGelisTarihi(e.target.value)}
                    className="focus-ring w-full rounded-xl border border-line px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Bitiş Tarihi</label>
                  <input type="date" value={bitisTarihi} onChange={(e) => setBitisTarihi(e.target.value)}
                    className="focus-ring w-full rounded-xl border border-line px-3 py-2 text-sm" />
                </div>
              </div>
            </div>

            {durumMesaji && (
              <p className={`text-sm mt-3 ${durumMesaji.includes("eklendi") || durumMesaji.includes("Kaydedildi") ? "text-signal-done" : "text-signal-late"}`}>
                {durumMesaji}
              </p>
            )}
            <Buton type="submit" tamGenislik className="mt-3"
              disabled={gonderiliyor || !urunKodu.trim() || !urunAdi.trim()}>
              {gonderiliyor ? "Ekleniyor…" : "Kartı Ekle"}
            </Buton>
          </Kart>
        </form>
      )}

      {/* ---- ARAMA ---- */}
      <div className="flex items-center gap-2">
        <input value={arama} onChange={(e) => setArama(e.target.value)}
          placeholder="Kod, isim, renk veya açıklama ara…"
          className="focus-ring flex-1 rounded-xl border border-line px-3.5 py-2.5 text-sm bg-surface" />
        <button onClick={yenile} className="text-gray-500 text-lg focus-ring" aria-label="Yenile">↻</button>
      </div>

      {/* ---- LİSTE ---- */}
      {yukleniyor ? (
        <p className="text-sm text-gray-500 text-center py-10">Yükleniyor…</p>
      ) : siraliKartlar.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-10">
          {arama ? "Aramayla eşleşen kart yok." : "Henüz kart eklenmedi."}
        </p>
      ) : (
        <div className="space-y-3">
          {siraliKartlar.map((k) =>
            duzenlenenId === k.id ? (
              /* Düzenleme modu */
              <Kart key={k.id}>
                <p className="text-xs text-gray-400 mb-2 font-medium">Düzenleniyor…</p>
                <div className="space-y-2">
                  {duzGorsel ? (
                    <div className="relative w-full mb-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={duzGorsel} alt="Görsel" className="w-full max-h-40 object-cover rounded-xl" />
                      <button type="button" onClick={() => setDuzGorsel(null)}
                        className="absolute top-2 right-2 bg-signal-lateBg text-signal-late text-xs rounded-full px-2 py-1">
                        Kaldır
                      </button>
                    </div>
                  ) : (
                    <div onClick={() => duzGorselRef.current?.click()}
                      className="w-full h-20 rounded-xl bg-canvas border border-dashed border-line flex items-center justify-center text-sm text-gray-400 cursor-pointer hover:bg-gray-50">
                      📷 Görsel Ekle
                    </div>
                  )}
                  <input ref={duzGorselRef} type="file" accept="image/*" className="hidden"
                    onChange={(e) => gorselSec(e, setDuzGorsel)} />

                  <div className="grid grid-cols-2 gap-2">
                    <input value={duzKod} onChange={(e) => setDuzKod(e.target.value)}
                      placeholder="Ürün Kodu"
                      className="focus-ring rounded-lg border border-line px-2.5 py-1.5 text-sm font-mono" />
                    <input value={duzRenk} onChange={(e) => setDuzRenk(e.target.value)}
                      placeholder="Genel Renk"
                      className="focus-ring rounded-lg border border-line px-2.5 py-1.5 text-sm" />
                  </div>
                  <input value={duzAd} onChange={(e) => setDuzAd(e.target.value)}
                    placeholder="Ürün Adı"
                    className="focus-ring w-full rounded-lg border border-line px-2.5 py-1.5 text-sm" />

                  <VaryasyonTablosu varyantlar={duzVaryantlar} onChange={setDuzVaryantlar} />

                  <textarea value={duzAciklama} onChange={(e) => setDuzAciklama(e.target.value)}
                    rows={2} placeholder="Açıklama"
                    className="focus-ring w-full rounded-lg border border-line px-2.5 py-1.5 text-sm" />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="date" value={duzGelis} onChange={(e) => setDuzGelis(e.target.value)}
                      className="focus-ring rounded-lg border border-line px-2.5 py-1.5 text-sm" />
                    <input type="date" value={duzBitis} onChange={(e) => setDuzBitis(e.target.value)}
                      className="focus-ring rounded-lg border border-line px-2.5 py-1.5 text-sm" />
                  </div>
                  <div className="flex gap-2">
                    <Buton varyant="ikincil" className="flex-1" onClick={() => setDuzenlenenId(null)}>Vazgeç</Buton>
                    <Buton className="flex-1" onClick={duzenlemeyiKaydet} disabled={duzKaydediliyor}>
                      {duzKaydediliyor ? "…" : "Kaydet"}
                    </Buton>
                  </div>
                </div>
              </Kart>
            ) : (
              /* Görüntüleme modu */
              <Kart key={k.id} stripRengi={k.bitisTarihi ? "#C4341E" : "#3B4CE0"}>
                {k.gorselUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={k.gorselUrl} alt={k.urunAdi}
                    className="w-full max-h-48 object-cover rounded-xl mb-3" />
                )}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-gray-500">{k.urunKodu}</span>
                      {k.renk && (
                        <span className="text-xs bg-canvas rounded-full px-2 py-0.5">{k.renk}</span>
                      )}
                      {k.stokAdedi != null && (
                        <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                          k.stokAdedi === 0
                            ? "bg-signal-lateBg text-signal-late"
                            : "bg-signal-doneBg text-signal-done"
                        }`}>
                          {k.stokAdedi} adet
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-sm mt-0.5">{k.urunAdi}</p>
                    {k.aciklama && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{k.aciklama}</p>
                    )}
                    <div className="flex gap-3 mt-1 text-[11px] text-gray-400">
                      {k.gelisTarihi && <span>Geliş: {k.gelisTarihi}</span>}
                      {k.bitisTarihi && <span>Bitiş: {k.bitisTarihi}</span>}
                    </div>
                    {/* Varyasyon özeti */}
                    {k.varyantlar && k.varyantlar.length > 0 && (
                      <VaryasyonOzeti varyantlar={k.varyantlar} />
                    )}
                  </div>
                  <div className="flex gap-1.5 shrink-0 mt-0.5">
                    <button onClick={() => duzenlemeyeBasla(k)}
                      className="focus-ring text-sm text-brand-500" aria-label="Düzenle">✏️</button>
                    <button onClick={() => kartSil(k.id)} disabled={siliniyorId === k.id}
                      className="focus-ring text-sm text-gray-400 hover:text-signal-late" aria-label="Sil">
                      {siliniyorId === k.id ? "…" : "🗑️"}
                    </button>
                  </div>
                </div>
              </Kart>
            )
          )}
        </div>
      )}
    </div>
  );
}
