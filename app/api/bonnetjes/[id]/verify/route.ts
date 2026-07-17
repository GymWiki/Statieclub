import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { berekenPunten } from "@/lib/utils";
import { evaluateBadges } from "@/lib/badges";

type Actie = "goedkeuren" | "afkeuren" | "overschrijven";

/**
 * PATCH /api/bonnetjes/[id]/verify
 * Verificatie-workflow voor de penningmeester op een geflagd bonnetje
 * (status 'in_afwachting_controle'):
 * - "goedkeuren": bevestigt het gescande bedrag, punten gaan alsnog
 *   naar het team (via de `apply_bonnetje_status_change`-trigger).
 * - "afkeuren": het bonnetje telt nooit mee.
 * - "overschrijven": de penningmeester corrigeert het bedrag op basis
 *   van de foto; het gecorrigeerde bedrag wordt direct goedgekeurd en
 *   de bijbehorende punten toegekend.
 *
 * Alleen bereikbaar voor een ingelogde gebruiker die penningmeester/
 * bestuurslid is van de club waar dit bonnetje bij hoort — geverifieerd
 * via de sessie-cookies (anon-key + RLS op club_admins), niet enkel via
 * de open service-role.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { actie, nieuwBedrag } = (await request.json()) as { actie: Actie; nieuwBedrag?: number };

  if (actie !== "goedkeuren" && actie !== "afkeuren" && actie !== "overschrijven") {
    return NextResponse.json(
      { error: "actie moet 'goedkeuren', 'afkeuren' of 'overschrijven' zijn." },
      { status: 400 }
    );
  }
  if (actie === "overschrijven" && (!Number.isFinite(nieuwBedrag) || (nieuwBedrag as number) <= 0)) {
    return NextResponse.json({ error: "nieuwBedrag moet een positief getal zijn." }, { status: 400 });
  }

  const authedSupabase = await createClient();
  const {
    data: { user },
  } = await authedSupabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  }

  const service = createServiceRoleClient();

  const { data: bonnetje, error: bonnetjeError } = await service
    .from("bonnetjes")
    .select("id, status, team_id, speler_id, teams(club_id)")
    .eq("id", id)
    .single();

  if (bonnetjeError || !bonnetje) {
    return NextResponse.json({ error: "Bonnetje niet gevonden." }, { status: 404 });
  }

  const clubId = (bonnetje as unknown as { teams: { club_id: string } }).teams.club_id;

  const { data: admin } = await authedSupabase
    .from("club_admins")
    .select("id")
    .eq("club_id", clubId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) {
    return NextResponse.json({ error: "Geen toegang tot deze club." }, { status: 403 });
  }
  if (bonnetje.status !== "in_afwachting_controle") {
    return NextResponse.json(
      { error: `Bonnetje heeft al status '${bonnetje.status}'.` },
      { status: 409 }
    );
  }

  const updateData: Record<string, unknown> = { geverifieerd_door: user.email };
  if (actie === "goedkeuren") {
    updateData.status = "goedgekeurd";
  } else if (actie === "afkeuren") {
    updateData.status = "afgekeurd";
  } else {
    updateData.status = "goedgekeurd";
    updateData.bedrag_euro = nieuwBedrag;
    updateData.punten = berekenPunten(nieuwBedrag as number);
  }

  const { data: updated, error: updateError } = await service
    .from("bonnetjes")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (updateError || !updated) {
    return NextResponse.json(
      { error: updateError?.message ?? "Kon bonnetje niet bijwerken." },
      { status: 500 }
    );
  }

  const nieuweBadges =
    updated.status === "goedgekeurd" && updated.speler_id
      ? await evaluateBadges(updated.speler_id, updated.bedrag_euro)
      : [];

  return NextResponse.json({ bonnetje: updated, nieuweBadges });
}
