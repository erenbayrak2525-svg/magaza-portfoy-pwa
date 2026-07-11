"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useFirestoreListesi, useFirestoreBelge } from "@/lib/firestoreOkuma";
import { firebaseYapilandirildi } from "@/lib/firebaseClient";
import { kuyrugaEkle } from "@/lib/outbox";
import { kuyruguSenkronEt } from "@/lib/senkron";
import { useCevrimici } from "@/lib/useCevrimici";
import { adSoyadBul } from "@/lib/adSoyadBul";
import {
  GUN_SIRASI,
  GUN_ETIKET,
  varsayilanCalismaProgrami,
  type CalismaProgrami,
  type GunAdi,
  type Kullanici
} from "@/types";
import Kart from "@/components/ui/Kart";
import Buton from "@/components/ui/Buton";

export default function CalismaSaatleriSayfasi() {
  const kullanici = useAuthStore((s) => s.kullanici);
  if (!kullanici) return null;

  const yoneticiMi = kullanici.rol === "admin" || kullanici.rol === "bolge_muduru";
  return yoneticiMi ? <YoneticiGorunumu /> : <PersonelGorunumu kullaniciId={kullanici.id} />;
}

// ---- Personel: sadece kendi programını görüntüler, değiştiremez ----
function PersonelGorunumu({ kullaniciId }: { kullaniciId: string }) {
  const { veri: program, yukleniyor } = useFirestoreBelge<CalismaProgrami>("calisma_saatleri", kullaniciId);
  const gunler = firebaseYapilandirildi ? program?.gunler : varsayilanCalismaProgrami();

  if (yukleniyor) return <p className="text-sm text-gray-500 text-center py-16">Yükleniyor…</p>;

  return (
    <div className="space-y-4">
      <Kart>
        <p className="text-sm font-medium mb-1">Haftalık Çalışma Saatlerin</p>
        <p className="text-xs text-gray-500">Bu programı sadece Admin veya Müdür değiştirebilir.</p>
      </Kart>
      {!gunler ? (
        <p className="text-sm text-gray-400 text-center py-10">Henüz senin için bir program girilmemiş.</p>
      ) : (
        <HaftaTablosu gunler={gunler} duzenlenebilir={false} onDegisim={() => {}} />
      )}
    </div>
  );
}

