import {
  Goal,
  Shield,
  CircleDot,
  Handshake,
  HeartHandshake,
  Users,
  CalendarDays,
  TrendingUp,
  Wallet,
  Repeat,
  Wrench,
  Coins,
  TrendingDown,
  Clock,
  Eye,
  Landmark,
  type LucideIcon,
} from "lucide-react";

export interface PijnPunt {
  icon: LucideIcon;
  titel: string;
  tekst: string;
}

export interface LandingPageConfig {
  slug: string;
  categorie: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  heroIcon: LucideIcon;
  h1Regel1: string;
  h1Regel2: string;
  intro: string;
  ctaLabel: string;
  painPointsHeading: string;
  painPoints: [PijnPunt, PijnPunt, PijnPunt];
}

/**
 * Content voor de 5 SEO-landingspagina's op zoekintentie (per
 * sporttype/use-case) uit de audit. De doorlopende secties eronder
 * (Features/HowItWorks/CallToAction met activeRole="bestuur", Faq)
 * worden hergebruikt van de homepage — enkel de hero + pijnpunten zijn
 * uniek per pagina, wat elke pagina genoeg eigen content geeft om niet
 * als doorway-pagina te tellen, zonder de bestaande, al geverifieerde
 * bestuur-content te dupliceren.
 */
