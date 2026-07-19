import { createServiceRoleClient } from "@/lib/supabase/server";
import { CAMPAGNE_AFREKENING_MINIMUM_EURO } from "@/lib/utils";

export interface ActieAfrondenResultaat {
  doel_id: string;
  betaalverzoeken_aangemaakt: number;
  spelers_doorgeschoven: number;
}

/**
 * Rondt één actie (doel) af — gedeeld tussen de dagelijkse cron
 * (`GET /api/cron/close-acties`) en de handmatige override-knop
 * (`POST /api/doelen/[id]/afronden`), zodat beide paden exact dezelfde
 * aggregatie-logica gebruiken.
 *
 * Pakt alle 'pending' statiegeld-inleveringen van de club die óf aan
 * dit specifieke doel gekoppeld zijn, óf nog aan geen enkel doel
 * gekoppeld zijn (bijv. na een eerdere rollover) — groepeert per
 * speler, en per speler:
 * - totaal >= CAMPAGNE_AFREKENING_MINIMUM_EURO: maakt een
 *   `betaalverzoeken`-rij aan en zet de meegenomen inleveringen op
 *   'processed_for_payment', gekoppeld via `betaalverzoek_id` (zodat
 *   de webhook later precies weet welke rijen bij welk betaalverzoek
 *   horen, ook als een speler tegelijk een ouder openstaand
 *   betaalverzoek heeft).
 * - totaal < drempel: koppelt de inleveringen los van dit (sluitende)
 *   doel (`doel_id = null`) maar laat ze 'pending' — ze schuiven zo
 *   vanzelf door naar de eerstvolgende actie die afgerond wordt.
 *
 * Zet het doel tot slot op `is_actief = false` — dezelfde betekenis
 * als de al bestaande handmatige "Sluiten"-knop.
 */
export async function rondActieAf(doelId: string): Promise<ActieAfrondenResultaat> {
  const service = createServiceRoleClient();

  const { data: doel, error: doelError } = await service
    .from("doelen")
    .select("id, club_id")
    .eq("id", doelId)
    .single();

  if (doelError || !doel) {
    throw new Error("Doel niet gevonden.");
  }

  const { data: pendingRijen, error: pendingError } = await service
    .from("statiegeld_inleveringen")
    .select("id, speler_id, bedrag")
    .eq("club_id", doel.club_id)
    .eq("status", "pending")
    .or(`doel_id.eq.${doelId},doel_id.is.null`);

  if (pendingError) {
    throw new Error(pendingError.message);
  }

  const perSpeler = new Map<string, { rijIds: string[]; totaalInCenten: number }>();
  for (const rij of pendingRijen ?? []) {
    const bestaand = perSpeler.get(rij.speler_id) ?? { rijIds: [], totaalInCenten: 0 };
    bestaand.rijIds.push(rij.id);
    bestaand.totaalInCenten += Math.round(Number(rij.bedrag) * 100);
    perSpeler.set(rij.speler_id, bestaand);
  }

  const drempelInCenten = Math.round(CAMPAGNE_AFREKENING_MINIMUM_EURO * 100);
  let betaalverzoekenAangemaakt = 0;
  let spelersDoorgeschoven = 0;

  for (const [spelerId, { rijIds, totaalInCenten }] of perSpeler) {
    if (totaalInCenten >= drempelInCenten) {
      const { data: betaalverzoek, error: insertError } = await service
        .from("betaalverzoeken")
        .insert({
          speler_id: spelerId,
          club_id: doel.club_id,
          doel_id: doel.id,
          bedrag: totaalInCenten / 100,
        })
        .select("id")
        .single();

      if (insertError || !betaalverzoek) {
        console.error("[actieAfronden] kon betaalverzoek niet aanmaken voor speler:", spelerId, insertError);
        continue;
      }

      await service
        .from("statiegeld_inleveringen")
        .update({ status: "processed_for_payment", betaalverzoek_id: betaalverzoek.id })
        .in("id", rijIds);

      betaalverzoekenAangemaakt += 1;
    } else {
      await service.from("statiegeld_inleveringen").update({ doel_id: null }).in("id", rijIds);
      spelersDoorgeschoven += 1;
    }
  }

  await service.from("doelen").update({ is_actief: false }).eq("id", doel.id);

  return { doel_id: doel.id, betaalverzoeken_aangemaakt: betaalverzoekenAangemaakt, spelers_doorgeschoven: spelersDoorgeschoven };
}
