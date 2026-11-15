-- Werkt de BUMPR-omschrijving bij nadat 20261115080000_sync_public_projects.sql is gedraaid.
-- Nog niet uitvoeren tegen productie tenzij Gomez dat zelf doet.

update public.projects
set
  summary = 'Het eigen detailingmerk van De Bumperbank. Binnenkort verkrijgbaar via de webshop.',
  updated_at = pg_catalog.now()
where slug = 'bumpr';
