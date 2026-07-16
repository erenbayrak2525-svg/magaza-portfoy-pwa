"use client";

import { useEffect, useState } from "react";
import { MOCK_KULLANICILAR } from "@/data/mockData";
import { useFirestoreListesi } from "@/lib/firestoreOkuma";
import { firebaseYapilandirildi } from "@/lib/firebaseClient";
import { kuyrugaEkle } from "@/lib/outbox";
import { kuyruguSenkronEt } from "@/lib/senkron";
import { useCevrimici } from "@/lib/useCevrimici";
import type { Kullanici } from "@/types";
import { adSoyadBul } from "@/lib/adSoyadBul";
import { bildirimGonder } from "@/lib/bildirimGonder";
import Kart from "@/components/ui/Kart";
import Buton from "@/components/ui/Buton";
import AdminKorumasi from "@/components/AdminKorumasi";

export default function GorevAtamaSayfasi() {
  return (
    <AdminKorumasi>
      <GorevAtamaIcerik />
    </AdminKorumasi>
  );
}

function GorevAtamaIcerik() {
  const cevrimici = useCevrimici();
  // "profiles" koleksiyonu Firestore güvenlik kuralları gereği sadece giriş yapmış
  // kullanıcılarca okunabilir; buradan gerçek kayıtlı personelleri çekiyoruz.
  const { veri: canliProfiller, yukleniyor: personelYukleniyor, hata: personelHata, yenile: personelYenile } =
    useFirestoreListesi<Kullanici>("profiles");

  const tumKullanicilar = firebaseYapilandirildi ? canliProfiller : MOCK_KULLANICILAR;
  const personelListesi = tumKullanicilar.filter((k) => k.rol === "personel");

  const [personelId, setPersonelId] = useState("");
  const [baslik, setBaslik] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [sonTarih, setSonTarih] = useState("");
  const [oncelik, setOncelik] = useState<"dusuk" | "normal" | "yuksek">("normal");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [durumMesaji, setDurumMesaji] = useState<string | null>(null);

  useEffect(() => {
    if (!personelId && personelListesi.length > 0) setPersonelId(personelListesi[0].id);
  }, [personelId, personelListesi]);

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    setGonderiliyor(true);
    setDurumMesaji(null);
    try {
      await kuyrugaEkle({
        tip: "gorev_ata",
        payload: {
          atananKullaniciId: personelId,
          baslik,
          aciklama,
          sonTarih,
          oncelik,
          durum: "bekliyor",
          olusturmaTarihi: new Date().toISOString()
        }
      });
      // TODO: Görev ataması yapıldığında ilgili personele push bildirimi tetiklenmeli
      // (Firebase Cloud Messaging + Cloud Function, bkz. README "Push Bildirimler" bölümü).
      if (cevrimici) {
        const sonuc = await kuyruguSenkronEt();
        setDurumMesaji(
          sonuc.basarili > 0
            ? `Görev atandı → personel ID: ${personelId}`
            : "Kaydedildi, senkron bekleniyor."
        );
        if (sonuc.basarili > 0) {
          // Atanan kişiye bildirim gönder (arka planda, hata sohbeti bozmasın)
          bildirimGonder(
            personelId,
            `Yeni Görev: ${baslik}`,
            aciklama.slice(0, 100),
            "/gorevler"
          ).catch(() => {});
        }
      } else {
        setDurumMesaji("Çevrimdışısın: görev kaydedildi, bağlantı gelince atanacak.");
      }
      setBaslik("");
      setAciklama("");
      setSonTarih("");
    } finally {
      setGonderiliyor(false);
    }
  }

  return (
    <form onSubmit={gonder} className="space-y-4">
      <Kart>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Personel</label>
            {personelYukleniyor ? (
              <p className="text-xs text-gray-500">Personel listesi yükleniyor…</p>
            ) : personelHata ? (
              <p className="text-xs text-signal-late">
                Personel listesi okunamadı: {personelHata}{" "}
                <button type="button" onClick={personelYenile} className="underline">Tekrar dene</button>
              </p>
            ) : personelListesi.length === 0 ? (
              <p className="text-xs text-gray-500">
                Henüz "personel" rolünde kayıtlı kimse yok. Firebase Console → Authentication'da
                kullanıcı ekleyip Firestore'da <span className="font-mono">profiles/&#123;uid&#125;</span> belgesine
                <span className="font-mono"> rol: "personel"</span> yazman gerekiyor.
              </p>
            ) : (
              <>
                <select
                  value={personelId}
                  onChange={(e) => setPersonelId(e.target.value)}
                  className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-sm bg-surface"
                >
                  {personelListesi.map((p) => (
                    <option key={p.id} value={p.id}>{adSoyadBul(p) || p.id}</option>
                  ))}
                </select>
                {personelId && (
                  <p className="text-[11px] text-gray-400 mt-1 font-mono">
                    Seçili: {personelId}
                  </p>
                )}
              </>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Görev Başlığı</label>
            <input
              value={baslik}
              onChange={(e) => setBaslik(e.target.value)}
              className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-sm"
              placeholder="Örn. Vitrin Değişimi"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Açıklama</label>
            <textarea
              value={aciklama}
              onChange={(e) => setAciklama(e.target.value)}
              rows={3}
              className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-sm"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Son Tarih</label>
              <input
                type="date"
                value={sonTarih}
                onChange={(e) => setSonTarih(e.target.value)}
                className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Öncelik</label>
              <select
                value={oncelik}
                onChange={(e) => setOncelik(e.target.value as typeof oncelik)}
                className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-sm bg-surface"
              >
                <option value="dusuk">Düşük</option>
                <option value="normal">Normal</option>
                <option value="yuksek">Yüksek</option>
              </select>
            </div>
          </div>
        </div>
      </Kart>

      {durumMesaji && (
        <Kart stripRengi={durumMesaji.includes("atandı") ? "#0F7A4C" : "#6B7280"}>
          <p className="text-sm">{durumMesaji}</p>
        </Kart>
      )}

      <Buton type="submit" tamGenislik disabled={gonderiliyor || !baslik || !sonTarih || !personelId}>
        {gonderiliyor ? "Atanıyor…" : "Görevi Ata"}
      </Buton>
    </form>
  );
}
