"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import UstBar from "@/components/UstBar";
import AltMenu from "@/components/AltMenu";
import VarlikTakibi from "@/components/VarlikTakibi";

const BASLIKLAR: Record<string, string> = {
  "/panel": "Panel",
  "/gorevler": "Görevler",
  "/formlar": "Akıllı Formlar",
  "/iletisim": "İletişim Dizini",
  "/profil": "Profil",
  "/bildirimler": "Bildirimler",
  "/admin/gorev-atama": "Görev Atama",
  "/admin/analiz": "Analiz",
  "/stok": "Stok Kataloğu",
  "/admin/stok-yukle": "Stok İçe Aktar",
  "/kasa-defteri": "Kasa Defteri",
  "/formlar/calisma-saatleri": "Çalışma Saatleri",
  "/ai": "WAS AI",
  "/admin/ai-ayarlari": "WAS AI Ayarları",
  "/admin/yeni-kayit": "Yeni Kayıt Ekle",
  "/admin/toplu-mesaj": "Toplu Mesaj Gönder"
};

function baslikBul(yol: string): string {
  const eslesme = Object.keys(BASLIKLAR).find((k) => yol === k || yol.startsWith(k + "/"));
  return eslesme ? BASLIKLAR[eslesme] : "Mağaza Portföyü";
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const kullanici = useAuthStore((s) => s.kullanici);

  useEffect(() => {
    if (!kullanici) router.replace("/giris");
  }, [kullanici, router]);

  if (!kullanici) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <UstBar baslik={baslikBul(pathname || "")} />
      <main className="flex-1 px-4 py-4 pb-24 max-w-2xl w-full mx-auto">{children}</main>
      <AltMenu rol={kullanici.rol} />
      <VarlikTakibi />
    </div>
  );
}
