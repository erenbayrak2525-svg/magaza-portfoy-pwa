"use client";

import Link from "next/link";
import { MOCK_MAGAZALAR } from "@/data/mockData";
import Kart from "@/components/ui/Kart";

export default function MagazalarSayfasi() {
  return (
    <div className="space-y-2">
      {MOCK_MAGAZALAR.map((m) => (
        <Link key={m.id} href={`/magazalar/detay?id=${m.id}`}>
          <Kart>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{m.ad}</p>
                <p className="text-xs text-gray-500 mt-0.5">{m.kod} · {m.bolge} · {m.metrekare} m²</p>
              </div>
              <span className="text-gray-300">›</span>
            </div>
          </Kart>
        </Link>
      ))}
    </div>
  );
}
