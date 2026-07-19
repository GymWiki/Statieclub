import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { rondActieAf } from "@/lib/actieAfronden";

/**
 * POST /api/doelen/[id]/afronden
 * De handmatige "Actie nu afronden & Verzoeken genereren"-override
 * voor de penningmeester — draait exact dezelfde aggregatie als de
 * dagelijkse cron (`GET /api/cron/close-acties`), maar op afroep en
 * ongeacht of `end_date` al is gepasseerd.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const authedSupabase = await createClient();
  const {
    data: { user },
  } = await authedSupabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  }

  const service = createServiceRoleClient();
  const { data: doel } = await service.from("doelen").select("id, club_id").eq("id", id).maybeSingle();

  if (!doel) {
    return NextResponse.json({ error: "Doel niet gevonden." }, { status: 404 });
  }

  const { data: admin } = await authedSupabase
    .from("club_admins")
    .select("id")
    .eq("club_id", doel.club_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) {
    return NextResponse.json({ error: "Geen toegang tot deze club." }, { status: 403 });
  }

  try {
    const resultaat = await rondActieAf(id);
    return NextResponse.json(resultaat);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Kon de actie niet afronden." },
      { status: 500 }
    );
  }
}
