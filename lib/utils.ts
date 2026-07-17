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

// ─────────────────────────────────────────────────────────────
// Anomaly detection (Penningmeester Dashboard)
// ─────────────────────────────────────────────────────────────

/** Bedragen vanaf deze drempel worden nooit automatisch goedgekeurd. */
export const ANOMALIE_BEDRAG_DREMPEL_EURO = 30;

/** Meer dan dit aantal scans van hetzelfde team binnen het tijdsvenster is verdacht. */
export const ANOMALIE_SCANS_DREMPEL = 5;
export const ANOMALIE_SCANS_VENSTER_MINUTEN = 10;

export interface AnomalieCheck {
  verdacht: boolean;
  redenen: string[];
}

/** Combineert de bedrag- en patroon-check tot één flag_reden (of null). */
export function beoordeelAnomalie(bedragEuro: number, recenteScansAantal: number): AnomalieCheck {
  const redenen: string[] = [];

  if (bedragEuro >= ANOMALIE_BEDRAG_DREMPEL_EURO) {
    redenen.push(`Hoog bedrag (≥ ${formatEuro(ANOMALIE_BEDRAG_DREMPEL_EURO)})`);
  }
  if (recenteScansAantal >= ANOMALIE_SCANS_DREMPEL) {
    redenen.push(
      `${recenteScansAantal} scans van dit team binnen ${ANOMALIE_SCANS_VENSTER_MINUTEN} minuten`
    );
  }

  return { verdacht: redenen.length > 0, redenen };
}

// ─────────────────────────────────────────────────────────────
// Platform-facturatie (5% B2B software-fee)
// ─────────────────────────────────────────────────────────────
export const PLATFORM_FEE_PERCENTAGE = 5;

export function berekenPlatformFee(totaalGoedgekeurdBedrag: number): number {
  return Math.round(totaalGoedgekeurdBedrag * (PLATFORM_FEE_PERCENTAGE / 100) * 100) / 100;
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

// ─────────────────────────────────────────────────────────────
// WhatsApp-integratie (claimknop bij het Ophaal Prikbord)
// ─────────────────────────────────────────────────────────────

/**
 * Normaliseert een NL-telefoonnummer naar het cijfers-only formaat dat
 * wa.me verwacht (landcode 31, geen 0/+/spaties/streepjes). Geeft null
 * terug als het resultaat geen geldig mobiel nummer lijkt.
 */
export function naarWhatsappNummer(telefoonnummer: string | null | undefined): string | null {
  if (!telefoonnummer) return null;
  let cijfers = telefoonnummer.replace(/[^\d]/g, "");

  if (cijfers.startsWith("0031")) cijfers = cijfers.slice(2);
  else if (cijfers.startsWith("31")) {
    // al in internationaal formaat
  } else if (cijfers.startsWith("0")) cijfers = "31" + cijfers.slice(1);

  return cijfers.length >= 10 ? cijfers : null;
}

/**
 * Bouwt een wa.me-link met vooraf ingevuld bericht. Is er een geldig
 * telefoonnummer, dan opent de link direct een chat met die donateur;
 * anders (nummer onbekend/ongeldig) valt hij terug op een algemene
 * WhatsApp-share zonder vaste ontvanger.
 */
export function bouwWhatsappUrl(telefoonnummer: string | null | undefined, tekst: string): string {
  const nummer = naarWhatsappNummer(telefoonnummer);
  const basis = nummer ? `https://wa.me/${nummer}` : "https://wa.me/";
  return `${basis}?text=${encodeURIComponent(tekst)}`;
}

// ─────────────────────────────────────────────────────────────
// Anoniem chatsysteem (speler ↔ donateur)
// ─────────────────────────────────────────────────────────────

/**
 * Bepaalt of de chat van een ophaalverzoek gesloten moet zijn. 'voltooid'
 * is de enige afgeronde status die de app vandaag daadwerkelijk zet;
 * 'geannuleerd' bestaat nog niet als status in het schema (er is geen
 * annuleer-functionaliteit), maar wordt hier alvast defensief
 * meegenomen zodat een toekomstige annuleer-feature de chat automatisch
 * laat sluiten zonder dat deze functie hoeft te veranderen.
 */
export function chatIsGesloten(status: string): boolean {
  return status === "voltooid" || status === "geannuleerd";
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    open: "Open",
    geclaimd: "Geclaimd",
    ingeleverd: "Ingeleverd",
    voltooid: "Voltooid",
    in_afwachting_controle: "In afwachting van controle",
    goedgekeurd: "Goedgekeurd",
    afgekeurd: "Afgekeurd",
    concept: "Concept",
    verzonden: "Verzonden",
    betaald: "Betaald",
  };
  return labels[status] ?? status;
}

export function statusKleur(status: string): string {
  const kleuren: Record<string, string> = {
    open: "bg-status-open/10 text-status-open border-status-open/30",
    geclaimd: "bg-status-claimed/10 text-status-claimed border-status-claimed/30",
    ingeleverd: "bg-status-submitted/10 text-status-submitted border-status-submitted/30",
    voltooid: "bg-status-done/10 text-status-done border-status-done/30",
    in_afwachting_controle: "bg-amber-100 text-amber-700 border-amber-300",
    goedgekeurd: "bg-status-open/10 text-status-open border-status-open/30",
    afgekeurd: "bg-red-100 text-red-700 border-red-300",
    concept: "bg-gray-100 text-gray-700 border-gray-300",
    verzonden: "bg-status-claimed/10 text-status-claimed border-status-claimed/30",
    betaald: "bg-status-open/10 text-status-open border-status-open/30",
  };
  return kleuren[status] ?? "bg-gray-100 text-gray-700 border-gray-300";
}
