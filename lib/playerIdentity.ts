"use client";

/**
 * Persistente, frictieloze speler-identiteit: net als teamSelection.ts
 * géén Supabase Auth, maar een client-gegenereerde UUID die eenmalig in
 * localStorage wordt bewaard (1x per apparaat, over alle clubs heen —
 * zelfde schaal als de spelernaam). Dit geeft badges/streaks een
 * stabiele sleutel zonder dat een jeugdlid ooit hoeft in te loggen.
 */

const SPELER_ID_KEY = "statieclub_speler_id";

export function laadOfMaakSpelerId(): string {
  if (typeof window === "undefined") return "";

  let id = window.localStorage.getItem(SPELER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    window.localStorage.setItem(SPELER_ID_KEY, id);
  }
  return id;
}
