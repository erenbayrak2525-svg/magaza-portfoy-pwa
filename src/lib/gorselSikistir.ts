// Firestore'da tek bir alan (field) en fazla ~1MB olabiliyor. Telefon kameralarından gelen
// ham fotoğraflar genelde birkaç MB olduğu için, base64'e çevirip doğrudan Firestore'a
// yazmak "longer than 1048487 bytes" hatasına yol açıyor. Bu fonksiyon, kaydetmeden önce
// görseli tarayıcıda küçültüp JPEG'e sıkıştırarak güvenli boyuta indiriyor.
export function gorselSikistir(dosya: File, maksimumKenar = 1000, kalite = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const okuyucu = new FileReader();
    okuyucu.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maksimumKenar) {
          height = Math.round((height * maksimumKenar) / width);
          width = maksimumKenar;
        } else if (height >= width && height > maksimumKenar) {
          width = Math.round((width * maksimumKenar) / height);
          height = maksimumKenar;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas bu tarayıcıda desteklenmiyor"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        // Kalite kademeli düşürülerek 900KB'ın altına inmeye çalışılıyor
        // (Firestore sınırı ~1MB, base64 kodlaması ham boyutu ~%33 büyüttüğü için pay bırakıyoruz).
        let sonucKalite = kalite;
        let veriUrl = canvas.toDataURL("image/jpeg", sonucKalite);
        let deneme = 0;
        while (veriUrl.length > 900_000 && deneme < 4) {
          sonucKalite -= 0.15;
          veriUrl = canvas.toDataURL("image/jpeg", Math.max(sonucKalite, 0.2));
          deneme += 1;
        }

        resolve(veriUrl);
      };
      img.onerror = () => reject(new Error("Görsel okunamadı, dosya bozuk olabilir"));
      img.src = okuyucu.result as string;
    };
    okuyucu.onerror = () => reject(new Error("Dosya okunamadı"));
    okuyucu.readAsDataURL(dosya);
  });
}
