"use client";

import { useState } from "react";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db, firebaseYapilandirildi } from "@/lib/firebaseClient";
import { kuyrugaEkle } from "@/lib/outbox";
import { kuyruguSenkronEt } from "@/lib/senkron";
import { useCevrimici } from "@/lib/useCevrimici";
import { useFirestoreListesi } from "@/lib/firestoreOkuma";
import type { CiroKaydi } from "@/types";
import Kart from "@/components/ui/Kart";
import Buton from "@/components/ui/Buton";

function paraFormatla(n: number) {
  return n.toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
}

export default function CiroGirisiSayfasi() {
  const cevrimici = useCevrimici();
  const { veri: kayitlar, yukleniyor, yenile } = useFirestoreListesi<CiroKaydi>("ciro_kayitlari");

  const [tarih, setTarih] = useState(new Date().toISOString().slice(0, 10));
  const [tutar, setTutar] = useState("");
  const [fisAdedi, setFisAdedi] = useState("");
  const [notlar, setNotlar] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [durumMesaji, setDurumMesaji] = useState<string | null>(null);

  // Düzenleme durumu
  const [duzenlenenId, setDuzenlenenId] = useState<string | null>(null);
  const [duzenlenenTutar, setDuzenlenenTutar] = useState("");
  const [duzenlenenFis, setDuzenlenenFis] = useState("");
  const [duzenlenenNotlar, setDuzenlenenNotlar] = useState("");
  const [duzenleniyor, setDuzenleniyor] = useState(false);
  const [siliniyorId, setSiliniyorId] = useState<string | null>(null);

  const siraliKayitlar = [...kayitlar].sort((a, b) => (a.tarih < b.tarih ? 1 : -1));
  const toplamCiro = kayitlar.reduce((t, c) => t + (c.tutar ?? 0), 0);

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    setGonderiliyor(true);
    setDurumMesaji(null);
    try {
      await kuyrugaEkle({
        tip: "ciro_girisi",
        payload: { tarih, tutar: Number(tutar), fisAdedi: Number(fisAdedi) || null, notlar }
      });
      if (cevrimici) {
        const sonuc = await kuyruguSenkronEt();
        setDurumMesaji(sonuc.basarili > 0 ? "Kaydedildi." : "Kaydedildi, senkron bekleniyor.");
        if (sonuc.basarili > 0) yenile();
      } else {
        setDurumMesaji("Çevrimdışısın: kaydedildi, bağlantı gelince gönderilecek.");
      }
      setTutar(""); setFisAdedi(""); setNotlar("");
    } finally {
      setGonderiliyor(false);
    }
  }

  function duzenlemeyeBasla(k: CiroKaydi) {
    setDuzenlenenId(k.id);
    setDuzenlenenTutar(String(k.tutar ?? ""));
    setDuzenlenenFis(String(k.fisAdedi ?? ""));
    setDuzenlenenNotlar(k.notlar ?? "");
  }

  async function duzenlemeyiKaydet() {
    if (!duzenlenenId || !firebaseYapilandirildi) return;
    setDuzenleniyor(true);
    try {
      await updateDoc(doc(db, "ciro_kayitlari", duzenlenenId), {
        tutar: Number(duzenlenenTutar),
        fisAdedi: Number(duzenlenenFis) || null,
        notlar: duzenlenenNotlar
      });
      setDuzenlenenId(null);
      yenile();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Düzenlenemedi");
    } finally {
      setDuzenleniyor(false);
    }
  }

  async function kaydiSil(id: string) {
    if (!confirm("Bu ciro kaydını silmek istediğine emin misin?")) return;
    if (!firebaseYapilandirildi) return;
    setSiliniyorId(id);
    try {
      await deleteDoc(doc(db, "ciro_kayitlari", id));
      yenile();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Silinemedi");
    } finally {
      setSiliniyorId(null);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={gonder}>
        <Kart>
          <p className="text-sm font-medium mb-3">Yeni Ciro Girişi</p>
          <div className="space-y-3">
            <input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)}
              className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-sm" required />
            <input type="number" inputMode="decimal" value={tutar} onChange={(e) => setTutar(e.target.value)}
              placeholder="Ciro Tutarı (₺)" required
              className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-sm" />
            <input type="number" inputMode="numeric" value={fisAdedi} onChange={(e) => setFisAdedi(e.target.value)}
              placeholder="Fiş Adedi"
              className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-sm" />
            <textarea value={notlar} onChange={(e) => setNotlar(e.target.value)}
              rows={2} placeholder="Notlar (opsiyonel)"
              className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-sm" />
          </div>
          {durumMesaji && (
            <p className={`text-sm mt-3 ${durumMesaji.includes("Kaydedildi") ? "text-signal-done" : "text-signal-late"}`}>
              {durumMesaji}
            </p>
          )}
          <Buton type="submit" tamGenislik className="mt-3" disabled={gonderiliyor || !tutar}>
            {gonderiliyor ? "Kaydediliyor…" : "Kaydet"}
          </Buton>
        </Kart>
      </form>

      <section>
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="text-sm font-semibold">Kayıtlar</h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">Toplam: {paraFormatla(toplamCiro)}</span>
            <button onClick={yenile} className="text-gray-500 text-lg focus-ring" aria-label="Yenile">↻</button>
          </div>
        </div>

        {yukleniyor ? (
          <p className="text-sm text-gray-500 text-center py-10">Yükleniyor…</p>
        ) : siraliKayitlar.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-10">Henüz kayıt yok.</p>
        ) : (
          <div className="space-y-2">
            {siraliKayitlar.map((k) =>
              duzenlenenId === k.id ? (
                <Kart key={k.id}>
                  <p className="text-xs text-gray-500 mb-2">{k.tarih}</p>
                  <div className="space-y-2">
                    <input type="number" value={duzenlenenTutar} onChange={(e) => setDuzenlenenTutar(e.target.value)}
                      placeholder="Tutar (₺)"
                      className="focus-ring w-full rounded-lg border border-line px-2.5 py-1.5 text-sm" />
                    <input type="number" value={duzenlenenFis} onChange={(e) => setDuzenlenenFis(e.target.value)}
                      placeholder="Fiş Adedi"
                      className="focus-ring w-full rounded-lg border border-line px-2.5 py-1.5 text-sm" />
                    <input value={duzenlenenNotlar} onChange={(e) => setDuzenlenenNotlar(e.target.value)}
                      placeholder="Notlar"
                      className="focus-ring w-full rounded-lg border border-line px-2.5 py-1.5 text-sm" />
                    <div className="flex gap-2">
                      <Buton varyant="ikincil" className="flex-1" onClick={() => setDuzenlenenId(null)}>Vazgeç</Buton>
                      <Buton className="flex-1" onClick={duzenlemeyiKaydet} disabled={duzenleniyor}>
                        {duzenleniyor ? "…" : "Kaydet"}
                      </Buton>
                    </div>
                  </div>
                </Kart>
              ) : (
                <Kart key={k.id}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{paraFormatla(k.tutar ?? 0)}</p>
                      <p className="text-xs text-gray-500">
                        {k.tarih}{k.fisAdedi ? ` · ${k.fisAdedi} fiş` : ""}{k.notlar ? ` · ${k.notlar}` : ""}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => duzenlemeyeBasla(k)} className="focus-ring text-brand-500 text-sm">✏️</button>
                      <button onClick={() => kaydiSil(k.id)} disabled={siliniyorId === k.id}
                        className="focus-ring text-gray-400 hover:text-signal-late text-sm">
                        {siliniyorId === k.id ? "…" : "🗑️"}
                      </button>
                    </div>
                  </div>
                </Kart>
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}
