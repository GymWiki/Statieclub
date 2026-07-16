import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Gamification-constante: punten per opgehaalde euro statiegeld. */
export const PUNTEN_PER_EURO = 10;

export function berekenPunten(bedragEuro: number): number {
  return Math.round(bedragEuro * PUNTEN_PER_EURO);
}

export function formatEuro(bedrag: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(bedrag);
}

export function formatVoortgang(opgehaald: number, doel: number): number {
  if (doel <= 0) return 0;
  return Math.min(100, Math.round((opgehaald / doel) * 100));
}

export function normaliseerPostcode(postcode: string): string {
  return postcode.trim().toUpperCase().replace(/\s+/g, " ");
}

/** Vergelijkt enkel de 4 cijfers van een postcode (grove regio-match). */
export function postcodeCijfers(postcode: string): string {
  return postcode.replace(/\s/g, "").slice(0, 4);
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    open: "Open",
    geclaimd: "Geclaimd",
    ingeleverd: "Ingeleverd",
    voltooid: "Voltooid",
    goedgekeurd: "Goedgekeurd",
    afgekeurd: "Afgekeurd",
  };
  return labels[status] ?? status;
}

export function statusKleur(status: string): string {
  const kleuren: Record<string, string> = {
    open: "bg-status-open/10 text-status-open border-status-open/30",
    geclaimd: "bg-status-claimed/10 text-status-claimed border-status-claimed/30",
    ingeleverd: "bg-status-submitted/10 text-status-submitted border-status-submitted/30",
    voltooid: "bg-status-done/10 text-status-done border-status-done/30",
    goedgekeurd: "bg-status-open/10 text-status-open border-status-open/30",
    afgekeurd: "bg-red-100 text-red-700 border-red-300",
  };
  return kleuren[status] ?? "bg-gray-100 text-gray-700 border-gray-300";
}

/**
 * Simuleert OCR op een bonnetje-foto: leest geen echte pixels, maar
 * genereert een deterministisch, plausibel totaalbedrag op basis van
 * bestandsnaam + grootte, zodat eenzelfde upload altijd hetzelfde
 * "gescande" bedrag oplevert. Duidelijk gelabeld als simulatie —
 * in productie hier een echte OCR-provider (bv. Google Vision) aan koppelen.
 */
export function simuleerOcrBedrag(bestandsnaam: string, bestandsgrootte: number): number {
  let hash = 0;
  const seed = `${bestandsnaam}:${bestandsgrootte}`;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const min = 1.5;
  const max = 45;
  const bedrag = min + (hash % 4350) / 100;
  return Math.round(Math.min(bedrag, max) * 100) / 100;
}
