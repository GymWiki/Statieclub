import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import { organizationJsonLd } from "@/lib/structuredData";
import "./globals.css";

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const SITE_TITEL = "Statieclub — Statiegeld inzamelen voor jouw sportclub";
// Max. 155 tekens (SEO-richtlijn) — de volledige verhaallijn staat
// verderop in de pagina's zelf; dit is bewust de compacte SERP-versie.
const SITE_BESCHRIJVING =
  "Statiegeld inzamelen voor je club: buurtbewoners doneren, jeugdteams halen op. Gratis, duurzaam en binnen een paar klikken geregeld.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITEL,
    template: "%s — Statieclub",
  },
  description: SITE_BESCHRIJVING,
  keywords: [
    "statiegeld inzamelen",
    "fondsenwerving sportclub",
    "flessen ophalen",
    "statiegeld doneren",
    "sportclub sponsoring",
    "jeugdteam fondsenwerving",
    "duurzaam doneren",
    "lege flessen inleveren",
    "clubkas spekken",
    "statiegeldactie voetbalclub",
  ],
  authors: [{ name: "Statieclub" }],
  category: "Fondsenwerving",
  alternates: {
    canonical: "/",
  },
  // Geen `images` hier: `app/opengraph-image.tsx` (bestandsconventie)
  // genereert 'm automatisch en Next.js vult zowel og:image als
  // twitter:image daarmee — een handmatige `/og-image.png`-referentie
  // zou een niet-bestaand bestand zijn geweest.
  openGraph: {
    type: "website",
    locale: "nl_NL",
    url: SITE_URL,
    siteName: "Statieclub",
    title: SITE_TITEL,
    description: SITE_BESCHRIJVING,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITEL,
    description: SITE_BESCHRIJVING,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0f172a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={cn(display.variable, body.variable)}>
      <body className="min-h-dvh font-body antialiased">
        {children}
        {/* Organization-schema staat hier (i.p.v. alleen op de homepage) omdat het de
            merkidentiteit beschrijft en dus op elke pagina relevant is. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </body>
    </html>
  );
}
