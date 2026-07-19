import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * GET /api/statiegeld-inleveringen?speler_id=...
 * Alle statiegeld-inleveringen (pending én paid) van dit clublid, voor
 * de Virtuele Portemonnee — nieuwste eerst. `statiegeld_inleveringen`
 * heeft bewust geen publieke RLS-policy (zelfde model als `bonnetjes`),
 * dus dit endpoint is de enige manier om ze te lezen.
 */
export async function GET(request: NextRequest) {
  const spelerId = request.nextUrl.searchParams.get("speler_id");
  if (!spelerId) {
    return NextResponse.json({ error: "speler_id is verplicht." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("statiegeld_inleveringen")
    .select("*")
    .eq("speler_id", spelerId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ inleveringen: data ?? [] });
}

/**
 * POST /api/statiegeld-inleveringen
 * Registreert een zelf ingeleverd statiegeldbonnetje als 'pending' —
 * het clublid heeft het geld zelf, en spaart dit saldo op totdat het
 * ofwel de €20-drempel haalt om zelf via iDEAL af te rekenen (zie
 * POST /api/stripe/create-checkout-session, scenario 'wallet_payout'),
 * ofwel de actie (`doel_id`) sluit en er automatisch een betaalverzoek
 * voor wordt gegenereerd (migratie 0017, zie lib/actieAfronden.ts).
 *
 * `doel_id` is optioneel: weggelaten of geen actieve actie gekozen
 * betekent dat het bonnetje aan geen enkele actie hangt — het telt dan
 * gewoon mee zodra de eerstvolgende actie van deze club wordt
 * afgerond.
 */
export async function POST(request: NextRequest) {
  const {
    speler_id: spelerId,
    club_id: clubId,
    doel_id: doelId,
    bedrag,
    image_url: imageUrl,
  } = await request.json();

  if (!spelerId || !clubId) {
    return NextResponse.json({ error: "speler_id en club_id zijn verplicht." }, { status: 400 });
  }

  const bedragEuro = Math.round(Number(bedrag) * 100) / 100;
  if (!Number.isFinite(bedragEuro) || bedragEuro <= 0) {
    return NextResponse.json({ error: "Vul een geldig bedrag in." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  const { data: speler, error: spelerError } = await supabase
    .from("spelers")
    .select("id, club_id")
    .eq("id", spelerId)
    .maybeSingle();

  if (spelerError || !speler) {
    return NextResponse.json({ error: "Speler niet gevonden." }, { status: 404 });
  }
  if (speler.club_id !== clubId) {
    return NextResponse.json({ error: "Deze speler hoort niet bij deze club." }, { status: 403 });
  }

  let geldigeDoelId: string | null = null;
  if (doelId) {
    const { data: doel } = await supabase
      .from("doelen")
      .select("id")
      .eq("id", doelId)
      .eq("club_id", clubId)
      .eq("is_actief", true)
      .maybeSingle();
    if (!doel) {
      return NextResponse.json({ error: "Deze actie bestaat niet (meer) of is niet actief." }, { status: 400 });
    }
    geldigeDoelId = doel.id;
  }

  const { data: inlevering, error: insertError } = await supabase
    .from("statiegeld_inleveringen")
    .insert({
      speler_id: spelerId,
      club_id: clubId,
      doel_id: geldigeDoelId,
      bedrag: bedragEuro,
      image_url: imageUrl || null,
    })
    .select()
    .single();

  if (insertError || !inlevering) {
    return NextResponse.json(
      { error: insertError?.message ?? "Kon de inlevering niet opslaan." },
      { status: 500 }
    );
  }

  return NextResponse.json({ inlevering });
}
