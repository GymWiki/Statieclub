import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/clubs/join
 * Koppelt de ingelogde gebruiker als (extra) beheerder aan een
 * bestaande club via diens uitnodigingscode (migratie 0019) — het
 * "bestaande club selecteren"-pad naast "nieuwe club toevoegen" in de
 * lege staat van /admin. Roept de security-definer RPC
 * `voeg_beheerder_toe_via_code` aan (anon/authenticated-key volstaat:
 * club_admins zelf heeft geen insert-policy, dus zonder deze RPC zou
 * dit sowieso mislukken).
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
  const code = body.code?.trim();

  if (!code) {
    return NextResponse.json({ error: "Vul een uitnodigingscode in." }, { status: 400 });
  }

  const { data: club, error } = await supabase
    .rpc("voeg_beheerder_toe_via_code", { p_code: code })
    .single();

  if (error || !club) {
    return NextResponse.json({ error: error?.message ?? "Ongeldige uitnodigingscode." }, { status: 400 });
  }

  return NextResponse.json({ club });
}
