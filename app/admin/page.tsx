import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldOff } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";

export default async function AdminIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: koppelingen } = await supabase
    .from("club_admins")
    .select("rol, clubs(naam, slug)")
    .eq("user_id", user.id);

  const clubs = (koppelingen ?? []) as unknown as { rol: string; clubs: { naam: string; slug: string } }[];

  if (clubs.length === 1) {
    redirect(`/admin/${clubs[0].clubs.slug}`);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-xl font-bold text-gray-900">Kies een club</h1>

      {clubs.length === 0 && (
        <Card className="mt-6 flex flex-col items-center gap-2 p-8 text-center text-gray-600">
          <ShieldOff className="h-8 w-8 text-gray-400" />
          <p>Je account ({user.email}) heeft nog geen penningmeester-toegang tot een club.</p>
          <p className="text-sm text-gray-400">Vraag een bestuurslid om je toe te voegen aan `club_admins`.</p>
        </Card>
      )}

      <div className="mt-6 space-y-2">
        {clubs.map(({ clubs: club, rol }) => (
          <Link key={club.slug} href={`/admin/${club.slug}`}>
            <Card className="flex items-center justify-between p-4 hover:border-brand-400">
              <span className="font-medium text-gray-900">{club.naam}</span>
              <span className="text-xs uppercase tracking-wide text-gray-400">{rol}</span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
