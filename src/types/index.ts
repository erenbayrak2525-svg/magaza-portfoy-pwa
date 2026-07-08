export type Rol = "personel" | "bolge_muduru" | "admin";

export interface Kullanici {
  id: string;
  adSoyad: string;
  eposta: string;
  rol: Rol;
  magazaId?: string;      // personel/bölge müdürü hangi mağaza(lar)a bağlı
  bolgeId?: string;
}

export type GorevDurumu = "bekliyor" | "devam_ediyor" | "tamamlandi" | "onay_bekliyor" | "reddedildi";

export interface Gorev {
  id: string;
  baslik: string;
  aciklama: string;
  magazaId: string;
  magazaAdi: string;
  atananKullaniciId: string;
  durum: GorevDurumu;
  sonTarih: string;       // ISO date
  olusturmaTarihi: string;
  oncelik: "dusuk" | "normal" | "yuksek";
  kanitFotoUrl?: string;
  // Offline'da oluşturulmuş ama henüz sunucuya gitmemiş kayıtlar için:
  senkronDurumu?: "senkron" | "beklemede";
}

export interface Magaza {
  id: string;
  ad: string;
  kod: string;            // Nebim/ERP mağaza kodu
  adres: string;
  bolge: string;
  metrekare?: number;
  kiraBaslangic?: string;
  kiraBitis?: string;
  kiraTutari?: number;
  sorumluId?: string;     // bölge müdürü / mağaza sorumlusu
  belgeler: MagazaBelge[];
}

export interface MagazaBelge {
  id: string;
  ad: string;
  tip: "kira_sozlesmesi" | "demirbas_listesi" | "teknik_belge" | "diger";
  dosyaUrl: string;
  yuklemeTarihi: string;
}

export interface CiroKaydi {
  id: string;
  magazaId: string;
  tarih: string;
  tutar: number;
  fisAdedi?: number;
  notlar?: string;
  senkronDurumu?: "senkron" | "beklemede";
}

export interface StokSayimKaydi {
  id: string;
  magazaId: string;
  tarih: string;
  urunKodu: string;
  sayilanAdet: number;
  sistemAdet?: number;
  senkronDurumu?: "senkron" | "beklemede";
}

export interface DenetimFormu {
  id: string;
  magazaId: string;
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
  magazaId?: string;
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
  gorselUrl?: string;
  etiketler: string[];
  guncellemeTarihi: string;
}

export function stokToplamAdet(urun: StokUrunu): number {
  return urun.varyantlar.reduce((toplam, v) => toplam + v.adet, 0);
}

export interface Bildirim {
  id: string;
  baslik: string;
  mesaj: string;
  tarih: string;
  okundu: boolean;
  link?: string;
}
