// Bu dosya, Nebim V3'ten "HTML olarak kaydet" ile alınan envanter raporlarını ayrıştırır.
// Format tek bir dev <table> içinde, çoğu hücresi boş "boşluk" hücreleri olan, satırların
// bir kısmının grup başlığı ("Ürün Kodu: P-...", "Renk Kodu: 01") bir kısmının ara toplam,
// bir kısmının da gerçek veri satırı (Ürün Adı, Renk Açıklaması, Beden, Envanter) olduğu
// karmaşık bir Crystal Reports tarzı export. Genel amaçlı bir <table> ayrıştırıcısı bunun
// için çalışmaz; bu yüzden satır satır dolaşıp sadece 4 dolu hücresi olan satırları veri
// satırı sayan özel bir mantık kullanılıyor.

export interface AyristirilmisStokSatiri {
  kod: string;    // ürün adının başındaki stil numarası, ör. "7026"
  ad: string;     // stil numarası çıkarılmış ürün adı
  renk: string;
  beden: string;
  adet: number;
}

export function nebimStokAyristir(html: string): AyristirilmisStokSatiri[] {
  if (typeof window === "undefined") return [];
  if (!html.trim()) return [];

  const parser = new DOMParser();
  const dom = parser.parseFromString(html, "text/html");
  const satirElemanlari = Array.from(dom.querySelectorAll("tr"));

  const sonuc: AyristirilmisStokSatiri[] = [];

  for (const tr of satirElemanlari) {
    const doluHucreler = Array.from(tr.querySelectorAll("td")).filter(
      (td) => (td.textContent || "").trim().length > 0
    );
    // Grup başlıkları ("Ürün Kodu:", "Renk Kodu:") ve ara toplamlar tek dolu hücreden oluşur,
    // gerçek veri satırları her zaman 4 dolu hücre içerir: Ürün Adı, Renk, Beden, Envanter.
    if (doluHucreler.length !== 4) continue;

    const [adHucresi, renkHucresi, bedenHucresi, envanterHucresi] = doluHucreler;

    // Ürün adı hücresi bazen <nobr>satır1</nobr><br/><nobr>satır2</nobr> şeklinde iki
    // parçaya bölünmüş oluyor (uzun isimler için); parçaları boşlukla birleştiriyoruz.
    const nobrParcalari = Array.from(adHucresi.querySelectorAll("nobr")).map((n) =>
      (n.textContent || "").trim()
    );
    const tamAd = (nobrParcalari.length > 0 ? nobrParcalari : [adHucresi.textContent || ""])
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    // Kod, harf+rakam karışık olabilir (ör. "24K31942", "25yblz00682") — sadece baştaki
    // rakamları almak yanlış sonuç veriyordu. Kural: ilk boşluğa kadar olan her şey kod,
    // ondan sonrası ürün adı.
    const ilkBosluk = tamAd.indexOf(" ");
    const kod = ilkBosluk > -1 ? tamAd.slice(0, ilkBosluk).trim() : tamAd.trim();
    const ad = ilkBosluk > -1 ? tamAd.slice(ilkBosluk + 1).trim() : "";

    const renk = (renkHucresi.textContent || "").trim();
    const beden = (bedenHucresi.textContent || "").trim();

    // Raporun kendi başlık satırını ("Ürün Adı | Renk Açıklaması | Beden | Envanter")
    // veri satırı sanıp almayalım.
    if (renk === "Renk Açıklaması" || beden === "Beden") continue;

    const envanterMetni = (envanterHucresi.textContent || "").trim().replace(",", ".");
    const adet = Number(envanterMetni.replace(/[^\d.-]/g, "")) || 0;

    if (!kod || !renk || !beden) continue;

    sonuc.push({ kod, ad: ad || tamAd, renk, beden, adet });
  }

  return sonuc;
}

export interface GruplanmisUrun {
  kod: string;
  ad: string;
  varyantlar: { renk: string; beden: string; adet: number }[];
}

// Aynı stil numarasına (kod) sahip satırları tek ürün altında varyant listesine indirger.
export function satirlariUrunlereGrupla(satirlar: AyristirilmisStokSatiri[]): GruplanmisUrun[] {
  const map = new Map<string, GruplanmisUrun>();
  for (const s of satirlar) {
    if (!map.has(s.kod)) map.set(s.kod, { kod: s.kod, ad: s.ad, varyantlar: [] });
    map.get(s.kod)!.varyantlar.push({ renk: s.renk, beden: s.beden, adet: s.adet });
  }
  return Array.from(map.values());
}

// Firestore belge ID'si olarak kullanmak için ürün kodunu güvenli bir stringe çevirir.
export function urunKoduBelgeId(urunKodu: string): string {
  return urunKodu.trim().toUpperCase().replace(/[^A-Z0-9]/g, "-").slice(0, 120) || crypto.randomUUID();
}
