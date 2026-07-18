import { NextRequest, NextResponse } from "next/server";
import { PaymentStatus } from "@mollie/api-client";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { mollieClient, parseMolliePaymentMetadata } from "@/lib/mollie";

/**
 * POST /api/mollie/webhook
 * Mollie stuurt hier een `application/x-www-form-urlencoded` body met
 * uitsluitend een payment-`id` — nooit de status zelf. Dat is bewust:
 * de webhook-aanroep is een onbetrouwbare "ping", en de enige manier
 * om een betaalstatus te vertrouwen is hem zelf, met je eigen API-key,
 * bij Mollie op te vragen. Deze route doet dus nooit iets op basis van
 * de request-body zelf, alleen op basis van wat `payments.get(id)`
 * teruggeeft.
 *
 * Twee soorten betalingen komen hier binnen (onderscheiden via
 * `payment.metadata`, zie lib/mollie.ts):
 * - `mandaat_verificatie`: de eenmalige €0,01-check. Bij `paid` hangt
 *   Mollie er automatisch een geldig mandaat aan — dat halen we op via
 *   `payment.getMandate()` en zetten we op de club.
 * - `platform_incasso`: de maandelijkse SEPA-incasso vanuit de cron-
 *   job. Werkt de bijbehorende `platform_incassos`-rij bij naar
 *   `paid`/`failed`.
 *
 * Geeft altijd een 2xx terug, ook bij een interne fout — een non-2xx
 * laat Mollie de webhook blijven herhalen, wat bij een permanente fout
 * (bijv. een inmiddels verwijderde incasso-rij) alleen maar ruis
 * oplevert. Fouten worden wél gelogd voor troubleshooting.
 */
export async function POST(request: NextRequest) {
  let paymentId: string | null = null;

  try {
    const formData = await request.formData();
    const idValue = formData.get("id");
    paymentId = typeof idValue === "string" ? idValue : null;
  } catch {
    // val hieronder terug op de "geen id" afhandeling
  }

  if (!paymentId) {
    return NextResponse.json({ error: "Geen payment id in webhook-body." }, { status: 400 });
  }

  try {
    const mollie = mollieClient();
    const payment = await mollie.payments.get(paymentId);
    const metadata = parseMolliePaymentMetadata(payment.metadata);

    if (!metadata) {
      return NextResponse.json({ ontvangen: true });
    }

    const service = createServiceRoleClient();

    if (metadata.type === "mandaat_verificatie" && payment.status === PaymentStatus.paid) {
      const mandate = await payment.getMandate();
      if (mandate && mandate.status === "valid") {
        await service.from("clubs").update({ mollie_mandate_id: mandate.id }).eq("id", metadata.club_id);
      }
    }

    if (metadata.type === "platform_incasso") {
      if (payment.status === PaymentStatus.paid) {
        await service
          .from("platform_incassos")
          .update({ status: "paid", mollie_payment_id: payment.id })
          .eq("id", metadata.incasso_id);
      } else if (
        payment.status === PaymentStatus.failed ||
        payment.status === PaymentStatus.expired ||
        payment.status === PaymentStatus.canceled
      ) {
        await service
          .from("platform_incassos")
          .update({ status: "failed", mollie_payment_id: payment.id })
          .eq("id", metadata.incasso_id);
      }
      // open/pending/authorized: nog geen definitieve uitkomst, wachten op een volgende webhook-aanroep.
    }

    return NextResponse.json({ ontvangen: true });
  } catch (err) {
    console.error("[mollie webhook] kon payment niet verwerken:", paymentId, err);
    return NextResponse.json({ ontvangen: true, fout: true });
  }
}
