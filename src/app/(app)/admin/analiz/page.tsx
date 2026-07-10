"use client";

import Link from "next/link";
import { useFirestoreListesi } from "@/lib/firestoreOkuma";
import { firebaseYapilandirildi } from "@/lib/firebaseClient";
import { MOCK_CIRO_KAYITLARI, MOCK_GOREVLER } from "@/data/mockData";
import type { CiroKaydi, Gorev } from "@/types";
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

  const yukleniyor = firebaseYapilandirildi && (ciroSonuc.yukleniyor || gorevSonuc.yukleniyor);

  const ciroKayitlari = firebaseYapilandirildi ? ciroSonuc.veri : MOCK_CIRO_KAYITLARI;
  const gorevler = firebaseYapilandirildi ? gorevSonuc.veri : MOCK_GOREVLER;

  const toplamCiro = ciroKayitlari.reduce((t, c) => t + (c.tutar ?? 0), 0);
  const toplamGorev = gorevler.length;
  const tamamlanan = gorevler.filter((g) => g.durum === "tamamlandi").length;
  const tamamlanmaOrani = toplamGorev ? Math.round((tamamlanan / toplamGorev) * 100) : 0;

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

      <Link href="/kasa-defteri">
        <Kart className="text-center">
          <p className="text-2xl mb-1">📒</p>
          <p className="text-sm font-medium">Kasa Defteri</p>
          <p className="text-xs text-gray-500 mt-0.5">Gelir/gider kayıtlarını gör ve yönet</p>
        </Kart>
      </Link>

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
