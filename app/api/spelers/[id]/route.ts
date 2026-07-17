import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * PATCH /api/spelers/[id]
 * Uitsluitend voor het wijzigen van de avatar-emoji vanaf het Profiel.
 * Geen auth-check nodig (zelfde vertrouwensmodel als de rest van het
 * team-gedeelte: de speler-id is een lokaal, niet-geheim apparaat-ID).
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { avatar_emoji } = await request.json();

  if (!avatar_emoji || typeof avatar_emoji !== "string") {
    return NextResponse.json({ error: "avatar_emoji is verplicht." }, { status: 400 });
  }

  const service = createServiceRoleClient();

  const { data: speler, error } = await service
    .from("spelers")
    .update({ avatar_emoji })
    .eq("id", id)
    .select()
    .single();

  if (error || !speler) {
    return NextResponse.json({ error: error?.message ?? "Kon avatar niet bijwerken." }, { status: 500 });
  }

  return NextResponse.json({ speler });
}
