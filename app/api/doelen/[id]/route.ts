import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

/**
 * PATCH /api/doelen/[id]
 * Werkt een doel bij: `is_actief` (campagne sluiten/heropenen),
 * `team_ids` (welke teams dit doel mogen steunen — weggelaten of leeg
 * betekent open voor alle teams van de club, zie migratie 0012) en/of
 * `end_date` (wanneer de dagelijkse cron dit doel automatisch moet
 * afronden, zie migratie 0017). Minstens één veld moet aanwezig zijn.
 * Alleen voor een beheerder van de club waar dit doel bij hoort.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { is_actief, team_ids, end_date: endDate } = await request.json();

  const wilIsActiefWijzigen = typeof is_actief === "boolean";
  const wilTeamsWijzigen = Array.isArray(team_ids);
  const wilEindDatumWijzigen = endDate !== undefined;
  if (!wilIsActiefWijzigen && !wilTeamsWijzigen && !wilEindDatumWijzigen) {
    return NextResponse.json({ error: "is_actief, team_ids of end_date is verplicht." }, { status: 400 });
  }
  if (wilEindDatumWijzigen && endDate !== null && Number.isNaN(new Date(endDate).getTime())) {
    return NextResponse.json({ error: "Ongeldige einddatum." }, { status: 400 });
  }

  const authedSupabase = await createClient();
  const {
    data: { user },
  } = await authedSupabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  }

  const service = createServiceRoleClient();

  const { data: doel, error: doelError } = await service.from("doelen").select("id, club_id").eq("id", id).single();

  if (doelError || !doel) {
    return NextResponse.json({ error: "Doel niet gevonden." }, { status: 404 });
  }

  const { data: admin } = await authedSupabase
    .from("club_admins")
    .select("id")
    .eq("club_id", doel.club_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) {
    return NextResponse.json({ error: "Geen toegang tot deze club." }, { status: 403 });
  }

  if (wilIsActiefWijzigen) {
    const { error: updateError } = await service.from("doelen").update({ is_actief }).eq("id", id);
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  if (wilEindDatumWijzigen) {
    const { error: eindDatumError } = await service.from("doelen").update({ end_date: endDate }).eq("id", id);
    if (eindDatumError) {
      return NextResponse.json({ error: eindDatumError.message }, { status: 500 });
    }
  }

  if (wilTeamsWijzigen) {
    const gevraagdeTeamIds = (team_ids as unknown[]).filter((t): t is string => typeof t === "string");

    // Zelfde bescherming als bij het aanmaken: alleen team_ids die
    // daadwerkelijk bij deze club horen worden gekoppeld.
    const geldigeTeamIds =
      gevraagdeTeamIds.length === 0
        ? []
        : ((
            await service.from("teams").select("id").eq("club_id", doel.club_id).in("id", gevraagdeTeamIds)
          ).data ?? []
          ).map((t) => t.id);

    await service.from("doel_teams").delete().eq("doel_id", id);
    if (geldigeTeamIds.length > 0) {
      await service.from("doel_teams").insert(geldigeTeamIds.map((team_id) => ({ doel_id: id, team_id })));
    }
  }

  const [{ data: bijgewerkt, error: haalError }, { data: koppelingen }] = await Promise.all([
    service.from("doelen").select("*").eq("id", id).single(),
    service.from("doel_teams").select("team_id").eq("doel_id", id),
  ]);

  if (haalError || !bijgewerkt) {
    return NextResponse.json({ error: haalError?.message ?? "Kon doel niet ophalen." }, { status: 500 });
  }

  return NextResponse.json({
    doel: { ...bijgewerkt, team_ids: (koppelingen ?? []).map((k) => k.team_id) },
  });
}
