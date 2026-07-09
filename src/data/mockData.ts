import type { Bildirim, CiroKaydi, Gorev, IletisimKisi, Kullanici, StokUrunu } from "@/types";

// NOT: Bu dosyadaki veriler sadece Firebase henüz bağlanmadığında (demo modu) veya
// Firestore'da o koleksiyon boşken gösterilir. Firebase bağlandıktan sonra gerçek
// veriler görünür, bu mock veriler otomatik devre dışı kalır.
export const MOCK_KULLANICILAR: Kullanici[] = [
  { id: "u1", adSoyad: "Elif Kaya", eposta: "elif@wasmoda.com.tr", rol: "personel" },
  { id: "u2", adSoyad: "Deniz Aydın", eposta: "deniz@wasmoda.com.tr", rol: "bolge_muduru" },
  { id: "u3", adSoyad: "Murat Yönetici", eposta: "admin@wasmoda.com.tr", rol: "admin" }
];

export const MOCK_GOREVLER: Gorev[] = [
  {
    id: "g1",
    baslik: "Vitrin Değişimi",
    aciklama: "Yeni sezon ürünleriyle ön vitrin düzenlemesi yapılacak. Referans görsel merkez ekibinden gelecek.",
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
    atananKullaniciId: "u1",
    durum: "tamamlandi",
    sonTarih: "2026-07-01",
    olusturmaTarihi: "2026-06-28",
    oncelik: "normal",
    kanitFotoUrl: "#"
  }
];

export const MOCK_CIRO_KAYITLARI: CiroKaydi[] = [
  { id: "c1", tarih: "2026-07-04", tutar: 42500, fisAdedi: 61 }
];

export const MOCK_ILETISIM: IletisimKisi[] = [
  { id: "i1", adSoyad: "Deniz Aydın", rol: "Müdür", telefon: "+905551112233", whatsapp: "+905551112233" },
  { id: "i2", adSoyad: "Merkez Destek Hattı", rol: "Destek", telefon: "+902323334455" },
  { id: "i3", adSoyad: "Teknik Servis", rol: "Teknik", telefon: "+905559998877", whatsapp: "+905559998877" }
];

export const MOCK_BILDIRIMLER: Bildirim[] = [
  { id: "b1", baslik: "Yeni Görev: Vitrin Değişimi", mesaj: "Yeni görev atandı.", tarih: "2026-07-05T09:10:00", okundu: false, link: "/gorevler/detay?id=g1" },
  { id: "b2", baslik: "Duyuru", mesaj: "Bu hafta sonu stok sayımı yapılacaktır.", tarih: "2026-07-04T17:30:00", okundu: true }
];

export const MOCK_STOK_URUNLERI: StokUrunu[] = [
  {
    id: "su1",
    urunKodu: "7026",
    urunAdi: "XLO Dikişli Paça Bol Paça Pantolon",
    varyantlar: [
      { renk: "Siyah", beden: "36", adet: 4 },
      { renk: "Siyah", beden: "38", adet: 6 },
      { renk: "Açık Mavi", beden: "36", adet: 2 },
      { renk: "Açık Mavi", beden: "38", adet: 3 }
    ],
    etiketler: ["yeni sezon", "keten"],
    guncellemeTarihi: "2026-07-05"
  },
  {
    id: "su2",
    urunKodu: "5102",
    urunAdi: "Midi Elbise",
    varyantlar: [
      { renk: "Siyah", beden: "S", adet: 3 },
      { renk: "Siyah", beden: "M", adet: 5 }
    ],
    etiketler: ["çok satan"],
    guncellemeTarihi: "2026-07-04"
  },
  {
    id: "su3",
    urunKodu: "3030",
    urunAdi: "Deri Çanta",
    varyantlar: [{ renk: "Taba", beden: "Standart", adet: 0 }],
    etiketler: ["stok tükendi", "aksesuar"],
    guncellemeTarihi: "2026-07-03"
  }
];
