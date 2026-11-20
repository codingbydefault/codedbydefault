import type { Metadata, Viewport } from "next";
import "./reset.css";

const title = "CodedByDefault — Beyond default";
const description =
  "CodedByDefault ontwerpt en bouwt digitale producten op het snijvlak van webdesign, software, AI en IT.";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.codedbydefault.com"),
  title,
  description,
  alternates: { canonical: "/" },
  icons: { icon: "/assets/codedbydefault-logo-v02.png" },
  openGraph: {
    title,
    description,
    url: "/",
    siteName: "CodedByDefault",
    locale: "nl_NL",
    type: "website",
    images: [
      {
        url: "/assets/codedbydefault-logo-v02.png",
        width: 2011,
        height: 782,
        alt: "CodedByDefault",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/assets/codedbydefault-logo-v02.png"],
  },
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
      </head>
      <body>{children}</body>
    </html>
  );
}
