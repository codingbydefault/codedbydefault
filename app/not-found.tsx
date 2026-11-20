import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pagina niet gevonden — CodedByDefault",
};

export default function NotFound() {
  return (
    <>
      <link rel="stylesheet" href="/styles.css?v=20261120-ux" />
      <main className="miss">
        <a className="brand" href="/">
          <img
            className="brand-logo"
            src="/assets/codedbydefault-logo-160.webp"
            srcSet="/assets/codedbydefault-logo-96.webp 96w, /assets/codedbydefault-logo-160.webp 160w, /assets/codedbydefault-logo-240.webp 240w, /assets/codedbydefault-logo-360.webp 360w"
            sizes="76px"
            alt=""
            width={160}
            height={62}
            decoding="async"
          />
          <span className="brand-name">CodedByDefault</span>
        </a>
        <p className="kicker">404</p>
        <h1>Deze pagina bestaat niet.</h1>
        <a className="miss-link" href="/">
          Naar de homepage
        </a>
      </main>
    </>
  );
}
