-- Beheerdata voor CodedByDefault.
-- Leest: de Next.js-server (secret key, service_role, omzeilt RLS) en een
-- ingelogde admin wiens e-mail in public.admin_allowlist staat.
-- De server vult die lijst vanuit de environment-variabele ADMIN_EMAILS.
-- Anoniem verkeer kan deze tabellen niet lezen of schrijven.
--
-- Testvlag staat gelijk aan isTestRequest() in lib/admin/test-requests.ts:
-- e-mail op @resend.dev, of 'test' in de naam.

create schema if not exists app_private;

revoke all on schema app_private from public, anon, authenticated;
grant usage on schema app_private to authenticated, service_role;

create or replace function app_private.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

revoke all on function app_private.touch_updated_at() from public, anon, authenticated;
grant execute on function app_private.touch_updated_at() to authenticated, service_role;

create table public.admin_allowlist (
  email text primary key,
  updated_at timestamptz not null default pg_catalog.now(),
  constraint admin_allowlist_email_check check (
    email = lower(email)
    and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    and char_length(email) <= 254
  )
);

comment on table public.admin_allowlist is
  'Beheeradressen. Wordt overschreven vanuit ADMIN_EMAILS bij elke beheeractie.';

create table public.guide_requests (
  id bigint generated always as identity primary key,
  request_id uuid not null unique,
  name text not null,
  email text not null,
  guide text not null,
  status text not null default 'guide_sent',
  download_token text not null unique,
  created_at timestamptz not null default pg_catalog.now(),
  is_test boolean generated always as (
    coalesce(lower(email) like '%@resend.dev', false)
    or coalesce(position('test' in lower(name)) > 0, false)
  ) stored,
  constraint guide_requests_name_check check (char_length(name) between 1 and 100),
  constraint guide_requests_email_check check (
    email = lower(email)
    and char_length(email) <= 254
    and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  constraint guide_requests_guide_check check (char_length(guide) between 1 and 120),
  constraint guide_requests_status_check check (status in ('guide_sent')),
  constraint guide_requests_token_check check (download_token ~ '^[0-9a-f]{64}$')
);

create index guide_requests_test_created_idx
  on public.guide_requests (is_test, created_at desc);

comment on table public.guide_requests is
  'Gidsaanvragen: alleen naam, e-mail en de gids die al op het formulier staan.';

create table public.quickscan_requests (
  id bigint generated always as identity primary key,
  request_id uuid not null unique,
  name text not null,
  company text,
  email text not null,
  website text not null,
  question text,
  status text not null default 'new',
  created_at timestamptz not null default pg_catalog.now(),
  is_test boolean generated always as (
    coalesce(lower(email) like '%@resend.dev', false)
    or coalesce(position('test' in lower(name)) > 0, false)
  ) stored,
  constraint quickscan_requests_name_check check (char_length(name) between 1 and 100),
  constraint quickscan_requests_company_check check (company is null or char_length(company) <= 150),
  constraint quickscan_requests_email_check check (
    email = lower(email)
    and char_length(email) <= 254
    and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
  ),
  constraint quickscan_requests_website_check check (
    char_length(website) <= 500
    and website ~ '^https?://'
  ),
  constraint quickscan_requests_question_check check (question is null or char_length(question) <= 2000),
  constraint quickscan_requests_status_check check (status in ('new'))
);

create index quickscan_requests_test_created_idx
  on public.quickscan_requests (is_test, created_at desc);

comment on table public.quickscan_requests is
  'Quickscans: alleen de velden van het formulier. Geen IP-adres.';

create table public.guide_downloads (
  id bigint generated always as identity primary key,
  guide text not null,
  guide_request_id bigint references public.guide_requests (id) on delete set null,
  source text not null,
  created_at timestamptz not null default pg_catalog.now(),
  constraint guide_downloads_guide_check check (char_length(guide) between 1 and 120),
  constraint guide_downloads_source_check check (source in ('token', 'legacy'))
);

create index guide_downloads_created_at_idx
  on public.guide_downloads (created_at desc);

create index guide_downloads_request_id_idx
  on public.guide_downloads (guide_request_id);

comment on table public.guide_downloads is
  'Elke echte download van de gids. Geen IP-adres en geen user-agent.';

create table public.page_views (
  id bigint generated always as identity primary key,
  path text not null,
  day date not null,
  visitor_hash text not null,
  created_at timestamptz not null default pg_catalog.now(),
  constraint page_views_path_check check (
    char_length(path) between 1 and 300
    and path ~ '^/[-A-Za-z0-9/_]*$'
  ),
  constraint page_views_hash_check check (visitor_hash ~ '^[0-9a-f]{32}$')
);

create index page_views_day_idx
  on public.page_views (day);

create index page_views_day_visitor_idx
  on public.page_views (day, visitor_hash);

comment on table public.page_views is
  'Paginaweergaven met een dagelijkse hash. Geen cookie en geen ruw IP-adres.';

create table public.projects (
  slug text primary key,
  name text not null,
  summary text not null default '',
  status text not null,
  progress integer not null default 0,
  url text,
  sort_order integer not null,
  updated_at timestamptz not null default pg_catalog.now(),
  constraint projects_slug_check check (slug ~ '^[a-z0-9-]{2,80}$'),
  constraint projects_name_check check (char_length(name) between 1 and 120),
  constraint projects_summary_check check (char_length(summary) <= 400),
  constraint projects_status_check check (status in ('in_ontwikkeling', 'live', 'niet_gestart', 'gepauzeerd')),
  constraint projects_progress_check check (progress between 0 and 100),
  constraint projects_url_check check (url is null or (char_length(url) <= 500 and url ~ '^https?://')),
  constraint projects_sort_check check (sort_order between 0 and 1000)
);

create trigger projects_touch_updated_at
  before update on public.projects
  for each row
  execute function app_private.touch_updated_at();

comment on table public.projects is
  'Projectoverzicht dat de beheerder in /admin kan bijwerken.';

insert into public.projects (slug, name, summary, status, progress, url, sort_order)
values
  ('geregeldwerk', 'Geregeldwerk', 'App voor terugkerend werk, planning en opvolging.', 'in_ontwikkeling', 45, null, 1),
  ('fodmap-tracker', 'FODMAP-tracker', 'Registratietool voor voeding en FODMAP-aandachtspunten.', 'in_ontwikkeling', 40, null, 2),
  ('de-bumperbank', 'De Bumperbank', 'Webshop.', 'in_ontwikkeling', 20, null, 3),
  ('automarktplaats', 'Automarktplaats', 'Marktplaats voor auto''s.', 'niet_gestart', 0, null, 4),
  ('custom-car-build', 'Custom car build', 'Concept voor een custom car build.', 'niet_gestart', 0, null, 5),
  ('agent-app', 'Agent-app', 'Concept voor een agent-app.', 'niet_gestart', 0, null, 6)
on conflict (slug) do nothing;

create or replace function public.admin_daily_visits(from_day date)
returns table (day date, pageviews bigint, visitors bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select p.day,
         count(*)::bigint as pageviews,
         count(distinct p.visitor_hash)::bigint as visitors
  from public.page_views as p
  where p.day >= from_day
  group by p.day
  order by p.day;
$$;

comment on function public.admin_daily_visits(date) is
  'Dagtotalen voor het beheer. security invoker: RLS van de aanroeper blijft gelden.';

revoke all on function public.admin_daily_visits(date) from public, anon, authenticated;
grant execute on function public.admin_daily_visits(date) to service_role;

create or replace function app_private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_allowlist as allow
    where allow.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function app_private.is_admin() from public, anon;
grant execute on function app_private.is_admin() to authenticated, service_role;

alter table public.admin_allowlist enable row level security;
alter table public.admin_allowlist force row level security;
alter table public.guide_requests enable row level security;
alter table public.guide_requests force row level security;
alter table public.quickscan_requests enable row level security;
alter table public.quickscan_requests force row level security;
alter table public.guide_downloads enable row level security;
alter table public.guide_downloads force row level security;
alter table public.page_views enable row level security;
alter table public.page_views force row level security;
alter table public.projects enable row level security;
alter table public.projects force row level security;

revoke all on table public.admin_allowlist from public, anon, authenticated;
revoke all on table public.guide_requests from public, anon, authenticated;
revoke all on table public.quickscan_requests from public, anon, authenticated;
revoke all on table public.guide_downloads from public, anon, authenticated;
revoke all on table public.page_views from public, anon, authenticated;
revoke all on table public.projects from public, anon, authenticated;

grant select on table public.guide_requests to authenticated;
grant select on table public.quickscan_requests to authenticated;
grant select on table public.guide_downloads to authenticated;
grant select on table public.page_views to authenticated;
grant select, update on table public.projects to authenticated;

grant select, insert, update, delete on table public.admin_allowlist to service_role;
grant select, insert, update, delete on table public.guide_requests to service_role;
grant select, insert, update, delete on table public.quickscan_requests to service_role;
grant select, insert, update, delete on table public.guide_downloads to service_role;
grant select, insert, update, delete on table public.page_views to service_role;
grant select, insert, update, delete on table public.projects to service_role;

revoke all on sequence public.guide_requests_id_seq from public, anon, authenticated;
revoke all on sequence public.quickscan_requests_id_seq from public, anon, authenticated;
revoke all on sequence public.guide_downloads_id_seq from public, anon, authenticated;
revoke all on sequence public.page_views_id_seq from public, anon, authenticated;

grant usage, select on sequence public.guide_requests_id_seq to service_role;
grant usage, select on sequence public.quickscan_requests_id_seq to service_role;
grant usage, select on sequence public.guide_downloads_id_seq to service_role;
grant usage, select on sequence public.page_views_id_seq to service_role;

create policy guide_requests_admin_select
  on public.guide_requests
  for select
  to authenticated
  using ((select app_private.is_admin()));

create policy quickscan_requests_admin_select
  on public.quickscan_requests
  for select
  to authenticated
  using ((select app_private.is_admin()));

create policy guide_downloads_admin_select
  on public.guide_downloads
  for select
  to authenticated
  using ((select app_private.is_admin()));

create policy page_views_admin_select
  on public.page_views
  for select
  to authenticated
  using ((select app_private.is_admin()));

create policy projects_admin_select
  on public.projects
  for select
  to authenticated
  using ((select app_private.is_admin()));

create policy projects_admin_update
  on public.projects
  for update
  to authenticated
  using ((select app_private.is_admin()))
  with check ((select app_private.is_admin()));

notify pgrst, 'reload schema';
