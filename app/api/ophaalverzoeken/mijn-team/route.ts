import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * GET /api/ophaalverzoeken/mijn-team?team_id=...
 * Lijst van adressen die dit team heeft geclaimd maar nog niet heeft
 * ingeleverd — met het volledige adres, want claimen = het recht
 * krijgen om dat adres te zien en te bezoeken.
 */
export async function GET(request: NextRequest) {
  const teamId = request.nextUrl.searchParams.get("team_id");
  if (!teamId) {
    return NextResponse.json({ error: "team_id is verplicht." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("ophaalverzoeken")
    .select("*, donateurs(naam, adres, postcode, telefoonnummer)")
    .eq("geclaimd_door_team_id", teamId)
    .eq("status", "geclaimd")
    .order("geclaimd_op", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ophaalverzoeken: data ?? [] });
}
