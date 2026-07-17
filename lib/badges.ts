import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Badge, Speler } from "@/lib/types";

/**
 * Badge-engine: wordt aangeroepen ná een goedgekeurd bonnetje (dus
 * nadat de `credit_speler_voor_bonnetje`-trigger de speler-rij al heeft
 * bijgewerkt). Leest de actuele stand van de speler + de nog niet
 * ontgrendelde badges, en ontgrendelt alles waarvan het criterium nu
 * gehaald is. Geeft de nieuw ontgrendelde badges terug zodat de UI een
 * "Nieuwe badge!"-toast kan tonen.
 */
export async function evaluateBadges(spelerId: string, nieuwScanBedrag: number): Promise<Badge[]> {
  const service = createServiceRoleClient();

  const { data: speler } = await service.from("spelers").select("*").eq("id", spelerId).single();
  if (!speler) return [];

  const { data: alleBadges } = await service.from("badges").select("*");
  const { data: reedsOntgrendeld } = await service
    .from("speler_badges")
    .select("badge_id")
    .eq("speler_id", spelerId);
  const ontgrendeldeIds = new Set((reedsOntgrendeld ?? []).map((r) => r.badge_id as string));

  const nieuweBadges = ((alleBadges as Badge[]) ?? []).filter(
    (badge) => !ontgrendeldeIds.has(badge.id) && voldoetAanCriteria(badge, speler as Speler, nieuwScanBedrag)
  );

  if (nieuweBadges.length > 0) {
    await service
      .from("speler_badges")
      .insert(nieuweBadges.map((badge) => ({ speler_id: spelerId, badge_id: badge.id })));
  }

  return nieuweBadges;
}

function voldoetAanCriteria(badge: Badge, speler: Speler, nieuwScanBedrag: number): boolean {
  const waarde = badge.criteria_waarde ?? 0;

  switch (badge.criteria_type) {
    case "eerste_scan":
      return speler.totaal_scans >= 1;
    case "enkele_scan_euro":
      return nieuwScanBedrag >= waarde;
    case "totaal_euro":
      return speler.totaal_opgehaald_euro >= waarde;
    case "aantal_scans":
      return speler.totaal_scans >= waarde;
    case "week_streak":
      return speler.current_week_streak >= waarde;
    default:
      return false;
  }
}
