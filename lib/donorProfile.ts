"use client";

/**
 * Bewaart de eigen contactgegevens van de donateur lokaal in de browser
 * (niet server-side opvraagbaar door e-mail te raden — zie RLS-notities),
 * zodat een volgend ophaalverzoek bij een andere club met 1 klik is
 * ingevuld. De database zelf dedupliceert alsnog op e-mailadres
 * (upsert), dus dit werkt ook prima als iemand op meerdere apparaten doneert.
 */

const STORAGE_KEY = "statieclub_donor_profile";

export interface DonorProfiel {
  naam: string;
  email: string;
  adres: string;
  postcode: string;
  telefoonnummer: string | null;
}

export function laadDonorProfiel(): DonorProfiel | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DonorProfiel) : null;
  } catch {
    return null;
  }
}

export function bewaarDonorProfiel(profiel: DonorProfiel) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profiel));
}
