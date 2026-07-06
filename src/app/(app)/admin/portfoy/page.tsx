"use client";

import { useState } from "react";
import Link from "next/link";
import { MOCK_MAGAZALAR } from "@/data/mockData";
import Kart from "@/components/ui/Kart";
import Buton from "@/components/ui/Buton";

export default function PortfoyYonetimiSayfasi() {
  const [formAcik, setFormAcik] = useState(false);
  const [ad, setAd] = useState("");
  const [kod, setKod] = useState("");
  const [adres, setAdres] = useState("");
  const [eklendi, setEklendi] = useState(false);

  function ekle(e: React.FormEvent) {
    e.preventDefault();
    // TODO: Firestore 'magazalar' koleksiyonuna belge ekle. Şimdilik sadece demo geri bildirimi gösteriyoruz;
    // gerçek listeye eklemek için mockData yerine Firestore'dan çekilen veriyi kullanmalısın.
    setEklendi(true);
    setAd("");
    setKod("");
    setAdres("");
    setFormAcik(false);
  }

  return (
    <div className="space-y-4">
      <Buton varyant="ikincil" tamGenislik onClick={() => setFormAcik((v) => !v)}>
        {formAcik ? "Vazgeç" : "+ Yeni Mağaza Ekle"}
      </Buton>

      {formAcik && (
        <form onSubmit={ekle}>
          <Kart>
            <div className="space-y-3">
              <input
                value={ad}
                onChange={(e) => setAd(e.target.value)}
                placeholder="Mağaza adı"
                className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-sm"
                required
              />
              <input
                value={kod}
                onChange={(e) => setKod(e.target.value)}
                placeholder="Mağaza kodu (Nebim)"
                className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-sm"
                required
              />
              <input
                value={adres}
                onChange={(e) => setAdres(e.target.value)}
                placeholder="Adres"
                className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-sm"
                required
              />
              <Buton type="submit" tamGenislik>Kaydet</Buton>
            </div>
          </Kart>
        </form>
      )}

      {eklendi && (
        <Kart stripRengi="#0F7A4C">
          <p className="text-sm">Demo modda kaydedildi. Firebase bağlanınca gerçek portföye eklenecek.</p>
        </Kart>
      )}

      <div className="space-y-2">
        {MOCK_MAGAZALAR.map((m) => (
          <Link key={m.id} href={`/magazalar/detay?id=${m.id}`}>
            <Kart>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{m.ad}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{m.kod} · {m.bolge}</p>
                </div>
                <span className="text-gray-300">›</span>
              </div>
            </Kart>
          </Link>
        ))}
      </div>
    </div>
  );
}
