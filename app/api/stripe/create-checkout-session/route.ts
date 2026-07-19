import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { stripeClient, siteUrl } from "@/lib/stripe";
import { normaliseerPostcode, PLATFORM_FEE_PERCENTAGE } from "@/lib/utils";
import type { GlasCheckoutInput } from "@/lib/types";

/**
 * POST /api/stripe/create-checkout-session
 * Start een échte betaling voor een "Glas-naar-Kas"-donatie (het enige
 * geldbedrag in deze app dat daadwerkelijk als online betaling door
 * het platform stroomt — fysiek statiegeld doet dat nooit). Maakt een
 * Stripe Checkout Session met iDEAL ingeschakeld, waarbij het bedrag
 * ná aftrek van de 5%-platformfee automatisch wordt doorgestort naar
 * de club (`payment_intent_data.transfer_data.destination`) — een
 * "destination charge".
 *
 * Maakt BEWUST nog geen `ophaalverzoeken`-rij aan: die ontstaat pas in
 * `/api/stripe/webhook` zodra Stripe zelf bevestigt dat er is betaald
 * (`checkout.session.completed`). Vóór die tijd bestaat er dus geen
 * rij die een team zou kunnen claimen voor een donatie die nooit is
 * afgerond.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as GlasCheckoutInput;

  const naam = body.naam?.trim();
  const email = body.email?.trim().toLowerCase();
  const adres = body.adres?.trim();
  const postcode = body.postcode ? normaliseerPostcode(body.postcode) : "";
  const clubId = body.club_id;
  const doelId = body.doel_id;
  const bedrag = Math.round(Number(body.bedrag) * 100) / 100;

  if (!naam || !email || !adres || !postcode || !clubId || !doelId) {
    return NextResponse.json({ error: "Vul alle verplichte velden correct in." }, { status: 400 });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Ongeldig e-mailadres." }, { status: 400 });
  }
  if (!Number.isFinite(bedrag) || bedrag <= 0) {
    return NextResponse.json({ error: "Kies een donatiebedrag." }, { status: 400 });
  }

  const service = createServiceRoleClient();

  const { data: club } = await service
    .from("clubs")
    .select("id, naam, slug, stripe_account_id, onboarding_complete")
    .eq("id", clubId)
    .eq("is_actief", true)
    .maybeSingle();

  if (!club) {
    return NextResponse.json({ error: "Club niet gevonden." }, { status: 404 });
  }
  if (!club.stripe_account_id || !club.onboarding_complete) {
    return NextResponse.json(
      { error: "Deze club heeft de automatische incasso nog niet geactiveerd." },
      { status: 400 }
    );
  }

  const { data: doel } = await service
    .from("doelen")
    .select("id")
    .eq("id", doelId)
    .eq("club_id", clubId)
    .eq("is_actief", true)
    .maybeSingle();

  if (!doel) {
    return NextResponse.json({ error: "Dit doel bestaat niet (meer) of is niet actief." }, { status: 400 });
  }

  let stripe;
  let basisUrl: string;
  try {
    stripe = stripeClient();
    basisUrl = siteUrl();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Stripe is niet geconfigureerd." },
      { status: 500 }
    );
  }

  const bedragInCenten = Math.round(bedrag * 100);
  const applicationFeeInCenten = Math.round(bedragInCenten * (PLATFORM_FEE_PERCENTAGE / 100));

  try {
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
              name: `Glas-naar-Kas donatie aan ${club.naam}`,
            },
          },
        },
      ],
      payment_intent_data: {
        application_fee_amount: applicationFeeInCenten,
        transfer_data: { destination: club.stripe_account_id },
        description: `Glas-naar-Kas — ${club.naam}`,
      },
      metadata: {
        club_id: club.id,
        doel_id: doelId,
        naam,
        email,
        adres,
        postcode,
        telefoonnummer: body.telefoonnummer?.trim() || "",
        opmerking: body.opmerking?.trim() || "",
        donatie_bedrag: bedrag.toFixed(2),
      },
      success_url: `${basisUrl}/donateren/bedankt?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${basisUrl}/clubs/${club.slug}`,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe gaf geen checkout-URL terug." }, { status: 502 });
    }

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Kon de betaling niet starten." },
      { status: 500 }
    );
  }
}
