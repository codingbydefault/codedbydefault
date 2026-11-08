-- Additief: bezoekers per site. Bestaande rijen, tabellen en policies blijven.
-- Bestaande page_views krijgen site = codedbydefault via de default.
-- RLS blijft aan; er worden geen policies verwijderd.
-- Plak dit bestand in één keer in de Supabase SQL Editor.

alter table public.page_views
  add column if not exists site text not null default 'codedbydefault';

comment on column public.page_views.site is
  'Site-slug: codedbydefault, fodmap, bumperbank of geregeldwerk. Geen IP-adres.';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'page_views_site_check'
      and conrelid = 'public.page_views'::regclass
  ) then
    alter table public.page_views
      add constraint page_views_site_check
      check (site in ('codedbydefault', 'fodmap', 'bumperbank', 'geregeldwerk'));
  end if;
end $$;

create index if not exists page_views_site_day_idx
  on public.page_views (site, day);

create index if not exists page_views_site_hash_path_created_idx
  on public.page_views (site, visitor_hash, path, created_at desc);

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
    and p.site = 'codedbydefault'
  group by p.day
  order by p.day;
$$;

comment on function public.admin_daily_visits(date) is
  'Dagtotalen van alleen codedbydefault. security invoker: RLS blijft gelden.';

create or replace function public.admin_visit_scopes(from_day date)
returns table (scope text, day date, pageviews bigint, visitors bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select case when grouping(p.site) = 1 then 'all' else p.site end as scope,
         p.day,
         count(*)::bigint as pageviews,
         count(distinct p.visitor_hash)::bigint as visitors
  from public.page_views as p
  where p.day >= from_day
    and p.site in ('codedbydefault', 'fodmap', 'bumperbank', 'geregeldwerk')
  group by grouping sets ((p.site, p.day), (p.day))
  order by scope, p.day;
$$;

comment on function public.admin_visit_scopes(date) is
  'Bezoekers per site en het totaal (scope all) per dag. Het totaal telt een bezoeker die dag één keer, ook over sites heen.';

revoke all on function public.admin_visit_scopes(date) from public, anon, authenticated;
grant execute on function public.admin_visit_scopes(date) to service_role;

notify pgrst, 'reload schema';
