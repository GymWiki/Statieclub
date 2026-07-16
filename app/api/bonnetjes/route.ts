import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  ANOMALIE_SCANS_VENSTER_MINUTEN,
  beoordeelAnomalie,
  berekenPunten,
  simuleerOcrBedrag,
} from "@/lib/utils";

/**
 * POST /api/bonnetjes
 * Bonnetjes Upload Simulator: de foto is al naar Supabase Storage
 * geüpload door de client (publieke `bonnetjes`-bucket); hier
 * "lezen" we het totaalbedrag via simuleerOcrBedrag (géén echte OCR).
 *
 * Anomaly detection: bedrag >= drempel of >=5 scans van hetzelfde team
 * binnen 10 minuten -> status 'in_afwachting_controle' (punten wachten
 * op de penningmeester). Anders: direct 'goedgekeurd' — de database-
 * trigger `trg_bonnetje_insert` schrijft de punten dan meteen bij op
 * het team (instant gratification op het leaderboard).
 */
export async function POST(request: NextRequest) {
  const { ophaalverzoek_id, team_id, foto_url, bestandsnaam, bestandsgrootte } = await request.json();

  if (!ophaalverzoek_id || !team_id || !foto_url) {
    return NextResponse.json({ error: "ophaalverzoek_id, team_id en foto_url zijn verplicht." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

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

  const bedragEuro = simuleerOcrBedrag(bestandsnaam ?? foto_url, bestandsgrootte ?? 0);
  const punten = berekenPunten(bedragEuro);

  const vensterStart = new Date(Date.now() - ANOMALIE_SCANS_VENSTER_MINUTEN * 60 * 1000).toISOString();
  const { count: recenteScansAantal } = await supabase
    .from("bonnetjes")
    .select("id", { count: "exact", head: true })
    .eq("team_id", team_id)
    .gte("created_at", vensterStart);

  // +1: deze scan telt zelf ook mee voor het patroon ("dit zou de Nde scan zijn").
  const anomalie = beoordeelAnomalie(bedragEuro, (recenteScansAantal ?? 0) + 1);

  const { data: bonnetje, error: bonnetjeError } = await supabase
    .from("bonnetjes")
    .insert({
      ophaalverzoek_id,
      team_id,
      foto_url,
      bedrag_euro: bedragEuro,
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

  return NextResponse.json({ bonnetje });
}