// ---- Admin / Müdür: bir personel seçip programını düzenler ----
function YoneticiGorunumu() {
  const cevrimici = useCevrimici();
  const { veri: profiller, yukleniyor: profilYukleniyor } = useFirestoreListesi<Kullanici>("profiles");
  const personelListesi = profiller.filter((p) => p.rol === "personel");

  const [seciliId, setSeciliId] = useState("");
  useEffect(() => {
    if (!seciliId && personelListesi.length > 0) setSeciliId(personelListesi[0].id);
  }, [seciliId, personelListesi]);

  const { veri: program, yukleniyor: programYukleniyor } = useFirestoreBelge<CalismaProgrami>(
    "calisma_saatleri",
    seciliId || null
  );

  const [gunler, setGunler] = useState(varsayilanCalismaProgrami());
  const [ilkYuklemeYapildi, setIlkYuklemeYapildi] = useState<string | null>(null);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [durumMesaji, setDurumMesaji] = useState<string | null>(null);

  useEffect(() => {
    if (!seciliId) return;
    if (ilkYuklemeYapildi === seciliId) return;
    if (programYukleniyor) return;
    setGunler(program?.gunler ?? varsayilanCalismaProgrami());
    setIlkYuklemeYapildi(seciliId);
    setDurumMesaji(null);
  }, [seciliId, program, programYukleniyor, ilkYuklemeYapildi]);

  async function kaydet() {
    if (!seciliId) return;
    setKaydediliyor(true);
    setDurumMesaji(null);
    try {
      await kuyrugaEkle({ tip: "calisma_programi_guncelle", payload: { id: seciliId, gunler } });
      if (cevrimici) {
        const sonuc = await kuyruguSenkronEt();
        setDurumMesaji(sonuc.basarili > 0 ? "Program kaydedildi." : "Kaydedildi, senkron bekleniyor.");
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
        <label className="block text-sm font-medium mb-1.5">Personel</label>
        {profilYukleniyor ? (
          <p className="text-xs text-gray-500">Yükleniyor…</p>
        ) : personelListesi.length === 0 ? (
          <p className="text-xs text-gray-500">Henüz "personel" rolünde kayıtlı kimse yok.</p>
        ) : (
          <select
            value={seciliId}
            onChange={(e) => {
              setSeciliId(e.target.value);
              setIlkYuklemeYapildi(null);
            }}
            className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-sm bg-surface"
          >
            {personelListesi.map((p) => (
              <option key={p.id} value={p.id}>{adSoyadBul(p) || p.id}</option>
            ))}
          </select>
        )}
      </Kart>

      {seciliId && (
        <>
          <HaftaTablosu gunler={gunler} duzenlenebilir onDegisim={setGunler} />

          {durumMesaji && (
            <Kart stripRengi="#0F7A4C">
              <p className="text-sm">{durumMesaji}</p>
            </Kart>
          )}

          <Buton tamGenislik onClick={kaydet} disabled={kaydediliyor}>
            {kaydediliyor ? "Kaydediliyor…" : "Programı Kaydet"}
          </Buton>
        </>
      )}
    </div>
  );
}

// ---- Ortak: haftalık tablo (düzenlenebilir veya salt okunur) ----
function HaftaTablosu({
  gunler,
  duzenlenebilir,
  onDegisim
}: {
  gunler: CalismaProgrami["gunler"];
  duzenlenebilir: boolean;
  onDegisim: (yeni: CalismaProgrami["gunler"]) => void;
}) {
  function guncelle(gun: GunAdi, alan: "calisiyor" | "baslangic" | "bitis", deger: boolean | string) {
    onDegisim({ ...gunler, [gun]: { ...gunler[gun], [alan]: deger } });
  }

  return (
    <div className="space-y-2">
      {GUN_SIRASI.map((gun) => {
        const g = gunler[gun];
        return (
          <Kart key={gun}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium w-24 shrink-0">{GUN_ETIKET[gun]}</p>
              {duzenlenebilir ? (
                <button
                  onClick={() => guncelle(gun, "calisiyor", !g.calisiyor)}
                  className={`text-xs font-medium rounded-full px-2.5 py-1 shrink-0 ${
                    g.calisiyor ? "bg-signal-doneBg text-signal-done" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {g.calisiyor ? "Çalışıyor" : "İzinli"}
                </button>
              ) : (
                <span className={`text-xs font-medium rounded-full px-2.5 py-1 shrink-0 ${
                  g.calisiyor ? "bg-signal-doneBg text-signal-done" : "bg-gray-100 text-gray-500"
                }`}>
                  {g.calisiyor ? "Çalışıyor" : "İzinli"}
                </span>
              )}
              {g.calisiyor && (
                <div className="flex items-center gap-1 text-xs flex-1 justify-end">
                  <input
                    type="time"
                    value={g.baslangic}
                    disabled={!duzenlenebilir}
                    onChange={(e) => guncelle(gun, "baslangic", e.target.value)}
                    className="focus-ring rounded-lg border border-line px-1.5 py-1 text-xs disabled:bg-canvas disabled:text-gray-500 w-[85px]"
                  />
                  <span className="text-gray-400">–</span>
                  <input
                    type="time"
                    value={g.bitis}
                    disabled={!duzenlenebilir}
                    onChange={(e) => guncelle(gun, "bitis", e.target.value)}
                    className="focus-ring rounded-lg border border-line px-1.5 py-1 text-xs disabled:bg-canvas disabled:text-gray-500 w-[85px]"
                  />
                </div>
              )}
            </div>
          </Kart>
        );
      })}
    </div>
  );
}
