"use client";

import { useEffect, useState } from "react";

export function useCevrimici() {
  const [cevrimici, setCevrimici] = useState(true);

  useEffect(() => {
    setCevrimici(navigator.onLine);
    const online = () => setCevrimici(true);
    const offline = () => setCevrimici(false);
    window.addEventListener("online", online);
    window.addEventListener("offline", offline);
    return () => {
      window.removeEventListener("online", online);
      window.removeEventListener("offline", offline);
    };
  }, []);

  return cevrimici;
}
