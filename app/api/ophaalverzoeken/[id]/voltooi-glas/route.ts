import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { berekenPunten } from "@/lib/utils";
import { evaluateBadges } from "@/lib/badges";

/**
 * POST /api/ophaalverzoeken/[id]/voltooi-glas
 * Rondt een "Glas-naar-Kas"-rit af — de tegenhanger van `POST
 * /api/bonnetjes` voor `type: 'glasbak'`, maar dan zonder foto en
 * zonder anomaly-detection: het bedrag ligt al vast en is al betaald
 * (`vooraf_betaald`), dus er valt niets te verifiëren. Maakt gewoon
 * een normale `bonnetjes`-rij aan (bron `glas_naar_kas`, meteen
 * `goedgekeurd`) zodat de bestaande credit-triggers — team, doel,
 * speler-streak, badges — automatisch en identiek aan een scan lopen.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { team_id, speler_id } = await request.json();

  if (!team_id) {
    return NextResponse.json({ error: "team_id is verplicht." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: verzoek, error: verzoekError } = await supabase
    .from("ophaalverzoeken")
    .select("id, type, status, geclaimd_door_team_id, donatie_bedrag")
    .eq("id", id)
    .maybeSingle();

  if (verzoekError || !verzoek) {
    return NextResponse.json({ error: "Ophaalverzoek niet gevonden." }, { status: 404 });
  }
  if (verzoek.type !== "glasbak") {
    return NextResponse.json({ error: "Dit is geen Glas-naar-Kas-rit." }, { status: 400 });
  }
  if (verzoek.geclaimd_door_team_id !== team_id) {
    return NextResponse.json(
      { error: "Alleen het team dat deze rit geclaimd heeft, mag hem afronden." },
      { status: 403 }
    );
  }
  if (verzoek.status !== "geclaimd") {
    return NextResponse.json({ error: `Kan deze rit niet afronden vanuit status '${verzoek.status}'.` }, { status: 409 });
  }
  if (!verzoek.donatie_bedrag) {
    return NextResponse.json({ error: "Geen donatiebedrag gevonden bij dit verzoek." }, { status: 500 });
  }

  const bedrag = Number(verzoek.donatie_bedrag);

  const { data: bonnetje, error: bonnetjeError } = await supabase
    .from("bonnetjes")
    .insert({
      ophaalverzoek_id: id,
      team_id,
      speler_id: speler_id ?? null,
      foto_url: null,
      bedrag_euro: bedrag,
      punten: berekenPunten(bedrag),
      status: "goedgekeurd",
      bron: "glas_naar_kas",
    })
    .select()
    .single();

  if (bonnetjeError || !bonnetje) {
    return NextResponse.json(
      { error: bonnetjeError?.message ?? "Kon de rit niet afronden." },
      { status: 500 }
    );
  }

  // Zelfde systeembericht-patroon als bij claimen — zichtbaar voor
  // zowel de speler (in de app) als de donateur (op de status-pagina).
  await supabase.from("berichten").insert({
    ophaalverzoek_id: id,
    afzender_type: "systeem",
    bericht_tekst: "Het glas is opgehaald en de donatie is direct bijgeschreven bij de club — bedankt!",
  });

  const nieuweBadges = speler_id ? await evaluateBadges(speler_id, bedrag) : [];

  const { data: metAdres } = await supabase
    .from("ophaalverzoeken")
    .select("*, donateurs(naam, adres, postcode)")
    .eq("id", id)
    .single();

  return NextResponse.json({ ophaalverzoek: metAdres, nieuweBadges });
}