export const LANDING_PAGES: Record<string, LandingPageConfig> = {
  voetbalclub: {
    slug: "statiegeld-inzamelen-voetbalclub",
    categorie: "Voetbalclub",
    metaTitle: "Statiegeld inzamelen voor je voetbalclub",
    metaDescription:
      "Statiegeld inzamelen voor je voetbalclub: buurtbewoners doneren, jeugdteams halen op. Gratis, geen actiedag nodig.",
    eyebrow: "Voor voetbalclubs",
    heroIcon: Goal,
    h1Regel1: "Statiegeld inzamelen voor je voetbalclub,",
    h1Regel2: "zonder gedoe.",
    intro:
      "Van de F-tjes tot het eerste elftal: voetbalclubs draaien op vrijwilligers en een krappe clubkas. Met Statieclub zamelt je voetbalclub moeiteloos statiegeld in bij buurtbewoners — geen deur-tot-deur-actie, geen contante afrekening, gewoon een jeugdteam dat langsfietst.",
    ctaLabel: "Registreer je voetbalclub (gratis)",
    painPointsHeading: "Herkenbaar voor elk voetbalbestuur",
    painPoints: [
      {
        icon: Users,
        titel: "Grote jeugdafdeling, weinig vrijwilligers",
        tekst:
          "Tientallen jeugdteams, maar te weinig ouders die tijd hebben voor een traditionele actiedag met deur-tot-deur-verkoop.",
      },
      {
        icon: CalendarDays,
        titel: "Seizoensgebonden actiedruk",
        tekst:
          "Eén grote actiedag per jaar kost weken voorbereiding voor een beperkte opbrengst — en valt vaak samen met de drukste periode van het seizoen.",
      },
      {
        icon: TrendingUp,
        titel: "Clubkas onder druk door stijgende kosten",
        tekst:
          "Kunstgras, scheidsrechters, materiaal: de kosten lopen op, en de contributie kan niet eindeloos meestijgen.",
      },
    ],
  },
  hockeyclub: {
    slug: "statiegeld-inzamelen-hockeyclub",
    categorie: "Hockeyclub",
    metaTitle: "Statiegeld inzamelen voor je hockeyclub",
    metaDescription:
      "Statiegeld inzamelen voor je hockeyclub: activeer het ouder-netwerk, laat jeugdteams flessen ophalen. Gratis en jaarrond.",
    eyebrow: "Voor hockeyclubs",
    heroIcon: Shield,
    h1Regel1: "Statiegeld inzamelen voor je hockeyclub,",
    h1Regel2: "het hele jaar door.",
    intro:
      "Hockeyclubs kennen een actief netwerk van betrokken ouders — perfect om als jeugdteam flessen op te halen in de buurt. Statieclub zet dat netwerk moeiteloos aan het werk: geen inzamelbak bij de kantine, geen losse administratie per team.",
    ctaLabel: "Registreer je hockeyclub (gratis)",
    painPointsHeading: "Herkenbaar voor elk hockeybestuur",
    painPoints: [
      {
        icon: Users,
        titel: "Actieve ouder-community, geen platform",
        tekst:
          "Veel hockeyclubs hebben WhatsApp-groepen vol betrokken ouders, maar geen manier om dat te bundelen tot een échte, doorlopende actie.",
      },
      {
        icon: Wallet,
        titel: "Kunstgras en materiaal zijn duur",
        tekst:
          "Hockey vraagt om duurder onderhoud — kunstgrasvelden, sticks, ballen — dan menig andere sport, en dat drukt op de clubkas.",
      },
      {
        icon: Repeat,
        titel: "Eén actie per jaar is niet genoeg",
        tekst:
          "Een loterij of chocoladeverkoop werkt niet het hele seizoen door; statiegeld inzamelen kan doorlopend, zonder extra werk voor het bestuur.",
      },
    ],
  },
  tennisclub: {
    slug: "statiegeld-inzamelen-tennisclub",
    categorie: "Tennisclub",
    metaTitle: "Statiegeld inzamelen voor je tennisclub",
    metaDescription:
      "Statiegeld inzamelen voor je tennisclub: het hele jaar door extra inkomsten voor baanonderhoud. Gratis aanmelden.",
    eyebrow: "Voor tennisclubs",
    heroIcon: CircleDot,
    h1Regel1: "Statiegeld inzamelen voor je tennisclub,",
    h1Regel2: "het hele jaar rond.",
    intro:
      "Tennisclubs zijn vaak kleiner dan voetbal- of hockeyclubs, met een compacte maar hechte ledengroep. Statieclub laat die club het hele jaar door statiegeld inzamelen bij de buurt — zonder dat het bij één actiedag blijft.",
    ctaLabel: "Registreer je tennisclub (gratis)",
    painPointsHeading: "Herkenbaar voor elk tennisbestuur",
    painPoints: [
      {
        icon: Users,
        titel: "Kleinere club, kleinere vrijwilligerspoule",
        tekst: "Met minder leden is een grote actiedag lastiger te organiseren en te bemensen dan bij grotere sportclubs.",
      },
      {
        icon: Wrench,
        titel: "Baanonderhoud vraagt een gestage inkomstenstroom",
        tekst:
          "Gravelbanen, netten en verlichting vragen doorlopend onderhoud — niet één keer per jaar geld uit een enkele actie.",
      },
      {
        icon: Coins,
        titel: "De kas moet het ledental meedragen",
        tekst:
          "Het ledental groeit niet vanzelf; juist kleinere clubs hebben baat bij een extra, moeiteloze inkomstenbron naast de contributie.",
      },
    ],
  },
  sponsoractie: {
    slug: "sponsoractie-sportclub",
    categorie: "Elke sportclub",
    metaTitle: "Sponsoractie sportclub: clubkas spekken",
    metaDescription:
      "Sponsoractie voor je sportclub die nooit stopt: buurtbewoners doneren statiegeld, jullie club spekt de kas. Gratis.",
    eyebrow: "Voor elke sportclub",
    heroIcon: Handshake,
    h1Regel1: "Een sponsoractie voor je sportclub",
    h1Regel2: "die nooit stopt.",
    intro:
      "Op zoek naar een sponsoractie voor je sportclub die niet afhankelijk is van bedrijven of eenmalige acties? Statieclub is een doorlopende sponsoractie via statiegeld: buurtbewoners doneren hun flessen, jullie club int de opbrengst — automatisch en transparant.",
    ctaLabel: "Start de sponsoractie (gratis)",
    painPointsHeading: "Waarom clubs uitwijken naar statiegeld",
    painPoints: [
      {
        icon: TrendingDown,
        titel: "Bedrijfssponsoring wordt schaarser",
        tekst: "Lokale ondernemers hebben minder budget voor shirtsponsoring; een alternatieve inkomstenbron is waardevol.",
      },
      {
        icon: Clock,
        titel: "Eenmalige acties kosten meer tijd dan ze opleveren",
        tekst: "Een loterij of bingoavond vraagt weken voorbereiding voor een beperkt en onvoorspelbaar bedrag.",
      },
      {
        icon: Eye,
        titel: "Transparantie naar leden en ouders",
        tekst:
          "Met een live scorebord en spaardoel weet iedereen precies waar het geld voor is en hoeveel er al binnen is.",
      },
    ],
  },
  vereniging: {
    slug: "geld-inzamelen-vereniging",
    categorie: "Elke vereniging",
    metaTitle: "Geld inzamelen voor je vereniging",
    metaDescription:
      "Geld inzamelen voor je vereniging met statiegeld: buurtbewoners doneren, vrijwilligers halen op. Gratis, voor elke club.",
    eyebrow: "Voor elke vereniging",
    heroIcon: HeartHandshake,
    h1Regel1: "Geld inzamelen voor je vereniging",
    h1Regel2: "met statiegeld.",
    intro:
      "Niet alleen sportclubs — elke vereniging met vrijwilligers en een krappe kas kan geld inzamelen met statiegeld. Van scouting tot muziekvereniging: Statieclub koppelt buurtbewoners die van hun statiegeld af willen aan een team dat het langskomt ophalen.",
    ctaLabel: "Registreer je vereniging (gratis)",
    painPointsHeading: "Herkenbaar voor elk verenigingsbestuur",
    painPoints: [
      {
        icon: Users,
        titel: "Vrijwilligers zijn schaars",
        tekst: "Steeds minder mensen melden zich voor de jaarlijkse verlotingsactie of clubactie.",
      },
      {
        icon: Coins,
        titel: "Contributie alleen is niet genoeg",
        tekst: "Materiaal, huur van een ruimte, uniformen: de vaste lasten lopen op, terwijl de contributie niet mee kan stijgen.",
      },
      {
        icon: Landmark,
        titel: "Vaak vergeten door sportgerichte platforms",
        tekst:
          "De meeste fondsenwervingsplatforms zijn puur op sportclubs gericht; Statieclub werkt voor élke vereniging, sport of niet.",
      },
    ],
  },
};

export const LANDING_PAGE_LIJST = Object.values(LANDING_PAGES);
