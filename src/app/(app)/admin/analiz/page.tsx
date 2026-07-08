"use client";

import { MOCK_CIRO_KAYITLARI, MOCK_MAGAZALAR, MOCK_GOREVLER } from "@/data/mockData";
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
  const maxCiro = Math.max(...MOCK_CIRO_KAYITLARI.map((c) => c.tutar));
  const toplamGorev = MOCK_GOREVLER.length;
  const tamamlanan = MOCK_GOREVLER.filter((g) => g.durum === "tamamlandi").length;
  const tamamlanmaOrani = toplamGorev ? Math.round((tamamlanan / toplamGorev) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Kart>
          <p className="text-2xl font-semibold">{paraFormatla(MOCK_CIRO_KAYITLARI.reduce((t, c) => t + c.tutar, 0))}</p>
          <p className="text-xs text-gray-500 mt-0.5">Bugünkü toplam ciro</p>
        </Kart>
        <Kart>
          <p className="text-2xl font-semibold">%{tamamlanmaOrani}</p>
          <p className="text-xs text-gray-500 mt-0.5">Görev tamamlanma oranı</p>
        </Kart>
      </div>

      <Kart>
        <p className="text-sm font-semibold mb-4">Mağaza Bazında Ciro (bugün)</p>
        <div className="space-y-3">
          {MOCK_CIRO_KAYITLARI.map((c) => {
            const magaza = MOCK_MAGAZALAR.find((m) => m.id === c.magazaId);
            const genislik = Math.max(6, Math.round((c.tutar / maxCiro) * 100));
            return (
              <div key={c.id}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">{magaza?.ad}</span>
                  <span className="font-medium">{paraFormatla(c.tutar)}</span>
                </div>
                <div className="h-2 rounded-full bg-canvas overflow-hidden">
                  <div className="h-full bg-brand-500 rounded-full" style={{ width: `${genislik}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Kart>

      <Kart>
        <p className="text-sm font-semibold mb-4">Görev Durum Dağılımı</p>
        <div className="space-y-3">
          {(["bekliyor", "devam_ediyor", "tamamlandi"] as const).map((durum) => {
            const sayi = MOCK_GOREVLER.filter((g) => g.durum === durum).length;
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
      </Kart>

      <p className="text-xs text-gray-400 text-center px-4">
        Bu veriler demo amaçlıdır. Firebase bağlandığında gerçek zamanlı verilerle güncellenecektir.
      </p>
    </div>
  );
}
