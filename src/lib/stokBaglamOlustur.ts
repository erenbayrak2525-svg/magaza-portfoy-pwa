import { stokToplamAdet, type StokUrunu } from "@/types";

// 900+ ürünün tamamını her mesajda yapay zekaya göndermek pahalı ve gereksiz. Bunun yerine
// kullanıcının mesajındaki kelimelere göre ilgili ürünleri buluyoruz (ad/kod/etiket eşleşmesi),
// bulamazsa genel bir özet (etiket dağılımı + birkaç örnek ürün) gönderiyoruz — kombin gibi
// genel sorularda da yapay zekanın elinde bir şeyler olsun diye.
export function stokBaglamOlustur(mesaj: string, urunler: StokUrunu[], maksimumUrun = 20): string {
  if (urunler.length === 0) {
    return "Mağazanın stok kataloğu şu anda boş veya henüz yüklenmedi.";
  }

  const kelimeler = mesaj
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((k) => k.length >= 3);

  let eslesenler: StokUrunu[] = [];
  if (kelimeler.length > 0) {
    eslesenler = urunler.filter((u) => {
      const metin = `${u.urunAdi ?? ""} ${u.urunKodu ?? ""} ${(u.etiketler ?? []).join(" ")}`.toLowerCase();
      return kelimeler.some((k) => metin.includes(k));
    });
  }

  const gosterilecek = (eslesenler.length > 0 ? eslesenler : urunler).slice(0, maksimumUrun);

  const satirlar = gosterilecek.map((u) => {
    const adet = stokToplamAdet(u);
    const renkler = Array.from(new Set((u.varyantlar ?? []).map((v) => v.renk))).filter(Boolean).join(", ");
    const fiyat = u.fiyat != null ? `${u.fiyat}₺` : "fiyat girilmemiş";
    const etiket = (u.etiketler ?? []).join(", ") || "-";
    return `- ${u.urunAdi || "(isimsiz)"} (kod: ${u.urunKodu || "-"}) | ${fiyat} | stok: ${adet} adet | renkler: ${renkler || "-"} | etiketler: ${etiket}`;
  });

  const baslik =
    eslesenler.length > 0
      ? `Kullanıcının mesajıyla eşleşen ${gosterilecek.length} ürün (kataloğun tamamı ${urunler.length} ürün):`
      : `Kullanıcının mesajıyla doğrudan eşleşen ürün bulunamadı. Genel fikir vermen için kataloğdan ${gosterilecek.length} örnek ürün (toplam ${urunler.length} ürün var):`;

  return `${baslik}\n${satirlar.join("\n")}`;
}
