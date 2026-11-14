export type FeatureState = "nu" | "binnenkort";

export type ProjectFeature = {
  state: FeatureState;
  text: string;
};

export type ProjectVisual =
  | {
      type: "logo";
      src: string;
      alt: string;
      width: number;
      height: number;
    }
  | {
      type: "screenshot";
      src: string;
      alt: string;
      width: number;
      height: number;
    };

export type SiteProject = {
  slug: string;
  name: string;
  index: string;
  category: string;
  status: string;
  title: readonly string[];
  summary: string;
  href: string;
  hrefLabel: string;
  features: readonly ProjectFeature[];
  visual: ProjectVisual;
};

export type SiteUpdate = {
  when: string;
  project: string;
  text: string;
};

/**
 * Publieke projecten op de homepage.
 * Nieuwe projecten horen alleen in deze lijst: de homepage rendert hem.
 * Teksten volgen de live sites en de samengevoegde code, niet open concepten.
 *
 * GeregeldWerk-logo's:
 * - geregeldwerk-logo-transparant.png is het lichte woordmerk (crème/wit + teal) en blijft leesbaar op de donkere kaart.
 * - geregeldwerk-logo-licht.png is donkergroene inkt, voor een lichte achtergrond. Die staat niet op deze donkere kaart.
 */
export const SITE_PROJECTS: readonly SiteProject[] = [
  {
    slug: "plainwork-studio",
    name: "Plainwork Studio",
    index: "01",
    category: "MARKETPLACE",
    status: "PUBLIC PREVIEW",
    title: ["Praktische systemen,", "eerlijk verkocht."],
    summary:
      "Een marktplaats voor gidsen, werkboeken en templates. Makers openen een shop en koppelen Stripe. Gratis MicroGuides staan online; de betaalde systemen staan nog als coming soon.",
    href: "https://plainwork-studio.vercel.app/",
    hrefLabel: "Bekijk Plainwork Studio",
    features: [
      { state: "nu", text: "Publieke marktplaats met gratis MicroGuides." },
      { state: "nu", text: "Shop openen, inloggen en een kopersbibliotheek." },
      { state: "nu", text: "1% platformcommissie, los van de betaalkosten." },
      { state: "nu", text: "Bestanden worden afgeschermd afgeleverd." },
      {
        state: "binnenkort",
        text: "Betaalde systemen. Op de site staan ze als coming soon, voor €14,99.",
      },
    ],
    visual: {
      type: "screenshot",
      src: "/projects/plainwork-home.jpg",
      alt: "Schermafbeelding van de publieke homepage van Plainwork Studio.",
      width: 1440,
      height: 860,
    },
  },
  {
    slug: "geregeldwerk",
    name: "GeregeldWerk",
    index: "02",
    category: "OFFERTES",
    status: "EARLY ACCESS",
    title: ["Van aanvraag naar", "offerte."],
    summary:
      "Slim geregeld, voor vakmensen. GeregeldWerk zit in early access: de wachtlijst is open en er wordt nog niets verkocht. Een lokaal prototype maakt een conceptofferte; die gaat niet vanzelf naar een klant.",
    href: "https://geregeldwerk.nl/",
    hrefLabel: "Naar de wachtlijst",
    features: [
      { state: "nu", text: "Early-accesspagina en wachtlijst op geregeldwerk.nl." },
      {
        state: "nu",
        text: "Prototype: plak of spreek een bericht in en krijg een conceptofferte. Prijzen vul je zelf in. Het bericht blijft op je computer.",
      },
      { state: "nu", text: "Verwachte startprijs Starter: €29,95 per maand excl. btw." },
      { state: "binnenkort", text: "Aanvragen via e-mail, WhatsApp of een formulier in één inbox." },
      {
        state: "binnenkort",
        text: "Conceptofferte op basis van je eigen tarieven, pas versturen na jouw goedkeuring.",
      },
    ],
    visual: {
      type: "logo",
      src: "/projects/geregeldwerk-logo-transparant.png",
      alt: "GeregeldWerk. Jij doet het werk, wij doen de rest.",
      width: 1199,
      height: 296,
    },
  },
  {
    slug: "fodmap-tracker",
    name: "Fodmap Tracker",
    index: "03",
    category: "HEALTH",
    status: "LIVE",
    title: ["Leer je voedingspatroon", "beter begrijpen."],
    summary:
      "Een rustige plek om maaltijden en symptomen bij te houden en dat overzicht, waar nodig, met je diëtist te bespreken. De app vervangt geen medisch advies. Deze versie heeft nog geen gevalideerde FODMAP-classificaties.",
    href: "https://www.fodmaptracker.eu/",
    hrefLabel: "Open Fodmap Tracker",
    features: [
      { state: "nu", text: "Voedingsdagboek en symptoomdagboek." },
      { state: "nu", text: "Recepten, een weekmenu en een boodschappenlijst uit dat menu." },
      {
        state: "nu",
        text: "Voedingswijzer met een kleine bronvermelde startset. Geen product wordt automatisch veilig verklaard.",
      },
      { state: "nu", text: "Fases: eliminatie, herintroductie en onderhoud." },
      { state: "nu", text: "Nieuws en artikelen op de publieke site." },
    ],
    visual: {
      type: "logo",
      src: "/projects/fodmap-logo.png",
      alt: "Logo van Fodmap Tracker.",
      width: 512,
      height: 512,
    },
  },
];

export const SITE_UPDATES: readonly SiteUpdate[] = [
  {
    when: "14 november 2026",
    project: "Plainwork Studio",
    text: "Authenticatie, shop-onboarding en de professionele marktplaats zijn samengevoegd. De publieke site toont gratis MicroGuides. Betaalde systemen staan op coming soon.",
  },
  {
    when: "12 november 2026",
    project: "Plainwork Studio",
    text: "Gratis MicroGuides zijn in de code geen openbare pdf's meer. Ze worden geleverd nadat iemand een e-mailadres achterlaat. Marketingtoestemming is een aparte keuze.",
  },
  {
    when: "Nu online",
    project: "GeregeldWerk",
    text: "geregeldwerk.nl heeft een early-accesswachtlijst. Er wordt nog niets verkocht. Het prototype op /app maakt lokaal een conceptofferte en stuurt niets naar een klant.",
  },
  {
    when: "Nu online",
    project: "Fodmap Tracker",
    text: "fodmaptracker.eu verwijst door naar fodmaptracker.nl. Bezoekers kunnen een account aanmaken en maaltijden, klachten, recepten en een weekmenu bijhouden.",
  },
  {
    when: "In ontwikkeling",
    project: "Plainwork Studio",
    text: "Een vernieuwde homepage, meertaligheid en een EUR/GBP-weergave zitten in open concepten. Dat zijn nog geen live functies.",
  },
];
