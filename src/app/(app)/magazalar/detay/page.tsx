"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MOCK_MAGAZALAR } from "@/data/mockData";
import Kart from "@/components/ui/Kart";

const BELGE_ETIKET: Record<string, string> = {
  kira_sozlesmesi: "Kira Sözleşmesi",
  demirbas_listesi: "Demirbaş Listesi",
  teknik_belge: "Teknik Belge",
  diger: "Diğer"
};

function paraFormatla(n: number) {
  return n.toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });
}

function MagazaDetayIcerik() {
  const params = useSearchParams();
  const magaza = MOCK_MAGAZALAR.find((m) => m.id === params.get("id"));

  if (!magaza) return <p className="text-sm text-gray-500 text-center py-16">Mağaza bulunamadı.</p>;

  return (
    <div className="space-y-4">
      <Kart>
        <h2 className="font-semibold">{magaza.ad}</h2>
        <p className="text-xs text-gray-500 mt-1">{magaza.adres}</p>
        <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
          <div>
            <p className="text-xs text-gray-500">Mağaza Kodu</p>
            <p className="font-mono font-medium">{magaza.kod}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Metrekare</p>
            <p className="font-medium">{magaza.metrekare} m²</p>
          </div>
        </div>
      </Kart>

      <Kart>
        <p className="text-sm font-semibold mb-3">Kira Sözleşmesi</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Başlangıç</span>
            <span className="font-medium">{magaza.kiraBaslangic}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Bitiş</span>
            <span className="font-medium">{magaza.kiraBitis}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Aylık Kira</span>
            <span className="font-medium">{magaza.kiraTutari ? paraFormatla(magaza.kiraTutari) : "—"}</span>
          </div>
        </div>
      </Kart>

      <section>
        <h3 className="text-sm font-semibold mb-2">Belgeler ve Demirbaş Arşivi</h3>
        {magaza.belgeler.length === 0 ? (
          <p className="text-sm text-gray-500">Henüz belge yüklenmemiş.</p>
        ) : (
          <div className="space-y-2">
            {magaza.belgeler.map((b) => (
              <Kart key={b.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{b.ad}</p>
                    <p className="text-xs text-gray-500">{BELGE_ETIKET[b.tip]} · {b.yuklemeTarihi}</p>
                  </div>
                  <span className="text-brand-500 text-xs font-medium">Görüntüle</span>
                </div>
              </Kart>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function MagazaDetaySayfasi() {
  return (
    <Suspense fallback={null}>
      <MagazaDetayIcerik />
    </Suspense>
  );
}
