import { ShieldOff } from "lucide-react";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { vereisClubToegang } from "@/lib/adminAuth";
import { SaldoOverzicht } from "@/components/admin/SaldoOverzicht";
import { CampagneAfronden } from "@/components/admin/CampagneAfronden";
import { PlatformFactuur } from "@/components/admin/PlatformFactuur";
import type { Doel, DoelMetTeams, Team } from "@/lib/types";

export default async function AdminDashboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { club, heeftToegang } = await vereisClubToegang(slug);

  if (!heeftToegang) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center text-gray-600">
        <ShieldOff className="h-10 w-10 text-gray-400" />
        <p>Je account heeft geen beheerderstoegang tot {club.naam}.</p>
      </div>
    );
  }

  const service = createServiceRoleClient();

  const { data: teams } = await service.from("teams").select("*").eq("club_id", club.id);
  const { data: doelen } = await service.from("doelen").select("*").eq("club_id", club.id);

  const doelIds = ((doelen as Doel[]) ?? []).map((d) => d.id);
  const { data: doelTeamKoppelingen } =
    doelIds.length > 0
      ? await service.from("doel_teams").select("doel_id, team_id").in("doel_id", doelIds)
      : { data: [] };

  const doelenMetTeams: DoelMetTeams[] = ((doelen as Doel[]) ?? []).map((doel) => ({
    ...doel,
    team_ids: (doelTeamKoppelingen ?? []).filter((k) => k.doel_id === doel.id).map((k) => k.team_id),
  }));

  const { data: facturen } = await service
    .from("facturen")
    .select("*")
    .eq("club_id", club.id)
    .order("periode_eind", { ascending: false });

  const laatsteFactuur = facturen?.[0];
  const periodeStart = laatsteFactuur?.periode_eind ?? club.created_at;

  // 'glas_naar_kas'-donaties tellen hier gewoon mee — die service valt
  // onder dezelfde 5%-platformfee als een gewone statiegeld-scan, dus
  // dit "openstaand"-bedrag moet exact overeenkomen met wat straks
  // daadwerkelijk gefactureerd wordt.
  const { data: openBonnetjes } = await service
    .from("bonnetjes")
    .select("bedrag_euro, teams!inner(club_id)")
    .eq("status", "goedgekeurd")
    .eq("teams.club_id", club.id)
    .gt("geverifieerd_op", periodeStart);

  const huidigePeriodeTotaal = ((openBonnetjes ?? []) as any[]).reduce(
    (som, b) => som + Number(b.bedrag_euro),
    0
  );

  return (
    <>
      <SaldoOverzicht club={club} initialTeams={(teams as Team[]) ?? []} initialDoelen={doelenMetTeams} />
      <CampagneAfronden clubNaam={club.naam} teams={(teams as Team[]) ?? []} />
      <PlatformFactuur
        clubSlug={club.slug}
        initialFacturen={facturen ?? []}
        initialPeriodeStart={periodeStart}
        initialTotaal={huidigePeriodeTotaal}
      />
    </>
  );
}
