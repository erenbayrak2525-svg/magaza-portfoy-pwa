import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0F172A",       // ana metin / koyu zemin
        canvas: "#F5F6F8",    // sayfa arka planı
        surface: "#FFFFFF",   // kart zemini
        line: "#E3E6EA",      // kenarlık
        brand: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          400: "#5B6EF5",
          500: "#3B4CE0",
          600: "#2E3BC2",
          700: "#242E99"
        },
        signal: {
          pending: "#B4740E",
          pendingBg: "#FDF3E2",
          done: "#0F7A4C",
          doneBg: "#E6F6EE",
          late: "#C4341E",
          lateBg: "#FBEAE7",
          offline: "#6B7280"
        }
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Inter", "Roboto", "system-ui", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"]
      },
      borderRadius: {
        card: "14px"
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.06), 0 1px 8px rgba(15,23,42,0.04)"
      }
    }
  },
  plugins: []
};

export default config;
