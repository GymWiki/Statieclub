import Link from "next/link";
import { ShieldOff, Users } from "lucide-react";
import { vereisClubToegang } from "@/lib/adminAuth";
import { AdminTabs } from "@/components/admin/AdminTabs";

export default async function AdminClubLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { club, heeftToegang } = await vereisClubToegang(slug);

  if (!heeftToegang) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-2 px-4 py-16 text-center text-gray-600">
        <ShieldOff className="h-10 w-10 text-gray-400" />
        <p>Je account heeft geen beheerderstoegang tot {club.naam}.</p>
        <Link href="/admin" className="text-sm font-semibold text-brand-700 hover:underline">
          Naar mijn clubs
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between px-4 pt-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Clubbeheer</h1>
          <p className="text-sm text-gray-500">{club.naam}</p>
        </div>
        <Link
          href="/admin"
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100"
        >
          <Users className="h-3.5 w-3.5" /> Mijn clubs
        </Link>
      </div>

      <div className="mt-4">
        <AdminTabs slug={slug} />
      </div>

      <div className="space-y-4 p-4">{children}</div>
    </div>
  );
}
