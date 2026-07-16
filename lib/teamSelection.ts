"use client";

/**
 * Lichtgewicht "wie ben ik"-opslag voor teamleden: geen volwaardige
 * login (dat zou te veel frictie geven voor jeugdleden op de fiets),
 * maar een simpele lokale keuze per club zodat claims/uploads aan het
 * juiste team worden toegekend. Vertrouwensgrens: leden binnen dezelfde
 * club vertrouwen elkaar om het juiste team te kiezen.
 */

function storageKey(clubSlug: string): string {
  return `statieclub_team_${clubSlug}`;
}

export function laadGekozenTeamId(clubSlug: string): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(storageKey(clubSlug));
}

export function kiesTeam(clubSlug: string, teamId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(clubSlug), teamId);
}

export function wisselTeam(clubSlug: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(storageKey(clubSlug));
}
