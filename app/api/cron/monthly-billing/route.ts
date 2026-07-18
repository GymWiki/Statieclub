import { NextRequest, NextResponse } from "next/server";
import { SequenceType } from "@mollie/api-client";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { mollieClient, ROLLOVER_DREMPEL_EURO, type MolliePaymentMetadata } from "@/lib/mollie";
import { verstuurMaandrapport } from "@/lib/email";

export const dynamic = "force-dynamic";

interface ClubVerwerkResultaat {
  club_id: string;
  club_naam: string;
  actie: "geincasseerd" | "doorgeschoven" | "overgeslagen";
  bedrag?: number;
  reden?: string;
}

/**
 * POST /api/cron/monthly-billing
 * Draait maandelijks (zie vercel.json — 1e van de maand, 06:00 UTC).
 * Voor elke actieve club: is `openstaand_saldo_fee` >= €2,50, dan wordt
 * er een SEPA-incasso getriggerd via Mollie en `openstaand_saldo_fee`
 * teruggezet naar 0. Zit de club daaronder, dan gebeurt er niets — het
 * bedrag schuift vanzelf door naar volgende maand ("rollover"), simpelweg
 * omdat we het nooit resetten. Elke club krijgt (gesimuleerd) een
 * maandrapport, ongeacht welke van de twee paden hij volgt.
 *
 * Beveiligd met CRON_SECRET (Vercel Cron Jobs stuurt deze automatisch
 * mee als 'Authorization: Bearer <CRON_SECRET>' zodra de env var is
 * ingesteld) — zonder geldige/ingestelde secret altijd 401, nooit
 * "open by default".
 *
 * Let op: Vercel Cron Jobs doen altijd een GET-request (geen POST) naar
 * het geconfigureerde pad — vandaar GET hier, ook al is dit qua
 * bedoeling een muterende actie.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Niet geautoriseerd." }, { status: 401 });
  }

  const service = createServiceRoleClient();
  const now = new Date();
  const maand = now.getUTCMonth() + 1;
  const jaar = now.getUTCFullYear();
  const maandStart = new Date(Date.UTC(jaar, maand - 1, 1)).toISOString();
  const maandEind = new Date(Date.UTC(jaar, maand, 1)).toISOString();

  const { data: clubs, error: clubsError } = await service
    .from("clubs")
    .select("id, naam, mollie_customer_id, mollie_mandate_id, openstaand_saldo_fee")
    .eq("is_actief", true);

  if (clubsError) {
    return NextResponse.json({ error: clubsError.message }, { status: 500 });
  }

  const resultaten: ClubVerwerkResultaat[] = [];

  for (const club of clubs ?? []) {
    const openstaandSaldo = Number(club.openstaand_saldo_fee);

    const { data: teams } = await service.from("teams").select("id").eq("club_id", club.id);
    const teamIds = (teams ?? []).map((team) => team.id as string);

    let totaalOpgehaald = 0;
    if (teamIds.length > 0) {
      const { data: bonnetjes } = await service
        .from("bonnetjes")
        .select("bedrag_euro")
        .in("team_id", teamIds)
        .eq("status", "goedgekeurd")
        .gte("geverifieerd_op", maandStart)
        .lt("geverifieerd_op", maandEind);

      totaalOpgehaald = (bonnetjes ?? []).reduce((som, b) => som + Number(b.bedrag_euro), 0);
    }

    // clubs heeft zelf geen e-mailveld — dezelfde oplossing als bij
    // /api/mollie/create-mandate: het adres van de (eerste) beheerder.
    let clubEmail: string | null = null;
    const { data: adminRow } = await service
      .from("club_admins")
      .select("user_id")
      .eq("club_id", club.id)
      .limit(1)
      .maybeSingle();
    if (adminRow) {
      const { data: userData } = await service.auth.admin.getUserById(adminRow.user_id);
      clubEmail = userData?.user?.email ?? null;
    }

    if (openstaandSaldo < ROLLOVER_DREMPEL_EURO) {
      resultaten.push({
        club_id: club.id,
        club_naam: club.naam,
        actie: "doorgeschoven",
        bedrag: openstaandSaldo,
      });

      await verstuurMaandrapport({
        clubNaam: club.naam,
        clubEmail,
        maand,
        jaar,
        totaalOpgehaald,
        feeBedrag: openstaandSaldo,
        feeStatus: "doorgeschoven",
      });
      continue;
    }

    if (!club.mollie_customer_id || !club.mollie_mandate_id) {
      resultaten.push({
        club_id: club.id,
        club_naam: club.naam,
        actie: "overgeslagen",
        reden: "Geen geldig SEPA-mandaat — automatische incasso nog niet geactiveerd door de club.",
      });
      continue;
    }

    // Idempotentie: als deze club/maand/jaar al een incasso-record heeft
    // (bijv. de cron is per ongeluk twee keer getriggerd), niet opnieuw incasseren.
    const { data: bestaandeIncasso } = await service
      .from("platform_incassos")
      .select("id")
      .eq("club_id", club.id)
      .eq("maand", maand)
      .eq("jaar", jaar)
      .maybeSingle();

    if (bestaandeIncasso) {
      resultaten.push({
        club_id: club.id,
        club_naam: club.naam,
        actie: "overgeslagen",
        reden: "Deze club/maand is al verwerkt (bestaand incasso-record gevonden).",
      });
      continue;
    }

    const { data: incasso, error: incassoError } = await service
      .from("platform_incassos")
      .insert({ club_id: club.id, maand, jaar, bedrag: openstaandSaldo, status: "pending" })
      .select("id")
      .single();

    if (incassoError || !incasso) {
      resultaten.push({
        club_id: club.id,
        club_naam: club.naam,
        actie: "overgeslagen",
        reden: `Kon geen incasso-record aanmaken: ${incassoError?.message ?? "onbekende fout"}`,
      });
      continue;
    }

    try {
      const mollie = mollieClient();
      const metadata: MolliePaymentMetadata = {
        type: "platform_incasso",
        club_id: club.id,
        incasso_id: incasso.id,
      };

      const payment = await mollie.payments.create({
        amount: { currency: "EUR", value: openstaandSaldo.toFixed(2) },
        description: `Statieclub platformfee ${maand}/${jaar} — ${club.naam}`,
        sequenceType: SequenceType.recurring,
        customerId: club.mollie_customer_id,
        mandateId: club.mollie_mandate_id,
        metadata,
      });

      await service
        .from("platform_incassos")
        .update({ mollie_payment_id: payment.id })
        .eq("id", incasso.id);
      await service.from("clubs").update({ openstaand_saldo_fee: 0 }).eq("id", club.id);

      resultaten.push({
        club_id: club.id,
        club_naam: club.naam,
        actie: "geincasseerd",
        bedrag: openstaandSaldo,
      });

      await verstuurMaandrapport({
        clubNaam: club.naam,
        clubEmail,
        maand,
        jaar,
        totaalOpgehaald,
        feeBedrag: openstaandSaldo,
        feeStatus: "geincasseerd",
      });
    } catch (err) {
      await service.from("platform_incassos").update({ status: "failed" }).eq("id", incasso.id);
      resultaten.push({
        club_id: club.id,
        club_naam: club.naam,
        actie: "overgeslagen",
        reden: err instanceof Error ? err.message : "Onbekende Mollie-fout bij het starten van de incasso.",
      });
    }
  }

  return NextResponse.json({ verwerkt: resultaten.length, resultaten });
}
