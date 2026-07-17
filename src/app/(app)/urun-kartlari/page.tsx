"use client";

import { useRef, useState } from "react";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db, firebaseYapilandirildi } from "@/lib/firebaseClient";
import { useFirestoreListesi } from "@/lib/firestoreOkuma";
import { kuyrugaEkle } from "@/lib/outbox";
import { kuyruguSenkronEt } from "@/lib/senkron";
import { useCevrimici } from "@/lib/useCevrimici";
import { gorselSikistir } from "@/lib/gorselSikistir";
import type { UrunKarti } from "@/types";
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

function UrunKartlariIcerik() {
  const cevrimici = useCevrimici();
  const { veri: kartlar, yukleniyor, yenile } = useFirestoreListesi<UrunKarti>("urun_kartlari");

  // Yeni kart formu
  const [formAcik, setFormAcik] = useState(false);
  const [urunKodu, setUrunKodu] = useState("");
  const [urunAdi, setUrunAdi] = useState("");
  const [renk, setRenk] = useState("");
  const [stokAdedi, setStokAdedi] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [gelisTarihi, setGelisTarihi] = useState("");
  const [bitisTarihi, setBitisTarihi] = useState("");
  const [yeniGorsel, setYeniGorsel] = useState<string | null>(null);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [durumMesaji, setDurumMesaji] = useState<string | null>(null);
  const yeniGorselRef = useRef<HTMLInputElement>(null);

  // Düzenleme durumu
  const [duzenlenenId, setDuzenlenenId] = useState<string | null>(null);
  const [duzAd, setDuzAd] = useState("");
  const [duzKod, setDuzKod] = useState("");
  const [duzRenk, setDuzRenk] = useState("");
  const [duzStok, setDuzStok] = useState("");
  const [duzAciklama, setDuzAciklama] = useState("");
  const [duzGelis, setDuzGelis] = useState("");
  const [duzBitis, setDuzBitis] = useState("");
  const [duzGorsel, setDuzGorsel] = useState<string | null>(null);
  const [duzKaydediliyor, setDuzKaydediliyor] = useState(false);
  const [siliniyorId, setSiliniyorId] = useState<string | null>(null);
  const duzGorselRef = useRef<HTMLInputElement>(null);

  // Arama
  const [arama, setArama] = useState("");

  function gorselSec(
    e: React.ChangeEvent<HTMLInputElement>,
    onSonuc: (dataUrl: string) => void
  ) {
    const dosya = e.target.files?.[0];
    if (!dosya) return;
    gorselSikistir(dosya)
      .then(onSonuc)
      .catch(() => alert("Görsel işlenemedi, farklı bir dosya dene."));
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
      await kuyrugaEkle({
        tip: "urun_karti_ekle",
        payload: {
          urunKodu: urunKodu.trim(),
          urunAdi: urunAdi.trim(),
          renk: renk.trim() || null,
          stokAdedi: stokAdedi ? Number(stokAdedi) : null,
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
      setUrunKodu(""); setUrunAdi(""); setRenk(""); setStokAdedi("");
      setAciklama(""); setGelisTarihi(""); setBitisTarihi(""); setYeniGorsel(null);
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
    setDuzStok(k.stokAdedi != null ? String(k.stokAdedi) : "");
    setDuzAciklama(k.aciklama ?? "");
    setDuzGelis(k.gelisTarihi ?? "");
    setDuzBitis(k.bitisTarihi ?? "");
    setDuzGorsel(k.gorselUrl ?? null);
  }

  async function duzenlemeyiKaydet() {
    if (!duzenlenenId || !firebaseYapilandirildi) return;
    setDuzKaydediliyor(true);
    try {
      await updateDoc(doc(db, "urun_kartlari", duzenlenenId), {
        urunAdi: duzAd.trim(),
        urunKodu: duzKod.trim(),
        renk: duzRenk.trim() || null,
        stokAdedi: duzStok ? Number(duzStok) : null,
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
                  <div
                    onClick={() => yeniGorselRef.current?.click()}
                    className="w-full h-24 rounded-xl bg-canvas border border-dashed border-line flex items-center justify-center text-sm text-gray-400 cursor-pointer hover:bg-gray-50 mb-2"
                  >
                    📷 Görsel Ekle
                  </div>
                )}
                <input ref={yeniGorselRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => gorselSec(e, setYeniGorsel)} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium mb-1">Ürün Kodu *</label>
                  <input value={urunKodu} onChange={(e) => setUrunKodu(e.target.value)} required
                    placeholder="24K31942"
                    className="focus-ring w-full rounded-xl border border-line px-3 py-2 text-sm font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Renk</label>
                  <input value={renk} onChange={(e) => setRenk(e.target.value)}
                    placeholder="Siyah"
                    className="focus-ring w-full rounded-xl border border-line px-3 py-2 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Ürün Adı *</label>
                <input value={urunAdi} onChange={(e) => setUrunAdi(e.target.value)} required
                  placeholder="Midi Elbise"
                  className="focus-ring w-full rounded-xl border border-line px-3 py-2 text-sm" />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Stok Adedi</label>
                <input type="number" inputMode="numeric" value={stokAdedi}
                  onChange={(e) => setStokAdedi(e.target.value)} placeholder="0"
                  className="focus-ring w-full rounded-xl border border-line px-3 py-2 text-sm" />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Açıklama</label>
                <textarea value={aciklama} onChange={(e) => setAciklama(e.target.value)}
                  rows={3} placeholder="Sezon sonu, iade edildi, vs."
                  className="focus-ring w-full rounded-xl border border-line px-3 py-2 text-sm" />
              </div>

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

      <div className="flex items-center gap-2">
        <input value={arama} onChange={(e) => setArama(e.target.value)}
          placeholder="Kod, isim, renk veya açıklama ara…"
          className="focus-ring flex-1 rounded-xl border border-line px-3.5 py-2.5 text-sm bg-surface" />
        <button onClick={yenile} className="text-gray-500 text-lg focus-ring" aria-label="Yenile">↻</button>
      </div>

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
              // Düzenleme modu
              <Kart key={k.id}>
                <p className="text-xs text-gray-400 mb-2 font-medium">Düzenleniyor…</p>
                <div className="space-y-2">

                  {/* Görsel düzenleme */}
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
                      placeholder="Renk"
                      className="focus-ring rounded-lg border border-line px-2.5 py-1.5 text-sm" />
                  </div>
                  <input value={duzAd} onChange={(e) => setDuzAd(e.target.value)}
                    placeholder="Ürün Adı"
                    className="focus-ring w-full rounded-lg border border-line px-2.5 py-1.5 text-sm" />
                  <input type="number" value={duzStok} onChange={(e) => setDuzStok(e.target.value)}
                    placeholder="Stok Adedi"
                    className="focus-ring w-full rounded-lg border border-line px-2.5 py-1.5 text-sm" />
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
              // Görüntüleme modu
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
                    <div className="flex gap-3 mt-1.5 text-[11px] text-gray-400">
                      {k.gelisTarihi && <span>Geliş: {k.gelisTarihi}</span>}
                      {k.bitisTarihi && <span>Bitiş: {k.bitisTarihi}</span>}
                    </div>
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
