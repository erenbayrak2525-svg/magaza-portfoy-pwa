type Durum = "bekliyor" | "devam_ediyor" | "tamamlandi" | "onay_bekliyor" | "reddedildi" | "beklemede_senkron";

const STIL: Record<Durum, { bg: string; text: string; label: string }> = {
  bekliyor: { bg: "bg-signal-pendingBg", text: "text-signal-pending", label: "Bekliyor" },
  devam_ediyor: { bg: "bg-brand-50", text: "text-brand-600", label: "Devam Ediyor" },
  tamamlandi: { bg: "bg-signal-doneBg", text: "text-signal-done", label: "Tamamlandı" },
  onay_bekliyor: { bg: "bg-signal-pendingBg", text: "text-signal-pending", label: "Onay Bekliyor" },
  reddedildi: { bg: "bg-signal-lateBg", text: "text-signal-late", label: "Reddedildi" },
  beklemede_senkron: { bg: "bg-gray-100", text: "text-signal-offline", label: "Senkron Bekliyor" }
};

export default function DurumRozeti({ durum }: { durum: Durum }) {
  const s = STIL[durum];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  );
}

export function stripRengi(durum: Durum): string {
  switch (durum) {
    case "tamamlandi":
      return "#0F7A4C";
    case "reddedildi":
      return "#C4341E";
    case "beklemede_senkron":
      return "#6B7280";
    case "devam_ediyor":
      return "#3B4CE0";
    default:
      return "#B4740E";
  }
}
