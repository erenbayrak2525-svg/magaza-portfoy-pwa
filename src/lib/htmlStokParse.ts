// Admin, ERP/Nebim'den aldığı HTML rapor kaynağını (ör. bir <table> içeren HTML) doğrudan
// yapıştırır; bu dosya o HTML'i tarayıp satır/sütunlara ayırır. Sunucu gerekmez, tamamen
// tarayıcıda (DOMParser ile) çalışır.

export interface AyristirilmisTablo {
  basliklar: string[];
  satirlar: string[][];
}

export function htmlTabloAyristir(html: string): AyristirilmisTablo | null {
  if (typeof window === "undefined") return null;
  if (!html.trim()) return null;

  const parser = new DOMParser();
  const dom = parser.parseFromString(html, "text/html");
  const tablo = dom.querySelector("table");
  if (!tablo) return null;

  const satirElemanlari = Array.from(tablo.querySelectorAll("tr"));
  if (satirElemanlari.length === 0) return null;

  const hucreMetni = (hucre: Element) => hucre.textContent?.replace(/\s+/g, " ").trim() ?? "";

  const basliklar = Array.from(satirElemanlari[0].querySelectorAll("th,td")).map(hucreMetni);
  const satirlar = satirElemanlari
    .slice(1)
    .map((tr) => Array.from(tr.querySelectorAll("td,th")).map(hucreMetni))
    .filter((satir) => satir.some((h) => h.length > 0));

  return { basliklar, satirlar };
}

const KOD_ANAHTARLARI = ["kod", "sku", "barkod"];
const AD_ANAHTARLARI = ["ad", "isim", "ürün", "urun", "açıklama", "aciklama", "name"];
const ADET_ANAHTARLARI = ["adet", "stok", "miktar", "qty"];

export interface SutunTahmini {
  kod: number;
  ad: number;
  adet: number;
}

export function sutunTahminEt(basliklar: string[]): SutunTahmini {
  const bul = (anahtarlar: string[]) =>
    basliklar.findIndex((b) => anahtarlar.some((a) => b.toLowerCase().includes(a)));
  return {
    kod: bul(KOD_ANAHTARLARI),
    ad: bul(AD_ANAHTARLARI),
    adet: bul(ADET_ANAHTARLARI)
  };
}

// Firestore belge ID'si olarak kullanmak için ürün kodunu güvenli bir stringe çevirir.
export function urunKoduBelgeId(urunKodu: string): string {
  return urunKodu.trim().toUpperCase().replace(/[^A-Z0-9]/g, "-").slice(0, 120) || crypto.randomUUID();
}
