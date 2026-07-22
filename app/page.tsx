import { Suspense } from "react";
import { LandingPageContainer } from "@/components/marketing/LandingPageContainer";
import { VRAGEN } from "@/lib/faqData";
import { buildFaqJsonLd, webApplicationJsonLd } from "@/lib/structuredData";

const faqJsonLd = buildFaqJsonLd(VRAGEN);

export default function HomePage() {
  return (
    <>
      {/* WebApplication + FAQPage horen bij de homepage-content specifiek
          (Organization staat al site-breed in de root layout). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationJsonLd) }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Suspense>
        <LandingPageContainer />
      </Suspense>
    </>
  );
}
