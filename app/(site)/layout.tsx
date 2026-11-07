import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { PageviewBeacon } from "./pageview-beacon";

export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <link rel="stylesheet" href="/styles.css?v=20261104-3" />
      <link rel="stylesheet" href="/projects.css?v=20261104-2" />
      {children}
      <PageviewBeacon />
      <Analytics />
      <SpeedInsights />
      <Script src="/site.js?v=20261104-2" strategy="afterInteractive" />
    </>
  );
}
