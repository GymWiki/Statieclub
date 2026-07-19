import Stripe from "stripe";

let client: Stripe | null = null;

/**
 * Lazy singleton — pas een `STRIPE_SECRET_KEY` opeisen op het moment
 * dat een route hem daadwerkelijk nodig heeft, niet bij module-load
 * (anders crasht elke build/lokale run zonder de key, ook op routes
 * die geen Stripe gebruiken).
 */
export function stripeClient(): Stripe {
  if (client) return client;

  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error(
      "STRIPE_SECRET_KEY ontbreekt. Zet deze in je omgevingsvariabelen (zie .env.example) — zonder geldige Stripe API-key kan er geen Connect-account of Checkout-sessie worden aangemaakt."
    );
  }

  client = new Stripe(apiKey);
  return client;
}

/** Basis-URL van de app, nodig voor Stripe's success/cancel/return-URLs. Vereist in productie. */
export function siteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL;
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL ontbreekt. Stripe heeft publiek bereikbare redirect-URL's nodig (zie .env.example)."
    );
  }
  return url.replace(/\/$/, "");
}
