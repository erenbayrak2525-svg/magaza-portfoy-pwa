/** @type {import('next').NextConfig} */

// TODO: Repo adını GitHub'da oluşturduğunda buraya yaz.
// Örn. repo adın "magaza-portfoy-pwa" ise:  '/magaza-portfoy-pwa'
// Kullanıcı/organizasyon sitesi (username.github.io) kullanacaksan BASE_PATH'i boş bırak.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig = {
  reactStrictMode: true,
  output: "export",          // GitHub Pages statik dosya servis eder, Next server'ı çalıştırmaz
  basePath: BASE_PATH,
  assetPrefix: BASE_PATH ? `${BASE_PATH}/` : undefined,
  trailingSlash: true,       // GitHub Pages'te /sayfa/index.html yönlendirmesi için gerekli
  images: {
    unoptimized: true        // next/image optimizasyon API'si statik export'ta çalışmaz
  }
};

module.exports = nextConfig;
