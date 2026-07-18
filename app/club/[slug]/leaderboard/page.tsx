import { notFound } from "next/navigation";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { Leaderboard, type KlapperVanDeWeek } from "@/components/team/Leaderboard";
import type { Club, Doel, Speler, Team } from "@/lib/types";

export default async function LeaderboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: club } = await supabase.from("clubs").select("id").eq("slug", slug).single<Pick<Club, "id">>();
  if (!club) notFound();

  const { data: teams } = await supabase.from("teams").select("*").eq("club_id", club.id);

  const { data: doelen } = await supabase
    .from("doelen")
    .select("*")
    .eq("club_id", club.id)
    .eq("is_actief", true)
    .order("created_at", { ascending: true });

  const { data: topSpelers } = await supabase
    .from("spelers")
    .select("*")
    .eq("club_id", club.id)
    .order("totaal_opgehaald_euro", { ascending: false })
    .limit(5);

  // "Klapper van de week": het hoogste enkele bonnetje van de afgelopen
  // 7 dagen. bonnetjes heeft geen publieke RLS-policy (privacygevoelig),
  // dus dit wordt server-side met de service-role opgehaald — de client
  // krijgt alleen het geaggregeerde resultaat te zien, geen ruwe rijen.
  const service = createServiceRoleClient();
  const teamIds = ((teams as Team[]) ?? []).map((t) => t.id);
  const zevenDagenGeleden = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  let klapperVanDeWeek: KlapperVanDeWeek | null = null;
  if (teamIds.length > 0) {
    const { data: klapper } = await service
      .from("bonnetjes")
      .select("bedrag_euro, spelers(naam, avatar_emoji)")
      .eq("status", "goedgekeurd")
      .not("speler_id", "is", null)
      .in("team_id", teamIds)
      .gte("created_at", zevenDagenGeleden)
      .order("bedrag_euro", { ascending: false })
      .limit(1)
      .maybeSingle();

    const speler = (klapper as unknown as { bedrag_euro: number; spelers: { naam: string; avatar_emoji: string } } | null)
      ?.spelers;
    if (klapper && speler) {
      klapperVanDeWeek = { naam: speler.naam, avatar_emoji: speler.avatar_emoji, bedrag_euro: klapper.bedrag_euro };
    }
  }

  return (
    <Leaderboard
      clubId={club.id}
      initialTeams={(teams as Team[]) ?? []}
      initialDoelen={(doelen as Doel[]) ?? []}
      initialTopSpelers={(topSpelers as Speler[]) ?? []}
      klapperVanDeWeek={klapperVanDeWeek}
    />
  );
}
