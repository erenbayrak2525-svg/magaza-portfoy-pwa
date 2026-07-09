import type { Metadata, Viewport } from "next";
import ServiceWorkerKaydi from "@/components/ServiceWorkerKaydi";
import "./globals.css";

// "./manifest.webmanifest" gibi NOKTA-göreli yollar, sayfanın kendi URL'ine göre çözülüyor —
// bu yüzden /panel/ gibi alt sayfalarda .../panel/manifest.webmanifest aranıp 404 alınıyordu.
// BASE_PATH'i başa ekleyip her zaman site köküne göre sabit, doğru bir yol üretiyoruz.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const metadata: Metadata = {
  title: "Wasmoda Mağaza Portföyü ve Personel Yönetimi",
  description: "Saha ekipleri ve mağaza portföyü için operasyonel yönetim uygulaması",
  manifest: `${BASE_PATH}/manifest.webmanifest`,
  icons: {
    icon: [`${BASE_PATH}/favicon.png`, `${BASE_PATH}/icons/icon-192.png`],
    shortcut: `${BASE_PATH}/favicon.png`,
    apple: `${BASE_PATH}/icons/icon-192.png`
  },
  // iOS Safari, Web App Manifest'teki "display: standalone" ayarını "Ana Ekrana Ekle"
  // ile eklenen simgeler için tek başına yeterli saymaz — bu eski Apple meta etiketleri
  // olmadan uygulama her zaman normal bir Safari sekmesi (üstte/altta tarayıcı çubuğuyla)
  // gibi açılır. appleWebApp burada gerekli <meta name="apple-mobile-web-app-..."> 
  // etiketlerini otomatik üretir.
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Wasmoda Portföy"
  }
};

export const viewport: Viewport = {
  themeColor: "#3B4CE0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="font-sans bg-canvas text-ink min-h-screen">
        {children}
        <ServiceWorkerKaydi />
      </body>
    </html>
  );
}
