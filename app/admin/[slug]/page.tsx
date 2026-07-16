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
    .select("id, foto_url, bedrag_euro, punten, created_at, teams!inner(team_naam, club_id)")
    .eq("status", "ingeleverd")
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
    created_at: b.created_at as string,
    team_naam: b.teams.team_naam as string,
  }));

  return (
    <PenningmeesterPaneel
      club={club}
      teams={(teams as Team[]) ?? []}
      initialBonnetjes={teVerifierenBonnetjes}
    />
  );
}
