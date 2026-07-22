import type { Metadata } from "next";
import { BedanktPagina } from "@/components/donor/BedanktPagina";

// Transactionele bevestigingspagina na een Stripe-betaling — geen
// zoekwaarde en persoonsgebonden (session_id). Server-wrapper omdat
// een "use client"-page.tsx geen eigen metadata kan exporteren.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function BedanktPage() {
  return <BedanktPagina />;
}
