import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * GET /api/betaalverzoeken?speler_id=... | ?doel_id=...
 * - `speler_id` (met optioneel `status`): voor de in-app banner van
 *   een clublid — "heb ik een openstaand betaalverzoek?".
 * - `doel_id`: voor het admin-dashboard — alle betaalverzoeken die bij
 *   het afronden van een specifieke actie zijn gegenereerd, met de
 *   spelernaam erbij voor de "Deel via WhatsApp"-lijst.
 * `betaalverzoeken` heeft bewust geen publieke RLS-policy (zelfde
 * model als bonnetjes/statiegeld_inleveringen), dus dit endpoint is de
 * enige manier om ze te lezen.
 */
export async function GET(request: NextRequest) {
  const spelerId = request.nextUrl.searchParams.get("speler_id");
  const doelId = request.nextUrl.searchParams.get("doel_id");
  const status = request.nextUrl.searchParams.get("status");

  if (!spelerId && !doelId) {
    return NextResponse.json({ error: "speler_id of doel_id is verplicht." }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  let query = supabase
    .from("betaalverzoeken")
    .select("*, spelers(naam), doelen(titel)")
    .order("created_at", { ascending: false });

  if (spelerId) query = query.eq("speler_id", spelerId);
  if (doelId) query = query.eq("doel_id", doelId);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ betaalverzoeken: data ?? [] });
}
