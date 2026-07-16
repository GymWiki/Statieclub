import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

/**
 * POST /api/clubs/[slug]/teams
 * Voegt een nieuw team toe aan een campagne. Alleen beschikbaar voor
 * een ingelogde gebruiker die beheerder is van deze club (via
 * club_admins) — teams zelf blijven verder publiek leesbaar (RLS),
 * maar het aanmaken loopt bewust via de service-role na deze check.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { team_naam } = await request.json();

  if (!team_naam || typeof team_naam !== "string" || !team_naam.trim()) {
    return NextResponse.json({ error: "Teamnaam is verplicht." }, { status: 400 });
  }

  const authedSupabase = await createClient();
  const {
    data: { user },
  } = await authedSupabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  }

  const service = createServiceRoleClient();

  const { data: club, error: clubError } = await service.from("clubs").select("id").eq("slug", slug).single();

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

  const { data: team, error: teamError } = await service
    .from("teams")
    .insert({ club_id: club.id, team_naam: team_naam.trim() })
    .select()
    .single();

  if (teamError) {
    const message = teamError.code === "23505" ? "Er bestaat al een team met deze naam." : teamError.message;
    return NextResponse.json({ error: message }, { status: teamError.code === "23505" ? 409 : 500 });
  }

  return NextResponse.json({ team });
}
