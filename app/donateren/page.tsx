import { createClient } from "@/lib/supabase/server";
import { DonorHome } from "@/components/donor/DonorHome";
import type { Club } from "@/lib/types";

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

  return <DonorHome initialClubs={(clubs as Club[]) ?? []} initialPostcode={postcode ?? ""} />;
}
