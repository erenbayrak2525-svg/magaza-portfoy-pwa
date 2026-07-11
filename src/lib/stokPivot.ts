import type { StokVaryanti } from "@/types";

const BEDEN_SIRASI = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "3XL", "4XL"];

function bedenKarsilastir(a: string, b: string): number {
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;

  const ia = BEDEN_SIRASI.indexOf(a.toUpperCase());
  const ib = BEDEN_SIRASI.indexOf(b.toUpperCase());
  if (ia !== -1 && ib !== -1) return ia - ib;
  if (ia !== -1) return -1;
  if (ib !== -1) return 1;

  return a.localeCompare(b, "tr");
}

export interface StokPivot {
  renkler: string[];
  bedenler: string[];
  tablo: Record<string, Record<string, number>>; // tablo[beden][renk] = adet
}

// Uzun bir (renk, beden, adet) satır listesini; sütunda renk, satırda beden olan
// bir matrise dönüştürür — ürün detayında kompakt bir tablo göstermek için.
export function stokPivotOlustur(varyantlar: StokVaryanti[]): StokPivot {
  const renkSet = new Set<string>();
  const bedenSet = new Set<string>();
  const tablo: Record<string, Record<string, number>> = {};

  for (const v of varyantlar) {
    const renk = v.renk || "—";
    const beden = v.beden || "—";
    renkSet.add(renk);
    bedenSet.add(beden);
    if (!tablo[beden]) tablo[beden] = {};
    tablo[beden][renk] = (tablo[beden][renk] ?? 0) + (v.adet ?? 0);
  }

  return {
    renkler: Array.from(renkSet).sort((a, b) => a.localeCompare(b, "tr")),
    bedenler: Array.from(bedenSet).sort(bedenKarsilastir),
    tablo
  };
}
