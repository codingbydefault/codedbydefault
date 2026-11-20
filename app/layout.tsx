import type { Metadata, Viewport } from "next";
import { DM_Mono, Manrope, Syne } from "next/font/google";
import "./reset.css";

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
  preload: false,
});

const syne = Syne({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-syne",
  preload: false,
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
  variable: "--font-dm-mono",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.codedbydefault.com"),
  title: "CodedByDefault — Beyond default",
  description:
    "CodedByDefault ontwerpt en bouwt digitale producten op het snijvlak van webdesign, software, AI en IT.",
  alternates: { canonical: "/" },
  icons: { icon: "/assets/codedbydefault-favicon.png" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#090b0f",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="nl" className={`${manrope.variable} ${syne.variable} ${dmMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
