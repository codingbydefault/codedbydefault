import { logout, updateProject } from "./actions";
import { SubmitButton } from "./submit-button";
import { formatDateTime, formatDayLabel, formatNumber, formatPercent } from "../../lib/admin/format";
import type { DashboardModel } from "../../lib/admin/model";
import type { MetricSet, VisitorPoint } from "../../lib/admin/metrics";
import { STATUS_LABELS, safeHttpUrl, type ProjectCard } from "../../lib/admin/projects";

export function AdminShell({
  email,
  children,
  showLogout = true,
}: {
  email?: string;
  children: React.ReactNode;
  showLogout?: boolean;
}) {
  return (
    <>
      <header className="admin-bar">
        <div className="admin-brand">
          <img src="/assets/codedbydefault-logo-v02.png" alt="" width={148} height={58} />
          <div>
            <p>CodedByDefault</p>
            <strong>Beheer</strong>
          </div>
        </div>
        <div className="admin-session">
          {email ? <span>{email}</span> : null}
          {showLogout ? (
            <form action={logout}>
              <button className="ghost" type="submit">Uitloggen</button>
            </form>
          ) : null}
        </div>
      </header>
      <main className="admin-main">{children}</main>
    </>
  );
}

function MetricCard({ title, metrics }: { title: string; metrics: MetricSet }) {
  const items = [
    ["Totaal", metrics.total],
    ["Vandaag", metrics.today],
    ["7 dagen", metrics.days7],
    ["30 dagen", metrics.days30],
  ] as const;
  return (
    <article className="metric">
      <h2>{title}</h2>
      <dl>
        {items.map(([label, value]) => (
          <div key={label} className={label === "Vandaag" ? "is-today" : undefined}>
            <dt>{label}</dt>
            <dd>{formatNumber(value)}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function VisitorChart({ points }: { points: VisitorPoint[] }) {
  const width = 720;
  const height = 196;
  const max = Math.max(1, ...points.map((point) => point.visitors));
  const gap = 3;
  const barWidth = (width - gap * (points.length - 1)) / Math.max(points.length, 1);
  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Staafdiagram van unieke bezoekers per dag over 30 dagen">
        {points.map((point, index) => {
          const barHeight = point.visitors === 0 ? 3 : Math.max(8, (point.visitors / max) * (height - 12));
          const x = index * (barWidth + gap);
          const y = height - barHeight;
          return (
            <rect key={point.day} x={x} y={y} width={barWidth} height={barHeight} rx={1.5} className={point.visitors === 0 ? "bar-empty" : "bar"}>
              <title>{`${formatDayLabel(point.day)}: ${formatNumber(point.visitors)} unieke bezoekers, ${formatNumber(point.pageviews)} paginaweergaven`}</title>
            </rect>
          );
        })}
      </svg>
      <figcaption>
        <span>{formatDayLabel(points[0]?.day ?? "")}</span>
        <span>{formatDayLabel(points[Math.floor(points.length / 2)]?.day ?? "")}</span>
        <span>{formatDayLabel(points[points.length - 1]?.day ?? "")}</span>
      </figcaption>
      <table className="sr-only">
        <caption>Unieke bezoekers en paginaweergaven per dag</caption>
        <thead>
          <tr>
            <th>Dag</th>
            <th>Unieke bezoekers</th>
            <th>Paginaweergaven</th>
          </tr>
        </thead>
        <tbody>
          {points.map((point) => (
            <tr key={point.day}>
              <td>{formatDayLabel(point.day)}</td>
              <td>{point.visitors}</td>
              <td>{point.pageviews}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function ProjectEditor({ project, open }: { project: ProjectCard; open: boolean }) {
  const href = safeHttpUrl(project.url);
  return (
    <article className={`project-card status-${project.status}`}>
      <div className="project-top">
        <span className="status-pill">{STATUS_LABELS[project.status]}</span>
        <span className="progress-label">{project.progress}%</span>
      </div>
      <h3>{project.name}</h3>
      <p>{project.summary}</p>
      <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={project.progress} aria-label={`Voortgang ${project.name}`}>
        <span style={{ width: `${project.progress}%` }} />
      </div>
      {href ? <a className="project-link" href={href} target="_blank" rel="noreferrer">Open project</a> : <span className="project-link is-empty">Nog geen link</span>}
      <details open={open ? true : undefined}>
        <summary>Aanpassen</summary>
        <form action={updateProject}>
          <input type="hidden" name="slug" value={project.slug} />
          <label>
            Status
            <select name="status" defaultValue={project.status}>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label>
            Voortgang
            <input name="progress" type="number" min={0} max={100} step={1} defaultValue={project.progress} required />
          </label>
          <label>
            Link
            <input name="url" type="url" inputMode="url" placeholder="https://" defaultValue={project.url ?? ""} />
          </label>
          <label>
            Korte omschrijving
            <textarea name="summary" rows={3} maxLength={400} defaultValue={project.summary} />
          </label>
          <SubmitButton pendingLabel="Opslaan…">Opslaan</SubmitButton>
        </form>
      </details>
    </article>
  );
}

export function DashboardView({
  model,
  email,
  hideTests,
  basePath,
  notice,
  editingSlug,
  savedSlug,
}: {
  model: DashboardModel;
  email: string;
  hideTests: boolean;
  basePath: string;
  notice: { tone: "ok" | "error"; text: string } | null;
  editingSlug?: string | null;
  savedSlug?: string | null;
}) {
  const testsHref = hideTests ? `${basePath}?tests=tonen` : basePath;
  return (
    <AdminShell email={email}>
      <div className="page-head">
        <div>
          <p className="kicker">Aanvragen, bereik en projecten</p>
          <h1>Overzicht</h1>
        </div>
        <a className="ghost" href={testsHref}>{hideTests ? "Toon testaanvragen" : "Verberg testaanvragen"}</a>
      </div>
      {notice ? <p className={`notice notice-${notice.tone}`} role="status">{notice.text}</p> : null}
      <p className="filter-note">{hideTests ? "Testaanvragen zijn verborgen. Dat zijn adressen op resend.dev en namen met ‘test’." : "Testaanvragen staan erbij."}</p>
      <section className="metric-grid" aria-label="Kerncijfers">
        <MetricCard title="Gidsaanvragen" metrics={model.guides} />
        <MetricCard title="Quickscans" metrics={model.quickscans} />
        <MetricCard title="Downloads" metrics={model.downloads} />
      </section>
      <section className="reach">
        <div className="panel">
          <div className="panel-head">
            <h2>Bezoekers per dag</h2>
            <p>{formatNumber(model.conversion.days30.visitors)} unieke bezoekers · {formatNumber(model.pageviews30)} paginaweergaven in 30 dagen</p>
          </div>
          <VisitorChart points={model.visitors} />
          <p className="fine">Geen cookies en geen IP-adressen. Dezelfde browser telt elke dag opnieuw als één bezoeker. Bots en prefetch worden overgeslagen.</p>
        </div>
        <aside className="panel conversion">
          <h2>Bezoeker naar aanvraag</h2>
          <p>Gidsaanvragen en quickscans gedeeld door de som van de dagelijkse unieke bezoekers.</p>
          <dl>
            <div>
              <dt>7 dagen</dt>
              <dd>{formatPercent(model.conversion.days7.rate)}</dd>
              <small>{formatNumber(model.conversion.days7.requests)} aanvragen / {formatNumber(model.conversion.days7.visitors)} bezoekers</small>
            </div>
            <div>
              <dt>30 dagen</dt>
              <dd>{formatPercent(model.conversion.days30.rate)}</dd>
              <small>{formatNumber(model.conversion.days30.requests)} aanvragen / {formatNumber(model.conversion.days30.visitors)} bezoekers</small>
            </div>
          </dl>
        </aside>
      </section>
      <section className="panel">
        <div className="panel-head">
          <h2>Recente aanvragen</h2>
        </div>
        {model.requests.length === 0 ? <p className="empty">Nog geen aanvragen in deze selectie.</p> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Wanneer</th>
                  <th>Type</th>
                  <th>Naam</th>
                  <th>E-mail</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {model.requests.map((request) => {
                  const href = request.kind === "quickscan" ? safeHttpUrl(request.detail) : null;
                  return (
                    <tr key={`${request.kind}-${request.id}`}>
                      <td>{formatDateTime(request.createdAt)}</td>
                      <td>{request.kind === "gids" ? "Gids" : "Quickscan"}{request.isTest ? <em className="test-tag">test</em> : null}</td>
                      <td>{request.name}</td>
                      <td>{request.email}</td>
                      <td>{href ? <a href={href} target="_blank" rel="noreferrer">{request.detail}</a> : request.detail}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section>
        <div className="panel-head">
          <h2>Projecten</h2>
          <p>Status, voortgang en link. Aanpassen geldt meteen voor dit overzicht.</p>
        </div>
        {model.projects.length === 0 ? <p className="empty">Nog geen projecten. Draai de migratie om de startlijst te vullen.</p> : (
          <div className="project-grid">
            {model.projects.map((project) => (
              <ProjectEditor key={project.slug} project={project} open={editingSlug === project.slug || savedSlug === project.slug} />
            ))}
          </div>
        )}
      </section>
    </AdminShell>
  );
}
