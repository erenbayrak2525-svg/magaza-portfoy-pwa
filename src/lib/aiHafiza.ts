// WAS AI ortak hafıza sistemi.
//
// İki katman var:
// 1) TAMPON (ai_hafiza/tampon): tüm kullanıcıların son ~20 mesajı ortak bir listede birikir.
// 2) KALICI (ai_hafiza/kalici): tampon dolunca, yapay zekanın kendisine "bu konuşmalarda
//    tekrar eden, ileride hatırlamaya değer ne var?" diye sorulur; verdiği özet kalıcı
//    notlara eklenir ve tampon temizlenir. Kalıcı notlar her sohbette sistem mesajına
//    eklenir — böylece WAS AI ekibin alışkanlıklarını zamanla "öğrenir".
//
// Tüm ekip tek havuz kullanır (kişiye özel hafıza yok) — kullanıcının tercihi bu yöndeydi.

import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, firebaseYapilandirildi } from "@/lib/firebaseClient";

const TAMPON_LIMITI = 20;
const KALICI_NOT_LIMITI = 30; // kalıcı liste sonsuz büyümesin

export interface TamponMesaj {
  rol: "user" | "assistant";
  icerik: string;
  zaman: string;
  kullaniciAdi?: string;
}

export async function kaliciHafizayiGetir(): Promise<string[]> {
  if (!firebaseYapilandirildi) return [];
  try {
    const belge = await getDoc(doc(db, "ai_hafiza", "kalici"));
    const notlar = belge.exists() ? (belge.data().notlar as string[] | undefined) : undefined;
    return Array.isArray(notlar) ? notlar : [];
  } catch {
    return [];
  }
}

export async function tamponaEkle(mesajlar: TamponMesaj[]): Promise<TamponMesaj[]> {
  if (!firebaseYapilandirildi) return [];
  const ref = doc(db, "ai_hafiza", "tampon");
  const belge = await getDoc(ref);
  const mevcut: TamponMesaj[] = belge.exists() ? ((belge.data().mesajlar as TamponMesaj[]) ?? []) : [];
  const yeni = [...mevcut, ...mesajlar];
  await setDoc(ref, { mesajlar: yeni }, { merge: true });
  return yeni;
}

async function tamponuTemizle(): Promise<void> {
  await setDoc(doc(db, "ai_hafiza", "tampon"), { mesajlar: [] }, { merge: true });
}

async function kaliciNotEkle(yeniNot: string): Promise<void> {
  const mevcut = await kaliciHafizayiGetir();
  // En yeni not başa; limit aşılırsa en eski notlar düşer.
  const guncel = [yeniNot, ...mevcut].slice(0, KALICI_NOT_LIMITI);
  await setDoc(doc(db, "ai_hafiza", "kalici"), { notlar: guncel, guncelleme: new Date().toISOString() }, { merge: true });
}

// Tampon limiti aştıysa: yapay zekaya özetletir, kalıcıya yazar, tamponu boşaltır.
// Başarısız olursa sessizce geçer (hafıza kritik değil, sohbeti bozmasın).
export async function gerekiyorsaOzetleVeKaydet(
  tampon: TamponMesaj[],
  apiKey: string,
  model: string
): Promise<void> {
  if (tampon.length < TAMPON_LIMITI) return;

  try {
    const konusmaMetni = tampon
      .map((m) => `${m.rol === "user" ? `Kullanıcı${m.kullaniciAdi ? ` (${m.kullaniciAdi})` : ""}` : "WAS AI"}: ${m.icerik}`)
      .join("\n");

    const yanit = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "Sen bir hafıza özetleyicisisin. Sana bir mağaza ekibinin yapay zeka asistanıyla yaptığı son konuşmalar verilecek. Görevin: tekrar eden konuları, ekibin alışkanlıklarını, sık sorulan soru kalıplarını ve ileride hatırlamaya değer kalıcı bilgileri 1-3 kısa maddede özetlemek. SADECE gerçekten tekrar eden veya kalıcı değeri olan şeyleri yaz; tek seferlik/önemsiz konuşmaları alma. Hatırlamaya değer hiçbir şey yoksa sadece 'YOK' yaz. Maddeleri kısa tut, madde başına en fazla bir cümle."
          },
          { role: "user", content: konusmaMetni }
        ]
      })
    });

    if (!yanit.ok) throw new Error(`Özetleme isteği başarısız: ${yanit.status}`);
    const veri = await yanit.json();
    const ozet: string = veri?.choices?.[0]?.message?.content?.trim() || "";

    if (ozet && ozet.toUpperCase() !== "YOK") {
      await kaliciNotEkle(ozet);
    }
    await tamponuTemizle();
  } catch (e) {
    // Özetleme başarısız olsa bile tamponu temizle ki sonsuza kadar birikip
    // her mesajda tekrar tekrar denenmesin.
    console.warn("Hafıza özetleme başarısız:", e);
    await tamponuTemizle().catch(() => {});
  }
}
