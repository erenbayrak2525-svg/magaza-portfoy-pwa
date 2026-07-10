"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { useFirestoreListesi } from "@/lib/firestoreOkuma";
import { firebaseYapilandirildi } from "@/lib/firebaseClient";
import { MOCK_GOREVLER } from "@/data/mockData";
import Kart from "@/components/ui/Kart";
import DurumRozeti, { stripRengi } from "@/components/ui/DurumRozeti";
import type { GorevDurumu, Gorev } from "@/types";

const FILTRELER: { anahtar: "hepsi" | GorevDurumu; etiket: string }[] = [
  { anahtar: "hepsi", etiket: "Hepsi" },
  { anahtar: "bekliyor", etiket: "Bekliyor" },
  { anahtar: "devam_ediyor", etiket: "Devam Ediyor" },
  { anahtar: "tamamlandi", etiket: "Tamamlandı" }
];

export default function GorevlerSayfasi() {
  const kullanici = useAuthStore((s) => s.kullanici);
  const [filtre, setFiltre] = useState<(typeof FILTRELER)[number]["anahtar"]>("hepsi");
  const { veri: canliGorevler, yukleniyor, yenile } = useFirestoreListesi<Gorev>("gorevler");

  const tumGorevler = firebaseYapilandirildi ? canliGorevler : MOCK_GOREVLER;

  const gorevler = useMemo(() => {
    let liste = tumGorevler;
    if (kullanici?.rol === "personel") {
      liste = liste.filter((g) => g.atananKullaniciId === kullanici.id);
    }
    if (filtre !== "hepsi") liste = liste.filter((g) => g.durum === filtre);
    return liste;
  }, [tumGorevler, kullanici, filtre]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 flex-1">
          {FILTRELER.map((f) => (
            <button
              key={f.anahtar}
              onClick={() => setFiltre(f.anahtar)}
              className={`focus-ring whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-medium border ${
                filtre === f.anahtar
                  ? "bg-brand-500 text-white border-brand-500"
                  : "bg-surface text-gray-600 border-line"
              }`}
            >
              {f.etiket}
            </button>
          ))}
        </div>
        <button onClick={yenile} aria-label="Listeyi yenile" className="focus-ring shrink-0 text-lg text-gray-500 px-1">
          ↻
        </button>
      </div>

      <div className="space-y-2">
        {yukleniyor && <p className="text-sm text-gray-500 text-center py-10">Yükleniyor…</p>}
        {!yukleniyor && gorevler.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-10">Bu filtreye uyan görev yok.</p>
        )}
        {gorevler.map((g) => (
          <Link key={g.id} href={`/gorevler/detay?id=${g.id}`}>
            <Kart stripRengi={stripRengi(g.durum)}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{g.baslik}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Son: {g.sonTarih}</p>
                </div>
                <DurumRozeti durum={g.durum} />
              </div>
            </Kart>
          </Link>
        ))}
      </div>
    </div>
  );
}
