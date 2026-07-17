import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { chatIsGesloten } from "@/lib/utils";

/**
 * GET /api/berichten?ophaalverzoek_id=...
 * Geeft de berichten van precies één ophaalverzoek terug, oplopend op
 * tijd. `berichten` heeft geen publieke leesrechten (zie migratie
 * 0011) — dit endpoint is bewust de enige manier om ze op te vragen,
 * zowel voor de speler-kant (in de app) als de donateur-kant (de
 * "magic link"-statuspagina, `/status/[ophaalverzoekId]`).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ophaalverzoekId = searchParams.get("ophaalverzoek_id");

  if (!ophaalverzoekId) {
    return NextResponse.json({ error: "ophaalverzoek_id is verplicht." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("berichten")
    .select("*")
    .eq("ophaalverzoek_id", ophaalverzoekId)
    .order("aangemaakt_op", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ berichten: data ?? [] });
}

/**
 * POST /api/berichten
 * Slaat een bericht van een speler of donateur op. `afzender_type`
 * mag hier nooit 'systeem' zijn — systeemberichten (bijv. "Je hebt
 * deze rit geclaimd…") worden uitsluitend server-side ingevoegd door
 * andere route handlers (zie POST /api/ophaalverzoeken/[id]/claim),
 * nooit op verzoek van de client.
 *
 * De chat sluit automatisch mee met de levenscyclus van het
 * ophaalverzoek: is de status 'voltooid' (of 'geannuleerd', zodra dat
 * bestaat), dan wordt hier niets meer opgeslagen.
 */
export async function POST(request: NextRequest) {
  const { ophaalverzoek_id: ophaalverzoekId, afzender_type: afzenderType, bericht_tekst: berichtTekst } =
    await request.json();

  if (!ophaalverzoekId) {
    return NextResponse.json({ error: "ophaalverzoek_id is verplicht." }, { status: 400 });
  }
  if (afzenderType !== "speler" && afzenderType !== "donateur") {
    return NextResponse.json({ error: "afzender_type moet 'speler' of 'donateur' zijn." }, { status: 400 });
  }
  const tekst = typeof berichtTekst === "string" ? berichtTekst.trim() : "";
  if (!tekst || tekst.length > 500) {
    return NextResponse.json({ error: "bericht_tekst is verplicht (max. 500 tekens)." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: verzoek, error: verzoekError } = await supabase
    .from("ophaalverzoeken")
    .select("id, status")
    .eq("id", ophaalverzoekId)
    .maybeSingle();

  if (verzoekError || !verzoek) {
    return NextResponse.json({ error: "Ophaalverzoek niet gevonden." }, { status: 404 });
  }
  if (chatIsGesloten(verzoek.status)) {
    return NextResponse.json(
      { error: "Deze ophaalactie is afgerond. De chat is gesloten." },
      { status: 403 }
    );
  }

  const { data: bericht, error } = await supabase
    .from("berichten")
    .insert({ ophaalverzoek_id: ophaalverzoekId, afzender_type: afzenderType, bericht_tekst: tekst })
    .select()
    .single();

  if (error || !bericht) {
    return NextResponse.json({ error: error?.message ?? "Kon bericht niet opslaan." }, { status: 500 });
  }

  return NextResponse.json({ bericht });
}
