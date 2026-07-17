import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Badge, Speler } from "@/lib/types";

/**
 * Badge-engine. Twee aanroeppunten, met elk hun eigen "moment":
 * - `evaluateBadges` — ná een goedgekeurd bonnetje (dus nadat de
 *   `credit_speler_voor_bonnetje`-trigger de speler-rij al heeft
 *   bijgewerkt). Dit is ook het moment waarop een ophaalverzoek naar
 *   'voltooid' gaat, dus hier wordt ook de buurt-teller (aantal_claims)
 *   meegenomen.
 * - `evaluateClaimBadges` — direct ná het claimen van een adres, voor
 *   de snelheidsbadge ("binnen X minuten geclaimd").
 * Beide delen dezelfde kernlogica (`ontgrendelBadges`): welke badges
 * heeft deze speler nog niet, en welke daarvan zijn nu wél gehaald.
 */

interface ScanContext {
  type: "scan";
  nieuwScanBedrag: number;
}

interface ClaimContext {
  type: "claim";
  minutenTotClaim: number;
}

type EvaluatieContext = ScanContext | ClaimContext;

export async function evaluateBadges(spelerId: string, nieuwScanBedrag: number): Promise<Badge[]> {
  return ontgrendelBadges(spelerId, { type: "scan", nieuwScanBedrag });
}

export async function evaluateClaimBadges(spelerId: string, ophaalverzoekAangemaaktOp: string): Promise<Badge[]> {
  const minutenTotClaim = (Date.now() - new Date(ophaalverzoekAangemaaktOp).getTime()) / (60 * 1000);
  return ontgrendelBadges(spelerId, { type: "claim", minutenTotClaim });
}

async function ontgrendelBadges(spelerId: string, context: EvaluatieContext): Promise<Badge[]> {
  const service = createServiceRoleClient();

  const { data: speler } = await service.from("spelers").select("*").eq("id", spelerId).single();
  if (!speler) return [];

  const { data: alleBadges } = await service.from("badges").select("*");
  const { data: reedsOntgrendeld } = await service
    .from("speler_badges")
    .select("badge_id")
    .eq("speler_id", spelerId);
  const ontgrendeldeIds = new Set((reedsOntgrendeld ?? []).map((r) => r.badge_id as string));

  const teEvalueren = ((alleBadges as Badge[]) ?? []).filter((badge) => !ontgrendeldeIds.has(badge.id));
  if (teEvalueren.length === 0) return [];

  // Alleen tellen als er daadwerkelijk een buurt-badge in het spel is —
  // een gewone scan hoeft anders onnodig een extra query te doen.
  let aantalVoltooideClaims: number | null = null;
  if (teEvalueren.some((badge) => badge.criteria_type === "aantal_claims")) {
    const { count } = await service
      .from("ophaalverzoeken")
      .select("id", { count: "exact", head: true })
      .eq("geclaimd_door_speler_id", spelerId)
      .eq("status", "voltooid");
    aantalVoltooideClaims = count ?? 0;
  }

  const nieuweBadges = teEvalueren.filter((badge) =>
    voldoetAanCriteria(badge, speler as Speler, context, aantalVoltooideClaims)
  );

  if (nieuweBadges.length > 0) {
    await service
      .from("speler_badges")
      .insert(nieuweBadges.map((badge) => ({ speler_id: spelerId, badge_id: badge.id })));
  }

  return nieuweBadges;
}

function voldoetAanCriteria(
  badge: Badge,
  speler: Speler,
  context: EvaluatieContext,
  aantalVoltooideClaims: number | null
): boolean {
  const waarde = badge.criteria_waarde ?? 0;

  switch (badge.criteria_type) {
    case "eerste_scan":
      return context.type === "scan" && speler.totaal_scans >= 1;
    case "enkele_scan_euro":
      return context.type === "scan" && context.nieuwScanBedrag >= waarde;
    case "exact_bedrag":
      return context.type === "scan" && Math.abs(context.nieuwScanBedrag - waarde) < 0.005;
    case "totaal_euro":
      return speler.totaal_opgehaald_euro >= waarde;
    case "aantal_scans":
      return speler.totaal_scans >= waarde;
    case "week_streak":
      return speler.current_week_streak >= waarde;
    case "aantal_claims":
      return aantalVoltooideClaims !== null && aantalVoltooideClaims >= waarde;
    case "snelle_claim":
      return context.type === "claim" && context.minutenTotClaim >= 0 && context.minutenTotClaim <= waarde;
    default:
      return false;
  }
}
