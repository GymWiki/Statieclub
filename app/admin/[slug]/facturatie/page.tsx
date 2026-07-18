import { ShieldOff } from "lucide-react";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { vereisClubToegang } from "@/lib/adminAuth";
import { FacturatieOverzicht } from "@/components/admin/FacturatieOverzicht";
import type { PlatformIncasso } from "@/lib/types";

export default async function AdminFacturatiePage({ params }: { params: Promise<{ slug: string }> }) {
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

  const nu = new Date();
  const maandStart = new Date(Date.UTC(nu.getUTCFullYear(), nu.getUTCMonth(), 1)).toISOString();
  const maandEind = new Date(Date.UTC(nu.getUTCFullYear(), nu.getUTCMonth() + 1, 1)).toISOString();

  const { data: teams } = await service.from("teams").select("id").eq("club_id", club.id);
  const teamIds = (teams ?? []).map((team) => team.id as string);

  let dezeMaandOpgehaald = 0;
  if (teamIds.length > 0) {
    const { data: bonnetjes } = await service
      .from("bonnetjes")
      .select("bedrag_euro")
      .in("team_id", teamIds)
      .eq("status", "goedgekeurd")
      .gte("geverifieerd_op", maandStart)
      .lt("geverifieerd_op", maandEind);

    dezeMaandOpgehaald = (bonnetjes ?? []).reduce((som, b) => som + Number(b.bedrag_euro), 0);
  }

  const { data: incassos } = await service
    .from("platform_incassos")
    .select("*")
    .eq("club_id", club.id)
    .order("jaar", { ascending: false })
    .order("maand", { ascending: false });

  return (
    <FacturatieOverzicht
      club={club}
      initialDezeMaandOpgehaald={dezeMaandOpgehaald}
      initialIncassos={(incassos as PlatformIncasso[]) ?? []}
    />
  );
}
