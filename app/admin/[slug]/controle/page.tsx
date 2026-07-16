import { ShieldOff } from "lucide-react";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { vereisClubToegang } from "@/lib/adminAuth";
import { ControlePaneel } from "@/components/admin/ControlePaneel";

export default async function AdminControlePage({ params }: { params: Promise<{ slug: string }> }) {
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

  const { data: bonnetjesRaw } = await service
    .from("bonnetjes")
    .select("id, foto_url, bedrag_euro, punten, flag_reden, created_at, teams!inner(team_naam, club_id)")
    .eq("status", "in_afwachting_controle")
    .eq("teams.club_id", club.id)
    .order("created_at", { ascending: true });

  // Zonder gegenereerde Database-types typeert supabase-js embedded
  // many-to-one relaties (bonnetjes -> teams) als array; op runtime is
  // het gewoon een object, dus hier expliciet als `any` behandeld.
  const teVerifierenBonnetjes = ((bonnetjesRaw ?? []) as any[]).map((b) => ({
    id: b.id as string,
    foto_url: b.foto_url as string,
    bedrag_euro: b.bedrag_euro as number,
    punten: b.punten as number,
    flag_reden: (b.flag_reden as string | null) ?? null,
    created_at: b.created_at as string,
    team_naam: b.teams.team_naam as string,
  }));

  return <ControlePaneel initialBonnetjes={teVerifierenBonnetjes} />;
}
