"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function AnaSayfa() {
  const router = useRouter();
  const kullanici = useAuthStore((s) => s.kullanici);

  useEffect(() => {
    router.replace(kullanici ? "/panel" : "/giris");
  }, [kullanici, router]);

  return null;
}
