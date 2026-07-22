import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { NieuweClubForm } from "@/components/admin/NieuweClubForm";
import { JoinClubForm } from "@/components/admin/JoinClubForm";

export default async function AdminIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: koppelingen } = await supabase
    .from("club_admins")
    .select("clubs(naam, slug)")
    .eq("user_id", user.id);

  const clubs = (koppelingen ?? []).map((k) => (k as unknown as { clubs: { naam: string; slug: string } }).clubs);

  if (clubs.length === 1) {
    redirect(`/admin/${clubs[0].slug}`);
  }

  if (clubs.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10">
        <h1 className="text-xl font-bold text-gray-900">Welkom!</h1>
        <p className="mt-1 text-sm text-gray-500">
          Je hebt nog geen club om te beheren. Sluit je aan bij een bestaande club, of maak er zelf
          één aan.
        </p>

        <div className="mt-6 space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-gray-700">Bestaande club selecteren</h2>
            <div className="mt-2">
              <JoinClubForm />
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-gray-400">
            <div className="h-px flex-1 bg-gray-200" />
            of
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-gray-700">Nieuwe club toevoegen</h2>
            <div className="mt-2">
              <NieuweClubForm />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Mijn clubs</h1>
        <Link href="/admin/nieuwe-club" className="flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
          <PlusCircle className="h-4 w-4" /> Nieuwe club
        </Link>
      </div>

      <div className="mt-6 space-y-2">
        {clubs.map((club) => (
          <Link key={club.slug} href={`/admin/${club.slug}`}>
            <Card className="flex items-center justify-between p-4 hover:border-brand-400">
              <span className="font-medium text-gray-900">{club.naam}</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
