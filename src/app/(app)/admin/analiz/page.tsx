"use client";

import { useFirestoreListesi } from "@/lib/firestoreOkuma";
import { firebaseYapilandirildi } from "@/lib/firebaseClient";
import { MOCK_CIRO_KAYITLARI, MOCK_GOREVLER, MOCK_STOK_URUNLERI } from "@/data/mockData";
import { stokToplamAdet, type CiroKaydi, type Gorev, type StokUrunu } from "@/types";
import Kart from "@/components/ui/Kart";
import AdminKorumasi from "@/components/AdminKorumasi";

function paraFormatla(n: number) {
  return n.toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
}

export default function AnalizSayfasi() {
  return (
    <AdminKorumasi>
      <AnalizIcerik />
    </AdminKorumasi>
  );
}

function AnalizIcerik() {
  const ciroSonuc = useFirestoreListesi<CiroKaydi>("ciro_kayitlari");
  const gorevSonuc = useFirestoreListesi<Gorev>("gorevler");
  const stokSonuc = useFirestoreListesi<StokUrunu>("stok_urunleri");

  const yukleniyor = firebaseYapilandirildi && (ciroSonuc.yukleniyor || gorevSonuc.yukleniyor || stokSonuc.yukleniyor);

  const ciroKayitlari = firebaseYapilandirildi ? ciroSonuc.veri : MOCK_CIRO_KAYITLARI;
  const gorevler = firebaseYapilandirildi ? gorevSonuc.veri : MOCK_GOREVLER;
  const stokUrunleri = firebaseYapilandirildi ? stokSonuc.veri : MOCK_STOK_URUNLERI;

  const toplamCiro = ciroKayitlari.reduce((t, c) => t + (c.tutar ?? 0), 0);
  const toplamGorev = gorevler.length;
  const tamamlanan = gorevler.filter((g) => g.durum === "tamamlandi").length;
  const tamamlanmaOrani = toplamGorev ? Math.round((tamamlanan / toplamGorev) * 100) : 0;
  const toplamStokAdet = stokUrunleri.reduce((t, u) => t + stokToplamAdet(u), 0);
  const enCokStoklu = [...stokUrunleri].sort((a, b) => stokToplamAdet(b) - stokToplamAdet(a)).slice(0, 5);
  const maxStokAdet = Math.max(1, ...enCokStoklu.map((u) => stokToplamAdet(u)));

  if (yukleniyor) {
    return <p className="text-sm text-gray-500 text-center py-16">Yükleniyor…</p>;
  }

  return (
    <div className="space-y-4">
      {!firebaseYapilandirildi && (
        <Kart stripRengi="#B4740E">
          <p className="text-sm">Demo modu: Firebase bağlı değil, örnek veriler gösteriliyor.</p>
        </Kart>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Kart>
          {ciroKayitlari.length === 0 ? (
            <p className="text-sm text-gray-400">Veri yok</p>
          ) : (
            <p className="text-2xl font-semibold">{paraFormatla(toplamCiro)}</p>
          )}
          <p className="text-xs text-gray-500 mt-0.5">Bugünkü toplam ciro</p>
        </Kart>
        <Kart>
          {toplamGorev === 0 ? (
            <p className="text-sm text-gray-400">Veri yok</p>
          ) : (
            <p className="text-2xl font-semibold">%{tamamlanmaOrani}</p>
          )}
          <p className="text-xs text-gray-500 mt-0.5">Görev tamamlanma oranı</p>
        </Kart>
      </div>

      <Kart>
        <p className="text-sm font-semibold mb-4">Stok Özeti</p>
        {stokUrunleri.length === 0 ? (
          <p className="text-sm text-gray-400">Veri yok — Admin → Stok İçe Aktar'dan ürün yükleyebilirsin.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p className="text-xl font-semibold">{stokUrunleri.length}</p>
                <p className="text-xs text-gray-500">Ürün</p>
              </div>
              <div>
                <p className="text-xl font-semibold">{toplamStokAdet}</p>
                <p className="text-xs text-gray-500">Toplam adet</p>
              </div>
            </div>
            <p className="text-xs font-medium text-gray-500 mb-2">En çok stoklu 5 ürün</p>
            <div className="space-y-3">
              {enCokStoklu.map((u) => {
                const adet = stokToplamAdet(u);
                const genislik = Math.max(4, Math.round((adet / maxStokAdet) * 100));
                return (
                  <div key={u.id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 truncate pr-2">{u.urunAdi}</span>
                      <span className="font-medium shrink-0">{adet}</span>
                    </div>
                    <div className="h-2 rounded-full bg-canvas overflow-hidden">
                      <div className="h-full bg-brand-500 rounded-full" style={{ width: `${genislik}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Kart>

      <Kart>
        <p className="text-sm font-semibold mb-4">Görev Durum Dağılımı</p>
        {toplamGorev === 0 ? (
          <p className="text-sm text-gray-400">Veri yok</p>
        ) : (
          <div className="space-y-3">
            {(["bekliyor", "devam_ediyor", "tamamlandi"] as const).map((durum) => {
              const sayi = gorevler.filter((g) => g.durum === durum).length;
              const genislik = toplamGorev ? Math.max(4, Math.round((sayi / toplamGorev) * 100)) : 0;
              const renk = durum === "tamamlandi" ? "bg-signal-done" : durum === "devam_ediyor" ? "bg-brand-500" : "bg-signal-pending";
              const etiket = durum === "tamamlandi" ? "Tamamlandı" : durum === "devam_ediyor" ? "Devam Ediyor" : "Bekliyor";
              return (
                <div key={durum}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600">{etiket}</span>
                    <span className="font-medium">{sayi}</span>
                  </div>
                  <div className="h-2 rounded-full bg-canvas overflow-hidden">
                    <div className={`h-full rounded-full ${renk}`} style={{ width: `${genislik}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Kart>
    </div>
  );
}
