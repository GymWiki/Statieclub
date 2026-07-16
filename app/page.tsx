import { createClient } from "@/lib/supabase/server";
import { DonorHome } from "@/components/donor/DonorHome";
import type { Club } from "@/lib/types";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: clubs } = await supabase
    .from("clubs")
    .select("*")
    .eq("is_actief", true)
    .order("naam");

  return <DonorHome initialClubs={(clubs as Club[]) ?? []} />;
}
