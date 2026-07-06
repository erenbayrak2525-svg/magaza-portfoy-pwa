"use client";

import { MOCK_ILETISIM } from "@/data/mockData";
import Kart from "@/components/ui/Kart";

export default function IletisimSayfasi() {
  return (
    <div className="space-y-2">
      {MOCK_ILETISIM.map((kisi) => (
        <Kart key={kisi.id}>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{kisi.adSoyad}</p>
              <p className="text-xs text-gray-500">{kisi.rol}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={`tel:${kisi.telefon}`}
                className="focus-ring w-10 h-10 flex items-center justify-center rounded-full bg-brand-50 text-brand-500 text-lg"
                aria-label={`${kisi.adSoyad} ara`}
              >
                📞
              </a>
              {kisi.whatsapp && (
                <a
                  href={`https://wa.me/${kisi.whatsapp.replace("+", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="focus-ring w-10 h-10 flex items-center justify-center rounded-full bg-signal-doneBg text-signal-done text-lg"
                  aria-label={`${kisi.adSoyad} WhatsApp`}
                >
                  💬
                </a>
              )}
            </div>
          </div>
        </Kart>
      ))}
    </div>
  );
}
