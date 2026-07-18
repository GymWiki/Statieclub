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

  // Zelfde team-eligibiliteit als het prikbord al client-side
  // filtert (zie /api/ophaalverzoeken/nearby) — hier serverside
  // afgedwongen, want de prikbord-filter is enkel UX en voorkomt geen
  // rechtstreekse POST naar dit endpoint met een niet-toegelaten team.
  const { data: teClaimen } = await supabase
    .from("ophaalverzoeken")
    .select("doel_id, type")
    .eq("id", id)
    .maybeSingle();
  if (teClaimen?.doel_id) {
    const { data: koppelingen } = await supabase
      .from("doel_teams")
      .select("team_id")
      .eq("doel_id", teClaimen.doel_id);
    const beperkt = (koppelingen ?? []).length > 0;
    if (beperkt && !(koppelingen ?? []).some((k) => k.team_id === team_id)) {
      return NextResponse.json(
        { error: "Dit doel is niet opengesteld voor jouw team." },
        { status: 403 }
      );
    }
  }

  // "Glas-naar-Kas" is bewust per team aan/uit-zetbaar (zwaar tilwerk,
  // scherven) — een team zonder glas_service_actief mag zo'n rit nooit
  // claimen, ook niet via een directe POST buiten het prikbord om.
  if (teClaimen?.type === "glasbak") {
    const { data: team } = await supabase.from("teams").select("glas_service_actief").eq("id", team_id).maybeSingle();
    if (!team?.glas_service_actief) {
      return NextResponse.json(
        { error: "Jouw team heeft de 'Glas-naar-Kas' service niet geactiveerd." },
        { status: 403 }
      );
    }
  }

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

  // telefoonnummer zit hier bewust niet in: contact loopt sinds het
  // anonieme chatsysteem uitsluitend via de chat, geen 06-nummers meer.
  const { data: metAdres } = await supabase
    .from("ophaalverzoeken")
    .select("*, donateurs(naam, adres, postcode)")
    .eq("id", id)
    .single();

  // Automatisch systeembericht in de gedeelde chat-thread — zichtbaar
  // voor zowel de speler (in de app) als de donateur (op de status-
  // pagina), dus bewust neutraal/derde-persoon geformuleerd i.p.v.
  // "je hebt geclaimd" (dat zou voor de donateur verwarrend lezen).
  await supabase.from("berichten").insert({
    ophaalverzoek_id: id,
    afzender_type: "systeem",
    bericht_tekst: "Een team heeft deze rit geclaimd — de bewoner is op de hoogte gebracht.",
  });

  const nieuweBadges = speler_id ? await evaluateClaimBadges(speler_id, updated.aangemaakt_op) : [];

  return NextResponse.json({ ophaalverzoek: metAdres, nieuweBadges });
}
