import { ShieldOff } from "lucide-react";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { vereisClubToegang } from "@/lib/adminAuth";
import { SaldoOverzicht } from "@/components/admin/SaldoOverzicht";
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

  return <SaldoOverzicht club={club} initialTeams={(teams as Team[]) ?? []} initialDoelen={doelenMetTeams} />;
}
