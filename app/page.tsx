import { Nav } from "@/components/marketing/Nav";
import { Hero } from "@/components/marketing/Hero";
import { ActivityTicker } from "@/components/marketing/ActivityTicker";
import { RoleSelector } from "@/components/marketing/RoleSelector";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { ClubPitch } from "@/components/marketing/ClubPitch";
import { Faq } from "@/components/marketing/Faq";
import { Footer } from "@/components/marketing/Footer";

export default function HomePage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <ActivityTicker />
        <RoleSelector />
        <HowItWorks />
        <ClubPitch />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
