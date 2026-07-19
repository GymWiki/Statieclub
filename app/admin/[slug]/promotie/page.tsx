import { ShieldOff } from "lucide-react";
import { vereisClubToegang } from "@/lib/adminAuth";
import { PromotieOverzicht } from "@/components/admin/promotie/PromotieOverzicht";

export default async function AdminPromotiePage({ params }: { params: Promise<{ slug: string }> }) {
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

  return <PromotieOverzicht club={{ naam: club.naam, slug: club.slug, regio: club.regio }} />;
}
