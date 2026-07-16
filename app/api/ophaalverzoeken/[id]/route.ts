import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * GET /api/ophaalverzoeken/[id]
 * Geeft het volledige adres alleen terug wanneer het verzoek al
 * geclaimd is — vóór het claimen mag een team enkel de geanonimiseerde
 * prikbord-gegevens (postcode-cijfers) zien.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("ophaalverzoeken")
    .select("*, donateurs(naam, adres, postcode, telefoonnummer)")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Verzoek niet gevonden." }, { status: 404 });
  }
  if (data.status === "open") {
    return NextResponse.json(
      { error: "Dit verzoek is nog niet geclaimd — adres nog niet zichtbaar." },
      { status: 403 }
    );
  }

  return NextResponse.json({ ophaalverzoek: data });
}
