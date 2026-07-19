import { ShieldOff } from "lucide-react";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { vereisClubToegang } from "@/lib/adminAuth";
import { FacturatieOverzicht } from "@/components/admin/FacturatieOverzicht";

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

  const { data: teams } = await service.from("teams").select("id").eq("club_id", club.id);
  const teamIds = (teams ?? []).map((team) => team.id as string);

  // Alleen 'glas_naar_kas'-bonnetjes zijn ooit als échte Stripe-betaling
  // binnengekomen — statiegeld-scans stromen nooit door het platform,
  // dus die tellen hier bewust niet mee (zie migratie 0015).
  let totaalOpgehaald = 0;
  if (teamIds.length > 0) {
    const { data: bonnetjes } = await service
      .from("bonnetjes")
      .select("bedrag_euro")
      .in("team_id", teamIds)
      .eq("status", "goedgekeurd")
      .eq("bron", "glas_naar_kas");

    totaalOpgehaald = (bonnetjes ?? []).reduce((som, b) => som + Number(b.bedrag_euro), 0);
  }

  return <FacturatieOverzicht club={club} totaalOpgehaald={totaalOpgehaald} />;
}
