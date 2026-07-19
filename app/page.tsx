import { Suspense } from "react";
import { LandingPageContainer } from "@/components/marketing/LandingPageContainer";

export default function HomePage() {
  return (
    <Suspense>
      <LandingPageContainer />
    </Suspense>
  );
}
