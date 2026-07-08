"use client";

import Link from "next/link";
import { MOCK_STOK_URUNLERI } from "@/data/mockData";
import { stokToplamAdet } from "@/types";
import Kart from "@/components/ui/Kart";

export default function StokKatalogSayfasi() {
  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 px-1">
        {MOCK_STOK_URUNLERI.length} ürün · görsel ve etiket eklemek için bir ürüne dokun
      </p>
      {MOCK_STOK_URUNLERI.map((urun) => {
        const toplamAdet = stokToplamAdet(urun);
        return (
          <Link key={urun.id} href={`/stok/detay?id=${urun.id}`}>
            <Kart stripRengi={toplamAdet === 0 ? "#C4341E" : toplamAdet < 10 ? "#B4740E" : "#0F7A4C"}>
              <div className="flex items-center gap-3">
                {urun.gorselUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={urun.gorselUrl} alt={urun.urunAdi} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-canvas border border-dashed border-line flex items-center justify-center text-gray-300 text-lg shrink-0">
                    📦
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{urun.urunAdi}</p>
                  <p className="text-xs text-gray-500 font-mono">
                    {urun.urunKodu} · {urun.varyantlar.length} varyant
                  </p>
                  {urun.etiketler.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {urun.etiketler.map((e) => (
                        <span key={e} className="text-[10px] bg-canvas text-gray-500 rounded-full px-2 py-0.5">
                          {e}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-sm font-semibold shrink-0">{toplamAdet} adet</span>
              </div>
            </Kart>
          </Link>
        );
      })}
    </div>
  );
}
