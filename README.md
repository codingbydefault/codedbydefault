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

Het contactadres `hello@codedbydefault.nl` blijft een placeholder totdat het definitieve domein en e-mailadres zijn bevestigd.

## Monitoring

Vercel Web Analytics en Speed Insights zijn in de rootlayout geïntegreerd. Na iedere productie-deployment worden bezoekersstatistieken en Core Web Vitals automatisch naar het gekoppelde Vercel-project gestuurd.
