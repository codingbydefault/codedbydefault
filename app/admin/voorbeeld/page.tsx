import { notFound } from "next/navigation";
import { createSampleDashboard } from "../../../lib/admin/sample";
import { DashboardView } from "../dashboard-view";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export const dynamic = "force-dynamic";

export default async function PreviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (process.env.NODE_ENV === "production" || process.env.ADMIN_PREVIEW !== "1") notFound();
  const params = await searchParams;
  const hideTests = one(params.tests) !== "tonen";
  return (
    <DashboardView
      model={createSampleDashboard(new Date(), hideTests)}
      email="codedbydefault@gmail.com"
      hideTests={hideTests}
      basePath="/admin/voorbeeld"
      notice={{ tone: "ok", text: "Voorbeelddata. Dit scherm bestaat alleen lokaal en toont geen echte aanvragen." }}
      editingSlug={one(params.bewerken)}
    />
  );
}
