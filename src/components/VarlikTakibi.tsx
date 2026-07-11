"use client";

import { useEffect } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db, firebaseYapilandirildi } from "@/lib/firebaseClient";
import { useAuthStore } from "@/store/authStore";

// Gerçek bir "presence" sistemi (Firebase Realtime Database ile anlık bağlantı takibi)
// kurmak yerine, çok daha basit bir yöntem: kullanıcı uygulamayı her açtığında ve
// belirli aralıklarla "son görülme" zamanını Firestore'a yazıyoruz. Admin, Profil
// sayfasında bu zaman damgasına göre "çevrimiçi" (~son 5 dk) veya "X önce görüldü"
// şeklinde yaklaşık bir durum görebiliyor. Kesin/anlık değil ama küçük bir ekip için
// yeterli ve ekstra Firebase servisi gerektirmiyor.
export default function VarlikTakibi() {
  const kullanici = useAuthStore((s) => s.kullanici);

  useEffect(() => {
    if (!kullanici || !firebaseYapilandirildi) return;

    const guncelle = () => {
      setDoc(doc(db, "profiles", kullanici.id), { sonGorulme: new Date().toISOString() }, { merge: true }).catch(
        () => {
          // Sessizce geç: presence güncellemesi kritik değil, kullanıcıyı rahatsız etmesin.
        }
      );
    };

    guncelle();
    const aralik = setInterval(guncelle, 2 * 60 * 1000); // her 2 dakikada bir tazele
    return () => clearInterval(aralik);
  }, [kullanici]);

  return null;
}
