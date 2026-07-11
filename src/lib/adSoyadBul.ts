// Firestore'a elle veri girerken alan adı yazımı tutarsız olabiliyor (adSoyad / adsoyad /
// ad_soyad / isim gibi). Kod tek bir kesin yazıma bağımlı kalırsa, küçük bir yazım
// farkında isim sessizce kaybolup ID gösteriliyor. Bu fonksiyon olası varyasyonların
// hepsini dener.
export function adSoyadBul(veri: object | null | undefined): string {
  if (!veri) return "";
  const kayit = veri as Record<string, unknown>;
  const olasiAlanlar = ["adSoyad", "adsoyad", "ad_soyad", "AdSoyad", "isim", "name", "Name", "ad"];
  for (const alan of olasiAlanlar) {
    const deger = kayit[alan];
    if (typeof deger === "string" && deger.trim()) return deger.trim();
  }
  return "";
}
