"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Rol } from "@/types";

interface MenuOgesi {
  href: string;
  etiket: string;
  ikon: string;
}

const MENU: Record<Rol, MenuOgesi[]> = {
  personel: [
    { href: "/panel", etiket: "Panel", ikon: "🏠" },
    { href: "/gorevler", etiket: "Görevler", ikon: "✅" },
    { href: "/formlar", etiket: "Formlar", ikon: "📝" },
    { href: "/profil", etiket: "Profil", ikon: "👤" }
  ],
  bolge_muduru: [
    { href: "/panel", etiket: "Panel", ikon: "🏠" },
    { href: "/magazalar", etiket: "Mağazalar", ikon: "🏬" },
    { href: "/gorevler", etiket: "Görevler", ikon: "✅" },
    { href: "/formlar", etiket: "Formlar", ikon: "📝" },
    { href: "/profil", etiket: "Profil", ikon: "👤" }
  ],
  admin: [
    { href: "/panel", etiket: "Panel", ikon: "🏠" },
    { href: "/magazalar", etiket: "Mağazalar", ikon: "🏬" },
    { href: "/admin/gorev-atama", etiket: "Görev Ata", ikon: "📤" },
    { href: "/admin/analiz", etiket: "Analiz", ikon: "📊" },
    { href: "/profil", etiket: "Profil", ikon: "👤" }
  ]
};

export default function AltMenu({ rol }: { rol: Rol }) {
  const yol = usePathname();
  const ogeler = MENU[rol];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 bg-surface border-t border-line flex justify-around"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      {ogeler.map((oge) => {
        const aktif = yol === oge.href || yol?.startsWith(oge.href + "/");
        return (
          <Link
            key={oge.href}
            href={oge.href}
            className={`focus-ring flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs ${
              aktif ? "text-brand-500 font-semibold" : "text-gray-500"
            }`}
          >
            <span className="text-lg leading-none">{oge.ikon}</span>
            {oge.etiket}
          </Link>
        );
      })}
    </nav>
  );
}
