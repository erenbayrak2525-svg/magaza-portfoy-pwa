import type { AiAyarlari } from "@/types";

export interface AiIleti {
  rol: "user" | "assistant";
  icerik: string;
}

export function aiSaglayiciyiBul(ayar: AiAyarlari): "google" | "openrouter" {
  if (ayar.saglayici) return ayar.saglayici;
  return ayar.googleApiKey ? "google" : "openrouter";
}

export function aiAnahtarVeModeliBul(ayar: AiAyarlari): { anahtar: string; model: string } {
  if (aiSaglayiciyiBul(ayar) === "google") {
    return {
      anahtar: ayar.googleApiKey?.trim() ?? "",
      model: (ayar.googleModel ?? ayar.model ?? "").trim()
    };
  }
  return {
    anahtar: ayar.apiKey?.trim() ?? "",
    model: ayar.model?.trim() ?? ""
  };
}

export function aiAyarlariTamMi(ayar?: AiAyarlari | null): boolean {
  if (!ayar) return false;
  const { anahtar, model } = aiAnahtarVeModeliBul(ayar);
  return Boolean(anahtar && model);
}

export async function aiCevapOlustur(
  ayar: AiAyarlari,
  sistemMesaji: string,
  iletiler: AiIleti[]
): Promise<string> {
  const saglayici = aiSaglayiciyiBul(ayar);
  const { anahtar, model } = aiAnahtarVeModeliBul(ayar);
  if (!anahtar || !model) throw new Error("WAS AI anahtarı veya modeli eksik.");

  if (saglayici === "google") {
    const yanit = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(anahtar)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: sistemMesaji }] },
          contents: iletiler.map((ileti) => ({
            role: ileti.rol === "assistant" ? "model" : "user",
            parts: [{ text: ileti.icerik }]
          }))
        })
      }
    );

    if (!yanit.ok) {
      const hataMetni = await yanit.text().catch(() => "");
      throw new Error(`Google AI Studio hata verdi (${yanit.status}): ${hataMetni.slice(0, 240) || "detay yok"}`);
    }

    const veri = await yanit.json();
    const cevap = veri?.candidates?.[0]?.content?.parts
      ?.map((parca: { text?: string }) => parca.text ?? "")
      .join("")
      .trim();
    return cevap || "Cevap alınamadı.";
  }

  const yanit = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${anahtar}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: sistemMesaji },
        ...iletiler.map((ileti) => ({ role: ileti.rol, content: ileti.icerik }))
      ]
    })
  });

  if (!yanit.ok) {
    const hataMetni = await yanit.text().catch(() => "");
    throw new Error(`OpenRouter hata verdi (${yanit.status}): ${hataMetni.slice(0, 240) || "detay yok"}`);
  }

  const veri = await yanit.json();
  return veri?.choices?.[0]?.message?.content?.trim() || "Cevap alınamadı.";
}
