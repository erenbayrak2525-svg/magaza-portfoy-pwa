import type { ButtonHTMLAttributes } from "react";

interface ButonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  varyant?: "birincil" | "ikincil" | "tehlike" | "hayalet";
  tamGenislik?: boolean;
}

const VARYANT_SINIF: Record<string, string> = {
  birincil: "bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700",
  ikincil: "bg-surface border border-line text-ink hover:bg-canvas",
  tehlike: "bg-signal-lateBg text-signal-late hover:bg-red-100",
  hayalet: "bg-transparent text-ink hover:bg-canvas"
};

export default function Buton({
  varyant = "birincil",
  tamGenislik = false,
  className = "",
  children,
  ...props
}: ButonProps) {
  return (
    <button
      className={`focus-ring inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none ${
        VARYANT_SINIF[varyant]
      } ${tamGenislik ? "w-full" : ""} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
