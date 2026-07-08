# Mağaza Portföyü ve Personel Yönetim PWA'sı

Next.js 14 (App Router) + TypeScript + Tailwind + Firebase (Auth + Firestore) ile hazırlanmış,
GitHub Pages veya Netlify'de statik olarak yayınlanabilen bir PWA scaffold'u. Personel, Bölge
Müdürü ve Admin rolleri; görev yönetimi, mağaza portalı, akıllı formlar (ciro/stok/denetim),
iletişim dizini ve offline senkron altyapısı hazır durumda.

## Şu an ne çalışıyor, ne çalışmıyor

**Hazır ve çalışıyor:**
- Tüm sayfalar ve rol bazlı navigasyon (Personel / Bölge Müdürü / Admin)
- Görev tamamlama akışı: kamera ile fotoğraf çekme, "Tamamla" butonu
- 3 akıllı form (Ciro Girişi, Stok Sayımı, Periyodik Denetim)
- Offline outbox: internet yokken yapılan işlemler IndexedDB'de birikir, bağlantı gelince
  otomatik gönderilir (`src/lib/outbox.ts`, `src/lib/senkron.ts`)
- Service worker + manifest: "Ana ekrana ekle" ve app-shell önbellekleme çalışıyor
- Demo modu: Firebase bağlamadan `mockData.ts` ile tüm arayüzü gezebilirsin

**Senin eklemen gereken (aşağıda adım adım var):**
1. Gerçek bir Firebase projesi + Firestore koleksiyonları
2. Firestore `profiles` koleksiyonu ile giriş yapan kullanıcının gerçek rolünü çekme (şu an
   herkes "personel" rolüyle giriyor, bkz. `src/app/giris/page.tsx` içindeki TODO)
