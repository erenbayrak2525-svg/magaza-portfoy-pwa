"use client";

import Link from "next/link";
import { useFirestoreListesi } from "@/lib/firestoreOkuma";
import { firebaseYapilandirildi } from "@/lib/firebaseClient";
import { MOCK_CIRO_KAYITLARI, MOCK_GOREVLER, MOCK_STOK_URUNLERI } from "@/data/mockData";
import { stokToplamAdet, type CiroKaydi, type Gorev, type StokUrunu } from "@/types";
import type { KasaKaydi } from "@/types";
import Kart from "@/components/ui/Kart";
import YoneticiKorumasi from "@/components/YoneticiKorumasi";

function paraFormatla(n: number) {
  return n.toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
}

export default function AnalizSayfasi() {
  return (
    <YoneticiKorumasi>
      <AnalizIcerik />
    </YoneticiKorumasi>
  );
}

function AnalizIcerik() {
  const ciroSonuc = useFirestoreListesi<CiroKaydi>("ciro_kayitlari");
  const gorevSonuc = useFirestoreListesi<Gorev>("gorevler");
  const stokSonuc = useFirestoreListesi<StokUrunu>("stok_urunleri");
  const kasaSonuc = useFirestoreListesi<KasaKaydi>("kasa_defteri");

  const yukleniyor = firebaseYapilandirildi && (
    ciroSonuc.yukleniyor || gorevSonuc.yukleniyor || stokSonuc.yukleniyor || kasaSonuc.yukleniyor
  );

  const ciroKayitlari = firebaseYapilandirildi ? ciroSonuc.veri : MOCK_CIRO_KAYITLARI;
  const gorevler = firebaseYapilandirildi ? gorevSonuc.veri : MOCK_GOREVLER;
  const stokUrunleri = firebaseYapilandirildi ? stokSonuc.veri : MOCK_STOK_URUNLERI;
  const kasaKayitlari = firebaseYapilandirildi ? kasaSonuc.veri : [];

  // Ciro
  const toplamCiro = ciroKayitlari.reduce((t, c) => t + (c.tutar ?? 0), 0);
  const toplamFis = ciroKayitlari.reduce((t, c) => t + (c.fisAdedi ?? 0), 0);
  const ortalamaSepet = toplamFis > 0 ? toplamCiro / toplamFis : 0;

  // Görev
  const toplamGorev = gorevler.length;
  const bekleyen = gorevler.filter((g) => g.durum === "bekliyor").length;
  const devamEden = gorevler.filter((g) => g.durum === "devam_ediyor").length;
  const tamamlanan = gorevler.filter((g) => g.durum === "tamamlandi").length;
  const tamamlanmaOrani = toplamGorev ? Math.round((tamamlanan / toplamGorev) * 100) : 0;

  // Stok
  const toplamUrun = stokUrunleri.length;
  const tukenmisSayisi = stokUrunleri.filter((u) => stokToplamAdet(u) === 0).length;
  const azKalanSayisi = stokUrunleri.filter((u) => { const a = stokToplamAdet(u); return a > 0 && a <= 5; }).length;
  const toplamStokAdet = stokUrunleri.reduce((t, u) => t + stokToplamAdet(u), 0);

  // Kasa
  const kasaGelir = kasaKayitlari.filter((k) => k.tur === "gelir").reduce((t, k) => t + (k.tutar ?? 0), 0);
  const kasaGider = kasaKayitlari.filter((k) => k.tur === "gider").reduce((t, k) => t + (k.tutar ?? 0), 0);
  const kasaBakiye = kasaGelir - kasaGider;

  if (yukleniyor) return <p className="text-sm text-gray-500 text-center py-16">Yükleniyor…</p>;

  return (
    <div className="space-y-4">
      {!firebaseYapilandirildi && (
        <Kart stripRengi="#B4740E">
          <p className="text-sm">Demo modu: Firebase bağlı değil, örnek veriler gösteriliyor.</p>
        </Kart>
      )}

      {/* Ciro */}
      <Kart>
        <p className="text-sm font-semibold mb-3">Ciro</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-lg font-bold">{ciroKayitlari.length === 0 ? "—" : paraFormatla(toplamCiro)}</p>
            <p className="text-[11px] text-gray-500">Toplam Ciro</p>
          </div>
          <div>
            <p className="text-lg font-bold">{toplamFis || "—"}</p>
            <p className="text-[11px] text-gray-500">Toplam Fiş</p>
          </div>
          <div>
            <p className="text-lg font-bold">{ortalamaSepet > 0 ? paraFormatla(ortalamaSepet) : "—"}</p>
            <p className="text-[11px] text-gray-500">Ort. Sepet</p>
          </div>
        </div>
      </Kart>

      {/* Kasa */}
      <Kart>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">Kasa</p>
          <Link href="/kasa-defteri" className="text-xs text-brand-500">Defteri Aç →</Link>
        </div>
        {kasaKayitlari.length === 0 ? (
          <p className="text-sm text-gray-400">Veri yok</p>
        ) : (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold text-signal-done">{paraFormatla(kasaGelir)}</p>
              <p className="text-[11px] text-gray-500">Gelir</p>
            </div>
            <div>
              <p className="text-lg font-bold text-signal-late">{paraFormatla(kasaGider)}</p>
              <p className="text-[11px] text-gray-500">Gider</p>
            </div>
            <div>
              <p className={`text-lg font-bold ${kasaBakiye >= 0 ? "text-signal-done" : "text-signal-late"}`}>
                {paraFormatla(kasaBakiye)}
              </p>
              <p className="text-[11px] text-gray-500">Bakiye</p>
            </div>
          </div>
        )}
      </Kart>

      {/* Stok */}
      <Kart>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">Stok</p>
          <Link href="/stok" className="text-xs text-brand-500">Kataloğu Aç →</Link>
        </div>
        {toplamUrun === 0 ? (
          <p className="text-sm text-gray-400">Veri yok</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold">{toplamUrun}</p>
              <p className="text-[11px] text-gray-500">Ürün Çeşidi</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{toplamStokAdet}</p>
              <p className="text-[11px] text-gray-500">Toplam Adet</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${tukenmisSayisi > 0 ? "text-signal-late" : "text-signal-done"}`}>
                {tukenmisSayisi}
              </p>
              <p className="text-[11px] text-gray-500">Stok Tükenen</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${azKalanSayisi > 0 ? "text-signal-pending" : "text-signal-done"}`}>
                {azKalanSayisi}
              </p>
              <p className="text-[11px] text-gray-500">Az Kalan (≤5)</p>
            </div>
          </div>
        )}
      </Kart>

      {/* Görev */}
      <Kart>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">Görevler</p>
          <span className="text-xs text-gray-500">%{tamamlanmaOrani} tamamlandı</span>
        </div>
        {toplamGorev === 0 ? (
          <p className="text-sm text-gray-400">Veri yok</p>
        ) : (
          <div className="space-y-2.5">
            {([
              { etiket: "Bekliyor", sayi: bekleyen, renk: "bg-signal-pending" },
              { etiket: "Devam Ediyor", sayi: devamEden, renk: "bg-brand-500" },
              { etiket: "Tamamlandı", sayi: tamamlanan, renk: "bg-signal-done" }
            ]).map(({ etiket, sayi, renk }) => (
              <div key={etiket}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">{etiket}</span>
                  <span className="font-medium">{sayi} / {toplamGorev}</span>
                </div>
                <div className="h-2 rounded-full bg-canvas overflow-hidden">
                  <div
                    className={`h-full rounded-full ${renk}`}
                    style={{ width: `${toplamGorev ? Math.max(4, Math.round((sayi / toplamGorev) * 100)) : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Kart>

      <Link href="/kasa-defteri">
        <Kart className="text-center">
          <p className="text-2xl mb-1">📒</p>
          <p className="text-sm font-medium">Kasa Defteri</p>
          <p className="text-xs text-gray-500 mt-0.5">Gelir/gider kayıtlarını yönet</p>
        </Kart>
      </Link>
    </div>
  );
}
