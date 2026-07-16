import { redirect, notFound } from "next/navigation";
import { ShieldOff } from "lucide-react";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { PenningmeesterPaneel } from "@/components/admin/PenningmeesterPaneel";
import type { Club, Team } from "@/lib/types";

export default async function AdminClubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: club } = await supabase.from("clubs").select("*").eq("slug", slug).single<Club>();
  if (!club) notFound();

  const { data: adminRij } = await supabase
    .from("club_admins")
    .select("id")
    .eq("club_id", club.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminRij) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-2 px-4 py-16 text-center text-gray-600">
        <ShieldOff className="h-10 w-10 text-gray-400" />
        <p>Je account heeft geen penningmeester-toegang tot {club.naam}.</p>
      </div>
    );
  }

  const service = createServiceRoleClient();

  const { data: teams } = await service.from("teams").select("*").eq("club_id", club.id);

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

  const { data: facturen } = await service
    .from("facturen")
    .select("*")
    .eq("club_id", club.id)
    .order("periode_eind", { ascending: false });

  const laatsteFactuur = facturen?.[0];
  const periodeStart = laatsteFactuur?.periode_eind ?? club.created_at;

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
    <PenningmeesterPaneel
      club={club}
      teams={(teams as Team[]) ?? []}
      initialBonnetjes={teVerifierenBonnetjes}
      initialFacturen={facturen ?? []}
      huidigePeriode={{ periodeStart, totaal: huidigePeriodeTotaal }}
    />
  );
}
