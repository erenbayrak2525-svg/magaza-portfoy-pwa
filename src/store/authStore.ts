import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Kullanici } from "@/types";

interface AuthDurumu {
  kullanici: Kullanici | null;
  girisYap: (kullanici: Kullanici) => void;
  cikisYap: () => void;
}

export const useAuthStore = create<AuthDurumu>()(
  persist(
    (set) => ({
      kullanici: null,
      girisYap: (kullanici) => set({ kullanici }),
      cikisYap: () => set({ kullanici: null })
    }),
    { name: "magaza-portfoy-auth" } // "Beni hatırla": localStorage'da kalıcı
  )
);
