import type { Metadata, Viewport } from "next";
import ServiceWorkerKaydi from "@/components/ServiceWorkerKaydi";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mağaza Portföyü ve Personel Yönetimi",
  description: "Saha ekipleri ve mağaza portföyü için operasyonel yönetim uygulaması",
  manifest: "./manifest.webmanifest",
  icons: {
    icon: "./icons/icon-192.png",
    apple: "./icons/icon-192.png"
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
