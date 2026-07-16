import { ShieldOff } from "lucide-react";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { vereisClubToegang } from "@/lib/adminAuth";
import { TeamsBeheer } from "@/components/admin/TeamsBeheer";
import type { Team } from "@/lib/types";

export default async function AdminCampagneBeheerPage({ params }: { params: Promise<{ slug: string }> }) {
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
  const { data: teams } = await service.from("teams").select("*").eq("club_id", club.id).order("team_naam");

  return <TeamsBeheer clubSlug={club.slug} clubNaam={club.naam} initialTeams={(teams as Team[]) ?? []} />;
}
