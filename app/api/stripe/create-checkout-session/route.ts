import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { stripeClient, siteUrl } from "@/lib/stripe";
import { GLAS_NAAR_KAS_MINIMUM_EURO, normaliseerPostcode, PLATFORM_FEE_PERCENTAGE, TRANSACTIEKOSTEN_EURO } from "@/lib/utils";
import type { DonationCheckoutInput, StripeCheckoutInput } from "@/lib/types";

/**
 * POST /api/stripe/create-checkout-session
 * Eén scenario: 'donation', een Glas-naar-Kas-donatie van een anonieme
 * donateur. Een "destination charge": het bedrag min de 5%-platformfee
 * (`application_fee_amount`) wordt automatisch doorgestort naar het
 * Stripe Express-account van de club
 * (`payment_intent_data.transfer_data.destination`). Er wordt bewust
 * pas ná bevestigde betaling iets in Supabase weggeschreven (zie
 * /api/stripe/webhook) — nooit vooraf en nooit client-side.
 *
 * Een clublid kan hier NIET zelf tussentijds zijn Virtuele-Portemonnee-
 * saldo afrekenen (migratie 0018/Punt 4 — die 'wallet_payout'-flow is
 * verwijderd) — betalen kan uitsluitend via een betaalverzoek, ná het
 * sluiten van een actie: zie GET /api/checkout/[betaalverzoek_id].
 */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as StripeCheckoutInput;

  if (body.type === "donation") {
    return handleDonation(body);
  }

  return NextResponse.json({ error: "Onbekend betaaltype." }, { status: 400 });
}

async function handleDonation(body: DonationCheckoutInput) {
  const naam = body.naam?.trim();
  const email = body.email?.trim().toLowerCase();
  const adres = body.adres?.trim();
  const postcode = body.postcode ? normaliseerPostcode(body.postcode) : "";
  const clubId = body.club_id;
  const doelId = body.doel_id;
  const bedrag = Math.round(Number(body.bedrag) * 100) / 100;
  const coversFee = body.coversFee === true;

  if (!naam || !email || !adres || !postcode || !clubId || !doelId) {
    return NextResponse.json({ error: "Vul alle verplichte velden correct in." }, { status: 400 });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Ongeldig e-mailadres." }, { status: 400 });
  }
  if (!Number.isFinite(bedrag) || bedrag < GLAS_NAAR_KAS_MINIMUM_EURO) {
    return NextResponse.json(
      { error: `Kies een donatiebedrag van minimaal €${GLAS_NAAR_KAS_MINIMUM_EURO}.` },
      { status: 400 }
    );
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

  // In centen rekenen (integers) i.p.v. met floats — voorkomt
  // afrondingsverschillen tussen wat de donateur ziet en wat Stripe
  // daadwerkelijk in rekening brengt.
  const bedragInCenten = Math.round(bedrag * 100);
  const transactiekostenInCenten = coversFee ? Math.round(TRANSACTIEKOSTEN_EURO * 100) : 0;
  const teBetalenInCenten = bedragInCenten + transactiekostenInCenten;
  // De 5%-fee wordt bewust berekend over het oorspronkelijke
  // donatiebedrag, NIET over de eventuele transactiekosten-surcharge.
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
            unit_amount: teBetalenInCenten,
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
        type: "donation",
        club_id: club.id,
        doel_id: doelId,
        naam,
        email,
        adres,
        postcode,
        telefoonnummer: body.telefoonnummer?.trim() || "",
        opmerking: body.opmerking?.trim() || "",
        donatie_bedrag: bedrag.toFixed(2),
        covers_fee: coversFee ? "true" : "false",
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
