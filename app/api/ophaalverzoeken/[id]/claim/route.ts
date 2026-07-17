import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { evaluateClaimBadges } from "@/lib/badges";

/**
 * POST /api/ophaalverzoeken/[id]/claim
 * Een team claimt een openstaand verzoek van het prikbord. De
 * `.eq("status", "open")`-guard voorkomt dat twee teams tegelijk
 * hetzelfde adres claimen (race condition): alleen de update die het
 * verzoek nog als "open" aantreft, slaagt.
 *
 * `speler_id` is optioneel (backwards compatible), maar nodig voor de
 * buurt-badges ("De Buurtverkenner" e.d.) en de snelheidsbadge —
 * zonder speler_id wordt de claim gewoon verwerkt, alleen zonder
 * persoonlijke badge-evaluatie.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { team_id, speler_id } = await request.json();

  if (!team_id) {
    return NextResponse.json({ error: "team_id is verplicht." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: updated, error } = await supabase
    .from("ophaalverzoeken")
    .update({ geclaimd_door_team_id: team_id, geclaimd_door_speler_id: speler_id ?? null })
    .eq("id", id)
    .eq("status", "open")
    .select()
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!updated) {
    return NextResponse.json(
      { error: "Dit verzoek is net al door een ander team geclaimd." },
      { status: 409 }
    );
  }

  const { data: metAdres } = await supabase
    .from("ophaalverzoeken")
    .select("*, donateurs(naam, adres, postcode, telefoonnummer)")
    .eq("id", id)
    .single();

  const nieuweBadges = speler_id ? await evaluateClaimBadges(speler_id, updated.aangemaakt_op) : [];

  return NextResponse.json({ ophaalverzoek: metAdres, nieuweBadges });
}
