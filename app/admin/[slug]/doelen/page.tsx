import { ShieldOff } from "lucide-react";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { vereisClubToegang } from "@/lib/adminAuth";
import { DoelenBeheer } from "@/components/admin/DoelenBeheer";
import type { Doel } from "@/lib/types";

export default async function AdminDoelenPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { club, heeftToegang } = await vereisClubToegang(slug);

  if (!heeftToegang) {
    return (
      <div className="flex flex-col items-center gap-2 py-16 text-center text-gray-600">
        <ShieldOff className="h-10 w-10 text-gray-400" />
        <p>Je account heeft geen beheerderstoegang tot {club.naam}.</p>
      </div>
    );
  }

  const service = createServiceRoleClient();
  const { data: doelen } = await service
    .from("doelen")
    .select("*")
    .eq("club_id", club.id)
    .order("created_at", { ascending: true });

  return <DoelenBeheer clubSlug={club.slug} initialDoelen={(doelen as Doel[]) ?? []} />;
}
