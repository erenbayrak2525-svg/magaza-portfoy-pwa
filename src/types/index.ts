export type Rol = "personel" | "bolge_muduru" | "admin";

export interface Kullanici {
  id: string;
  adSoyad: string;
  eposta: string;
  rol: Rol;
  bolgeId?: string;
  sonGorulme?: string;
}

export type GorevDurumu = "bekliyor" | "devam_ediyor" | "tamamlandi" | "onay_bekliyor" | "reddedildi";

export interface Gorev {
  id: string;
  baslik: string;
  aciklama: string;
  atananKullaniciId: string;
  durum: GorevDurumu;
  sonTarih: string;       // ISO date
  olusturmaTarihi: string;
  oncelik: "dusuk" | "normal" | "yuksek";
  kanitFotoUrl?: string;
  // Offline'da oluşturulmuş ama henüz sunucuya gitmemiş kayıtlar için:
  senkronDurumu?: "senkron" | "beklemede";
}

export interface CiroKaydi {
  id: string;
  tarih: string;
  tutar: number;
  fisAdedi?: number;
  notlar?: string;
  senkronDurumu?: "senkron" | "beklemede";
}

export interface StokSayimKaydi {
  id: string;
  tarih: string;
  urunKodu: string;
  sayilanAdet: number;
  sistemAdet?: number;
  senkronDurumu?: "senkron" | "beklemede";
}

export interface DenetimFormu {
  id: string;
  tarih: string;
  denetciAdi: string;
  puanlar: Record<string, number>; // kriter adı -> puan (1-5)
  genelNot?: string;
  senkronDurumu?: "senkron" | "beklemede";
}

export interface IletisimKisi {
  id: string;
  adSoyad: string;
  rol: string;
  telefon: string;
  whatsapp?: string;
}

export interface StokVaryanti {
  renk: string;
  beden: string;
  adet: number;
}

export interface StokUrunu {
  id: string;
  urunKodu: string;          // ör. "7026" (ürün adının başındaki stil numarası)
  urunAdi: string;           // ör. "XLO Dikişli Paça Bol Paça Pantolon"
  varyantlar: StokVaryanti[]; // her renk+beden kombinasyonu için ayrı stok adedi
  fiyat?: number;
  gorselUrl?: string;
  etiketler: string[];
  guncellemeTarihi: string;
}

export function stokToplamAdet(urun: StokUrunu): number {
  return (urun.varyantlar ?? []).reduce((toplam, v) => toplam + (v.adet ?? 0), 0);
}

export interface KasaKaydi {
  id: string;
  tarih: string;
  aciklama: string;
  tutar: number;
  tur: "gelir" | "gider";
  olusturanKullaniciId?: string;
}

export interface Bildirim {
  id: string;
  baslik: string;
  mesaj: string;
  tarih: string;
  okundu: boolean;
  link?: string;
}
