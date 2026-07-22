import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { stripeClient } from "@/lib/stripe";

/**
 * POST /api/stripe/webhook
 * In tegenstelling tot Mollie's "onbetrouwbare ping" stuurt Stripe de
 * volledige, ONDERTEKENDE event-payload mee — na verificatie van die
 * handtekening (`stripe.webhooks.constructEventAsync` met
 * `STRIPE_WEBHOOK_SECRET`) mag de payload zelf wél vertrouwd worden,
 * een aparte re-fetch is niet nodig. Vereist de RAUWE request-body
 * (niet `request.json()`) — de handtekening is berekend over de exacte
 * bytes zoals Stripe ze verstuurde.
 *
 * Luistert naar:
 * - `checkout.session.completed`, gedispatcht op `session.metadata.type`:
 *   - 'donation': maakt de `ophaalverzoeken`-rij voor een betaalde
 *     "Glas-naar-Kas"-donatie aan (bewust pas hier, niet vooraf — zie
 *     create-checkout-session). Idempotent via de unieke
 *     `stripe_checkout_session_id`-kolom op `ophaalverzoeken`.
 *   - 'betaalverzoek': zet het betaalverzoek (uit een afgeronde actie,
 *     zie lib/actieAfronden.ts) op 'betaald' en de bijbehorende
 *     `statiegeld_inleveringen`-rijen (gekoppeld via
 *     `betaalverzoek_id`) op 'paid'.
 * - `account.updated`: zet `clubs.onboarding_complete` zodra Stripe
 *   bevestigt dat het Express-account klaar is om te ontvangen.
 *
 * Een 4xx/5xx hier laat Stripe het event automatisch (tot 3 dagen)
 * blijven herhalen — anders dan bij Mollie is dat hier precies wat je
 * wil bij een tijdelijke fout, want de payload bevat alles wat nodig
 * is om de verwerking alsnog te voltooien.
 */
export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const rawBody = await request.text();

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Webhook niet geconfigureerd." }, { status: 400 });
  }

  // stripeClient() staat BUITEN de handtekening-try/catch: een
  // ontbrekende STRIPE_SECRET_KEY is een configuratiefout, geen
  // ongeldige handtekening — deze twee mogen nooit dezelfde 400
  // "Ongeldige handtekening." teruggeven, anders lijkt een misconfigured
  // deployment een aanval en is de echte oorzaak onvindbaar in de logs.
  let stripe;
  try {
    stripe = stripeClient();
  } catch (err) {
    console.error("[stripe webhook] configuratiefout:", err);
    return NextResponse.json({ error: "Stripe is niet correct geconfigureerd op de server." }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("[stripe webhook] ongeldige handtekening:", err);
    return NextResponse.json({ error: "Ongeldige handtekening." }, { status: 400 });
  }

  const service = createServiceRoleClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status !== "paid") {
      return NextResponse.json({ ontvangen: true });
    }

    if (session.metadata?.type === "betaalverzoek") {
      const betaalverzoekId = session.metadata.betaalverzoek_id;

      // Idempotent via de status='open'-voorwaarde: een herhaalde
      // aflevering vindt de tweede keer niets meer om bij te werken.
      const { data: bijgewerkt, error: betaalverzoekError } = await service
        .from("betaalverzoeken")
        .update({ status: "betaald", stripe_checkout_session_id: session.id })
        .eq("id", betaalverzoekId)
        .eq("status", "open")
        .select("id")
        .maybeSingle();

      if (betaalverzoekError) {
        console.error("[stripe webhook] kon betaalverzoek niet bijwerken:", betaalverzoekError);
        return NextResponse.json({ error: "Kon betaalverzoek niet bijwerken." }, { status: 500 });
      }

      if (bijgewerkt) {
        // Exact de rijen die ván dit betaalverzoek zijn — nooit op
        // status alleen matchen, want een speler kan tegelijk een
        // ander (nog niet betaald) betaalverzoek hebben.
        const { error: inleveringenError } = await service
          .from("statiegeld_inleveringen")
          .update({ status: "paid" })
          .eq("betaalverzoek_id", bijgewerkt.id)
          .eq("status", "processed_for_payment");

        if (inleveringenError) {
          console.error("[stripe webhook] kon inleveringen niet op paid zetten:", inleveringenError);
          return NextResponse.json({ error: "Kon inleveringen niet bijwerken." }, { status: 500 });
        }
      }

      return NextResponse.json({ ontvangen: true });
    }

    const { data: bestaand } = await service
      .from("ophaalverzoeken")
      .select("id")
      .eq("stripe_checkout_session_id", session.id)
      .maybeSingle();

    if (bestaand) {
      return NextResponse.json({ ontvangen: true });
    }

    const metadata = session.metadata ?? {};
    const donatieBedrag = Math.round(Number(metadata.donatie_bedrag) * 100) / 100;

    if (!metadata.club_id || !metadata.doel_id || !metadata.email || !Number.isFinite(donatieBedrag)) {
      console.error("[stripe webhook] onvolledige metadata op sessie:", session.id, metadata);
      return NextResponse.json({ error: "Onvolledige metadata." }, { status: 500 });
    }

    const { data: donateur, error: donateurError } = await service
      .from("donateurs")
      .upsert(
        {
          naam: metadata.naam,
          email: metadata.email,
          adres: metadata.adres,
          postcode: metadata.postcode,
          telefoonnummer: metadata.telefoonnummer || null,
        },
        { onConflict: "email" }
      )
      .select()
      .single();

    if (donateurError || !donateur) {
      console.error("[stripe webhook] kon donateur niet opslaan:", donateurError);
      return NextResponse.json({ error: "Kon donateur niet opslaan." }, { status: 500 });
    }

    const { error: verzoekError } = await service.from("ophaalverzoeken").insert({
      donateur_id: donateur.id,
      club_id: metadata.club_id,
      doel_id: metadata.doel_id,
      type: "glasbak",
      vooraf_betaald: true,
      donatie_bedrag: donatieBedrag,
      aantal_geschat: 1,
      opmerking: metadata.opmerking || null,
      stripe_checkout_session_id: session.id,
    });

    if (verzoekError) {
      console.error("[stripe webhook] kon ophaalverzoek niet aanmaken:", verzoekError);
      return NextResponse.json({ error: "Kon ophaalverzoek niet aanmaken." }, { status: 500 });
    }

    return NextResponse.json({ ontvangen: true });
  }

  if (event.type === "account.updated") {
    const account = event.data.object as Stripe.Account;
    const onboardingCompleet = Boolean(
      account.details_submitted && account.charges_enabled && account.payouts_enabled
    );

    const { error } = await service
      .from("clubs")
      .update({ onboarding_complete: onboardingCompleet })
      .eq("stripe_account_id", account.id);

    if (error) {
      console.error("[stripe webhook] kon club niet bijwerken:", error);
      return NextResponse.json({ error: "Kon club niet bijwerken." }, { status: 500 });
    }

    return NextResponse.json({ ontvangen: true });
  }

  return NextResponse.json({ ontvangen: true });
}
