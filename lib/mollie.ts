import createMollieClient, { type MollieClient } from "@mollie/api-client";

export { ROLLOVER_DREMPEL_EURO, MANDAAT_VERIFICATIE_BEDRAG_EURO } from "@/lib/mollieConstants";

let client: MollieClient | null = null;

/**
 * Lazy singleton — pas een `MOLLIE_API_KEY` opeisen op het moment dat een
 * route hem daadwerkelijk nodig heeft, niet bij module-load (anders
 * crasht elke build/lokale run zonder de key, ook op routes die geen
 * Mollie gebruiken).
 */
export function mollieClient(): MollieClient {
  if (client) return client;

  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "MOLLIE_API_KEY ontbreekt. Zet deze in je omgevingsvariabelen (zie .env.example) — zonder geldige Mollie API-key kan er geen automatische incasso worden opgezet of geïnd."
    );
  }

  client = createMollieClient({ apiKey });
  return client;
}

/** Basis-URL van de app, nodig voor Mollie's redirectUrl/webhookUrl. Vereist in productie. */
export function siteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL ontbreekt. Mollie heeft een publiek bereikbare redirect- en webhook-URL nodig (zie .env.example)."
    );
  }
  return url.replace(/\/$/, "");
}

/** Metadata die op elke Mollie-betaling wordt gezet — de webhook vertrouwt hier bewust NIET blindelings op, maar gebruikt het als lookup-hint (zie /api/mollie/webhook). */
export type MolliePaymentMetadata =
  | { type: "mandaat_verificatie"; club_id: string }
  | { type: "platform_incasso"; club_id: string; incasso_id: string };

/** `payment.metadata` komt terug als `unknown` — hier veilig terugvertalen naar onze eigen vorm i.p.v. blind te casten. */
export function parseMolliePaymentMetadata(raw: unknown): MolliePaymentMetadata | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  if (obj.type === "mandaat_verificatie" && typeof obj.club_id === "string") {
    return { type: "mandaat_verificatie", club_id: obj.club_id };
  }
  if (obj.type === "platform_incasso" && typeof obj.club_id === "string" && typeof obj.incasso_id === "string") {
    return { type: "platform_incasso", club_id: obj.club_id, incasso_id: obj.incasso_id };
  }
  return null;
}
