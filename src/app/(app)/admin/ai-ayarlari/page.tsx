"use client";

import { useEffect, useState } from "react";
import { useFirestoreBelge, belgeYaz } from "@/lib/firestoreOkuma";
import { firebaseYapilandirildi } from "@/lib/firebaseClient";
import type { AiAyarlari } from "@/types";
import { aiSaglayiciyiBul } from "@/lib/aiClient";
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
  const [saglayici, setSaglayici] = useState<"google" | "openrouter">("google");
  const [googleApiKey, setGoogleApiKey] = useState("");
  const [googleModel, setGoogleModel] = useState("");
  const [ilkYuklemeYapildi, setIlkYuklemeYapildi] = useState(false);
  const [gosterKey, setGosterKey] = useState(false);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const [durumMesaji, setDurumMesaji] = useState<string | null>(null);

  useEffect(() => {
    if (!ilkYuklemeYapildi && !yukleniyor) {
      setApiKey(ayar?.apiKey ?? "");
      setModel(ayar?.model ?? "");
      setSaglayici(aiSaglayiciyiBul(ayar ?? {}));
      setGoogleApiKey(ayar?.googleApiKey ?? "");
      setGoogleModel(ayar?.googleModel ?? "");
      setIlkYuklemeYapildi(true);
    }
  }, [ayar, yukleniyor, ilkYuklemeYapildi]);

  async function kaydet(e: React.FormEvent) {
    e.preventDefault();
    setKaydediliyor(true);
    setDurumMesaji(null);
    try {
      await belgeYaz("ayarlar", "ai", {
        saglayici,
        googleApiKey: googleApiKey.trim(),
        googleModel: googleModel.trim(),
        apiKey: apiKey.trim(),
        model: model.trim()
      });
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
          WAS AI, seçtiğin sağlayıcının API anahtarı ve manuel model adıyla çalışır. Bu ayar
          Firestore'da tek bir belgede saklanır ve tüm kullanıcılar (personel, müdür, admin)
          aynı ayarı ortak kullanır.
        </p>
      </Kart>

      <form onSubmit={kaydet}>
        <Kart>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">AI Sağlayıcısı</label>
              <select
                value={saglayici}
                onChange={(e) => setSaglayici(e.target.value as typeof saglayici)}
                className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-sm bg-surface"
              >
                <option value="google">Google AI Studio (Gemini)</option>
                <option value="openrouter">OpenRouter</option>
              </select>
            </div>
            {saglayici === "google" ? (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Google AI Studio API Key</label>
                  <div className="flex gap-2">
                    <input
                      type={gosterKey ? "text" : "password"}
                      value={googleApiKey}
                      onChange={(e) => setGoogleApiKey(e.target.value)}
                      placeholder="AIza..."
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
                  <label className="block text-sm font-medium mb-1.5">Google Gemini Modeli</label>
                  <input
                    value={googleModel}
                    onChange={(e) => setGoogleModel(e.target.value)}
                    placeholder="gemini-2.5-flash"
                    className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-sm font-mono"
                  />
                  <p className="text-xs text-gray-400 mt-1.5">Google AI Studio'da kullanılabilir model kimliğini aynen yaz.</p>
                </div>
              </>
            ) : (
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
            )}
            {saglayici === "openrouter" && (
              <div>
                <label className="block text-sm font-medium mb-1.5">OpenRouter Modeli</label>
                <input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="openai/gpt-4o-mini"
                  className="focus-ring w-full rounded-xl border border-line px-3.5 py-2.5 text-sm font-mono"
                />
                <p className="text-xs text-gray-400 mt-1.5">OpenRouter'daki model kimliğini aynen yaz.</p>
              </div>
            )}
          </div>

          {durumMesaji && (
            <p className={`text-sm mt-3 ${durumMesaji.startsWith("Hata") ? "text-signal-late" : "text-signal-done"}`}>
              {durumMesaji}
            </p>
          )}

          <Buton
            type="submit"
            tamGenislik
            className="mt-4"
            disabled={kaydediliyor || (saglayici === "google" ? !googleApiKey || !googleModel : !apiKey || !model)}
          >
            {kaydediliyor ? "Kaydediliyor…" : "Kaydet"}
          </Buton>
        </Kart>
      </form>

      <Kart stripRengi="#B4740E">
        <p className="text-xs text-gray-600 leading-relaxed">
          ⚠️ Bu site tamamen statik (sunucusuz) çalıştığı için anahtar tarayıcı tarafında
          kullanılır. Personel/müdür ekranlarında hiçbir yerde görünmez, sadece bu admin
          sayfasından değiştirilebilir; ancak teknik olarak tarayıcı geliştirici araçlarından
          erişilebilir olduğunu bilerek ilerle. Google AI Studio veya OpenRouter hesabında
          kullanım limiti koymanı öneririm.
        </p>
      </Kart>
    </div>
  );
}
