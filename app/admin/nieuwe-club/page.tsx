import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { NieuweClubForm } from "@/components/admin/NieuweClubForm";

export default async function NieuweClubPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <Link href="/admin" className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" /> Mijn clubs
      </Link>

      <h1 className="text-xl font-bold text-gray-900">Nieuwe club aanmaken</h1>
      <p className="mt-1 text-sm text-gray-500">
        Je wordt automatisch beheerder van de club die je hier aanmaakt.
      </p>

      <div className="mt-6">
        <NieuweClubForm />
      </div>
    </div>
  );
}
