import { Nav } from "@/components/marketing/Nav";
import { Features } from "@/components/marketing/Features";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { CallToAction } from "@/components/marketing/CallToAction";
import { Faq } from "@/components/marketing/Faq";
import { Footer } from "@/components/marketing/Footer";
import { LandingHero } from "@/components/marketing/landing/LandingHero";
import { LandingPainPoints, type GerenderdPijnPunt } from "@/components/marketing/landing/LandingPainPoints";
import type { LandingPageConfig, PijnPunt } from "@/lib/landingPages";

function renderPijnPunt(punt: PijnPunt): GerenderdPijnPunt {
  return { icon: <punt.icon className="h-6 w-6" />, titel: punt.titel, tekst: punt.tekst };
}

/**
 * Gedeelde opbouw voor de 5 SEO-landingspagina's (per sport/use-case).
 * Alleen de hero + pijnpunten zijn pagina-uniek; Features/HowItWorks/
 * CallToAction worden hergebruikt met `activeRole="bestuur"` vast
 * ingesteld (i.p.v. de wisselende rol op de homepage) — dezelfde,
 * al ontworpen en geverifieerde bestuur-content, nu gericht op een
 * bezoeker die al weet dat hij voor zijn club zoekt.
 *
 * De `LucideIcon`-componenten in `config` worden hier, in deze server
 * component, tot JSX gerenderd vóórdat ze als prop naar
 * `LandingHero`/`LandingPainPoints` (beide "use client") gaan — een
 * kale functiereferentie kan niet over de server/client-grens (React
 * gooit dan "Functions cannot be passed directly to Client
 * Components"), een al-gerenderd element wel.
 */
export function LandingPage({ config }: { config: LandingPageConfig }) {
  const HeroIcon = config.heroIcon;
  const [punt1, punt2, punt3] = config.painPoints;

  return (
    <>
      <Nav />
      <main>
        <LandingHero
          eyebrow={config.eyebrow}
          icon={<HeroIcon className="h-4 w-4" />}
          h1Regel1={config.h1Regel1}
          h1Regel2={config.h1Regel2}
          intro={config.intro}
          ctaLabel={config.ctaLabel}
        />
        <LandingPainPoints
          heading={config.painPointsHeading}
          punten={[renderPijnPunt(punt1), renderPijnPunt(punt2), renderPijnPunt(punt3)]}
        />
        <Features activeRole="bestuur" />
        <HowItWorks activeRole="bestuur" />
        <CallToAction activeRole="bestuur" />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
