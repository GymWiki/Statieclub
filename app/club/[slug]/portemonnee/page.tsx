import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Portemonnee } from "@/components/team/Portemonnee";
import type { Doel } from "@/lib/types";

export default async function PortemonneePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: club } = await supabase.from("clubs").select("id").eq("slug", slug).single();

  const { data: doelen } = club
    ? await supabase.from("doelen").select("*").eq("club_id", club.id).eq("is_actief", true).order("created_at")
    : { data: [] };

  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      }
    >
      <Portemonnee doelen={(doelen as Doel[]) ?? []} />
    </Suspense>
  );
}
