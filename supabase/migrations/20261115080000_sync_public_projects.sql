-- Synct de projectenlijst met content/projects.ts.
-- Draai dit bestand in het Supabase-project van CodedByDefault.
-- Bestaande voortgangspercentages blijven staan. Nieuwe rijen krijgen 0.

alter table public.projects
  add column if not exists featured boolean not null default false;

comment on column public.projects.featured is
  'Of het project uitgelicht is. De homepage leest content/projects.ts; dit veld houdt het beheer daarmee gelijk.';

insert into public.projects (slug, name, summary, status, progress, url, sort_order, featured)
values
  (
    'defaultstackr',
    'DefaultStackr',
    'Eigen cloudplatform van CodedByDefault, in ontwikkeling. De preview toont de richting: applicaties, een PostgreSQL-database en deploys in één werkwijze. De API-basis wordt getest, de interface is in ontwikkeling en de hostingkoppeling is nog gepland. Nog geen live dienst.',
    'in_ontwikkeling',
    0,
    'https://www.defaultstackr.cloud/',
    1,
    true
  ),
  (
    'de-bumperbank',
    'De Bumperbank',
    'Website in opbouw rond autoverzorging. Bestellen, betalen en afspraken zijn nog niet mogelijk. Mobiele detailing komt later.',
    'in_ontwikkeling',
    0,
    'https://www.debumperbank.nl/',
    2,
    false
  ),
  (
    'bumpr',
    'BUMPR',
    'De eigen detailingproducten en productlijn van De Bumperbank. In ontwikkeling. Nog geen publieke site.',
    'in_ontwikkeling',
    0,
    null,
    3,
    false
  ),
  (
    'fodmap-tracker',
    'Fodmap Tracker',
    'App om maaltijden en symptomen bij te houden rond een low-FODMAP-aanpak, en dat overzicht waar nodig met een diëtist te bespreken. Geen medisch advies. Deze versie heeft nog geen gevalideerde FODMAP-classificaties.',
    'live',
    0,
    'https://www.fodmaptracker.eu/',
    4,
    false
  ),
  (
    'geregeldwerk',
    'GeregeldWerk',
    'Van aanvraag naar offerte. Slim geregeld. AI-offertehulp voor vakmensen, nu als wachtlijst. Er wordt nog niets verkocht.',
    'in_ontwikkeling',
    0,
    'https://geregeldwerk.nl/',
    5,
    false
  ),
  (
    'plainwork-studio',
    'Plainwork Studio',
    'Marktplaats van CodedByDefault voor gidsen, werkboeken en templates. Gratis MicroGuides staan online. Betaalde systemen staan op de site als coming soon.',
    'in_ontwikkeling',
    0,
    'https://plainwork-studio.vercel.app/',
    6,
    false
  )
on conflict (slug) do update set
  name = excluded.name,
  summary = excluded.summary,
  status = excluded.status,
  url = excluded.url,
  sort_order = excluded.sort_order,
  featured = excluded.featured,
  updated_at = pg_catalog.now();

update public.projects set sort_order = 7 where slug = 'automarktplaats';
update public.projects set sort_order = 8 where slug = 'custom-car-build';
update public.projects set sort_order = 9 where slug = 'agent-app';
