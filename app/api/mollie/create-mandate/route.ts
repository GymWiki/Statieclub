import { NextRequest, NextResponse } from "next/server";
import { PaymentMethod, SequenceType } from "@mollie/api-client";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { mollieClient, siteUrl, MANDAAT_VERIFICATIE_BEDRAG_EURO, type MolliePaymentMetadata } from "@/lib/mollie";

/**
 * POST /api/mollie/create-mandate
 * Start de "Activeer Automatische Incasso"-flow: maakt (indien nog
 * niet aanwezig) een Mollie-klant aan voor de club, en daarna een
 * eenmalige verificatiebetaling van €0,01 via iDeal met
 * `sequenceType: 'first'` — zodra de bewoner die betaalt, zet Mollie
 * daar automatisch een geldig SEPA-mandaat bij op. De browser moet
 * daarna doorgestuurd worden naar `checkoutUrl`; de daadwerkelijke
 * bevestiging van het mandaat gebeurt in `/api/mollie/webhook`, nooit
 * hier (Mollie's payment-aanmaak zelf zegt niets over of de betaling
 * ook echt lukt).
 */
export async function POST(request: NextRequest) {
  const { club_id: clubId } = await request.json();

  if (!clubId) {
    return NextResponse.json({ error: "club_id is verplicht." }, { status: 400 });
  }

  const authedSupabase = await createClient();
  const {
    data: { user },
  } = await authedSupabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  }

  const service = createServiceRoleClient();
  const { data: club, error: clubError } = await service
    .from("clubs")
    .select("id, naam, slug, mollie_customer_id")
    .eq("id", clubId)
    .single();

  if (clubError || !club) {
    return NextResponse.json({ error: "Club niet gevonden." }, { status: 404 });
  }

  const { data: admin } = await authedSupabase
    .from("club_admins")
    .select("id")
    .eq("club_id", clubId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) {
    return NextResponse.json({ error: "Geen toegang tot deze club." }, { status: 403 });
  }

  let mollie;
  let basisUrl: string;
  try {
    mollie = mollieClient();
    basisUrl = siteUrl();
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Mollie is niet geconfigureerd." },
      { status: 500 }
    );
  }

  try {
    let customerId = club.mollie_customer_id;
    if (!customerId) {
      const customer = await mollie.customers.create({
        name: club.naam,
        email: user.email ?? undefined,
      });
      customerId = customer.id;
      await service.from("clubs").update({ mollie_customer_id: customerId }).eq("id", club.id);
    }

    const metadata: MolliePaymentMetadata = { type: "mandaat_verificatie", club_id: club.id };

    const payment = await mollie.payments.create({
      amount: { currency: "EUR", value: MANDAAT_VERIFICATIE_BEDRAG_EURO.toFixed(2) },
      description: `Statieclub — verificatie automatische incasso (${club.naam})`,
      redirectUrl: `${basisUrl}/admin/${club.slug}/facturatie?mandaat=verwerkt`,
      webhookUrl: `${basisUrl}/api/mollie/webhook`,
      sequenceType: SequenceType.first,
      method: PaymentMethod.ideal,
      customerId,
      metadata,
    });

    const checkoutUrl = payment.getCheckoutUrl();
    if (!checkoutUrl) {
      return NextResponse.json({ error: "Mollie gaf geen checkout-URL terug." }, { status: 502 });
    }

    return NextResponse.json({ checkoutUrl });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Kon de Mollie-verificatie niet starten." },
      { status: 500 }
    );
  }
}
