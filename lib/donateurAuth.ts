import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Donateur } from "@/lib/types";

/**
 * Gedeelde toegangscheck voor /aanbieder/* — mirror van
 * lib/adminAuth.ts#vereisClubToegang, maar dan voor het optionele
 * donateur-account (Punt 6). Roept bij elk bezoek de RPC
 * `koppel_donateur_account()` aan (migratie 0020): die koppelt (of
 * maakt) de `donateurs`-rij van de ingelogde gebruiker op basis van
 * diens eigen, geverifieerde e-mailadres — idempotent, dus ook prima
 * om op elke pageload opnieuw te doen. Zo hoeft de login/registratie-
 * pagina zelf geen aparte koppel-stap te doen.
 */
export async function vereisDonateurToegang(): Promise<{ userId: string; donateur: Donateur }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/aanbieder/login");

  const { data: donateur, error } = await supabase.rpc("koppel_donateur_account").single();

  if (error || !donateur) redirect("/aanbieder/login");

  return { userId: user.id, donateur: donateur as Donateur };
}
