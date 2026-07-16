import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

/**
 * PATCH /api/doelen/[id]
 * Zet een doel actief/inactief (campagne afronden of heropenen). Alleen
 * voor een beheerder van de club waar dit doel bij hoort.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { is_actief } = await request.json();

  if (typeof is_actief !== "boolean") {
    return NextResponse.json({ error: "is_actief moet een boolean zijn." }, { status: 400 });
  }

  const authedSupabase = await createClient();
  const {
    data: { user },
  } = await authedSupabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  }

  const service = createServiceRoleClient();

  const { data: doel, error: doelError } = await service.from("doelen").select("id, club_id").eq("id", id).single();

  if (doelError || !doel) {
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

  const { data: bijgewerkt, error: updateError } = await service
    .from("doelen")
    .update({ is_actief })
    .eq("id", id)
    .select()
    .single();

  if (updateError || !bijgewerkt) {
    return NextResponse.json({ error: updateError?.message ?? "Kon doel niet bijwerken." }, { status: 500 });
  }

  return NextResponse.json({ doel: bijgewerkt });
}
