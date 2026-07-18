import { Nav } from "@/components/marketing/Nav";
import { HeroSelector } from "@/components/marketing/HeroSelector";
import { ActivityTicker } from "@/components/marketing/ActivityTicker";
import { RoleSelector } from "@/components/marketing/RoleSelector";
import { ImpactStats } from "@/components/marketing/ImpactStats";
import { PricingPromise } from "@/components/marketing/PricingPromise";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { ClubPitch } from "@/components/marketing/ClubPitch";
import { WhyBetter } from "@/components/marketing/WhyBetter";
import { Faq } from "@/components/marketing/Faq";
import { Footer } from "@/components/marketing/Footer";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <HeroSelector />
        <ActivityTicker />
        <RoleSelector />
        <ImpactStats />
        <PricingPromise />
        <HowItWorks />
        <ClubPitch />
        <WhyBetter />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
