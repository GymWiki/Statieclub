import type { Metadata } from "next";

/**
 * Geldt voor de hele /admin-boom (index, login, nieuwe-club, en via
 * de geneste layout ook elke /admin/[slug]/*-route): authenticatie-
 * gated beheeromgeving, geen zoekwaarde. Eén centrale plek i.p.v. per
 * pagina te herhalen.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
