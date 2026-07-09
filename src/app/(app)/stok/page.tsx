"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useFirestoreListesi } from "@/lib/firestoreOkuma";
import { firebaseYapilandirildi } from "@/lib/firebaseClient";
import { MOCK_STOK_URUNLERI } from "@/data/mockData";
import { stokToplamAdet, type StokUrunu } from "@/types";
import Kart from "@/components/ui/Kart";

export default function StokKatalogSayfasi() {
  const { veri: canliUrunler, yukleniyor, hata } = useFirestoreListesi<StokUrunu>("stok_urunleri");
  const [arama, setArama] = useState("");

  const tumUrunler = firebaseYapilandirildi ? canliUrunler : MOCK_STOK_URUNLERI;

  const urunler = useMemo(() => {
    const q = arama.trim().toLowerCase();
    if (!q) return tumUrunler;
    return tumUrunler.filter(
      (u) => (u.urunAdi ?? "").toLowerCase().includes(q) || (u.urunKodu ?? "").toLowerCase().includes(q)
    );
  }, [tumUrunler, arama]);

  if (!firebaseYapilandirildi) {
    return (
      <div className="space-y-3">
        <Kart stripRengi="#B4740E">
          <p className="text-sm">Demo modu: Firebase bağlı değil, örnek ürünler gösteriliyor.</p>
        </Kart>
        <StokListesi urunler={urunler} />
      </div>
    );
  }

  if (yukleniyor) {
    return <p className="text-sm text-gray-500 text-center py-16">Yükleniyor…</p>;
  }

  if (hata) {
    return (
      <Kart stripRengi="#C4341E">
        <p className="text-sm text-signal-late">Veri okunamadı: {hata}</p>
        <p className="text-xs text-gray-500 mt-1">Firestore güvenlik kurallarını kontrol et.</p>
      </Kart>
    );
  }

  if (tumUrunler.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-gray-500">Henüz ürün yok.</p>
        <p className="text-xs text-gray-400 mt-1">Admin → Stok İçe Aktar (HTML) ile ürün yükleyebilirsin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <input
        value={arama}
        onChange={(e) => setArama(e.target.value)}
        placeholder="Ürün adı veya kodu ara…"
        className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-sm bg-surface"
      />
      <p className="text-xs text-gray-500 px-1">
        {urunler.length} ürün · görsel ve etiket eklemek için bir ürüne dokun
      </p>
      <StokListesi urunler={urunler} />
    </div>
  );
}

function StokListesi({ urunler }: { urunler: StokUrunu[] }) {
  if (urunler.length === 0) {
    return <p className="text-sm text-gray-500 text-center py-10">Aramayla eşleşen ürün yok.</p>;
  }
  return (
    <div className="space-y-2">
      {urunler.map((urun) => {
        const toplamAdet = stokToplamAdet(urun);
        return (
          <Link key={urun.id} href={`/stok/detay?id=${urun.id}`}>
            <Kart stripRengi={toplamAdet === 0 ? "#C4341E" : toplamAdet < 10 ? "#B4740E" : "#0F7A4C"}>
              <div className="flex items-center gap-3">
                {urun.gorselUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={urun.gorselUrl} alt={urun.urunAdi ?? ""} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-canvas border border-dashed border-line flex items-center justify-center text-gray-300 text-lg shrink-0">
                    📦
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{urun.urunAdi || "(isimsiz ürün)"}</p>
                  <p className="text-xs text-gray-500 font-mono">
                    {urun.urunKodu || "—"} · {urun.varyantlar?.length ?? 0} varyant
                  </p>
                  {urun.etiketler?.length > 0 && (
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
