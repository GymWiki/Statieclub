import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TeamProvider } from "@/components/team/TeamContext";
import { ClubShell } from "@/components/team/ClubShell";
import type { Club, Team } from "@/lib/types";

export default async function ClubMobileLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: club } = await supabase
    .from("clubs")
    .select("*")
    .eq("slug", slug)
    .single<Club>();

  if (!club) notFound();

  const { data: teams } = await supabase
    .from("teams")
    .select("*")
    .eq("club_id", club.id)
    .order("team_naam");

  return (
    <TeamProvider clubSlug={slug} clubId={club.id} teams={(teams as Team[]) ?? []}>
      <ClubShell clubSlug={slug} clubNaam={club.naam}>
        {children}
      </ClubShell>
    </TeamProvider>
  );
}
