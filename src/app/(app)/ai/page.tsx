"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { useFirestoreBelge, useFirestoreListesi } from "@/lib/firestoreOkuma";
import { firebaseYapilandirildi } from "@/lib/firebaseClient";
import { stokBaglamOlustur } from "@/lib/stokBaglamOlustur";
import type { AiAyarlari, StokUrunu } from "@/types";
import Kart from "@/components/ui/Kart";
import Buton from "@/components/ui/Buton";

interface SohbetMesaji {
  rol: "user" | "assistant";
  icerik: string;
}

const SISTEM_ONEKI = `Sen WAS AI'sın — Wasmoda (moda/giyim) mağazasının personeli, müdürü ve
yöneticisi için çalışan bir yapay zeka asistansın. Türkçe, samimi ve kısa/öz cevaplar ver.
Stokla ilgili soru gelirse sana verilen ürün listesini kullan, uydurma bilgi verme; listede
olmayan bir şeyi bilmiyorsan bunu açıkça söyle. Kombin/stil önerisi istenirse, elindeki gerçek
ürünlerden (varsa) somut önerilerde bulun.`;

export default function AiSayfasi() {
  const kullanici = useAuthStore((s) => s.kullanici);
  const { veri: ayar, yukleniyor: ayarYukleniyor } = useFirestoreBelge<AiAyarlari>("ayarlar", "ai");
  const { veri: canliUrunler } = useFirestoreListesi<StokUrunu>("stok_urunleri");
  const urunler = firebaseYapilandirildi ? canliUrunler : [];

  const [mesajlar, setMesajlar] = useState<SohbetMesaji[]>([]);
  const [girdi, setGirdi] = useState("");
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const sonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sonRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mesajlar, gonderiliyor]);

  const ayarliMi = Boolean(ayar?.apiKey && ayar?.model);

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    const soru = girdi.trim();
    if (!soru || !ayar) return;

    const yeniMesajlar: SohbetMesaji[] = [...mesajlar, { rol: "user", icerik: soru }];
    setMesajlar(yeniMesajlar);
    setGirdi("");
    setGonderiliyor(true);
    setHata(null);

    try {
      const baglam = stokBaglamOlustur(soru, urunler);
      const sistemMesaji = `${SISTEM_ONEKI}\n\nMağaza stok bilgisi:\n${baglam}`;

      const yanit = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${ayar.apiKey}`
        },
        body: JSON.stringify({
          model: ayar.model,
          messages: [
            { role: "system", content: sistemMesaji },
            ...yeniMesajlar.slice(-8).map((m) => ({ role: m.rol, content: m.icerik }))
          ]
        })
      });

      if (!yanit.ok) {
        const hataMetni = await yanit.text().catch(() => "");
        throw new Error(`OpenRouter hata verdi (${yanit.status}): ${hataMetni.slice(0, 200) || "detay yok"}`);
      }

      const veri = await yanit.json();
      const cevap: string = veri?.choices?.[0]?.message?.content?.trim() || "Cevap alınamadı.";
      setMesajlar((m) => [...m, { rol: "assistant", icerik: cevap }]);
    } catch (err) {
      setHata(err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu.");
    } finally {
      setGonderiliyor(false);
    }
  }

  if (ayarYukleniyor) {
    return <p className="text-sm text-gray-500 text-center py-16">Yükleniyor…</p>;
  }

  if (!ayarliMi) {
    return (
      <div className="text-center py-16 px-4">
        <p className="text-3xl mb-3">✨</p>
        <p className="text-sm font-medium">WAS AI henüz ayarlanmadı</p>
        <p className="text-xs text-gray-500 mt-1">
          {kullanici?.rol === "admin"
            ? "Aşağıdan API anahtarını ve modeli gir."
            : "Admin'in API anahtarı girmesi gerekiyor."}
        </p>
        {kullanici?.rol === "admin" && (
          <Link href="/admin/ai-ayarlari" className="inline-block mt-4">
            <Buton>WAS AI Ayarlarına Git</Buton>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)]">
      <div className="flex-1 overflow-y-auto space-y-3 pb-3">
        {mesajlar.length === 0 && (
          <Kart>
            <p className="text-sm text-gray-600">
              👋 Merhaba{kullanici ? `, ${kullanici.adSoyad}` : ""}! Ben WAS AI. Stok hakkında soru
              sorabilir ("kırmızı elbise var mı, kaç adet?") veya kombin önerisi isteyebilirsin.
            </p>
          </Kart>
        )}

        {mesajlar.map((m, i) => (
          <div key={i} className={`flex ${m.rol === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                m.rol === "user" ? "bg-brand-500 text-white" : "bg-surface border border-line"
              }`}
            >
              {m.icerik}
            </div>
          </div>
        ))}

        {gonderiliyor && (
          <div className="flex justify-start">
            <div className="bg-surface border border-line rounded-2xl px-4 py-2.5 text-sm text-gray-400">
              WAS AI yazıyor…
            </div>
          </div>
        )}

        {hata && (
          <Kart stripRengi="#C4341E">
            <p className="text-sm text-signal-late">{hata}</p>
          </Kart>
        )}

        <div ref={sonRef} />
      </div>

      <form onSubmit={gonder} className="flex gap-2 pt-2 border-t border-line">
        <input
          value={girdi}
          onChange={(e) => setGirdi(e.target.value)}
          placeholder="WAS AI'ye bir şey sor…"
          className="focus-ring flex-1 rounded-xl border border-line px-3.5 py-2.5 text-sm"
        />
        <Buton type="submit" disabled={gonderiliyor || !girdi.trim()}>
          Gönder
        </Buton>
      </form>
    </div>
  );
}
