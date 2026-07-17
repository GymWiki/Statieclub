import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * POST /api/spelers
 * Upsert van een speler op basis van de client-gegenereerde id (zie
 * lib/playerIdentity.ts). Wordt aangeroepen zodra iemand een team +
 * naam kiest, en opnieuw bij elke teamwissel. `avatar_emoji` zit hier
 * bewust NIET in de payload: door die kolom weg te laten uit de
 * upsert blijft een al gekozen avatar bij een latere sync onaangetast
 * (hij krijgt alleen de kolomdefault '🙂' bij de allereerste insert).
 */
export async function POST(request: NextRequest) {
  const { id, club_id, team_id, naam } = await request.json();

  if (!id || !club_id || !naam) {
    return NextResponse.json({ error: "id, club_id en naam zijn verplicht." }, { status: 400 });
  }

  const service = createServiceRoleClient();

  const { data: speler, error } = await service
    .from("spelers")
    .upsert(
      { id, club_id, team_id: team_id ?? null, naam },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (error || !speler) {
    return NextResponse.json({ error: error?.message ?? "Kon speler niet opslaan." }, { status: 500 });
  }

  return NextResponse.json({ speler });
}