3. Fotoğrafların Firebase Storage'a gerçek yüklenmesi (şu an base64 olarak outbox'a yazılıyor)
4. Push bildirimleri (altyapı yok; aşağıda "Push Bildirimler" bölümüne bak)
5. Gerçek uygulama ikonu (şu an `public/icons/` altında placeholder bir "M" logosu var)
6. GitHub Pages kullanacaksan repo adını `next.config.js` / workflow dosyasındaki
   `NEXT_PUBLIC_BASE_PATH` ile eşleştirmek (Netlify'de buna gerek yok)

## Yerel kurulum

```bash
npm install
cp .env.example .env.local   # Firebase bilgilerini doldur (opsiyonel, boş bırakırsan demo modu çalışır)
npm run dev
```

`http://localhost:3000` — demo modda giriş için `elif@wasmoda.com.tr` (personel),
`deniz@wasmoda.com.tr` (bölge müdürü) veya `admin@wasmoda.com.tr` (admin), şifre önemli değil.

## Firebase kurulumu

1. [console.firebase.google.com](https://console.firebase.google.com) → **Add project** →
   ücretsiz Spark planıyla devam et.
2. Proje oluşunca ortadaki **Web (`</>`) simgesine** tıklayıp bir web app kaydet. Sana verdiği
   `firebaseConfig` nesnesindeki değerleri `.env.local`'e yapıştır (her alan ayrı satır).
3. Sol menü **Build → Authentication → Get started → Sign-in method** → **E-posta/Şifre**'yi aç.
4. **Authentication → Users → Add user** kısmından ekibindeki 6-7 kişiyi manuel olarak
   e-posta/şifre ile ekle (kayıt formu yok, davet linki de yok — sadece sen ekliyorsun).
5. Sol menü **Build → Firestore Database → Create database** → **Production mode** seç,
   bölge olarak sana yakın birini seç (örn. `eur3`).

### Firestore koleksiyonları

Firestore NoSQL olduğu için önceden şema tanımlaman gerekmiyor — koleksiyonlar ilk belge
eklendiğinde otomatik oluşur. Uygulamanın kullandığı koleksiyon isimleri:

| Koleksiyon | Ne için |
|---|---|
| `profiles` | Kullanıcı uid'sine göre `adSoyad`, `rol`, `magazaId` |
| `magazalar` | Mağaza bilgileri, kira, belgeler |
| `gorevler` | Görev atama ve tamamlama kayıtları |
| `ciro_kayitlari` | Günlük ciro girişleri |
| `stok_sayim_kayitlari` | Stok sayım kayıtları |
| `denetim_formlari` | Periyodik denetim formları |
| `stok_urunleri` | Ürün stok kataloğu (kod, ad, adet, görsel, etiketler) |

`profiles` koleksiyonuna her kullanıcı için elle bir belge ekle (belge ID'si = Authentication'da
o kullanıcının **uid**'si, Users listesinden kopyalanabilir):

```
profiles/{uid}
  adSoyad: "Elif Kaya"
  rol: "personel"          // "personel" | "bolge_muduru" | "admin"
  magazaId: "m1"
```

Sonra `src/app/giris/page.tsx` içindeki TODO'yu tamamla: giriş sonrası bu koleksiyondan
gerçek `rol` ve `adSoyad`'ı çek (`getDoc(doc(db, "profiles", uid))`).

### Güvenlik kuralları (basit, yüksek güvenlik gerekmediği için)

**Build → Firestore Database → Rules** sekmesine şunu yapıştır — sadece giriş yapmış
kullanıcıların okuyup yazmasına izin verir, 6-7 kişilik kapalı ekip için yeterli:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## GitHub Pages'e yayınlama

Bu proje `output: "export"` ile statik dosyalara derleniyor, yani sunucu tarafı (API route,
middleware) kullanmıyor — GitHub Pages ile tam uyumlu.

1. GitHub'da yeni bir **repo** oluştur (adını not al, örn. `magaza-portfoy-pwa`).
2. `next.config.js` içindeki `NEXT_PUBLIC_BASE_PATH` ile `.github/workflows/deploy.yml`
   içindeki `NEXT_PUBLIC_BASE_PATH` değerini repo adınla güncelle: `/magaza-portfoy-pwa`
   (kullanıcı adı sitesi `username.github.io` kullanacaksan boş bırak).
3. Kodu GitHub'a push'la:
   ```bash
   git init
   git add .
   git commit -m "ilk sürüm"
   git branch -M main
   git remote add origin https://github.com/KULLANICI_ADIN/REPO_ADIN.git
   git push -u origin main
   ```
4. Repo > Settings > Pages > Source kısmından **"GitHub Actions"** seç.
5. Repo > Settings > Secrets and variables > Actions kısmından şu secret'ları ekle:
   `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`,
   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`,
   `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID`.
6. `main` branch'e her push'ta `.github/workflows/deploy.yml` otomatik derleyip yayınlayacak.
   Site adresin: `https://KULLANICI_ADIN.github.io/REPO_ADIN/`

### Gizlilik notu (önemli)

Konuştuğumuz gibi yüksek güvenlik gerekmiyor, ama şunu bilerek ilerle: **GitHub Pages'te
ücretsiz hesapla yayınlanan bir site, linki bilen herkese açıktır** — repo private olsa bile.
Senin durumunda (link sadece 6-7 kişiye özel kalacak, kimseyle paylaşılmayacak) bu yeterli.
Firebase Authentication zaten devrede olduğu için, linke rastlayan biri giriş bilgisi olmadan
hiçbir veri göremez — asıl güvenlik katmanı bu.

## Netlify'de deneme (hızlı test için)

```bash
npm run build   # .env.local'de NEXT_PUBLIC_BASE_PATH boş olsun
```

Çıkan `out/` klasörünü [app.netlify.com/drop](https://app.netlify.com/drop) adresine
sürükle-bırak, saniyeler içinde paylaşılabilir bir link alırsın. Detaylar `netlify.toml`
içinde.

## Push Bildirimler (henüz eklenmedi)

Görev atandığında personele push bildirimi gitmesi için:
1. Firebase Console → **Build → Cloud Messaging** açılmalı, VAPID key üretilmeli.
2. `firebase/messaging` ile tarayıcıdan bildirim izni istenip token Firestore'a kaydedilmeli.
3. Görev atandığında bu token'a bildirim gönderen bir **Cloud Function** yazılmalı.
4. `src/app/(app)/admin/gorev-atama/page.tsx` içindeki TODO'da işaretlenen yere bu
   fonksiyonu çağıran bir çağrı eklenir.
5. Bana bu aşamada tekrar yazarsan Cloud Function + FCM kurulumunu birlikte yaparız.

## Stok Kataloğu modülü

- **Admin → Stok İçe Aktar (HTML):** Nebim V3'ten "HTML olarak kaydet" ile aldığın envanter
  raporunu (birkaç MB olabilir) **dosya olarak seç** — yapıştırma kutusu da var ama büyük
  dosyalarda dosya seçmek çok daha hızlı ve güvenilir. Sistem raporu otomatik ayrıştırır:
  ürün adının başındaki stil numarasını ("7026" gibi) ürün kodu olarak, kalan kısmı ürün adı
  olarak alır; her renk+beden satırını o ürünün varyant listesine ekler. Önizlemeyi kontrol
  edip **İçe Aktar**'a basınca Firestore'a yazılır. Bu sadece admin rolünde açık.
- **Stok Kataloğu (`/stok`):** Tüm giriş yapmış kullanıcılar görebilir. Bir ürüne tıklayınca
  renk/beden/adet dağılımını (salt okunur, Nebim'den gelir) görür; **herkes** o ürüne görsel
  ekleyebilir/değiştirebilir ve etiket ekleyip silebilir — rol farkı yok.
- Görseller şu an base64 olarak Firestore belgesine yazılıyor (basit ama Firestore'un ~1MB
  belge sınırına takılabilir). İleride Firebase Storage'a taşımak istersen
  `src/app/(app)/stok/detay/page.tsx` içindeki TODO'ya bak.
- Ayrıştırma mantığı `src/lib/htmlStokParse.ts` içinde. Nebim rapor şablonun farklıysa
  (sütun sırası, başlık isimleri) bu dosyadaki `nebimStokAyristir` fonksiyonunu güncellemen
  gerekebilir.

## Klasör yapısı

```
src/
  app/
    giris/                  Giriş ekranı
    (app)/                  Girişli kullanıcı kabuğu (üst bar + alt menü)
      panel/                Rol bazlı dashboard
      gorevler/             Görev listesi + detay (kamera, tamamlama)
      magazalar/            Mağaza portalı (kira, belgeler)
      formlar/              Ciro / Stok Sayımı / Denetim formları
      iletisim/             İletişim dizini (Profil sayfası üzerinden erişilir)
      profil/               Kullanıcı profili, çıkış yap, hızlı erişim linkleri
      bildirimler/          Bildirimler
      admin/                Görev atama, portföy yönetimi, analiz
  components/               Paylaşılan UI (Kart, Buton, DurumRozeti, ÜstBar, AltMenü)
  lib/                      Firebase client, offline outbox, senkron motoru
  store/                    Zustand auth store ("beni hatırla" localStorage ile kalıcı)
  data/mockData.ts          Demo veriler
public/
  manifest.webmanifest, sw.js, offline.html, icons/
```

## Tasarım notu

Görsel dil bilinçli olarak "saha operasyon konsolu" hissi vermek için kuruldu: nötr
gri/beyaz zemin, indigo aksan, ve her modülde tekrar eden tek bir imza öğesi — kartların
sol kenarındaki **durum şeridi** (bekliyor/devam ediyor/tamamlandı/senkron bekliyor).
Bu şerit süs değil, gerçek operasyonel durumu kodluyor.
