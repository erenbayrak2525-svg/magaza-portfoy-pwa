// Basit bir IndexedDB "outbox" (giden kutusu) katmanı.
// İnternet yokken kaydedilen görev tamamlamaları / form gönderimleri burada birikir,
// bağlantı geri geldiğinde src/lib/senkron.ts bu kuyruğu boşaltıp Firestore'a gönderir.

const DB_ADI = "magaza-portfoy-db";
const DB_SURUM = 1;
export const OUTBOX_STORE = "outbox";

export interface OutboxKaydi {
  id: string;                 // crypto.randomUUID()
  tip: "gorev_tamamla" | "gorev_ata" | "ciro_girisi" | "stok_sayimi" | "denetim_formu" | "stok_urun_guncelle" | "stok_urun_ice_aktar" | "kasa_kaydi_ekle" | "calisma_programi_guncelle" | "bildirim_ekle" | "toplu_bildirim" | "urun_karti_ekle";
  payload: Record<string, unknown>;
  olusturmaZamani: number;
  denemeSayisi: number;
}

function dbAc(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB bu ortamda yok"));
      return;
    }
    const istek = indexedDB.open(DB_ADI, DB_SURUM);
    istek.onupgradeneeded = () => {
      const db = istek.result;
      if (!db.objectStoreNames.contains(OUTBOX_STORE)) {
        db.createObjectStore(OUTBOX_STORE, { keyPath: "id" });
      }
    };
    istek.onsuccess = () => resolve(istek.result);
    istek.onerror = () => reject(istek.error);
  });
}

export async function kuyrugaEkle(kayit: Omit<OutboxKaydi, "id" | "olusturmaZamani" | "denemeSayisi">) {
  const db = await dbAc();
  const tam: OutboxKaydi = {
    ...kayit,
    id: crypto.randomUUID(),
    olusturmaZamani: Date.now(),
    denemeSayisi: 0
  };
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(OUTBOX_STORE, "readwrite");
    tx.objectStore(OUTBOX_STORE).put(tam);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function kuyruguListele(): Promise<OutboxKaydi[]> {
  const db = await dbAc();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OUTBOX_STORE, "readonly");
    const istek = tx.objectStore(OUTBOX_STORE).getAll();
    istek.onsuccess = () => resolve(istek.result as OutboxKaydi[]);
    istek.onerror = () => reject(istek.error);
  });
}

export async function kuyruktanSil(id: string) {
  const db = await dbAc();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(OUTBOX_STORE, "readwrite");
    tx.objectStore(OUTBOX_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
