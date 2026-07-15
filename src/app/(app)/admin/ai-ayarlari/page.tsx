"use client";

import { useEffect, useState } from "react";
import { useFirestoreBelge, belgeYaz } from "@/lib/firestoreOkuma";
import { firebaseYapilandirildi } from "@/lib/firebaseClient";
import type { AiAyarlari } from "@/types";
import Kart from "@/components/ui/Kart";
import Buton from "@/components/ui/Buton";
import AdminKorumasi from "@/components/AdminKorumasi";

export default function AiAyarlariSayfasi() {
  return (
    <AdminKorumasi>
      <AiAyarlariIcerik />
    </AdminKorumasi>
  );
}

function AiAyarlariIcerik() {
  const { veri: ayar, yukleniyor } = useFirestoreBelge<AiAyarlari>("ayarlar", "ai");

  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [ilkYuklemeYapildi, setIlkYuklemeYapildi] = useState(false);
  const [gosterKey, setGosterKey] = useState(false);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [durumMesaji, setDurumMesaji] = useState<string | null>(null);

  useEffect(() => {
    if (!ilkYuklemeYapildi && !yukleniyor) {
      setApiKey(ayar?.apiKey ?? "");
      setModel(ayar?.model ?? "");
      setIlkYuklemeYapildi(true);
    }
  }, [ayar, yukleniyor, ilkYuklemeYapildi]);

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    setKaydediliyor(true);
    setDurumMesaji(null);
    try {
      await belgeYaz("ayarlar", "ai", { apiKey: apiKey.trim(), model: model.trim() });
      setDurumMesaji("Kaydedildi. WAS AI artık bu anahtar ve modelle çalışacak.");
    } catch (err) {
      setDurumMesaji(err instanceof Error ? `Hata: ${err.message}` : "Kaydedilemedi.");
    } finally {
      setKaydediliyor(false);
    }
  }

  return (
    <div className="space-y-4">
      {!firebaseYapilandirildi && (
        <Kart stripRengi="#B4740E">
          <p className="text-sm">Demo modu: Firebase bağlı değil, kayıt gerçekleşmez.</p>
        </Kart>
      )}

      <Kart>
        <p className="text-sm text-gray-600 leading-relaxed">
          WAS AI, buraya girdiğin OpenRouter API anahtarı ve model adıyla çalışır. Bu ayar
          Firestore'da tek bir belgede saklanır ve tüm kullanıcılar (personel, müdür, admin)
          aynı anahtarı ortak kullanır — herkes ayrı ayrı key girmez, sadece sen buradan
          yönetirsin.
        </p>
      </Kart>

      <form onSubmit={kaydet}>
        <Kart>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">OpenRouter API Anahtarı</label>
              <div className="flex gap-2">
                <input
                  type={gosterKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-or-v1-..."
                  className="focus-ring flex-1 rounded-xl border border-line px-3.5 py-2.5 text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() => setGosterKey((v) => !v)}
                  className="focus-ring px-3 rounded-xl border border-line text-xs text-gray-500 shrink-0"
                >
                  {gosterKey ? "Gizle" : "Göster"}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Model</label>
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="ör. openai/gpt-4o-mini"
                className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-sm font-mono"
              />
              <p className="text-xs text-gray-400 mt-1.5">
                OpenRouter'daki model kimliğini aynen yaz (ör. anthropic/claude-3.5-haiku,
                openai/gpt-4o-mini, google/gemini-2.0-flash-001).
              </p>
            </div>
          </div>

          {durumMesaji && (
            <p className={`text-sm mt-3 ${durumMesaji.startsWith("Hata") ? "text-signal-late" : "text-signal-done"}`}>
              {durumMesaji}
            </p>
          )}

          <Buton type="submit" tamGenislik className="mt-4" disabled={kaydediliyor || !apiKey || !model}>
            {kaydediliyor ? "Kaydediliyor…" : "Kaydet"}
          </Buton>
        </Kart>
      </form>

      <Kart stripRengi="#B4740E">
        <p className="text-xs text-gray-600 leading-relaxed">
          ⚠️ Bu site tamamen statik (sunucusuz) çalıştığı için anahtar tarayıcı tarafında
          kullanılır. Personel/müdür ekranlarında hiçbir yerde görünmez, sadece bu admin
          sayfasından değiştirilebilir — ama teknik olarak tarayıcı geliştirici araçlarından
          erişilebilir olduğunu bilerek ilerle. OpenRouter hesabında bir harcama limiti
          koymanı öneririm.
        </p>
      </Kart>
    </div>
  );
}
