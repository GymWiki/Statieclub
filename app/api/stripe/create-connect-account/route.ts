import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { stripeClient, siteUrl } from "@/lib/stripe";

/**
 * POST /api/stripe/create-connect-account
 * Start de "Koppel de club bankrekening"-flow: maakt (indien nog niet
 * aanwezig) een Stripe Express-account aan voor de club, en daarna een
 * Account Link waarmee de penningmeester de Stripe-onboarding
 * doorloopt (bedrijfsgegevens, bankrekening, identiteitsverificatie).
 * `clubs.onboarding_complete` wordt hier NIET gezet — dat gebeurt pas
 * server-side in `/api/stripe/webhook` zodra Stripe zelf via
 * `account.updated` bevestigt dat het account klaar is.
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
    .select("id, naam, slug, stripe_account_id")
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

  try {
    let accountId = club.stripe_account_id;
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "NL",
        email: user.email ?? undefined,
        business_profile: { name: club.naam },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });
      accountId = account.id;
      await service.from("clubs").update({ stripe_account_id: accountId }).eq("id", club.id);
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      refresh_url: `${basisUrl}/admin/${club.slug}/facturatie?stripe_refresh=true`,
      return_url: `${basisUrl}/admin/${club.slug}/facturatie?stripe_return=true`,
    });

    return NextResponse.json({ accountLinkUrl: accountLink.url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Kon de Stripe-koppeling niet starten." },
      { status: 500 }
    );
  }
}
