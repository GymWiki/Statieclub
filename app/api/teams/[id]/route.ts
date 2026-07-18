import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

/**
 * PATCH /api/teams/[id]
 * Zet vooralsnog uitsluitend `glas_service_actief` aan/uit — de
 * "Glas-naar-Kas" service is bewust per team schakelbaar (zware
 * glasbak-flessen/scherven, dus een club zet dit typisch alleen aan
 * voor oudere teams). Alleen voor een beheerder van de club waar dit
 * team bij hoort.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { glas_service_actief: glasServiceActief } = await request.json();

  if (typeof glasServiceActief !== "boolean") {
    return NextResponse.json({ error: "glas_service_actief moet een boolean zijn." }, { status: 400 });
  }

  const authedSupabase = await createClient();
  const {
    data: { user },
  } = await authedSupabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  }

  const service = createServiceRoleClient();

  const { data: team, error: teamError } = await service.from("teams").select("id, club_id").eq("id", id).single();

  if (teamError || !team) {
    return NextResponse.json({ error: "Team niet gevonden." }, { status: 404 });
  }

  const { data: admin } = await authedSupabase
    .from("club_admins")
    .select("id")
    .eq("club_id", team.club_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) {
    return NextResponse.json({ error: "Geen toegang tot deze club." }, { status: 403 });
  }

  const { data: bijgewerkt, error: updateError } = await service
    .from("teams")
    .update({ glas_service_actief: glasServiceActief })
    .eq("id", id)
    .select()
    .single();

  if (updateError || !bijgewerkt) {
    return NextResponse.json({ error: updateError?.message ?? "Kon team niet bijwerken." }, { status: 500 });
  }

  return NextResponse.json({ team: bijgewerkt });
}
