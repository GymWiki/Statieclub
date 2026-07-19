import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { stripeClient, siteUrl } from "@/lib/stripe";
import { PLATFORM_FEE_PERCENTAGE } from "@/lib/utils";

/**
 * GET /api/checkout/[betaalverzoek_id]
 * Dynamische, on-the-fly Checkout-sessie voor een automatisch
 * gegenereerd betaalverzoek (zie lib/actieAfronden.ts) — bedoeld om
 * rechtstreeks aan te klikken (vanuit de in-app banner of een
 * WhatsApp-bericht), vandaar een GET die meteen doorstuurt naar
 * Stripe i.p.v. JSON terug te geven.
 *
 * Zelfde "destination charge"-opzet als de andere Stripe-routes: geen
 * `on_behalf_of`, dus Stripe's eigen (vaste) verwerkingskosten komen
 * automatisch ten laste van de club (de bestemmingsrekening), niet van
 * Statieclub — enkel de 5%-`application_fee_amount` gaat naar het
 * platform, berekend over het volledige (bruto) betaalverzoek-bedrag.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ betaalverzoek_id: string }> }) {
  const { betaalverzoek_id: betaalverzoekId } = await params;

  const service = createServiceRoleClient();
  const { data: betaalverzoek } = await service
    .from("betaalverzoeken")
    .select("id, club_id, bedrag, status")
    .eq("id", betaalverzoekId)
    .maybeSingle();

  if (!betaalverzoek) {
    return new NextResponse("Betaalverzoek niet gevonden.", { status: 404 });
  }

  let basisUrl: string;
  try {
    basisUrl = siteUrl();
  } catch (err) {
    return new NextResponse(err instanceof Error ? err.message : "Niet geconfigureerd.", { status: 500 });
  }

  const { data: club } = await service
    .from("clubs")
    .select("id, naam, slug, stripe_account_id, onboarding_complete")
    .eq("id", betaalverzoek.club_id)
    .maybeSingle();

  if (!club) {
    return new NextResponse("Club niet gevonden.", { status: 404 });
  }

  if (betaalverzoek.status === "betaald") {
    return NextResponse.redirect(`${basisUrl}/club/${club.slug}/portemonnee?betaling=al_voldaan`);
  }

  if (!club.stripe_account_id || !club.onboarding_complete) {
    return new NextResponse("Deze club kan momenteel geen betalingen ontvangen.", { status: 400 });
  }

  try {
    const stripe = stripeClient();
    const bedragInCenten = Math.round(Number(betaalverzoek.bedrag) * 100);
    const applicationFeeInCenten = Math.round(bedragInCenten * (PLATFORM_FEE_PERCENTAGE / 100));

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["ideal", "card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: bedragInCenten,
            product_data: {
              name: `Statiegeld afrekenen — ${club.naam}`,
            },
          },
        },
      ],
      payment_intent_data: {
        application_fee_amount: applicationFeeInCenten,
        transfer_data: { destination: club.stripe_account_id },
        description: `Betaalverzoek — ${club.naam}`,
      },
      metadata: {
        type: "betaalverzoek",
        betaalverzoek_id: betaalverzoek.id,
      },
      success_url: `${basisUrl}/club/${club.slug}/portemonnee?betaling=gelukt`,
      cancel_url: `${basisUrl}/club/${club.slug}/portemonnee?betaling=geannuleerd`,
    });

    if (!session.url) {
      return new NextResponse("Stripe gaf geen checkout-URL terug.", { status: 502 });
    }

    return NextResponse.redirect(session.url);
  } catch (err) {
    return new NextResponse(
      err instanceof Error ? err.message : "Kon de betaling niet starten.",
      { status: 500 }
    );
  }
}
