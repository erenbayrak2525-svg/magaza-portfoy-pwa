import { doc, setDoc, addDoc, collection } from "firebase/firestore";
import { db, firebaseYapilandirildi } from "@/lib/firebaseClient";
import { kuyruguListele, kuyruktanSil, type OutboxKaydi } from "@/lib/outbox";

// TODO: Firestore koleksiyonlarını oluşturunca tip -> koleksiyon eşlemesini gerçek isimlerle güncelle.
const KOLEKSIYON_ESLEME: Record<OutboxKaydi["tip"], string> = {
  gorev_tamamla: "gorevler",
  gorev_ata: "gorevler",
  ciro_girisi: "ciro_kayitlari",
  stok_sayimi: "stok_sayim_kayitlari",
  denetim_formu: "denetim_formlari"
};

async function kaydiGonder(kayit: OutboxKaydi) {
  const koleksiyonAdi = KOLEKSIYON_ESLEME[kayit.tip];
  const { id, ...veri } = kayit.payload as { id?: string; [key: string]: unknown };

  if (id) {
    // Var olan bir görevi güncelliyoruz (ör. görev tamamlama) -> belge id'si belli.
    await setDoc(doc(db, koleksiyonAdi, id), veri, { merge: true });
  } else {
    // Yeni kayıt oluşturuyoruz (ör. yeni görev atama, ciro girişi) -> Firestore id'yi kendi versin.
    await addDoc(collection(db, koleksiyonAdi), veri);
  }
}

export async function kuyruguSenkronEt(): Promise<{ basarili: number; hatali: number }> {
  if (!firebaseYapilandirildi) {
    // Firebase henüz bağlanmadıysa senkron denemesi yapma; kayıtlar kuyrukta bekler.
    return { basarili: 0, hatali: 0 };
  }
  const kayitlar = await kuyruguListele();
  let basarili = 0;
  let hatali = 0;

  for (const kayit of kayitlar) {
    try {
      await kaydiGonder(kayit);
      await kuyruktanSil(kayit.id);
      basarili += 1;
    } catch (e) {
      hatali += 1;
      // Ağ hatasıysa kayıt kuyrukta kalır, bir sonraki "online" olayında tekrar denenir.
      console.warn("Senkron başarısız, kayıt kuyrukta bekliyor:", kayit.id, e);
    }
  }
  return { basarili, hatali };
}

export function senkronDinleyicileriKur(onSenkron?: (sonuc: { basarili: number; hatali: number }) => void) {
  if (typeof window === "undefined") return () => {};

  const calistir = async () => {
    if (navigator.onLine) {
      const sonuc = await kuyruguSenkronEt();
      if ((sonuc.basarili > 0 || sonuc.hatali > 0) && onSenkron) onSenkron(sonuc);
    }
  };

  window.addEventListener("online", calistir);
  // Uygulama açılışında da bir kez dene (kuyrukta bekleyen varsa).
  calistir();

  return () => window.removeEventListener("online", calistir);
}
