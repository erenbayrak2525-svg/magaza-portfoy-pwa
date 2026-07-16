"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Rol } from "@/types";

interface MenuOgesi {
  href: string;
  etiket: string;
  ikon: string;
  vurgulu?: boolean; // ortadaki WAS AI butonu için özel görünüm
}

const MENU: Record<Rol, MenuOgesi[]> = {
  personel: [
    { href: "/panel", etiket: "Panel", ikon: "🏠" },
    { href: "/gorevler", etiket: "Görevler", ikon: "✅" },
    { href: "/ai", etiket: "WAS AI", ikon: "✨", vurgulu: true },
    { href: "/formlar", etiket: "Formlar", ikon: "📝" },
    { href: "/profil", etiket: "Profil", ikon: "👤" }
  ],
  bolge_muduru: [
    { href: "/panel", etiket: "Panel", ikon: "🏠" },
    { href: "/gorevler", etiket: "Görevler", ikon: "✅" },
    { href: "/ai", etiket: "WAS AI", ikon: "✨", vurgulu: true },
    { href: "/formlar", etiket: "Formlar", ikon: "📝" },
    { href: "/profil", etiket: "Profil", ikon: "👤" }
  ],
  admin: [
    { href: "/panel", etiket: "Panel", ikon: "🏠" },
    { href: "/stok", etiket: "Stok", ikon: "🏷️" },
    { href: "/ai", etiket: "WAS AI", ikon: "✨", vurgulu: true },
    { href: "/admin/gorev-atama", etiket: "Görev Ata", ikon: "📤" },
    { href: "/profil", etiket: "Profil", ikon: "👤" }
  ]
};

export default function AltMenu({ rol }: { rol: Rol }) {
  const yol = usePathname();
  const ogeler = MENU[rol];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 bg-surface border-t border-line flex justify-around items-end"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      {ogeler.map((oge) => {
        const aktif = yol === oge.href || yol?.startsWith(oge.href + "/");

        if (oge.vurgulu) {
          return (
            <Link
              key={oge.href}
              href={oge.href}
              className="focus-ring flex-1 flex flex-col items-center gap-0.5 pb-2 -mt-5"
            >
              <span
                className={`w-12 h-12 rounded-full flex items-center justify-center shadow-card ${
                  aktif
                    ? "bg-gradient-to-br from-brand-600 to-brand-700"
                    : "bg-gradient-to-br from-brand-400 to-brand-600"
                }`}
              >
                <svg width="26" height="20" viewBox="0 0 26 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M1 2L6.5 17L10.5 7L13 13L15.5 7L19.5 17L25 2"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className={`text-[11px] ${aktif ? "text-brand-500 font-semibold" : "text-gray-500"}`}>
                WAS AI
              </span>
            </Link>
          );
        }

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
