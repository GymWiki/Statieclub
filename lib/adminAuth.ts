import { redirect, notFound } from "next/navigation";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import type { Club } from "@/lib/types";

/**
 * Gedeelde toegangscheck voor alle /admin/[slug]/*-routes: gebruiker
 * moet ingelogd zijn en als beheerder gekoppeld staan aan deze club
 * (club_admins). Elke pagina roept dit zelf aan (i.p.v. te vertrouwen
 * op de layout) omdat Next.js een page altijd rendert ongeacht wat de
 * layout met `children` doet — dit blijft zo de daadwerkelijke poort.
 */
export async function vereisClubToegang(slug: string): Promise<{ userId: string; club: Club; heeftToegang: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const service = createServiceRoleClient();
  const { data: club } = await service.from("clubs").select("*").eq("slug", slug).single<Club>();
  if (!club) notFound();

  const { data: adminRij } = await supabase
    .from("club_admins")
    .select("id")
    .eq("club_id", club.id)
    .eq("user_id", user.id)
    .maybeSingle();

  return { userId: user.id, club, heeftToegang: !!adminRij };
}
