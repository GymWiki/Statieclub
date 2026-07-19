import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * GET /api/stripe/checkout-session-status?session_id=...
 * De "bedankt"-pagina kent na de Stripe-redirect alleen de
 * checkout-session-id, nog geen `ophaalverzoekId` — die rij ontstaat
 * pas zodra het `checkout.session.completed`-webhook-event is verwerkt
 * (meestal binnen enkele seconden, maar niet gegarandeerd vóór de
 * browser-redirect terug is). Deze route wordt daarom kort gepolld
 * totdat de rij bestaat.
 */
export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json({ error: "session_id is verplicht." }, { status: 400 });
  }

  const service = createServiceRoleClient();
  const { data: verzoek } = await service
    .from("ophaalverzoeken")
    .select("id")
    .eq("stripe_checkout_session_id", sessionId)
    .maybeSingle();

  return NextResponse.json({ ophaalverzoekId: verzoek?.id ?? null });
}
