import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Prikbord } from "@/components/team/Prikbord";
import type { Club } from "@/lib/types";

export default async function PrikbordPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: club } = await supabase.from("clubs").select("id, naam").eq("slug", slug).single<Pick<Club, "id" | "naam">>();
  if (!club) notFound();

  return <Prikbord clubId={club.id} clubSlug={slug} clubNaam={club.naam} />;
}
