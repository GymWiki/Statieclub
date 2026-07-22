import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TeamProvider } from "@/components/team/TeamContext";
import { ClubShell } from "@/components/team/ClubShell";
import type { Club, Team } from "@/lib/types";

// Geldt voor alle geneste /club/[slug]/*-routes (scorebord, prikbord,
// portemonnee, profiel, chat, upload): teamweergaven zonder eigen
// account, geen zoekwaarde en deels persoonsgebonden — noindex i.p.v.
// per pagina te herhalen.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

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
