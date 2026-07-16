import { createClient } from "@/lib/supabase/server";
import { DonorHome } from "@/components/donor/DonorHome";
import type { Club, Doel } from "@/lib/types";

export default async function DonerenPage({
  searchParams,
}: {
  searchParams: Promise<{ postcode?: string }>;
}) {
  const { postcode } = await searchParams;
  const supabase = await createClient();
  const { data: clubs } = await supabase
    .from("clubs")
    .select("*")
    .eq("is_actief", true)
    .order("naam");

  const clubIds = (clubs ?? []).map((c: { id: string }) => c.id);
  const { data: doelen } = await supabase
    .from("doelen")
    .select("*")
    .in("club_id", clubIds.length > 0 ? clubIds : ["00000000-0000-0000-0000-000000000000"])
    .eq("is_actief", true);

  const doelenPerClub: Record<string, Doel[]> = {};
  for (const doel of (doelen as Doel[]) ?? []) {
    (doelenPerClub[doel.club_id] ??= []).push(doel);
  }

  return (
    <DonorHome
      initialClubs={(clubs as Club[]) ?? []}
      doelenPerClub={doelenPerClub}
      initialPostcode={postcode ?? ""}
    />
  );
}
