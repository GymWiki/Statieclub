import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { berekenPlatformFee, PLATFORM_FEE_PERCENTAGE } from "@/lib/utils";

/**
 * POST /api/clubs/[slug]/facturen
 * Genereert een conceptfactuur (5% platform-fee) over uitsluitend de
 * bonnetjes die de penningmeester heeft goedgekeurd sinds het einde
 * van de vorige factuurperiode (of sinds het ontstaan van de club, als
 * dit de eerste factuur is). Afgekeurde scans en openstaande
 * vlaggetjes tellen dus nooit mee — en `bron = 'glas_naar_kas'`
 * evenmin: die donaties gaan expliciet 100% naar de clubkas, geen
 * platformfee (zie migratie 0013).
 */
export async function POST(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const authedSupabase = await createClient();
  const {
    data: { user },
  } = await authedSupabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  }

  const service = createServiceRoleClient();

  const { data: club, error: clubError } = await service
    .from("clubs")
    .select("id, created_at")
    .eq("slug", slug)
    .single();

  if (clubError || !club) {
    return NextResponse.json({ error: "Club niet gevonden." }, { status: 404 });
  }

  const { data: admin } = await authedSupabase
    .from("club_admins")
    .select("id")
    .eq("club_id", club.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) {
    return NextResponse.json({ error: "Geen toegang tot deze club." }, { status: 403 });
  }

  const { data: laatsteFactuur } = await service
    .from("facturen")
    .select("periode_eind")
    .eq("club_id", club.id)
    .order("periode_eind", { ascending: false })
    .limit(1)
    .maybeSingle();

  const periodeStart = laatsteFactuur?.periode_eind ?? club.created_at;
  const periodeEind = new Date().toISOString();

  const { data: goedgekeurdeBonnetjes, error: bonnetjesError } = await service
    .from("bonnetjes")
    .select("bedrag_euro, teams!inner(club_id)")
    .eq("status", "goedgekeurd")
    .neq("bron", "glas_naar_kas")
    .eq("teams.club_id", club.id)
    .gt("geverifieerd_op", periodeStart)
    .lte("geverifieerd_op", periodeEind);

  if (bonnetjesError) {
    return NextResponse.json({ error: bonnetjesError.message }, { status: 500 });
  }

  const totaalGoedgekeurdBedrag = (goedgekeurdeBonnetjes ?? []).reduce(
    (som: number, b: { bedrag_euro: number }) => som + Number(b.bedrag_euro),
    0
  );

  if (totaalGoedgekeurdBedrag <= 0) {
    return NextResponse.json(
      { error: "Geen nieuw goedgekeurde bonnetjes sinds de vorige factuur — niets om te factureren." },
      { status: 400 }
    );
  }

  const platformFeeBedrag = berekenPlatformFee(totaalGoedgekeurdBedrag);

  const { data: factuur, error: factuurError } = await service
    .from("facturen")
    .insert({
      club_id: club.id,
      periode_start: periodeStart,
      periode_eind: periodeEind,
      totaal_goedgekeurd_bedrag: totaalGoedgekeurdBedrag,
      platform_fee_percentage: PLATFORM_FEE_PERCENTAGE,
      platform_fee_bedrag: platformFeeBedrag,
      aangemaakt_door: user.id,
    })
    .select()
    .single();

  if (factuurError || !factuur) {
    return NextResponse.json(
      { error: factuurError?.message ?? "Kon factuur niet aanmaken." },
      { status: 500 }
    );
  }

  return NextResponse.json({ factuur });
}
