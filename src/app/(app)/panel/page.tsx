"use client";

import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { MOCK_GOREVLER, MOCK_MAGAZALAR, MOCK_CIRO_KAYITLARI, MOCK_BILDIRIMLER } from "@/data/mockData";
import Kart from "@/components/ui/Kart";
import DurumRozeti, { stripRengi } from "@/components/ui/DurumRozeti";

function paraFormatla(n: number) {
  return n.toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
}

export default function PanelSayfasi() {
  const kullanici = useAuthStore((s) => s.kullanici);
  if (!kullanici) return null;

  const benimGorevlerim = MOCK_GOREVLER.filter((g) => g.atananKullaniciId === kullanici.id);
  const bekleyenSayisi = MOCK_GOREVLER.filter((g) => g.durum === "bekliyor" || g.durum === "devam_ediyor").length;
  const okunmamisBildirim = MOCK_BILDIRIMLER.filter((b) => !b.okundu).length;

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
              <p className="text-xs text-gray-500 mt-0.5">Tamamlanan (bu hafta)</p>
            </Kart>
          </div>

          <section>
            <h3 className="text-sm font-semibold mb-2">Güncel görevlerin</h3>
            <div className="space-y-2">
              {benimGorevlerim.map((g) => (
                <Link key={g.id} href={`/gorevler/detay?id=${g.id}`}>
                  <Kart stripRengi={stripRengi(g.durum)}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">{g.baslik}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{g.magazaAdi} · Son: {g.sonTarih}</p>
                      </div>
                      <DurumRozeti durum={g.durum} />
                    </div>
                  </Kart>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}

      {kullanici.rol === "bolge_muduru" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Kart>
              <p className="text-2xl font-semibold">{MOCK_MAGAZALAR.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Sorumlu olduğun mağaza</p>
            </Kart>
            <Kart>
              <p className="text-2xl font-semibold">{bekleyenSayisi}</p>
              <p className="text-xs text-gray-500 mt-0.5">Açık görev</p>
            </Kart>
          </div>

          <section>
            <h3 className="text-sm font-semibold mb-2">Mağazalarının bugünkü cirosu</h3>
            <div className="space-y-2">
              {MOCK_MAGAZALAR.map((m) => {
                const ciro = MOCK_CIRO_KAYITLARI.find((c) => c.magazaId === m.id);
                return (
                  <Link key={m.id} href={`/magazalar/detay?id=${m.id}`}>
                    <Kart>
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{m.ad}</p>
                        <p className="text-sm font-semibold">{ciro ? paraFormatla(ciro.tutar) : "—"}</p>
                      </div>
                    </Kart>
                  </Link>
                );
              })}
            </div>
          </section>
        </>
      )}

      {kullanici.rol === "admin" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Kart>
              <p className="text-2xl font-semibold">{MOCK_MAGAZALAR.length}</p>
              <p className="text-xs text-gray-500 mt-0.5">Toplam mağaza</p>
            </Kart>
            <Kart>
              <p className="text-2xl font-semibold">{bekleyenSayisi}</p>
              <p className="text-xs text-gray-500 mt-0.5">Portföy genelinde açık görev</p>
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
            <Link href="/admin/portfoy">
              <Kart className="text-center">
                <p className="text-2xl mb-1">🏬</p>
                <p className="text-sm font-medium">Portföy Yönetimi</p>
              </Kart>
            </Link>
            <Link href="/gorevler">
              <Kart className="text-center">
                <p className="text-2xl mb-1">✅</p>
                <p className="text-sm font-medium">Tüm Görevler</p>
              </Kart>
            </Link>
          </div>

          <section>
            <h3 className="text-sm font-semibold mb-2">Bugünkü toplam ciro</h3>
            <Kart>
              <p className="text-2xl font-semibold">
                {paraFormatla(MOCK_CIRO_KAYITLARI.reduce((t, c) => t + c.tutar, 0))}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{MOCK_MAGAZALAR.length} mağaza toplamı</p>
            </Kart>
          </section>
        </>
      )}
    </div>
  );
}
