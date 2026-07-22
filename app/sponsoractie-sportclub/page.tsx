import type { Metadata } from "next";
import { LandingPage } from "@/components/marketing/landing/LandingPage";
import { LANDING_PAGES } from "@/lib/landingPages";

const config = LANDING_PAGES.sponsoractie;

export const metadata: Metadata = {
  title: config.metaTitle,
  description: config.metaDescription,
  alternates: { canonical: `/${config.slug}` },
  openGraph: { title: config.metaTitle, description: config.metaDescription },
};

export default function SponsoractieSportclubPage() {
  return <LandingPage config={config} />;
}
