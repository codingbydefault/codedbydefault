export const PROJECT_STATUSES = ["in_ontwikkeling", "live", "niet_gestart", "gepauzeerd"] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export type ProjectPlacement = "featured" | "card" | "admin";

export type ProjectVisual =
  | { type: "logo"; src: string; alt: string; width: number; height: number }
  | { type: "screenshot"; src: string; alt: string; width: number; height: number }
  | { type: "initials"; letters: string }
  | { type: "tag"; mark: string; subtitle: string };

/**
 * Eén lijst voor de homepage en het beheer.
 * De homepage leest dit bestand. De database krijgt dezelfde rijen
 * pas nadat de migratie supabase/migrations/20261115080000_sync_public_projects.sql draait.
 * Voortgang blijft 0: we publiceren geen verzonnen percentage.
 */
export type CatalogProject = {
  slug: string;
  name: string;
  summary: string;
  url: string | null;
  status: ProjectStatus;
  progress: number;
  sortOrder: number;
  featured: boolean;
  placement: ProjectPlacement;
  publicLabel: string;
  cardTitle: string;
  hrefLabel: string | null;
  visual: ProjectVisual;
};

export const CATALOG_PROJECTS: readonly CatalogProject[] = [
  {
    slug: "defaultstackr",
    name: "DefaultStackr",
    summary:
      "Eigen cloudplatform van CodedByDefault, in ontwikkeling. De preview toont de richting: applicaties, een PostgreSQL-database en deploys in één werkwijze. De API-basis wordt getest, de interface is in ontwikkeling en de hostingkoppeling is nog gepland. Nog geen live dienst.",
    url: "https://www.defaultstackr.cloud/",
    status: "in_ontwikkeling",
    progress: 0,
    sortOrder: 1,
    featured: true,
    placement: "featured",
    publicLabel: "Nu in ontwikkeling",
    cardTitle: "Je hele stack. Eén platform.",
    hrefLabel: "Bekijk de preview",
    visual: { type: "initials", letters: "DS" },
  },
  {
    slug: "de-bumperbank",
    name: "De Bumperbank",
    summary:
      "Website in opbouw rond autoverzorging. Bestellen, betalen en afspraken zijn nog niet mogelijk. Mobiele detailing komt later.",
    url: "https://www.debumperbank.nl/",
    status: "in_ontwikkeling",
    progress: 0,
    sortOrder: 2,
    featured: false,
    placement: "card",
    publicLabel: "In opbouw",
    cardTitle: "Autoverzorging, nog zonder verkoop.",
    hrefLabel: "Bekijk De Bumperbank",
    visual: {
      type: "logo",
      src: "/projects/de-bumperbank.svg",
      alt: "De Bumperbank, automotive service.",
      width: 1600,
      height: 360,
    },
  },
  {
    slug: "bumpr",
    name: "BUMPR",
    summary: "Het eigen detailingmerk van De Bumperbank. Binnenkort verkrijgbaar via de webshop.",
    // Nog geen link. Zet later `url` op de webshop; `hrefLabel` verschijnt dan vanzelf.
    url: null,
    status: "in_ontwikkeling",
    progress: 0,
    sortOrder: 3,
    featured: false,
    placement: "card",
    publicLabel: "Binnenkort",
    cardTitle: "Het eigen detailingmerk.",
    hrefLabel: "Bekijk in de webshop",
    visual: { type: "tag", mark: "BUMPR", subtitle: "PREMIUM CAR CARE" },
  },
  {
    slug: "fodmap-tracker",
    name: "Fodmap Tracker",
    summary:
      "App om maaltijden en symptomen bij te houden rond een low-FODMAP-aanpak, en dat overzicht waar nodig met een diëtist te bespreken. Geen medisch advies. Deze versie heeft nog geen gevalideerde FODMAP-classificaties.",
    url: "https://www.fodmaptracker.eu/",
    status: "live",
    progress: 0,
    sortOrder: 4,
    featured: false,
    placement: "card",
    publicLabel: "Live",
    cardTitle: "Maaltijden en symptomen bijhouden.",
    hrefLabel: "Open Fodmap Tracker",
    visual: {
      type: "logo",
      src: "/projects/fodmap-logo.png",
      alt: "Logo van Fodmap Tracker.",
      width: 512,
      height: 512,
    },
  },
  {
    slug: "geregeldwerk",
    name: "GeregeldWerk",
    summary:
      "Van aanvraag naar offerte. Slim geregeld. AI-offertehulp voor vakmensen, nu als wachtlijst. Er wordt nog niets verkocht.",
    url: "https://geregeldwerk.nl/",
    status: "in_ontwikkeling",
    progress: 0,
    sortOrder: 5,
    featured: false,
    placement: "card",
    publicLabel: "Wachtlijst",
    cardTitle: "Van aanvraag naar offerte.",
    hrefLabel: "Naar de wachtlijst",
    visual: {
      type: "logo",
      src: "/projects/geregeldwerk-logo-transparant.png",
      alt: "GeregeldWerk. Jij doet het werk, wij doen de rest.",
      width: 1199,
      height: 296,
    },
  },
  {
    slug: "plainwork-studio",
    name: "Plainwork Studio",
    summary:
      "Marktplaats van CodedByDefault voor gidsen, werkboeken en templates. Gratis MicroGuides staan online. Betaalde systemen staan op de site als coming soon.",
    url: "https://plainwork-studio.vercel.app/",
    status: "in_ontwikkeling",
    progress: 0,
    sortOrder: 6,
    featured: false,
    placement: "card",
    publicLabel: "Publieke preview",
    cardTitle: "Gidsen en templates voor makers.",
    hrefLabel: "Bekijk Plainwork Studio",
    visual: {
      type: "screenshot",
      src: "/projects/plainwork-home.jpg",
      alt: "Schermafbeelding van de publieke homepage van Plainwork Studio.",
      width: 1440,
      height: 860,
    },
  },
  {
    slug: "automarktplaats",
    name: "Automarktplaats",
    summary: "Marktplaats voor auto's.",
    url: null,
    status: "niet_gestart",
    progress: 0,
    sortOrder: 7,
    featured: false,
    placement: "admin",
    publicLabel: "Nog niet gestart",
    cardTitle: "",
    hrefLabel: null,
    visual: { type: "initials", letters: "AM" },
  },
  {
    slug: "custom-car-build",
    name: "Custom car build",
    summary: "Concept voor een custom car build.",
    url: null,
    status: "niet_gestart",
    progress: 0,
    sortOrder: 8,
    featured: false,
    placement: "admin",
    publicLabel: "Nog niet gestart",
    cardTitle: "",
    hrefLabel: null,
    visual: { type: "initials", letters: "CC" },
  },
  {
    slug: "agent-app",
    name: "Agent-app",
    summary: "Concept voor een agent-app.",
    url: null,
    status: "niet_gestart",
    progress: 0,
    sortOrder: 9,
    featured: false,
    placement: "admin",
    publicLabel: "Nog niet gestart",
    cardTitle: "",
    hrefLabel: null,
    visual: { type: "initials", letters: "AA" },
  },
];

export const FEATURED_PROJECT = CATALOG_PROJECTS.find((project) => project.placement === "featured");
export const HOME_CARDS = CATALOG_PROJECTS.filter((project) => project.placement === "card");
