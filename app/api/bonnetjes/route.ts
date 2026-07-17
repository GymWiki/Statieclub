import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { ANOMALIE_SCANS_VENSTER_MINUTEN, beoordeelAnomalie, berekenPunten } from "@/lib/utils";
import { evaluateBadges } from "@/lib/badges";

/**
 * POST /api/bonnetjes
 * Het bedrag komt hier binnen zoals de gebruiker het in de Hybride OCR
 * Bonnetjes Scanner heeft geverifieerd (bevestigd of handmatig
 * gecorrigeerd) — de client-side OCR zelf raakt de database nooit
 * rechtstreeks. De server blijft wél de autoriteit over de anomaly
 * detection: bedrag >= drempel of >=5 scans van hetzelfde team binnen
 * 10 minuten -> 'in_afwachting_controle' (punten wachten op de
 * penningmeester). Anders: direct 'goedgekeurd' — de database-trigger
 * `trg_bonnetje_insert` schrijft de punten dan meteen bij op het team
 * (instant gratification op het leaderboard).
 *
 * `ophaalverzoek_id` is optioneel: bij "Scan Eigen Statiegeld" is er
 * geen geclaimd adres, enkel een team (en meestal een speler). Bij een
 * meegegeven ophaalverzoek_id gelden de bestaande claim-checks
 * onverkort.
 */
export async function POST(request: NextRequest) {
  const { ophaalverzoek_id, team_id, speler_id, foto_url, bedrag_euro } = await request.json();

  if (!team_id || !foto_url) {
    return NextResponse.json({ error: "team_id en foto_url zijn verplicht." }, { status: 400 });
  }
  const bedragEuro = Number(bedrag_euro);
  if (!Number.isFinite(bedragEuro) || bedragEuro <= 0) {
    return NextResponse.json({ error: "bedrag_euro moet een positief getal zijn." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  if (ophaalverzoek_id) {
    const { data: verzoek, error: verzoekError } = await supabase
      .from("ophaalverzoeken")
      .select("id, geclaimd_door_team_id, status")
      .eq("id", ophaalverzoek_id)
      .single();

    if (verzoekError || !verzoek) {
      return NextResponse.json({ error: "Ophaalverzoek niet gevonden." }, { status: 404 });
    }
    if (verzoek.geclaimd_door_team_id !== team_id) {
      return NextResponse.json(
        { error: "Alleen het team dat dit verzoek geclaimd heeft, mag een bonnetje uploaden." },
        { status: 403 }
      );
    }
    if (verzoek.status !== "geclaimd") {
      return NextResponse.json(
        { error: `Kan geen bonnetje uploaden bij status '${verzoek.status}'.` },
        { status: 409 }
      );
    }
  }

  const bedragAfgerond = Math.round(bedragEuro * 100) / 100;
  const punten = berekenPunten(bedragAfgerond);

  const vensterStart = new Date(Date.now() - ANOMALIE_SCANS_VENSTER_MINUTEN * 60 * 1000).toISOString();
  const { count: recenteScansAantal } = await supabase
    .from("bonnetjes")
    .select("id", { count: "exact", head: true })
    .eq("team_id", team_id)
    .gte("created_at", vensterStart);

  // +1: deze scan telt zelf ook mee voor het patroon ("dit zou de Nde scan zijn").
  const anomalie = beoordeelAnomalie(bedragAfgerond, (recenteScansAantal ?? 0) + 1);

  const { data: bonnetje, error: bonnetjeError } = await supabase
    .from("bonnetjes")
    .insert({
      ophaalverzoek_id: ophaalverzoek_id ?? null,
      team_id,
      speler_id: speler_id ?? null,
      foto_url,
      bedrag_euro: bedragAfgerond,
      punten,
      status: anomalie.verdacht ? "in_afwachting_controle" : "goedgekeurd",
      flag_reden: anomalie.verdacht ? anomalie.redenen.join("; ") : null,
    })
    .select()
    .single();

  if (bonnetjeError || !bonnetje) {
    return NextResponse.json(
      { error: bonnetjeError?.message ?? "Kon bonnetje niet opslaan." },
      { status: 500 }
    );
  }

  const nieuweBadges =
    bonnetje.status === "goedgekeurd" && speler_id ? await evaluateBadges(speler_id, bedragAfgerond) : [];

  return NextResponse.json({ bonnetje, nieuweBadges });
}
