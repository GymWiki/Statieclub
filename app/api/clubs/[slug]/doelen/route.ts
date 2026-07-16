import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

/**
 * POST /api/clubs/[slug]/doelen
 * Voegt een nieuw spaardoel toe aan een club. Een club kan er 0, 1 of
 * meerdere hebben — het aanmaken van de club zelf vraagt hier bewust
 * niet meer om. Alleen beschikbaar voor een beheerder van deze club
 * (club_admins); het schrijven zelf loopt via de service-role.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { titel, doelbedrag } = await request.json();

  const doelbedragGetal = Number(doelbedrag);
  if (!titel || typeof titel !== "string" || !titel.trim()) {
    return NextResponse.json({ error: "Titel is verplicht." }, { status: 400 });
  }
  if (!Number.isFinite(doelbedragGetal) || doelbedragGetal <= 0) {
    return NextResponse.json({ error: "Doelbedrag moet een positief getal zijn." }, { status: 400 });
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

  const { data: doel, error: doelError } = await service
    .from("doelen")
    .insert({ club_id: club.id, titel: titel.trim(), doelbedrag: doelbedragGetal })
    .select()
    .single();

  if (doelError || !doel) {
    return NextResponse.json({ error: doelError?.message ?? "Kon doel niet aanmaken." }, { status: 500 });
  }

  return NextResponse.json({ doel });
}
