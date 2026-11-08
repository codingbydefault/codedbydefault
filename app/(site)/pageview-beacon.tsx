"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

let lastKey = "";
let lastAt = 0;

export function PageviewBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    const now = Date.now();
    if (lastKey === pathname && now - lastAt < 1500) return;
    lastKey = pathname;
    lastAt = now;
    const body = JSON.stringify({ path: pathname });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/bezoek", new Blob([body], { type: "application/json" }));
      return;
    }
    void fetch("/api/bezoek", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    });
  }, [pathname]);

  return null;
}
