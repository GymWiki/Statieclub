import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { stripeClient } from "@/lib/stripe";

/**
 * POST /api/stripe/create-dashboard-link
 * Genereert een eenmalige, kortlevende login-link naar het Stripe
 * Express-dashboard van de club — voor de "Bekijk uitbetalingen in
 * Stripe"-knop. Moet on-demand aangemaakt worden (geen statische URL
 * mogelijk), vandaar een eigen route i.p.v. een vaste link in de UI.
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

  const { data: admin } = await authedSupabase
    .from("club_admins")
    .select("id")
    .eq("club_id", clubId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) {
    return NextResponse.json({ error: "Geen toegang tot deze club." }, { status: 403 });
  }

  const service = createServiceRoleClient();
  const { data: club } = await service
    .from("clubs")
    .select("stripe_account_id")
    .eq("id", clubId)
    .single();

  if (!club?.stripe_account_id) {
    return NextResponse.json({ error: "Deze club heeft nog geen Stripe-account." }, { status: 400 });
  }

  try {
    const stripe = stripeClient();
    const loginLink = await stripe.accounts.createLoginLink(club.stripe_account_id);
    return NextResponse.json({ dashboardUrl: loginLink.url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Kon geen dashboard-link aanmaken." },
      { status: 500 }
    );
  }
}
