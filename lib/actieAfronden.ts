import { createServiceRoleClient } from "@/lib/supabase/server";
import { CAMPAGNE_AFREKENING_MINIMUM_EURO } from "@/lib/utils";

export interface ActieAfrondenResultaat {
  doel_id: string;
  betaalverzoeken_aangemaakt: number;
  spelers_doorgeschoven: number;
}

interface PendingBonnetjeRij {
  id: string;
  speler_id: string;
  bedrag_euro: number;
  ophaalverzoeken: { doel_id: string | null } | null;
}

/**
 * Rondt één actie (doel) af — gedeeld tussen de dagelijkse cron
 * (`GET /api/cron/close-acties`) en de handmatige override-knop
 * (`POST /api/doelen/[id]/afronden`), zodat beide paden exact dezelfde
 * aggregatie-logica gebruiken.
 *
 * Twee bronnen tellen mee, samengevoegd per speler (migratie 0018 —
 * álle betalingen/kosten lopen voortaan uitsluitend via Stripe, ook
 * fysiek gescand statiegeld, i.p.v. de losse conceptfactuur/WhatsApp-
 * herinnering van vroeger):
 * - 'pending' statiegeld_inleveringen (zelfgeregistreerd, migratie
 *   0016) die aan dit doel gekoppeld zijn óf nog aan geen enkel doel
 *   gekoppeld zijn (bijv. na een eerdere rollover);
 * - goedgekeurde bron='scan' bonnetjes zonder betaalverzoek_id waarvan
 *   het gekoppelde ophaalverzoek (indien aanwezig) aan dit doel hangt,
 *   of zonder ophaalverzoek/doel-koppeling (self-scan via "Scan Eigen
 *   Statiegeld", of nog niet eerder aan een ander doel toegewezen).
 *
 * Per speler:
 * - totaal >= CAMPAGNE_AFREKENING_MINIMUM_EURO: maakt een
 *   `betaalverzoeken`-rij aan en koppelt zowel de statiegeld_inleveringen
 *   (status -> 'processed_for_payment') als de bonnetjes aan dat
 *   betaalverzoek via `betaalverzoek_id`, zodat het Stripe-webhook
 *   straks precies weet welke rijen bij welk betaalverzoek horen.
 * - totaal < drempel: de statiegeld_inleveringen schuiven door
 *   (doel_id = null); bonnetjes hoeven niet aangepast te worden — ze
 *   blijven zonder betaalverzoek_id en komen dus vanzelf weer in
 *   aanmerking bij de eerstvolgende sluitende actie van deze club.
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

  const { data: pendingBonnetjes, error: bonnetjesError } = await service
    .from("bonnetjes")
    .select("id, speler_id, bedrag_euro, teams!inner(club_id), ophaalverzoeken(doel_id)")
    .eq("bron", "scan")
    .eq("status", "goedgekeurd")
    .is("betaalverzoek_id", null)
    .not("speler_id", "is", null)
    .eq("teams.club_id", doel.club_id);

  if (bonnetjesError) {
    throw new Error(bonnetjesError.message);
  }

  // Alleen bonnetjes zonder ophaalverzoek (self-scan) of waarvan het
  // ophaalverzoek's doel_id nog leeg is, of exact dit doel is — een
  // bonnetje dat aan een ánder (nog open) doel hangt wacht op het
  // sluiten van dát doel.
  const bonnetjesVoorDitDoel = ((pendingBonnetjes ?? []) as unknown as PendingBonnetjeRij[]).filter((b) => {
    const bonnetjeDoelId = b.ophaalverzoeken?.doel_id ?? null;
    return bonnetjeDoelId === null || bonnetjeDoelId === doelId;
  });

  const perSpeler = new Map<
    string,
    { inleveringIds: string[]; bonnetjeIds: string[]; totaalInCenten: number }
  >();

  for (const rij of pendingRijen ?? []) {
    const bestaand = perSpeler.get(rij.speler_id) ?? { inleveringIds: [], bonnetjeIds: [], totaalInCenten: 0 };
    bestaand.inleveringIds.push(rij.id);
    bestaand.totaalInCenten += Math.round(Number(rij.bedrag) * 100);
    perSpeler.set(rij.speler_id, bestaand);
  }

  for (const bonnetje of bonnetjesVoorDitDoel) {
    const bestaand = perSpeler.get(bonnetje.speler_id) ?? { inleveringIds: [], bonnetjeIds: [], totaalInCenten: 0 };
    bestaand.bonnetjeIds.push(bonnetje.id);
    bestaand.totaalInCenten += Math.round(Number(bonnetje.bedrag_euro) * 100);
    perSpeler.set(bonnetje.speler_id, bestaand);
  }

  const drempelInCenten = Math.round(CAMPAGNE_AFREKENING_MINIMUM_EURO * 100);
  let betaalverzoekenAangemaakt = 0;
  let spelersDoorgeschoven = 0;

  for (const [spelerId, { inleveringIds, bonnetjeIds, totaalInCenten }] of perSpeler) {
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

      if (inleveringIds.length > 0) {
        await service
          .from("statiegeld_inleveringen")
          .update({ status: "processed_for_payment", betaalverzoek_id: betaalverzoek.id })
          .in("id", inleveringIds);
      }

      if (bonnetjeIds.length > 0) {
        await service.from("bonnetjes").update({ betaalverzoek_id: betaalverzoek.id }).in("id", bonnetjeIds);
      }

      betaalverzoekenAangemaakt += 1;
    } else {
      if (inleveringIds.length > 0) {
        await service.from("statiegeld_inleveringen").update({ doel_id: null }).in("id", inleveringIds);
      }
      spelersDoorgeschoven += 1;
    }
  }

  await service.from("doelen").update({ is_actief: false }).eq("id", doel.id);

  return {
    doel_id: doel.id,
    betaalverzoeken_aangemaakt: betaalverzoekenAangemaakt,
    spelers_doorgeschoven: spelersDoorgeschoven,
  };
}
