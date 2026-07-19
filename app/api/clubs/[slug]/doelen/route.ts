import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

/**
 * POST /api/clubs/[slug]/doelen
 * Voegt een nieuw spaardoel toe aan een club. Een club kan er 0, 1 of
 * meerdere hebben — het aanmaken van de club zelf vraagt hier bewust
 * niet meer om. Alleen beschikbaar voor een beheerder van deze club
 * (club_admins); het schrijven zelf loopt via de service-role.
 *
 * `team_ids` (optioneel) beperkt welke teams dit doel mogen steunen —
 * zie migratie 0012. Leeg of weggelaten: open voor alle teams van de
 * club, zodat twee acties naast elkaar kunnen lopen voor
 * verschillende teams zonder dat de standaardflow (één doel, alle
 * teams) iets verandert.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { titel, doelbedrag, team_ids, end_date: endDate } = await request.json();

  const doelbedragGetal = Number(doelbedrag);
  if (!titel || typeof titel !== "string" || !titel.trim()) {
    return NextResponse.json({ error: "Titel is verplicht." }, { status: 400 });
  }
  if (!Number.isFinite(doelbedragGetal) || doelbedragGetal <= 0) {
    return NextResponse.json({ error: "Doelbedrag moet een positief getal zijn." }, { status: 400 });
  }
  if (endDate && Number.isNaN(new Date(endDate).getTime())) {
    return NextResponse.json({ error: "Ongeldige einddatum." }, { status: 400 });
  }
  const gevraagdeTeamIds = Array.isArray(team_ids)
    ? team_ids.filter((t): t is string => typeof t === "string")
    : [];

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

  const { data: doel, error: doelError } = await service
    .from("doelen")
    .insert({ club_id: club.id, titel: titel.trim(), doelbedrag: doelbedragGetal, end_date: endDate || null })
    .select()
    .single();

  if (doelError || !doel) {
    return NextResponse.json({ error: doelError?.message ?? "Kon doel niet aanmaken." }, { status: 500 });
  }

  // Alleen team_ids die daadwerkelijk bij deze club horen koppelen —
  // voorkomt dat een gemanipuleerd request een team van een andere
  // club aan dit doel hangt.
  let teamIds: string[] = [];
  if (gevraagdeTeamIds.length > 0) {
    const { data: geldigeTeams } = await service
      .from("teams")
      .select("id")
      .eq("club_id", club.id)
      .in("id", gevraagdeTeamIds);
    teamIds = (geldigeTeams ?? []).map((t) => t.id);
    if (teamIds.length > 0) {
      await service.from("doel_teams").insert(teamIds.map((team_id) => ({ doel_id: doel.id, team_id })));
    }
  }

  return NextResponse.json({ doel: { ...doel, team_ids: teamIds } });
}
