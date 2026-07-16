import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { berekenPunten, simuleerOcrBedrag } from "@/lib/utils";

/**
 * POST /api/bonnetjes
 * Bonnetjes Upload Simulator: de foto is al naar Supabase Storage
 * geüpload door de client (publieke `bonnetjes`-bucket); hier
 * "lezen" we het totaalbedrag via simuleerOcrBedrag (géén echte OCR)
 * en schrijven direct punten/euro's toe aan het team. De database-
 * trigger `trg_bonnetje_insert` zet vervolgens automatisch de status
 * van het ophaalverzoek op 'ingeleverd'.
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

  const { data: bonnetje, error: bonnetjeError } = await supabase
    .from("bonnetjes")
    .insert({
      ophaalverzoek_id,
      team_id,
      foto_url,
      bedrag_euro: bedragEuro,
      punten,
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
