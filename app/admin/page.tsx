import { requireAdmin } from "../../lib/admin/access";
import { loadDashboard } from "../../lib/admin/load";
import { AdminShell, DashboardView } from "./dashboard-view";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function noticeFrom(params: Record<string, string | string[] | undefined>) {
  const saved = one(params.opgeslagen);
  if (saved) return { tone: "ok" as const, text: "Project opgeslagen." };
  const fout = one(params.fout);
  if (fout === "project") return { tone: "error" as const, text: "Het project is niet opgeslagen. Controleer status, voortgang en link." };
  if (fout === "opslag") return { tone: "error" as const, text: "De geheime Supabase-sleutel ontbreekt, dus opslaan lukt niet." };
  return null;
}

const FAILURES = {
  "niet-geconfigureerd": "De geheime Supabase-sleutel ontbreekt. Zet SUPABASE_SECRET_KEY in de omgeving.",
  migratie: "De database is nog niet bijgewerkt. Draai de migratie in Supabase en laad deze pagina opnieuw.",
  onbekend: "De cijfers konden niet worden geladen. Probeer het later opnieuw.",
};

export const dynamic = "force-dynamic";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const hideTests = one(params.tests) !== "tonen";
  const result = await loadDashboard(hideTests);
  if (!result.ok) {
    return (
      <AdminShell email={admin.email}>
        <section className="panel">
          <h1>Overzicht</h1>
          <p>{FAILURES[result.reason]}</p>
        </section>
      </AdminShell>
    );
  }

  return (
    <DashboardView
      model={result.model}
      email={admin.email}
      hideTests={hideTests}
      basePath="/admin"
      notice={noticeFrom(params)}
      editingSlug={one(params.bewerken)}
      savedSlug={one(params.opgeslagen)}
    />
  );
}
