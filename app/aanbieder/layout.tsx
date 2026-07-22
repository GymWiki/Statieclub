import type { Metadata } from "next";

/**
 * Geldt voor de hele /aanbieder-boom (login + dashboard): een
 * ingelogde, persoonlijke omgeving — geen zoekwaarde, net als /admin.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AanbiederLayout({ children }: { children: React.ReactNode }) {
  return children;
}
