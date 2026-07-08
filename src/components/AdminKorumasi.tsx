"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

// Basit bir koruma: admin olmayan biri /admin/* altına gelirse panele geri yönlendirir.
// Yüksek güvenlik gerekmediği için bu sadece arayüz seviyesinde bir önlemdir;
// asıl veri güvenliği Firestore Rules üzerinden sağlanmalı.
export default function AdminKorumasi({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const kullanici = useAuthStore((s) => s.kullanici);

  useEffect(() => {
    if (kullanici && kullanici.rol !== "admin") router.replace("/panel");
  }, [kullanici, router]);

  if (!kullanici || kullanici.rol !== "admin") return null;
  return <>{children}</>;
}
