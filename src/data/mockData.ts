import type { Bildirim, CiroKaydi, Gorev, IletisimKisi, Kullanici, Magaza, StokUrunu } from "@/types";

// NOT: Aşağıdaki mağaza isimleri ve adresleri yer tutucudur (Wasmoda e-ticaret
// platformu olduğu için gerçek şube bilgisi bilinmiyor). Gerçek fiziksel
// showroom/depo/mağazaların varsa bu dosyadaki "ad", "adres", "kod" alanlarını
// gerçek bilgilerle değiştir.
export const MOCK_KULLANICILAR: Kullanici[] = [
  { id: "u1", adSoyad: "Elif Kaya", eposta: "elif@wasmoda.com.tr", rol: "personel", magazaId: "m1" },
  { id: "u2", adSoyad: "Deniz Aydın", eposta: "deniz@wasmoda.com.tr", rol: "bolge_muduru", bolgeId: "b1" },
  { id: "u3", adSoyad: "Murat Yönetici", eposta: "admin@wasmoda.com.tr", rol: "admin" }
];

export const MOCK_MAGAZALAR: Magaza[] = [
  {
    id: "m1",
    ad: "Wasmoda Alsancak Showroom",
    kod: "WSM-001",
    adres: "Kıbrıs Şehitleri Cd. No:24, Alsancak, İzmir",
    bolge: "Ege",
    metrekare: 180,
    kiraBaslangic: "2023-01-01",
    kiraBitis: "2027-01-01",
    kiraTutari: 145000,
    sorumluId: "u2",
    belgeler: [
      { id: "d1", ad: "Kira Sözleşmesi 2023-2027", tip: "kira_sozlesmesi", dosyaUrl: "#", yuklemeTarihi: "2023-01-05" },
      { id: "d2", ad: "Demirbaş Listesi", tip: "demirbas_listesi", dosyaUrl: "#", yuklemeTarihi: "2024-03-10" }
    ]
  },
  {
    id: "m2",
    ad: "Wasmoda Bostanlı Showroom",
    kod: "WSM-002",
    adres: "Cemal Gürsel Cd. No:112, Bostanlı, İzmir",
    bolge: "Ege",
    metrekare: 140,
    kiraBaslangic: "2022-06-01",
    kiraBitis: "2026-06-01",
    kiraTutari: 98000,
    sorumluId: "u2",
    belgeler: []
  },
  {
    id: "m3",
    ad: "Wasmoda Karşıyaka Showroom",
    kod: "WSM-003",
    adres: "Girne Bulvarı No:8, Karşıyaka, İzmir",
    bolge: "Ege",
    metrekare: 210,
    kiraBaslangic: "2024-02-01",
    kiraBitis: "2029-02-01",
    kiraTutari: 168000,
    sorumluId: "u2",
    belgeler: []
  }
];

export const MOCK_GOREVLER: Gorev[] = [
  {
    id: "g1",
    baslik: "Vitrin Değişimi",
    aciklama: "Yeni sezon ürünleriyle ön vitrin düzenlemesi yapılacak. Referans görsel merkez ekibinden gelecek.",
    magazaId: "m1",
    magazaAdi: "Wasmoda Alsancak Showroom",
    atananKullaniciId: "u1",
    durum: "bekliyor",
    sonTarih: "2026-07-07",
    olusturmaTarihi: "2026-07-05",
    oncelik: "yuksek"
  },
  {
    id: "g2",
    baslik: "Haftalık Stok Sayımı",
    aciklama: "Ayakkabı reyonu için haftalık sayım formu doldurulacak.",
    magazaId: "m1",
    magazaAdi: "Wasmoda Alsancak Showroom",
    atananKullaniciId: "u1",
    durum: "devam_ediyor",
    sonTarih: "2026-07-06",
    olusturmaTarihi: "2026-07-04",
    oncelik: "normal"
  },
  {
    id: "g3",
    baslik: "Yangın Tüpü Kontrolü",
    aciklama: "Periyodik güvenlik denetimi kapsamında yangın tüplerinin tarihleri kontrol edilecek.",
    magazaId: "m2",
    magazaAdi: "Wasmoda Bostanlı Showroom",
    atananKullaniciId: "u1",
    durum: "tamamlandi",
    sonTarih: "2026-07-01",
    olusturmaTarihi: "2026-06-28",
    oncelik: "normal",
    kanitFotoUrl: "#"
  }
];

export const MOCK_CIRO_KAYITLARI: CiroKaydi[] = [
  { id: "c1", magazaId: "m1", tarih: "2026-07-04", tutar: 42500, fisAdedi: 61 },
  { id: "c2", magazaId: "m2", tarih: "2026-07-04", tutar: 31200, fisAdedi: 44 },
  { id: "c3", magazaId: "m3", tarih: "2026-07-04", tutar: 55800, fisAdedi: 72 }
];

export const MOCK_ILETISIM: IletisimKisi[] = [
  { id: "i1", adSoyad: "Deniz Aydın", rol: "Bölge Müdürü", telefon: "+905551112233", whatsapp: "+905551112233" },
  { id: "i2", adSoyad: "Merkez Destek Hattı", rol: "Destek", telefon: "+902323334455" },
  { id: "i3", adSoyad: "Teknik Servis", rol: "Teknik", telefon: "+905559998877", whatsapp: "+905559998877" }
];

export const MOCK_BILDIRIMLER: Bildirim[] = [
  { id: "b1", baslik: "Yeni Görev: Vitrin Değişimi", mesaj: "Alsancak mağazası için yeni görev atandı.", tarih: "2026-07-05T09:10:00", okundu: false, link: "/gorevler/detay?id=g1" },
  { id: "b2", baslik: "Duyuru", mesaj: "Bu hafta sonu stok sayımı tüm mağazalarda yapılacaktır.", tarih: "2026-07-04T17:30:00", okundu: true }
];

export const MOCK_STOK_URUNLERI: StokUrunu[] = [
  {
    id: "su1",
    urunKodu: "WSM-BLZ-014",
    urunAdi: "Keten Blazer Ceket - Krem",
    adet: 24,
    etiketler: ["yeni sezon", "keten"],
    guncellemeTarihi: "2026-07-05"
  },
  {
    id: "su2",
    urunKodu: "WSM-ELB-102",
    urunAdi: "Midi Elbise - Siyah",
    adet: 8,
    etiketler: ["çok satan"],
    guncellemeTarihi: "2026-07-04"
  },
  {
    id: "su3",
    urunKodu: "WSM-CNT-030",
    urunAdi: "Deri Çanta - Taba",
    adet: 0,
    etiketler: ["stok tükendi", "aksesuar"],
    guncellemeTarihi: "2026-07-03"
  }
];
