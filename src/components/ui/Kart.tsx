import type { ReactNode } from "react";

interface KartProps {
  children: ReactNode;
  stripRengi?: string;   // verilirse sol kenarda durum şeridi gösterir
  onClick?: () => void;
  className?: string;
}

export default function Kart({ children, stripRengi, onClick, className = "" }: KartProps) {
  const icerik = (
    <div
      className={`bg-surface rounded-card shadow-card border border-line p-4 ${stripRengi ? "status-strip" : ""} ${className}`}
      style={stripRengi ? ({ "--strip-color": stripRengi } as React.CSSProperties) : undefined}
    >
      {children}
    </div>
  );

  if (onClick) {
    return (
      <button onClick={onClick} className="w-full text-left focus-ring rounded-card">
        {icerik}
      </button>
    );
  }
  return icerik;
}
