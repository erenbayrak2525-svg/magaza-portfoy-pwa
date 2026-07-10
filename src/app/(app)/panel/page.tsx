"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { useFirestoreListesi } from "@/lib/firestoreOkuma";
import { firebaseYapilandirildi } from "@/lib/firebaseClient";
import { MOCK_GOREVLER, MOCK_CIRO_KAYITLARI, MOCK_BILDIRIMLER, MOCK_STOK_URUNLERI } from "@/data/mockData";
import { stokToplamAdet, type Gorev, type CiroKaydi, type StokUrunu } from "@/types";
import Kart from "@/components/ui/Kart";
import DurumRozeti, { stripRengi } from "@/components/ui/DurumRozeti";

function paraFormatla(n: number) {
  return n.toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
}

export default function PanelSayfasi() {
  const kullanici = useAuthStore((s) => s.kullanici);

  const gorevSonuc = useFirestoreListesi<Gorev>("gorevler");
  const stokSonuc = useFirestoreListesi<StokUrunu>("stok_urunleri");
  const ciroSonuc = useFirestoreListesi<CiroKaydi>("ciro_kayitlari");

  const gorevler = firebaseYapilandirildi ? gorevSonuc.veri : MOCK_GOREVLER;
  const stokUrunleri = firebaseYapilandirildi ? stokSonuc.veri : MOCK_STOK_URUNLERI;
  const ciroKayitlari = firebaseYapilandirildi ? ciroSonuc.veri : MOCK_CIRO_KAYITLARI;

  if (!kullanici) return null;

  const benimGorevlerim = gorevler.filter((g) => g.atananKullaniciId === kullanici.id);
  const bekleyenSayisi = gorevler.filter((g) => g.durum === "bekliyor" || g.durum === "devam_ediyor").length;
  const okunmamisBildirim = MOCK_BILDIRIMLER.filter((b) => !b.okundu).length;
  const toplamCiro = ciroKayitlari.reduce((t, c) => t + (c.tutar ?? 0), 0);
  const toplamStokAdet = stokUrunleri.reduce((t, u) => t + stokToplamAdet(u), 0);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Hoş geldin,</p>
        <h2 className="text-xl font-semibold">{kullanici.adSoyad}</h2>
      </div>

      {okunmamisBildirim > 0 && (
        <Link href="/bildirimler">
          <Kart stripRengi="#3B4CE0">
            <p className="text-sm font-medium">{okunmamisBildirim} okunmamış bildirimin var</p>
            <p className="text-xs text-gray-500 mt-0.5">Görmek için dokun</p>
          </Kart>
        </Link>
      )}

      {kullanici.rol === "personel" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Kart>
              <p className="text-2xl font-semibold">{benimGorevlerim.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Bana atanan görev</p>
            </Kart>
            <Kart>
              <p className="text-2xl font-semibold">
                {benimGorevlerim.filter((g) => g.durum === "tamamlandi").length}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Tamamlanan</p>
            </Kart>
          </div>

          <section>
            <h3 className="text-sm font-semibold mb-2">Güncel görevlerin</h3>
            {benimGorevlerim.length === 0 ? (
              <p className="text-sm text-gray-500">Şu an sana atanmış görev yok.</p>
            ) : (
              <div className="space-y-2">
                {benimGorevlerim.map((g) => (
                  <Link key={g.id} href={`/gorevler/detay?id=${g.id}`}>
                    <Kart stripRengi={stripRengi(g.durum)}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-sm">{g.baslik}</p>
                          <p className="text-xs text-gray-500 mt-0.5">Son: {g.sonTarih}</p>
                        </div>
                        <DurumRozeti durum={g.durum} />
                      </div>
                    </Kart>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {kullanici.rol === "bolge_muduru" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Kart>
              <p className="text-2xl font-semibold">{bekleyenSayisi}</p>
              <p className="text-xs text-gray-500 mt-0.5">Açık görev</p>
            </Kart>
            <Kart>
              <p className="text-2xl font-semibold">{toplamStokAdet}</p>
              <p className="text-xs text-gray-500 mt-0.5">Stokta toplam adet</p>
            </Kart>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Link href="/admin/analiz">
              <Kart className="text-center">
                <p className="text-2xl mb-1">📊</p>
                <p className="text-sm font-medium">Analiz</p>
              </Kart>
            </Link>
            <Link href="/kasa-defteri">
              <Kart className="text-center">
                <p className="text-2xl mb-1">📒</p>
                <p className="text-sm font-medium">Kasa Defteri</p>
              </Kart>
            </Link>
          </div>

          <section>
            <h3 className="text-sm font-semibold mb-2">Bugünkü ciro</h3>
            <Kart>
              <p className="text-2xl font-semibold">{paraFormatla(toplamCiro)}</p>
            </Kart>
          </section>
        </>
      )}

      {kullanici.rol === "admin" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Kart>
              <p className="text-2xl font-semibold">{bekleyenSayisi}</p>
              <p className="text-xs text-gray-500 mt-0.5">Açık görev</p>
            </Kart>
            <Kart>
              <p className="text-2xl font-semibold">{stokUrunleri.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Kataloğdaki ürün</p>
            </Kart>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Link href="/admin/gorev-atama">
              <Kart className="text-center">
                <p className="text-2xl mb-1">📤</p>
                <p className="text-sm font-medium">Görev Ata</p>
              </Kart>
            </Link>
            <Link href="/admin/analiz">
              <Kart className="text-center">
                <p className="text-2xl mb-1">📊</p>
                <p className="text-sm font-medium">Analiz</p>
              </Kart>
            </Link>
            <Link href="/gorevler">
              <Kart className="text-center">
                <p className="text-2xl mb-1">✅</p>
                <p className="text-sm font-medium">Tüm Görevler</p>
              </Kart>
            </Link>
            <Link href="/stok">
              <Kart className="text-center">
                <p className="text-2xl mb-1">🏷️</p>
                <p className="text-sm font-medium">Stok Kataloğu</p>
              </Kart>
            </Link>
            <Link href="/admin/stok-yukle">
              <Kart className="text-center">
                <p className="text-2xl mb-1">📥</p>
                <p className="text-sm font-medium">Stok İçe Aktar (HTML)</p>
              </Kart>
            </Link>
            <Link href="/kasa-defteri">
              <Kart className="text-center">
                <p className="text-2xl mb-1">📒</p>
                <p className="text-sm font-medium">Kasa Defteri</p>
              </Kart>
            </Link>
          </div>

          <section>
            <h3 className="text-sm font-semibold mb-2">Bugünkü toplam ciro</h3>
            <Kart>
              <p className="text-2xl font-semibold">{paraFormatla(toplamCiro)}</p>
            </Kart>
          </section>
        </>
      )}
    </div>
  );
}
