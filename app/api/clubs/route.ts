import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { postcodeCijfers } from "@/lib/utils";

/**
 * GET /api/clubs?postcode=7511AB
 * Publieke lijst van actieve clubcampagnes. Als er clubs in dezelfde
 * postcode-regio (eerste 4 cijfers) zijn, worden die als eerste getoond;
 * daarna de rest, zodat een donateur altijd resultaten ziet.
 * (clubs is een publiek leesbare tabel — hier volstaat de anon-key.)
 */
export async function GET(request: NextRequest) {
  const postcode = request.nextUrl.searchParams.get("postcode") ?? "";
  const cijfers = postcodeCijfers(postcode);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clubs")
    .select("*")
    .eq("is_actief", true)
    .order("naam");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const clubs = data ?? [];
  if (!cijfers) {
    return NextResponse.json({ clubs });
  }

  const inRegio = clubs.filter((c: { postcode: string }) => c.postcode.replace(/\s/g, "").startsWith(cijfers));
  const overig = clubs.filter((c: { postcode: string }) => !c.postcode.replace(/\s/g, "").startsWith(cijfers));

  return NextResponse.json({ clubs: [...inRegio, ...overig], aantalInRegio: inRegio.length });
}

/**
 * POST /api/clubs
 * Zelfregistratie: iedere ingelogde gebruiker mag een club aanmaken en
 * wordt daarmee automatisch beheerder (club_admins). De database-
 * functie `maak_club_met_beheerder` doet beide inserts in één
 * transactie en bepaalt zelf een unieke slug — de rechten hiervoor
 * zijn beperkt tot precies deze security-definer-functie, niet tot
 * brede schrijftoegang op de tabellen zelf.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  }

  const body = await request.json();
  const naam = body.naam?.trim();
  const postcode = body.postcode?.trim();
  const regio = body.regio?.trim();
  const logoUrl = body.logo_url?.trim() || null;

  if (!naam || !postcode || !regio) {
    return NextResponse.json({ error: "Vul alle verplichte velden correct in." }, { status: 400 });
  }

  const { data: club, error } = await supabase
    .rpc("maak_club_met_beheerder", {
      p_naam: naam,
      p_postcode: postcode,
      p_regio: regio,
      p_logo_url: logoUrl,
    })
    .single();

  if (error || !club) {
    return NextResponse.json({ error: error?.message ?? "Kon club niet aanmaken." }, { status: 500 });
  }

  return NextResponse.json({ club });
}
