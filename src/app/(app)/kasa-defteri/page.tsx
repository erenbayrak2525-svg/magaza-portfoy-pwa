"use client";

import { useState } from "react";
import { useFirestoreListesi, belgeSil } from "@/lib/firestoreOkuma";
import { firebaseYapilandirildi } from "@/lib/firebaseClient";
import { useAuthStore } from "@/store/authStore";
import { kuyrugaEkle } from "@/lib/outbox";
import { kuyruguSenkronEt } from "@/lib/senkron";
import { useCevrimici } from "@/lib/useCevrimici";
import type { KasaKaydi } from "@/types";
import Kart from "@/components/ui/Kart";
import Buton from "@/components/ui/Buton";
import YoneticiKorumasi from "@/components/YoneticiKorumasi";

function paraFormatla(n: number) {
  return n.toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
}

export default function KasaDefteriSayfasi() {
  return (
    <YoneticiKorumasi>
      <KasaDefteriIcerik />
    </YoneticiKorumasi>
  );
}

function KasaDefteriIcerik() {
  const kullanici = useAuthStore((s) => s.kullanici);
  const cevrimici = useCevrimici();
  const { veri: kayitlar, yukleniyor, hata, yenile } = useFirestoreListesi<KasaKaydi>("kasa_defteri");

  const [tarih, setTarih] = useState(new Date().toISOString().slice(0, 10));
  const [aciklama, setAciklama] = useState("");
  const [tutar, setTutar] = useState("");
  const [tur, setTur] = useState<"gelir" | "gider">("gelir");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [siliniyorId, setSiliniyorId] = useState<string | null>(null);
  const [durumMesaji, setDurumMesaji] = useState<string | null>(null);

  const siraliKayitlar = [...kayitlar].sort((a, b) => (a.tarih < b.tarih ? 1 : -1));
  const toplamGelir = kayitlar.filter((k) => k.tur === "gelir").reduce((t, k) => t + (k.tutar ?? 0), 0);
  const toplamGider = kayitlar.filter((k) => k.tur === "gider").reduce((t, k) => t + (k.tutar ?? 0), 0);
  const bakiye = toplamGelir - toplamGider;

  async function kaydiEkle(e: React.FormEvent) {
    e.preventDefault();
    setGonderiliyor(true);
    setDurumMesaji(null);
    try {
      await kuyrugaEkle({
        tip: "kasa_kaydi_ekle",
        payload: { tarih, aciklama, tutar: Number(tutar), tur, olusturanKullaniciId: kullanici?.id }
      });
      if (cevrimici) {
        const sonuc = await kuyruguSenkronEt();
        setDurumMesaji(sonuc.basarili > 0 ? "Kayıt eklendi." : "Kaydedildi, senkron bekleniyor.");
        if (sonuc.basarili > 0) yenile();
      } else {
        setDurumMesaji("Çevrimdışısın: kaydedildi, bağlantı gelince gönderilecek.");
      }
      setAciklama("");
      setTutar("");
    } finally {
      setGonderiliyor(false);
    }
  }

  async function kaydiSil(id: string) {
    if (!confirm("Bu kaydı silmek istediğine emin misin? Bu işlem geri alınamaz.")) return;
    setSiliniyorId(id);
    try {
      await belgeSil("kasa_defteri", id);
      yenile();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Silinemedi");
    } finally {
      setSiliniyorId(null);
    }
  }

  return (
    <div className="space-y-4">
      {!firebaseYapilandirildi && (
        <Kart stripRengi="#B4740E">
          <p className="text-sm">Demo modu: Firebase bağlı değil, kasa defteri boş görünecek.</p>
        </Kart>
      )}

      <div className="grid grid-cols-3 gap-2">
        <Kart>
          <p className="text-sm font-semibold text-signal-done">{paraFormatla(toplamGelir)}</p>
          <p className="text-[11px] text-gray-500">Toplam Gelir</p>
        </Kart>
        <Kart>
          <p className="text-sm font-semibold text-signal-late">{paraFormatla(toplamGider)}</p>
          <p className="text-[11px] text-gray-500">Toplam Gider</p>
        </Kart>
        <Kart>
          <p className={`text-sm font-semibold ${bakiye >= 0 ? "text-signal-done" : "text-signal-late"}`}>
            {paraFormatla(bakiye)}
          </p>
          <p className="text-[11px] text-gray-500">Kasa Bakiyesi</p>
        </Kart>
      </div>

      <form onSubmit={kaydiEkle}>
        <Kart>
          <p className="text-sm font-medium mb-3">Yeni Kayıt</p>
          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTur("gelir")}
                className={`flex-1 rounded-xl py-2 text-sm font-medium border ${
                  tur === "gelir" ? "bg-signal-doneBg text-signal-done border-signal-done" : "bg-surface border-line text-gray-500"
                }`}
              >
                Gelir
              </button>
              <button
                type="button"
                onClick={() => setTur("gider")}
                className={`flex-1 rounded-xl py-2 text-sm font-medium border ${
                  tur === "gider" ? "bg-signal-lateBg text-signal-late border-signal-late" : "bg-surface border-line text-gray-500"
                }`}
              >
                Gider
              </button>
            </div>
            <input
              type="date"
              value={tarih}
              onChange={(e) => setTarih(e.target.value)}
              className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-sm"
              required
            />
            <input
              value={aciklama}
              onChange={(e) => setAciklama(e.target.value)}
              placeholder="Açıklama (ör. Kira ödemesi)"
              className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-sm"
              required
            />
            <input
              type="number"
              inputMode="decimal"
              value={tutar}
              onChange={(e) => setTutar(e.target.value)}
              placeholder="Tutar (₺)"
              className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-sm"
              required
            />
          </div>
          <Buton type="submit" tamGenislik className="mt-3" disabled={gonderiliyor || !aciklama || !tutar}>
            {gonderiliyor ? "Ekleniyor…" : "Kaydı Ekle"}
          </Buton>
        </Kart>
      </form>

      {durumMesaji && (
        <Kart stripRengi={durumMesaji.includes("eklendi") ? "#0F7A4C" : "#6B7280"}>
          <p className="text-sm">{durumMesaji}</p>
        </Kart>
      )}

      {hata && (
        <Kart stripRengi="#C4341E">
          <p className="text-sm text-signal-late">Veri okunamadı: {hata}</p>
          <Buton varyant="ikincil" className="mt-3" onClick={yenile}>Tekrar Dene</Buton>
        </Kart>
      )}

      <section>
        <div className="flex items-center justify-between mb-2 px-1">
          <h3 className="text-sm font-semibold">Kayıtlar</h3>
          <button onClick={yenile} className="text-gray-500 text-lg focus-ring" aria-label="Yenile">↻</button>
        </div>
        {yukleniyor ? (
          <p className="text-sm text-gray-500 text-center py-10">Yükleniyor…</p>
        ) : siraliKayitlar.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-10">Henüz kayıt yok.</p>
        ) : (
          <div className="space-y-2">
            {siraliKayitlar.map((k) => (
              <Kart key={k.id} stripRengi={k.tur === "gelir" ? "#0F7A4C" : "#C4341E"}>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{k.aciklama}</p>
                    <p className="text-xs text-gray-500">{k.tarih}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-sm font-semibold ${k.tur === "gelir" ? "text-signal-done" : "text-signal-late"}`}>
                      {k.tur === "gelir" ? "+" : "-"}{paraFormatla(k.tutar ?? 0)}
                    </span>
                    <button
                      onClick={() => kaydiSil(k.id)}
                      disabled={siliniyorId === k.id}
                      className="text-gray-400 hover:text-signal-late text-sm focus-ring"
                      aria-label="Kaydı sil"
                    >
                      {siliniyorId === k.id ? "…" : "🗑️"}
                    </button>
                  </div>
                </div>
              </Kart>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
