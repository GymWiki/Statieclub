import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

/**
 * PATCH /api/bonnetjes/[id]/verify
 * Enige route die echte financiële status wijzigt (fysiek geld
 * ontvangen). Daarom wél gebonden aan een ingelogde gebruiker die
 * penningmeester/bestuurslid is van de club waar dit bonnetje bij
 * hoort — geverifieerd via de sessie-cookies (anon-key + RLS op
 * club_admins), niet enkel via de open service-role.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status } = await request.json();

  if (status !== "goedgekeurd" && status !== "afgekeurd") {
    return NextResponse.json({ error: "status moet 'goedgekeurd' of 'afgekeurd' zijn." }, { status: 400 });
  }

  const authedSupabase = await createClient();
  const {
    data: { user },
  } = await authedSupabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  }

  const service = createServiceRoleClient();

  const { data: bonnetje, error: bonnetjeError } = await service
    .from("bonnetjes")
    .select("id, status, team_id, teams(club_id)")
    .eq("id", id)
    .single();

  if (bonnetjeError || !bonnetje) {
    return NextResponse.json({ error: "Bonnetje niet gevonden." }, { status: 404 });
  }

  const clubId = (bonnetje as unknown as { teams: { club_id: string } }).teams.club_id;

  const { data: admin } = await authedSupabase
    .from("club_admins")
    .select("id")
    .eq("club_id", clubId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) {
    return NextResponse.json({ error: "Geen toegang tot deze club." }, { status: 403 });
  }
  if (bonnetje.status !== "ingeleverd") {
    return NextResponse.json(
      { error: `Bonnetje heeft al status '${bonnetje.status}'.` },
      { status: 409 }
    );
  }

  const { data: updated, error: updateError } = await service
    .from("bonnetjes")
    .update({ status, geverifieerd_door: user.email })
    .eq("id", id)
    .select()
    .single();

  if (updateError || !updated) {
    return NextResponse.json(
      { error: updateError?.message ?? "Kon bonnetje niet bijwerken." },
      { status: 500 }
    );
  }

  return NextResponse.json({ bonnetje: updated });
}
