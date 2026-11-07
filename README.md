# CodedByDefault website

De Next.js-versie van de interactieve CodedByDefault-website, voorbereid voor GitHub en Vercel.

## Lokaal ontwikkelen

```bash
npm install
npm run dev
```

Open daarna [http://localhost:3000](http://localhost:3000).

## Productiecontrole

```bash
npm run build
npm start
```

## Publiceren

1. Maak een nieuwe GitHub-repository aan.
2. Push deze map naar de `main`-branch.
3. Importeer de repository in Vercel.
4. Vercel herkent Next.js automatisch; er zijn geen speciale buildinstellingen nodig.

## Structuur

- `app/`: Next.js App Router en metadata.
- `site-template/index.html`: inhoudelijke websitebron.
- `public/`: styling, interacties en logo-assets.

Het tijdelijke contactadres is `codedbydefault@gmail.com` totdat een eigen `@codedbydefault.com`-mailbox beschikbaar is.

## Website-quickscan

De quickscan verstuurt na een aanvraag twee transactionele e-mails: een ontvangstbevestiging naar de klant en een complete aanvraag naar CodedByDefault. Configureer hiervoor in Vercel:

- `RESEND_API_KEY`: geheime API-sleutel van Resend.
- `QUICKSCAN_FROM_EMAIL`: afzender op een in Resend geverifieerd domein, bijvoorbeeld `CodedByDefault <quickscan@mail.codedbydefault.com>`.

Kopieer lokaal `.env.example` naar `.env.local` en vervang de voorbeeldwaarden. Voeg echte sleutels nooit aan Git toe. Na het toevoegen of wijzigen van Vercel-variabelen is een nieuwe deployment nodig.

De interne aanvraagmail is voorbereid op toekomstige Grokbot-verwerking. Iedere aanvraag bevat een uniek aanvraagnummer, herkenbare onderwerp-prefix, vaste headers en een `codedbydefault.quickscan.v1` JSON-record. De bot- en databasekoppeling gelden pas als actief nadat ontvangen, beantwoorden, opslaan en rapporteren end-to-end zijn getest.

## Downloadbare CBD-gids

De website bevat een leadkaart voor de CBD AI- & Automatiseringsgids 2026. De bezoeker ontvangt de downloadlink uitsluitend via het opgegeven e-mailadres. Dezelfde Resend-variabelen worden gebruikt als voor de quickscan. CodedByDefault ontvangt daarnaast een gestructureerd `codedbydefault.guide-lead.v1` record voor toekomstige verwerking door LISA. Een gidsaanvraag is geen nieuwsbriefinschrijving.

Het pdf-bestand staat niet meer in `public/`. Zowel nieuwe links (met een persoonlijk token) als links uit al verstuurde mails wijzen naar `/downloads/codedbydefault-cbd-ai-automatiseringsgids-2026.pdf`. Die route telt de download en stuurt daarna het bestand. Bots en prefetch-verzoeken tellen niet mee.

## Beheer

`/admin` is alleen bereikbaar na een Supabase-login met een e-mailadres uit `ADMIN_EMAILS`. Het overzicht toont gidsaanvragen, quickscans, downloads, bezoekers per dag, de conversie van bezoeker naar aanvraag, recente aanvragen en de projecten. Testaanvragen (een `@resend.dev`-adres, of `test` in de naam) kunnen worden verborgen. Projectstatus, voortgang, link en omschrijving zijn daar aan te passen.

De bezoeker-telling gebruikt geen cookies en bewaart geen IP-adres. Per Amsterdamse dag wordt een HMAC-hash van salt, IP en user-agent opgeslagen, zodat dezelfde browser die dag één bezoeker is en de volgende dag een nieuwe hash krijgt.

Vercel Web Analytics blijft apart in het Vercel-dashboard. Die cijfers zijn niet in deze app uit te lezen.

### Supabase-project

Er is nog geen Supabase-project aan deze site gekoppeld. Maak een **nieuw** project aan, bijvoorbeeld met de naam `codedbydefault`, in het Supabase-account van Gomez. Gebruik geen bestaand project van een andere app: de aanvragen en de beheerlogin horen bij deze site. Een project dat je al alleen voor CodedByDefault hebt leeggemaakt, mag ook.

1. Maak het project aan in het [Supabase-dashboard](https://supabase.com/dashboard). Kies een regio dicht bij Nederland.
2. Draai de migratie `supabase/migrations/20261107112115_admin_dashboard.sql` in **SQL Editor → New query**. Plak het hele bestand en kies Run. Daarmee komen de tabellen, RLS en de zes startprojecten binnen.
   Alternatief met de CLI, nadat je het project hebt gelinkt: `npx supabase link --project-ref <project-ref>` en daarna `npx supabase db push`. Doe dit alleen tegen het nieuwe project, niet tegen een database die al ergens anders voor in gebruik is.
3. Zet onder **Authentication → Sign In / Providers** e-mail aan. Zet **Allow new users to sign up** uit, zodat onbekenden geen account kunnen aanmaken.
4. Maak onder **Authentication → Users** handmatig het account van Gomez aan en bevestig het e-mailadres. Zet datzelfde adres in `ADMIN_EMAILS`.
5. Voeg onder **Authentication → URL configuration** deze redirect-URL's toe, naast de site-URL van de live site:
   - `https://codedbydefault.vercel.app/auth/callback`
   - `https://www.codedbydefault.com/auth/callback`
   - `https://codedbydefault.com/auth/callback`
   - `http://localhost:3000/auth/callback`
6. Kopieer in **Project Settings → API Keys** de project-URL, de publishable key (`sb_publishable_...`) en een secret key (`sb_secret_...`). De secret key hoort alleen op de server.

### Variabelen in Vercel

Zet deze variabelen voor Production (en Preview als je het beheer daar ook wilt) en deploy daarna opnieuw:

| Variabele | Doel |
| --- | --- |
| `RESEND_API_KEY` | Bestaande mailverzending. |
| `QUICKSCAN_FROM_EMAIL` | Bestaande afzender. |
| `NEXT_PUBLIC_SUPABASE_URL` | Project-URL. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publieke sleutel voor de login. |
| `SUPABASE_SECRET_KEY` | Server-sleutel voor opslag. Nooit in de browser of in git. |
| `ADMIN_EMAILS` | Komma-gescheiden beheeradressen. |
| `ANALYTICS_SALT` | Eigen lange salt, bijvoorbeeld `openssl rand -base64 32`. |

Zonder `ANALYTICS_SALT` van minstens 16 tekens worden geen bezoekers opgeslagen. Zonder de Supabase-sleutels blijft de bestaande e-mailflow werken, maar verschijnen aanvragen niet in het overzicht.

Lokaal: kopieer `.env.example` naar `.env.local` en vul dezelfde waarden in. Echte sleutels horen niet in git.

### Lokaal controleren

```bash
npm test
npm run typecheck
npm run build
```

Het dashboard met voorbeelddata, zonder database, is alleen in development te openen:

```bash
ADMIN_PREVIEW=1 npm run dev
```

Ga daarna naar [http://localhost:3000/admin/voorbeeld](http://localhost:3000/admin/voorbeeld). Die route antwoordt in productie met 404.

## Monitoring

Vercel Web Analytics en Speed Insights zijn op de publieke site geïntegreerd. Na iedere productie-deployment worden die statistieken en Core Web Vitals naar het gekoppelde Vercel-project gestuurd. Het beheer gebruikt daar bovenop de eigen telling in Supabase.
