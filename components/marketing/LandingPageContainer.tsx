"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Nav } from "@/components/marketing/Nav";
import { HeroSelector } from "@/components/marketing/HeroSelector";
import { ActivityTicker } from "@/components/marketing/ActivityTicker";
import { Features } from "@/components/marketing/Features";
import { ImpactStats } from "@/components/marketing/ImpactStats";
import { PricingPromise } from "@/components/marketing/PricingPromise";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { WhyBetter } from "@/components/marketing/WhyBetter";
import { CallToAction } from "@/components/marketing/CallToAction";
import { Faq } from "@/components/marketing/Faq";
import { Footer } from "@/components/marketing/Footer";
import { isRolKey, type RolKey } from "@/lib/rollen";

const STANDAARD_ROL: RolKey = "donateur";

/**
 * Eigenaar van de globale `activeRole` state ("Global Role State"): alle
 * rol-bewuste secties (HeroSelector, Features, HowItWorks, CallToAction)
 * krijgen dezelfde waarde als prop door, zodat de hele pagina in
 * lockstap meewisselt. De rol is bewust ook via `?rol=` in de URL
 * gespiegeld — zo is een rol-specifieke landingspagina deelbaar (bijv.
 * een bestuur dat `?rol=bestuur` doorstuurt naar een andere club).
 */
export function LandingPageContainer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const rolUitUrl = searchParams.get("rol");

  const [activeRole, setActiveRoleState] = useState<RolKey>(
    isRolKey(rolUitUrl) ? rolUitUrl : STANDAARD_ROL
  );

  // Houdt de state in sync als de gebruiker terug/vooruit navigeert of
  // rechtstreeks op een gedeelde `?rol=`-link binnenkomt.
  useEffect(() => {
    if (isRolKey(rolUitUrl) && rolUitUrl !== activeRole) {
      setActiveRoleState(rolUitUrl);
    }
    // activeRole bewust buiten de dependency-array: alleen wijzigingen ván
    // de URL moeten hier terugvloeien naar de state, niet andersom (dat
    // gebeurt al direct in setActiveRole hieronder).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rolUitUrl]);

  const setActiveRole = useCallback(
    (rol: RolKey) => {
      setActiveRoleState(rol);
      const params = new URLSearchParams(searchParams.toString());
      params.set("rol", rol);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return (
    <>
      <Nav onKiesRol={setActiveRole} />
      <main>
        <HeroSelector activeRole={activeRole} onRoleChange={setActiveRole} />
        <ActivityTicker />
        <Features activeRole={activeRole} />
        <ImpactStats />
        <PricingPromise />
        <HowItWorks activeRole={activeRole} />
        <WhyBetter />
        <CallToAction activeRole={activeRole} />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
