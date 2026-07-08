import type { Metadata, Viewport } from "next";
import ServiceWorkerKaydi from "@/components/ServiceWorkerKaydi";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wasmoda Mağaza Portföyü ve Personel Yönetimi",
  description: "Saha ekipleri ve mağaza portföyü için operasyonel yönetim uygulaması",
  manifest: "./manifest.webmanifest",
  icons: {
    icon: ["./favicon.png", "./icons/icon-192.png"],
    shortcut: "./favicon.png",
    apple: "./icons/icon-192.png"
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
