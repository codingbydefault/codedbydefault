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

## Downloadbare MKB-gids

De website bevat een leadkaart voor de MKB AI- & Automatiseringsgids 2026. De bezoeker ontvangt de downloadlink uitsluitend via het opgegeven e-mailadres. Dezelfde Resend-variabelen worden gebruikt als voor de quickscan. CodedByDefault ontvangt daarnaast een gestructureerd `codedbydefault.guide-lead.v1` record voor toekomstige verwerking door LISA. Een gidsaanvraag is geen nieuwsbriefinschrijving.

## Monitoring

Vercel Web Analytics en Speed Insights zijn in de rootlayout geïntegreerd. Na iedere productie-deployment worden bezoekersstatistieken en Core Web Vitals automatisch naar het gekoppelde Vercel-project gestuurd.
