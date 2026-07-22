/**
 * JSON-LD structured data (schema.org) voor Statieclub. Los van
 * `metadata` gehouden omdat Next.js' Metadata API geen ingebouwde
 * ondersteuning heeft voor JSON-LD — de aanbevolen aanpak is een
 * `<script type="application/ld+json">` rechtstreeks in de JSX van de
 * pagina/layout, met de data hier gecentraliseerd zodat bedrijfs-
 * gegevens (KVK/BTW/adres) niet dubbel hoeven te staan naast Footer.tsx.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Statieclub",
  legalName: "GymWiki",
  url: SITE_URL,
  logo: `${SITE_URL}/icon`,
  email: "statieclub@gmail.com",
  description: "Platform dat statiegeld-donateurs koppelt aan lokale sportclubs voor fondsenwerving.",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Zwolle",
    addressCountry: "NL",
  },
  identifier: [
    { "@type": "PropertyValue", name: "KVK-nummer", value: "97351911" },
    { "@type": "PropertyValue", name: "BTW-nummer", value: "NL005266843B58" },
  ],
};

export const webApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Statieclub",
  url: SITE_URL,
  applicationCategory: "Fondsenwerving",
  operatingSystem: "Web",
  description:
    "Statiegeld inzamelen voor je club: buurtbewoners doneren hun flessen en blikjes, jeugdteams halen ze op — gratis, duurzaam en zonder spreadsheets.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
    description: "Gratis voor clubs — Statieclub rekent alleen 5% platformfee over daadwerkelijk opgehaalde bedragen.",
  },
  publisher: {
    "@type": "Organization",
    name: "Statieclub",
    url: SITE_URL,
  },
};

export interface FaqJsonLdItem {
  vraag: string;
  antwoord: string;
}

export function buildFaqJsonLd(vragen: FaqJsonLdItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: vragen.map((v) => ({
      "@type": "Question",
      name: v.vraag,
      acceptedAnswer: {
        "@type": "Answer",
        text: v.antwoord,
      },
    })),
  };
}
