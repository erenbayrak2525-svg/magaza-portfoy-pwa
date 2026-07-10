"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

// Müdür ve Admin'in birlikte erişebildiği sayfalar için koruma (ör. Analiz, Kasa Defteri).
// Personel bu sayfalara URL ile girmeye çalışırsa panele geri yönlendirilir.
export default function YoneticiKorumasi({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const kullanici = useAuthStore((s) => s.kullanici);
  const yetkili = kullanici && (kullanici.rol === "admin" || kullanici.rol === "bolge_muduru");

  useEffect(() => {
    if (kullanici && !yetkili) router.replace("/panel");
  }, [kullanici, yetkili, router]);

  if (!yetkili) return null;
  return <>{children}</>;
}
