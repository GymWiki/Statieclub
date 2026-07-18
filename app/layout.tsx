import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
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
const SITE_BESCHRIJVING =
  "Statieclub koppelt statiegeld-donateurs aan lokale sportclubs. Geef je flessen en blikjes aan een jeugdteam bij jou in de buurt — gratis, duurzaam en binnen een paar klikken geregeld. Clubs zetten in minuten een fondsenwervingscampagne op, zonder spreadsheets of contant geld.";

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
  openGraph: {
    type: "website",
    locale: "nl_NL",
    url: SITE_URL,
    siteName: "Statieclub",
    title: SITE_TITEL,
    description: SITE_BESCHRIJVING,
    images: [
      {
        // Voeg dit bestand toe onder public/og-image.png (1200×630) voor een
        // volledig ingevulde preview-kaart — zonder dat bestand valt het
        // delen terug op alleen titel/beschrijving.
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Statieclub — statiegeld inzamelen voor jouw sportclub",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITEL,
    description: SITE_BESCHRIJVING,
    images: ["/og-image.png"],
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
      <body className="min-h-dvh font-body antialiased">{children}</body>
    </html>
  );
}
