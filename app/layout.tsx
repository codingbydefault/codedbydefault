import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./reset.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.codedbydefault.com"),
  title: "CodedByDefault — Beyond default",
  description:
    "CodedByDefault ontwerpt en bouwt digitale producten op het snijvlak van webdesign, software, AI en IT.",
  alternates: { canonical: "/" },
  icons: { icon: "/assets/codedbydefault-logo-v02.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#090b0f",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Manrope:wght@400;500;600;700&family=Syne:wght@600;700;800&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="/styles.css?v=20261104-2" />
        <link rel="stylesheet" href="/projects.css?v=20261104-2" />
      </head>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
        <Script src="/site.js?v=20261104-2" strategy="afterInteractive" />
      </body>
    </html>
  );
}
