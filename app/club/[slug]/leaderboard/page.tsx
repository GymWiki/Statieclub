import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Leaderboard } from "@/components/team/Leaderboard";
import type { Club, Team } from "@/lib/types";

export default async function LeaderboardPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: club } = await supabase.from("clubs").select("id").eq("slug", slug).single<Pick<Club, "id">>();
  if (!club) notFound();

  const { data: teams } = await supabase.from("teams").select("*").eq("club_id", club.id);

  return <Leaderboard clubId={club.id} initialTeams={(teams as Team[]) ?? []} />;
}
