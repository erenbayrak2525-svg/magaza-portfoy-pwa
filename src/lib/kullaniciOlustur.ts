// Firebase Admin SDK sunucu tarafında çalışır, bu sitede backend yok. Bunun yerine
// Firebase Auth REST API'sini (signUp endpoint) doğrudan çağırıyoruz — bu sayede
// mevcut admin oturumu hiç etkilenmez (admin SDK olmadan yeni kullanıcı oluşturmanın
// en temiz yolu budur).
import { doc, setDoc } from "firebase/firestore";
import { db, firebaseYapilandirildi } from "@/lib/firebaseClient";

export interface YeniKullaniciBilgileri {
  adSoyad: string;
  eposta: string;
  sifre: string;
  rol: "personel" | "bolge_muduru" | "admin";
}

export async function yeniKullaniciOlustur(bilgiler: YeniKullaniciBilgileri): Promise<string> {
  if (!firebaseYapilandirildi) throw new Error("Firebase bağlı değil (demo modu)");
  if (!bilgiler.adSoyad.trim()) throw new Error("Ad Soyad boş olamaz");
  if (!bilgiler.eposta.trim()) throw new Error("E-posta boş olamaz");
  if (bilgiler.sifre.length < 6) throw new Error("Şifre en az 6 karakter olmalı");

  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) throw new Error("Firebase API Key bulunamadı");

  // Firebase Auth REST API ile yeni kullanıcı oluştur — mevcut admin oturumuna
  // hiç dokunmaz çünkü JS SDK'yı değil, HTTP endpoint'ini kullanıyoruz.
  const yanit = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: bilgiler.eposta.trim(),
        password: bilgiler.sifre,
        displayName: bilgiler.adSoyad.trim(),
        returnSecureToken: false
      })
    }
  );

  const veri = await yanit.json();

  if (!yanit.ok || veri.error) {
    const mesaj = veri.error?.message || "Kullanıcı oluşturulamadı";
    if (mesaj === "EMAIL_EXISTS") throw new Error("Bu e-posta adresi zaten kayıtlı");
    if (mesaj === "WEAK_PASSWORD : Password should be at least 6 characters")
      throw new Error("Şifre en az 6 karakter olmalı");
    throw new Error(mesaj);
  }

  const uid: string = veri.localId;

  // Firestore'a profil belgesi yaz (mevcut admin kimlik bilgileriyle)
  await setDoc(doc(db, "profiles", uid), {
    adSoyad: bilgiler.adSoyad.trim(),
    rol: bilgiler.rol,
    sonGorulme: null
  });

  return uid;
}
