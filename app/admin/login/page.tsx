import { redirect } from "next/navigation";
import { isAllowlisted, parseAllowlist } from "../../../lib/admin/allowlist";
import { createAuthClient } from "../../../lib/supabase/server";
import { login, sendMagicLink } from "../actions";
import { SubmitButton } from "../submit-button";

const MESSAGES: Record<string, { tone: "ok" | "error"; text: string }> = {
  ontbrekend: { tone: "error", text: "Vul je e-mailadres en wachtwoord in." },
  mislukt: { tone: "error", text: "Inloggen is niet gelukt. Controleer je gegevens." },
  "geen-toegang": { tone: "error", text: "Dit account heeft geen toegang tot het beheer." },
  configuratie: { tone: "error", text: "Supabase of de beheerlijst is nog niet ingesteld." },
  link: { tone: "error", text: "De inloglink is ongeldig of verlopen." },
  verbinding: { tone: "error", text: "De verbinding met de login is nu niet gelukt." },
  verstuurd: { tone: "ok", text: "Als dit adres op de beheerlijst staat, ontvang je zo een inloglink." },
};

export const dynamic = "force-dynamic";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL
    && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    && parseAllowlist(process.env.ADMIN_EMAILS).length > 0,
  );
  const supabase = await createAuthClient();
  if (supabase && configured) {
    const { data } = await supabase.auth.getUser();
    if (data.user?.email && data.user.email_confirmed_at && isAllowlisted(data.user.email)) {
      redirect("/admin");
    }
  }

  const key = one(params.melding) ?? one(params.fout) ?? (configured ? "" : "configuratie");
  const message = MESSAGES[key];

  return (
    <div className="login">
      <section className="login-card">
        <p className="brand">Coded<span>By</span>Default</p>
        <h1>Beheer.</h1>
        <p>Alleen een e-mailadres op de beheerlijst komt hier binnen.</p>
        {message ? <p className={`notice notice-${message.tone}`} role="status">{message.text}</p> : null}
        <form action={login}>
          <label>
            E-mailadres
            <input name="email" type="email" autoComplete="username" required />
          </label>
          <label>
            Wachtwoord
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <SubmitButton pendingLabel="Bezig…">Inloggen</SubmitButton>
        </form>
        <details>
          <summary>Liever een inloglink?</summary>
          <form action={sendMagicLink}>
            <label>
              E-mailadres
              <input name="email" type="email" autoComplete="username" required />
            </label>
            <SubmitButton pendingLabel="Versturen…">Stuur inloglink</SubmitButton>
          </form>
        </details>
      </section>
    </div>
  );
}
